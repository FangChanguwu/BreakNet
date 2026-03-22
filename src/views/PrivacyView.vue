<template>
  <div class="article-page">
    <main class="article-container">
      <router-link to="/panel" class="back-btn">← 返回首页</router-link>

      <h1 class="article-title">隐私政策</h1>
      <p class="update-time">最后更新时间：2026年3月23日</p>

      <div class="article-content">
        <p>
          欢迎您使用 BreakNet
          提供的服务！我们非常重视您的隐私保护和个人信息安全。
        </p>

        <h3>1. 我们如何收集和使用您的信息</h3>
        <p>
          当您使用 BreakNet 及Break Bot
          提供服务时，为了提供基础的积分、签到及舞萌DX功能，我们会收集并记录您的
          <b>QQ号码、舞萌账号</b>
          以及相关的数据。我们承诺这些数据仅用于服务本身，绝不用于任何恶意用途或第三方倒卖。
        </p>

        <h3>2. 数据安全</h3>
        <p>
          我们致力于保证您的信息安全，然而任何系统均不可能保证不可被攻击。即使出现不可抗因素导致
          BreakNet 被攻击，我们也会尽全力防止您的信息泄露。
        </p>

        <h3>3. 您的权利</h3>
        <p>
          您有权随时联系管理员查询、更正或要求删除您的相关数据。如果您希望退出
          BreakNet
          的服务，清空您的数据记录，请通过“联系我们”页面与管理员取得联系。
        </p>
      </div>
    </main>

    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
</script>

<style scoped src="@/assets/css/article-layout.css"></style>
