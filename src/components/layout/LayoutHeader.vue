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

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDark.value = true;
    document.documentElement.setAttribute("data-theme", "dark");
  }
});

const handleLogout = () => {
  authStore.logout();
  localStorage.removeItem("auth");
  localStorage.removeItem("admin_status");
  router.push("/");
};
</script>

<style scoped>
.user-greeting {
  color: var(--text-main);
  font-weight: 600;
  margin-right: 12px;
  font-size: 0.95rem;
}
.top-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 40px;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
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
  min-width: 0;
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

.user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow-color);
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
  background-color: var(--surface-color);
}

.user-avatar:hover {
  transform: scale(1.1);
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .top-header {
    height: auto;
    padding: 16px 16px 12px 68px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 8px 18px;
  }
}
</style>
