
<div align="center">

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

  [🇺🇸 English](./README-en.md) | [⬆️ 返回主页](./README.md)

  ---

  **🌍 地球46亿年开服，人类无官方主线任务**
  **🌏 所有人生剧本，全靠玩家主动探索**

  [![EarthOL Preview](https://raw.githubusercontent.com/earthol/brand/main/preview.jpg)](https://demo.earthol.org)

  [功能特性](#功能特性) | [快速开始](#快速开始) | [文档](#文档) | [贡献](#贡献) | [加入我们](#加入我们)

</div>

---

## 📖 什么是地球OL？

地球OL是一个开源的全球社区平台，围绕着一个大胆而富有创意的理念构建：**真实的世界就是唯一的服务器**。

它结合了实时全球人口统计、完整的论坛社区、AI智能助手和沉浸式的语音优先通信体验。

## 🎯 核心世界观

1. **地球46亿年开服，人类无官方主线任务**
2. **所有人生剧本、认知、阅历，全靠玩家主动探索、打听、挖掘**
3. **日常交流优先纯语音，文字只用于实物留存、典籍、石刻、电子系统**
4. **全球唯一不断代文明大区：华夏服**
5. **实时统计：全球在线、新增、死亡、大区版本分层**
6. **AI 无脚本、自带思维链、不主动推送信息，完全被动应答**

## ✨ 功能特性

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

## 🛠️ 技术栈

### 前端
- **Vue 3** + **Vite** - 现代、快速、类型安全
- **Element Plus** - 精美的UI组件
- **ECharts** - 震撼的数据可视化
- **Socket.io** - 实时通信
- **Pinia** - 状态管理
- **Vue Router** - SPA路由

### 后端
- **Node.js** + **Express** - 轻量高效
- **TypeScript** - 类型安全开发
- **MySQL 8.0** - 主数据库
- **Redis 7.0** - 缓存层
- **Socket.io** - WebSocket服务
- **Cron** - 定时任务
- **AI适配器** - 支持Ollama和DeepSeek

### 部署
- **Docker** + **Docker Compose** - 一键部署
- **Nginx** - 反向代理

## 🚀 快速开始

### 方式一：Docker Compose（推荐）

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

### 方式二：本地开发

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

## 📚 文档

- [快速开始指南](./QUICKSTART.md)
- [API 文档](./.trae/documents/arch.md)
- [数据库架构](./database/init.sql)

## 🤝 贡献

我们欢迎每一个人的贡献！请阅读我们的[贡献指南](./CONTRIBUTING.md)来开始。

## 🌟 Star历史

[![Star History Chart](https://api.star-history.com/svg?repos=earthol/earthol-community&type=Date)](https://star-history.com/#earthol/earthol-community&Date)

---

## 🌍 加入我们

- 📧 [邮箱](mailto:replab@zohomail.cn)
- 📱 [微博](https://weibo.com/u/7799762062)
- 💬 [QQ频道](https://pd.qq.com/s/6giv7fcac?b=9)
- 🌐 [软天空](http://a.ruansky.com/user/8615546/)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)。

---

<div align="center">

**Made with ❤️ by the EarthOL community worldwide**

[⬆️ 返回顶部](#)

</div>
