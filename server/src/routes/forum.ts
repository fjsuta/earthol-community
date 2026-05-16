import express from 'express';
import pool from '../config/database';
import { sensitiveWordFilter } from '../middleware/contentFilter';

const router = express.Router();

// 获取板块列表（带权限控制）
router.get('/categories', async (req, res) => {
  try {
    const { type, regionId } = req.query;
    
    let query = 'SELECT * FROM forum_categories WHERE is_active = TRUE';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (regionId) {
      query += ' AND (region_id = ? OR region_id IS NULL)';
      params.push(regionId);
    }

    query += ' ORDER BY sort_order ASC';

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: '获取板块列表失败' });
  }
});

// 获取板块详情
router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT * FROM forum_categories WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '板块不存在' });
    }

    res.json({ success: true, data: (rows as any[])[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取板块详情失败' });
  }
});

// 获取帖子列表（增强版）
router.get('/posts', async (req, res) => {
  try {
    const { 
      categoryId, 
      userId, 
      page = 1, 
      limit = 20,
      sort = 'latest',
      keyword,
      isEssence
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const conditions: string[] = ['p.status = "published"', 'p.is_deleted = FALSE'];
    const params: any[] = [];

    if (categoryId) {
      conditions.push('p.category_id = ?');
      params.push(categoryId);
    }
    if (userId) {
      conditions.push('p.user_id = ?');
      params.push(userId);
    }
    if (keyword) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (isEssence === 'true') {
      conditions.push('p.is_essence = TRUE');
    }

    let orderBy = 'p.is_pinned DESC, p.created_at DESC';
    if (sort === 'hot') {
      orderBy = 'p.view_count DESC, p.like_count DESC';
    } else if (sort === 'essence') {
      orderBy = 'p.is_essence DESC, p.created_at DESC';
    }

    // 获取帖子
    const query = `
      SELECT p.*, 
             u.username, u.avatar, u.level, u.role as user_role,
             c.name as category_name, c.icon as category_icon, c.color as category_color,
             ${isEssence !== 'true' ? '(SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id AND is_deleted = FALSE) as comment_count' : 'p.comment_count'}
      FROM forum_posts p 
      JOIN users u ON p.user_id = u.id 
      JOIN forum_categories c ON p.category_id = c.id 
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    params.push(Number(limit), offset);
    const [rows] = await pool.execute(query, params);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM forum_posts p 
      WHERE ${conditions.join(' AND ')}
    `;
    const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

    res.json({
      success: true,
      data: {
        posts: rows,
        total: (countResult as any[])[0].total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, message: '获取帖子列表失败' });
  }
});

// 获取帖子详情
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(`
      SELECT p.*, 
             u.username, u.avatar, u.level, u.role as user_role, u.bio,
             c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM forum_posts p 
      JOIN users u ON p.user_id = u.id 
      JOIN forum_categories c ON p.category_id = c.id 
      WHERE p.id = ? AND p.is_deleted = FALSE
    `, [id]);

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '帖子不存在' });
    }

    // 增加浏览数
    await pool.execute(
      'UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: (rows as any[])[0] });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ success: false, message: '获取帖子详情失败' });
  }
});

// 发布帖子
router.post('/posts', async (req, res) => {
  try {
    const { userId, categoryId, title, content, contentType, images, attachments } = req.body;

    if (!userId || !categoryId || !title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '用户ID、板块ID、标题和内容不能为空' 
      });
    }

    // 敏感词过滤
    const filteredContent = sensitiveWordFilter(content);
    const filteredTitle = sensitiveWordFilter(title);

    // 检查板块是否需要审核
    const [categories] = await pool.execute(
      'SELECT require_review, post_permission, min_level FROM forum_categories WHERE id = ?',
      [categoryId]
    );

    if ((categories as any[]).length === 0) {
      return res.status(404).json({ success: false, message: '板块不存在' });
    }

    const category = (categories as any[])[0];
    const reviewStatus = category.require_review ? 'pending' : 'approved';

    // 创建帖子
    const [result] = await pool.execute(`
      INSERT INTO forum_posts 
      (user_id, category_id, title, content, content_type, images, attachments, review_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, 
      categoryId, 
      filteredTitle, 
      filteredContent, 
      contentType || 'normal',
      images ? JSON.stringify(images) : null,
      attachments ? JSON.stringify(attachments) : null,
      reviewStatus
    ]);

    const postId = (result as any).insertId;

    // 更新用户发帖数
    await pool.execute(
      'UPDATE users SET post_count = post_count + 1 WHERE id = ?',
      [userId]
    );

    // 更新板块统计
    await pool.execute(
      'UPDATE forum_categories SET post_count = post_count + 1 WHERE id = ?',
      [categoryId]
    );

    res.json({
      success: true,
      data: { 
        id: postId,
        status: reviewStatus === 'pending' ? 'pending' : 'published'
      },
      message: reviewStatus === 'pending' ? '帖子已提交，等待审核' : '发布成功'
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ success: false, message: '发布帖子失败' });
  }
});

// 获取评论列表（支持楼中楼）
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 获取顶级评论和回复
    const [rows] = await pool.execute(`
      SELECT c.*, 
             u.username, u.avatar, u.level, u.role as user_role,
             (SELECT username FROM users WHERE id = c.parent_id) as reply_to_username
      FROM forum_comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? AND c.is_deleted = FALSE
      ORDER BY c.root_id IS NULL DESC, c.created_at ASC
      LIMIT ? OFFSET ?
    `, [id, Number(limit), offset]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: '获取评论失败' });
  }
});

// 发布评论
router.post('/comments', async (req, res) => {
  try {
    const { userId, postId, parentId, content, contentType, images } = req.body;

    if (!userId || !postId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '用户ID、帖子ID和内容不能为空' 
      });
    }

    // 敏感词过滤
    const filteredContent = sensitiveWordFilter(content);

    // 计算评论层级
    let level = 0;
    let rootId: number | null = null;
    let parentPath = '';

    if (parentId) {
      const [parents] = await pool.execute(
        'SELECT level, root_id, path FROM forum_comments WHERE id = ?',
        [parentId]
      );
      if ((parents as any[]).length > 0) {
        const parent = (parents as any[])[0];
        level = parent.level + 1;
        rootId = parent.root_id || parentId;
        parentPath = parent.path ? `${parent.path},${parentId}` : `${parentId}`;
        
        // 更新父评论回复数
        await pool.execute(
          'UPDATE forum_comments SET reply_count = reply_count + 1 WHERE id = ?',
          [parentId]
        );
      }
    }

    // 创建评论
    const [result] = await pool.execute(`
      INSERT INTO forum_comments 
      (post_id, user_id, parent_id, root_id, content, content_type, images, level, path) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      postId, 
      userId, 
      parentId || null, 
      rootId,
      filteredContent,
      contentType || 'text',
      images ? JSON.stringify(images) : null,
      level,
      parentPath || null
    ]);

    const commentId = (result as any).insertId;

    // 更新帖子评论数
    await pool.execute(
      'UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = ?',
      [postId]
    );

    // 更新用户评论数
    await pool.execute(
      'UPDATE users SET comment_count = comment_count + 1 WHERE id = ?',
      [userId]
    );

    res.json({ success: true, data: { id: commentId } });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ success: false, message: '发表评论失败' });
  }
});

