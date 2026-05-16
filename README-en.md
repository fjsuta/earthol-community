
<div align="center">

  [![EarthOL Logo](https://raw.githubusercontent.com/earthol/brand/main/logo-full.svg)](https://github.com/earthol/earthol-community)

  # 🌍 EarthOL - Global Player Community

  **An open-source community platform with the real world as the only server**

  [![GitHub stars](https://img.shields.io/github/stars/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/stargazers)
  [![GitHub forks](https://img.shields.io/github/forks/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/network/members)
  [![GitHub watchers](https://img.shields.io/github/watchers/earthol/earthol-community?style=social)](https://github.com/earthol/earthol-community/watchers)
  [![GitHub license](https://img.shields.io/github/license/earthol/earthol-community)](https://github.com/earthol/earthol-community/blob/main/LICENSE)
  [![GitHub contributors](https://img.shields.io/github/contributors/earthol/earthol-community)](https://github.com/earthol/earthol-community/graphs/contributors)
  [![GitHub last commit](https://img.shields.io/github/last-commit/earthol/earthol-community)](https://github.com/earthol/earthol-community/commits/main)
  [![GitHub issues](https://img.shields.io/github/issues/earthol/earthol-community)](https://github.com/earthol/earthol-community/issues)
  [![GitHub pull requests](https://img.shields.io/github/issues-pr/earthol/earthol-community)](https://github.com/earthol/earthol-community/pulls)

  [🇨🇳 中文](./README-zh.md) | [⬆️ Back to Main](./README.md)

  ---

  **🌍 Earth has been live for 4.6 billion years - No official main quest**
  **🌏 All life stories and knowledge are discovered and shared by players**

  [![EarthOL Preview](https://raw.githubusercontent.com/earthol/brand/main/preview.jpg)](https://demo.earthol.org)

  [Features](#features) | [Quick Start](#quick-start) | [Documentation](#documentation) | [Contribute](#contribute) | [Join Us](#join-us)

</div>

---

## 📖 What is EarthOL?

EarthOL is an open-source global community platform designed around a bold and creative concept: **the real world is the only server**.

It combines real-time global population statistics, a complete forum community, AI-powered assistants, and an immersive voice-first communication experience.

## 🎯 Core Concepts

1. **Earth has been live for 4.6 billion years - No official main quest**
2. **All life stories and knowledge are discovered and shared by players**
3. **Voice-first communication - Text only for records, archives, and systems**
4. **Global unique continuous civilization: Huaxia Server**
5. **Real-time stats: Online players, births, deaths, region version tiers**
6. **AI without scripts - Independent thinking chain, passive-only responses**

## ✨ Features

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

## 🛠️ Tech Stack

### Frontend
- **Vue 3** + **Vite** - Modern, fast, type-safe
- **Element Plus** - Beautiful UI components
- **ECharts** - Stunning data visualization
- **Socket.io** - Real-time communication
- **Pinia** - State management
- **Vue Router** - SPA routing

### Backend
- **Node.js** + **Express** - Lightweight and efficient
- **TypeScript** - Type-safe development
- **MySQL 8.0** - Primary database
- **Redis 7.0** - Caching layer
- **Socket.io** - WebSocket server
- **Cron** - Scheduled tasks
- **AI Adapter** - Support for Ollama &amp; DeepSeek

### Deployment
- **Docker** + **Docker Compose** - One-click deployment
- **Nginx** - Reverse proxy

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

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

### Option 2: Local Development

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

## 📚 Documentation

- [Quick Start Guide](./QUICKSTART.md)
- [API Documentation](./.trae/documents/arch.md)
- [Database Schema](./database/init.sql)

## 🤝 Contribute

We welcome contributions from everyone! Please read our [Contributing Guide](./CONTRIBUTING.md) to get started.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=earthol/earthol-community&type=Date)](https://star-history.com/#earthol/earthol-community&Date)

---

## 🌍 Join Us

- 📧 [Email](mailto:replab@zohomail.cn)
- 📱 [Weibo](https://weibo.com/u/7799762062)
- 💬 [QQ Channel](https://pd.qq.com/s/6giv7fcac?b=9)
- 🌐 [Ruansky](http://a.ruansky.com/user/8615546/)

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with ❤️ by the EarthOL community worldwide**

[⬆️ Back to top](#)

</div>
