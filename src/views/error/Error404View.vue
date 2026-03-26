<template>
  <div class="error-page-layout">
    <main class="error-content">
      <div class="error-box">
        <h1 class="error-code code-404">404</h1>
        <h2 class="error-title">Not Found</h2>
        <p class="error-desc">
          抱歉，您访问的页面被吃掉了！<br />请检查网址是否输入正确。
        </p>
        <router-link to="/panel" class="back-btn btn-404">
          返回安全地带
        </router-link>
      </div>
    </main>
    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
</script>

<style scoped>
.error-page-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-color);
}

.error-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.error-box {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 24px;
  padding: 60px 80px;
  text-align: center;
  box-shadow: 0 10px 40px var(--shadow-color);
  max-width: 500px;
  width: 100%;
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.error-code {
  font-size: 7rem;
  font-weight: 900;
  margin: 0;
  font-family: "Arial Black", Impact, sans-serif;
  line-height: 1.1;
}

.code-404 {
  background: linear-gradient(135deg, #a855f7, #3b82f6);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
}

.error-title {
  font-size: 2rem;
  color: var(--text-main);
  margin: 10px 0 20px 0;
  letter-spacing: 2px;
}

.error-desc {
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 40px;
}

.back-btn {
  display: inline-block;
  padding: 12px 36px;
  color: #fff;
  text-decoration: none;
  border-radius: 24px;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.2s ease;
}

.btn-404 {
  background: #3b82f6;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.btn-404:hover {
  transform: translateY(-3px);
  background: #2563eb;
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}
</style>
