<template>
  <div class="icp-management">
    <h2>📋 备案信息管理</h2>
    
    <el-card class="config-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-divider content-position="left">ICP备案</el-divider>
        
        <el-form-item label="ICP备案号" prop="icp_number">
          <el-input v-model="form.icp_number" placeholder="例如：京ICP备xxxxxxxx号" />
        </el-form-item>
        
        <el-form-item label="ICP备案链接" prop="icp_url">
          <el-input v-model="form.icp_url" placeholder="例如：https://beian.miit.gov.cn" />
        </el-form-item>

        <el-divider content-position="left">公安备案</el-divider>
        
        <el-form-item label="公安备案号" prop="icp_police_number">
          <el-input v-model="form.icp_police_number" placeholder="例如：京公网安备xxxxxxxxxxxx号" />
        </el-form-item>
        
        <el-form-item label="公安备案链接" prop="icp_police_url">
          <el-input v-model="form.icp_police_url" placeholder="例如：http://www.beian.gov.cn/portal/registerSystemInfo" />
        </el-form-item>

        <el-divider content-position="left">其他</el-divider>
        
        <el-form-item label="版权信息" prop="copyright_text">
          <el-input v-model="form.copyright_text" placeholder="例如：© 2024 地球OL全球玩家社区" />
        </el-form-item>
        
        <el-form-item label="显示页脚备案" prop="show_footer">
          <el-switch v-model="form.show_footer" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveConfig" :loading="loading">
            保存配置
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="preview-card">
      <h3>📱 页脚预览</h3>
      <div class="footer-preview">
        <div v-if="form.show_footer !== false" class="preview-content">
          <div class="footer-links">
            <a v-if="form.icp_number" :href="form.icp_url || '#'" target="_blank" class="footer-link">
              {{ form.icp_number }}
            </a>
            <a v-if="form.icp_police_number" :href="form.icp_police_url || '#'" target="_blank" class="footer-link">
              {{ form.icp_police_number }}
            </a>
          </div>
          <div v-if="form.copyright_text" class="copyright">
            {{ form.copyright_text }}
          </div>
        </div>
        <div v-else class="empty-preview">
          页脚备案信息已隐藏
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { configApi } from '../api';
import type { FormInstance, FormRules } from 'element-plus';

const loading = ref(false);
const formRef = ref<FormInstance>();

const form = reactive({
  icp_number: '',
  icp_url: '',
  icp_police_number: '',
  icp_police_url: '',
  copyright_text: '',
  show_footer: true
});

const rules: FormRules = {
  icp_number: [{ trigger: 'blur' }],
  icp_url: [{ type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }],
  icp_police_number: [{ trigger: 'blur' }],
  icp_police_url: [{ type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }],
  copyright_text: [{ trigger: 'blur' }]
};

const loadConfigs = async () => {
  loading.value = true;
  try {
    const res = await configApi.getICPConfigs();
    if (res.data.success) {
      const data = res.data.data || {};
      form.icp_number = data.icp_number ? JSON.parse(data.icp_number) : '';
      form.icp_url = data.icp_url ? JSON.parse(data.icp_url) : '';
      form.icp_police_number = data.icp_police_number ? JSON.parse(data.icp_police_number) : '';
      form.icp_police_url = data.icp_police_url ? JSON.parse(data.icp_police_url) : '';
      form.copyright_text = data.copyright_text ? JSON.parse(data.copyright_text) : '';
      form.show_footer = data.show_footer ? JSON.parse(data.show_footer) : true;
    }
  } catch (error) {
    ElMessage.error('获取配置失败');
  } finally {
    loading.value = false;
  }
};

const saveConfig = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    loading.value = true;
    try {
      await configApi.updateICPConfigs({
        icp_number: JSON.stringify(form.icp_number),
        icp_url: JSON.stringify(form.icp_url),
        icp_police_number: JSON.stringify(form.icp_police_number),
        icp_police_url: JSON.stringify(form.icp_police_url),
        copyright_text: JSON.stringify(form.copyright_text),
        show_footer: form.show_footer
      });
      ElMessage.success('保存成功');
    } catch (error) {
      ElMessage.error('保存失败');
    } finally {
      loading.value = false;
    }
  });
};

const resetForm = () => {
  loadConfigs();
};

onMounted(() => {
  loadConfigs();
});
</script>

<style scoped>
.icp-management h2 {
  margin-bottom: 20px;
}

.config-card {
  margin-bottom: 20px;
}

.preview-card h3 {
  margin-bottom: 15px;
}

.footer-preview {
  background: #f5f7fa;
  padding: 30px;
  border-radius: 8px;
  text-align: center;
}

.preview-content {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 10px;
}

.footer-link {
  color: #606266;
  text-decoration: none;
  font-size: 14px;
}

.footer-link:hover {
  color: #409eff;
}

.copyright {
  color: #909399;
  font-size: 13px;
}

.empty-preview {
  color: #909399;
  padding: 20px;
}
</style>
