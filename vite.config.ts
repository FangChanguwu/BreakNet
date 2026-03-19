import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/


export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: false,        // 可选：不要生成 .map
  },
})