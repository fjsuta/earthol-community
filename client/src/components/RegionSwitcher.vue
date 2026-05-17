<template>
  <div class="region-selector">
    <span class="label">线路选择:</span>
    <select 
      v-model="selectedRegionId" 
      @change="handleRegionChange"
      :disabled="loading"
    >
      <option value="" disabled>
        {{ loading ? '正在检测节点延迟...' : '请选择节点' }}
      </option>
      <!-- 遍历后端返回的节点 -->
      <option 
        v-for="node in regionList" 
        :key="node.id" 
        :value="node.id"
        :disabled="node.status !== 'online'"
      >
        <span v-if="node.flag">{{ node.flag }}</span>
        {{ node.name }} 
        <span v-if="node.status === 'online'">({{ node.latency }}ms)</span>
        <span v-else>(离线)</span>
      </option>
    </select>
    <button 
      v-if="selectedRegionId" 
      class="refresh-btn" 
      @click="refreshStatus"
      :disabled="loading"
    >
      {{ loading ? '刷新中...' : '🔄' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { regionsApi, switchRegion, initRegion, getCurrentRegion, resetRegion } from '../utils/request';

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

const regionList = ref<RegionStatus[]>([]);
const selectedRegionId = ref<string>(localStorage.getItem('selected_region_id') || '');
const loading = ref(false);

const loadRegionStatus = async () => {
  loading.value = true;
  try {
    const res = await regionsApi.getStatus(true);
    if (res.data.success) {
      regionList.value = res.data.data;
      
      // 如果当前没有选择，默认选择延迟最低的在线节点
      if (!selectedRegionId.value) {
        const fastestOnline = regionList.value.find(r => r.status === 'online');
        if (fastestOnline) {
          selectedRegionId.value = fastestOnline.id;
        }
      }
    }
  } catch (error) {
    console.error('获取区域节点失败:', error);
    ElMessage.error('获取区域节点失败');
  } finally {
    loading.value = false;
  }
};

const refreshStatus = () => {
  loadRegionStatus();
};

const handleRegionChange = async (e: Event) => {
  const selectEl = e.target as HTMLSelectElement;
  const targetId = selectEl.value;
  const targetNode = regionList.value.find(node => node.id === targetId);
  
  if (targetNode && targetNode.status === 'online') {
    try {
      await ElMessageBox.confirm(
        `确定要切换至【${targetNode.name}】吗？\n切换后页面将自动刷新。`,
        '线路切换',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'info',
        }
      );
      
      // 调用切换方法，更新全局请求基地址
      switchRegion(targetNode.apiUrl, targetId);
      
      ElMessage.success(`已切换至【${targetNode.name}】`);
      
      // 刷新页面以应用新线路
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      // 用户取消
    }
  }
};

onMounted(() => {
  // 1. 先恢复用户上次的选择
  initRegion();
  
  // 2. 从当前域名拉取带有实时延迟的区域列表
  loadRegionStatus();
  
  // 3. 定时刷新（每30秒）
  setInterval(loadRegionStatus, 30000);
});
</script>

<style scoped>
.region-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.label {
  color: var(--text-secondary);
  white-space: nowrap;
}

.region-selector select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.region-selector select:hover {
  border-color: var(--primary-color);
}

.region-selector select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.refresh-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
