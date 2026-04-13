<template>
  <div class="app-layout">
    <LayoutSidebar />
    <div class="main-wrapper">
      <LayoutHeader />
      <main class="content-area">
        <div class="page-header">
          <h2>🛡️ 用户权限管理</h2>
          <p class="subtitle">调整用户身份组</p>
        </div>

        <div class="admin-section">
          <div class="section-header">
            <div class="search-box">
              <input
                type="number"
                v-model="searchQuery"
                placeholder="输入准确QQ号"
                @keyup.enter="fetchUsers"
              />
              <button class="search-btn" @click="fetchUsers">🔍 检索</button>
              <button class="reset-btn" @click="resetSearch" v-if="searchQuery">重置</button>
            </div>
          </div>

          <div class="table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th>QQ号</th>
                  <th>当前权限</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in userList" :key="user._id">
                  <td>
                    <div class="user-info">
                      <img :src="`http://q1.qlogo.cn/g?b=qq&nk=${user._id}&s=100`" class="avatar-sm" />
                      <span>{{ user._id }}</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['role-badge', user.Role || 'normal']">
                      {{ roleMap[user.Role || 'normal'] }}
                    </span>
                  </td>
                  <td>
                    <button class="action-btn edit" @click="openRoleModal(user)">分配权限</button>
                  </td>
                </tr>
                <tr v-if="userList.length === 0">
                  <td colspan="3" class="empty-text">未找到数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <LayoutFooter />
    </div>

    <!-- 弹窗 -->
    <transition name="fade">
      <div class="modal-overlay" v-if="isRoleModalOpen" @click="closeRoleModal">
        <div class="modal-content" @click.stop>
          <h3>修改权限 - QQ: {{ editingUser._id }}</h3>
          
          <div class="form-group role-selector">
            <label>新权限层级</label>
            <select v-model="selectedRole">
              <option value="normal">普通用户 (normal)</option>
              <option value="premium">网站会员 (premium)</option>
              <option value="admin">网站管理员 (admin)</option>
              <option value="superadmin" :disabled="myRole !== 'superadmin'">最高权限 (superadmin) {{ myRole !== 'superadmin' ? '- 仅限超管' : '' }}</option>
            </select>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeRoleModal">取消</button>
            <button class="save-btn" @click="saveUserRole" :disabled="isSaving">
              {{ isSaving ? "保存中..." : "确认修改" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const userList = ref<any[]>([]);
const searchQuery = ref<string>("");
const myRole = ref<string>("admin"); // 将通过 check 接口获取实时权限

const roleMap: Record<string, string> = {
  normal: "普通用户",
  premium: "✨ 网站会员",
  admin: "🛠️ 管理员",
  superadmin: "👑 最高权限"
};

// 弹窗状态
const isRoleModalOpen = ref(false);
const isSaving = ref(false);
const editingUser = ref<any>(null);
const selectedRole = ref<string>("normal");

const checkRole = async () => {
    try {
        const res = await http.get("/admin/check");
        if(res.data?.ok) {
            myRole.value = res.data.role || "admin";
        }
    } catch(e) {
        console.error(e);
    }
}

const fetchUsers = async () => {
  try {
    const params: any = { page: 1, limit: 20 };
    if (searchQuery.value) params.search_qq = searchQuery.value;

    const res = await http.get("/admin/users", { params });
    if (res.data?.ok) userList.value = res.data.data.list;
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("权限不足");
      router.push("/panel");
    }
  }
};

const resetSearch = () => {
  searchQuery.value = "";
  fetchUsers();
};

const openRoleModal = (user: any) => {
  editingUser.value = user;
  selectedRole.value = user.Role || "normal";
  isRoleModalOpen.value = true;
};
const closeRoleModal = () => {
  isRoleModalOpen.value = false;
  editingUser.value = null;
};

const saveUserRole = async () => {
  isSaving.value = true;
  try {
    const res = await http.put(`/admin/role/${editingUser.value._id}`, {
        Role: selectedRole.value
    });
    if (res.data?.ok) {
      Swal.fire({ title: "修改成功", icon: "success", toast: true, position: "top-end", timer: 2000, showConfirmButton: false });
      
      // 如果修改的是自己的权限，立即刷新全局状态
      if (editingUser.value._id === authStore.qq) {
        authStore.refreshStatus();
      }

      closeRoleModal();
      fetchUsers();
    } else {
        Swal.fire({icon: "error", title: "操作失败", text: res.data?.message});
    }
  } catch (error: any) {
      Swal.fire({icon: "error", title: "请求失败", text: error.response?.data?.message || "网络异常"});
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
    checkRole();
    fetchUsers();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-main);
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 300px;
  min-width: 0;
}
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}
.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
}

.admin-section {
  width: 100%;
  min-width: 0;
}
.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.section-header {
  margin-bottom: 20px;
}
.search-box {
  display: flex;
  gap: 12px;
}
.search-box input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-main);
  outline: none;
  flex: 1;
  max-width: 300px;
}
.search-btn,
.reset-btn {
  padding: 0 20px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.search-btn {
  background: var(--primary-color);
  color: white;
}
.reset-btn {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.table-container {
  background: var(--surface-color);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
.user-table th,
.user-table td {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}
.user-table th {
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-secondary);
  font-weight: normal;
}
.user-table tr:hover {
  background: var(--bg-color);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
}
.avatar-sm {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.role-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: bold;
    display: inline-block;
}
.role-badge.normal {
    background: rgba(100, 116, 139, 0.15);
    color: var(--text-secondary);
}
.role-badge.premium {
    background: rgba(234, 179, 8, 0.15);
    color: #eab308;
}
.role-badge.admin {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
}
.role-badge.superadmin {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(168, 85, 247, 0.15));
    color: #ef4444;
}

.action-btn {
  padding: 6px 16px;
  border-radius: 6px;
  border: none;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 0.9rem;
}
.empty-text {
  text-align: center;
  color: var(--text-muted);
  padding: 40px !important;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: var(--surface-color);
  padding: 30px;
  border-radius: 16px;
  width: 400px;
  border: 1px solid var(--border-color);
}
.modal-content h3 {
  margin-top: 0;
  margin-bottom: 24px;
}
.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.form-group.role-selector select {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-main);
  outline: none;
  font-size: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}
.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
.cancel-btn {
  background: var(--bg-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}
.save-btn {
  background: var(--primary-color);
  color: white;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
    transition: margin-left 0.3s ease;
  }
  .content-area {
    padding: 0 20px 20px 20px;
  }
}
</style>
