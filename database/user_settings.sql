-- ========================================
-- 地球OL数据库 - 用户个性化功能扩展
-- ========================================

USE earthol;

-- ========================================
-- 1. 用户设置表
-- ========================================
CREATE TABLE IF NOT EXISTS user_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  
  -- 界面设置
  theme ENUM('light', 'dark', 'system') DEFAULT 'system' COMMENT '主题：浅色/深色/跟随系统',
  theme_color VARCHAR(20) DEFAULT '#00d4ff' COMMENT '主题颜色',
  language ENUM('zh-CN', 'zh-TW', 'en', 'ja', 'ko') DEFAULT 'zh-CN' COMMENT '界面语言',
  
  -- 通知设置
  notify_like BOOLEAN DEFAULT TRUE COMMENT '点赞通知',
  notify_comment BOOLEAN DEFAULT TRUE COMMENT '评论通知',
  notify_follow BOOLEAN DEFAULT TRUE COMMENT '关注通知',
  notify_message BOOLEAN DEFAULT TRUE COMMENT '私信通知',
  notify_system BOOLEAN DEFAULT TRUE COMMENT '系统通知',
  notify_email BOOLEAN DEFAULT FALSE COMMENT '邮件通知',
  
  -- 交互模式
  interaction_mode ENUM('text', 'voice', 'immersive') DEFAULT 'text' COMMENT '交互模式',
  auto_play_voice BOOLEAN DEFAULT FALSE COMMENT '自动播放语音',
  show_online_status BOOLEAN DEFAULT TRUE COMMENT '显示在线状态',
  
  -- 隐私设置
  profile_public BOOLEAN DEFAULT TRUE COMMENT '个人资料公开',
  show_activity BOOLEAN DEFAULT TRUE COMMENT '显示活动状态',
  allow_stranger_message BOOLEAN DEFAULT FALSE COMMENT '允许陌生人私信',
  
  -- 其他设置
  homepage_tab ENUM('global', 'forum', 'ai', 'chat') DEFAULT 'global' COMMENT '首页默认标签',
  post_per_page INT DEFAULT 20 COMMENT '每页帖子数',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- ========================================
-- 2. 通知表
-- ========================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '接收用户ID',
  
  -- 通知类型
  type ENUM('like', 'comment', 'follow', 'mention', 'system', 'message', 'announcement') NOT NULL COMMENT '类型',
  
  -- 内容
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT COMMENT '内容',
  
  -- 关联数据
  related_type VARCHAR(50) COMMENT '关联类型：post/comment/user等',
  related_id INT COMMENT '关联ID',
  
  -- 状态
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  
  -- 时间
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';

-- ========================================
-- 3. 浏览历史表
-- ========================================
CREATE TABLE IF NOT EXISTS browse_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  
  -- 浏览类型
  type ENUM('post', 'ai_chat', 'forum', 'profile', 'region') NOT NULL COMMENT '浏览类型',
  
  -- 关联数据
  target_id INT COMMENT '目标ID',
  target_title VARCHAR(200) COMMENT '目标标题',
  target_url VARCHAR(500) COMMENT '目标URL',
  
  -- 浏览信息
  view_duration INT DEFAULT 0 COMMENT '浏览时长(秒)',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='浏览历史表';

-- ========================================
-- 4. 用户关注表
-- ========================================
CREATE TABLE IF NOT EXISTS follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  follower_id INT NOT NULL COMMENT '关注者ID',
  following_id INT NOT NULL COMMENT '被关注者ID',
  
  status ENUM('active', 'muted') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注表';

-- ========================================
-- 5. 用户积分记录表（扩展）
-- ========================================
CREATE TABLE IF NOT EXISTS score_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  
  action VARCHAR(50) NOT NULL COMMENT '动作类型',
  score INT NOT NULL COMMENT '积分变化',
  reason VARCHAR(200) COMMENT '原因',
  
  related_type VARCHAR(50) COMMENT '关联类型',
  related_id INT COMMENT '关联ID',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分记录表';

-- ========================================
-- 初始化默认设置
-- ========================================

-- 为已有用户创建设置记录
INSERT INTO user_settings (user_id, theme, language) 
SELECT id, 'system', 'zh-CN' FROM users 
WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_settings.user_id = users.id);
