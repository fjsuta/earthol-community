<template>
  <div class="settings-container">
    <h1 class="page-title">个人设置</h1>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 基础设置 -->
      <el-tab-pane label="基础设置" name="basic">
        <div class="settings-section card">
          <h3>个人资料</h3>
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input v-model="profileForm.bio" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="所在大区">
              <el-select v-model="profileForm.regionId" placeholder="选择大区">
                <el-option v-for="region in regions" :key="region.id" :label="region.name" :value="region.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="游玩风格">
              <el-select v-model="profileForm.playStyle" placeholder="选择风格">
                <el-option label="肝帝" value="肝帝" />
                <el-option label="佛系" value="佛系" />
                <el-option label="探索党" value="探索党" />
                <el-option label="社交达人" value="社交达人" />
                <el-option label="独行侠" value="独行侠" />
                <el-option label="全能玩家" value="全能玩家" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile">保存资料</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 界面设置 -->
      <el-tab-pane label="界面设置" name="interface">
        <div class="settings-section card">
          <h3>主题设置</h3>
          <el-form label-width="120px">
            <el-form-item label="外观模式">
              <el-radio-group v-model="settings.theme">
                <el-radio label="system">跟随系统</el-radio>
                <el-radio label="light">浅色模式</el-radio>
                <el-radio label="dark">深色模式</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="主题颜色">
              <el-color-picker v-model="settings.themeColor" />
              <span class="color-presets">
                <span v-for="color in presetColors" :key="color" 
                  class="color-preset" 
                  :style="{ background: color }"
                  @click="settings.themeColor = color"
                />
              </span>
            </el-form-item>
            <el-form-item label="界面语言">
              <el-select v-model="settings.language">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="繁体中文" value="zh-TW" />
                <el-option label="English" value="en" />
                <el-option label="日本語" value="ja" />
                <el-option label="한국어" value="ko" />
              </el-select>
            </el-form-item>
            <el-form-item label="首页默认标签">
              <el-select v-model="settings.homepageTab">
                <el-option label="全球数据" value="global" />
                <el-option label="论坛" value="forum" />
                <el-option label="AI对话" value="ai" />
                <el-option label="聊天室" value="chat" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 通知设置 -->
      <el-tab-pane label="通知设置" name="notifications">
        <div class="settings-section card">
          <h3>通知偏好</h3>
          <el-form label-width="150px">
            <el-form-item label="点赞通知">
              <el-switch v-model="settings.notifyLike" />
            </el-form-item>
            <el-form-item label="评论通知">
              <el-switch v-model="settings.notifyComment" />
            </el-form-item>
            <el-form-item label="关注通知">
              <el-switch v-model="settings.notifyFollow" />
            </el-form-item>
            <el-form-item label="私信通知">
              <el-switch v-model="settings.notifyMessage" />
            </el-form-item>
            <el-form-item label="系统通知">
              <el-switch v-model="settings.notifySystem" />
            </el-form-item>
            <el-form-item label="邮件通知">
              <el-switch v-model="settings.notifyEmail" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 隐私设置 -->
      <el-tab-pane label="隐私设置" name="privacy">
        <div class="settings-section card">
          <h3>隐私控制</h3>
          <el-form label-width="150px">
            <el-form-item label="个人资料公开">
              <el-switch v-model="settings.profilePublic" />
            </el-form-item>
            <el-form-item label="显示在线状态">
              <el-switch v-model="settings.showOnlineStatus" />
            </el-form-item>
            <el-form-item label="允许陌生人私信">
              <el-switch v-model="settings.allowStrangerMessage" />
            </el-form-item>
            <el-form-item label="交互模式">
              <el-radio-group v-model="settings.interactionMode">
                <el-radio label="text">文本模式</el-radio>
                <el-radio label="voice">语音模式</el-radio>
                <el-radio label="immersive">沉浸模式</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 安全设置 -->
      <el-tab-pane label="账号安全" name="security">
        <div class="settings-section card">
          <h3>修改密码</h3>
          <el-form label-width="120px">
            <el-form-item label="当前密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="settings-section card danger-zone">
          <h3>危险操作区</h3>
          <el-form label-width="120px">
            <el-form-item label="账号注销">
              <el-button type="danger" @click="showDeleteDialog = true">注销账号</el-button>
              <span class="warning-text">注销后将无法恢复所有数据</span>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 注销账号对话框 -->
    <el-dialog v-model="showDeleteDialog" title="注销账号" width="500px">
      <p>确定要注销您的账号吗？此操作不可逆！</p>
      <p style="color: #f56c6c; margin-top: 10px;">请输入"注销"确认：</p>
      <el-input v-model="deleteConfirm" placeholder="请输入注销" />
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" :disabled="deleteConfirm !== '注销'" @click="deleteAccount">确认注销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { authApi, userApi } from '../api';

