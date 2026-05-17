import pool from '../config/database';
import { IdentityValidationStrategy, ValidationResult } from './IdentityValidationStrategy';
import { BasicAlgorithmStrategy } from './BasicAlgorithmStrategy';
import { OfficialPluginStrategy } from './OfficialPluginStrategy';

export type ValidationMode = 'basic' | 'official' | 'optional' | 'disabled';

export class IdentityService {
  private basicStrategy: IdentityValidationStrategy;
  private officialStrategy?: IdentityValidationStrategy;

  constructor() {
    this.basicStrategy = new BasicAlgorithmStrategy();
    this.initializeOfficialStrategy();
  }

  /**
   * 初始化官方插件策略
   */
  private initializeOfficialStrategy() {
    const hasOfficialConfig = 
      process.env.IDENTITY_API_ENDPOINT || 
      process.env.IDENTITY_API_KEY ||
      process.env.IDENTITY_APP_ID;

    if (hasOfficialConfig) {
      this.officialStrategy = new OfficialPluginStrategy({});
    }
  }

  /**
   * 获取当前验证模式
   */
  async getValidationMode(): Promise<ValidationMode> {
    try {
      const [rows] = await pool.execute(
        'SELECT config_value FROM system_configs WHERE config_key = ?',
        ['identity_validation_mode']
      );

      const config = (rows as any[])[0];
      if (config) {
        return JSON.parse(config.config_value) as ValidationMode;
      }

      // 默认返回可选模式
      return 'optional';
    } catch (error) {
      console.error('Get validation mode error:', error);
      return 'optional';
    }
  }

  /**
   * 设置验证模式
   */
  async setValidationMode(mode: ValidationMode): Promise<void> {
    await pool.execute(
      `INSERT INTO system_configs (config_key, config_value, config_type, category) 
       VALUES (?, ?, 'string', 'identity') 
       ON DUPLICATE KEY UPDATE config_value = ?, updated_at = CURRENT_TIMESTAMP`,
      ['identity_validation_mode', JSON.stringify(mode), JSON.stringify(mode)]
    );
  }

  /**
   * 验证身份证（根据配置自动选择策略）
   */
  async validateIdentity(
    idCard: string, 
    name?: string
  ): Promise<ValidationResult> {
    const mode = await this.getValidationMode();

    // 如果禁用身份验证，直接通过（Beta版测试模式）
    if (mode === 'disabled') {
      return {
        isValid: true,
        message: '身份验证已禁用，Beta版测试模式'
      };
    }

    // 如果是可选模式且无身份证，也通过
    if (mode === 'optional' && !idCard) {
      return {
        isValid: true,
        message: '可选身份验证，未提供身份证信息'
      };
    }

    // 如果启用官方插件且已配置，使用官方验证
    if (mode === 'official' && this.officialStrategy) {
      return this.officialStrategy.validate(idCard);
    }

    // 默认使用基础算法
    return this.basicStrategy.validate(idCard);
  }

  /**
   * 身份证脱敏
   */
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.substring(0, 6) + '********' + idCard.substring(14);
  }

  /**
   * 加密存储身份证号
   * 注意：实际生产环境应使用AES-256等强加密算法
   */
  encryptIdCard(idCard: string): string {
    // 这里是简化实现，生产环境应使用强加密
    const base64 = Buffer.from(idCard).toString('base64');
    const reversed = base64.split('').reverse().join('');
    return `ENC_${reversed}`;
  }

  /**
   * 解密身份证号
   */
  decryptIdCard(encryptedIdCard: string): string {
    if (!encryptedIdCard.startsWith('ENC_')) return encryptedIdCard;
    
    const content = encryptedIdCard.substring(4);
    const reversed = content.split('').reverse().join('');
    return Buffer.from(reversed, 'base64').toString();
  }
}

export default new IdentityService();
