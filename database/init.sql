-- ========================================
-- 地球OL数据库初始化脚本 - 完整版
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS earthol DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE earthol;

-- ========================================
-- 1. 用户系统表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
  email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
  avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  bio TEXT COMMENT '个人简介',
  
  -- 玩家身份信息
  role ENUM('newbie', 'senior', 'moderator', 'admin') DEFAULT 'newbie' COMMENT '角色：萌新/资深/版主/管理员',
  level INT DEFAULT 1 COMMENT '玩家等级',
  experience INT DEFAULT 0 COMMENT '经验值',
  
  -- 大区信息
  region_id INT DEFAULT NULL COMMENT '所在大区ID',
  region_name VARCHAR(100) DEFAULT '萌新试炼区' COMMENT '所在大区名称',
  
  -- 游玩风格标签
  play_style ENUM('肝帝', '佛系', '探索党', '社交达人', '独行侠', '全能玩家') DEFAULT '探索党' COMMENT '游玩风格',
  interests TEXT COMMENT '兴趣爱好标签，逗号分隔',
  
  -- 状态
  status ENUM('active', 'banned', 'restricted') DEFAULT 'active' COMMENT '账号状态',
  is_online BOOLEAN DEFAULT FALSE COMMENT '是否在线',
  last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后活跃时间',
  
  -- 统计
  post_count INT DEFAULT 0 COMMENT '发帖数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  like_count INT DEFAULT 0 COMMENT '获赞数',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_region (region_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 2. 大区表
-- ========================================
CREATE TABLE IF NOT EXISTS regions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '大区名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '大区代码',
  version_type ENUM('new', 'old', 'primitive', 'high_risk') DEFAULT 'new' COMMENT '版本类型',
  is_continuous BOOLEAN DEFAULT FALSE COMMENT '是否不断代文明',
  description TEXT COMMENT '描述',
  icon VARCHAR(100) COMMENT '图标',
  population BIGINT DEFAULT 0 COMMENT '人口数',
  online_count INT DEFAULT 0 COMMENT '在线人数',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_code (code),
  INDEX idx_version (version_type),
  INDEX idx_continuous (is_continuous)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大区表';

-- ========================================
-- 3. 论坛板块表
-- ========================================
CREATE TABLE IF NOT EXISTS forum_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '板块名称',
  description TEXT COMMENT '板块描述',
  icon VARCHAR(100) COMMENT '图标',
  color VARCHAR(20) DEFAULT '#00d4ff' COMMENT '主题色',
  type ENUM('global', 'region', 'topic') DEFAULT 'global' COMMENT '板块类型',
  region_id INT DEFAULT NULL COMMENT '所属大区(区域板块用)',
  sort_order INT DEFAULT 0 COMMENT '排序',
  topic_count INT DEFAULT 0 COMMENT '帖子数',
  post_count INT DEFAULT 0 COMMENT '总帖子数',
  
  -- 权限设置
  view_permission ENUM('all', 'member', 'senior', 'vip') DEFAULT 'all' COMMENT '浏览权限',
  post_permission ENUM('all', 'member', 'senior', 'vip') DEFAULT 'member' COMMENT '发帖权限',
  min_level INT DEFAULT 1 COMMENT '最低等级要求',
  
  -- 审核设置
  require_review BOOLEAN DEFAULT FALSE COMMENT '是否需要审核',
  allow_media BOOLEAN DEFAULT TRUE COMMENT '是否允许多媒体',
  
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  is_system BOOLEAN DEFAULT FALSE COMMENT '是否系统板块',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_region (region_id),
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论坛板块表';

