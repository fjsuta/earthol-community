import express from 'express';
import pool from '../config/database';

const router = express.Router();

// 获取用户设置
router.get('/settings', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );

    if ((rows as any[]).length === 0) {
      // 创建设置记录
      await pool.execute(
        'INSERT INTO user_settings (user_id) VALUES (?)',
        [userId]
      );
      return res.json({
        success: true,
        data: {
          theme: 'system',
          theme_color: '#00d4ff',
          language: 'zh-CN',
          notify_like: true,
          notify_comment: true,
          notify_follow: true,
          notify_message: true,
          notify_system: true,
          interaction_mode: 'text'
        }
      });
    }

    res.json({ success: true, data: (rows as any[])[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: '获取设置失败' });
  }
});

// 更新用户设置
router.put('/settings', async (req, res) => {
  try {
    const { 
      userId, 
      theme, 
      themeColor, 
      language,
      notifyLike,
      notifyComment,
      notifyFollow,
      notifyMessage,
      notifySystem,
      interactionMode,
      profilePublic,
      showOnlineStatus,
      allowStrangerMessage,
      homepageTab
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (theme !== undefined) { updates.push('theme = ?'); values.push(theme); }
    if (themeColor !== undefined) { updates.push('theme_color = ?'); values.push(themeColor); }
    if (language !== undefined) { updates.push('language = ?'); values.push(language); }
    if (notifyLike !== undefined) { updates.push('notify_like = ?'); values.push(notifyLike); }
    if (notifyComment !== undefined) { updates.push('notify_comment = ?'); values.push(notifyComment); }
    if (notifyFollow !== undefined) { updates.push('notify_follow = ?'); values.push(notifyFollow); }
    if (notifyMessage !== undefined) { updates.push('notify_message = ?'); values.push(notifyMessage); }
    if (notifySystem !== undefined) { updates.push('notify_system = ?'); values.push(notifySystem); }
    if (interactionMode !== undefined) { updates.push('interaction_mode = ?'); values.push(interactionMode); }
    if (profilePublic !== undefined) { updates.push('profile_public = ?'); values.push(profilePublic); }
    if (showOnlineStatus !== undefined) { updates.push('show_online_status = ?'); values.push(showOnlineStatus); }
    if (allowStrangerMessage !== undefined) { updates.push('allow_stranger_message = ?'); values.push(allowStrangerMessage); }
    if (homepageTab !== undefined) { updates.push('homepage_tab = ?'); values.push(homepageTab); }

    if (updates.length > 0) {
      values.push(userId);
      
      // 使用 INSERT ... ON DUPLICATE KEY UPDATE 模式
      const setClause = updates.map(u => u.replace('?', '?')).join(', ');
      await pool.execute(
        `INSERT INTO user_settings (user_id, ${updates.map(u => u.split(' = ')[0]).join(', ')}) 
         VALUES (?, ${updates.map(() => '?').join(', ')})
         ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
        [userId, ...values.slice(0, -1), userId, ...values]
      );
    }

    res.json({ success: true, message: '设置已保存' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: '保存设置失败' });
  }
});

// 获取通知列表
router.get('/notifications', async (req, res) => {
  try {
    const { userId, type, isRead, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    let query = 'SELECT * FROM notifications WHERE user_id = ? AND is_deleted = FALSE';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (isRead !== undefined) {
      query += ' AND is_read = ?';
      params.push(isRead === 'true');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await pool.execute(query, params);

    // 获取未读数量
    const [unreadCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE AND is_deleted = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications: rows,
        unreadCount: (unreadCount as any[])[0].count
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: '获取通知失败' });
  }
});

// 标记通知为已读
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 标记所有通知为已读
router.put('/notifications/read-all', async (req, res) => {
  try {
    const { userId } = req.body;

    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true, message: '已全部标记为已读' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 删除通知
router.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE notifications SET is_deleted = TRUE WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: '通知已删除' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

// 添加浏览历史
router.post('/history', async (req, res) => {
  try {
    const { userId, type, targetId, targetTitle, targetUrl, viewDuration } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 检查是否已存在相同浏览记录（1小时内同一目标只保留一条）
    const [existing] = await pool.execute(`
      SELECT id FROM browse_history 
      WHERE user_id = ? AND type = ? AND target_id = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [userId, type, targetId]);

    if ((existing as any[]).length > 0) {
      // 更新浏览时长
      await pool.execute(`
        UPDATE browse_history 
        SET view_duration = view_duration + ?,
            created_at = NOW()
        WHERE id = ?
      `, [viewDuration || 0, (existing as any[])[0].id]);
    } else {
      // 添加新记录
      await pool.execute(`
        INSERT INTO browse_history (user_id, type, target_id, target_title, target_url, view_duration)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, type, targetId, targetTitle || null, targetUrl || null, viewDuration || 0]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Add history error:', error);
    res.status(500).json({ success: false, message: '添加历史记录失败' });
  }
});

// 获取浏览历史
router.get('/history', async (req, res) => {
  try {
    const { userId, type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    let query = 'SELECT * FROM browse_history WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: '获取历史记录失败' });
  }
});

// 清空浏览历史
router.delete('/history', async (req, res) => {
  try {
    const { userId, type } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    let query = 'DELETE FROM browse_history WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    await pool.execute(query, params);

    res.json({ success: true, message: '历史记录已清空' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, message: '清空失败' });
  }
});

// 全局搜索
router.get('/search', async (req, res) => {
  try {
    const { keyword, type, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!keyword) {
      return res.status(400).json({ success: false, message: '搜索关键词不能为空' });
    }

    const results: any = {
      keyword,
      posts: [],
      users: [],
      categories: []
    };

    // 搜索帖子
    if (!type || type === 'posts') {
      const [posts] = await pool.execute(`
        SELECT p.id, p.title, p.content, p.view_count, p.like_count, p.comment_count,
               u.username as author_name, c.name as category_name, p.created_at
        FROM forum_posts p
        JOIN users u ON p.user_id = u.id
        JOIN forum_categories c ON p.category_id = c.id
        WHERE p.is_deleted = FALSE AND p.status = 'published'
          AND (p.title LIKE ? OR p.content LIKE ?)
        ORDER BY p.view_count DESC
        LIMIT ? OFFSET ?
      `, [`%${keyword}%`, `%${keyword}%`, Number(limit), offset]);
      results.posts = posts;
    }

    // 搜索用户
    if (!type || type === 'users') {
      const [users] = await pool.execute(`
        SELECT id, username, avatar, level, role, region_name, bio
        FROM users
        WHERE status = 'active' AND username LIKE ?
        ORDER BY last_active_at DESC
        LIMIT 10
      `, [`%${keyword}%`]);
      results.users = users;
    }

    // 搜索板块
    if (!type || type === 'categories') {
      const [categories] = await pool.execute(`
        SELECT id, name, description, icon, topic_count
        FROM forum_categories
        WHERE is_active = TRUE AND name LIKE ?
        ORDER BY topic_count DESC
        LIMIT 5
      `, [`%${keyword}%`]);
      results.categories = categories;
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: '搜索失败' });
  }
});

// 获取用户主页信息
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.avatar, u.bio, u.role, u.level, u.experience,
             u.region_name, u.play_style, u.interests,
             u.post_count, u.comment_count, u.like_count,
             u.created_at, u.last_active_at,
             r.icon as region_icon
      FROM users u
      LEFT JOIN regions r ON u.region_id = r.id
      WHERE u.id = ? AND u.status = 'active'
    `, [id]);

    if ((users as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const user = (users as any[])[0];

    // 获取用户帖子
    const [posts] = await pool.execute(`
      SELECT p.id, p.title, p.view_count, p.like_count, p.comment_count, p.created_at,
             c.name as category_name
      FROM forum_posts p
      JOIN forum_categories c ON p.category_id = c.id
      WHERE p.user_id = ? AND p.is_deleted = FALSE AND p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [id]);

    // 获取粉丝数
    const [followers] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE following_id = ? AND status = "active"',
      [id]
    );

    // 获取关注数
    const [following] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ? AND status = "active"',
      [id]
    );

    res.json({
      success: true,
      data: {
        user,
        posts,
        stats: {
          followers: (followers as any[])[0].count,
          following: (following as any[])[0].count
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: '获取用户主页失败' });
  }
});

// 关注用户
router.post('/follow', async (req, res) => {
  try {
    const { followerId, followingId } = req.body;

    if (!followerId || !followingId) {
      return res.status(400).json({ success: false, message: '缺少参数' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ success: false, message: '不能关注自己' });
    }

    // 检查是否已关注
    const [existing] = await pool.execute(
      'SELECT id, status FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    if ((existing as any[]).length > 0) {
      const follow = (existing as any[])[0];
      if (follow.status === 'active') {
        // 取消关注
        await pool.execute(
          'UPDATE follows SET status = "muted" WHERE id = ?',
          [follow.id]
        );
        return res.json({ success: true, action: 'unfollow' });
      } else {
        // 重新关注
        await pool.execute(
          'UPDATE follows SET status = "active" WHERE id = ?',
          [follow.id]
        );
        return res.json({ success: true, action: 'follow' });
      }
    }

    // 创建关注关系
    await pool.execute(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, followingId]
    );

    // 发送通知
    await pool.execute(
      'INSERT INTO notifications (user_id, type, title, related_type, related_id) VALUES (?, "follow", ?, "user", ?)',
      [followingId, '有人关注了你', followerId]
    );

    res.json({ success: true, action: 'follow' });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 获取关注列表
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.avatar, u.level, u.region_name, f.created_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ? AND f.status = 'active'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ success: false, message: '获取粉丝列表失败' });
  }
});

// 获取关注列表
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.avatar, u.level, u.region_name, f.created_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ? AND f.status = 'active'
      ORDER BY f.created_at DESC
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ success: false, message: '获取关注列表失败' });
  }
});

export default router;
