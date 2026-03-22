import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "url";

// https://vite.dev/config/

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "0.0.0.0", // 监听所有地址，包括局域网 IP
    port: 5173, // 也可以指定一个固定端口
  },
  build: {
    sourcemap: false, // 可选：不要生成 .map
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
