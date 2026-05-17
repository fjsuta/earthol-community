<template>
  <div class="storage-config">
    <div class="header">
      <h2>💾 存储配置</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        添加配置
      </el-button>
    </div>

    <el-card v-loading="loading" class="config-list">
      <el-empty v-if="!configs.length" description="暂无存储配置" />
      
      <el-collapse v-else v-model="activeCollapse">
        <el-collapse-item v-for="config in configs" :key="config.id" :name="config.id">
          <template #title>
            <div class="config-header">
              <div class="config-title">
                <el-tag :type="config.is_default ? 'primary' : 'info'" size="small">
                  {{ config.is_default ? '默认' }}
                </el-tag>
                <span class="name">{{ config.config_name }}</span>
                <el-tag size="small" :type="getStorageTypeColor(config.storage_type)">
                  {{ getStorageTypeName(config.storage_type) }}
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
              <el-descriptions-item label="本地路径">{{ config.local_base_path || '-' }}</el-descriptions-item>
              <el-descriptions-item label="Access Key">{{ config.access_key ? '••••••••' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="Bucket">{{ config.bucket || '-' }}</el-descriptions-item>
              <el-descriptions-item label="区域">{{ config.region || '-' }}</el-descriptions-item>
              <el-descriptions-item label="Endpoint">{{ config.endpoint || '-' }}</el-descriptions-item>
              <el-descriptions-item label="Base URL">{{ config.base_url || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最大文件大小">{{ config.max_file_size ? formatBytes(config.max_file_size) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="允许的扩展名">{{ config.allowed_extensions || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑存储配置' : '添加存储配置'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="配置名称" prop="config_name">
          <el-input v-model="form.config_name" placeholder="例如: 本地存储" />
        </el-form-item>
        <el-form-item label="存储类型" prop="storage_type">
          <el-select v-model="form.storage_type" placeholder="请选择" @change="onStorageTypeChange">
            <el-option label="本地存储" value="local" />
            <el-option label="阿里云OSS" value="aliyun" />
            <el-option label="华为云OBS" value="huaweicloud" />
            <el-option label="腾讯云COS" value="qcloud" />
            <el-option label="京东云OSS" value="jdcloud" />
            <el-option label="雨云OSS" value="raincloud" />
            <el-option label="S3兼容" value="s3" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <template v-if="form.storage_type === 'local'">
          <el-form-item label="本地路径" prop="local_base_path">
            <el-input v-model="form.local_base_path" placeholder="例如: /uploads" />
          </el-form-item>
        </template>
        
        <template v-else>
          <el-form-item label="Access Key" prop="access_key">
            <el-input v-model="form.access_key" placeholder="Access Key" />
          </el-form-item>
          <el-form-item label="Secret Key" prop="secret_key">
            <el-input v-model="form.secret_key" type="password" placeholder="Secret Key" show-password />
          </el-form-item>
          <el-form-item label="Bucket" prop="bucket">
            <el-input v-model="form.bucket" placeholder="Bucket名称" />
          </el-form-item>
          <el-form-item label="区域" prop="region">
            <el-input v-model="form.region" placeholder="例如: cn-beijing" />
          </el-form-item>
          <el-form-item label="Endpoint" prop="endpoint">
            <el-input v-model="form.endpoint" placeholder="Endpoint地址" />
          </el-form-item>
          <el-form-item label="Base URL" prop="base_url">
            <el-input v-model="form.base_url" placeholder="访问基础URL" />
          </el-form-item>
          <el-form-item label="CDN域名" prop="cdn_url">
            <el-input v-model="form.cdn_url" placeholder="CDN域名（可选）" />
          </el-form-item>
        </template>
        
        <el-form-item label="最大文件大小(字节)" prop="max_file_size">
          <el-input-number v-model="form.max_file_size" :min="1" :step="1048576" />
        </el-form-item>
        <el-form-item label="允许的扩展名" prop="allowed_extensions">
          <el-input v-model="form.allowed_extensions" placeholder="例如: jpg,png,gif" />
        </el-form-item>
        <el-form-item label="启用HTTPS" prop="is_https">
          <el-switch v-model="form.is_https" />
        </el-form-item>
        <el-form-item label="启用" prop="is_active">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="设为默认" prop="is_default">
          <el-switch v-model="form.is_default" />
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
  config_name: '',
  storage_type: 'local',
  is_default: false,
  local_base_path: '/uploads',
  access_key: '',
  secret_key: '',
  bucket: '',
  region: '',
  endpoint: '',
  base_url: '',
  is_https: true,
  cdn_url: '',
  storage_class: '',
  max_file_size: 104857600,
  allowed_extensions: '',
  extra_config: null,
  is_active: true
});

const rules: FormRules = {
  config_name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  storage_type: [{ required: true, message: '请选择存储类型', trigger: 'change' }]
};

const loadConfigs = async () => {
  loading.value = true;
  try {
    const res = await configApi.getStorageConfigs();
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
    config_name: '',
    storage_type: 'local',
    is_default: false,
    local_base_path: '/uploads',
    access_key: '',
    secret_key: '',
    bucket: '',
    region: '',
    endpoint: '',
    base_url: '',
    is_https: true,
    cdn_url: '',
    storage_class: '',
    max_file_size: 104857600,
    allowed_extensions: '',
    extra_config: null,
    is_active: true
  });
  dialogVisible.value = true;
};

const editConfig = (config: any) => {
  isEdit.value = true;
  Object.assign(form, { ...config });
  dialogVisible.value = true;
};

const onStorageTypeChange = (type: string) => {
  const presets: Record<string, any> = {
    local: { local_base_path: '/uploads' },
    aliyun: { endpoint: 'oss-cn-beijing.aliyuncs.com' },
    qcloud: { endpoint: 'cos.ap-beijing.myqcloud.com' }
  };
  if (presets[type]) {
    Object.assign(form, presets[type]);
  }
};

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await configApi.updateStorageConfig(form.id!, form);
          ElMessage.success('更新成功');
        } else {
          await configApi.createStorageConfig(form);
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
    await configApi.deleteStorageConfig(id);
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
    const res = await configApi.testStorageConfig(id);
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

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStorageTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    local: 'info',
    aliyun: 'primary',
    huaweicloud: 'success',
    qcloud: 'warning',
    jdcloud: 'danger',
    raincloud: 'info',
    s3: '',
    custom: ''
  };
  return colors[type] || '';
};

const getStorageTypeName = (type: string) => {
  const names: Record<string, string> = {
    local: '本地存储',
    aliyun: '阿里云OSS',
    huaweicloud: '华为云OBS',
    qcloud: '腾讯云COS',
    jdcloud: '京东云OSS',
    raincloud: '雨云OSS',
    s3: 'S3兼容',
    custom: '自定义'
  };
  return names[type] || type;
};

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.storage-config .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.storage-config h2 {
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
