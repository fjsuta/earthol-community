
<template>
  <div class="forum-container">
    <div class="forum-header">
      <h1 class="forum-title">论坛社区</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        发布帖子
      </el-button>
    </div>

    <div class="forum-content">
      <div class="posts-list">
        <div 
          v-for="post in posts" 
          :key="post.id"
          class="post-item card"
          @click="goToPost(post.id)"
        >
          <div class="post-header">
            <el-avatar :size="40" :src="post.author_avatar">
              {{ post.author_name?.charAt(0) }}
            </el-avatar>
            <div class="post-author">
              <span class="author-name">{{ post.author_name }}</span>
              <span class="post-time">{{ formatTime(post.created_at) }}</span>
            </div>
            <el-tag size="small">{{ post.category_name }}</el-tag>
          </div>
          <h3 class="post-title">{{ post.title }}</h3>
          <p class="post-excerpt">{{ post.content.slice(0, 150) }}...</p>
          <div class="post-footer">
            <span class="post-stat">
              <el-icon><View /></el-icon>
              {{ post.view_count }}
            </span>
            <span class="post-stat">
              <el-icon><ChatDotRound /></el-icon>
              {{ post.comment_count }}
            </span>
            <span class="post-stat">
              <el-icon><Good /></el-icon>
              {{ post.like_count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog 
      v-model="showCreateDialog" 
      title="发布新帖子" 
      width="600px"
    >
      <el-form :model="newPost" label-width="80px">
        <el-form-item label="板块">
          <el-select v-model="newPost.category_id" placeholder="请选择板块">
            <el-option 
              v-for="cat in categories" 
              :key="cat.id" 
              :label="cat.name" 
              :value="cat.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="newPost.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input 
            v-model="newPost.content" 
            type="textarea" 
            :rows="8" 
            placeholder="请输入内容" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPost">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, View, ChatDotRound, Good } from '@element-plus/icons-vue';
import { forumApi } from '../api';

const router = useRouter();

const posts = ref<any[]>([]);
const categories = ref<any[]>([]);
const showCreateDialog = ref(false);

const newPost = ref({
  category_id: null as number | null,
  title: '',
  content: '',
  user_id: 1
});

function formatTime(time: string) {
  return new Date(time).toLocaleDateString('zh-CN');
}

function goToPost(id: number) {
  router.push(`/forum/${id}`);
}

async function loadCategories() {
  try {
    const res = await forumApi.getCategories();
    if (res.data.success) {
      categories.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

async function loadPosts() {
  try {
    const res = await forumApi.getPosts();
    if (res.data.success) {
      posts.value = res.data.data;
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
  }
}

async function createPost() {
  if (!newPost.value.category_id || !newPost.value.title || !newPost.value.content) {
    ElMessage.error('请填写完整信息');
    return;
  }
  
  try {
    await forumApi.createPost(newPost.value);
    ElMessage.success('发布成功');
    showCreateDialog.value = false;
    loadPosts();
    newPost.value = { category_id: null, title: '', content: '', user_id: 1 };
  } catch (error) {
    ElMessage.error('发布失败');
  }
}

onMounted(() => {
  loadCategories();
  loadPosts();
});
</script>

<style scoped>
.forum-container {
  padding: 20px 0;
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.forum-title {
  font-size: 32px;
  font-weight: bold;
}

.forum-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 212, 255, 0.2);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-author {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name {
  color: #fff;
  font-weight: 500;
}

.post-time {
  color: #888;
  font-size: 12px;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 12px;
}

.post-excerpt {
  color: #888;
  font-size: 14px;
  margin-bottom: 16px;
}

.post-footer {
  display: flex;
  gap: 24px;
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #888;
  font-size: 14px;
}
</style>
