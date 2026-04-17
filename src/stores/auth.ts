import { computed, ref } from "vue";
import { defineStore } from "pinia";

const rolePriority: Record<string, number> = {
  normal: 0,
  premium: 1,
  admin: 2,
  superadmin: 3,
};

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string>("");
    const qq = ref<string>("");
    const role = ref<string>("normal");

    const isLoggedIn = computed(() => !!token.value);
    const hasRoleAtLeast = (requiredRole: string) =>
      (rolePriority[role.value] ?? 0) >= (rolePriority[requiredRole] ?? 0);

    const isPremium = computed(() => hasRoleAtLeast("premium"));
    const isAdmin = computed(() => hasRoleAtLeast("admin"));

    function syncAdminFlag() {
      localStorage.setItem("admin_status", isAdmin.value ? "true" : "false");
    }

    function setLoginInfo(newToken: string, newQq: string, newRole?: string) {
      token.value = newToken;
      qq.value = newQq;
      role.value = newRole || "normal";
      syncAdminFlag();
    }

    function logout() {
      token.value = "";
      qq.value = "";
      role.value = "normal";
      localStorage.removeItem("admin_status");
      localStorage.removeItem("auth");
    }

    async function refreshStatus() {
      if (!token.value) return;

      try {
        const { default: http } = await import("@/utils/http");
        const res = await http.get("/auth/me");
        if (res.data?.ok) {
          role.value = res.data.data?.role || "normal";
          qq.value = String(res.data.data?.qq || qq.value);
          syncAdminFlag();
          return;
        }
      } catch (error) {
        console.error("Refresh status failed:", error);
      }

      syncAdminFlag();
    }

    return {
      token,
      qq,
      role,
      isLoggedIn,
      isPremium,
      isAdmin,
      hasRoleAtLeast,
      setLoginInfo,
      logout,
      refreshStatus,
    };
  },
  {
    persist: true,
  },
);
