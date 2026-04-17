import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import "./assets/css/bootstrap.css";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "./stores/auth";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import VueApexCharts from "vue3-apexcharts";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(VueApexCharts);
if (import.meta.env.DEV) {
  const authStore = useAuthStore();
  const DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN;
  const DEV_QQ = import.meta.env.VITE_DEV_QQ;
  authStore.setLoginInfo(DEV_TOKEN, DEV_QQ);
  localStorage.setItem(
    "admin_status",
    import.meta.env.VITE_ADMIN_STATUS || "true",
  );
}

app.use(router);
app.mount("#app");
