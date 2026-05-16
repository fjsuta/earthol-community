
<template>
  <div class="chat-container">
    <div class="chat-header">
      <h1 class="chat-title">AI 助手</h1>
      <div class="chat-tips">
        <el-tag size="small" type="info">无脚本</el-tag>
        <el-tag size="small" type="info">思维链</el-tag>
        <el-tag size="small" type="info">被动应答</el-tag>
      </div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id"
        class="message"
        :class="msg.role"
      >
        <div class="message-avatar">
          <el-icon v-if="msg.role === 'assistant'" :size="32">
            <Odometer />
          </el-icon>
          <el-avatar v-else :size="32">U</el-avatar>
        </div>
        <div class="message-content">
          <div class="message-text">{{ msg.content }}</div>
          <div v-if="msg.thinking" class="message-thinking">
            <el-collapse>
              <el-collapse-item title="思维链">
                <div class="thinking-content">{{ msg.thinking }}</div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-input card">
      <el-input 
        v-model="inputMessage" 
        type="textarea" 
        :rows="3"
        placeholder="有什么问题想问我？"
        @keydown.enter.ctrl="sendMessage"
      />
      <div class="input-actions">
        <el-button @click="toggleVoice">
          <el-icon><Microphone /></el-icon>
          {{ isRecording ? '停止录音' : '语音输入' }}
        </el-button>
        <el-button type="primary" @click="sendMessage" :loading="isLoading">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { Odometer, Microphone } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { aiApi } from '../api';

const messages = ref<any[]>([]);
const inputMessage = ref('');
const isLoading = ref(false);
const isRecording = ref(false);
const messagesContainer = ref<HTMLElement>();

const userId = 1;

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}

async function sendMessage() {
  if (!inputMessage.value.trim() || isLoading.value) return;
  
  const userMsg = inputMessage.value;
  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: userMsg
  });
  inputMessage.value = '';
  isLoading.value = true;
  scrollToBottom();
  
  try {
    const res = await aiApi.chat({ user_id: userId, message: userMsg });
    
    if (res.data.success) {
      messages.value.push({
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data.data.response,
        thinking: res.data.data.thinking_chain
      });
    }
  } catch (error) {
    ElMessage.error('对话失败');
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
}

function toggleVoice() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    ElMessage.warning('您的浏览器不支持语音识别');
    return;
  }
  
  isRecording.value = !isRecording.value;
  
  if (isRecording.value) {
    ElMessage.info('正在录音...');
  } else {
    ElMessage.info('录音已停止');
  }
}

onMounted(() => {
  messages.value.push({
    id: 1,
    role: 'assistant',
    content: '你好！我是地球OL的AI助手。我不会主动推送信息，只回答你的问题。请问有什么可以帮助你的？'
  });
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 160px);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chat-title {
  font-size: 28px;
  font-weight: bold;
}

.chat-tips {
  display: flex;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  color: #00d4ff;
}

.message-content {
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 12px;
  color: #fff;
  line-height: 1.6;
}

.message.user .message-text {
  background: linear-gradient(135deg, #00d4ff, #0099cc);
}

.message-thinking {
  margin-top: 12px;
}

.thinking-content {
  color: #888;
  font-size: 13px;
  line-height: 1.6;
}

.chat-input {
  padding: 20px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
</style>
