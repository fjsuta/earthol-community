import { Request, Response, Router } from 'express';
import configService from '../services/configService';
import unifiedAIService from '../services/unifiedAIService';

const router = Router();

// 权限检查中间件 - 简化版，实际应使用JWT验证
const checkAdmin = (req: Request, res: Response, next: Function) => {
  next();
};

// ============ 系统信息 ============
router.get('/system/info', checkAdmin, async (req: Request, res: Response) => {
  try {
    const info = await configService.getSystemInfo();
    res.json({ success: true, data: info });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : '获取系统信息失败' });
  }
});

// ============ 系统配置 ============
router.get('/configs/system', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const configs = await configService.getAllSystemConfigs(category as string);
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取配置失败' });
  }
});

router.post('/configs/system', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { key, value, type, description, category } = req.body;
    await configService.setSystemConfig(key, value, type, description, category);
    res.json({ success: true, message: '配置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新配置失败' });
  }
});

// ============ AI配置 ============
router.get('/configs/ai', checkAdmin, async (req: Request, res: Response) => {
  try {
    const providers = await configService.getAllAIProviders();
    res.json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取AI配置失败' });
  }
});

router.post('/configs/ai', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = await configService.createAIProviderConfig(req.body);
    res.json({ success: true, data: { id }, message: 'AI配置已创建' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建AI配置失败' });
  }
});

router.put('/configs/ai/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.updateAIProviderConfig(parseInt(req.params.id), req.body);
    res.json({ success: true, message: 'AI配置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新AI配置失败' });
  }
});

router.delete('/configs/ai/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.deleteAIProviderConfig(parseInt(req.params.id));
    res.json({ success: true, message: 'AI配置已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除AI配置失败' });
  }
});

router.post('/configs/ai/:id/test', checkAdmin, async (req: Request, res: Response) => {
  try {
    const result = await configService.testAIProviderConfig(parseInt(req.params.id));
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: '测试失败' });
  }
});

// ============ 存储配置 ============
router.get('/configs/storage', checkAdmin, async (req: Request, res: Response) => {
  try {
    const configs = await configService.getAllStorageConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取存储配置失败' });
  }
});

router.post('/configs/storage', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = await configService.createStorageConfig(req.body);
    res.json({ success: true, data: { id }, message: '存储配置已创建' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建存储配置失败' });
  }
});

router.put('/configs/storage/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.updateStorageConfig(parseInt(req.params.id), req.body);
    res.json({ success: true, message: '存储配置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新存储配置失败' });
  }
});

router.delete('/configs/storage/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.deleteStorageConfig(parseInt(req.params.id));
    res.json({ success: true, message: '存储配置已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除存储配置失败' });
  }
});

router.post('/configs/storage/:id/test', checkAdmin, async (req: Request, res: Response) => {
  try {
    const result = await configService.testStorageConfig(parseInt(req.params.id));
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: '测试失败' });
  }
});

// ============ 数据库配置 ============
router.get('/configs/database', checkAdmin, async (req: Request, res: Response) => {
  try {
    const configs = await configService.getAllDatabaseConfigs();
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取数据库配置失败' });
  }
});

router.post('/configs/database', checkAdmin, async (req: Request, res: Response) => {
  try {
    const id = await configService.createDatabaseConfig(req.body);
    res.json({ success: true, data: { id }, message: '数据库配置已创建' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建数据库配置失败' });
  }
});

router.put('/configs/database/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.updateDatabaseConfig(parseInt(req.params.id), req.body);
    res.json({ success: true, message: '数据库配置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新数据库配置失败' });
  }
});

router.delete('/configs/database/:id', checkAdmin, async (req: Request, res: Response) => {
  try {
    await configService.deleteDatabaseConfig(parseInt(req.params.id));
    res.json({ success: true, message: '数据库配置已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除数据库配置失败' });
  }
});

router.post('/configs/database/:id/test', checkAdmin, async (req: Request, res: Response) => {
  try {
    const result = await configService.testDatabaseConfig(parseInt(req.params.id));
    res.json({ success: result.success, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: '测试失败' });
  }
});

// ============ 备案信息配置 ============
router.get('/configs/icp', checkAdmin, async (req: Request, res: Response) => {
  try {
    const [rows] = await configService.pool.execute('SELECT * FROM system_configs WHERE config_key LIKE "icp_%"');
    const configs: any = {};
    (rows as any[]).forEach(row => {
      configs[row.config_key] = row.config_value;
    });
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取备案信息失败' });
  }
});

router.post('/configs/icp', checkAdmin, async (req: Request, res: Response) => {
  try {
    const { 
      icp_number, 
      icp_url, 
      police_number, 
      police_url, 
      copyright_text, 
      show_footer 
    } = req.body;

    // 更新所有备案相关配置
    if (icp_number !== undefined) {
      await configService.setSystemConfig('icp_number', icp_number, 'string', 'ICP备案号', 'site');
    }
    if (icp_url !== undefined) {
      await configService.setSystemConfig('icp_url', icp_url, 'string', 'ICP备案链接', 'site');
    }
    if (police_number !== undefined) {
      await configService.setSystemConfig('icp_police_number', police_number, 'string', '公安备案号', 'site');
    }
    if (police_url !== undefined) {
      await configService.setSystemConfig('icp_police_url', police_url, 'string', '公安备案链接', 'site');
    }
    if (copyright_text !== undefined) {
      await configService.setSystemConfig('copyright_text', copyright_text, 'string', '版权信息', 'site');
    }
    if (show_footer !== undefined) {
      await configService.setSystemConfig('show_footer', show_footer, 'boolean', '显示页脚备案信息', 'site');
    }

    res.json({ success: true, message: '备案信息已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新备案信息失败' });
  }
});

// ============ 公开配置接口（前端获取备案等信息） ============
router.get('/public/config', async (req: Request, res: Response) => {
  try {
    const [rows] = await configService.pool.execute(
      'SELECT config_key, config_value FROM system_configs WHERE is_public = TRUE'
    );
    
    const configs: any = {};
    (rows as any[]).forEach(row => {
      configs[row.config_key] = row.config_value;
    });
    
    // 确保默认值
    if (!configs.show_footer) configs.show_footer = 'false';
    
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取配置失败' });
  }
});

export default router;
