<template>
  <button class="mobile-toggle-btn" @click="toggleSidebar" v-show="!isOpen">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
    </svg>
  </button>

  <div
    class="sidebar-overlay"
    v-if="isOpen && isMobile"
    @click="toggleSidebar"
  ></div>

  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <router-link to="/panel" class="brand-link">
        <h1 class="brand-title">Break Net.</h1>
      </router-link>

      <button class="close-btn" v-if="isMobile" @click="toggleSidebar">
        ×
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link to="/panel" class="nav-item" active-class="is-active">
        仪表盘
      </router-link>
      <router-link to="/credit" class="nav-item" active-class="is-active">
        积分
      </router-link>

      <div class="nav-group" v-if="isAdmin">
        <div
          class="nav-item group-title"
          @click="toggleAdminMenu"
          :class="{ 'is-active': route.path.includes('/admin') }"
        >
          <span>管理后台</span>
          <span class="arrow" :class="{ 'arrow-down': isAdminMenuOpen }"
            >▶</span
          >
        </div>

        <transition name="expand">
          <div class="sub-menu" v-show="isAdminMenuOpen">
            <router-link
              to="/admin/dashboard"
              class="sub-item"
              active-class="sub-active"
            >
              📊 运行状态
            </router-link>
            <router-link
              to="/admin/users"
              class="sub-item"
              active-class="sub-active"
            >
              👥 用户数据
            </router-link>
          </div>
        </transition>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useWindowSize } from "@vueuse/core"; // ✨ 引入 VueUse
import http from "@/utils/http";

const route = useRoute();
const { width } = useWindowSize(); // ✨ 自动响应式获取当前窗口宽度

const initialIsMobile = window.innerWidth <= 768;

const isMobile = ref(initialIsMobile);
const isOpen = ref(!initialIsMobile);

let wasMobile = initialIsMobile;
const isAdmin = ref(false);
const isAdminMenuOpen = ref(route.path.includes("/admin"));

const checkWindowSize = () => {
  const currentlyMobile = window.innerWidth <= 768;
  isMobile.value = currentlyMobile;

  // 只有当跨越了 768 像素的边界时，才去干预侧边栏状态
  if (wasMobile !== currentlyMobile) {
    isOpen.value = !currentlyMobile;
    wasMobile = currentlyMobile;
  }
};

const toggleAdminMenu = () => {
  isAdminMenuOpen.value = !isAdminMenuOpen.value;
};
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

// ✨ 核心优化：监听屏幕宽度变化，智能处理适配
watch(
  () => width.value <= 768,
  (mobile) => {
    isMobile.value = mobile;
    // 只有在“手机端”和“电脑端”互相切换的瞬间，才去自动改变侧边栏的状态！
    // 这样在手机端上下滑动导致的高频微小 resize，绝对不会强行关掉用户的侧边栏
    isOpen.value = !mobile;
  },
  { immediate: true }, // 进页面立刻执行一次，取代原先的 checkWindowSize 初始调用
);

const checkAdminPermission = async () => {
  const cachedStatus = localStorage.getItem("admin_status");
  if (cachedStatus === "true") {
    isAdmin.value = true;
    return;
  } else if (cachedStatus === "false") {
    isAdmin.value = false;
    return;
  }

  try {
    const res = await http.get("/admin/check");
    if (res.data?.ok) {
      isAdmin.value = true;
      localStorage.setItem("admin_status", "true");
    }
  } catch (error) {
    isAdmin.value = false;
    localStorage.setItem("admin_status", "false");
  }
};

onMounted(() => {
  // ✨ 不再需要手写乱七八糟的 window.addEventListener 了！
  checkAdminPermission();
});

// ✨ onUnmounted 也被彻底删除了，VueUse 会自动帮你销毁监听器，完全不漏内存！
</script>

<style scoped>
/* ================= 原有侧边栏样式保留 ================= */
.sidebar {
  position: fixed;
  top: 20px;
  left: 20px;
  bottom: 20px;
  width: 260px;
  background-color: var(--surface-color);
  border-radius: 20px;
  box-shadow: 0 8px 30px var(--shadow-color);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 100;
  overflow: hidden;
}

.sidebar-header {
  padding: 30px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand-link {
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

.brand-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  font-style: italic;
  font-family: "Arial Black", Impact, sans-serif;
  background: linear-gradient(135deg, var(--primary-color), #ff4d4f);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.brand-link:hover .brand-title {
  transform: scale(1.02);
  filter: drop-shadow(0 0 8px rgba(255, 140, 0, 0.4));
}

.sidebar-nav {
  padding: 0 16px;
  flex: 1;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  margin-bottom: 8px;
  color: var(--text-main);
  text-decoration: none;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.2s;
  cursor: pointer;
}

/* 菜单激活时的统一样式 */
.nav-item:hover,
.nav-item.is-active {
  background-color: rgba(255, 140, 0, 0.1);
  color: var(--primary-color);
}

.sub-menu {
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
  border-radius: 12px;
  margin: 0 8px 12px 8px;
  padding: 8px 0;
}

.sub-item {
  padding: 10px 20px 10px 40px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  transition:
    color 0.2s,
    background-color 0.2s;
  cursor: pointer;
  border-radius: 8px;
  margin: 0 8px;
}

.sub-item:hover {
  color: var(--primary-color);
}

/* ✨ 新增：子菜单被选中时的高亮样式 */
.sub-active {
  background-color: rgba(255, 140, 0, 0.05);
  color: var(--primary-color);
  font-weight: bold;
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
  top: 15px;
  left: 15px;
  z-index: 90;
  background: var(--surface-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px var(--shadow-color);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 95;
}

@media (max-width: 768px) {
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

/* 展开收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
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

/* ================= 施工中弹窗样式 (保留你原有的) ================= */
.wip-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wip-modal-content {
  background: var(--surface-color);
  padding: 32px 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 90%;
  width: 360px;
  border: 1px solid var(--border-color);
}
.wip-icon {
  font-size: 4rem;
  margin-bottom: 16px;
  animation: bounceWip 2s infinite;
}
@keyframes bounceWip {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-15px);
  }
  60% {
    transform: translateY(-7px);
  }
}
.wip-title {
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-main);
}
.wip-desc {
  margin: 0 0 24px 0;
  font-size: 0.95rem;
  color: var(--text-muted);
}
.wip-confirm-btn {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 10px 32px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}
.wip-confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 140, 0, 0.4);
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .wip-modal-content {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
