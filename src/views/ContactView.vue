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
          <h3>开发者成员</h3>
          <div class="developer-grid">
            <article v-for="member in developerMembers" :key="member.qq" class="developer-card">
              <img :src="getQqAvatar(member.qq)" :alt="member.name" class="developer-avatar" />
              <strong>{{ member.name }}</strong>
              <span>{{ member.description }}</span>
            </article>
          </div>
        </div>
      </div>
    </main>

    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";

const developerMembers = [
  { name: "方长", qq: "1716530046", description: "网页/Bot总开发" },
  { name: "KyokuKong", qq: "2913844577", description: "开发环境支持" },
  { name: "おちんちん", qq: "2462899285", description: "开发" },
  { name: "Ctrlcvs🧊", qq: "752779988", description: "洛克王国高手" },
  { name: "开脆Rabbit", qq: "2681722448", description: "美术" },
  { name: "坠星", qq: "1151974902", description: "吉祥物" },
];

const getQqAvatar = (qq: string) => `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
</script>

<style scoped src="@/assets/css/article-layout.css"></style>
<style scoped>
.developer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.developer-card {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(148, 163, 184, 0.16);
  text-align: center;
}

.developer-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(249, 115, 22, 0.22);
}

.developer-card strong {
  color: var(--text-main);
  font-size: 0.98rem;
}

.developer-card span {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.4;
}
</style>
