import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import emailService from '../services/emailService';
import oauthService from '../services/oauthService';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'earthol-secret-key-2024';

// 发送验证码
router.post('/send-code', async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ success: false, message: '缺少参数' });
    }

    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);

    // 发送邮件
    const result = await emailService.sendVerificationCode(email, code, type);
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message });
    }

    // 保存验证码
    await emailService.saveVerificationCode(email, code, type);

    res.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('Send code error:', error);
    res.status(500).json({ success: false, message: '发送验证码失败' });
  }
});

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, code, regionId, regionName } = req.body;

    // 参数验证
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、邮箱和密码不能为空' 
      });
    }

    // 如果开启了邮箱验证
    const [emailConfig] = await pool.execute(
      'SELECT config_value FROM system_configs WHERE config_key = ?',
      ['email_verification_required']
    );
    const requireEmailVerify = (emailConfig as any[])[0]?.config_value === 'true';

    if (requireEmailVerify) {
      if (!code) {
        return res.status(400).json({ 
          success: false, 
          message: '请输入验证码' 
        });
      }

      // 验证验证码
      const isValid = await emailService.verifyCode(email, code, 'register');
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: '验证码错误或已过期' 
        });
      }
    }

    // 检查用户名和邮箱是否存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名或邮箱已存在' 
      });
    }

    // 密码强度验证
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '密码长度至少6位' 
      });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, region_id, region_name, role, level, is_email_verified) 
       VALUES (?, ?, ?, ?, ?, 'newbie', 1, ?)`,
      [username, email, passwordHash, regionId || null, regionName || '萌新试炼区', requireEmailVerify]
    );

    const userId = (result as any).insertId;

    // 创建用户积分记录
    await pool.execute(
      'INSERT INTO user_scores (user_id) VALUES (?)',
      [userId]
    );

    // 创建默认收藏夹
    await pool.execute(
      'INSERT INTO collection_folders (user_id, name, is_default) VALUES (?, "默认收藏", TRUE)',
      [userId]
    );

    // 生成Token
    const token = jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          role: 'newbie',
          level: 1,
          regionId,
          regionName: regionName || '萌新试炼区'
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password, code } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '邮箱和密码不能为空' 
      });
    }

    // 查找用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((users as any[]).length === 0) {
      // 记录登录失败
      await pool.execute(
        'INSERT INTO login_logs (username, login_type, ip_address, status, fail_reason) VALUES (?, ?, ?, ?, ?)',
        [email, 'password', req.ip, 'failed', '用户不存在']
      );
      
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const user = (users as any[])[0];

    // 检查账号状态
    if (user.status === 'deleted') {
      return res.status(403).json({ 
        success: false, 
        message: '账号已删除' 
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被封禁' 
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      // 记录登录失败
      await pool.execute(
        'INSERT INTO login_logs (user_id, username, login_type, ip_address, status, fail_reason) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, email, 'password', req.ip, 'failed', '密码错误']
      );
      
      return res.status(401).json({ 
        success: false, 
        message: '密码错误' 
      });
    }

    // 更新在线状态
    await pool.execute(
      'UPDATE users SET is_online = TRUE, last_active_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 记录登录成功
    await pool.execute(
      'INSERT INTO login_logs (user_id, username, login_type, ip_address, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, email, 'password', req.ip, 'success']
    );

    // 生成Token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          level: user.level,
          bio: user.bio,
          regionId: user.region_id,
          regionName: user.region_name,
          playStyle: user.play_style,
          interests: user.interests,
          postCount: user.post_count,
          commentCount: user.comment_count,
          likeCount: user.like_count,
          createdAt: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

// 忘记密码
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '邮箱不能为空' });
    }

    // 查找用户
    const [users] = await pool.execute(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );

    if ((users as any[]).length === 0) {
      // 为了安全，即使用户不存在也返回成功
      return res.json({ success: true, message: '如果邮箱存在，验证码已发送' });
    }

    const user = (users as any[])[0];

    // 生成验证码
    const code = Math.random().toString().slice(2, 8);

    // 发送邮件
    const result = await emailService.sendVerificationCode(email, code, 'reset_password');
    if (!result.success) {
      return res.status(500).json({ success: false, message: result.message });
    }

    // 保存验证码
    await emailService.saveVerificationCode(email, code, 'reset_password', user.id);

    res.json({ success: true, message: '验证码已发送' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: '处理失败' });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: '缺少参数' });
    }

    // 验证验证码
    const isValid = await emailService.verifyCode(email, code, 'reset_password');
    if (!isValid) {
      return res.status(400).json({ success: false, message: '验证码错误或已过期' });
    }

    // 查找用户
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const userId = (users as any[])[0].id;

    // 密码强度验证
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

// OAuth登录
router.post('/oauth/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '缺少授权码' });
    }

    // 交换Token
    const tokenData = await oauthService.exchangeCodeForToken(provider, code, redirectUri);
    if (!tokenData) {
      return res.status(500).json({ success: false, message: 'OAuth认证失败' });
    }

    // 获取用户信息
    const userInfo = await oauthService.getUserInfo(provider, tokenData.access_token);
    if (!userInfo) {
      return res.status(500).json({ success: false, message: '获取用户信息失败' });
    }

    // 查找或创建用户
    const result = await oauthService.findOrCreateUser(provider, userInfo.id, userInfo);
    if (!result) {
      return res.status(500).json({ success: false, message: '用户创建失败' });
    }

    // 获取用户完整信息
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [result.userId]
    );

    const user = (users as any[])[0];

    // 更新在线状态
    await pool.execute(
      'UPDATE users SET is_online = TRUE, last_active_at = NOW() WHERE id = ?',
      [user.id]
    );

    // 记录登录
    await pool.execute(
      'INSERT INTO login_logs (user_id, username, login_type, provider_code, ip_address, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.email, 'oauth', provider, req.ip, 'success']
    );

    // 生成Token
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      data: {
        token,
        isNewUser: result.isNewUser,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          level: user.level
        }
      }
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({ success: false, message: 'OAuth登录失败' });
  }
});

// 获取OAuth授权URL
router.get('/oauth/:provider/url', async (req, res) => {
  try {
    const { provider } = req.params;
    const redirectUri = req.query.redirect_uri as string;

    const authUrl = await oauthService.getAuthorizationUrl(provider, redirectUri);
    if (!authUrl) {
      return res.status(404).json({ success: false, message: 'OAuth服务未配置' });
    }

    res.json({ success: true, data: { url: authUrl } });
  } catch (error) {
    console.error('Get OAuth URL error:', error);
    res.status(500).json({ success: false, message: '获取授权URL失败' });
  }
});

// 获取用户OAuth绑定列表
router.get('/oauth/bindings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const bindings = await oauthService.getUserBindings(decoded.userId);
    res.json({ success: true, data: bindings });
  } catch (error) {
    res.status(401).json({ success: false, message: '认证失败' });
  }
});

// 解除OAuth绑定
router.delete('/oauth/:provider', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { provider } = req.params;
    const result = await oauthService.unbindOAuth(decoded.userId, provider);

    if (result) {
      res.json({ success: true, message: '已解除绑定' });
    } else {
      res.status(500).json({ success: false, message: '解除绑定失败' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: '认证失败' });
  }
});

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const [users] = await pool.execute(
      `SELECT u.*, r.name as region_name, r.icon as region_icon 
       FROM users u 
       LEFT JOIN regions r ON u.region_id = r.id 
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = (users as any[])[0];

    // 获取积分信息
    const [scores] = await pool.execute(
      'SELECT * FROM user_scores WHERE user_id = ?',
      [user.id]
    );

    // 获取OAuth绑定
    const oauthBindings = await oauthService.getUserBindings(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          role: user.role,
          level: user.level,
          experience: user.experience,
          regionId: user.region_id,
          regionName: user.region_name,
          regionIcon: user.region_icon,
          playStyle: user.play_style,
          interests: user.interests,
          status: user.status,
          isAdmin: user.is_admin,
          adminRoleId: user.admin_role_id,
          postCount: user.post_count,
          commentCount: user.comment_count,
          likeCount: user.like_count,
          isEmailVerified: user.is_email_verified,
          createdAt: user.created_at,
          scores: (scores as any[])[0] || null,
          oauthBindings
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ success: false, message: 'Token无效' });
  }
});

