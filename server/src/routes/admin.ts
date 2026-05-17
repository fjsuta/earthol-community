import express from 'express';
import pool from '../config/database';

const router = express.Router();

// 简单的权限检查中间件
const requireAdmin = (req: any, res: any, next: any) => {
  // 这里应该检查req.user.role，但在实际项目中应该使用JWT验证
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  next();
};

// ========================================
// 用户管理
// ========================================

// 获取用户列表
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, keyword } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT u.id, u.username, u.email, u.avatar, u.role, u.level, u.status,
             u.region_name, u.post_count, u.comment_count, u.created_at,
             u.last_active_at
      FROM users u
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    if (status) {
      query += ' AND u.status = ?';
      params.push(status);
    }
    if (keyword) {
      query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await pool.execute(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams: any[] = [];
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (keyword) {
      countQuery += ' AND (username LIKE ? OR email LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    const [countResult] = await pool.execute(countQuery, countParams);

    res.json({
      success: true,
      data: {
        users: rows,
        total: (countResult as any[])[0].total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// 更新用户角色
router.put('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['newbie', 'senior', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: '无效的角色' });
    }

    await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (action, target_type, target_id, target_name) VALUES (?, ?, ?, ?)',
      ['update_role', 'user', id, `角色变更为${role}`]
    );

    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, message: '更新角色失败' });
  }
});

// 封禁/解封用户
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'banned', 'restricted'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的状态' });
    }

    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [status, id]);

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (action, target_type, target_id, target_name) VALUES (?, ?, ?, ?)',
      ['update_status', 'user', id, `状态变更为${status}`]
    );

    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: '更新状态失败' });
  }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 获取用户信息（用于日志）
    const [userRows] = await pool.execute('SELECT username FROM users WHERE id = ?', [id]);
    const username = (userRows as any[])[0]?.username || '未知用户';

    // 软删除用户（保留数据但标记为已删除）
    await pool.execute('UPDATE users SET status = "deleted", deleted_at = NOW() WHERE id = ?', [id]);

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (action, target_type, target_id, target_name) VALUES (?, ?, ?, ?)',
      ['delete_user', 'user', id, username]
    );

    res.json({ success: true, message: '用户已删除' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: '删除用户失败' });
  }
});

// ========================================
// 板块管理
// ========================================

// 获取板块列表（管理后台）
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM forum_categories ORDER BY sort_order'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '获取板块列表失败' });
  }
});

// 创建板块
router.post('/categories', async (req, res) => {
  try {
    const { name, description, icon, color, type, sortOrder, viewPermission, postPermission, minLevel, requireReview } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: '板块名称不能为空' });
    }

    const [result] = await pool.execute(`
      INSERT INTO forum_categories 
      (name, description, icon, color, type, sort_order, view_permission, post_permission, min_level, require_review)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, icon, color || '#00d4ff', type || 'topic', sortOrder || 0, viewPermission || 'all', postPermission || 'member', minLevel || 1, requireReview || false]);

    res.json({ success: true, data: { id: (result as any).insertId }, message: '板块创建成功' });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: '创建板块失败' });
  }
});

// 更新板块
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, sortOrder, viewPermission, postPermission, minLevel, requireReview, isActive } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (sortOrder !== undefined) { updates.push('sort_order = ?'); values.push(sortOrder); }
    if (viewPermission) { updates.push('view_permission = ?'); values.push(viewPermission); }
    if (postPermission) { updates.push('post_permission = ?'); values.push(postPermission); }
    if (minLevel !== undefined) { updates.push('min_level = ?'); values.push(minLevel); }
    if (requireReview !== undefined) { updates.push('require_review = ?'); values.push(requireReview); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive); }

    if (updates.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE forum_categories SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ success: true, message: '板块更新成功' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: '更新板块失败' });
  }
});

// ========================================
// 帖子管理
// ========================================

// 获取待审核帖子
router.get('/posts/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.execute(`
      SELECT p.*, u.username, u.avatar,
             c.name as category_name
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      JOIN forum_categories c ON p.category_id = c.id
      WHERE p.review_status = 'pending'
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get pending posts error:', error);
    res.status(500).json({ success: false, message: '获取待审核帖子失败' });
  }
});

// 审核帖子
router.put('/posts/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: '无效的审核状态' });
    }

    await pool.execute(`
      UPDATE forum_posts 
      SET review_status = ?, review_note = ?, reviewed_at = NOW()
      WHERE id = ?
    `, [status, note || null, id]);

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (action, target_type, target_id) VALUES (?, ?, ?)',
      [`post_${status}`, 'post', id]
    );

    res.json({ success: true, message: `帖子已${status === 'approved' ? '通过' : '拒绝'}` });
  } catch (error) {
    console.error('Review post error:', error);
    res.status(500).json({ success: false, message: '审核帖子失败' });
  }
});