// 点赞帖子
router.post('/posts/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    // 检查是否已点赞
    const [existing] = await pool.execute(
      'SELECT id FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, id]
    );

    if ((existing as any[]).length > 0) {
      // 取消点赞
      await pool.execute(
        'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?',
        [userId, id]
      );
      await pool.execute(
        'UPDATE forum_posts SET like_count = like_count - 1 WHERE id = ?',
        [id]
      );
      return res.json({ success: true, action: 'unlike' });
    }

    // 添加点赞
    await pool.execute(
      'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)',
      [userId, id]
    );
    await pool.execute(
      'UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true, action: 'like' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 收藏帖子
router.post('/posts/:id/collect', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, folderId, note } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    // 检查是否已收藏
    const [existing] = await pool.execute(
      'SELECT id FROM collections WHERE user_id = ? AND post_id = ?',
      [userId, id]
    );

    if ((existing as any[]).length > 0) {
      // 取消收藏
      await pool.execute(
        'DELETE FROM collections WHERE user_id = ? AND post_id = ?',
        [userId, id]
      );
      await pool.execute(
        'UPDATE forum_posts SET collect_count = collect_count - 1 WHERE id = ?',
        [id]
      );
      return res.json({ success: true, action: 'uncollect' });
    }

    // 添加收藏
    await pool.execute(
      'INSERT INTO collections (user_id, post_id, folder_id, note) VALUES (?, ?, ?, ?)',
      [userId, id, folderId || null, note || null]
    );
    await pool.execute(
      'UPDATE forum_posts SET collect_count = collect_count + 1 WHERE id = ?',
      [id]
    );

    res.json({ success: true, action: 'collect' });
  } catch (error) {
    console.error('Collect post error:', error);
    res.status(500).json({ success: false, message: '操作失败' });
  }
});

// 获取用户收藏
router.get('/collections', async (req, res) => {
  try {
    const { userId, folderId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    let query = `
      SELECT c.*, p.title, p.content, p.view_count, p.like_count,
             u.username as author_name
      FROM collections c
      JOIN forum_posts p ON c.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE c.user_id = ? AND p.is_deleted = FALSE
    `;
    const params: any[] = [userId];

    if (folderId) {
      query += ' AND c.folder_id = ?';
      params.push(folderId);
    }

    query += ' ORDER BY c.created_at DESC';

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ success: false, message: '获取收藏失败' });
  }
});

// 获取收藏夹列表
router.get('/collection-folders', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const [rows] = await pool.execute(
      `SELECT cf.*, 
              (SELECT COUNT(*) FROM collections WHERE folder_id = cf.id) as collect_count
       FROM collection_folders cf
       WHERE cf.user_id = ?
       ORDER BY cf.is_default DESC, cf.created_at ASC`,
      [userId]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get collection folders error:', error);
    res.status(500).json({ success: false, message: '获取收藏夹失败' });
  }
});

// 创建收藏夹
router.post('/collection-folders', async (req, res) => {
  try {
    const { userId, name, description } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ success: false, message: '用户ID和名称不能为空' });
    }

    const [result] = await pool.execute(
      'INSERT INTO collection_folders (user_id, name, description) VALUES (?, ?, ?)',
      [userId, name, description || null]
    );

    res.json({ success: true, data: { id: (result as any).insertId } });
  } catch (error) {
    console.error('Create collection folder error:', error);
    res.status(500).json({ success: false, message: '创建收藏夹失败' });
  }
});

// 举报帖子/评论
router.post('/report', async (req, res) => {
  try {
    const { userId, targetType, targetId, reason, description } = req.body;

    if (!userId || !targetType || !targetId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要参数' 
      });
    }

    // 记录举报（可扩展为专门的举报表）
    await pool.execute(
      `INSERT INTO operation_logs 
       (user_id, action, target_type, target_id, detail, created_at) 
       VALUES (?, 'report', ?, ?, ?, NOW())`,
      [userId, targetType, targetId, JSON.stringify({ reason, description })]
    );

    res.json({ success: true, message: '举报成功，我们会尽快处理' });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ success: false, message: '举报失败' });
  }
});

export default router;
