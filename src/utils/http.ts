import axios from "axios";

const http = axios.create({
  baseURL: "/break",
  timeout: 5000,
});

http.interceptors.request.use((config) => {
  // 因为 persist 默认以 JSON 格式存在 'auth' 这个 key 下
  const authStorage = localStorage.getItem("auth");
  if (authStorage) {
    try {
      const authData = JSON.parse(authStorage);
      if (authData.token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${authData.token}`;
      }
    } catch (e) {
      console.error("解析 token 失败", e);
    }
  }
  return config;
});

export default http;
