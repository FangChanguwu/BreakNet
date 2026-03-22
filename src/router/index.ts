import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import PanelView from "@/views/PanelView.vue";
import CreditView from "@/views/CreditView.vue";
import PrivacyView from "@/views/PrivacyView.vue";
import ContactView from "@/views/ContactView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

  if (to.path === "/panel" && !hasToken) {
    next("/");
  } else {
    next();
  }
});

export default router;
