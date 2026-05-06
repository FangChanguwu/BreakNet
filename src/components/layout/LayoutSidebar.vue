<template>
  <button class="mobile-toggle-btn" v-show="!isOpen" @click="toggleSidebar">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  </button>

  <div
    v-if="isOpen && isMobile"
    class="sidebar-overlay"
    @click="toggleSidebar"
  ></div>

  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <router-link to="/panel" class="brand-link" @click="handleNavigate">
        <h1 class="brand-title">Break Net.</h1>
      </router-link>

      <button class="close-btn" v-if="isMobile" @click="toggleSidebar">×</button>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/panel" class="nav-item" active-class="is-active" @click="handleNavigate">
        仪表盘
      </router-link>
      <router-link to="/credit" class="nav-item" active-class="is-active" @click="handleNavigate">
        积分
      </router-link>
      <router-link to="/shop" class="nav-item" active-class="is-active" @click="handleNavigate">
        商店
      </router-link>
      <router-link to="/profile" class="nav-item" active-class="is-active" @click="handleNavigate">
        个人中心
      </router-link>

      <router-link v-if="authStore.isPremium" to="/game/spy" class="nav-item" active-class="is-active" @click="handleNavigate">
        谁是卧底？！
      </router-link>

      <div class="nav-group">
        <div
          class="nav-item group-title"
          :class="{ 'is-active': route.path.startsWith('/maimai') }"
          @click="toggleMaimaiMenu"
        >
          <span>Maimai</span>
          <span class="arrow" :class="{ 'arrow-down': isMaimaiMenuOpen }">▶</span>
        </div>

        <transition name="expand">
          <div class="sub-menu" v-show="isMaimaiMenuOpen">
            <router-link
              to="/maimai/songs"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              乐曲查询
            </router-link>
            <router-link
              to="/maimai/random"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              随机选曲
            </router-link>

            <router-link
              v-if="authStore.isPremium"
              to="/maimai/region"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              全国行脚
            </router-link>

            <router-link
              to="/maimai/collections"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              收藏品总览
            </router-link>

            <div v-if="authStore.isPremium" class="sub-menu-divider"></div>

            <router-link
              v-if="authStore.isPremium"
              to="/maimai/account"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              账号管理
            </router-link>

            <router-link
              v-if="authStore.isPremium"
              to="/maimai/scores"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              成绩管理
            </router-link>

            <router-link
              v-if="authStore.isPremium"
              to="/maimai/ticket"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              跑图券
            </router-link>

            <router-link
              v-if="authStore.isPremium"
              to="/maimai/unlock"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              物品解锁
            </router-link>

            <div v-if="authStore.isTechPremium" class="sub-menu-divider"></div>

            <router-link
              v-if="authStore.isTechPremium"
              to="/maimai/delivery"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              Delivery
            </router-link>

            <router-link
              v-if="authStore.isTechPremium"
              to="/maimai/test"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              测试
            </router-link>
          </div>
        </transition>
      </div>

      <div class="nav-group" v-if="authStore.isAdmin">
        <div
          class="nav-item group-title"
          :class="{ 'is-active': route.path.startsWith('/admin') }"
          @click="toggleAdminMenu"
        >
          <span>管理后台</span>
          <span class="arrow" :class="{ 'arrow-down': isAdminMenuOpen }">▶</span>
        </div>

        <transition name="expand">
          <div class="sub-menu" v-show="isAdminMenuOpen">
            <router-link
              to="/admin/dashboard"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              运行状态
            </router-link>
            <router-link
              to="/admin/users"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              用户数据
            </router-link>
            <router-link
              to="/admin/roles"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              用户权限
            </router-link>
            <router-link
              v-if="authStore.role === 'superadmin'"
              to="/admin/logs"
              class="sub-item"
              active-class="sub-active"
              @click="handleNavigate"
            >
              用户日志
            </router-link>
          </div>
        </transition>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useWindowSize } from "@vueuse/core";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const { width } = useWindowSize();
const authStore = useAuthStore();

const isOpen = ref(false);
const isMobile = ref(false);
const isAdminMenuOpen = ref(false);
const isMaimaiMenuOpen = ref(false);

const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

const handleNavigate = () => {
  if (isMobile.value) {
    isOpen.value = false;
  }
};

const toggleAdminMenu = () => {
  isAdminMenuOpen.value = !isAdminMenuOpen.value;
};

const toggleMaimaiMenu = () => {
  isMaimaiMenuOpen.value = !isMaimaiMenuOpen.value;
};

watch(
  () => width.value <= 1200,
  (mobile) => {
    isMobile.value = mobile;
    isOpen.value = !mobile;
  },
  { immediate: true },
);

watch(
  () => route.path,
  (path) => {
    if (path.startsWith("/maimai")) {
      isMaimaiMenuOpen.value = true;
    }
    if (path.startsWith("/admin")) {
      isAdminMenuOpen.value = true;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 16px;
  left: 16px;
  bottom: 16px;
  width: 268px;
  background: var(--surface-elevated);
  border-radius: 22px;
  box-shadow: var(--shadow-panel);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 100;
  overflow: hidden;
}

.sidebar-header {
  padding: 24px 20px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.brand-link {
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.brand-title {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 900;
  font-style: normal;
  font-family: inherit;
  background: linear-gradient(135deg, var(--primary-color), #ef4444);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.brand-link:hover .brand-title {
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 14px rgba(255, 140, 0, 0.18));
}

.sidebar-nav {
  padding: 14px 12px 18px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 42px;
  padding: 10px 14px;
  margin-bottom: 4px;
  color: var(--text-main);
  text-decoration: none;
  font-weight: 700;
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

.nav-item:hover,
.nav-item.is-active {
  background-color: var(--primary-soft);
  color: var(--primary-color);
}

.sub-menu {
  display: flex;
  flex-direction: column;
  background: var(--surface-soft);
  border-radius: 12px;
  margin: 4px 4px 12px;
  padding: 8px 0;
  border: 1px solid var(--border-color);
}

.sub-menu-divider {
  height: 1px;
  margin: 10px 16px;
  background: rgba(148, 163, 184, 0.22);
}

.sub-item {
  padding: 9px 14px 9px 28px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  transition:
    color 0.2s,
    background-color 0.2s;
  cursor: pointer;
  border-radius: 10px;
  margin: 0 6px;
  border: 0;
  background: transparent;
  text-align: left;
}

.sub-item:hover {
  color: var(--primary-color);
}

.sub-active {
  background-color: var(--primary-soft);
  color: var(--primary-color);
  font-weight: 700;
}

.arrow {
  font-size: 0.8rem;
  transition: transform 0.3s;
}

.arrow-down {
  transform: rotate(90deg);
}

.mobile-toggle-btn {
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 90;
  background: var(--surface-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 8px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 95;
}

@media (max-width: 1200px) {
  .sidebar {
    top: 0;
    left: 0;
    bottom: 0;
    border-radius: 0;
    border: none;
    transform: translateX(-100%);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 520px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
