<template>
  <div class="error-page-layout">
    <main class="error-content">
      <div class="error-box">
        <h1 class="error-code">403</h1>
        <h2 class="error-title">Forbidden</h2>
        <p class="error-desc">抱歉，您没有权限访问此页面。</p>
        <router-link to="/panel" class="back-btn">返回主页</router-link>
      </div>
    </main>
    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
</script>

<style scoped>
/* 专属全屏居中布局，脱离侧边栏 */
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

/* 核心方框样式 */
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
  /* 借用你侧边栏很帅的渐变色 */
  background: linear-gradient(135deg, var(--primary-color), #ff4d4f);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
  text-shadow: 0 10px 30px rgba(255, 68, 68, 0.2);
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
  background: var(--primary-color);
  color: #fff;
  text-decoration: none;
  border-radius: 24px;
  font-size: 1.1rem;
  font-weight: bold;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(255, 140, 0, 0.3);
}

.back-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 140, 0, 0.4);
}
</style>
