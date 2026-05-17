-- ========================================
-- 配置管理系统表
-- ========================================

-- 1. 系统配置表
CREATE TABLE IF NOT EXISTS system_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
  config_value TEXT COMMENT '配置值(JSON格式)',
  config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '配置类型',
  description VARCHAR(255) COMMENT '配置描述',
  category VARCHAR(50) DEFAULT 'general' COMMENT '配置分类',
  is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
  is_encrypted BOOLEAN DEFAULT FALSE COMMENT '是否加密',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 2. AI服务配置表
CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider_name VARCHAR(50) NOT NULL COMMENT '服务商名称',
  provider_type ENUM('openai', 'ollama', 'siliconflow', 'xai', 'volcengine', 'qwen', 'custom') NOT NULL COMMENT '服务商类型',
  base_url VARCHAR(500) COMMENT 'API基础URL',
  api_key VARCHAR(500) COMMENT 'API密钥',
  api_version VARCHAR(50) COMMENT 'API版本',
  default_model VARCHAR(100) COMMENT '默认模型',
  max_tokens INT DEFAULT 4000 COMMENT '最大Token数',
  temperature FLOAT DEFAULT 0.7 COMMENT '温度参数',
  timeout INT DEFAULT 30000 COMMENT '超时时间(毫秒)',
  is_active BOOLEAN DEFAULT FALSE COMMENT '是否启用',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
  priority INT DEFAULT 0 COMMENT '优先级',
  config JSON DEFAULT NULL COMMENT '额外配置',
  last_test_at TIMESTAMP NULL COMMENT '最后测试时间',
  last_test_status ENUM('success', 'failed') DEFAULT NULL COMMENT '最后测试状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_provider_type (provider_type),
  INDEX idx_is_active (is_active),
  INDEX idx_is_default (is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI服务商配置表';

-- 3. 对象存储配置表
CREATE TABLE IF NOT EXISTS storage_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_name VARCHAR(50) NOT NULL COMMENT '配置名称',
  storage_type ENUM('local', 'aliyun', 'huaweicloud', 'qcloud', 'jdcloud', 'raincloud', 's3', 'custom') NOT NULL COMMENT '存储类型',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
  
  -- 本地存储配置
  local_base_path VARCHAR(500) DEFAULT '/uploads' COMMENT '本地存储路径',
  
  -- 云存储通用配置
  access_key VARCHAR(255) COMMENT 'Access Key',
  secret_key VARCHAR(500) COMMENT 'Secret Key',
  bucket VARCHAR(100) COMMENT 'Bucket名称',
  region VARCHAR(100) COMMENT '区域',
  endpoint VARCHAR(500) COMMENT 'Endpoint',
  base_url VARCHAR(500) COMMENT '访问基础URL',
  
  -- 高级配置
  is_https BOOLEAN DEFAULT TRUE COMMENT '是否HTTPS',
  cdn_url VARCHAR(500) COMMENT 'CDN域名',
  storage_class VARCHAR(50) COMMENT '存储类型',
  max_file_size BIGINT DEFAULT 104857600 COMMENT '最大文件大小(字节)',
  allowed_extensions TEXT COMMENT '允许的扩展名，逗号分隔',
  extra_config JSON DEFAULT NULL COMMENT '额外配置',
  
  -- 状态
  is_active BOOLEAN DEFAULT FALSE COMMENT '是否启用',
  last_test_at TIMESTAMP NULL COMMENT '最后测试时间',
  last_test_status ENUM('success', 'failed') DEFAULT NULL COMMENT '最后测试状态',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_storage_type (storage_type),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对象存储配置表';

-- 4. 数据库配置表
CREATE TABLE IF NOT EXISTS database_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  config_name VARCHAR(50) NOT NULL COMMENT '配置名称',
  db_type ENUM('mysql', 'postgresql', 'mariadb', 'tidb', 'custom') DEFAULT 'mysql' COMMENT '数据库类型',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认',
  
  -- 连接配置
  host VARCHAR(255) NOT NULL COMMENT '主机地址',
  port INT DEFAULT 3306 COMMENT '端口',
  username VARCHAR(100) NOT NULL COMMENT '用户名',
  password VARCHAR(500) COMMENT '密码',
  database_name VARCHAR(100) NOT NULL COMMENT '数据库名',
  
  -- 连接池配置
  connection_limit INT DEFAULT 10 COMMENT '连接池大小',
  charset VARCHAR(50) DEFAULT 'utf8mb4' COMMENT '字符集',
  timezone VARCHAR(50) DEFAULT '+08:00' COMMENT '时区',
  ssl_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用SSL',
  ca_cert TEXT COMMENT 'CA证书',
  
  -- 高级配置
  extra_config JSON DEFAULT NULL COMMENT '额外配置',
  
  -- 状态
  is_active BOOLEAN DEFAULT FALSE COMMENT '是否启用',
  last_test_at TIMESTAMP NULL COMMENT '最后测试时间',
  last_test_status ENUM('success', 'failed') DEFAULT NULL COMMENT '最后测试状态',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_db_type (db_type),
  INDEX idx_is_default (is_default),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库配置表';

-- ========================================
-- 插入默认配置
-- ========================================

-- 插入系统配置
INSERT INTO system_configs (config_key, config_value, config_type, description, category, is_public) VALUES
('site_name', '"地球OL全球玩家社区"', 'string', '网站名称', 'general', TRUE),
('site_description', '"以真实地球为唯一服务器的全球玩家开源社区"', 'string', '网站描述', 'general', TRUE),
('max_upload_size', '104857600', 'number', '最大上传大小(字节)', 'storage', FALSE),
('enable_registration', 'true', 'boolean', '是否开放注册', 'user', TRUE),
('icp_number', '""', 'string', 'ICP备案号', 'site', TRUE),
('icp_url', '""', 'string', 'ICP备案链接', 'site', TRUE),
('icp_police_number', '""', 'string', '公安备案号', 'site', TRUE),
('icp_police_url', '""', 'string', '公安备案链接', 'site', TRUE),
('copyright_text', '"© 2024 地球OL全球玩家社区"', 'string', '版权信息', 'site', TRUE),
('show_footer', 'true', 'boolean', '显示页脚备案信息', 'site', TRUE);

-- 插入默认本地存储配置
INSERT INTO storage_configs (config_name, storage_type, is_default, local_base_path, is_active) VALUES
('本地存储', 'local', TRUE, '/uploads', TRUE);

-- 插入默认数据库配置标记
INSERT INTO database_configs (config_name, db_type, is_default, host, port, username, database_name, is_active) VALUES
('本地数据库', 'mysql', TRUE, 'localhost', 3306, 'root', 'earthol', TRUE);

-- 插入示例AI配置
INSERT INTO ai_provider_configs (provider_name, provider_type, base_url, default_model, is_active, priority) VALUES
('Ollama(本地)', 'ollama', 'http://localhost:11434', 'llama2', TRUE, 1),
('OpenAI', 'openai', 'https://api.openai.com/v1', 'gpt-4', FALSE, 2),
('硅基流动', 'siliconflow', 'https://api.siliconflow.cn/v1', 'Qwen/Qwen2.5-7B-Instruct', FALSE, 3),
('xAI', 'xai', 'https://api.x.ai/v1', 'grok-beta', FALSE, 4),
('火山引擎', 'volcengine', 'https://ark.cn-beijing.volces.com/api/v3', 'ep-20241212123456-xxxxx', FALSE, 5),
('阿里百炼', 'qwen', 'https://dashscope.aliyuncs.com/compatible-mode/v1', 'qwen-plus', FALSE, 6);
