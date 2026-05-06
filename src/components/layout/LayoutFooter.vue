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
  background: transparent;
  padding: 2rem 0 2.5rem;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
  display: flex;

  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.footer-logo {
  height: 56px;
  width: auto;
  margin-bottom: 4px;
  opacity: 0.86;
  transition: transform 0.3s ease;
}

.footer-logo:hover {
  transform: scale(1.05);
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
  flex-wrap: wrap;
  justify-content: center;
}

.footer-links a {
  color: var(--text-muted);
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

@media (max-width: 768px) {
  .site-footer {
    padding: 2.5rem 0;
  }

  .footer-content {
    padding: 0 20px;
  }

  .footer-logo {
    height: 40px;
  }

  .footer-links {
    gap: 10px;
  }
}
</style>
