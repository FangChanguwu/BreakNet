<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";

const router = useRouter();
const authStore = useAuthStore();

const handleStorageChange = (e: StorageEvent) => {
  if (e.key === "auth" && !e.newValue) {
    authStore.token = "";
    authStore.qq = "";
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
});

onUnmounted(() => {
  window.removeEventListener("storage", handleStorageChange);
});
</script>

<style></style>