const activeTab = ref('basic');

const profileForm = ref({
  username: '',
  bio: '',
  regionId: null as number | null,
  regionName: '',
  playStyle: '探索党'
});

const settings = ref({
  theme: 'system',
  themeColor: '#00d4ff',
  language: 'zh-CN',
  homepageTab: 'global',
  notifyLike: true,
  notifyComment: true,
  notifyFollow: true,
  notifyMessage: true,
  notifySystem: true,
  notifyEmail: false,
  profilePublic: true,
  showOnlineStatus: true,
  allowStrangerMessage: false,
  interactionMode: 'text'
});

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const regions = ref<any[]>([]);
const userId = ref(1);

const showDeleteDialog = ref(false);
const deleteConfirm = ref('');

const presetColors = ['#00d4ff', '#00ff88', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'];

function applyTheme(theme: string, color: string) {
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('dark', 'light');
  }
  
  root.style.setProperty('--primary-color', color);
}

async function loadProfile() {
  try {
    const res = await authApi.getMe();
    if (res.data.success) {
      const user = res.data.data.user;
      userId.value = user.id;
      profileForm.value = {
        username: user.username,
        bio: user.bio || '',
        regionId: user.regionId,
        regionName: user.regionName || '',
        playStyle: user.playStyle || '探索党'
      };
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

async function loadSettings() {
  try {
    const res = await userApi.getSettings(userId.value);
    if (res.data.success) {
      settings.value = { ...settings.value, ...res.data.data };
      applyTheme(settings.value.theme, settings.value.themeColor);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

async function loadRegions() {
  try {
    const res = await authApi.getRegions();
    if (res.data.success) {
      regions.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load regions:', error);
  }
}

async function saveProfile() {
  try {
    const region = regions.value.find(r => r.id === profileForm.value.regionId);
    await authApi.updateProfile({
      username: profileForm.value.username,
      bio: profileForm.value.bio,
      regionId: profileForm.value.regionId,
      regionName: region?.name || '',
      playStyle: profileForm.value.playStyle
    });
    ElMessage.success('资料已保存');
  } catch (error) {
    ElMessage.error('保存失败');
  }
}

async function saveSettings() {
  try {
    await userApi.updateSettings({
      userId: userId.value,
      ...settings.value
    });
    applyTheme(settings.value.theme, settings.value.themeColor);
    ElMessage.success('设置已保存');
  } catch (error) {
    ElMessage.error('保存失败');
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次密码输入不一致');
    return;
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.error('密码长度不能少于6位');
    return;
  }

  try {
    await authApi.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    });
    ElMessage.success('密码修改成功');
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    ElMessage.error('修改失败');
  }
}

async function deleteAccount() {
  try {
    ElMessageBox.confirm('此操作将永久删除您的账号，是否继续？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    ElMessage.info('账号注销功能开发中...');
    showDeleteDialog.value = false;
  } catch {
    showDeleteDialog.value = false;
  }
}

function logout() {
  authApi.logout();
  ElMessage.success('已退出登录');
}

onMounted(() => {
  loadProfile();
  loadSettings();
  loadRegions();
});
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  margin-bottom: 24px;
}

.settings-tabs {
  background: transparent;
}

.settings-section {
  padding: 24px;
  margin-bottom: 20px;
}

.settings-section h3 {
  font-size: 18px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.color-presets {
  margin-left: 16px;
  display: inline-flex;
  gap: 8px;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
}

.color-preset:hover {
  border-color: #fff;
}

.warning-text {
  margin-left: 12px;
  color: #888;
  font-size: 13px;
}

.danger-zone {
  border-color: rgba(245, 108, 108, 0.3);
}

.danger-zone h3 {
  color: #f56c6c;
}
</style>
