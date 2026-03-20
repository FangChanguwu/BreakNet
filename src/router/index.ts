import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue"; // 原来的 LoginView
import PanelView from "../views/PanelView.vue"; // 原来的 HomeView
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
