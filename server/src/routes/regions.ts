import express from 'express';
import axios from 'axios';
import { REGIONS_CONFIG, RegionStatus, RegionNode } from '../config/regions';

const router = express.Router();

// 极简健康检查接口 - 所有节点必须实现
router.head('/ping', (req, res) => {
  res.status(200).end();
});

router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    node: process.env.NODE_ID || 'default'
  });
});

// 获取所有可用区域的列表并计算实时延迟
router.get('/regions/status', async (req, res) => {
  try {
    // 并发向所有节点发起轻量级 HEAD 请求，计算延迟
    const regionsWithStatus: RegionStatus[] = await Promise.all(
      REGIONS_CONFIG.map(async (region) => {
        const startTime = Date.now();
        try {
          // 请求该区域的 ping 接口，设置 2 秒超时
          await axios.head(`${region.apiUrl}${region.healthCheck}`, {
            timeout: 2000,
            validateStatus: () => true
          });
          const latency = Date.now() - startTime;
          return {
            ...region,
            status: 'online' as const,
            latency,
            lastCheck: new Date()
          };
        } catch (error) {
          return {
            ...region,
            status: 'offline' as const,
            latency: 9999, // 离线节点延迟设为最大值
            lastCheck: new Date()
          };
        }
      })
    );

    // 按延迟从小到大排序，方便前端直接把最快的推荐给用户
    regionsWithStatus.sort((a, b) => a.latency - b.latency);

    res.json({
      success: true,
      data: regionsWithStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取区域状态失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 获取当前节点信息
router.get('/regions/current', (req, res) => {
  res.json({
    success: true,
    data: {
      id: process.env.NODE_ID || 'default',
      name: process.env.NODE_NAME || '当前节点',
      apiUrl: process.env.API_URL || req.get('host'),
      healthCheck: '/api/ping'
    }
  });
});

export default router;
