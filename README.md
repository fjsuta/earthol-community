
&lt;div align="center"&gt;

  [![EarthOL Logo](https://raw.githubusercontent.com/earthol/brand/main/logo-full.svg)](https://github.com/earthol/earthol-community)

  # 🌍 EarthOL - 全球玩家社区

  **以真实地球为唯一服务器的全球玩家开源社区**

  [![GitHub stars](https://img.shields.io/github/stars/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/network/members)
  [![GitHub watchers](https://img.shields.io/github/watchers/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/watchers)
  [![GitHub license](https://img.shields.io/github/license/earthol/earthol-community)](https://github.com/earthol/earthol-community/blob/main/LICENSE)
  [![GitHub contributors](https://img.shields.io/github/contributors/earthol/earthol-community)](https://github.com/earthol/earthol-community/graphs/contributors)
  [![GitHub last commit](https://img.shields.io/github/last-commit/earthol/earthol-community)](https://github.com/earthol/earthol-community/commits/main)
  [![GitHub issues](https://img.shields.io/github/issues/earthol/earthol-community)](https://github.com/earthol/earthol-community/issues)
  [![GitHub pull requests](https://img.shields.io/github/issues-pr/earthol/earthol-community)](https://github.com/earthol/earthol-community/pulls)

  [English](#-english) | [中文](#-中文)

  ---

  [![Demo](https://img.shields.io/badge/Demo-🌍-blue)](https://demo.earthol.org)
  [![Website](https://img.shields.io/badge/Website-🌐-green)](https://earthol.org)
  [![Discord](https://img.shields.io/badge/Discord-💬-purple)](https://discord.gg/earthol)
  [![Twitter](https://img.shields.io/badge/Twitter-🐦-blue)](https://twitter.com/earthol_official)
  [![WeChat](https://img.shields.io/badge/WeChat-📱-green)](https://mp.weixin.qq.com/s/xxx)

  ---

  **🌍 地球46亿年开服，人类无官方主线任务**
  **🌏 所有人生剧本，全靠玩家主动探索**
  **🌎 100%开源，无阉割，无闭源模块**

  [![EarthOL Preview](https://raw.githubusercontent.com/earthol/brand/main/preview.jpg)](https://demo.earthol.org)

  [Features](#features) | [Quick Start](#quick-start) | [Documentation](#documentation) | [Contribute](#contribute) | [Join Us](#join-us)

&lt;/div&gt;

---

## 🌐 English

### 📖 What is EarthOL?

EarthOL is an open-source global community platform designed around a bold and creative concept: **the real world is the only server**.

It combines real-time global population statistics, a complete forum community, AI-powered assistants, and an immersive voice-first communication experience.

### 🎯 Core Concepts

1. **Earth has been live for 4.6 billion years - No official main quest**
2. **All life stories and knowledge are discovered and shared by players**
3. **Voice-first communication - Text only for records, archives, and systems**
4. **Global unique continuous civilization: Huaxia Server**
5. **Real-time stats: Online players, births, deaths, region version tiers**
6. **AI without scripts - Independent thinking chain, passive-only responses**

### ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📊 Real-Time Data Dashboard | ✅ | Global population statistics, region tiers |
| 🌐 Forum Community | ✅ | Categories, posts, comments, likes, favorites |
| 🤖 AI Assistant | ✅ | Chain-of-thought reasoning, no scripted dialogues |
| 💬 Global Chat | ✅ | WebSocket real-time communication |
| 👥 User System | ✅ | Registration, roles, profiles, privacy settings |
| 🔔 Notifications | ✅ | Likes, comments, follows, system notifications |
| 🎨 Theme System | ✅ | Light/Dark/System, custom colors, 5 languages |
| 🔍 Search | ✅ | Global search for posts, users, categories |
| 📜 Browse History | ✅ | Track your exploration journey |
| 👤 Profiles &amp; Follows | ✅ | User profiles, followers, following |

### 🛠️ Tech Stack

#### Frontend
- **Vue 3** + **Vite** - Modern, fast, type-safe
- **Element Plus** - Beautiful UI components
- **ECharts** - Stunning data visualization
- **Socket.io** - Real-time communication
- **Pinia** - State management
- **Vue Router** - SPA routing

#### Backend
- **Node.js** + **Express** - Lightweight and efficient
- **TypeScript** - Type-safe development
- **MySQL 8.0** - Primary database
- **Redis 7.0** - Caching layer
- **Socket.io** - WebSocket server
- **Cron** - Scheduled tasks
- **AI Adapter** - Support for Ollama &amp; DeepSeek

#### Deployment
- **Docker** + **Docker Compose** - One-click deployment
- **Nginx** - Reverse proxy

### 🚀 Quick Start

#### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/earthol/earthol-community.git
cd earthol-community

# Start all services
docker-compose up -d

# Wait for services to initialize
# Visit: http://localhost (frontend)
# Visit: http://localhost:3001 (backend API)
```

#### Option 2: Local Development

**Prerequisites:**
- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- (Optional) Ollama or DeepSeek API Key

**Backend:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MySQL and Redis configuration
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
# Visit: http://localhost:5173
```

### 📚 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [API Documentation](./.trae/documents/arch.md)
- [Database Schema](./database/init.sql)

### 🤝 Contribute

We welcome contributions from everyone! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

### 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=earthol/earthol-community&amp;type=Date)](https://star-history.com/#earthol/earthol-community&amp;Date)

---

## 🇨🇳 中文

### 📖 什么是地球OL？

地球OL是一个开源的全球社区平台，围绕着一个大胆而富有创意的理念构建：**真实的世界就是唯一的服务器**。

它结合了实时全球人口统计、完整的论坛社区、AI智能助手和沉浸式的语音优先通信体验。

### 🎯 核心世界观

1. **地球46亿年开服，人类无官方主线任务**
2. **所有人生剧本、认知、阅历，全靠玩家主动探索、打听、挖掘**
3. **日常交流优先纯语音，文字只用于实物留存、典籍、石刻、电子系统**
4. **全球唯一不断代文明大区：华夏服**
5. **实时统计：全球在线、新增、死亡、大区版本分层**
6. **AI 无脚本、自带思维链、不主动推送信息，完全被动应答**

### ✨ 功能特性

| 功能 | 状态 | 描述 |
|------|------|------|
| 📊 实时数据中台 | ✅ | 全球人口统计、大区分层 |
| 🌐 论坛社区 | ✅ | 板块、帖子、评论、点赞、收藏 |
| 🤖 AI智能助手 | ✅ | 思维链推理、无脚本对话 |
| 💬 全球公屏 | ✅ | WebSocket实时通信 |
| 👥 用户系统 | ✅ | 注册、角色、资料、隐私设置 |
| 🔔 通知系统 | ✅ | 点赞、评论、关注、系统通知 |
| 🎨 主题系统 | ✅ | 浅色/深色/跟随系统、自定义颜色、5种语言 |
| 🔍 搜索功能 | ✅ | 全局搜索帖子、用户、板块 |
| 📜 浏览历史 | ✅ | 记录你的探索历程 |
| 👤 个人主页与关注 | ✅ | 用户资料、粉丝、关注 |

### 🛠️ 技术栈

#### 前端
- **Vue 3** + **Vite** - 现代、快速、类型安全
- **Element Plus** - 精美的UI组件
- **ECharts** - 震撼的数据可视化
- **Socket.io** - 实时通信
- **Pinia** - 状态管理
- **Vue Router** - SPA路由

#### 后端
- **Node.js** + **Express** - 轻量高效
- **TypeScript** - 类型安全开发
- **MySQL 8.0** - 主数据库
- **Redis 7.0** - 缓存层
- **Socket.io** - WebSocket服务
- **Cron** - 定时任务
- **AI适配器** - 支持Ollama和DeepSeek

#### 部署
- **Docker** + **Docker Compose** - 一键部署
- **Nginx** - 反向代理

### 🚀 快速开始

#### 方式一：Docker Compose（推荐）

```bash
# 克隆仓库
git clone https://github.com/earthol/earthol-community.git
cd earthol-community

# 启动所有服务
docker-compose up -d

# 等待服务初始化
# 访问：http://localhost (前端)
# 访问：http://localhost:3001 (后端API)
```

#### 方式二：本地开发

**前置要求：**
- Node.js 18+
- MySQL 8.0+
- Redis 7.0+
- (可选) Ollama 或 DeepSeek API Key

**后端：**
```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 文件，配置MySQL和Redis
npm run dev
```

**前端：**
```bash
cd client
npm install
npm run dev
# 访问：http://localhost:5173
```

### 📚 文档

- [快速开始指南](./QUICKSTART.md)
- [API 文档](./.trae/documents/arch.md)
- [数据库架构](./database/init.sql)

### 🤝 贡献

我们欢迎每一个人的贡献！请阅读我们的[贡献指南](./CONTRIBUTING.md)来开始。

### 🌟 Star历史

[![Star History Chart](https://api.star-history.com/svg?repos=earthol/earthol-community&amp;type=Date)](https://star-history.com/#earthol/earthol-community&amp;Date)

---

## 🌍 Join Us / 加入我们

- 🌐 [官网](https://earthol.org)
- 📖 [博客](https://blog.earthol.org)
- 💬 [Discord](https://discord.gg/earthol)
- 🐦 [Twitter](https://twitter.com/earthol_official)
- 📱 [微信公众号](https://mp.weixin.qq.com/s/xxx)

## 📄 License / 许可证

MIT License - See [LICENSE](LICENSE) for details.

---

&lt;div align="center"&gt;

**Made with ❤️ by the EarthOL community worldwide**

[⬆️ Back to top](#)

&lt;/div&gt;
