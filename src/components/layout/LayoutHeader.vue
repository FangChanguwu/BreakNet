<template>
  <header class="top-header">
    <div class="header-right">
      <img
        v-if="isLoggedIn && qq"
        :src="avatarUrl"
        class="user-avatar"
        alt="Avatar"
      />
      <button
        class="theme-btn"
        @click="toggleTheme"
        :title="isDark ? '切换到白天模式' : '切换到夜间模式'"
      >
        {{ isDark ? "🌙" : "☀️" }}
      </button>

      <div class="user-actions">
        <template v-if="isLoggedIn">
          <button class="action-btn logout-btn" @click="handleLogout">
            退出登录
          </button>
        </template>
        <template v-else>
          <button class="action-btn login-btn" @click="$router.push('/login')">
            登录
          </button>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
// 1. 引入你的 Store 和 storeToRefs
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";

const router = useRouter();
const authStore = useAuthStore();
const { isLoggedIn, qq } = storeToRefs(authStore);
const isDark = ref(false);

const avatarUrl = computed(() => {
  if (!qq.value) return "";
  return `https://q.qlogo.cn/headimg_dl?dst_uin=${qq.value}&spec=640&img_type=jpg`;
});

// 主题切换逻辑（保持不变）
const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

onMounted(() => {
  // 注意这里：不再需要手动去捞 localStorage 的 token 了！
  // Pinia 的 persist 插件会自动帮你恢复 isLoggedIn 和 qq 的状态

  // 读取本地存储的主题偏好（保持不变）
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDark.value = true;
    document.documentElement.setAttribute("data-theme", "dark");
  }
});

// 3. 修改退出逻辑
const handleLogout = () => {
  authStore.logout(); // 直接调用 Store 里的登出方法，它会顺便帮你清理 localStorage
  localStorage.removeItem("auth");
  localStorage.removeItem("admin_status");
  router.push("/");
};
</script>

<style scoped>
/* 原有的样式保留... 只是在下面补充一句针对问候语的样式 */
.user-greeting {
  color: var(--text-main);
  font-weight: 600;
  margin-right: 12px;
  font-size: 0.95rem;
}

/* ... 之前的 .top-header 等样式保持原样 ... */
.top-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 40px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.theme-btn {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  font-size: 1.2rem;
  padding: 8px 12px;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: transform 0.2s;
}

.theme-btn:hover {
  transform: scale(1.1);
}

.user-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  padding: 8px 24px;
  border-radius: 50px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.login-btn {
  background: var(--primary-color);
  color: #fff;
}

.login-btn:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.logout-btn {
  background: transparent;
  color: var(--text-main);
  border: 1px solid var(--border-color);
}
.logout-btn:hover {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

/* 3. 新增：精美的头像样式 */
.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%; /* 变成正圆形 */
  object-fit: cover; /* 保证头像按比例填充不拉伸 */
  border: 2px solid var(--border-color); /* 加一圈细边框融入主题 */
  box-shadow: 0 2px 8px var(--shadow-color); /* 微微的悬浮阴影 */
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
  background-color: var(--surface-color); /* 图片加载出来前的底色 */
}

.user-avatar:hover {
  transform: scale(1.1); /* 鼠标放上去微微放大 */
  border-color: var(--primary-color); /* 边框变成主题橙色 */
}
</style>
