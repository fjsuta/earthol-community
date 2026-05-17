import axios from 'axios';

// 区域配置类型定义
export interface RegionNode {
  id: string;
  name: string;
  apiUrl: string;
  healthCheck: string;
  flag?: string;
}

export interface RegionStatus extends RegionNode {
  status: 'online' | 'offline';
  latency: number;
  lastCheck?: Date;
}

// LocalStorage 键名
const STORAGE_KEYS = {
  REGION_ID: 'selected_region_id',
  REGION_URL: 'selected_region_url'
};

// 当前的 API 基础路径
let currentBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 创建 axios 实例
const api = axios.create({
  baseURL: currentBaseURL,
  timeout: 15000
});

// 请求拦截器 - 自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * 手动切换到指定区域的节点
 * @param apiUrl - 目标区域的专属 API 地址 
 * @param regionId - 区域唯一标识 
 */
export function switchRegion(apiUrl: string, regionId: string) {
  if (!apiUrl) return;
  
  // 1. 更新 axios 的基础路径
  api.defaults.baseURL = apiUrl;
  // 2. 将用户的选择持久化保存到本地存储
  localStorage.setItem(STORAGE_KEYS.REGION_ID, regionId);
  localStorage.setItem(STORAGE_KEYS.REGION_URL, apiUrl);
  console.log(`🌍 已成功切换至区域：${regionId} (${apiUrl})`);
}

/**
 * 初始化时恢复用户上次选择的区域
 */
export function initRegion() {
  const savedUrl = localStorage.getItem(STORAGE_KEYS.REGION_URL);
  const savedId = localStorage.getItem(STORAGE_KEYS.REGION_ID);
  
  if (savedUrl && savedId) {
    api.defaults.baseURL = savedUrl;
    console.log(`🌍 已自动恢复至上次的区域：${savedId}`);
  }
}

/**
 * 切换回默认区域（当前域名）
 */
export function resetRegion() {
  api.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  localStorage.removeItem(STORAGE_KEYS.REGION_ID);
  localStorage.removeItem(STORAGE_KEYS.REGION_URL);
  console.log('🌍 已重置为默认区域');
}

/**
 * 获取当前选择的区域信息
 */
export function getCurrentRegion() {
  return {
    id: localStorage.getItem(STORAGE_KEYS.REGION_ID),
    url: api.defaults.baseURL
  };
}

// 区域相关 API
export const regionsApi = {
  // 获取所有区域的状态和延迟
  getStatus: async (forceOrigin = false) => {
    const baseURL = forceOrigin ? import.meta.env.VITE_API_URL || window.location.origin + '/api' : api.defaults.baseURL;
    return api.get('/regions/status', { baseURL });
  },
  
  // 获取当前节点信息
  getCurrent: () => api.get('/regions/current'),
  
  // 健康检查
  ping: () => api.get('/ping')
};

// 导出所有 API
export * from './api';

export { api };
export default api;
