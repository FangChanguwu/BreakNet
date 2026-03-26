import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import PanelView from "@/views/PanelView.vue";
import CreditView from "@/views/CreditView.vue";
import PrivacyView from "@/views/PrivacyView.vue";
import ContactView from "@/views/ContactView.vue";
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue";
import AdminUsersView from "@/views/admin/AdminUsersView.vue";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/auth";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "var(--surface-color)",
  color: "var(--text-main)",
});

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
  const authStore = useAuthStore();

  // 白名单
  const publicPaths = ["/", "/privacy", "/contact", "/403", "/404"];
  if (!publicPaths.includes(to.path) && !authStore.isLoggedIn) {
    Toast.fire({
      icon: "warning",
      title: "请先登录后再访问该页面",
    });
    return next("/");
  }

  if (to.path.startsWith("/admin")) {
    const isAdmin = localStorage.getItem("admin_status") === "true";
    if (!isAdmin) {
      return next("/403");
    }
  }

  next();
});

export default router;
