import { IdentityValidationStrategy, ValidationResult } from './IdentityValidationStrategy';

/**
 * 基础算法策略：纯本地校验身份证合法性
 * Basic Algorithm Strategy: Local ID Card Validation
 */
export class BasicAlgorithmStrategy implements IdentityValidationStrategy {
  /**
   * 身份证前6位省市区代码映射 (简化版)
   * Province/Region Code Mapping (Simplified)
   */
  private regionCodeMap: Record<string, string> = {
    '11': '北京市',
    '12': '天津市',
    '13': '河北省',
    '14': '山西省',
    '15': '内蒙古自治区',
    '21': '辽宁省',
    '22': '吉林省',
    '23': '黑龙江省',
    '31': '上海市',
    '32': '江苏省',
    '33': '浙江省',
    '34': '安徽省',
    '35': '福建省',
    '36': '江西省',
    '37': '山东省',
    '41': '河南省',
    '42': '湖北省',
    '43': '湖南省',
    '44': '广东省',
    '45': '广西壮族自治区',
    '46': '海南省',
    '50': '重庆市',
    '51': '四川省',
    '52': '贵州省',
    '53': '云南省',
    '54': '西藏自治区',
    '61': '陕西省',
    '62': '甘肃省',
    '63': '青海省',
    '64': '宁夏回族自治区',
    '65': '新疆维吾尔自治区',
    '71': '台湾省',
    '81': '香港特别行政区',
    '82': '澳门特别行政区'
  };

  /**
   * 基础算法验证身份证号
   * @param idCard 身份证号
   * @returns 验证结果
   */
  async validate(idCard: string): Promise<ValidationResult> {
    try {
      // 1. 基础格式清洗与校验
      const cleanedIdCard = idCard.trim().toUpperCase();
      
      if (!/^\d{17}[\dX]$/.test(cleanedIdCard)) {
        return {
          isValid: false,
          message: '身份证号格式错误，请输入18位有效身份证号'
        };
      }

      // 2. 加权因子与校验码映射表 (GB 11643-1999)
      const Wi = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const ValideCode = [1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2]; // 10 代表 X

      // 3. 计算加权和并取模
      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(cleanedIdCard.charAt(i)) * Wi[i];
      }

      // 4. 比对校验码
      const calculatedCode = ValideCode[sum % 11];
      const lastChar = cleanedIdCard.charAt(17);
      const checkChar = calculatedCode === 10 ? 'X' : calculatedCode.toString();

      if (lastChar !== checkChar) {
        return {
          isValid: false,
          message: '身份证号校验失败，请检查输入是否正确'
        };
      }

      // 5. 解析生日并验证日期
      const year = parseInt(cleanedIdCard.substring(6, 10));
      const month = parseInt(cleanedIdCard.substring(10, 12));
      const day = parseInt(cleanedIdCard.substring(12, 14));
      
      if (!this.isValidDate(year, month, day)) {
        return {
          isValid: false,
          message: '身份证号出生日期无效'
        };
      }

      // 6. 解析地区
      const regionCode = cleanedIdCard.substring(0, 2);
      const region = this.regionCodeMap[regionCode] || '未知地区';

      // 7. 解析性别 (第17位，奇数为男，偶数为女)
      const genderCode = parseInt(cleanedIdCard.charAt(16));
      const gender = genderCode % 2 === 1 ? 'male' : 'female';

      // 8. 验证出生日期范围
      const birthDate = new Date(year, month - 1, day);
      const currentYear = new Date().getFullYear();
      const maxAge = 130;
      
      if (year < currentYear - maxAge || year > currentYear) {
        return {
          isValid: false,
          message: '身份证号出生日期超出合理范围'
        };
      }

      return {
        isValid: true,
        message: '身份证验证通过',
        data: {
          birthday: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          gender,
          region
        }
      };
    } catch (error) {
      console.error('ID Card Validation Error:', error);
      return {
        isValid: false,
        message: '身份证验证失败，请稍后重试'
      };
    }
  }

  /**
   * 验证日期是否合法
   */
  private isValidDate(year: number, month: number, day: number): boolean {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /**
   * 获取身份证脱敏显示
   * @param idCard 原始身份证号
   * @returns 脱敏后的身份证号
   */
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.substring(0, 6) + '********' + idCard.substring(14);
  }
}
