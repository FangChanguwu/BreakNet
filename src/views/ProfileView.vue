<template>
  <div class="app-layout">
    <LayoutSidebar />
    <div class="main-wrapper">
      <LayoutHeader />
      <main class="content-area">
        <!-- 个人信息卡片 -->
        <div class="profile-hero">
          <div class="hero-bg"></div>
          <div class="hero-content">
            <img :src="avatarUrl" class="profile-avatar" />
            <div class="hero-info">
              <h1 class="profile-name">{{ profile.nickname || '加载中...' }}</h1>
              <p class="profile-username">@{{ profile.username }}</p>
              <span :class="['role-badge', profile.role]">{{ roleLabel }}</span>
            </div>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-body">
              <span class="stat-value">{{ profile.credits }}</span>
              <span class="stat-label">积分</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">💖</div>
            <div class="stat-body">
              <span class="stat-value">{{ profile.affection }}</span>
              <span class="stat-label">好感度</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-body">
              <span class="stat-value">{{ profile.total_sign }}</span>
              <span class="stat-label">总签到</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-body">
              <span class="stat-value">{{ profile.conti_sign }}</span>
              <span class="stat-label">连续签到</span>
            </div>
          </div>
        </div>

        <!-- 设置区域 -->
        <div class="settings-section">
          <h2 class="section-title">账号设置</h2>

          <div class="setting-card clickable" @click="showNicknameModal = true">
            <div class="setting-row">
              <div>
                <h3>修改昵称</h3>
                <p class="setting-desc">更改您在站内显示的名称</p>
              </div>
              <span class="setting-arrow">›</span>
            </div>
          </div>

          <div class="setting-card clickable" @click="showPasswordModal = true">
            <div class="setting-row">
              <div>
                <h3>修改密码</h3>
                <p class="setting-desc">修改登录密码，需要验证当前密码</p>
              </div>
              <span class="setting-arrow">›</span>
            </div>
          </div>
        </div>

      </main>
      <LayoutFooter />
    </div>

    <!-- 修改昵称弹窗 -->
    <transition name="fade">
      <div v-if="showNicknameModal" class="modal-overlay">
        <div class="modal-box">
          <button class="modal-close" @click="showNicknameModal = false">×</button>
          <h3 class="modal-heading">修改昵称</h3>
          <p class="modal-desc">最多16个字符，修改后立即生效</p>
          <input v-model="newNickname" type="text" class="modal-input" placeholder="输入新昵称" maxlength="16" />
          <button class="modal-confirm" @click="updateNickname" :disabled="isSaving">
            {{ isSaving ? '保存中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </transition>

    <!-- 修改密码弹窗 -->
    <transition name="fade">
      <div v-if="showPasswordModal" class="modal-overlay">
        <div class="modal-box">
          <button class="modal-close" @click="showPasswordModal = false">×</button>
          <h3 class="modal-heading">修改密码</h3>
          <p class="modal-desc">请先输入当前密码进行身份认证</p>
          <input v-model="oldPassword" type="password" class="modal-input" placeholder="当前密码" />
          <input v-model="newPassword" type="password" class="modal-input" placeholder="新密码（至少6位）" />
          <button class="modal-confirm" @click="updatePassword" :disabled="isSaving">
            {{ isSaving ? '修改中...' : '确认修改' }}
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";
import Swal from "sweetalert2";

const profile = ref<any>({
  qq: 0,
  username: "",
  nickname: "",
  role: "normal",
  credits: 0,
  affection: 0,
  total_sign: 0,
  conti_sign: 0,
});

const newNickname = ref("");
const oldPassword = ref("");
const newPassword = ref("");
const isSaving = ref(false);
const showNicknameModal = ref(false);
const showPasswordModal = ref(false);

const avatarUrl = computed(() => `https://q1.qlogo.cn/g?b=qq&nk=${profile.value.qq}&s=640`);

const roleMap: Record<string, string> = {
  normal: "普通用户",
  premium: "✨ 网站会员",
  admin: "🛠️ 管理员",
  superadmin: "👑 最高权限",
};
const roleLabel = computed(() => roleMap[profile.value.role] || "普通用户");

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2500,
  showConfirmButton: false,
});

