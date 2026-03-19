<template>
  <div class="container mt-5">
    <h1>你好。{{ auth.qq }}<br />这里什么也没有</h1>
    <button class="btn btn-danger" @click="logout">退出登录</button>

    <button class="teleport-btn" @click="teleport">🔞点我查看学习资料🔞</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
const router = useRouter();
const auth = useAuthStore();

const logout = () => {
  auth.logout();
  router.replace("/login");
};

const teleport = () => {
  window.open("https://www.bilibili.com/video/BV1iJdcY5Ef4", "_blank");
};
</script>

<style scoped>
.btn,
.teleport-btn {
  display: block; /* 按钮独占一行 */
  margin: 8px auto; /* 上下间距 + 居中 */
}

/* 彩虹流动按钮 */
.teleport-btn {
  --h: 48px;
  --radius: 14px;
  --speed: 3.5s; /* 流动速度，可调快慢 */
  --glow: 0 8px 24px rgba(255, 0, 200, 0.35), 0 2px 8px rgba(0, 200, 255, 0.35);

  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  height: var(--h);
  padding: 0 22px;
  border: none;
  border-radius: var(--radius);
  cursor: pointer;

  color: #fff;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: none;
  position: relative;
  isolation: isolate;
  overflow: hidden;

  /* 核心：超宽渐变，移动背景实现流动 */
  background: linear-gradient(
    90deg,
    #ff0048,
    #ff8a00,
    #ffe600,
    #21e32b,
    #00c2ff,
    #7a00ff,
    #ff2bd6,
    #ff0048
  );
  background-size: 300% 100%;
  animation: rainbow-move var(--speed) linear infinite;

  /* 细节：轻微玻璃感与发光 */
  box-shadow: var(--glow);
  backdrop-filter: saturate(140%) blur(0.5px);
}

/* 文字描边/发光增强对比 */
.teleport-btn::first-line {
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.45),
    0 0 18px rgba(255, 255, 255, 0.35);
}

/* 高亮流光（左→右） */
.teleport-btn::after {
  content: "";
  position: absolute;
  inset: -40%;
  background: radial-gradient(
    120px 60px at var(--shine-x, -30%) 50%,
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0.15) 40%,
    rgba(255, 255, 255, 0) 70%
  );
  mix-blend-mode: screen;
  filter: blur(2px);
  animation: sheen 2.6s cubic-bezier(0.6, 0.2, 0.2, 1) infinite;
  pointer-events: none;
  z-index: 1;
}

/* 悬停/按下的交互 */
.teleport-btn:hover {
  filter: brightness(1.08);
  box-shadow: 0 10px 28px rgba(255, 0, 200, 0.45),
    0 4px 14px rgba(0, 200, 255, 0.45);
}
.teleport-btn:active {
  transform: translateY(1px) scale(0.99);
}

/* 关键帧：彩虹左右流动 */
@keyframes rainbow-move {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: -200% 50%;
  }
}

/* 关键帧：高亮流光从左扫到右 */
@keyframes sheen {
  0% {
    --shine-x: -30%;
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    --shine-x: 130%;
    opacity: 0;
  }
}
</style>