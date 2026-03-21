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
      <router-link to="/" class="brand-link">
        <h1 class="brand-title">Break Net.</h1>
      </router-link>

      <button class="close-btn" v-if="isMobile" @click="toggleSidebar">
        ×
      </button>
    </div>

    <nav class="sidebar-nav">
      <a class="nav-item" @click="openWipModal">用户</a>
      <a class="nav-item" @click="openWipModal">积分</a>

      <div class="nav-group">
        <div class="nav-item group-title" @click="toggleMaimai">
          <span>Maimai</span>
          <span class="arrow" :class="{ 'arrow-down': isMaimaiOpen }">▶</span>
        </div>

        <transition name="expand">
          <div class="sub-menu" v-show="isMaimaiOpen">
            <a class="sub-item" @click="openWipModal">账号数据</a>
            <a class="sub-item" @click="openWipModal">乐曲数据</a>
            <a class="sub-item" @click="openWipModal">全国行脚</a>
          </div>
        </transition>
      </div>
    </nav>
  </aside>

  <transition name="modal-fade">
    <div
      v-if="showWipModal"
      class="wip-modal-overlay"
      @click="showWipModal = false"
    >
      <div class="wip-modal-content" @click.stop>
        <div class="wip-icon">🚧</div>
        <h3 class="wip-title">前面的区域，以后再来探索吧！</h3>
        <p class="wip-desc">该功能正在紧急施工中，敬请期待...</p>
        <button class="wip-confirm-btn" @click="showWipModal = false">
          知道啦
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isOpen = ref(true);
const isMobile = ref(false);
const isMaimaiOpen = ref(false);

// ✨ 控制施工中弹窗的变量 ✨
const showWipModal = ref(false);

const openWipModal = () => {
  showWipModal.value = true;
};

// 展开/折叠 Maimai 菜单
const toggleMaimai = () => {
  isMaimaiOpen.value = !isMaimaiOpen.value;
};

// 展开/折叠整个侧边栏 (手机端用)
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};

// 监听窗口大小变化，实现响应式
const checkWindowSize = () => {
  if (window.innerWidth <= 768) {
    isMobile.value = true;
    isOpen.value = false; // 手机端默认收起
  } else {
    isMobile.value = false;
    isOpen.value = true; // 电脑端默认展开
  }
};

onMounted(() => {
  checkWindowSize();
  window.addEventListener("resize", checkWindowSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkWindowSize);
});
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
  cursor: pointer; /* 确保鼠标放上去是小手 */
}

.nav-item:hover {
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
  transition: color 0.2s;
  cursor: pointer;
}

.sub-item:hover {
  color: var(--primary-color);
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
}

/* ================= ✨ 施工中弹窗样式 ✨ ================= */
.wip-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999; /* 保证层级最高，遮盖一切 */
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
  animation: bounceWip 2s infinite; /* 增加一点跳动的动画，更生动 */
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

/* 弹窗过渡动画 */
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
