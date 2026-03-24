import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import "./assets/css/bootstrap.css";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// ✨ 2. 极其重要：必须先让 app use(pinia)，才能去调用 Store！
app.use(pinia);
if (import.meta.env.DEV) {
  const authStore = useAuthStore();
  const DEV_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNzE2NTMwMDQ2IiwiZXhwIjoyMDg5NjQwNTIwfQ.4rfuFlgJyhYfn1PBhXO3612_bjgH0iAf4vOJIm-WYTk";
  const DEV_QQ = "1716530046";
  authStore.setLoginInfo(DEV_TOKEN, DEV_QQ);
  localStorage.setItem("admin_status", "true"); // 直接强行开启管理员侧边栏
}

app.use(router);
app.mount("#app");
