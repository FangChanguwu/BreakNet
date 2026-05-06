import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import AppShell from "@/components/layout/AppShell.vue";
import PanelView from "@/views/PanelView.vue";
import CreditView from "@/views/CreditView.vue";
import PrivacyView from "@/views/PrivacyView.vue";
import ContactView from "@/views/ContactView.vue";
import AdminDashboardView from "@/views/admin/AdminDashboardView.vue";
import AdminLogsView from "@/views/admin/AdminLogsView.vue";
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

import AdminRolesView from "@/views/admin/AdminRolesView.vue";
import ProfileView from "@/views/ProfileView.vue";
import MaimaiAccountView from "@/views/maimai/MaimaiAccountView.vue";
import MaimaiCollectionsView from "@/views/maimai/MaimaiCollectionsView.vue";
import MaimaiDeliveryView from "@/views/maimai/MaimaiDeliveryView.vue";
import MaimaiTestView from "@/views/maimai/MaimaiTestView.vue";
import MaimaiRandomView from "@/views/maimai/MaimaiRandomView.vue";
import MaimaiRegionView from "@/views/maimai/MaimaiRegionView.vue";
import MaimaiScoresView from "@/views/maimai/MaimaiScoresView.vue";
import MaimaiTicketView from "@/views/maimai/MaimaiTicketView.vue";
import MaimaiUnlockView from "@/views/maimai/MaimaiUnlockView.vue";
import ShopView from "@/views/ShopView.vue";
import SpyGameView from "@/views/SpyGameView.vue";
import SongListView from "@/views/maimai/SongListView.vue";

const rolePriority: Record<string, number> = {
  normal: 0,
  premium: 1,
  tech_premium: 2,
  admin: 3,
  superadmin: 4,
};

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    if (to.hash) {
      return {
        el: to.hash,
        top: 0,
        behavior: "smooth",
      };
    }
    return { top: 0, left: 0 };
  },
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
      path: "/game/spy",
      name: "spy-game-entry",
      component: SpyGameView,
      meta: { allowGuest: true },
    },
    {
      path: "/game/spy/:roomId",
      name: "spy-game-room",
      component: SpyGameView,
      meta: { allowGuest: true },
    },
    {
      path: "/",
      component: AppShell,
      children: [
        {
          path: "panel",
          name: "panel",
          component: PanelView,
        },
        {
          path: "admin/dashboard",
          name: "admin-dashboard",
          component: AdminDashboardView,
        },
        {
          path: "admin/users",
          name: "admin-users",
          component: AdminUsersView,
        },
        {
          path: "admin/roles",
          name: "admin-roles",
          component: AdminRolesView,
        },
        {
          path: "admin/logs",
          name: "admin-logs",
          component: AdminLogsView,
          meta: { minRole: "superadmin" },
        },
        {
          path: "maimai/account",
          name: "maimai-account",
          component: MaimaiAccountView,
          meta: { minRole: "premium" },
        },
        {
          path: "maimai/scores",
          name: "maimai-scores",
          component: MaimaiScoresView,
          meta: { minRole: "premium" },
        },
        {
          path: "maimai/ticket",
          name: "maimai-ticket",
          component: MaimaiTicketView,
          meta: { minRole: "premium" },
        },
        {
          path: "maimai/unlock",
          name: "maimai-unlock",
          component: MaimaiUnlockView,
          meta: { minRole: "premium" },
        },
        {
          path: "maimai/delivery",
          name: "maimai-delivery",
          component: MaimaiDeliveryView,
          meta: { minRole: "tech_premium" },
        },
        {
          path: "maimai/test",
          name: "maimai-test",
          component: MaimaiTestView,
          meta: { minRole: "tech_premium" },
        },
        {
          path: "maimai/songs",
          name: "maimai-songs",
          component: SongListView,
        },
        {
          path: "maimai/random",
          name: "maimai-random",
          component: MaimaiRandomView,
        },
        {
          path: "maimai/region",
          name: "maimai-region",
          component: MaimaiRegionView,
          meta: { minRole: "premium" },
        },
        {
          path: "maimai/collections",
          name: "maimai-collections",
          component: MaimaiCollectionsView,
        },
        { path: "credit", name: "credit", component: CreditView },
        { path: "shop", name: "shop", component: ShopView },
        {
          path: "profile",
          name: "profile",
          component: ProfileView,
        },
      ],
    },
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
  const allowGuest = to.meta.allowGuest === true;
  if (!publicPaths.includes(to.path) && !authStore.isLoggedIn && !allowGuest) {
    Toast.fire({
      icon: "warning",
      title: "请先登录后再访问该页面",
    });
    return next("/");
  }

  if (to.path.startsWith("/admin")) {
    if (!authStore.hasRoleAtLeast("admin")) {
      return next("/403");
    }
  }

  const minRole = typeof to.meta.minRole === "string" ? to.meta.minRole : null;
  if (
    minRole &&
    authStore.isLoggedIn &&
    (rolePriority[authStore.role] ?? 0) < (rolePriority[minRole] ?? 0)
  ) {
    Toast.fire({
      icon: "warning",
      title: "当前账号权限不足",
    });
    if (to.path.startsWith("/maimai")) {
      return next("/panel");
    }
    if (to.path.startsWith("/admin")) {
      return next("/403");
    }
    return next("/panel");
  }

  next();
});

export default router;