// 更新个人资料
router.put('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { username, avatar, bio, regionId, regionName, playStyle, interests } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
      updates.push('username = ?');
      values.push(username);
    }
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (regionId !== undefined) {
      updates.push('region_id = ?');
      values.push(regionId);
    }
    if (regionName) {
      updates.push('region_name = ?');
      values.push(regionName);
    }
    if (playStyle) {
      updates.push('play_style = ?');
      values.push(playStyle);
    }
    if (interests !== undefined) {
      updates.push('interests = ?');
      values.push(interests);
    }

    if (updates.length > 0) {
      values.push(decoded.userId);
      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    res.json({ success: true, message: '资料更新成功' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

// 获取用户公开信息
router.get('/user/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.avatar, u.bio, u.role, u.level, 
              u.region_name, u.play_style, u.interests,
              u.post_count, u.comment_count, u.like_count, u.created_at
       FROM users u WHERE u.id = ?`,
      [id]
    );

    if ((users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, data: (users as any[])[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

// 获取大区列表
router.get('/regions', async (req, res) => {
  try {
    const [regions] = await pool.execute(
      'SELECT * FROM regions WHERE is_active = TRUE ORDER BY sort_order'
    );

    res.json({ success: true, data: regions });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取大区列表失败' });
  }
});

// 修改密码
router.put('/password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: '旧密码和新密码不能为空' 
      });
    }

    // 验证旧密码
    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [decoded.userId]
    );

    const user = (users as any[])[0];
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        message: '旧密码错误' 
      });
    }

    // 密码强度验证
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: '密码长度至少6位' 
      });
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, decoded.userId]
    );

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
});

// 登出
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      await pool.execute(
        'UPDATE users SET is_online = FALSE WHERE id = ?',
        [decoded.userId]
      );
    }

    res.json({ success: true, message: '登出成功' });
  } catch (error) {
    res.json({ success: true, message: '登出成功' });
  }
});

// 检查邮箱是否可用
router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: '邮箱不能为空' });
    }

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    res.json({
      success: true,
      data: {
        available: (users as any[]).length === 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '检查失败' });
  }
});

// 检查用户名是否可用
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: '用户名不能为空' });
    }

    const [users] = await pool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    res.json({
      success: true,
      data: {
        available: (users as any[]).length === 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '检查失败' });
  }
});

export default router;
