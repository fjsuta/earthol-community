import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import earthRoutes from './routes/earth';
import forumRoutes from './routes/forum';
import aiRoutes from './routes/ai';
import authRoutes from './routes/auth';
import socialRoutes from './routes/social';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import configRoutes from './routes/config';
import regionsRoutes from './routes/regions';
import { populationService } from './services/populationService';
import { sensitiveWordMiddleware } from './middleware/contentFilter';
import redisClient from './config/redis';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const PORT = parseInt(process.env.PORT || '3001');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(sensitiveWordMiddleware);

app.use('/api/earth', earthRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/config', configRoutes);
app.use('/api', regionsRoutes);
app.use('/api/features', regionsRoutes); // 区域路由

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const onlineUsers = new Map<string, { id: string; username: string }>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (data) => {
    onlineUsers.set(socket.id, { id: socket.id, username: data.username || '匿名玩家' });
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  socket.on('chatMessage', (data) => {
    io.emit('chatMessage', {
      id: Date.now(),
      user: onlineUsers.get(socket.id)?.username,
      content: data.content,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

async function startServer() {
  try {
    await redisClient.connect();
    console.log('✅ Redis连接成功');
    
    setInterval(() => {
      populationService.updatePopulation();
      
      io.emit('populationUpdate', populationService.getCurrentData());
      
      if (Math.random() < 0.7) {
        populationService.simulateBirth();
        io.emit('birthEvent', { id: Date.now(), type: 'birth' });
      }
      if (Math.random() < 0.3) {
        populationService.simulateDeath();
        io.emit('deathEvent', { id: Date.now(), type: 'death' });
      }
    }, 1000);
    
    cron.schedule('0 0 * * *', () => {
      populationService.resetDaily();
      populationService.saveToDatabase();
    });
    
    cron.schedule('0 0 1 1 *', () => {
      populationService.resetYearly();
    });
    
    server.listen(PORT, () => {
      console.log('');
      console.log('🌍 ═══════════════════════════════════════════');
      console.log('   地球OL服务器启动成功！');
      console.log('   ───────────────────────────────────');
      console.log(`   📍 服务器地址: http://localhost:${PORT}`);
      console.log('   📋 API路由已注册:');
      console.log('      ├─ /api/earth   - 地球数据');
      console.log('      ├─ /api/forum  - 论坛系统');
      console.log('      ├─ /api/ai     - AI对话');
      console.log('      ├─ /api/auth   - 用户认证');
      console.log('      ├─ /api/social - 社交功能');
      console.log('      ├─ /api/admin  - 管理后台');
      console.log('      ├─ /api/user   - 用户中心');
      console.log('      ├─ /api/config - 配置管理');
      console.log('      └─ /api/regions - 多区域管理');
      console.log('🌍 ═══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
  }
}

startServer();
