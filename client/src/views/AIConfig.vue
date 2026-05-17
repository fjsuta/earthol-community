<template>
  <div class="ai-config">
    <div class="header">
      <h2>🤖 AI服务配置</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        添加配置
      </el-button>
    </div>

    <el-card v-loading="loading" class="config-list">
      <el-empty v-if="!configs.length" description="暂无AI配置" />
      
      <el-collapse v-else v-model="activeCollapse">
        <el-collapse-item v-for="config in configs" :key="config.id" :name="config.id">
          <template #title>
            <div class="config-header">
              <div class="config-title">
                <el-tag :type="config.is_default ? 'primary' : 'info'" size="small">
                  {{ config.is_default ? '默认' }}
                </el-tag>
                <span class="name">{{ config.provider_name }}</span>
                <el-tag size="small" :type="getProviderTypeColor(config.provider_type)">
                  {{ getProviderTypeName(config.provider_type) }}
                </el-tag>
                <el-tag size="small" :type="config.is_active ? 'success' : 'danger'">
                  {{ config.is_active ? '启用' : '禁用' }}
                </el-tag>
                <el-tag v-if="config.last_test_status" size="small" :type="config.last_test_status === 'success' ? 'success' : 'danger'">
                  {{ config.last_test_status === 'success' ? '测试通过' : '测试失败' }}
                </el-tag>
              </div>
              <div class="config-actions">
                <el-button link type="primary" size="small" @click="testConfig(config.id)">测试</el-button>
                <el-button link type="primary" size="small" @click="editConfig(config)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteConfig(config.id)">删除</el-button>
              </div>
            </div>
          </template>
          
          <div class="config-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Base URL">{{ config.base_url || '-' }}</el-descriptions-item>
              <el-descriptions-item label="API Key">{{ config.api_key ? '••••••••' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="默认模型">{{ config.default_model || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最大Token">{{ config.max_tokens || '-' }}</el-descriptions-item>
              <el-descriptions-item label="温度">{{ config.temperature || '-' }}</el-descriptions-item>
              <el-descriptions-item label="超时">{{ config.timeout ? config.timeout + 'ms' : '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑AI配置' : '添加AI配置'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="服务商名称" prop="provider_name">
          <el-input v-model="form.provider_name" placeholder="例如: OpenAI" />
        </el-form-item>
        <el-form-item label="服务商类型" prop="provider_type">
          <el-select v-model="form.provider_type" placeholder="请选择" @change="onProviderTypeChange">
            <el-option label="OpenAI兼容" value="openai" />
            <el-option label="Ollama" value="ollama" />
            <el-option label="硅基流动" value="siliconflow" />
            <el-option label="xAI" value="xai" />
            <el-option label="火山引擎" value="volcengine" />
            <el-option label="阿里百炼" value="qwen" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="Base URL" prop="base_url">
          <el-input v-model="form.base_url" placeholder="API基础地址" />
        </el-form-item>
        <el-form-item label="API Key" prop="api_key">
          <el-input v-model="form.api_key" type="password" placeholder="API密钥" show-password />
        </el-form-item>
        <el-form-item label="API Version" prop="api_version">
          <el-input v-model="form.api_version" placeholder="API版本（可选）" />
        </el-form-item>
        <el-form-item label="默认模型" prop="default_model">
          <el-input v-model="form.default_model" placeholder="例如: gpt-4" />
        </el-form-item>
        <el-form-item label="最大Token" prop="max_tokens">
          <el-input-number v-model="form.max_tokens" :min="1" :max="100000" />
        </el-form-item>
        <el-form-item label="温度" prop="temperature">
          <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" />
        </el-form-item>
        <el-form-item label="超时(ms)" prop="timeout">
          <el-input-number v-model="form.timeout" :min="1000" :max="60000" :step="1000" />
        </el-form-item>
        <el-form-item label="启用" prop="is_active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="设为默认" prop="is_default">
          <el-switch v-model="form.is_default" />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="form.priority" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { configApi } from '../api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';

const loading = ref(false);
const configs = ref<any[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const activeCollapse = ref<any[]>([]);
const formRef = ref<FormInstance>();

const form = reactive({
  id: null as number | null,
  provider_name: '',
  provider_type: 'openai',
  base_url: '',
  api_key: '',
  api_version: '',
  default_model: '',
  max_tokens: 1000,
  temperature: 0.7,
  timeout: 30000,
  is_active: true,
  is_default: false,
  priority: 0
});

const rules: FormRules = {
  provider_name: [{ required: true, message: '请输入服务商名称', trigger: 'blur' }],
  provider_type: [{ required: true, message: '请选择服务商类型', trigger: 'change' }]
};

const loadConfigs = async () => {
  loading.value = true;
  try {
    const res = await configApi.getAIConfigs();
    if (res.data.success) {
      configs.value = res.data.data;
    }
  } catch (error) {
    ElMessage.error('获取配置失败');
  } finally {
    loading.value = false;
  }
};

const showCreateDialog = () => {
  isEdit.value = false;
  Object.assign(form, {
    id: null,
    provider_name: '',
    provider_type: 'openai',
    base_url: '',
    api_key: '',
    api_version: '',
    default_model: '',
    max_tokens: 1000,
    temperature: 0.7,
    timeout: 30000,
    is_active: true,
    is_default: false,
    priority: 0
  });
  dialogVisible.value = true;
};

const editConfig = (config: any) => {
  isEdit.value = true;
  Object.assign(form, { ...config });
  dialogVisible.value = true;
};

const onProviderTypeChange = (type: string) => {
  const presets: Record<string, any> = {
    openai: { base_url: 'https://api.openai.com/v1', default_model: 'gpt-4' },
    ollama: { base_url: 'http://localhost:11434', default_model: 'llama2' },
    siliconflow: { base_url: 'https://api.siliconflow.cn/v1', default_model: 'Qwen/Qwen2.5-7B-Instruct' },
    xai: { base_url: 'https://api.x.ai/v1', default_model: 'grok-beta' },
    volcengine: { base_url: 'https://ark.cn-beijing.volces.com/api/v3', default_model: '' },
    qwen: { base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', default_model: 'qwen-plus' }
  };
  if (presets[type]) {
    form.base_url = presets[type].base_url;
    form.default_model = presets[type].default_model;
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await configApi.updateAIConfig(form.id!, form);
          ElMessage.success('更新成功');
        } else {
          await configApi.createAIConfig(form);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadConfigs();
      } catch (error) {
        ElMessage.error('操作失败');
      }
    }
  });
};

const deleteConfig = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配置吗?', '警告', {
      type: 'warning'
    });
    await configApi.deleteAIConfig(id);
    ElMessage.success('删除成功');
    loadConfigs();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const testConfig = async (id: number) => {
  try {
    const res = await configApi.testAIConfig(id);
    if (res.data.success) {
      ElMessage.success('测试成功!');
    } else {
      ElMessage.error('测试失败: ' + res.data.message);
    }
    loadConfigs();
  } catch (error) {
    ElMessage.error('测试失败');
  }
};

const getProviderTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    openai: '',
    ollama: 'primary',
    siliconflow: 'success',
    xai: 'warning',
    volcengine: 'info',
    qwen: 'danger',
    custom: ''
  };
  return colors[type] || '';
};

const getProviderTypeName = (type: string) => {
  const names: Record<string, string> = {
    openai: 'OpenAI兼容',
    ollama: 'Ollama',
    siliconflow: '硅基流动',
    xai: 'xAI',
    volcengine: '火山引擎',
    qwen: '阿里百炼',
    custom: '自定义'
  };
  return names[type] || type;
};

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.ai-config .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.ai-config h2 {
  margin: 0;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.config-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.config-title .name {
  font-weight: bold;
  font-size: 16px;
}

.config-actions {
  display: flex;
  gap: 10px;
}

.config-detail {
  padding: 10px 0;
}
</style>
