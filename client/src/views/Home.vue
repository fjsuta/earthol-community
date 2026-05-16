
<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">地球OL</h1>
        <p class="hero-subtitle">全球玩家实时数据中心</p>
        <div class="population-display">
          <div class="population-number number-display">
            {{ formattedPopulation }}
          </div>
          <div class="population-label">在线玩家</div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon birth-icon">👶</div>
        <div class="stat-content">
          <div class="stat-title">今日新玩家</div>
          <div class="stat-value birth-color">{{ formatNumber(populationData.today_births) }}</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon death-icon">👤</div>
        <div class="stat-content">
          <div class="stat-title">今日离线</div>
          <div class="stat-value death-color">{{ formatNumber(populationData.today_deaths) }}</div>
        </div>
      </div>
      <div class="stat-card card">
        <div class="stat-icon net-icon">📊</div>
        <div class="stat-content">
          <div class="stat-title">净增长</div>
          <div class="stat-value" :class="populationData.today_net >= 0 ? 'birth-color' : 'death-color'">
            {{ populationData.today_net >= 0 ? '+' : '' }}{{ formatNumber(populationData.today_net) }}
          </div>
        </div>
      </div>
    </div>

    <div class="regions-section">
      <h2 class="section-title">🌍 全球大区</h2>
      <div class="regions-grid">
        <div 
          v-for="region in regions" 
          :key="region.id" 
          class="region-card card"
          :class="{ 'continuous-region': region.is_continuous }"
        >
          <div class="region-header">
            <span class="region-name">{{ region.name }}</span>
            <el-tag 
              v-if="region.is_continuous" 
              type="success" 
              size="small"
            >
              唯一不断代
            </el-tag>
            <el-tag 
              v-else
              :type="getRegionTagType(region.version_type)"
              size="small"
            >
              {{ getRegionTypeName(region.version_type) }}
            </el-tag>
          </div>
          <div class="region-population">
            {{ formatNumber(region.population) }} 玩家
          </div>
          <div class="region-description">{{ region.description }}</div>
        </div>
      </div>
    </div>

    <div class="events-section">
      <div class="events-card card">
        <h3 class="events-title">📡 实时事件</h3>
        <div class="events-container">
          <div 
            v-for="event in recentEvents" 
            :key="event.id"
            class="event-item"
            :class="event.type"
          >
            <span class="event-icon">{{ event.type === 'birth' ? '👶' : '👤' }}</span>
            <span class="event-text">
              {{ event.type === 'birth' ? '新玩家加入' : '玩家离线' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useEarthStore } from '../store';
import { io, Socket } from 'socket.io-client';
import { earthApi } from '../api';

let socket: Socket | null = null;

const store = useEarthStore();

const { populationData, regions, birthEvents, deathEvents } = store;

const recentEvents = computed(() => {
  const events = [
    ...birthEvents.value.map(e => ({ ...e, type: 'birth' })),
    ...deathEvents.value.map(e => ({ ...e, type: 'death' }))
  ].sort((a, b) => b.id - a.id).slice(0, 20);
  return events;
});

const formattedPopulation = computed(() => {
  return populationData.value.current_population.toLocaleString('zh-CN');
});

function formatNumber(num: number): string {
  return Math.abs(num).toLocaleString('zh-CN');
}

function getRegionTagType(type: string): string {
  const types: Record<string, string> = {
    'new': 'primary',
    'old': 'warning',
    'primitive': 'info',
    'high_risk': 'danger'
  };
  return types[type] || 'info';
}

function getRegionTypeName(type: string): string {
  const names: Record<string, string> = {
    'new': '智能新版',
    'old': '旧版兼容',
    'primitive': '原始离线',
    'high_risk': '高危战乱'
  };
  return names[type] || type;
}

async function loadInitialData() {
  try {
    const [dataRes, regionsRes] = await Promise.all([
      earthApi.getData(),
      earthApi.getRegions()
    ]);
    
    if (dataRes.data.success) {
      store.updatePopulationData(dataRes.data.data);
    }
    if (regionsRes.data.success) {
      store.setRegions(regionsRes.data.data);
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}

function setupWebSocket() {
  socket = io('http://localhost:3001');
  
  socket.on('populationUpdate', (data) => {
    store.updatePopulationData(data);
  });
  
  socket.on('birthEvent', (event) => {
    store.addBirthEvent(event);
  });
  
  socket.on('deathEvent', (event) => {
    store.addDeathEvent(event);
  });
  
  socket.on('onlineUsers', (users) => {
    store.setOnlineUsers(users);
  });
}

onMounted(() => {
  loadInitialData();
  setupWebSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style scoped>
.home-container {
  padding: 0 0 40px 0;
}

.hero-section {
  text-align: center;
  padding: 40px 0;
}

.hero-title {
  font-size: 48px;
  font-weight: bold;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.hero-subtitle {
  font-size: 18px;
  color: #888;
  margin-bottom: 30px;
}

.population-display {
  margin-top: 30px;
}

.population-number {
  font-size: 72px;
  font-weight: bold;
  color: #00d4ff;
  text-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  line-height: 1;
}

.population-label {
  font-size: 18px;
  color: #888;
  margin-top: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
}

.stat-icon {
  font-size: 48px;
}

.stat-content {
  flex: 1;
}

.stat-title {
  color: #888;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
}

.birth-color {
  color: #00ff88;
}

.death-color {
  color: #8888aa;
}

.section-title {
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  margin: 50px 0 30px 0;
  color: #fff;
}

.regions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.region-card {
  padding: 24px;
}

.continuous-region {
  border: 2px solid #00ff88;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
}

.region-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.region-name {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.region-population {
  font-size: 24px;
  font-weight: bold;
  color: #00d4ff;
  margin-bottom: 8px;
}

.region-description {
  color: #888;
  font-size: 14px;
}

.events-section {
  margin-top: 40px;
}

.events-card {
  padding: 24px;
}

.events-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.events-container {
  max-height: 300px;
  overflow-y: auto;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.event-item.birth {
  border-left: 3px solid #00ff88;
}

.event-item.death {
  border-left: 3px solid #8888aa;
}

.event-icon {
  font-size: 20px;
}

.event-text {
  color: #ccc;
}
</style>
