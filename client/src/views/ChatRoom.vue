
<template>
  <div class="chatroom-container">
    <div class="chatroom-sidebar">
      <div class="sidebar-header">
        <h3>在线玩家</h3>
        <el-tag type="success">{{ onlineUsers.length }} 在线</el-tag>
      </div>
      <div class="users-list">
        <div 
          v-for="user in onlineUsers" 
          :key="user.id"
          class="user-item"
        >
          <el-avatar :size="36">
            {{ user.username?.charAt(0) }}
          </el-avatar>
          <span class="username">{{ user.username }}</span>
        </div>
      </div>
    </div>

    <div class="chatroom-main">
      <div class="chatroom-header">
        <h2>全球公屏</h2>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="msg in messages" 
          :key="msg.id"
          class="message"
        >
          <el-avatar :size="36">
            {{ msg.user?.charAt(0) }}
          </el-avatar>
          <div class="message-content">
            <div class="message-header">
              <span class="message-user">{{ msg.user }}</span>
              <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>

      <div class="chat-input card">
        <el-input 
          v-model="inputMessage" 
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
        >
          <template #append>
            <el-button @click="sendMessage" :loading="isJoining">
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { io, Socket } from 'socket.io-client';
import { useEarthStore } from '../store';

let socket: Socket | null = null;

const store = useEarthStore();
const { onlineUsers } = store;

const messages = ref<any[]>([]);
const inputMessage = ref('');
const isJoining = ref(true);
const messagesContainer = ref<HTMLElement>();

const username = `玩家${Math.floor(Math.random() * 10000)}`;

function formatTime(time: string) {
  return new Date(time).toLocaleTimeString('zh-CN');
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

function sendMessage() {
  if (!inputMessage.value.trim() || !socket) return;
  
  socket.emit('chatMessage', {
    content: inputMessage.value
  });
  
  inputMessage.value = '';
}

function setupWebSocket() {
  socket = io('http://localhost:3001');
  
  socket.on('connect', () => {
    socket?.emit('join', { username });
    isJoining.value = false;
  });
  
  socket.on('onlineUsers', (users) => {
    store.setOnlineUsers(users);
  });
  
  socket.on('chatMessage', (msg) => {
    messages.value.push(msg);
    scrollToBottom();
  });
}

onMounted(() => {
  setupWebSocket();
});

onUnmounted(() => {
  if (socket) {
    socket.disconnect();
  }
});
</script>

<style scoped>
.chatroom-container {
  display: flex;
  height: calc(100vh - 160px);
  gap: 20px;
}

.chatroom-sidebar {
  width: 280px;
  background: rgba(26, 26, 61, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h3 {
  font-size: 18px;
  font-weight: bold;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.username {
  color: #fff;
}

.chatroom-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chatroom-header {
  padding: 16px 24px;
  background: rgba(26, 26, 61, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
}

.chatroom-header h2 {
  font-size: 20px;
  font-weight: bold;
}

.chat-messages {
  flex: 1;
  background: rgba(26, 26, 61, 0.8);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  gap: 12px;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.message-user {
  color: #00d4ff;
  font-weight: 500;
}

.message-time {
  color: #888;
  font-size: 12px;
}

.message-text {
  color: #fff;
  line-height: 1.6;
}

.chat-input {
  padding: 16px;
}
</style>