// 置顶/取消置顶帖子
router.put('/posts/:id/pin', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPinned } = req.body;

    await pool.execute('UPDATE forum_posts SET is_pinned = ? WHERE id = ?', [isPinned, id]);

    res.json({ success: true, message: isPinned ? '已置顶' : '已取消置顶' });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 设置精华帖子
router.put('/posts/:id/essence', async (req, res) => {
  try {
    const { id } = req.params;
    const { isEssence } = req.body;

    await pool.execute('UPDATE forum_posts SET is_essence = ? WHERE id = ?', [isEssence, id]);

    res.json({ success: true, message: isEssence ? '已设为精华' : '已取消精华' });
  } catch (error) {
    console.error('Set essence error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 删除帖子
router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('UPDATE forum_posts SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?', [id]);

    res.json({ success: true, message: '帖子已删除' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, message: '删除帖子失败' });
  }
});

// ========================================
// 公告管理
// ========================================

// 获取公告列表
router.get('/announcements', async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT a.*, u.username as creator_name
      FROM announcements a
      JOIN users u ON a.created_by = u.id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.is_pinned DESC, a.created_at DESC';

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: '获取公告列表失败' });
  }
});

// 创建公告
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, level, regionId, isPinned, isPopup, startTime, endTime, createdBy } = req.body;

    if (!title || !content || !createdBy) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const [result] = await pool.execute(`
      INSERT INTO announcements 
      (title, content, type, level, region_id, is_pinned, is_popup, start_time, end_time, status, created_by, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, NOW())
    `, [title, content, type || 'normal', level || 'global', regionId || null, isPinned || false, isPopup || false, startTime || null, endTime || null, createdBy]);

    res.json({ success: true, data: { id: (result as any).insertId }, message: '公告发布成功' });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: '发布公告失败' });
  }
});

// 删除公告
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('UPDATE announcements SET status = ? WHERE id = ?', ['archived', id]);

    res.json({ success: true, message: '公告已归档' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: '删除公告失败' });
  }
});

// ========================================
// 数据统计
// ========================================

// 获取系统统计
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const [postCount] = await pool.execute('SELECT COUNT(*) as count FROM forum_posts WHERE is_deleted = FALSE');
    const [commentCount] = await pool.execute('SELECT COUNT(*) as count FROM forum_comments WHERE is_deleted = FALSE');
    const [todayPosts] = await pool.execute('SELECT COUNT(*) as count FROM forum_posts WHERE DATE(created_at) = CURDATE()');
    const [pendingPosts] = await pool.execute('SELECT COUNT(*) as count FROM forum_posts WHERE review_status = "pending"');
    const [onlineCount] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE is_online = TRUE');

    res.json({
      success: true,
      data: {
        userCount: (userCount as any[])[0].count,
        postCount: (postCount as any[])[0].count,
        commentCount: (commentCount as any[])[0].count,
        todayPosts: (todayPosts as any[])[0].count,
        pendingPosts: (pendingPosts as any[])[0].count,
        onlineCount: (onlineCount as any[])[0].count
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
});

// ========================================
// 操作日志
// ========================================

// 获取操作日志
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM operation_logs WHERE 1=1';
    const params: any[] = [];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, message: '获取日志失败' });
  }
});

// ========================================
// 敏感词管理
// ========================================

// 获取敏感词列表
router.get('/sensitive-words', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM sensitive_words ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get sensitive words error:', error);
    res.status(500).json({ success: false, message: '获取敏感词失败' });
  }
});

// 添加敏感词
router.post('/sensitive-words', async (req, res) => {
  try {
    const { word, level, replacement } = req.body;

    if (!word) {
      return res.status(400).json({ success: false, message: '敏感词不能为空' });
    }

    const [result] = await pool.execute(
      'INSERT INTO sensitive_words (word, level, replacement) VALUES (?, ?, ?)',
      [word, level || 'medium', replacement || '***']
    );

    res.json({ success: true, data: { id: (result as any).insertId }, message: '敏感词添加成功' });
  } catch (error) {
    console.error('Add sensitive word error:', error);
    res.status(500).json({ success: false, message: '添加敏感词失败' });
  }
});

// 删除敏感词
router.delete('/sensitive-words/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM sensitive_words WHERE id = ?', [id]);

    res.json({ success: true, message: '敏感词已删除' });
  } catch (error) {
    console.error('Delete sensitive word error:', error);
    res.status(500).json({ success: false, message: '删除敏感词失败' });
  }
});

export default router;
