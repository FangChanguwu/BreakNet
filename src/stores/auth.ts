import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>("");
    const qq = ref<string>("");
    const role = ref<string>("normal");

    const isLoggedIn = computed(() => !!token.value);
    const isAdmin = computed(() => role.value === "admin" || role.value === "superadmin");

    function setLoginInfo(newToken: string, newQq: string, newRole?: string) {
      token.value = newToken;
      qq.value = newQq;
      if (newRole) role.value = newRole;
    }

    function logout() {
      token.value = "";
      qq.value = "";
      role.value = "normal";
      localStorage.removeItem("admin_status");
      localStorage.removeItem("auth"); // 清理
    }

    async function refreshStatus() {
      if (!token.value) return;
      
      try {
        // 使用原生的 axios 或者动态导入 http 避免循环依赖
        const { default: http } = await import("@/utils/http");
        const res = await http.get("/admin/check");
        if (res.data?.ok) {
          role.value = res.data.role || "admin";
          localStorage.setItem("admin_status", "true");
        } else {
          role.value = "normal";
          localStorage.setItem("admin_status", "false");
        }
      } catch (error) {
        console.error("Refresh status failed:", error);
        // 如果是 401，http 拦截器会处理登出
        // 这里的报错通常是网络问题或权限不足
        localStorage.setItem("admin_status", "false");
      }
    }

    return { token, qq, role, isLoggedIn, isAdmin, setLoginInfo, logout, refreshStatus };
  },
  {
    persist: true,
  },
);
