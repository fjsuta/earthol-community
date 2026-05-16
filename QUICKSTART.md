
# 快速启动指南

## 环境准备

确保你已安装：
- Node.js 18+
- Docker (可选，推荐)
- MySQL 8.0+ (如果不使用Docker)
- Redis 7.0+ (如果不使用Docker)

## 方式一：Docker Compose 一键启动（最简单）

1. 克隆项目
```bash
cd /workspace
```

2. 启动所有服务
```bash
docker-compose up -d
```

3. 等待服务初始化（约1-2分钟）

4. 访问应用
- 前端：http://localhost
- 后端API：http://localhost:3001

5. 查看服务状态
```bash
docker-compose ps
```

6. 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看单个服务日志
docker-compose logs -f client
docker-compose logs -f server
```

## 方式二：本地开发启动

### 后端启动

1. 进入后端目录
```bash
cd /workspace/server
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和Redis连接信息
```

4. 确保MySQL和Redis已运行

5. 启动后端服务
```bash
npm run dev
```

后端会在 http://localhost:3001 启动

### 前端启动

1. 打开新的终端，进入前端目录
```bash
cd /workspace/client
```

2. 安装依赖
```bash
npm install
```

3. 启动前端开发服务器
```bash
npm run dev
```

前端会在 http://localhost:5173 启动

## 功能体验

### 1. 数据大屏
- 访问首页查看全球实时人口统计
- 查看全球大区分层
- 观察实时事件流

### 2. 论坛社区
- 点击导航栏进入论坛
- 查看和发布帖子
- 发表评论

### 3. AI对话
- 点击AI对话进入聊天界面
- 与AI助手聊天
- 查看思维链（可选）

### 4. 全球聊天室
- 点击聊天室进入
- 查看在线玩家
- 发送实时消息

## AI配置（可选）

### 使用本地Ollama

1. 安装Ollama：https://ollama.com/
2. 下载模型
```bash
ollama pull qwen2.5:7b
```
3. 配置环境变量
```
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

### 使用DeepSeek云端API

1. 获取API Key：https://platform.deepseek.com/
2. 配置环境变量
```
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=你的API密钥
```

## 常见问题

### Docker服务启动失败
- 检查端口是否被占用（80, 3001, 3306, 6379）
- 查看日志：`docker-compose logs`

### 数据库连接失败
- 确认MySQL服务正在运行
- 检查.env中的数据库配置是否正确

### 前端无法连接后端
- 确认后端服务已启动
- 检查API地址配置
- 检查CORS配置

### AI无法响应
- 检查AI服务配置
- 确认Ollama正在运行或API Key有效
- 查看后端日志
