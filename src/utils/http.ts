import axios from "axios";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import Swal from "sweetalert2";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: "var(--surface-color)",
  color: "var(--text-main)",
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
});

http.interceptors.request.use((config) => {
  let token = "";

  // 尝试从 localStorage 读取
  const authStorage = localStorage.getItem("auth");
  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage);
      if (authData.token) {
        token = authData.token;
      }
    } catch (e) {
      console.error("解析 token 失败", e);
    }
  }

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
      localStorage.removeItem("admin_status");
      localStorage.removeItem("auth");
      Toast.fire({
        icon: "warning",
        title: "登录状态已失效，请重新登录",
      });
      router.push("/");
    }
    if (
      error.response &&
      error.response.status === 403 &&
      typeof error.response.data?.detail === "string" &&
      error.response.data.detail.includes("封禁")
    ) {
      const authStore = useAuthStore();
      authStore.logout();
      localStorage.removeItem("admin_status");
      localStorage.removeItem("auth");
      Toast.fire({
        icon: "error",
        title: "账号已被封禁，无法继续访问",
      });
      router.push("/");
    }
    return Promise.reject(error);
  },
);

export default http;
