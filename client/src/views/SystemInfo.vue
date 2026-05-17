<template>
  <div class="system-info">
    <h2>📊 系统信息</h2>
    
    <el-card v-loading="loading" class="info-card">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon">💻</div>
            <div class="stat-content">
              <div class="stat-label">系统</div>
              <div class="stat-value">{{ systemInfo.system?.platform || '-' }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon">🧠</div>
            <div class="stat-content">
              <div class="stat-label">CPU核心</div>
              <div class="stat-value">{{ systemInfo.cpu?.count || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-label">用户数</div>
              <div class="stat-value">{{ systemInfo.stats?.user_count || 0 }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-divider />

      <h3>内存使用</h3>
      <el-progress :percentage="systemInfo.memory?.usage_percent || 0" :stroke-width="20" />
      <div class="memory-details">
        <span>已用: {{ formatBytes(systemInfo.memory?.used) }}</span>
        <span>总计: {{ formatBytes(systemInfo.memory?.total) }}</span>
      </div>

      <el-divider />

      <h3>CPU负载</h3>
      <div class="cpu-loads">
        <div class="load-item">
          <span>1分钟:</span>
          <el-progress :percentage="((systemInfo.cpu?.load_avg?.['1m'] || 0) / systemInfo.cpu?.count || 1) * 100" :status="getLoadStatus(systemInfo.cpu?.load_avg?.['1m'])" />
        </div>
        <div class="load-item">
          <span>5分钟:</span>
          <el-progress :percentage="((systemInfo.cpu?.load_avg?.['5m'] || 0) / systemInfo.cpu?.count || 1) * 100" :status="getLoadStatus(systemInfo.cpu?.load_avg?.['5m'])" />
        </div>
        <div class="load-item">
          <span>15分钟:</span>
          <el-progress :percentage="((systemInfo.cpu?.load_avg?.['15m'] || 0) / systemInfo.cpu?.count || 1) * 100" :status="getLoadStatus(systemInfo.cpu?.load_avg?.['15m'])" />
        </div>
      </div>

      <el-divider v-if="systemInfo.disk" />

      <h3 v-if="systemInfo.disk">磁盘使用</h3>
      <el-progress v-if="systemInfo.disk" :percentage="(systemInfo.disk.used / systemInfo.disk.total) * 100" :stroke-width="20" :status="getDiskStatus(systemInfo.disk)" />
      <div class="memory-details" v-if="systemInfo.disk">
        <span>已用: {{ formatBytes(systemInfo.disk.used) }}</span>
        <span>总计: {{ formatBytes(systemInfo.disk.total) }}</span>
      </div>

      <el-divider />

      <h3>服务统计</h3>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="service-stat">
            <span class="label">活跃AI:</span>
            <el-tag type="success">{{ systemInfo.stats?.active_ai_providers || 0 }}</el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="service-stat">
            <span class="label">活跃存储:</span>
            <el-tag type="success">{{ systemInfo.stats?.active_storages || 0 }}</el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="service-stat">
            <span class="label">活跃数据库:</span>
            <el-tag type="success">{{ systemInfo.stats?.active_databases || 0 }}</el-tag>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <h3>运行时间</h3>
      <p>{{ formatUptime(systemInfo.system?.uptime) }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { configApi } from '../api';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const systemInfo = ref<any>({});

const loadSystemInfo = async () => {
  loading.value = true;
  try {
    const res = await configApi.getSystemInfo();
    if (res.data.success) {
      systemInfo.value = res.data.data;
    }
  } catch (error) {
    ElMessage.error('获取系统信息失败');
  } finally {
    loading.value = false;
  }
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  if (!seconds) return '-';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
};

const getLoadStatus = (load: number) => {
  if (!load) return '';
  if (load > 1) return 'exception';
  if (load > 0.7) return 'warning';
  return 'success';
};

const getDiskStatus = (disk: any) => {
  if (!disk) return '';
  const percent = (disk.used / disk.total) * 100;
  if (percent > 90) return 'exception';
  if (percent > 70) return 'warning';
  return 'success';
};

onMounted(() => {
  loadSystemInfo();
  setInterval(loadSystemInfo, 10000);
});
</script>

<style scoped>
.system-info h2 {
  margin-bottom: 20px;
}

.info-card {
  max-width: 1000px;
}

.stat-card {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.memory-details {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  color: #666;
}

.cpu-loads {
  margin-top: 20px;
}

.load-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.load-item span {
  width: 80px;
  color: #666;
}

.load-item .el-progress {
  flex: 1;
}

.service-stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-stat .label {
  color: #666;
}
</style>
