import nodemailer from 'nodemailer';
import pool from '../config/database';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  async loadConfig(): Promise<boolean> {
    try {
      const [rows] = await pool.execute(
        'SELECT config_value FROM system_configs WHERE config_key = ?',
        ['email_smtp_config']
      );
      
      if ((rows as any[]).length > 0) {
        const configStr = (rows as any[])[0].config_value;
        this.config = JSON.parse(configStr);
        
        if (this.config && this.config.host) {
          this.transporter = nodemailer.createTransport({
            host: this.config.host,
            port: this.config.port || 465,
            secure: this.config.secure !== false,
            auth: {
              user: this.config.user,
              pass: this.config.pass
            }
          });
          return true;
        }
      }
      
      // 如果没有配置，返回false但不报错
      return false;
    } catch (error) {
      console.error('加载邮件配置失败:', error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      const loaded = await this.loadConfig();
      if (!loaded) {
        return { success: false, message: '邮件服务未配置' };
      }
    }

    try {
      await this.transporter!.sendMail({
        from: this.config!.from || this.config!.user,
        to,
        subject,
        html
      });

      console.log(`邮件已发送至: ${to}`);
      return { success: true, message: '邮件发送成功' };
    } catch (error) {
      console.error('发送邮件失败:', error);
      return { success: false, message: error instanceof Error ? error.message : '邮件发送失败' };
    }
  }

  async sendVerificationCode(email: string, code: string, type: string): Promise<{ success: boolean; message: string }> {
    const templates: Record<string, { subject: string; html: string }> = {
      register: {
        subject: '🌍 地球OL - 注册验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">🌍 地球OL 全球玩家社区</h2>
            <p>您好！</p>
            <p>感谢您注册地球OL全球玩家社区！</p>
            <p>您的注册验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
              ${code}
            </div>
            <p>验证码有效期为 <strong>10分钟</strong>，请尽快完成验证。</p>
            <p style="color: #999; font-size: 12px;">如果您没有注册账号，请忽略此邮件。</p>
          </div>
        `
      },
      reset_password: {
        subject: '🔑 地球OL - 密码重置验证码',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">🔑 密码重置</h2>
            <p>您好！</p>
            <p>我们收到了您的密码重置请求。</p>
            <p>您的验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
              ${code}
            </div>
            <p>验证码有效期为 <strong>10分钟</strong>。</p>
            <p style="color: #ff6b6b;">如果您没有请求重置密码，请忽略此邮件，您的账号安全不会受到影响。</p>
          </div>
        `
      },
      bind_email: {
        subject: '📧 地球OL - 邮箱绑定验证',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">📧 邮箱绑定</h2>
            <p>您好！</p>
            <p>您正在绑定邮箱到地球OL账号。</p>
            <p>您的验证码是：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
              ${code}
            </div>
            <p>验证码有效期为 <strong>10分钟</strong>。</p>
          </div>
        `
      },
      login_verify: {
        subject: '🔐 地球OL - 登录验证',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00d4ff;">🔐 登录验证</h2>
            <p>您好！</p>
            <p>有人尝试登录您的账号。</p>
            <p>验证码：</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; margin: 20px 0;">
              ${code}
            </div>
            <p>验证码有效期为 <strong>5分钟</strong>。</p>
            <p style="color: #ff6b6b;">如果不是您本人操作，请立即修改密码！</p>
          </div>
        `
      }
    };

    const template = templates[type] || templates['register'];
    return this.sendEmail(email, template.subject, template.html);
  }

  async saveVerificationCode(email: string, code: string, type: string, userId?: number): Promise<void> {
    // 删除该邮箱的旧验证码
    await pool.execute(
      'UPDATE email_verifications SET used = TRUE WHERE email = ? AND type = ?',
      [email, type]
    );

    // 插入新验证码
    await pool.execute(
      `INSERT INTO email_verifications (email, code, type, user_id, expires_at) 
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [email, code, type, userId || null]
    );
  }

  async verifyCode(email: string, code: string, type: string): Promise<boolean> {
    const [rows] = await pool.execute(
      `SELECT * FROM email_verifications 
       WHERE email = ? AND code = ? AND type = ? AND used = FALSE AND expires_at > NOW()`,
      [email, code, type]
    );

    if ((rows as any[]).length === 0) {
      return false;
    }

    // 标记为已使用
    await pool.execute(
      'UPDATE email_verifications SET used = TRUE WHERE email = ? AND code = ?',
      [email, code]
    );

    return true;
  }
}

export default new EmailService();
