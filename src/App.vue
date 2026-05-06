<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useDailySignStore } from "@/stores/dailySign";
import Swal from "sweetalert2";

const router = useRouter();
const authStore = useAuthStore();
const dailySignStore = useDailySignStore();

const showSignSuccessToast = (data?: {
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

const runAutoSign = async () => {
  if (!authStore.isLoggedIn || !authStore.qq) return;
  const result = await dailySignStore.autoSignToday(authStore.qq);
  if (result?.ok) {
    showSignSuccessToast(result.data);
    window.dispatchEvent(new CustomEvent("breaknet:credit-updated"));
  }
};

const handleStorageChange = (e: StorageEvent) => {
  if (e.key === "auth" && !e.newValue) {
    authStore.token = "";
    authStore.qq = "";
    dailySignStore.reset();
    localStorage.removeItem("admin_status");

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "info",
      title: "登录状态已在其他窗口注销",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });

    router.push("/");
  }
};

onMounted(() => {
  window.addEventListener("storage", handleStorageChange);

  // 刷新网页时自动同步一次最新权限状态，再尝试执行今日自动签到。
  if (authStore.isLoggedIn) {
    authStore.refreshStatus().finally(() => {
      runAutoSign();
    });
  }
});

watch(
  () => [authStore.isLoggedIn, authStore.qq] as const,
  ([isLoggedIn]) => {
    if (isLoggedIn) {
      runAutoSign();
    } else {
      dailySignStore.reset();
    }
  },
);

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
});
</script>

<style></style>
