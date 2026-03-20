<template>
  <footer class="site-footer">
    <div class="footer-content">
      <p class="copyright">
        © {{ currentYear }} BreakNet. All rights reserved.
      </p>
      <div class="footer-links">
        <a href="#">隐私政策</a>
        <span class="divider">|</span>
        <a href="#">联系我们</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// 动态获取当前年份
const currentYear = new Date().getFullYear();
</script>

<style scoped>
.site-footer {
  /* 使用变量，白天是白色，夜间是深黑 */
  background: var(--surface-color);
  padding: 2rem 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: var(--text-muted); /* 使用变量：次要文字颜色 */
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 10px;
  align-items: center;
}

.footer-links a {
  color: var(--text-muted); /* 使用变量 */
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: var(--primary-color); /* 悬浮时变成主题橙色 */
}

.divider {
  color: var(--border-color); /* 使用变量 */
}
</style>
