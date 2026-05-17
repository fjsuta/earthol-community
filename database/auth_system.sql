-- ========================================
-- 认证系统扩展 - 权限、OAuth、邮箱验证
-- ========================================

-- 1. 管理员角色表
CREATE TABLE IF NOT EXISTS admin_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
  role_code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
  description VARCHAR(255) COMMENT '角色描述',
  permissions JSON COMMENT '权限列表',
  is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统角色',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员角色表';

-- 2. 权限表
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  permission_name VARCHAR(100) NOT NULL COMMENT '权限名称',
  permission_code VARCHAR(100) UNIQUE NOT NULL COMMENT '权限代码',
  description VARCHAR(255) COMMENT '权限描述',
  category VARCHAR(50) DEFAULT 'general' COMMENT '权限分类',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 3. 第三方OAuth绑定表
CREATE TABLE IF NOT EXISTS oauth_providers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider_code VARCHAR(50) UNIQUE NOT NULL COMMENT '服务商代码',
  provider_name VARCHAR(100) NOT NULL COMMENT '服务商名称',
  icon VARCHAR(255) COMMENT '图标URL',
  is_enabled BOOLEAN DEFAULT FALSE COMMENT '是否启用',
  client_id VARCHAR(255) COMMENT 'Client ID',
  client_secret_encrypted VARCHAR(500) COMMENT '加密的Client Secret',
  authorization_url VARCHAR(500) COMMENT '授权URL',
  token_url VARCHAR(500) COMMENT 'Token URL',
  user_info_url VARCHAR(500) COMMENT '用户信息URL',
  scope VARCHAR(500) COMMENT '权限范围',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OAuth服务商配置表';

-- 4. 用户OAuth绑定表
CREATE TABLE IF NOT EXISTS user_oauth (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  provider_code VARCHAR(50) NOT NULL COMMENT '服务商代码',
  provider_user_id VARCHAR(255) NOT NULL COMMENT '服务商用户ID',
  access_token TEXT COMMENT '访问令牌',
  refresh_token TEXT COMMENT '刷新令牌',
  token_expires_at TIMESTAMP NULL COMMENT '令牌过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_provider_user (provider_code, provider_user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户OAuth绑定表';

-- 5. 邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL COMMENT '邮箱地址',
  code VARCHAR(10) NOT NULL COMMENT '验证码',
  type ENUM('register', 'reset_password', 'bind_email', 'login_verify') NOT NULL COMMENT '验证类型',
  user_id INT DEFAULT NULL COMMENT '关联用户ID',
  used BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_type (email, type),
  INDEX idx_code (code),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='邮箱验证码表';

-- 6. 用户邮箱绑定表
CREATE TABLE IF NOT EXISTS user_email_bindings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱地址',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否已验证',
  verified_at TIMESTAMP NULL COMMENT '验证时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户邮箱绑定表';

-- 7. 登录日志表
CREATE TABLE IF NOT EXISTS login_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT COMMENT '用户ID',
  username VARCHAR(50) COMMENT '用户名',
  login_type ENUM('password', 'oauth', 'email_code') NOT NULL COMMENT '登录类型',
  provider_code VARCHAR(50) COMMENT 'OAuth服务商',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  user_agent TEXT COMMENT '浏览器User-Agent',
  status ENUM('success', 'failed') NOT NULL COMMENT '登录状态',
  fail_reason VARCHAR(255) COMMENT '失败原因',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- 8. 操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '操作用户ID',
  username VARCHAR(50) COMMENT '操作用户名',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT COMMENT '目标ID',
  target_name VARCHAR(255) COMMENT '目标名称',
  details JSON COMMENT '操作详情',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- ========================================
-- 插入默认管理员角色
-- ========================================
INSERT INTO admin_roles (role_name, role_code, description, permissions, is_system) VALUES
('超级管理员', 'super_admin', '拥有所有权限', '{"all": true}', TRUE),
('管理员', 'admin', '日常管理权限', '{"users": true, "posts": true, "comments": true, "categories": true, "announcements": true}', TRUE),
('版主', 'moderator', '论坛版主权限', '{"posts": true, "comments": true}', TRUE);

-- ========================================
-- 插入默认权限
-- ========================================
INSERT INTO permissions (permission_name, permission_code, description, category) VALUES
('用户管理', 'users.view', '查看用户列表', 'users'),
('用户编辑', 'users.edit', '编辑用户信息', 'users'),
('用户删除', 'users.delete', '删除用户', 'users'),
('用户封禁', 'users.ban', '封禁/解封用户', 'users'),
('帖子管理', 'posts.view', '查看帖子列表', 'posts'),
('帖子审核', 'posts.review', '审核帖子', 'posts'),
('帖子编辑', 'posts.edit', '编辑帖子', 'posts'),
('帖子删除', 'posts.delete', '删除帖子', 'posts'),
('帖子置顶', 'posts.pin', '置顶/取消置顶', 'posts'),
('帖子精华', 'posts.essence', '设置精华', 'posts'),
('评论管理', 'comments.view', '查看评论', 'comments'),
('评论删除', 'comments.delete', '删除评论', 'comments'),
('板块管理', 'categories.manage', '管理板块', 'categories'),
('公告管理', 'announcements.manage', '管理公告', 'announcements'),
('系统配置', 'system.config', '系统配置', 'system'),
('AI配置', 'system.ai', 'AI服务配置', 'system'),
('存储配置', 'system.storage', '存储配置', 'system'),
('数据库配置', 'system.database', '数据库配置', 'system'),
('备案配置', 'system.icp', '备案信息配置', 'system'),
('敏感词管理', 'system.sensitive', '敏感词管理', 'system'),
('角色管理', 'roles.manage', '管理员角色管理', 'roles'),
('权限管理', 'permissions.manage', '权限管理', 'permissions'),
('OAuth配置', 'oauth.manage', '第三方登录配置', 'oauth'),
('查看日志', 'logs.view', '查看操作日志', 'logs');

-- ========================================
-- 插入默认OAuth配置
-- ========================================
INSERT INTO oauth_providers (provider_code, provider_name, icon, is_enabled) VALUES
('google', 'Google', '/icons/google.svg', FALSE),
('apple', 'Apple', '/icons/apple.svg', FALSE),
('microsoft', 'Microsoft', '/icons/microsoft.svg', FALSE);

-- ========================================
-- 修改users表添加字段
-- ========================================
ALTER TABLE users 
ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE COMMENT '邮箱是否验证' AFTER email,
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE COMMENT '是否是管理员' AFTER status,
ADD COLUMN admin_role_id INT DEFAULT NULL COMMENT '管理员角色ID' AFTER is_admin,
ADD COLUMN deleted_at TIMESTAMP NULL COMMENT '删除时间' AFTER updated_at,
ADD INDEX idx_admin_role (admin_role_id);

-- ========================================
-- 创建用户权限视图
-- ========================================
CREATE OR REPLACE VIEW user_permissions_view AS
SELECT 
  u.id AS user_id,
  u.username,
  u.role,
  u.is_admin,
  ar.role_name AS admin_role_name,
  ar.role_code AS admin_role_code,
  ar.permissions AS admin_permissions,
  CASE 
    WHEN u.is_admin = TRUE AND ar.is_system = TRUE THEN TRUE
    ELSE FALSE
  END AS is_system_admin
FROM users u
LEFT JOIN admin_roles ar ON u.admin_role_id = ar.id
WHERE u.status != 'deleted';
