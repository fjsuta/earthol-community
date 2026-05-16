<template>
  <div class="search-container">
    <div class="search-header">
      <el-input
        v-model="keyword"
        placeholder="搜索帖子、用户、板块..."
        size="large"
        class="search-input"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <div class="search-filters">
      <el-radio-group v-model="searchType" @change="handleSearch">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="posts">帖子</el-radio-button>
        <el-radio-button label="users">用户</el-radio-button>
        <el-radio-button label="categories">板块</el-radio-button>
      </el-radio-group>
    </div>

    <div class="search-results">
      <div v-if="loading" class="loading-state">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>搜索中...</span>
      </div>

      <template v-else>
        <!-- 帖子结果 -->
        <div v-if="results.posts && results.posts.length > 0" class="result-section">
          <h3 class="section-title">帖子 <span class="count">({{ results.posts.length }})</span></h3>
          <div class="posts-list">
            <div v-for="post in results.posts" :key="post.id" class="post-item card" @click="$router.push(`/forum/${post.id}`)">
              <div class="post-header">
                <el-avatar :size="32">{{ post.author_name?.charAt(0) }}</el-avatar>
                <span class="author-name">{{ post.author_name }}</span>
                <el-tag size="small">{{ post.category_name }}</el-tag>
              </div>
              <h4 class="post-title" v-html="highlightKeyword(post.title)"></h4>
              <p class="post-excerpt" v-html="highlightKeyword(post.content?.substring(0, 150))"></p>
              <div class="post-stats">
                <span><el-icon><View /></el-icon> {{ post.view_count }}</span>
                <span><el-icon><ChatDotRound /></el-icon> {{ post.comment_count }}</span>
                <span><el-icon><Good /></el-icon> {{ post.like_count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户结果 -->
        <div v-if="results.users && results.users.length > 0" class="result-section">
          <h3 class="section-title">用户 <span class="count">({{ results.users.length }})</span></h3>
          <div class="users-list">
            <div v-for="user in results.users" :key="user.id" class="user-item card" @click="$router.push(`/profile/${user.id}`)">
              <el-avatar :size="48">{{ user.username?.charAt(0) }}</el-avatar>
              <div class="user-info">
                <span class="username" v-html="highlightKeyword(user.username)"></span>
                <span class="user-meta">
                  <el-tag size="small" type="warning">Lv.{{ user.level }}</el-tag>
                  {{ user.region_name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 板块结果 -->
        <div v-if="results.categories && results.categories.length > 0" class="result-section">
          <h3 class="section-title">板块 <span class="count">({{ results.categories.length }})</span></h3>
          <div class="categories-list">
            <div v-for="cat in results.categories" :key="cat.id" class="category-item card" @click="goToCategory(cat.id)">
              <span class="category-icon">{{ cat.icon }}</span>
              <div class="category-info">
                <span class="category-name" v-html="highlightKeyword(cat.name)"></span>
                <span class="category-desc">{{ cat.description }}</span>
              </div>
              <span class="topic-count">{{ cat.topic_count }} 帖子</span>
            </div>
          </div>
        </div>

        <!-- 无结果 -->
        <el-empty v-if="!hasResults" description="未找到相关结果" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, View, ChatDotRound, Good, Loading } from '@element-plus/icons-vue';
import { userApi } from '../api';

const keyword = ref('');
const searchType = ref('');
const loading = ref(false);
const results = ref<any>({
  posts: [],
  users: [],
  categories: []
});

const hasResults = computed(() => {
  return (
    (results.value.posts && results.value.posts.length > 0) ||
    (results.value.users && results.value.users.length > 0) ||
    (results.value.categories && results.value.categories.length > 0)
  );
});

function highlightKeyword(text: string) {
  if (!text || !keyword.value) return text;
  const regex = new RegExp(`(${keyword.value})`, 'gi');
  return text.replace(regex, '<mark style="background: rgba(0, 212, 255, 0.3); padding: 0 2px;">$1</mark>');
}

async function handleSearch() {
  if (!keyword.value.trim()) return;
  
  loading.value = true;
  try {
    const res = await userApi.search({
      keyword: keyword.value,
      type: searchType.value || undefined
    });
    if (res.data.success) {
      results.value = res.data.data;
    }
  } catch (error) {
    console.error('Search failed:', error);
  } finally {
    loading.value = false;
  }
}

function goToCategory(categoryId: number) {
  // 可以跳转到板块页面
  console.log('Go to category:', categoryId);
}
</script>

<style scoped>
.search-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 0;
}

.search-header {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
}

.search-filters {
  margin-bottom: 24px;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px;
  color: #888;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count {
  color: #888;
  font-weight: normal;
  font-size: 14px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.post-item:hover {
  transform: translateX(4px);
  border-color: rgba(0, 212, 255, 0.5);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.author-name {
  flex: 1;
}

.post-title {
  font-size: 18px;
  margin-bottom: 8px;
}

.post-excerpt {
  color: #888;
  font-size: 14px;
  margin-bottom: 12px;
  line-height: 1.6;
}

.post-stats {
  display: flex;
  gap: 16px;
  color: #888;
  font-size: 13px;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-weight: 500;
}

.user-meta {
  font-size: 12px;
  color: #888;
  display: flex;
  align-items: center;
  gap: 8px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
}

.category-icon {
  font-size: 32px;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-name {
  font-weight: 500;
}

.category-desc {
  font-size: 13px;
  color: #888;
}

.topic-count {
  color: #888;
  font-size: 13px;
}
</style>