const fetchProfile = async () => {
  try {
    const res = await http.get("/user/profile");
    if (res.data?.ok) {
      profile.value = res.data.data;
      newNickname.value = profile.value.nickname;
    }
  } catch (e) {
    console.error(e);
  }
};

const updateNickname = async () => {
  if (!newNickname.value.trim()) return;
  isSaving.value = true;
  try {
    const res = await http.put("/user/profile", { nickname: newNickname.value.trim() });
    if (res.data?.ok) {
      Toast.fire({ icon: "success", title: "昵称已更新" });
      profile.value.nickname = newNickname.value.trim();
      showNicknameModal.value = false;
    } else {
      Toast.fire({ icon: "error", title: res.data?.message });
    }
  } catch (e: any) {
    Toast.fire({ icon: "error", title: e.response?.data?.detail || "更新失败" });
  } finally {
    isSaving.value = false;
  }
};

const updatePassword = async () => {
  if (!oldPassword.value || !newPassword.value) {
    Toast.fire({ icon: "warning", title: "请填写完整" });
    return;
  }
  isSaving.value = true;
  try {
    const res = await http.put("/user/profile", {
      old_password: oldPassword.value,
      new_password: newPassword.value,
    });
    if (res.data?.ok) {
      Toast.fire({ icon: "success", title: "密码已更新" });
      oldPassword.value = "";
      newPassword.value = "";
      showPasswordModal.value = false;
    } else {
      Toast.fire({ icon: "error", title: res.data?.message });
    }
  } catch (e: any) {
    Toast.fire({ icon: "error", title: e.response?.data?.detail || "修改失败" });
  } finally {
    isSaving.value = false;
  }
};

onMounted(fetchProfile);
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
  gap: 28px;
  min-width: 0;
}

/* ===== Hero Card ===== */
.profile-hero {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
}
.hero-bg {
  height: 20px;
  background: linear-gradient(90deg, #ff8c00, #ff4d4f, #a855f7, #3b82f6);
  background-size: 300% 100%;
  animation: gradientShift 4s ease infinite;
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.hero-content {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
}
.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid var(--border-color);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  background: var(--bg-color);
  object-fit: cover;
  flex-shrink: 0;
}
.hero-info {
  min-width: 0;
}
.profile-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-username {
  margin: 4px 0 8px 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}
.role-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  display: inline-block;
}
.role-badge.normal {
  background: rgba(100, 116, 139, 0.15);
  color: var(--text-muted);
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
  background: linear-gradient(135deg, rgba(239,68,68,.15), rgba(168,85,247,.15));
  color: #ef4444;
}

/* ===== Stats Grid ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px var(--shadow-color);
}
.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}
.stat-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
}
.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ===== Settings ===== */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}
.setting-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px 24px;
}
.setting-card.clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.setting-card.clickable:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px var(--shadow-color);
}
.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.setting-row h3 {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
}
.setting-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.setting-arrow {
  font-size: 1.6rem;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.setting-card.clickable:hover .setting-arrow {
  transform: translateX(4px);
  color: var(--primary-color);
}

/* ===== Modals ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: var(--surface-color);
  width: 90%;
  max-width: 400px;
  border-radius: 16px;
  padding: 32px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  animation: modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes modalPop {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--bg-color);
  color: var(--text-muted);
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-close:hover {
  background: #ff4d4f;
  color: #fff;
}
.modal-heading {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}
.modal-desc {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-main);
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}
.modal-input:focus {
  border-color: var(--primary-color);
}
.modal-confirm {
  padding: 12px;
  border-radius: 10px;
  border: none;
  background: var(--primary-color);
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.modal-confirm:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.modal-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
  .content-area {
    padding: 0 20px 20px 20px;
  }
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  .hero-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
  }
}
</style>
