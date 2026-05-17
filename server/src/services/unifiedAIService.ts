import axios from 'axios';
import configService, { AIProviderConfig } from './configService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

class UnifiedAIService {
  private async getProvider(): Promise<AIProviderConfig> {
    const provider = await configService.getDefaultAIProvider();
    if (!provider) {
      throw new Error('没有可用的AI服务商配置');
    }
    return provider;
  }

  private async callOpenAICompatible(
    provider: AIProviderConfig,
    messages: Message[],
    options: ChatCompletionOptions = {}
  ): Promise<any> {
    const url = provider.base_url || 'https://api.openai.com/v1';
    const model = options.model || provider.default_model || 'gpt-4';
    
    const response = await axios.post(
      `${url}/chat/completions`,
      {
        model,
        messages,
        temperature: options.temperature ?? provider.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? provider.max_tokens ?? 1000,
        stream: options.stream ?? false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.api_key}`,
          ...(provider.api_version ? { 'api-version': provider.api_version } : {})
        },
        timeout: provider.timeout || 30000
      }
    );

    return response.data;
  }

  private async callOllama(
    provider: AIProviderConfig,
    messages: Message[],
    options: ChatCompletionOptions = {}
  ): Promise<any> {
    const url = provider.base_url || 'http://localhost:11434';
    const model = options.model || provider.default_model || 'llama2';

    const response = await axios.post(
      `${url}/api/chat`,
      {
        model,
        messages,
        stream: options.stream ?? false,
        options: {
          temperature: options.temperature ?? provider.temperature ?? 0.7,
          num_predict: options.max_tokens ?? provider.max_tokens ?? 1000
        }
      },
      {
        timeout: provider.timeout || 30000
      }
    );

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.data.message?.content || response.data.response
          }
        }
      ]
    };
  }

  async chat(messages: Message[], options: ChatCompletionOptions = {}): Promise<any> {
    const provider = await this.getProvider();

    try {
      switch (provider.provider_type) {
        case 'ollama':
          return await this.callOllama(provider, messages, options);
        case 'openai':
        case 'siliconflow':
        case 'xai':
        case 'volcengine':
        case 'qwen':
        case 'custom':
        default:
          return await this.callOpenAICompatible(provider, messages, options);
      }
    } catch (error) {
      console.error('AI调用失败:', error);
      throw new Error(error instanceof Error ? error.message : 'AI服务调用失败');
    }
  }

  async testConnection(provider: AIProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
      const testMessage = { role: 'user', content: 'Hello' };
      await this.callOpenAICompatible(provider, [testMessage], { max_tokens: 10 });
      return { success: true, message: '连接成功' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : '连接失败' };
    }
  }
}

export default new UnifiedAIService();
