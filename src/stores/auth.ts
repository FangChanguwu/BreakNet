import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>("");
    const qq = ref<string>("");

    const isLoggedIn = computed(() => !!token.value);

    function setLoginInfo(newToken: string, newQq: string) {
      token.value = newToken;
      qq.value = newQq;
    }

    function logout() {
      token.value = "";
      qq.value = "";
      localStorage.removeItem("admin_status");
      localStorage.removeItem("auth"); // 清理
    }

    return { token, qq, isLoggedIn, setLoginInfo, logout };
  },
  {
    persist: true,
  },
);
