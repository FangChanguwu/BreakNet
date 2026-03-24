<template>
  <div class="app-layout">
    <LayoutSidebar />
    <div class="main-wrapper">
      <LayoutHeader />
      <main class="content-area">
        <div class="page-header">
          <h2>👥 用户数据管理</h2>
          <p class="subtitle">检索并修改用户的核心资产数据</p>
        </div>

        <div class="admin-section">
          <div class="section-header">
            <div class="search-box">
              <input
                type="number"
                v-model="searchQuery"
                placeholder="输入精确QQ号检索"
                @keyup.enter="fetchUsers"
              />
              <button class="search-btn" @click="fetchUsers">🔍 检索</button>
              <button class="reset-btn" @click="resetSearch" v-if="searchQuery">
                重置
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="user-table">
              <thead>
                <tr>
                  <th>QQ号</th>
                  <th>当前积分</th>
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
                  <td style="color: #ff8c00; font-weight: bold">
                    {{ user.Credits }}
                  </td>
                  <td style="color: #ff4d4f; font-weight: bold">
                    {{ user.Affection || 0 }}
                  </td>
                  <td>{{ user.LastSignDate || "暂无记录" }}</td>
                  <td>
                    <button
                      class="action-btn edit"
                      @click="openEditModal(user)"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
                <tr v-if="userList.length === 0">
                  <td colspan="5" class="empty-text">未找到数据</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <LayoutFooter />
    </div>

    <transition name="fade">
      <div class="modal-overlay" v-if="isEditModalOpen" @click="closeEditModal">
        <div class="modal-content" @click.stop>
          <h3>修改数据 - QQ: {{ editingUser._id }}</h3>

          <div class="form-group">
            <label>积分 (Credits)</label>
            <input type="number" v-model.number="editForm.Credits" />
          </div>
          <div class="form-group">
            <label>好感度 (Affection)</label>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";

const router = useRouter();
const userList = ref<any[]>([]);
const searchQuery = ref<string>("");

// 弹窗状态
const isEditModalOpen = ref(false);
const isSaving = ref(false);
const editingUser = ref<any>(null);
const editForm = ref({ Credits: 0, Affection: 0, LastSignDate: "" });

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

const openEditModal = (user: any) => {
  editingUser.value = user;
  editForm.value = {
    Credits: user.Credits,
    Affection: user.Affection || 0,
    LastSignDate: user.LastSignDate,
  };
  isEditModalOpen.value = true;
};
const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingUser.value = null;
};

const saveUserData = async () => {
  isSaving.value = true;
  try {
    const res = await http.put(
      `/admin/user/${editingUser.value._id}`,
      editForm.value,
    );
    if (res.data?.ok) {
      closeEditModal();
      fetchUsers(); // 刷新
    } else alert(res.data?.message);
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => fetchUsers());
</script>

<style scoped>
/* 同样引入基础布局样式 */
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
}
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
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

/* 表格与搜索栏样式 */
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
  -webkit-overflow-scrolling: touch; /* 让苹果手机滑动更丝滑 */
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

/* 弹窗样式 */
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
.form-group input {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-main);
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
    margin-left: 0; /* 手机端取消左侧 300px 的推挤 */
    transition: margin-left 0.3s ease; /* 加上平滑过渡动画 */
  }

  .content-area {
    padding: 0 20px 20px 20px; /* 手机端屏幕小，四周的留白缩小一点 */
  }

  /* 针对用户数据页：防止表格太宽把页面撑破 */
  .table-container {
    overflow-x: auto; /* 允许表格在手机上横向滑动 */
    -webkit-overflow-scrolling: touch; /* 让苹果手机滑动更丝滑 */
  }

  /* 针对用户数据页：搜索框适应手机宽度 */
  .search-box {
    flex-direction: column; /* 手机上搜索框和按钮竖着排 */
  }
  .search-box input {
    max-width: 100%;
  }
}
</style>
