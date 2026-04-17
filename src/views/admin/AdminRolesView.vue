<template>
  <main class="content-area">
    <div class="page-header">
      <h2>用户权限管理</h2>
      <p class="subtitle">默认展示全部用户，按权限高低排序，并支持封禁与解封</p>
    </div>

    <section class="admin-section">
      <div class="toolbar">
        <div class="search-box">
          <input
            v-model.trim="searchQuery"
            type="text"
            placeholder="输入 QQ 号进行模糊检索"
            @keyup.enter="applySearch"
          />
          <button class="search-btn" @click="applySearch">检索</button>
          <button v-if="searchQuery" class="reset-btn" @click="resetSearch">
            重置
          </button>
        </div>

        <div class="summary-text">
          共 {{ totalUsers }} 条，当前第 {{ currentPage }} / {{ totalPages }} 页，每页 50 条
        </div>
      </div>

      <div class="table-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>QQ</th>
              <th>权限</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userList" :key="user._id">
              <td>
                <div class="user-info">
                  <img
                    :src="`http://q1.qlogo.cn/g?b=qq&nk=${user._id}&s=100`"
                    class="avatar-sm"
                  />
                  <span>{{ user._id }}</span>
                </div>
              </td>
              <td>
                <span :class="['role-badge', user.Role || 'normal']">
                  {{ roleMap[user.Role || "normal"] }}
                </span>
              </td>
              <td>
                <span :class="['status-badge', user.Banned ? 'banned' : 'active']">
                  {{ user.Banned ? "已封禁" : "正常" }}
                </span>
              </td>
              <td>
                <div class="action-group">
                  <button class="action-btn edit" @click="openRoleModal(user)">
                    修改权限
                  </button>
                  <button
                    class="action-btn"
                    :class="user.Banned ? 'unban' : 'ban'"
                    @click="toggleBan(user)"
                  >
                    {{ user.Banned ? "解封" : "封禁" }}
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!userList.length">
              <td colspan="4" class="empty-text">没有符合条件的数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-bar">
        <button class="page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
          上一页
        </button>
        <div class="page-jump">
          <span>跳转到</span>
          <input
            v-model.number="pageInput"
            type="number"
            min="1"
            :max="totalPages"
            @keyup.enter="jumpToPage"
          />
          <span>页</span>
          <button class="page-btn" @click="jumpToPage">前往</button>
        </div>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">
          下一页
        </button>
      </div>
    </section>

    <transition name="fade">
      <div v-if="isRoleModalOpen" class="modal-overlay" @click="closeRoleModal">
        <div class="modal-content" @click.stop>
          <h3>修改权限 - QQ: {{ editingUser?._id }}</h3>

          <div class="form-group">
            <label>新的权限等级</label>
            <select v-model="selectedRole">
              <option value="normal">普通用户</option>
              <option value="premium">网站会员</option>
              <option value="admin">管理员</option>
              <option value="superadmin" :disabled="myRole !== 'superadmin'">
                超级管理员
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeRoleModal">取消</button>
            <button class="save-btn" :disabled="isSaving" @click="saveUserRole">
              {{ isSaving ? "保存中..." : "确认修改" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/auth";
import http from "@/utils/http";

type UserRow = {
  _id: number;
  Role?: string;
  Banned?: boolean;
};

const router = useRouter();
const authStore = useAuthStore();
const PAGE_SIZE = 50;

const userList = ref<UserRow[]>([]);
const searchQuery = ref("");
const myRole = ref("admin");
const currentPage = ref(1);
const totalPages = ref(1);
const totalUsers = ref(0);
const pageInput = ref(1);

const roleMap: Record<string, string> = {
  normal: "普通用户",
  premium: "网站会员",
  admin: "管理员",
  superadmin: "超级管理员",
};

const isRoleModalOpen = ref(false);
const isSaving = ref(false);
const editingUser = ref<UserRow | null>(null);
const selectedRole = ref("normal");

const checkRole = async () => {
  try {
    const res = await http.get("/admin/check");
    if (res.data?.ok) {
      myRole.value = res.data.role || "admin";
    }
  } catch (error) {
    console.error(error);
  }
};

const fetchUsers = async (page = currentPage.value) => {
  try {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
      sort_by: "role",
    };

    if (searchQuery.value) {
      params.search_qq = searchQuery.value;
    }

    const res = await http.get("/admin/users", { params });
    if (res.data?.ok) {
      userList.value = res.data.data.list;
      totalUsers.value = res.data.data.total || 0;
      totalPages.value = res.data.data.total_pages || 1;
      currentPage.value = res.data.data.page || 1;
      pageInput.value = currentPage.value;
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      router.push("/panel");
    }
  }
};

const applySearch = () => {
  currentPage.value = 1;
  pageInput.value = 1;
  fetchUsers(1);
};

const resetSearch = () => {
  searchQuery.value = "";
  applySearch();
};

const goToPage = (page: number) => {
  const targetPage = Math.min(Math.max(page, 1), totalPages.value);
  fetchUsers(targetPage);
};

const jumpToPage = () => {
  goToPage(pageInput.value || 1);
};

const openRoleModal = (user: UserRow) => {
  editingUser.value = user;
  selectedRole.value = user.Role || "normal";
  isRoleModalOpen.value = true;
};

const closeRoleModal = () => {
  isRoleModalOpen.value = false;
  editingUser.value = null;
};

const saveUserRole = async () => {
  if (!editingUser.value) return;

  isSaving.value = true;
  try {
    const res = await http.put(`/admin/role/${editingUser.value._id}`, {
      Role: selectedRole.value,
    });

    if (res.data?.ok) {
      if (String(editingUser.value._id) === authStore.qq) {
        authStore.refreshStatus();
      }

      closeRoleModal();
      fetchUsers();

      Swal.fire({
        title: "修改成功",
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "操作失败",
        text: res.data?.message,
      });
    }
  } catch (error: any) {
    Swal.fire({
      icon: "error",
      title: "请求失败",
      text: error.response?.data?.message || "网络异常",
    });
  } finally {
    isSaving.value = false;
  }
};

const toggleBan = async (user: UserRow) => {
  const willBan = !user.Banned;
  const actionText = willBan ? "封禁" : "解封";

  const result = await Swal.fire({
    title: `确认${actionText}？`,
    text: willBan
      ? `用户 ${user._id} 被封禁后将无法登录和进入页面。`
      : `将恢复用户 ${user._id} 的登录和访问能力。`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `确认${actionText}`,
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await http.put(`/admin/ban/${user._id}`, {
      Banned: willBan,
    });

    if (res.data?.ok) {
      fetchUsers();
      Swal.fire({
        title: `${actionText}成功`,
        icon: "success",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: `${actionText}失败`,
        text: res.data?.message,
      });
    }
  } catch (error: any) {
    Swal.fire({
      icon: "error",
      title: `${actionText}失败`,
      text: error.response?.data?.message || error.response?.data?.detail || "网络异常",
    });
  }
};

onMounted(() => {
  checkRole();
  fetchUsers();
});
</script>

<style scoped>
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.admin-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box input,
.page-jump input,
.form-group select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-main);
  outline: none;
}

