<template>
  <div id="app" class="app-container" :class="{ dark: isDark }">
    <el-container class="layout-container">
      <el-header class="app-header">
        <div class="header-content">
          <div class="logo" @click="$router.push('/')">
            <span class="logo-icon">🌍</span>
            <span class="logo-text">地球OL</span>
          </div>
          
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            :ellipsis="false"
            class="nav-menu"
            router
            background-color="transparent"
            text-color="#fff"
            active-text-color="#00d4ff"
          >
            <el-menu-item index="/">全球数据</el-menu-item>
            <el-menu-item index="/forum">论坛</el-menu-item>
            <el-menu-item index="/chat">AI对话</el-menu-item>
            <el-menu-item index="/chatroom">聊天室</el-menu-item>
          </el-menu>

          <div class="header-actions">
            <el-button :icon="Search" circle @click="$router.push('/search')" />
            
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
              <el-button :icon="Bell" circle @click="$router.push('/notifications')" />
            </el-badge>

            <el-dropdown @command="handleUserMenu" trigger="click">
              <el-button circle>
                <el-avatar :size="32">U</el-avatar>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>
                    个人主页
                  </el-dropdown-item>
                  <el-dropdown-item command="settings">
                    <el-icon><Setting /></el-icon>
                    设置
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main class="app-main">
        <router-view />
      </el-main>

      <el-footer v-if="icpConfig.show_footer !== false" class="app-footer">
        <div class="footer-content">
          <div class="footer-links">
            <a @click="$router.push('/about')">关于我们</a>
            <span class="divider">|</span>
            <a @click="$router.push('/agreement')">用户协议</a>
            <span class="divider">|</span>
            <a @click="$router.push('/privacy')">隐私政策</a>
          </div>
          <div v-if="icpConfig.icp_number || icpConfig.icp_police_number" class="icp-links">
            <a 
              v-if="icpConfig.icp_number" 
              :href="icpConfig.icp_url || '#'" 
              target="_blank" 
              class="icp-link"
            >
              {{ icpConfig.icp_number }}
            </a>
            <span v-if="icpConfig.icp_number && icpConfig.icp_police_number" class="divider">|</span>
            <a 
              v-if="icpConfig.icp_police_number" 
              :href="icpConfig.icp_police_url || '#'" 
              target="_blank" 
              class="icp-link"
            >
              {{ icpConfig.icp_police_number }}
            </a>
          </div>
          <p class="copyright">
            {{ icpConfig.copyright_text || '© 2024 地球OL全球玩家社区' }}
          </p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Search, Bell, User, Setting, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi, configApi } from './api';

const route = useRoute();
const unreadCount = ref(0);

const icpConfig = ref({
  icp_number: '',
  icp_url: '',
  icp_police_number: '',
  icp_police_url: '',
  copyright_text: '',
  show_footer: true
});

const activeMenu = computed(() => route.path);

const isDark = computed(() => {
  const theme = localStorage.getItem('theme') || 'system';
  if (theme === 'dark') return true;
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
});

function handleUserMenu(command: string) {
  switch (command) {
    case 'profile':
      $router.push('/profile');
      break;
    case 'settings':
      $router.push('/settings');
      break;
    case 'logout':
      logout();
      break;
  }
}

async function logout() {
  ElMessage.success('已退出登录');
  $router.push('/');
}

async function loadUnreadCount() {
  try {
    const res = await userApi.getNotifications({ userId: 1, limit: 1 });
    if (res.data.success) {
      unreadCount.value = res.data.data.unreadCount;
    }
  } catch (error) {
    console.error('Failed to load unread count:', error);
  }
}

async function loadICPConfig() {
  try {
    const res = await configApi.getPublicConfigs();
    if (res.data.success) {
      const data = res.data.data;
      icpConfig.value = {
        icp_number: data.icp_number ? JSON.parse(data.icp_number) : '',
        icp_url: data.icp_url ? JSON.parse(data.icp_url) : '',
        icp_police_number: data.icp_police_number ? JSON.parse(data.icp_police_number) : '',
        icp_police_url: data.icp_police_url ? JSON.parse(data.icp_police_url) : '',
        copyright_text: data.copyright_text ? JSON.parse(data.copyright_text) : '',
        show_footer: data.show_footer !== undefined ? JSON.parse(data.show_footer) : true
      };
    }
  } catch (error) {
    console.error('Failed to load ICP config:', error);
  }
}

onMounted(() => {
  loadUnreadCount();
  loadICPConfig();
  
  setInterval(() => {
    loadUnreadCount();
  }, 60000);

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    // 跟随系统主题变化
  });
});
</script>

<style>
:root {
  --primary-color: #00d4ff;
  --bg-primary: #0a0a1a;
  --bg-secondary: #1a1a3d;
  --text-primary: #fff;
  --text-secondary: #888;
}

.light {
  --bg-primary: #f5f5f5;
  --bg-secondary: #fff;
  --text-primary: #333;
  --text-secondary: #666;
}

.dark {
  --bg-primary: #0a0a1a;
  --bg-secondary: #1a1a3d;
  --text-primary: #fff;
  --text-secondary: #888;
}

#app {
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.layout-container {
  min-height: 100vh;
}

.app-header {
  background: rgba(10, 10, 26, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  padding: 0;
  height: 60px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 22px;
  font-weight: bold;
  background: linear-gradient(90deg, var(--primary-color), #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  flex: 1;
  justify-content: center;
  border: none;
  background: transparent !important;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-main {
  background: transparent;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 120px);
}

.app-footer {
  background: rgba(10, 10, 26, 0.95);
  border-top: 1px solid rgba(0, 212, 255, 0.2);
  padding: 30px 20px;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}

.footer-links {
  margin-bottom: 12px;
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--primary-color);
}

.icp-links {
  margin-bottom: 12px;
}

.icp-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.3s;
}

.icp-link:hover {
  color: var(--primary-color);
}

.divider {
  margin: 0 12px;
  color: var(--text-secondary);
}

.copyright {
  color: var(--text-secondary);
  font-size: 13px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  
  .logo-text {
    font-size: 18px;
  }
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
