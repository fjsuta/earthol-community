// 多区域节点配置
// 实际生产环境建议通过环境变量或配置文件读取

export interface RegionNode {
  id: string;
  name: string;
  apiUrl: string;
  healthCheck: string;
  flag?: string; // 国旗 emoji
}

export const REGIONS_CONFIG: RegionNode[] = [
  {
    id: 'cn-sichuan',
    name: '四川主节点',
    apiUrl: 'https://sc.api.earthol.com',
    healthCheck: '/api/ping',
    flag: '🇨🇳'
  },
  {
    id: 'us-west',
    name: '北美硅谷节点',
    apiUrl: 'https://us.api.earthol.com',
    healthCheck: '/api/ping',
    flag: '🇺🇸'
  },
  {
    id: 'sg-node',
    name: '新加坡加速节点',
    apiUrl: 'https://sg.api.earthol.com',
    healthCheck: '/api/ping',
    flag: '🇸🇬'
  },
  {
    id: 'eu-frankfurt',
    name: '欧洲法兰克福节点',
    apiUrl: 'https://eu.api.earthol.com',
    healthCheck: '/api/ping',
    flag: '🇩🇪'
  },
  {
    id: 'local-dev',
    name: '本地开发节点',
    apiUrl: 'http://localhost:3001',
    healthCheck: '/api/ping',
    flag: '💻'
  }
];

export interface RegionStatus extends RegionNode {
  status: 'online' | 'offline';
  latency: number; // 毫秒
  lastCheck?: Date;
}
