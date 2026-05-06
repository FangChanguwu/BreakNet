<template>
  <main class="content-area">
    <div class="page-header">
      <h2>用户数据管理</h2>
      <p class="subtitle">默认展示全部用户，按积分和好感度从高到低排序</p>
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
              <th>积分</th>
              <th>好感度</th>
              <th>最近签到</th>
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
              <td class="accent-credit">{{ user.Credits }}</td>
              <td class="accent-affection">{{ user.Affection || 0 }}</td>
              <td>{{ user.LastSignDate || "暂无记录" }}</td>
              <td>
                <div class="action-group">
                  <button
                    v-if="isSuperAdmin"
                    class="action-btn account"
                    @click="openAccountModal(user)"
                  >
                    账号信息
                  </button>
                  <button class="action-btn edit" @click="openEditModal(user)">
                    编辑
                  </button>
                  <button class="action-btn delete" @click="deleteUser(user)">
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!userList.length">
              <td colspan="5" class="empty-text">没有符合条件的数据</td>
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
      <div v-if="isEditModalOpen" class="modal-overlay" @click="closeEditModal">
        <div class="modal-content" @click.stop>
          <h3>修改数据 - QQ: {{ editingUser?._id }}</h3>

          <div class="form-group">
            <label>积分</label>
            <input type="number" v-model.number="editForm.Credits" />
          </div>
          <div class="form-group">
            <label>好感度</label>
            <input type="number" v-model.number="editForm.Affection" />
          </div>
          <div class="form-group">
            <label>最后签到日期</label>
            <input type="text" v-model="editForm.LastSignDate" />
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeEditModal">取消</button>
            <button class="save-btn" @click="saveUserData" :disabled="isSaving">
              {{ isSaving ? "保存中..." : "确认修改" }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="isAccountModalOpen" class="modal-overlay" @click="closeAccountModal">
        <div class="modal-content account-modal" @click.stop>
          <h3>账号信息 - QQ: {{ accountForm.qq || accountUser?._id }}</h3>
          <p class="modal-hint">
            密码不会明文展示，填写新密码后保存即可覆盖原密码。
          </p>

          <div class="form-group">
            <label>QQ</label>
            <input type="number" v-model.number="accountForm.qq" />
          </div>
          <div class="form-group">
            <label>账号</label>
            <input type="text" v-model.trim="accountForm.username" />
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input type="text" v-model.trim="accountForm.nickname" />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input type="email" v-model.trim="accountForm.email" />
          </div>
          <div class="form-group">
            <label>新密码</label>
            <input
              :type="showAccountPassword ? 'text' : 'password'"
              v-model="accountForm.password"
              placeholder="留空则不修改密码"
            />
          </div>
          <label class="checkbox-row">
            <input type="checkbox" v-model="showAccountPassword" />
            <span>显示新密码</span>
          </label>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeAccountModal">取消</button>
            <button class="save-btn" @click="saveAccountInfo" :disabled="isAccountSaving">
              {{ isAccountSaving ? "保存中..." : "保存账号信息" }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import http from "@/utils/http";
import { useAuthStore } from "@/stores/auth";

type UserRow = {
  _id: number;
  Credits: number;
  Affection?: number;
  LastSignDate?: string;
};

type AccountInfo = {
  qq: number;
  username: string;
  nickname: string;
  email: string;
  password: string;
};

const router = useRouter();
const authStore = useAuthStore();
const PAGE_SIZE = 50;
const isSuperAdmin = computed(() => authStore.hasRoleAtLeast("superadmin"));

const userList = ref<UserRow[]>([]);
const searchQuery = ref("");
const currentPage = ref(1);
const totalPages = ref(1);
const totalUsers = ref(0);
const pageInput = ref(1);

const isEditModalOpen = ref(false);
const isSaving = ref(false);
const editingUser = ref<UserRow | null>(null);
const editForm = ref({ Credits: 0, Affection: 0, LastSignDate: "" });
const isAccountModalOpen = ref(false);
const isAccountSaving = ref(false);
const showAccountPassword = ref(false);
const accountUser = ref<UserRow | null>(null);
const accountForm = ref<AccountInfo>({
  qq: 0,
  username: "",
  nickname: "",
  email: "",
  password: "",
});

const fetchUsers = async (page = currentPage.value) => {
  try {
    const params: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
      sort_by: "credits",
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

const openEditModal = (user: UserRow) => {
  editingUser.value = user;
  editForm.value = {
    Credits: user.Credits,
    Affection: user.Affection || 0,
    LastSignDate: user.LastSignDate || "",
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingUser.value = null;
};

const saveUserData = async () => {
  if (!editingUser.value) return;

  isSaving.value = true;
  try {
    const res = await http.put(`/admin/user/${editingUser.value._id}`, editForm.value);
    if (res.data?.ok) {
      closeEditModal();
      fetchUsers();
    }
  } finally {
    isSaving.value = false;
  }
};

const openAccountModal = async (user: UserRow) => {
  accountUser.value = user;
  accountForm.value = {
    qq: user._id,
    username: "",
    nickname: "",
    email: "",
    password: "",
  };
  showAccountPassword.value = false;
  isAccountModalOpen.value = true;

  try {
    const res = await http.get(`/admin/user/${user._id}/account`);
    const data = res.data?.data || res.data?.user || {};
    accountForm.value = {
      qq: Number(data.qq || data._id || user._id),
      username: data.username || data.Username || "",
      nickname: data.nickname || data.Nickname || "",
      email: data.email || data.Email || "",
      password: "",
    };
  } catch (error: any) {
    closeAccountModal();
    Swal.fire({
      title: "读取失败",
      text: error.response?.data?.message || error.response?.data?.detail || "账号信息接口暂不可用",
      icon: "error",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  }
};

const closeAccountModal = () => {
  isAccountModalOpen.value = false;
  accountUser.value = null;
  showAccountPassword.value = false;
};

const saveAccountInfo = async () => {
  if (!accountUser.value) return;

  const payload: Record<string, string | number> = {
    qq: Number(accountForm.value.qq),
    username: accountForm.value.username,
    nickname: accountForm.value.nickname,
    email: accountForm.value.email,
  };
  if (accountForm.value.password.trim()) {
    payload.password = accountForm.value.password;
  }

  isAccountSaving.value = true;
  try {
    const res = await http.put(`/admin/user/${accountUser.value._id}/account`, payload);
    if (res.data?.ok) {
      closeAccountModal();
      await Swal.fire({
        title: "修改成功",
        icon: "success",
        background: "var(--surface-color)",
        color: "var(--text-main)",
        timer: 1400,
        showConfirmButton: false,
      });
      fetchUsers();
    } else {
      throw new Error(res.data?.message || "修改失败");
    }
  } catch (error: any) {
    Swal.fire({
      title: "修改失败",
      text: error.response?.data?.message || error.response?.data?.detail || error.message || "网络异常",
      icon: "error",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  } finally {
    isAccountSaving.value = false;
  }
};

const deleteUser = async (user: UserRow) => {
  const result = await Swal.fire({
    title: "确认删除？",
    text: `用户 ${user._id} 的站内数据将被彻底删除，此操作不可恢复。`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ef4444",
    cancelButtonColor: "#4b5563",
    confirmButtonText: "确认删除",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const res = await http.delete(`/admin/user/${user._id}`);
    if (res.data?.ok) {
      Swal.fire({
        title: "删除成功",
        icon: "success",
        background: "var(--surface-color)",
        color: "var(--text-main)",
        timer: 1800,
        showConfirmButton: false,
      });

      if (userList.value.length === 1 && currentPage.value > 1) {
        fetchUsers(currentPage.value - 1);
      } else {
        fetchUsers();
      }
    }
  } catch (error: any) {
    Swal.fire({
      title: "删除失败",
      text: error.response?.data?.message || error.response?.data?.detail || "网络异常",
      icon: "error",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  }
};

onMounted(() => fetchUsers());
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
.form-group input {
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

.action-btn.delete {
  background: #ef4444;
  color: #fff;
}

.action-btn.account {
  background: #111827;
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

.user-table tr:hover {
  background: rgba(255, 140, 0, 0.03);
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

.accent-credit {
  color: #ff8c00;
  font-weight: 800;
}

.accent-affection {
  color: #ff4d4f;
  font-weight: 800;
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
  width: min(460px, calc(100vw - 32px));
  border-radius: 18px;
  padding: 24px;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.22);
}

.modal-content h3 {
  margin-top: 0;
}

.account-modal {
  width: min(520px, calc(100vw - 32px));
}

.modal-hint {
  margin: -4px 0 18px;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.checkbox-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.92rem;
  cursor: pointer;
}

.checkbox-row input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
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
