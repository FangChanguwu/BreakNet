<template>
  <div class="row-card banner-card">
    <h2>🎉 欢迎来到 BreakNet</h2>
    <p class="highlight-text">
      加入 Break 官方交流群：
      <strong class="group-number" title="双击复制" @click="copyGroupNumber">
        {{ groupNumber }}
      </strong>
    </p>
    <span v-if="copied" class="copy-hint">已复制!</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const groupNumber = "1060175133";
const copied = ref(false);

const copyGroupNumber = async () => {
  try {
    await navigator.clipboard.writeText(groupNumber);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    alert("复制失败，请手动选择复制");
  }
};
</script>

<style scoped>
/* 从 PanelView 抽离出来的 Banner 样式 */
.banner-card {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.05), transparent);
  position: relative; /* 为了定位复制提示 */
}

.banner-card h2 {
  margin-top: 0;
  color: var(--text-main);
}

.highlight-text {
  font-size: 1.1rem;
  color: var(--text-muted);
}

.group-number {
  color: var(--primary-color);
  font-size: 1.5rem;
  letter-spacing: 1px;
  user-select: all;
  cursor: copy;
  transition: opacity 0.2s;
}

.group-number:hover {
  opacity: 0.8;
}

.copy-hint {
  position: absolute;
  top: 10px;
  right: 20px;
  color: #52c41a;
  font-size: 0.9rem;
  font-weight: bold;
  animation: fadeInOut 2s ease-in-out;
}

@keyframes fadeInOut {
  0%,
  100% {
    opacity: 0;
    transform: translateY(5px);
  }
  20%,
  80% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 引入全局卡片样式（如果你的项目中这些类是全局的可以省略，为了组件独立性建议保留） */
.row-card {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.row-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: var(--primary-color);
}
</style>
