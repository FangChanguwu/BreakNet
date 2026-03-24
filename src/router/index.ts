import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import PanelView from "@/views/PanelView.vue";
import CreditView from "@/views/CreditView.vue";
import PrivacyView from "@/views/PrivacyView.vue";
import ContactView from "@/views/ContactView.vue";
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue";
import AdminUsersView from "@/views/admin/AdminUsersView.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/views/error/Error403View.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/error/Error404View.vue"),
    },
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/panel",
      name: "panel",
      component: PanelView,
    },
    {
      path: "/admin/dashboard",
      name: "admin-dashboard",
      component: AdminDashboardView,
    },
    {
      path: "/admin/users",
      name: "admin-users",
      component: AdminUsersView,
    },
    { path: "/credit", name: "credit", component: CreditView },
    {
      path: "/privacy",
      name: "privacy",
      component: PrivacyView,
    },
    {
      path: "/contact",
      name: "contact",
      component: ContactView,
    },
  ],
});

router.beforeEach((to, _from, next) => {
  const authStorage = localStorage.getItem("auth");
  let hasToken = false;

  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage);
      if (authData.token) {
        hasToken = true;
      }
    } catch (e) {
      console.error("解析本地 auth 失败", e);
    }
  }
  if (to.path.startsWith("/admin")) {
    // 检查本地缓存的管理员状态 (我们在侧边栏里存进去的那个)
    const isAdmin = localStorage.getItem("admin_status") === "true";

    if (!isAdmin) {
      // 身份不符，无情踢到 403 页面
      return next("/403");
    }
  }

  if (to.path === "/panel" && !hasToken) {
    next("/");
  } else {
    next();
  }
});

export default router;
