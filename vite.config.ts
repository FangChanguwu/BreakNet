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
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 只要是 node_modules 里的代码，我们就给它分类打包
          if (id.includes("node_modules")) {
            // Vue 全家桶放在一个包里
            if (
              id.includes("vue") ||
              id.includes("pinia") ||
              id.includes("vue-router")
            ) {
              return "vue-vendor";
            }
            // 极其庞大的图表库单独放在一个包里
            if (id.includes("apexcharts")) {
              return "apexcharts-vendor";
            }
            // 弹窗库单独打包
            if (id.includes("sweetalert2")) {
              return "sweetalert2-vendor";
            }
            // 剩下的其他第三方库（比如 axios, dayjs）打成一个常规包
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
