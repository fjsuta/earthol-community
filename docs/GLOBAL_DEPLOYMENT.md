# 网站全球化部署与智能区域切换功能

## 一、系统架构概览

本系统为 Web 应用构建具备"低延迟访问"、"高可用性"且支持"用户自主选区"的全球服务网络。

### 核心组件

- **智能调度层（GeoDNS）**：基于用户 IP 地理位置，将域名解析至物理距离最近的入口节点
- **边缘加速层（CDN + WAF）**：负责全球静态资源的边缘缓存与分发
- **动态路由网关（Nginx/OpenResty）**：作为各区域的流量入口，处理跨区数据的反向代理转发
- **客户端前端（SPA/SSR）**：负责解析当前区域、展示节点延迟，并根据用户选择动态切换 API 请求

## 二、后端核心机制

### 1. 自动检测与就近接入

- 使用支持 EDNS Client Subnet (ECS) 的权威 DNS（Cloudflare, AWS Route53, 阿里云云解析）
- 静态资源通过 CDN 分发，TTL 建议 5-10 分钟

### 2. 区域服务器关联与动态路由

#### 节点配置

系统支持两种节点配置方式：

1. **默认节点**（代码配置）
2. **自定义节点**（数据库配置）

##### 默认节点

在 `server/src/config/regions.ts` 中定义：

```typescript
export const REGIONS_CONFIG: RegionNode[] = [
  {
    id: 'cn-sichuan',
    name: '四川主节点',
    apiUrl: 'https://sc.api.earthol.com',
    healthCheck: '/api/ping',
    flag: '🇨🇳'
  },
  // ... 其他节点
];
```

##### 自定义节点（管理员配置）

管理员可在后台配置自定义节点：

```json
// 数据库 system_configs 表
// config_key: custom_regions
[
  {
    "id": "cn-beijing",
    "name": "北京节点",
    "apiUrl": "https://bj.api.example.com",
    "healthCheck": "/api/ping",
    "flag": "🇨🇳"
  }
]
```

### 3. API 接口

#### 获取区域状态

```
GET /api/regions/status
```

返回示例：

```json
{
  "success": true,
  "data": [
    {
      "id": "cn-sichuan",
      "name": "四川主节点",
      "apiUrl": "https://sc.api.earthol.com",
      "status": "online",
      "latency": 25,
      "flag": "🇨🇳"
    },
    {
      "id": "us-west",
      "name": "北美硅谷节点",
      "apiUrl": "https://us.api.earthol.com",
      "status": "offline",
      "latency": 9999,
      "flag": "🇺🇸"
    }
  ]
}
```

#### 健康检查

```
GET /api/ping
HEAD /api/ping
```

## 三、前端交互实现

### 1. 区域切换组件

在页脚提供区域切换下拉菜单，自动显示所有可用节点及其延迟。

### 2. 切换逻辑

1. 用户选择目标节点
2. 将节点信息保存到 LocalStorage
3. 更新 Axios baseURL
4. 触发页面刷新

### 3. 功能开关

AI 功能默认关闭，由管理员在后台开启后才会显示。

#### 获取功能开关

```
GET /api/features/ai
```

返回示例：

```json
{
  "success": true,
  "data": {
    "enabled": false
  }
}
```

## 四、跨区数据一致性

### 推荐方案

- **中心化云数据库**：Supabase, MongoDB Atlas, TiDB Serverless
- **自建 MySQL 主从复制**：一个区域主库，其他区域从库

## 五、SEO 优化

- **URL 结构**：子目录（`/us/`）或子域名（`us.example.com`）
- **Hreflang 标签**：自动生成对应关系
- **智能重定向**：首页基于 IP 跳转，但提供手动切换选项

## 六、开发者接入指南

### 添加新节点

1. 修改 `server/src/config/regions.ts`
2. 或在数据库 `system_configs` 表中添加 `custom_regions` 配置

### 环境变量

```bash
# 区域唯一标识
REGION_ID=CN-SICHUAN

# 当前节点对外暴露的 API 域名
PUBLIC_API_HOST=https://cn-sichuan.api.example.com
```
