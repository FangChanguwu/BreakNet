<template>
  <div class="article-page">
    <main class="article-container">
      <router-link to="/panel" class="back-btn">← 返回首页</router-link>

      <h1 class="article-title">联系我们</h1>
      <p class="update-time">很高兴能与您交流</p>

      <div class="article-content">
        <p>
          如果您在使用 Break Bot / BreakNet
          的过程中遇到任何问题，或者有关于功能的绝佳建议，都欢迎通过以下方式联系开发者！
        </p>

        <div class="contact-card">
          <h3>💬 官方交流群</h3>
          <p>QQ群号：<b>1060175133</b></p>
          <p class="desc">
            这里有Break Bot / BreakNet最新的功能预告、Bug
            反馈以及热爱音游的玩家们。
          </p>
        </div>

        <div class="contact-card">
          <h3>👨‍💻 开发者直联</h3>
          <p>管理员QQ：<b>1716530046</b></p>
          <p class="desc">敬请烦扰</p>
        </div>
      </div>
    </main>

    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
</script>

<style scoped src="@/assets/css/article-layout.css"></style>
