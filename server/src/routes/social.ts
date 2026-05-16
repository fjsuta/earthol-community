import express from 'express';
import pool from '../config/database';

const router = express.Router();

// 获取好友列表
router.get('/friends', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const [rows] = await pool.execute(`
      SELECT f.*, 
             u.username, u.avatar, u.level, u.role, u.is_online, u.last_active_at,
             r.name as region_name
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id AND f.user_id = ?) OR (f.user_id = u.id AND f.friend_id = ?)
      JOIN users me ON me.id = ?
      WHERE f.status = 'accepted' AND f.user_id = ?
    `, [userId, userId, userId, userId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, message: '获取好友列表失败' });
  }
});

// 获取好友请求
router.get('/friend-requests', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    // 获取发送给我的请求
    const [sentRequests] = await pool.execute(`
      SELECT f.*, u.username, u.avatar, u.level
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `, [userId]);

    // 获取我发送的请求
    const [receivedRequests] = await pool.execute(`
      SELECT f.*, u.username, u.avatar, u.level
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
    `, [userId]);

    res.json({
      success: true,
      data: {
        received: sentRequests,
        sent: receivedRequests
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ success: false, message: '获取好友请求失败' });
  }
});

// 发送好友请求
router.post('/friend-request', async (req, res) => {
  try {
    const { userId, friendId, note } = req.body;

    if (!userId || !friendId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    if (userId === friendId) {
      return res.status(400).json({ success: false, message: '不能添加自己为好友' });
    }

    // 检查是否已经存在关系
    const [existing] = await pool.execute(`
      SELECT id, status FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    if ((existing as any[]).length > 0) {
      const relation = (existing as any[])[0];
      if (relation.status === 'accepted') {
        return res.status(400).json({ success: false, message: '已经是好友了' });
      }
      if (relation.status === 'pending') {
        return res.status(400).json({ success: false, message: '已发送过请求' });
      }
    }

    // 创建好友请求
    await pool.execute(
      'INSERT INTO friendships (user_id, friend_id, note, status) VALUES (?, ?, ?, ?)',
      [userId, friendId, note || null, 'pending']
    );

    res.json({ success: true, message: '好友请求已发送' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, message: '发送好友请求失败' });
  }
});

// 处理好友请求
router.put('/friend-request/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // accept, reject

    if (!action || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';

    await pool.execute(
      'UPDATE friendships SET status = ? WHERE id = ?',
      [newStatus, id]
    );

    res.json({ success: true, message: action === 'accept' ? '已同意好友请求' : '已拒绝好友请求' });
  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({ success: false, message: '处理好友请求失败' });
  }
});

// 删除好友
router.delete('/friend/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM friendships WHERE id = ?', [id]);

    res.json({ success: true, message: '已删除好友' });
  } catch (error) {
    console.error('Delete friend error:', error);
    res.status(500).json({ success: false, message: '删除好友失败' });
  }
});

// 获取私信列表
router.get('/messages', async (req, res) => {
  try {
    const { userId, friendId, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    let query = `
      SELECT m.*, 
             u.username as from_username, u.avatar as from_avatar,
             u2.username as to_username, u2.avatar as to_avatar
      FROM private_messages m
      JOIN users u ON m.from_user_id = u.id
      JOIN users u2 ON m.to_user_id = u2.id
      WHERE ((m.from_user_id = ? AND m.to_user_id = ?) OR (m.from_user_id = ? AND m.to_user_id = ?))
        AND m.is_deleted = FALSE
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `;

    let params: any[] = [userId, friendId, friendId, userId, Number(limit), offset];

    if (!friendId) {
      // 获取与所有好友的最新消息
      query = `
        SELECT m.*, 
               u.username as from_username, u.avatar as from_avatar,
               u2.username as to_username, u2.avatar as to_avatar,
               (SELECT COUNT(*) FROM private_messages WHERE from_user_id = m.to_user_id AND to_user_id = m.from_user_id AND is_read = FALSE) as unread_count
        FROM private_messages m
        JOIN users u ON m.from_user_id = u.id
        JOIN users u2 ON m.to_user_id = u2.id
        WHERE (m.from_user_id = ? OR m.to_user_id = ?) AND m.is_deleted = FALSE
          AND m.id IN (
            SELECT MAX(id) FROM private_messages
            WHERE from_user_id = ? OR to_user_id = ?
            GROUP BY IF(from_user_id = ?, to_user_id, from_user_id)
          )
        ORDER BY m.created_at DESC
      `;
      params = [userId, userId, userId, userId, userId];
    }

    const [rows] = await pool.execute(query, params);

    // 标记消息为已读
    if (friendId) {
      await pool.execute(`
        UPDATE private_messages 
        SET is_read = TRUE, read_at = NOW() 
        WHERE from_user_id = ? AND to_user_id = ? AND is_read = FALSE
      `, [friendId, userId]);
    }

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: '获取私信失败' });
  }
});

// 发送私信
router.post('/messages', async (req, res) => {
  try {
    const { fromUserId, toUserId, content, contentType, attachments } = req.body;

    if (!fromUserId || !toUserId || !content) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    const [result] = await pool.execute(`
      INSERT INTO private_messages (from_user_id, to_user_id, content, content_type, attachments)
      VALUES (?, ?, ?, ?, ?)
    `, [fromUserId, toUserId, content, contentType || 'text', attachments ? JSON.stringify(attachments) : null]);

    res.json({ success: true, data: { id: (result as any).insertId } });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: '发送私信失败' });
  }
});

// 获取未读私信数量
router.get('/messages/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM private_messages WHERE to_user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true, data: { count: (result as any[])[0].count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: '获取未读数失败' });
  }
});

// 撤回私信
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    // 只能撤回自己发送的消息，且在2分钟内
    await pool.execute(`
      UPDATE private_messages 
      SET is_recalled = TRUE 
      WHERE id = ? AND from_user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 2 MINUTE)
    `, [id, userId]);

    res.json({ success: true, message: '已撤回消息' });
  } catch (error) {
    console.error('Recall message error:', error);
    res.status(500).json({ success: false, message: '撤回消息失败' });
  }
});

// 获取全服公屏消息
router.get('/global-messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [rows] = await pool.execute(`
      SELECT m.*, u.username, u.avatar, u.level, u.role as user_role
      FROM global_chat_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.is_deleted = FALSE
      ORDER BY m.is_pinned DESC, m.created_at DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get global messages error:', error);
    res.status(500).json({ success: false, message: '获取公屏消息失败' });
  }
});

// 获取在线用户列表
router.get('/online-users', async (req, res) => {
  try {
    const { regionId } = req.query;

    let query = `
      SELECT u.id, u.username, u.avatar, u.level, u.role, u.region_name,
             r.icon as region_icon
      FROM users u
      LEFT JOIN regions r ON u.region_id = r.id
      WHERE u.is_online = TRUE
    `;
    const params: any[] = [];

    if (regionId) {
      query += ' AND u.region_id = ?';
      params.push(regionId);
    }

    query += ' ORDER BY u.last_active_at DESC LIMIT 100';

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ success: false, message: '获取在线用户失败' });
  }
});

// 搜索用户
router.get('/search-users', async (req, res) => {
  try {
    const { keyword, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!keyword) {
      return res.status(400).json({ success: false, message: '搜索关键词不能为空' });
    }

    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.avatar, u.level, u.role, u.region_name
      FROM users u
      WHERE u.username LIKE ? AND u.status = 'active'
      ORDER BY u.last_active_at DESC
      LIMIT ? OFFSET ?
    `, [`%${keyword}%`, Number(limit), offset]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: '搜索用户失败' });
  }
});

export default router;
