
import axios from 'axios';
import dotenv from 'dotenv';
import pool from '../config/database';

dotenv.config();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class AIService {
  private provider: string;
  
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'ollama';
  }

  async chatWithAI(
    userId: number,
    userMessage: string,
    history: ChatMessage[]
  ): Promise<{ response: string; thinkingChain: string }> {
    const thinkingChain = this.generateThinkingChain(userMessage);
    
    let response = '';
    
    if (this.provider === 'ollama') {
      response = await this.chatWithOllama(userMessage, history);
    } else if (this.provider === 'deepseek') {
      response = await this.chatWithDeepSeek(userMessage, history);
    } else {
      response = this.getFallbackResponse(userMessage);
    }
    
    await this.saveChatMemory(userId, userMessage, response, thinkingChain);
    
    return { response, thinkingChain };
  }

  private generateThinkingChain(message: string): string {
    const steps = [
      '1. 分析用户问题意图...',
      '2. 理解问题背景和上下文...',
      '3. 思考最合适的回答方式...',
      '4. 构建有帮助且中立的回答...',
      '5. 检查回答是否符合地球OL理念...'
    ];
    return steps.join('\n');
  }

  private async chatWithOllama(message: string, history: ChatMessage[]): Promise<string> {
    try {
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const model = process.env.OLLAMA_MODEL || 'llama2';
      
      const messages = [...history, { role: 'user', content: this.formatPrompt(message) }];
      
      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model,
        messages,
        stream: false
      });
      
      return response.data.message?.content || this.getFallbackResponse(message);
    } catch (error) {
      console.error('Ollama API error:', error);
      return this.getFallbackResponse(message);
    }
  }

  private async chatWithDeepSeek(message: string, history: ChatMessage[]): Promise<string> {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        return this.getFallbackResponse(message);
      }
      
      const messages = [...history, { role: 'user', content: this.formatPrompt(message) }];
      
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0]?.message?.content || this.getFallbackResponse(message);
    } catch (error) {
      console.error('DeepSeek API error:', error);
      return this.getFallbackResponse(message);
    }
  }

  private formatPrompt(message: string): string {
    return `你是地球OL的AI助手。地球OL是一个将现实世界比作大型多人在线游戏的项目。
请遵循以下原则：
1. 不主动提供信息，只回答用户提出的问题
2. 保持中立、客观的态度
3. 尊重生命，不调侃死亡
4. 鼓励用户积极探索现实世界
5. 回答简洁明了，不过度冗长

用户问题：${message}`;
  }

  private getFallbackResponse(message: string): string {
    const responses = [
      '感谢你的问题！我正在思考中...',
      '这是一个很好的问题。让我想想...',
      '你探索的精神很值得鼓励！',
      '这个问题很有意思。',
      '感谢你对地球OL的关注！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private async saveChatMemory(
    userId: number,
    userMessage: string,
    assistantResponse: string,
    thinkingChain: string
  ) {
    try {
      await pool.execute(
        'INSERT INTO ai_chat_memory (user_id, role, content, thinking_chain) VALUES (?, ?, ?, ?)',
        [userId, 'user', userMessage, null]
      );
      
      await pool.execute(
        'INSERT INTO ai_chat_memory (user_id, role, content, thinking_chain) VALUES (?, ?, ?, ?)',
        [userId, 'assistant', assistantResponse, thinkingChain]
      );
    } catch (error) {
      console.error('Failed to save chat memory:', error);
    }
  }

  async getChatHistory(userId: number, limit: number = 20): Promise<ChatMessage[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT role, content FROM ai_chat_memory WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit]
      );
      return (rows as ChatMessage[]).reverse();
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
