<template>
  <header class="top-header">
    <div class="header-right">
      <button
        v-if="isLoggedIn"
        class="icon-text-btn sign-header-btn"
        :class="{ 'is-done': hasSignedInToday }"
        :aria-disabled="hasSignedInToday || isSigning"
        :data-tooltip="signButtonTitle"
        type="button"
        :title="signButtonTitle"
        @click="handleSign"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 12v9H4v-9" />
          <path d="M2 7h20v5H2z" />
          <path d="M12 22V7" />
          <path d="M12 7H7.5a2.5 2.5 0 1 1 2.2-3.7C10.4 4.5 12 7 12 7Z" />
          <path d="M12 7h4.5a2.5 2.5 0 1 0-2.2-3.7C13.6 4.5 12 7 12 7Z" />
        </svg>
        <span>{{ isSigning ? "签到中" : hasSignedInToday ? "已签到" : "签到" }}</span>
      </button>

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
          <button
            class="icon-btn logout-btn"
            type="button"
            title="退出登录"
            aria-label="退出登录"
            @click="handleLogout"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
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
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useDailySignStore } from "@/stores/dailySign";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";

const router = useRouter();
const authStore = useAuthStore();
const dailySignStore = useDailySignStore();
const { isLoggedIn, qq } = storeToRefs(authStore);
const { hasSignedInToday, isSigning, lastReward } = storeToRefs(dailySignStore);
const isDark = ref(false);

const avatarUrl = computed(() => {
  if (!qq.value) return "";
  return `https://q.qlogo.cn/headimg_dl?dst_uin=${qq.value}&spec=640&img_type=jpg`;
});

const signButtonTitle = computed(() => {
  if (!hasSignedInToday.value) return "签到";
  if (!lastReward.value) return "今日已签到";
  const credits = Number(lastReward.value.added_credits ?? 0);
  const affection = Number(lastReward.value.added_affection ?? 0);
  return `今日已签到：积分 +${credits}，好感度 +${affection}`;
});

const showSignToast = (data?: {
  added_credits?: number;
  added_affection?: number;
  event_info?: string;
  affection_info?: string;
}) => {
  const eventInfo = data?.event_info ? data.event_info.replace(/\n/g, "<br>") : "";
  const affectionInfo = data?.affection_info ? data.affection_info.replace(/\n/g, "<br>") : "";

  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: "签到成功",
    html: `
      <div style="text-align:left; line-height:1.55;">
        <div style="color:#f59e0b;">积分 +${data?.added_credits ?? 0}</div>
        <div style="color:#ef4444;">好感度 +${data?.added_affection ?? 0}</div>
        ${eventInfo ? `<div style="margin-top:4px; color:var(--text-muted);">${eventInfo}</div>` : ""}
        ${affectionInfo ? `<div style="color:var(--text-muted);">${affectionInfo}</div>` : ""}
      </div>
    `,
    showConfirmButton: false,
    timer: 4200,
    timerProgressBar: true,
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
};

const showSignError = (message: string) => {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "error",
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
};

// 主题切换
const toggleTheme = () => {
  isDark.value = !isDark.value;
  const theme = isDark.value ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

const syncSignStatus = () => {
  if (isLoggedIn.value && qq.value) {
    dailySignStore.checkToday(qq.value);
  }
};

const handleSign = async () => {
  if (hasSignedInToday.value || isSigning.value) return;
  const result = await dailySignStore.signToday(qq.value);
  if (result.ok) {
    showSignToast(result.data);
    window.dispatchEvent(new CustomEvent("breaknet:credit-updated"));
    return;
  }
  if (result.message !== "今日已签到" && result.message !== "签到中") {
    showSignError(result.message);
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    isDark.value = true;
    document.documentElement.setAttribute("data-theme", "dark");
  }
  syncSignStatus();
});

watch(() => [isLoggedIn.value, qq.value] as const, syncSignStatus);

const handleLogout = () => {
  authStore.logout();
  dailySignStore.reset();
  localStorage.removeItem("auth");
  localStorage.removeItem("admin_status");
  router.push("/");
};
</script>

<style scoped>
.top-header {
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--page-padding-x);
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--surface-elevated);
  box-shadow: var(--shadow-soft);
}

.theme-btn,
.icon-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-soft);
  border: 1px solid var(--border-color);
  padding: 0;
  border-radius: 50%;
  cursor: pointer;
  transition:
    transform 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.theme-btn {
  font-size: 1.15rem;
}

.theme-btn:hover,
.icon-btn:hover {
  transform: scale(1.08);
}

.icon-btn svg,
.icon-text-btn svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-text-btn {
  position: relative;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 140, 0, 0.28);
  background: rgba(255, 140, 0, 0.1);
  color: var(--primary-color);
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.2s,
    background 0.2s;
}

.icon-text-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  z-index: 30;
  width: max-content;
  max-width: min(260px, calc(100vw - 32px));
  padding: 8px 10px;
  border: 1px solid rgba(255, 140, 0, 0.22);
  border-radius: 10px;
  background: var(--surface-elevated);
  color: var(--text-main);
  box-shadow: var(--shadow-soft);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.35;
  white-space: normal;
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -4px);
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.icon-text-btn:hover::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

.icon-text-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 140, 0, 0.16);
}

.icon-text-btn[aria-disabled="true"] {
  cursor: default;
  opacity: 0.72;
}

.icon-text-btn[aria-disabled="true"]:hover {
  transform: none;
}

.sign-header-btn.is-done {
  color: var(--text-muted);
  border-color: var(--border-color);
  background: var(--surface-soft);
}

.user-actions {
  display: flex;
  align-items: center;
  min-width: 0;
}

.action-btn {
  min-height: 38px;
  padding: 8px 18px;
  border-radius: 999px;
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
  color: var(--text-muted);
}

.logout-btn:hover {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-color);
  box-shadow: none;
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
  background-color: var(--surface-color);
}

.user-avatar:hover {
  transform: scale(1.08);
  border-color: var(--primary-color);
}

@media (max-width: 768px) {
  .top-header {
    height: auto;
    padding: 14px 14px 10px 64px;
  }

  .header-right {
    width: auto;
    justify-content: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .icon-text-btn {
    padding: 0 12px;
  }

  .icon-text-btn span {
    font-size: 0.86rem;
  }
}
</style>