.search-box input {
  min-width: 280px;
}

.search-btn,
.reset-btn,
.page-btn,
.action-btn,
.cancel-btn,
.save-btn {
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 700;
  cursor: pointer;
}

.search-btn,
.save-btn,
.action-btn.edit {
  background: var(--primary-color);
  color: #fff;
}

.reset-btn,
.page-btn,
.cancel-btn {
  background: var(--surface-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
}

.action-btn.ban {
  background: #ef4444;
  color: #fff;
}

.action-btn.unban {
  background: #10b981;
  color: #fff;
}

.summary-text {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.table-container {
  background: var(--surface-color);
  border-radius: 14px;
  border: 1px solid var(--border-color);
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.user-table th,
.user-table td {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
}

.user-table th {
  color: var(--text-muted);
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

.avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.role-badge.normal {
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.role-badge.premium {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.role-badge.admin {
  background: rgba(59, 130, 246, 0.14);
  color: #2563eb;
}

.role-badge.superadmin {
  background: rgba(168, 85, 247, 0.14);
  color: #7c3aed;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.14);
  color: #059669;
}

.status-badge.banned {
  background: rgba(239, 68, 68, 0.14);
  color: #dc2626;
}

.action-group {
  display: flex;
  gap: 8px;
}

.empty-text {
  text-align: center;
  color: var(--text-muted);
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-muted);
}

.page-jump input {
  width: 88px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
}

.modal-content {
  width: min(440px, calc(100vw - 32px));
  border-radius: 18px;
  padding: 24px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.22);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 14px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .content-area {
    padding: 0 20px 20px 20px;
  }

  .search-box,
  .pagination-bar,
  .action-group,
  .modal-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    min-width: 0;
    width: 100%;
  }
}
</style>
