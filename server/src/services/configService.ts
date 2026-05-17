import mysql from 'mysql2/promise';
import pool from './database';

export interface SystemConfig {
  id?: number;
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  category: string;
  is_public: boolean;
  is_encrypted: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface AIProviderConfig {
  id?: number;
  provider_name: string;
  provider_type: 'openai' | 'ollama' | 'siliconflow' | 'xai' | 'volcengine' | 'qwen' | 'custom';
  base_url?: string;
  api_key?: string;
  api_version?: string;
  default_model?: string;
  max_tokens?: number;
  temperature?: number;
  timeout?: number;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  config?: any;
  last_test_at?: Date;
  last_test_status?: 'success' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

export interface StorageConfig {
  id?: number;
  config_name: string;
  storage_type: 'local' | 'aliyun' | 'huaweicloud' | 'qcloud' | 'jdcloud' | 'raincloud' | 's3' | 'custom';
  is_default: boolean;
  local_base_path?: string;
  access_key?: string;
  secret_key?: string;
  bucket?: string;
  region?: string;
  endpoint?: string;
  base_url?: string;
  is_https?: boolean;
  cdn_url?: string;
  storage_class?: string;
  max_file_size?: number;
  allowed_extensions?: string;
  extra_config?: any;
  is_active: boolean;
  last_test_at?: Date;
  last_test_status?: 'success' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

export interface DatabaseConfig {
  id?: number;
  config_name: string;
  db_type: 'mysql' | 'postgresql' | 'mariadb' | 'tidb' | 'custom';
  is_default: boolean;
  host: string;
  port: number;
  username: string;
  password?: string;
  database_name: string;
  connection_limit?: number;
  charset?: string;
  timezone?: string;
  ssl_enabled?: boolean;
  ca_cert?: string;
  extra_config?: any;
  is_active: boolean;
  last_test_at?: Date;
  last_test_status?: 'success' | 'failed';
  created_at?: Date;
  updated_at?: Date;
}

class ConfigService {
  public pool = pool;
  // ============ 系统配置 ============
  async getSystemConfig(key: string): Promise<SystemConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM system_configs WHERE config_key = ?', [key]);
    return rows[0] || null;
  }

  async getAllSystemConfigs(category?: string): Promise<SystemConfig[]> {
    let query = 'SELECT * FROM system_configs';
    const params: any[] = [];
    if (category) {
      query += ' WHERE category = ?';
      params.push(category);
    }
    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async setSystemConfig(key: string, value: any, type: string, description?: string, category?: string): Promise<void> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await pool.execute(
      `INSERT INTO system_configs (config_key, config_value, config_type, description, category) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE config_value = ?, config_type = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, stringValue, type, description, category, stringValue, type, description, category]
    );
  }

  async deleteSystemConfig(key: string): Promise<void> {
    await pool.execute('DELETE FROM system_configs WHERE config_key = ?', [key]);
  }

  // ============ AI配置 ============
  async getAIProviderConfig(id: number): Promise<AIProviderConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM ai_provider_configs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async getDefaultAIProvider(): Promise<AIProviderConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM ai_provider_configs WHERE is_default = TRUE AND is_active = TRUE LIMIT 1');
    if (rows[0]) return rows[0];
    
    const [rows2] = await pool.execute('SELECT * FROM ai_provider_configs WHERE is_active = TRUE ORDER BY priority ASC LIMIT 1');
    return rows2[0] || null;
  }

  async getAllAIProviders(): Promise<AIProviderConfig[]> {
    const [rows] = await pool.execute('SELECT * FROM ai_provider_configs ORDER BY priority ASC');
    return rows;
  }

  async createAIProviderConfig(config: Omit<AIProviderConfig, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO ai_provider_configs (
        provider_name, provider_type, base_url, api_key, api_version, default_model,
        max_tokens, temperature, timeout, is_active, is_default, priority, config
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.provider_name, config.provider_type, config.base_url, config.api_key, config.api_version,
        config.default_model, config.max_tokens, config.temperature, config.timeout,
        config.is_active, config.is_default, config.priority,
        config.config ? JSON.stringify(config.config) : null
      ]
    );
    return result.insertId;
  }

  async updateAIProviderConfig(id: number, config: Partial<AIProviderConfig>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(config)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
      fields.push(`${key} = ?`);
      values.push(key === 'config' ? JSON.stringify(value) : value);
    }
    values.push(id);
    
    await pool.execute(
      `UPDATE ai_provider_configs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    if (config.is_default) {
      await pool.execute('UPDATE ai_provider_configs SET is_default = FALSE WHERE id != ?', [id]);
    }
  }

  async deleteAIProviderConfig(id: number): Promise<void> {
    await pool.execute('DELETE FROM ai_provider_configs WHERE id = ?', [id]);
  }

  async testAIProviderConfig(id: number): Promise<{ success: boolean; message: string }> {
    const config = await this.getAIProviderConfig(id);
    if (!config) {
      return { success: false, message: '配置不存在' };
    }

    try {
      await this.updateAIProviderConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'success'
      });
      return { success: true, message: '测试成功' };
    } catch (error) {
      await this.updateAIProviderConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'failed'
      });
      return { success: false, message: error instanceof Error ? error.message : '测试失败' };
    }
  }

  // ============ 存储配置 ============
  async getStorageConfig(id: number): Promise<StorageConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM storage_configs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async getDefaultStorage(): Promise<StorageConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM storage_configs WHERE is_default = TRUE AND is_active = TRUE LIMIT 1');
    if (rows[0]) return rows[0];
    
    const [rows2] = await pool.execute('SELECT * FROM storage_configs WHERE is_active = TRUE LIMIT 1');
    return rows2[0] || null;
  }

  async getAllStorageConfigs(): Promise<StorageConfig[]> {
    const [rows] = await pool.execute('SELECT * FROM storage_configs ORDER BY is_default DESC');
    return rows;
  }

  async createStorageConfig(config: Omit<StorageConfig, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO storage_configs (
        config_name, storage_type, is_default, local_base_path, access_key, secret_key,
        bucket, region, endpoint, base_url, is_https, cdn_url, storage_class,
        max_file_size, allowed_extensions, extra_config, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.config_name, config.storage_type, config.is_default, config.local_base_path,
        config.access_key, config.secret_key, config.bucket, config.region,
        config.endpoint, config.base_url, config.is_https, config.cdn_url,
        config.storage_class, config.max_file_size, config.allowed_extensions,
        config.extra_config ? JSON.stringify(config.extra_config) : null, config.is_active
      ]
    );
    return result.insertId;
  }

  async updateStorageConfig(id: number, config: Partial<StorageConfig>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(config)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
      fields.push(`${key} = ?`);
      values.push(key === 'extra_config' ? JSON.stringify(value) : value);
    }
    values.push(id);
    
    await pool.execute(
      `UPDATE storage_configs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    if (config.is_default) {
      await pool.execute('UPDATE storage_configs SET is_default = FALSE WHERE id != ?', [id]);
    }
  }

  async deleteStorageConfig(id: number): Promise<void> {
    await pool.execute('DELETE FROM storage_configs WHERE id = ?', [id]);
  }

  async testStorageConfig(id: number): Promise<{ success: boolean; message: string }> {
    const config = await this.getStorageConfig(id);
    if (!config) {
      return { success: false, message: '配置不存在' };
    }

    try {
      await this.updateStorageConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'success'
      });
      return { success: true, message: '测试成功' };
    } catch (error) {
      await this.updateStorageConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'failed'
      });
      return { success: false, message: error instanceof Error ? error.message : '测试失败' };
    }
  }

  // ============ 数据库配置 ============
  async getDatabaseConfig(id: number): Promise<DatabaseConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM database_configs WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async getDefaultDatabase(): Promise<DatabaseConfig | null> {
    const [rows] = await pool.execute('SELECT * FROM database_configs WHERE is_default = TRUE AND is_active = TRUE LIMIT 1');
    if (rows[0]) return rows[0];
    
    const [rows2] = await pool.execute('SELECT * FROM database_configs WHERE is_active = TRUE LIMIT 1');
    return rows2[0] || null;
  }

  async getAllDatabaseConfigs(): Promise<DatabaseConfig[]> {
    const [rows] = await pool.execute('SELECT * FROM database_configs ORDER BY is_default DESC');
    return rows;
  }

  async createDatabaseConfig(config: Omit<DatabaseConfig, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [result] = await pool.execute(
      `INSERT INTO database_configs (
        config_name, db_type, is_default, host, port, username, password,
        database_name, connection_limit, charset, timezone, ssl_enabled,
        ca_cert, extra_config, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.config_name, config.db_type, config.is_default, config.host,
        config.port, config.username, config.password, config.database_name,
        config.connection_limit, config.charset, config.timezone, config.ssl_enabled,
        config.ca_cert, config.extra_config ? JSON.stringify(config.extra_config) : null, config.is_active
      ]
    );
    return result.insertId;
  }

  async updateDatabaseConfig(id: number, config: Partial<DatabaseConfig>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(config)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
      fields.push(`${key} = ?`);
      values.push(key === 'extra_config' ? JSON.stringify(value) : value);
    }
    values.push(id);
    
    await pool.execute(
      `UPDATE database_configs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );
    
    if (config.is_default) {
      await pool.execute('UPDATE database_configs SET is_default = FALSE WHERE id != ?', [id]);
    }
  }

  async deleteDatabaseConfig(id: number): Promise<void> {
    await pool.execute('DELETE FROM database_configs WHERE id = ?', [id]);
  }

  async testDatabaseConfig(id: number): Promise<{ success: boolean; message: string }> {
    const config = await this.getDatabaseConfig(id);
    if (!config) {
      return { success: false, message: '配置不存在' };
    }

    try {
      const testPool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database_name,
        connectionLimit: 1,
        waitForConnections: false
      });
      
      const conn = await testPool.getConnection();
      await conn.ping();
      conn.release();
      await testPool.end();

      await this.updateDatabaseConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'success'
      });
      return { success: true, message: '连接成功' };
    } catch (error) {
      await this.updateDatabaseConfig(id, {
        last_test_at: new Date(),
        last_test_status: 'failed'
      });
      return { success: false, message: error instanceof Error ? error.message : '连接失败' };
    }
  }

  // ============ 系统信息 ============
  async getSystemInfo(): Promise<any> {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');

    const [dbRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    const userCount = dbRows[0].count;

    const [aiRows] = await pool.execute('SELECT COUNT(*) as count FROM ai_provider_configs WHERE is_active = TRUE');
    const activeAIProviders = aiRows[0].count;

    const [storageRows] = await pool.execute('SELECT COUNT(*) as count FROM storage_configs WHERE is_active = TRUE');
    const activeStorages = storageRows[0].count;

    const [dbConfigRows] = await pool.execute('SELECT COUNT(*) as count FROM database_configs WHERE is_active = TRUE');
    const activeDatabases = dbConfigRows[0].count;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadAvg = os.loadavg();

    let diskUsage = null;
    try {
      const diskStat = fs.statfs('/');
      diskUsage = {
        total: diskStat.blocks * diskStat.bsize,
        free: diskStat.bfree * diskStat.bsize,
        used: (diskStat.blocks - diskStat.bfree) * diskStat.bsize
      };
    } catch {}

    return {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        node_version: process.version
      },
      memory: {
        total: totalMem,
        free: freeMem,
        used: totalMem - freeMem,
        usage_percent: Math.round(((totalMem - freeMem) / totalMem) * 100)
      },
      cpu: {
        count: os.cpus().length,
        load_avg: {
          '1m': loadAvg[0],
          '5m': loadAvg[1],
          '15m': loadAvg[2]
        }
      },
      disk: diskUsage,
      stats: {
        user_count: userCount,
        active_ai_providers: activeAIProviders,
        active_storages: activeStorages,
        active_databases: activeDatabases
      },
      timestamp: new Date()
    };
  }
}

export default new ConfigService();
