<template>
  <footer class="site-footer">
    <div class="footer-content">
      <img
        src="@/assets/pic/logo.png"
        alt="BreakNet Logo"
        class="footer-logo"
      />

      <p class="copyright">
        © 2025 - {{ currentYear }} BreakNet. All rights reserved.
      </p>

      <div class="footer-links">
        <router-link to="/privacy">隐私政策</router-link>
        <span class="divider">·</span>
        <router-link to="/contact">联系我们</router-link>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>

<style scoped>
.site-footer {
  background: var(--surface-color);
  /* ✨ 加大了上下 padding，让 Footer 整体变高、更舒展 */
  padding: 3rem 0;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  /* ✨ 改为垂直列布局，并全部居中对齐 */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px; /* 控制三个板块之间的间距 */
  color: var(--text-muted);
  font-size: 0.95rem;
}

.footer-logo {
  /* ✨ Logo 尺寸翻倍，更加醒目 */
  height: 100px;
  width: auto;
  margin-bottom: 8px;
  /* 如果你想让 Logo 显得更低调沉稳，可以解开下面这行注释： */
  /* filter: grayscale(100%) opacity(0.8); */
  transition: transform 0.3s ease;
}

.footer-logo:hover {
  transform: scale(1.05); /* 鼠标放上去微微放大，增加交互感 */
}

.copyright {
  margin: 0;
  letter-spacing: 0.5px;
  text-align: center;
}

.footer-links {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-top: 4px;
}

.footer-links a {
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    color 0.3s,
    transform 0.2s;
  font-weight: 500;
}

.footer-links a:hover {
  color: var(--primary-color);
  transform: translateY(-2px);
}

.divider {
  color: var(--border-color);
  font-weight: bold;
}

/* 手机端适配：稍微缩小 padding 和 logo */
@media (max-width: 768px) {
  .site-footer {
    padding: 2.5rem 0;
  }
  .footer-logo {
    height: 40px;
  }
}
</style>
