import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'earthol-secret-key-2024';

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, regionId, regionName } = req.body;

    // 参数验证
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '用户名、邮箱和密码不能为空' 
      });
    }

    // 检查用户名是否存在
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

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, region_id, region_name, role, level) 
       VALUES (?, ?, ?, ?, ?, 'newbie', 1)`,
      [username, email, passwordHash, regionId || null, regionName || '萌新试炼区']
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
    const { email, password } = req.body;

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
      return res.status(401).json({ 
        success: false, 
        message: '用户不存在' 
      });
    }

    const user = (users as any[])[0];

    // 检查账号状态
    if (user.status === 'banned') {
      return res.status(403).json({ 
        success: false, 
        message: '账号已被封禁' 
      });
    }

    // 验证密码
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
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
          postCount: user.post_count,
          commentCount: user.comment_count,
          likeCount: user.like_count,
          createdAt: user.created_at,
          scores: (scores as any[])[0] || null
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

export default router;
