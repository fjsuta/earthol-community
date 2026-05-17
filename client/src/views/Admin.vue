<template>
  <div class="admin-container">
    <el-container>
      <el-aside width="250px" class="aside">
        <div class="logo">
          <h2>🌍 管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          router
          class="menu"
        >
          <el-menu-item index="/admin/system">
            <el-icon><Monitor /></el-icon>
            <span>系统信息</span>
          </el-menu-item>
          <el-menu-item index="/admin/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/ai">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI配置</span>
          </el-menu-item>
          <el-menu-item index="/admin/storage">
            <el-icon><FolderOpened /></el-icon>
            <span>存储配置</span>
          </el-menu-item>
          <el-menu-item index="/admin/database">
            <el-icon><DataBase /></el-icon>
            <span>数据库配置</span>
          </el-menu-item>
          <el-menu-item index="/admin/icp">
            <el-icon><Document /></el-icon>
            <span>备案管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Monitor, User, ChatDotRound, FolderOpened, DataBase, Document } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.admin-container {
  height: 100vh;
}

.aside {
  background: #001529;
  color: white;
}

.logo {
  padding: 20px;
  text-align: center;
}

.logo h2 {
  margin: 0;
  font-size: 20px;
}

.menu {
  border: none;
  background: #001529;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}
</style>
