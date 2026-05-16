
<template>
  <div class="post-detail-container">
    <div class="post-card card">
      <div class="post-header">
        <el-avatar :size="50" :src="post?.author_avatar">
          {{ post?.author_name?.charAt(0) }}
        </el-avatar>
        <div class="post-author">
          <span class="author-name">{{ post?.author_name }}</span>
          <span class="post-time">{{ formatTime(post?.created_at) }}</span>
        </div>
        <el-tag>{{ post?.category_name }}</el-tag>
      </div>
      <h1 class="post-title">{{ post?.title }}</h1>
      <div class="post-content">{{ post?.content }}</div>
      <div class="post-footer">
        <span class="post-stat">
          <el-icon><View /></el-icon>
          {{ post?.view_count }}
        </span>
        <span class="post-stat">
          <el-icon><Good /></el-icon>
          {{ post?.like_count }}
        </span>
      </div>
    </div>

    <div class="comments-section">
      <h2 class="comments-title">评论 ({{ comments.length }})</h2>
      
      <div class="comment-input card">
        <el-input 
          v-model="newComment" 
          type="textarea" 
          :rows="3"
          placeholder="写下你的评论..."
        />
        <div class="comment-actions">
          <el-button type="primary" @click="submitComment">发表评论</el-button>
        </div>
      </div>

      <div class="comments-list">
        <div v-for="comment in comments" :key="comment.id" class="comment-item card">
          <div class="comment-header">
            <el-avatar :size="36" :src="comment.author_avatar">
              {{ comment.author_name?.charAt(0) }}
            </el-avatar>
            <div class="comment-author">
              <span class="author-name">{{ comment.author_name }}</span>
              <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
            </div>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { View, Good } from '@element-plus/icons-vue';
import { forumApi } from '../api';

const route = useRoute();
const postId = Number(route.params.id);

const post = ref<any>(null);
const comments = ref<any[]>([]);
const newComment = ref('');

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN');
}

async function loadPost() {
  try {
    const [postRes, commentsRes] = await Promise.all([
      forumApi.getPost(postId),
      forumApi.getComments(postId)
    ]);
    
    if (postRes.data.success) {
      post.value = postRes.data.data;
    }
    if (commentsRes.data.success) {
      comments.value = commentsRes.data.data;
    }
  } catch (error) {
    console.error('Failed to load post:', error);
  }
}

async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.error('请输入评论内容');
    return;
  }
  
  try {
    await forumApi.createComment({
      post_id: postId,
      content: newComment.value,
      user_id: 1
    });
    ElMessage.success('评论成功');
    newComment.value = '';
    loadPost();
  } catch (error) {
    ElMessage.error('评论失败');
  }
}

onMounted(() => {
  loadPost();
});
</script>

<style scoped>
.post-detail-container {
  padding: 20px 0;
}

.post-card {
  padding: 24px;
  margin-bottom: 24px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
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
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20px;
}

.post-content {
  color: #ccc;
  line-height: 1.8;
  margin-bottom: 24px;
}

.post-footer {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.post-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #888;
}

.comments-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comments-title {
  font-size: 20px;
  font-weight: bold;
}

.comment-input {
  padding: 20px;
}

.comment-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  padding: 20px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-time {
  color: #888;
  font-size: 12px;
}

.comment-content {
  color: #ccc;
  line-height: 1.6;
}
</style>
