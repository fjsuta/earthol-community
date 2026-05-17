/**
 * 身份证验证策略接口
 * Identity Authentication Strategy Interface
 */
export interface IdentityValidationStrategy {
  /**
   * 验证身份证号
   * @param idCard 身份证号
   * @returns 验证结果
   */
  validate(idCard: string): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  data?: {
    birthday?: string;
    gender?: 'male' | 'female';
    region?: string;
  };
}

export interface IdentityInfo {
  region: string;
  birthday: string;
  gender: 'male' | 'female';
}