-- ========================================
-- 4. 帖子表
-- ========================================
CREATE TABLE IF NOT EXISTS forum_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '作者ID',
  category_id INT NOT NULL COMMENT '板块ID',
  
  -- 内容
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '内容',
  content_type ENUM('normal', 'long_form', 'experience', 'guide') DEFAULT 'normal' COMMENT '内容类型',
  summary VARCHAR(500) COMMENT '摘要',
  
  -- 媒体
  images JSON DEFAULT NULL COMMENT '图片列表',
  attachments JSON DEFAULT NULL COMMENT '附件列表',
  
  -- 统计
  view_count INT DEFAULT 0 COMMENT '浏览数',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  collect_count INT DEFAULT 0 COMMENT '收藏数',
  share_count INT DEFAULT 0 COMMENT '分享数',
  
  -- 状态
  status ENUM('published', 'pending', 'rejected', 'deleted') DEFAULT 'published' COMMENT '状态',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  is_essence BOOLEAN DEFAULT FALSE COMMENT '是否精华',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  
  -- 审核
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT '审核状态',
  review_note VARCHAR(500) COMMENT '审核备注',
  reviewed_by INT DEFAULT NULL COMMENT '审核人ID',
  reviewed_at TIMESTAMP NULL COMMENT '审核时间',
  
  -- IP和设备
  ip_address VARCHAR(50) COMMENT 'IP地址',
  device_info VARCHAR(255) COMMENT '设备信息',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL COMMENT '删除时间',
  
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_is_pinned (is_pinned),
  INDEX idx_is_essence (is_essence),
  INDEX idx_created_at (created_at),
  INDEX idx_view_count (view_count),
  INDEX idx_like_count (like_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ========================================
-- 5. 评论表
-- ========================================
CREATE TABLE IF NOT EXISTS forum_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL COMMENT '帖子ID',
  user_id INT NOT NULL COMMENT '用户ID',
  parent_id INT DEFAULT NULL COMMENT '父评论ID(楼中楼)',
  root_id INT DEFAULT NULL COMMENT '根评论ID',
  
  -- 内容
  content TEXT NOT NULL COMMENT '评论内容',
  content_type ENUM('text', 'image', 'voice') DEFAULT 'text' COMMENT '内容类型',
  images JSON DEFAULT NULL COMMENT '图片列表',
  
  -- 层级
  level INT DEFAULT 0 COMMENT '评论层级',
  path VARCHAR(500) COMMENT '评论路径',
  
  -- 统计
  like_count INT DEFAULT 0 COMMENT '点赞数',
  reply_count INT DEFAULT 0 COMMENT '回复数',
  
  -- 状态
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  is_hidden BOOLEAN DEFAULT FALSE COMMENT '是否隐藏',
  status ENUM('published', 'pending', 'deleted') DEFAULT 'published' COMMENT '状态',
  
  -- 审核
  review_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved' COMMENT '审核状态',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_parent_id (parent_id),
  INDEX idx_root_id (root_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ========================================
-- 6. 点赞记录表
-- ========================================
CREATE TABLE IF NOT EXISTS post_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  post_id INT NOT NULL COMMENT '帖子ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_post_like (user_id, post_id),
  INDEX idx_post_id (post_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

CREATE TABLE IF NOT EXISTS comment_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  comment_id INT NOT NULL COMMENT '评论ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_comment_like (user_id, comment_id),
  INDEX idx_comment_id (comment_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞表';

-- ========================================
-- 7. 收藏表
-- ========================================
CREATE TABLE IF NOT EXISTS collections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  post_id INT NOT NULL COMMENT '帖子ID',
  folder_id INT DEFAULT NULL COMMENT '收藏夹ID',
  note VARCHAR(500) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_collection (user_id, post_id),
  INDEX idx_user_id (user_id),
  INDEX idx_folder_id (folder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

CREATE TABLE IF NOT EXISTS collection_folders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  name VARCHAR(100) NOT NULL COMMENT '文件夹名称',
  description TEXT COMMENT '描述',
  is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认文件夹',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏夹表';

-- ========================================
-- 8. 好友关系表
-- ========================================
CREATE TABLE IF NOT EXISTS friendships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  friend_id INT NOT NULL COMMENT '好友ID',
  status ENUM('pending', 'accepted', 'rejected', 'blocked') DEFAULT 'pending' COMMENT '状态',
  note VARCHAR(255) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_friendship (user_id, friend_id),
  INDEX idx_user_id (user_id),
  INDEX idx_friend_id (friend_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='好友关系表';

-- ========================================
-- 9. 私信表
-- ========================================
CREATE TABLE IF NOT EXISTS private_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_user_id INT NOT NULL COMMENT '发送者ID',
  to_user_id INT NOT NULL COMMENT '接收者ID',
  content TEXT NOT NULL COMMENT '消息内容',
  content_type ENUM('text', 'image', 'voice', 'system') DEFAULT 'text' COMMENT '内容类型',
  attachments JSON DEFAULT NULL COMMENT '附件',
  
  -- 状态
  is_read BOOLEAN DEFAULT FALSE COMMENT '是否已读',
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  is_recalled BOOLEAN DEFAULT FALSE COMMENT '是否撤回',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL COMMENT '阅读时间',
  
  INDEX idx_from_user_id (from_user_id),
  INDEX idx_to_user_id (to_user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='私信表';

-- ========================================
-- 10. 全服公屏消息表
-- ========================================
CREATE TABLE IF NOT EXISTS global_chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '消息内容',
  content_type ENUM('text', 'image', 'voice', 'system') DEFAULT 'text' COMMENT '内容类型',
  
  -- 权限等级(普通/高亮/系统)
  level ENUM('normal', 'highlight', 'system') DEFAULT 'normal' COMMENT '消息等级',
  
  -- 状态
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全服公屏消息表';

-- ========================================
-- 11. 大区聊天室消息表
-- ========================================
CREATE TABLE IF NOT EXISTS region_chat_messages (
  id INT PRIMARY KEY AUTO_KEY AUTO_INCREMENT,
  region_id INT NOT NULL COMMENT '大区ID',
  user_id INT NOT NULL COMMENT '用户ID',
  content TEXT NOT NULL COMMENT '消息内容',
  content_type ENUM('text', 'image', 'voice') DEFAULT 'text' COMMENT '内容类型',
  
  is_deleted BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_region_id (region_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大区聊天室消息表';

-- ========================================
-- 12. AI相关表
-- ========================================
CREATE TABLE IF NOT EXISTS ai_chat_memory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  role ENUM('user', 'assistant') NOT NULL COMMENT '角色',
  content TEXT NOT NULL COMMENT '对话内容',
  thinking_chain TEXT COMMENT '思维链',
  model VARCHAR(50) DEFAULT 'ollama' COMMENT '使用的模型',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话记忆表';

CREATE TABLE IF NOT EXISTS ai_personas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '人设名称',
  description TEXT COMMENT '描述',
  system_prompt TEXT NOT NULL COMMENT '系统提示词',
  
  -- 角色类型
  type ENUM('global', 'region', 'special') DEFAULT 'global' COMMENT '人设类型',
  region_id INT DEFAULT NULL COMMENT '所属大区',
  
  -- 配置
  temperature FLOAT DEFAULT 0.7 COMMENT '温度参数',
  max_tokens INT DEFAULT 1000 COMMENT '最大token数',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI人设表';

CREATE TABLE IF NOT EXISTS ai_conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  persona_id INT DEFAULT NULL COMMENT '人设ID',
  title VARCHAR(200) COMMENT '对话标题',
  last_message TEXT COMMENT '最后一条消息',
  
  message_count INT DEFAULT 0 COMMENT '消息数',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_persona_id (persona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话会话表';

-- ========================================
-- 13. 全球实时数据表
-- ========================================
CREATE TABLE IF NOT EXISTS earth_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  current_population BIGINT NOT NULL COMMENT '当前人口',
  today_births INT DEFAULT 0 COMMENT '今日新增',
  today_deaths INT DEFAULT 0 COMMENT '今日死亡',
  today_net INT DEFAULT 0 COMMENT '今日净增',
  week_births INT DEFAULT 0 COMMENT '本周新增',
  week_deaths INT DEFAULT 0 COMMENT '本周死亡',
  year_births INT DEFAULT 0 COMMENT '今年新增',
  year_deaths INT DEFAULT 0 COMMENT '今年死亡',
  online_count INT DEFAULT 0 COMMENT '在线人数',
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_recorded_at (recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全球实时数据表';

CREATE TABLE IF NOT EXISTS region_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '大区名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '大区代码',
  population BIGINT COMMENT '人口',
  online_count INT DEFAULT 0 COMMENT '在线人数',
  version_type ENUM('new', 'old', 'primitive', 'high_risk') NOT NULL COMMENT '版本类型',
  is_continuous BOOLEAN DEFAULT FALSE COMMENT '是否不断代',
  description TEXT COMMENT '描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='大区数据表';

-- ========================================
-- 14. 系统公告表
-- ========================================
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content TEXT NOT NULL COMMENT '内容',
  type ENUM('normal', 'important', 'urgent') DEFAULT 'normal' COMMENT '类型',
  level ENUM('global', 'region', 'user') DEFAULT 'global' COMMENT '范围',
  region_id INT DEFAULT NULL COMMENT '指定大区',
  user_id INT DEFAULT NULL COMMENT '指定用户',
  
  -- 显示设置
  is_pinned BOOLEAN DEFAULT FALSE COMMENT '是否置顶',
  is_popup BOOLEAN DEFAULT FALSE COMMENT '是否弹窗',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  end_time TIMESTAMP NULL COMMENT '结束时间',
  
  -- 状态
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft' COMMENT '状态',
  created_by INT NOT NULL COMMENT '创建者',
  published_at TIMESTAMP NULL COMMENT '发布时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_level (level),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  INDEX idx_end_time (end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统公告表';

-- ========================================
-- 15. 操作日志表
-- ========================================
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT DEFAULT NULL COMMENT '操作用户ID',
  username VARCHAR(50) COMMENT '用户名',
  action VARCHAR(100) NOT NULL COMMENT '操作类型',
  target_type VARCHAR(50) COMMENT '目标类型',
  target_id INT COMMENT '目标ID',
  target_name VARCHAR(255) COMMENT '目标名称',
  detail JSON COMMENT '详细信息',
  ip_address VARCHAR(50) COMMENT 'IP地址',
  user_agent TEXT COMMENT 'User-Agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_target_type (target_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ========================================
-- 16. 敏感词表
-- ========================================
CREATE TABLE IF NOT EXISTS sensitive_words (
  id INT PRIMARY KEY AUTO_INCREMENT,
  word VARCHAR(100) NOT NULL COMMENT '敏感词',
  level ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '敏感级别',
  replacement VARCHAR(100) DEFAULT '***' COMMENT '替换字符',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词表';

-- ========================================
-- 17. 用户积分表
-- ========================================
CREATE TABLE IF NOT EXISTS user_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE COMMENT '用户ID',
  total_score INT DEFAULT 0 COMMENT '总积分',
  level INT DEFAULT 1 COMMENT '等级',
  experience INT DEFAULT 0 COMMENT '经验值',
  
  -- 各类积分
  post_score INT DEFAULT 0 COMMENT '发帖积分',
  comment_score INT DEFAULT 0 COMMENT '评论积分',
  like_score INT DEFAULT 0 COMMENT '获赞积分',
  activity_score INT DEFAULT 0 COMMENT '活动积分',
  
  -- 统计
  continuous_days INT DEFAULT 0 COMMENT '连续签到天数',
  total_days INT DEFAULT 0 COMMENT '累计签到天数',
  last_sign_at DATE COMMENT '最后签到日期',
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_level (level),
  INDEX idx_total_score (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户积分表';

-- ========================================
-- 18. 签到表
-- ========================================
CREATE TABLE IF NOT EXISTS sign_in_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  sign_date DATE NOT NULL COMMENT '签到日期',
  reward_score INT DEFAULT 1 COMMENT '奖励积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_sign (user_id, sign_date),
  INDEX idx_user_id (user_id),
  INDEX idx_sign_date (sign_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='签到记录表';

-- ========================================
-- 初始化数据
-- ========================================

-- 插入大区数据
INSERT INTO regions (name, code, version_type, is_continuous, description, icon, population, sort_order) VALUES
('华夏服', 'hx', 'new', TRUE, '全球唯一不断代文明大区，5000年文明传承', '🐉', 1412000000, 1),
('北美大区', 'na', 'new', FALSE, '美洲北部区域', '🗽', 376000000, 2),
('欧洲大区', 'eu', 'old', FALSE, '欧洲区域', '🗼', 748000000, 3),
('东南亚大区', 'sea', 'new', FALSE, '东南亚区域', '🌴', 675000000, 4),
('非洲大区', 'af', 'primitive', FALSE, '非洲大陆区域', '🦁', 1426000000, 5),
('中东大区', 'me', 'high_risk', FALSE, '中东区域', '🏜️', 453000000, 6),
('南美大区', 'sa', 'new', FALSE, '南美洲区域', '💃', 430000000, 7),
('澳洲大区', 'au', 'new', FALSE, '澳洲区域', '🦘', 26000000, 8),
('萌新试炼区', 'newbie', 'new', FALSE, '新玩家试炼区域', '🌱', 0, 99);

-- 插入论坛板块
INSERT INTO forum_categories (name, description, icon, color, type, view_permission, post_permission, sort_order) VALUES
('全服吃瓜区', '全服热点话题、新鲜事分享', '🍉', '#ff9800', 'global', 'all', 'member', 1),
('华夏大区', '华夏服专属讨论区，文明传承', '🐉', '#f44336', 'region', 'all', 'member', 2),
('北美大区', '北美玩家交流区', '🗽', '#2196f3', 'region', 'all', 'member', 3),
('欧洲大区', '欧洲玩家交流区', '🗼', '#9c27b0', 'region', 'all', 'member', 4),
('东南亚大区', '东南亚玩家交流区', '🌴', '#4caf50', 'region', 'all', 'member', 5),
('非洲大区', '非洲玩家交流区', '🦁', '#795548', 'region', 'all', 'member', 6),
('玩法攻略区', '游戏技巧、攻略分享', '💡', '#00bcd4', 'topic', 'all', 'member', 7),
('文明历史研讨区', '历史探讨、文明研究', '📜', '#8b4513', 'topic', 'all', 'senior', 8),
('线下原生态交流区', '线下活动、面基交友', '🤝', '#e91e63', 'topic', 'all', 'member', 9),
('新手求助区', '新手问题咨询、答疑解惑', '🌟', '#ffeb3b', 'topic', 'all', 'all', 10),
('休闲灌水区', '闲聊八卦、放松娱乐', '☕', '#607d8b', 'topic', 'all', 'member', 11),
('长文纪实区', '深度内容、长篇分享', '📖', '#3f51b5', 'topic', 'all', 'senior', 12);

-- 插入默认AI人设
INSERT INTO ai_personas (name, description, system_prompt, type, temperature) VALUES
('全域智能助手', '全服通用的AI助手，提供信息和知识解答', '你是地球OL的全域智能助手。你不会主动推送信息或剧透，玩家不问你就不会答。你的回答基于现实世界的知识，没有预设脚本，完全靠实时推理。请保持客观中立，不主动灌输价值观。', 'global', 0.7),
('华夏文明导师', '华夏服专属的历史文化导师', '你是华夏文明导师，专注于华夏五千年文明史。你的回答带有深厚的文化底蕴，可以引用古籍、诗词、历史典故。对于华夏文明的成就保持自豪但不夸大，对其他文明保持尊重和开放态度。', 'region', 1, 0.8),
('探索向导', '帮助玩家理解游戏世界观和探索提示', '你是地球OL的探索向导。地球OL是一个没有预设剧情的开放世界，所有知识都需要玩家主动探索。你可以帮助玩家理解这个世界的运行规则，提供探索方向建议，但不能直接告诉玩家答案。', 'global', 0.9);

-- 插入默认收藏夹
INSERT INTO collection_folders (user_id, name, is_default) VALUES
(1, '默认收藏', TRUE),
(1, '攻略心得', FALSE),
(1, '待阅读', FALSE);

-- 插入初始人口数据
INSERT INTO earth_data (current_population, today_births, today_deaths, today_net, week_births, week_deaths, year_births, year_deaths, online_count) VALUES
(8390000000, 0, 0, 0, 0, 0, 0, 0, 0);

-- 插入默认公告
INSERT INTO announcements (title, content, type, level, status, created_by) VALUES
('🌍 欢迎来到地球OL', '欢迎来到地球OL全球玩家社区！这个世界没有预设剧情，所有知识都需要你主动探索。祝你玩得开心！', 'normal', 'global', 'published', 1),
('📢 社区公约', '请遵守社区规则，文明交流，尊重他人，共同维护良好的社区环境。', 'important', 'global', 'published', 1);

-- 插入示例敏感词
INSERT INTO sensitive_words (word, level) VALUES
('作弊', 'high'),
('外挂', 'high'),
('骗子', 'medium'),
('广告', 'medium');

-- 插入管理员用户（密码: admin123）
INSERT INTO users (username, email, password_hash, role, level, region_id, region_name, bio) VALUES
('系统管理员', 'admin@earthol.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'admin', 99, 1, '华夏服', '地球OL系统管理员');
