<template>
  <div class="col-card sponsor-card">
    <div class="card-header">
      <h3>💖 赞助与支持</h3>
    </div>

    <div class="sponsor-content">
      <div class="qr-wrapper" @click="showModal = true">
        <img src="../assets/pic/sponsor.png" alt="赞助作者" class="qr-code" />
        <div class="hover-mask">
          <span>🔍 点击放大</span>
        </div>
      </div>

      <div class="text-content">
        <h4 class="title">请作者打把舞萌 🧤</h4>
        <p class="desc">
          BreakNet
          的开发与服务器日常维护都离不开您的支持。如果您觉得这个项目对您有帮助，欢迎随缘赞助！
        </p>
        <p class="thanks-text">感谢您的认可与支持 ~</p>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click="showModal = false">
        <div class="modal-content" @click.stop>
          <button class="close-btn" @click="showModal = false">✕</button>
          <img
            src="../assets/pic/sponsor.png"
            alt="赞助收款码放大版"
            class="large-qr"
          />
          <p class="modal-tip">扫一扫，或截图保存</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 控制弹窗显示的响应式变量
const showModal = ref(false);
</script>

<style scoped>
/* ================= 通用卡片样式 ================= */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}
.col-card {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  /* height: 100%; */
  box-sizing: border-box;
}

.col-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: #ff8c00; /* 赞助卡片 hover 时带点橙色强调 */
}

/* ================= 赞助内容区样式 ================= */
.sponsor-content {
  display: flex;
  gap: 30px; /* 增加一点间距，防止大图和文字挤在一起 */
  align-items: center;
}

.qr-wrapper {
  position: relative; /* 为了定位悬浮遮罩 */
  flex-shrink: 0;
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed var(--primary-color);
  padding: 6px;
  background: var(--bg-color);
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer; /* 鼠标变成小手，提示可点击 */
}

/* 悬浮时的遮罩层，增加交互反馈 */
.hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px; /* 贴合内部图片的圆角 */
  margin: 6px; /* 避开 padding 区域 */
}

.hover-mask span {
  color: #fff;
  font-weight: bold;
  font-size: 0.95rem;
  pointer-events: none; /* 让文字不阻挡点击 */
}

.qr-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 140, 0, 0.15);
  border-style: solid; /* 悬浮时虚线变实线 */
}

.qr-wrapper:hover .hover-mask {
  opacity: 1; /* 鼠标放上去显示遮罩 */
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-drag: none;
}

.text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.desc {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.thanks-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary-color);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px); /* 背景虚化，更聚焦 */
  z-index: 9999; /* 保证在最顶层，盖住导航栏 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  /* 弹窗弹出的微动效 */
  transform: scale(1);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.large-qr {
  width: 350px; /* 放大的尺寸 */
  height: 350px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
  user-select: none;
  /* 防止手机端长按出黑框，保留原生保存图片功能 */
  -webkit-touch-callout: default;
}

.modal-tip {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  font-weight: bold;
}

/* 弹窗右上角关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #ff4d4f;
  color: #fff;
  transform: rotate(90deg);
}

/* ================= Vue 过渡动画 ================= */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ================= 响应式适配 ================= */
@media (max-width: 768px) {
  .qr-wrapper {
    width: 150px;
    height: 150px;
  }
  .large-qr {
    width: 250px; /* 手机端弹窗里的图片稍微缩小一点防止溢出 */
    height: 250px;
  }
}

@media (max-width: 600px) {
  .sponsor-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  .qr-wrapper {
    width: 160px;
    height: 160px;
  }
}
</style>
