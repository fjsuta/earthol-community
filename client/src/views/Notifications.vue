<template>
  <div class="notifications-container">
    <div class="notifications-header">
      <h2>通知中心</h2>
      <div class="header-actions">
        <el-button size="small" @click="markAllRead" :disabled="unreadCount === 0">
          全部已读
        </el-button>
      </div>
    </div>

    <div class="notification-tabs">
      <el-radio-group v-model="filterType" @change="loadNotifications">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="like">点赞</el-radio-button>
        <el-radio-button label="comment">评论</el-radio-button>
        <el-radio-button label="follow">关注</el-radio-button>
        <el-radio-button label="system">系统</el-radio-button>
        <el-radio-button label="message">私信</el-radio-button>
      </el-radio-group>
    </div>

    <div class="notifications-list">
      <div 
        v-for="item in notifications" 
        :key="item.id" 
        class="notification-item card"
        :class="{ unread: !item.is_read }"
        @click="handleNotification(item)"
      >
        <div class="notification-icon">
          <el-icon :size="24">
            <Star v-if="item.type === 'like'" />
            <ChatDotRound v-else-if="item.type === 'comment'" />
            <User v-else-if="item.type === 'follow'" />
            <Bell v-else-if="item.type === 'system'" />
            <Message v-else />
          </el-icon>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ item.title }}</div>
          <div v-if="item.content" class="notification-text">{{ item.content }}</div>
          <div class="notification-time">{{ formatTime(item.created_at) }}</div>
        </div>
        <div class="notification-actions">
          <el-button 
            v-if="!item.is_read" 
            size="small" 
            text 
            @click.stop="markRead(item.id)"
          >
            标记已读
          </el-button>
          <el-button 
            size="small" 
            text 
            type="danger"
            @click.stop="deleteNotification(item.id)"
          >
            删除
          </el-button>
        </div>
      </div>

      <el-empty v-if="notifications.length === 0" description="暂无通知" />
    </div>

    <div v-if="hasMore" class="load-more">
      <el-button @click="loadMore" :loading="loadingMore">加载更多</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Star, ChatDotRound, User, Bell, Message } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { userApi } from '../api';

const userId = ref(1);
const notifications = ref<any[]>([]);
const unreadCount = ref(0);
const filterType = ref('');
const page = ref(1);
const hasMore = ref(false);
const loadingMore = ref(false);

function formatTime(time: string) {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

async function loadNotifications() {
  try {
    const res = await userApi.getNotifications({
      userId: userId.value,
      type: filterType.value || undefined,
      page: 1,
      limit: 20
    });
    if (res.data.success) {
      notifications.value = res.data.data.notifications;
      unreadCount.value = res.data.data.unreadCount;
      hasMore.value = res.data.data.notifications.length === 20;
    }
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
}

async function loadMore() {
  loadingMore.value = true;
  page.value++;
  
  try {
    const res = await userApi.getNotifications({
      userId: userId.value,
      type: filterType.value || undefined,
      page: page.value,
      limit: 20
    });
    if (res.data.success) {
      notifications.value = [...notifications.value, ...res.data.data.notifications];
      hasMore.value = res.data.data.notifications.length === 20;
    }
  } catch (error) {
    console.error('Failed to load more:', error);
  } finally {
    loadingMore.value = false;
  }
}

async function markRead(id: number) {
  try {
    await userApi.markNotificationRead(id);
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.is_read = true;
      unreadCount.value--;
    }
  } catch (error) {
    console.error('Failed to mark read:', error);
  }
}

async function markAllRead() {
  try {
    await userApi.markAllNotificationsRead(userId.value);
    notifications.value.forEach(n => n.is_read = true);
    unreadCount.value = 0;
    ElMessage.success('已全部标记为已读');
  } catch (error) {
    console.error('Failed to mark all read:', error);
  }
}

async function deleteNotification(id: number) {
  try {
    await userApi.deleteNotification(id);
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      const notification = notifications.value[index];
      if (!notification.is_read) {
        unreadCount.value--;
      }
      notifications.value.splice(index, 1);
    }
    ElMessage.success('通知已删除');
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

function handleNotification(item: any) {
  if (!item.is_read) {
    markRead(item.id);
  }
  
  if (item.related_type === 'post' && item.related_id) {
    window.location.href = `/forum/${item.related_id}`;
  } else if (item.related_type === 'user' && item.related_id) {
    window.location.href = `/profile/${item.related_id}`;
  }
}

onMounted(() => {
  loadNotifications();
});
</script>

<style scoped>
.notifications-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.notifications-header h2 {
  font-size: 24px;
}

.notification-tabs {
  margin-bottom: 20px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  border-color: rgba(0, 212, 255, 0.5);
}

.notification-item.unread {
  background: rgba(0, 212, 255, 0.05);
  border-left: 3px solid #00d4ff;
}

.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #00d4ff;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.notification-text {
  color: #888;
  font-size: 14px;
  margin-bottom: 8px;
}

.notification-time {
  color: #666;
  font-size: 12px;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.load-more {
  text-align: center;
  margin-top: 20px;
}
</style>
