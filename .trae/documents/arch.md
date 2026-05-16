
## 1. Architecture Design

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Vue3 SPA    │  │  Element Plus│  │  ECharts     │          │
│  │  (Frontend)  │  │  UI Library  │  │  Data Viz    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            ↕ WebSocket / HTTP
┌─────────────────────────────────────────────────────────────────┐
│                       Server Layer                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Express.js Backend                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │   API Routes │  │  Socket.IO   │  │   Cron Jobs  │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   MySQL      │  │    Redis     │  │  External    │          │
│  │  (Primary)   │  │   (Cache)    │  │   APIs       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Technology Description

- **前端**：Vue 3 + TypeScript + Vite + Element Plus + ECharts + Socket.io Client
- **后端**：Node.js + Express + TypeScript + Socket.io
- **数据库**：MySQL 8.0 + Redis 7.0
- **AI模块**：支持 Ollama / DeepSeek / 云端模型双适配
- **部署**：Docker Compose 一键部署

## 3. Route Definitions

### Frontend Routes
| Route | Purpose |
|-------|---------|
| / | 首页/数据大屏 |
| /forum | 论坛列表 |
| /forum/:id | 帖子详情 |
| /chat | AI对话 |
| /chatroom | 聊天室 |
| /user/:id | 用户中心 |
| /admin | 管理后台 |

### Backend API Routes
| Method | Route | Purpose |
|--------|-------|---------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/earth/data | 获取实时人口数据 |
| GET | /api/regions | 获取大区列表 |
| GET | /api/forum/categories | 获取论坛板块 |
| GET | /api/forum/posts | 获取帖子列表 |
| POST | /api/forum/posts | 发布帖子 |
| GET | /api/forum/posts/:id | 获取帖子详情 |
| POST | /api/forum/comments | 发布评论 |
| POST | /api/ai/chat | AI对话 |

## 4. Data Model

### 4.1 ER Diagram
```
User (1) ── (N) ForumPost
User (1) ── (N) ForumComment
User (1) ── (N) AIChatMemory
User (1) ── (N) PrivateMessage
ForumCategory (1) ── (N) ForumPost
ForumPost (1) ── (N) ForumComment
Region (1) ── (N) User
```

### 4.2 Table Definitions

#### users (用户表)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  region_id INT,
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### forum_categories (论坛板块表)
```sql
CREATE TABLE forum_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### forum_posts (帖子表)
```sql
CREATE TABLE forum_posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES forum_categories(id)
);
```

#### forum_comments (评论表)
```sql
CREATE TABLE forum_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT,
  content TEXT NOT NULL,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES forum_comments(id)
);
```

#### earth_data (全球实时数据表)
```sql
CREATE TABLE earth_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  current_population BIGINT NOT NULL,
  today_births INT DEFAULT 0,
  today_deaths INT DEFAULT 0,
  today_net INT DEFAULT 0,
  year_births INT DEFAULT 0,
  year_deaths INT DEFAULT 0,
  year_net INT DEFAULT 0,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### region_data (大区数据表)
```sql
CREATE TABLE region_data (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  population BIGINT,
  version_type ENUM('new', 'old', 'primitive', 'high_risk') NOT NULL,
  is_continuous BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ai_chat_memory (AI对话记忆表)
```sql
CREATE TABLE ai_chat_memory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  content TEXT NOT NULL,
  thinking_chain TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### private_messages (私信表)
```sql
CREATE TABLE private_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_user_id INT NOT NULL,
  to_user_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);
```

## 5. Deployment Architecture

- Docker Compose 编排
- 前端构建静态文件由 Nginx 服务
- 后端 API 容器化部署
- MySQL 和 Redis 容器化
- 支持本地 Ollama 或云端 AI API
