<template>
  <div class="profile-container">
    <div class="profile-header card">
      <el-avatar :size="100" :src="userInfo.avatar">
        {{ userInfo.username?.charAt(0) }}
      </el-avatar>
      <div class="profile-info">
        <h1 class="username">{{ userInfo.username }}</h1>
        <div class="user-tags">
          <el-tag size="small" type="success">{{ getRoleName(userInfo.role) }}</el-tag>
          <el-tag size="small" type="warning">Lv.{{ userInfo.level }}</el-tag>
          <el-tag size="small">{{ userInfo.regionName || '未选择大区' }}</el-tag>
          <el-tag size="small" type="info">{{ userInfo.playStyle || '探索党' }}</el-tag>
        </div>
        <p class="bio">{{ userInfo.bio || '这个玩家很懒，什么都没写~' }}</p>
      </div>
      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ userInfo.postCount || 0 }}</span>
          <span class="stat-label">帖子</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo.commentCount || 0 }}</span>
          <span class="stat-label">评论</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ userInfo.likeCount || 0 }}</span>
          <span class="stat-label">获赞</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.followers || 0 }}</span>
          <span class="stat-label">粉丝</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.following || 0 }}</span>
          <span class="stat-label">关注</span>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="profile-tabs">
      <el-tab-pane label="帖子" name="posts">
        <div class="posts-list">
          <div v-for="post in userPosts" :key="post.id" class="post-item card">
            <div class="post-category">{{ post.category_name }}</div>
            <h3 class="post-title" @click="$router.push(`/forum/${post.id}`)">{{ post.title }}</h3>
            <div class="post-meta">
              <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
              <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
              <span><el-icon><Good /></el-icon> {{ post.like_count }}</span>
              <span>{{ formatTime(post.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="userPosts.length === 0" description="暂无帖子" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="收藏" name="collections">
        <div class="folders-section">
          <el-select v-model="selectedFolder" placeholder="选择收藏夹" class="folder-select">
            <el-option label="全部收藏" :value="null" />
            <el-option v-for="folder in folders" :key="folder.id" :label="folder.name" :value="folder.id" />
          </el-select>
        </div>
        <div class="collections-list">
          <div v-for="item in collections" :key="item.id" class="collection-item card">
            <h4 @click="$router.push(`/forum/${item.post_id}`)">{{ item.title }}</h4>
            <div class="collection-meta">
              <span>浏览 {{ item.view_count }}</span>
              <span>点赞 {{ item.like_count }}</span>
              <span>{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="collections.length === 0" description="暂无收藏" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="历史记录" name="history">
        <div class="history-filters">
          <el-radio-group v-model="historyType" size="small">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="post">帖子</el-radio-button>
            <el-radio-button label="ai_chat">AI对话</el-radio-button>
          </el-radio-group>
          <el-button size="small" @click="clearHistory">清空历史</el-button>
        </div>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item card">
            <el-icon class="history-icon">
              <Document v-if="item.type === 'post'" />
              <Odometer v-else-if="item.type === 'ai_chat'" />
              <Folder v-else />
            </el-icon>
            <div class="history-content">
              <span class="history-title">{{ item.target_title || '浏览记录' }}</span>
              <span class="history-time">{{ formatTime(item.created_at) }}</span>
            </div>
          </div>
          <el-empty v-if="history.length === 0" description="暂无历史记录" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { View, ChatDotRound, Good, Document, Odometer, Folder } from '@element-plus/icons-vue';
import { userApi } from '../api';

const route = useRoute();
const userId = ref(Number(route.params.id) || 1);

const activeTab = ref('posts');
const userInfo = ref<any>({});
const userPosts = ref<any[]>([]);
const collections = ref<any[]>([]);
const folders = ref<any[]>([]);
const selectedFolder = ref<number | null>(null);
const history = ref<any[]>([]);
const historyType = ref('');
const stats = ref({ followers: 0, following: 0 });

function getRoleName(role: string) {
  const roles: Record<string, string> = {
    newbie: '萌新玩家',
    senior: '资深玩家',
    moderator: '版主',
    admin: '管理员'
  };
  return roles[role] || '玩家';
}

function formatTime(time: string) {
  return new Date(time).toLocaleDateString('zh-CN');
}

async function loadProfile() {
  try {
    const res = await userApi.getProfile(userId.value);
    if (res.data.success) {
      userInfo.value = res.data.data.user;
      userPosts.value = res.data.data.posts;
      stats.value = res.data.data.stats;
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

async function loadCollections() {
  try {
    const params: any = { userId: userId.value };
    if (selectedFolder.value) {
      params.folderId = selectedFolder.value;
    }
    const res = await userApi.getCollections(params);
    if (res.data.success) {
      collections.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load collections:', error);
  }
}

async function loadFolders() {
  try {
    const res = await userApi.getCollectionFolders(userId.value);
    if (res.data.success) {
      folders.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load folders:', error);
  }
}

async function loadHistory() {
  try {
    const params: any = { userId: userId.value };
    if (historyType.value) {
      params.type = historyType.value;
    }
    const res = await userApi.getHistory(params);
    if (res.data.success) {
      history.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

async function clearHistory() {
  try {
    await userApi.clearHistory({ userId: userId.value, type: historyType.value || undefined });
    history.value = [];
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

onMounted(() => {
  loadProfile();
  loadFolders();
  loadCollections();
  loadHistory();
});
</script>

<style scoped>
.profile-container {
  padding: 20px 0;
}

.profile-header {
  display: flex;
  gap: 24px;
  padding: 30px;
  margin-bottom: 24px;
}

.profile-info {
  flex: 1;
}

.username {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 12px;
}

.user-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.bio {
  color: #888;
  font-size: 14px;
}

.profile-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #00d4ff;
}

.stat-label {
  font-size: 12px;
  color: #888;
}

.profile-tabs {
  background: transparent;
}

.posts-list, .collections-list, .history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 16px;
  cursor: pointer;
}

.post-category {
  font-size: 12px;
  color: #00d4ff;
  margin-bottom: 8px;
}

.post-title {
  font-size: 18px;
  margin-bottom: 8px;
}

.post-title:hover {
  color: #00d4ff;
}

.post-meta {
  display: flex;
  gap: 16px;
  color: #888;
  font-size: 13px;
}

.collection-item h4 {
  cursor: pointer;
  margin-bottom: 8px;
}

.collection-item h4:hover {
  color: #00d4ff;
}

.collection-meta {
  display: flex;
  gap: 16px;
  color: #888;
  font-size: 13px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
}

.history-icon {
  font-size: 24px;
  color: #888;
}

.history-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.history-title {
  cursor: pointer;
}

.history-title:hover {
  color: #00d4ff;
}

.history-time {
  color: #888;
  font-size: 13px;
}

.folders-section {
  margin-bottom: 16px;
}

.folder-select {
  width: 200px;
}

.history-filters {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
