import express from 'express';
import axios from 'axios';
import pool from '../config/database';
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

// 获取所有可用的区域节点列表并计算实时延迟
router.get('/regions/status', async (req, res) => {
  try {
    // 从数据库加载自定义节点
    let customNodes: RegionNode[] = [];
    try {
      const [customRows] = await pool.execute(
        'SELECT config_value FROM system_configs WHERE config_key = ?',
        ['custom_regions']
      );
      
      if ((customRows as any[]).length > 0) {
        const customConfig = JSON.parse((customRows as any[])[0].config_value);
        if (customConfig && Array.isArray(customConfig)) {
          customNodes = customConfig;
        }
      }
    } catch (error) {
      console.error('Failed to load custom regions:', error);
    }

    // 合并默认节点和自定义节点
    const allRegions: RegionNode[] = [
      ...REGIONS_CONFIG,
      ...customNodes.filter(cn => !REGIONS_CONFIG.some(dn => dn.id === cn.id))
    ];

    // 并发向所有节点发起轻量级 HEAD 请求，计算延迟
    const regionsWithStatus: RegionStatus[] = await Promise.all(
      allRegions.map(async (region) => {
        const startTime = Date.now();
        try {
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
            latency: 9999,
            lastCheck: new Date()
          };
        }
      })
    );

    // 按延迟从小到大排序
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

// 获取公开配置（包含AI开关）
router.get('/config/public', async (req, res) => {
  try {
    const configMap: Record<string, string> = {};
    
    const [rows] = await pool.execute(
      'SELECT config_key, config_value FROM system_configs WHERE is_public = TRUE'
    );

    for (const row of rows as any[]) {
      try {
        configMap[row.config_key] = JSON.parse(row.config_value);
      } catch {
        configMap[row.config_key] = row.config_value;
      }
    }

    res.json({
      success: true,
      data: configMap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

// 检查AI功能是否启用
router.get('/features/ai', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT config_value FROM system_configs WHERE config_key = ?',
      ['ai_enabled']
    );

    const enabled = (rows as any[]).length > 0 
      ? JSON.parse((rows as any[])[0].config_value) 
      : false;

    res.json({
      success: true,
      data: { enabled }
    });
  } catch (error) {
    // 默认返回未启用
    res.json({
      success: true,
      data: { enabled: false }
    });
  }
});

export default router;
