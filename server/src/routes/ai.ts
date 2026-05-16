import express from 'express';
import { aiService } from '../services/aiService';
import pool from '../config/database';

const router = express.Router();

// AI对话接口
router.post('/chat', async (req, res) => {
  try {
    const { userId, message, personaId, conversationId } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, message: '用户ID和消息不能为空' });
    }

    // 获取对话历史
    const history = await aiService.getChatHistory(userId, conversationId);

    // 获取AI人设
    let systemPrompt = '';
    if (personaId) {
      const [personas] = await pool.execute(
        'SELECT * FROM ai_personas WHERE id = ? AND is_active = TRUE',
        [personaId]
      );
      if ((personas as any[]).length > 0) {
        systemPrompt = (personas as any[])[0].system_prompt;
      }
    } else {
      // 默认使用全域智能助手
      const [personas] = await pool.execute(
        'SELECT * FROM ai_personas WHERE type = "global" AND is_active = TRUE LIMIT 1'
      );
      if ((personas as any[]).length > 0) {
        systemPrompt = (personas as any[])[0].system_prompt;
      }
    }

    // AI对话
    const { response, thinkingChain } = await aiService.chatWithAI(
      userId,
      message,
      history,
      systemPrompt
    );

    // 保存对话记忆
    await aiService.saveMemory(userId, conversationId, 'user', message);
    await aiService.saveMemory(userId, conversationId, 'assistant', response, thinkingChain);

    // 更新会话信息
    if (conversationId) {
      await pool.execute(
        'UPDATE ai_conversations SET last_message = ?, message_count = message_count + 2, updated_at = NOW() WHERE id = ?',
        [message.substring(0, 200), conversationId]
      );
    }

    res.json({
      success: true,
      data: {
        response,
        thinkingChain,
        conversationId
      }
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ success: false, message: 'AI对话失败' });
  }
});

// 获取对话历史
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId, limit = 50 } = req.query;

    const history = await aiService.getChatHistory(
      parseInt(userId as string),
      conversationId as string | undefined,
      parseInt(limit as string)
    );

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: '获取对话历史失败' });
  }
});

// 获取对话会话列表
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.execute(`
      SELECT c.*, p.name as persona_name, p.description as persona_description
      FROM ai_conversations c
      LEFT JOIN ai_personas p ON c.persona_id = p.id
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
      LIMIT 50
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: '获取对话会话失败' });
  }
});

// 创建新对话会话
router.post('/conversations', async (req, res) => {
  try {
    const { userId, personaId, title } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }

    const [result] = await pool.execute(
      'INSERT INTO ai_conversations (user_id, persona_id, title) VALUES (?, ?, ?)',
      [userId, personaId || null, title || '新对话']
    );

    res.json({ success: true, data: { id: (result as any).insertId } });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: '创建对话会话失败' });
  }
});

// 删除对话会话
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 删除会话中的所有对话记录
    await pool.execute('DELETE FROM ai_chat_memory WHERE user_id IN (SELECT id FROM ai_conversations WHERE id = ?)', [id]);
    await pool.execute('DELETE FROM ai_conversations WHERE id = ?', [id]);

    res.json({ success: true, message: '对话会话已删除' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: '删除对话会话失败' });
  }
});

// 获取AI人设列表
router.get('/personas', async (req, res) => {
  try {
    const { type, regionId } = req.query;

    let query = 'SELECT * FROM ai_personas WHERE is_active = TRUE';
    const params: any[] = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (regionId) {
      query += ' AND (region_id = ? OR region_id IS NULL)';
      params.push(regionId);
    }

    query += ' ORDER BY type ASC, id ASC';

    const [rows] = await pool.execute(query, params);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({ success: false, message: '获取AI人设失败' });
  }
});

// 创建AI人设
router.post('/personas', async (req, res) => {
  try {
    const { name, description, systemPrompt, type, regionId, temperature, maxTokens } = req.body;

    if (!name || !systemPrompt) {
      return res.status(400).json({ success: false, message: '名称和系统提示词不能为空' });
    }

    const [result] = await pool.execute(`
      INSERT INTO ai_personas 
      (name, description, system_prompt, type, region_id, temperature, max_tokens)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description || null, systemPrompt, type || 'global', regionId || null, temperature || 0.7, maxTokens || 1000]);

    res.json({ success: true, data: { id: (result as any).insertId }, message: 'AI人设创建成功' });
  } catch (error) {
    console.error('Create persona error:', error);
    res.status(500).json({ success: false, message: '创建AI人设失败' });
  }
});

// 更新AI人设
router.put('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, systemPrompt, temperature, maxTokens, isActive } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (systemPrompt) { updates.push('system_prompt = ?'); values.push(systemPrompt); }
    if (temperature !== undefined) { updates.push('temperature = ?'); values.push(temperature); }
    if (maxTokens !== undefined) { updates.push('max_tokens = ?'); values.push(maxTokens); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive); }

    if (updates.length > 0) {
      values.push(id);
      await pool.execute(`UPDATE ai_personas SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.json({ success: true, message: 'AI人设更新成功' });
  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({ success: false, message: '更新AI人设失败' });
  }
});

// 语音转文字（接收前端语音数据）
router.post('/voice-to-text', async (req, res) => {
  try {
    const { audioData, format } = req.body;

    // 这里应该调用实际的语音识别服务
    // 由于实际项目中可能使用不同的语音识别服务（Web Speech API、阿里云ASR等）
    // 这里提供一个简单的接口，实际需要根据前端使用的语音服务来实现

    // 模拟返回
    res.json({
      success: true,
      data: {
        text: '',
        message: '请使用前端Web Speech API进行语音识别'
      }
    });
  } catch (error) {
    console.error('Voice to text error:', error);
    res.status(500).json({ success: false, message: '语音识别失败' });
  }
});

// 文字转语音（返回语音数据）
router.post('/text-to-voice', async (req, res) => {
  try {
    const { text, voice } = req.body;

    // 这里应该调用实际的语音合成服务
    // 同样，这里提供一个接口框架

    res.json({
      success: true,
      data: {
        audioUrl: '',
        message: '请使用前端Web Speech API进行语音合成'
      }
    });
  } catch (error) {
    console.error('Text to voice error:', error);
    res.status(500).json({ success: false, message: '语音合成失败' });
  }
});

// 清空对话记忆
router.delete('/memory/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { conversationId } = req.query;

    if (conversationId) {
      await pool.execute('DELETE FROM ai_chat_memory WHERE user_id = ? AND conversation_id = ?', [userId, conversationId]);
    } else {
      await pool.execute('DELETE FROM ai_chat_memory WHERE user_id = ?', [userId]);
    }

    res.json({ success: true, message: '对话记忆已清空' });
  } catch (error) {
    console.error('Clear memory error:', error);
    res.status(500).json({ success: false, message: '清空对话记忆失败' });
  }
});

export default router;
