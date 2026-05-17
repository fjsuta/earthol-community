<template>
  <div class="database-config">
    <div class="header">
      <h2>🗄️ 数据库配置</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        添加配置
      </el-button>
    </div>

    <el-card v-loading="loading" class="config-list">
      <el-empty v-if="!configs.length" description="暂无数据库配置" />
      
      <el-collapse v-else v-model="activeCollapse">
        <el-collapse-item v-for="config in configs" :key="config.id" :name="config.id">
          <template #title>
            <div class="config-header">
              <div class="config-title">
                <el-tag :type="config.is_default ? 'primary' : 'info'" size="small">
                  {{ config.is_default ? '默认' }}
                </el-tag>
                <span class="name">{{ config.config_name }}</span>
                <el-tag size="small" :type="getDBTypeColor(config.db_type)">
                  {{ getDBTypeName(config.db_type) }}
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
              <el-descriptions-item label="主机">{{ config.host || '-' }}</el-descriptions-item>
              <el-descriptions-item label="端口">{{ config.port || '-' }}</el-descriptions-item>
              <el-descriptions-item label="用户名">{{ config.username || '-' }}</el-descriptions-item>
              <el-descriptions-item label="数据库名">{{ config.database_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="连接池大小">{{ config.connection_limit || '-' }}</el-descriptions-item>
              <el-descriptions-item label="字符集">{{ config.charset || '-' }}</el-descriptions-item>
              <el-descriptions-item label="时区">{{ config.timezone || '-' }}</el-descriptions-item>
              <el-descriptions-item label="SSL">{{ config.ssl_enabled ? '启用' : '禁用' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑数据库配置' : '添加数据库配置'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="配置名称" prop="config_name">
          <el-input v-model="form.config_name" placeholder="例如: 本地数据库" />
        </el-form-item>
        <el-form-item label="数据库类型" prop="db_type">
          <el-select v-model="form.db_type" placeholder="请选择">
            <el-option label="MySQL" value="mysql" />
            <el-option label="PostgreSQL" value="postgresql" />
            <el-option label="MariaDB" value="mariadb" />
            <el-option label="TiDB" value="tidb" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="form.host" placeholder="例如: localhost" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="例如: root" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item label="数据库名" prop="database_name">
          <el-input v-model="form.database_name" placeholder="例如: earthol" />
        </el-form-item>
        <el-form-item label="连接池大小" prop="connection_limit">
          <el-input-number v-model="form.connection_limit" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="字符集" prop="charset">
          <el-input v-model="form.charset" placeholder="例如: utf8mb4" />
        </el-form-item>
        <el-form-item label="时区" prop="timezone">
          <el-input v-model="form.timezone" placeholder="例如: +08:00" />
        </el-form-item>
        <el-form-item label="启用SSL" prop="ssl_enabled">
          <el-switch v-model="form.ssl_enabled" />
        </el-form-item>
        <el-form-item label="CA证书" prop="ca_cert" v-if="form.ssl_enabled">
          <el-input v-model="form.ca_cert" type="textarea" placeholder="CA证书内容" :rows="3" />
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
  db_type: 'mysql',
  is_default: false,
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database_name: 'earthol',
  connection_limit: 10,
  charset: 'utf8mb4',
  timezone: '+08:00',
  ssl_enabled: false,
  ca_cert: '',
  extra_config: null,
  is_active: true
});

const rules: FormRules = {
  config_name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  db_type: [{ required: true, message: '请选择数据库类型', trigger: 'change' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  database_name: [{ required: true, message: '请输入数据库名', trigger: 'blur' }]
};

const loadConfigs = async () => {
  loading.value = true;
  try {
    const res = await configApi.getDatabaseConfigs();
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
    db_type: 'mysql',
    is_default: false,
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: '',
    database_name: 'earthol',
    connection_limit: 10,
    charset: 'utf8mb4',
    timezone: '+08:00',
    ssl_enabled: false,
    ca_cert: '',
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

const submitForm = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await configApi.updateDatabaseConfig(form.id!, form);
          ElMessage.success('更新成功');
        } else {
          await configApi.createDatabaseConfig(form);
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
    await configApi.deleteDatabaseConfig(id);
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
    const res = await configApi.testDatabaseConfig(id);
    if (res.data.success) {
      ElMessage.success('连接成功!');
    } else {
      ElMessage.error('连接失败: ' + res.data.message);
    }
    loadConfigs();
  } catch (error) {
    ElMessage.error('测试失败');
  }
};

const getDBTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    mysql: 'primary',
    postgresql: 'success',
    mariadb: 'warning',
    tidb: 'info',
    custom: ''
  };
  return colors[type] || '';
};

const getDBTypeName = (type: string) => {
  const names: Record<string, string> = {
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    mariadb: 'MariaDB',
    tidb: 'TiDB',
    custom: '自定义'
  };
  return names[type] || type;
};

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.database-config .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.database-config h2 {
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
