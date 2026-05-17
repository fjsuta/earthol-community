<template>
  <div class="user-management">
    <h2>👥 用户管理</h2>
    
    <el-card class="filter-card">
      <el-form :inline="true" :model="filter" class="demo-form-inline">
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="封禁" value="banned" />
            <el-option label="限制" value="restricted" />
            <el-option label="已删除" value="deleted" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="filter.role" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="新手" value="newbie" />
            <el-option label="资深" value="senior" />
            <el-option label="版主" value="moderator" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filter.keyword" placeholder="用户名/邮箱" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUsers">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" v-loading="loading">
      <el-table :data="users" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar">
                {{ row.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-name">
                <div>{{ row.username }}</div>
                <div class="user-email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="等级" width="80" />
        <el-table-column prop="region_name" label="地区" width="120" />
        <el-table-column prop="post_count" label="帖子" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_active_at" label="最后活跃" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_active_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showRoleDialog(row)">
              角色
            </el-button>
            <el-button 
              v-if="row.status !== 'banned'" 
              link type="warning" size="small" 
              @click="banUser(row)"
            >
              封禁
            </el-button>
            <el-button 
              v-if="row.status === 'banned'" 
              link type="success" size="small" 
              @click="unbanUser(row)"
            >
              解封
            </el-button>
            <el-button 
              v-if="row.status !== 'deleted'" 
              link type="danger" size="small" 
              @click="deleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="limit"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </el-card>

    <el-dialog v-model="roleDialogVisible" title="修改角色" width="400px">
      <el-form :model="roleForm" label-width="80px">
        <el-form-item label="用户名">
          <span>{{ editingUser?.username }}</span>
        </el-form-item>
        <el-form-item label="当前角色">
          <el-tag :type="getRoleType(editingUser?.role)">
            {{ getRoleName(editingUser?.role) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新角色">
          <el-select v-model="roleForm.role" placeholder="请选择">
            <el-option label="新手" value="newbie" />
            <el-option label="资深" value="senior" />
            <el-option label="版主" value="moderator" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '../api';

const loading = ref(false);
const users = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const limit = ref(20);

const filter = reactive({
  role: '',
  status: '',
  keyword: ''
});

const roleDialogVisible = ref(false);
const editingUser = ref<any>(null);
const roleForm = reactive({
  role: ''
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const res = await adminApi.getUsers({
      page: page.value,
      limit: limit.value,
      ...filter
    });
    if (res.data.success) {
      users.value = res.data.data.users || [];
      total.value = res.data.data.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const resetFilter = () => {
  filter.role = '';
  filter.status = '';
  filter.keyword = '';
  page.value = 1;
  loadUsers();
};

const showRoleDialog = (user: any) => {
  editingUser.value = user;
  roleForm.role = user.role;
  roleDialogVisible.value = true;
};

const saveRole = async () => {
  try {
    await adminApi.updateUserRole(editingUser.value.id, roleForm.role);
    ElMessage.success('角色修改成功');
    roleDialogVisible.value = false;
    loadUsers();
  } catch (error) {
    ElMessage.error('角色修改失败');
  }
};

const banUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要封禁用户 "${user.username}" 吗？`,
      '警告',
      { type: 'warning' }
    );
    await adminApi.updateUserStatus(user.id, 'banned');
    ElMessage.success('封禁成功');
    loadUsers();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('封禁失败');
    }
  }
};

const unbanUser = async (user: any) => {
  try {
    await adminApi.updateUserStatus(user.id, 'active');
    ElMessage.success('解封成功');
    loadUsers();
  } catch (error) {
    ElMessage.error('解封失败');
  }
};

const deleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.username}" 吗？此操作不可撤销！`,
      '警告',
      { type: 'warning' }
    );
    await adminApi.deleteUser(user.id);
    ElMessage.success('删除成功');
    loadUsers();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const getRoleType = (role: string) => {
  const types: Record<string, any> = {
    newbie: 'info',
    senior: 'success',
    moderator: 'warning',
    admin: 'danger'
  };
  return types[role] || 'info';
};

const getRoleName = (role: string) => {
  const names: Record<string, string> = {
    newbie: '新手',
    senior: '资深',
    moderator: '版主',
    admin: '管理员'
  };
  return names[role] || role;
};

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    active: 'success',
    banned: 'danger',
    restricted: 'warning',
    deleted: 'info'
  };
  return types[status] || 'info';
};

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    active: '正常',
    banned: '封禁',
    restricted: '限制',
    deleted: '已删除'
  };
  return names[status] || status;
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management h2 {
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-name {
  overflow: hidden;
}

.user-name div:first-child {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
