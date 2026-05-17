import axios from 'axios';
import pool from '../config/database';

interface OAuthProvider {
  provider_code: string;
  client_id: string;
  authorization_url: string;
  token_url: string;
  user_info_url: string;
  scope: string;
}

interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}

class OAuthService {
  async getProviderConfig(providerCode: string): Promise<OAuthProvider | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM oauth_providers WHERE provider_code = ? AND is_enabled = TRUE',
        [providerCode]
      );

      if ((rows as any[]).length === 0) {
        return null;
      }

      const provider = (rows as any[])[0];
      return {
        provider_code: provider.provider_code,
        client_id: provider.client_id,
        authorization_url: provider.authorization_url,
        token_url: provider.token_url,
        user_info_url: provider.user_info_url,
        scope: provider.scope
      };
    } catch (error) {
      console.error('获取OAuth配置失败:', error);
      return null;
    }
  }

  async getAuthorizationUrl(providerCode: string, redirectUri: string): Promise<string | null> {
    const provider = await this.getProviderConfig(providerCode);
    if (!provider) return null;

    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: provider.scope
    });

    return `${provider.authorization_url}?${params.toString()}`;
  }

  async exchangeCodeForToken(
    providerCode: string,
    code: string,
    redirectUri: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
    const provider = await this.getProviderConfig(providerCode);
    if (!provider) return null;

    try {
      const [rows] = await pool.execute(
        'SELECT client_secret_encrypted FROM oauth_providers WHERE provider_code = ?',
        [providerCode]
      );
      const clientSecret = (rows as any[])[0]?.client_secret_encrypted;

      const response = await axios.post(provider.token_url, {
        client_id: provider.client_id,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('交换Token失败:', error);
      return null;
    }
  }

  async getUserInfo(providerCode: string, accessToken: string): Promise<OAuthUserInfo | null> {
    const provider = await this.getProviderConfig(providerCode);
    if (!provider) return null;

    try {
      const response = await axios.get(provider.user_info_url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      // 根据不同平台解析用户信息
      switch (providerCode) {
        case 'google':
          return {
            id: response.data.sub,
            email: response.data.email,
            name: response.data.name,
            picture: response.data.picture
          };
        case 'microsoft':
          return {
            id: response.data.id?.toString(),
            email: response.data.mail || response.data.userPrincipalName,
            name: response.data.displayName,
            picture: null
          };
        case 'apple':
          return {
            id: response.data.sub,
            email: response.data.email,
            name: null,
            picture: null
          };
        default:
          return response.data;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  }

  async findOrCreateUser(
    providerCode: string,
    providerUserId: string,
    userInfo: OAuthUserInfo
  ): Promise<{ userId: number; isNewUser: boolean } | null> {
    try {
      // 查找是否已绑定
      const [bindings] = await pool.execute(
        'SELECT user_id FROM user_oauth WHERE provider_code = ? AND provider_user_id = ?',
        [providerCode, providerUserId]
      );

      if ((bindings as any[]).length > 0) {
        return {
          userId: (bindings as any[])[0].user_id,
          isNewUser: false
        };
      }

      // 查找是否已用邮箱注册
      let userId = null;
      if (userInfo.email) {
        const [users] = await pool.execute(
          'SELECT id FROM users WHERE email = ?',
          [userInfo.email]
        );

        if ((users as any[]).length > 0) {
          userId = (users as any[])[0].id;
        } else {
          // 创建新用户
          const bcrypt = require('bcryptjs');
          const tempPassword = bcrypt.hashSync(Date.now().toString(), 10);
          
          const [result] = await pool.execute(
            `INSERT INTO users (username, email, password_hash, avatar, role, level, status) 
             VALUES (?, ?, ?, ?, 'newbie', 1, 'active')`,
            [
              userInfo.email.split('@')[0] + '_' + Date.now().toString(36),
              userInfo.email,
              tempPassword,
              userInfo.picture || null
            ]
          );
          userId = (result as any).insertId;

          // 创建默认收藏夹
          await pool.execute(
            'INSERT INTO collection_folders (user_id, name, is_default) VALUES (?, "默认收藏", TRUE)',
            [userId]
          );
        }
      } else {
        // 没有邮箱，生成临时账号
        const bcrypt = require('bcryptjs');
        const tempPassword = bcrypt.hashSync(Date.now().toString(), 10);
        const tempUsername = `${providerCode}_${providerUserId.substring(0, 8)}`;

        const [result] = await pool.execute(
          `INSERT INTO users (username, password_hash, avatar, role, level, status) 
           VALUES (?, ?, ?, 'newbie', 1, 'active')`,
          [tempUsername, tempPassword, userInfo.picture || null]
        );
        userId = (result as any).insertId;
      }

      // 绑定OAuth
      await pool.execute(
        `INSERT INTO user_oauth (user_id, provider_code, provider_user_id) 
         VALUES (?, ?, ?)`,
        [userId, providerCode, providerUserId]
      );

      return {
        userId,
        isNewUser: true
      };
    } catch (error) {
      console.error('创建OAuth用户失败:', error);
      return null;
    }
  }

  async unbindOAuth(userId: number, providerCode: string): Promise<boolean> {
    try {
      await pool.execute(
        'DELETE FROM user_oauth WHERE user_id = ? AND provider_code = ?',
        [userId, providerCode]
      );
      return true;
    } catch (error) {
      console.error('解除OAuth绑定失败:', error);
      return false;
    }
  }

  async getUserBindings(userId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute(
        `SELECT o.provider_code, p.provider_name, p.icon, o.created_at
         FROM user_oauth o
         JOIN oauth_providers p ON o.provider_code = p.provider_code
         WHERE o.user_id = ?`,
        [userId]
      );
      return rows as any[];
    } catch (error) {
      console.error('获取OAuth绑定失败:', error);
      return [];
    }
  }
}

export default new OAuthService();
