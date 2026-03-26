<template>
  <div class="col-card sponsor-card">
    <div class="card-header">
      <h3>💖 赞助与支持</h3>
    </div>

    <div class="sponsor-content">
      <div class="qr-wrapper" @click="showModal = true">
        <img src="@/assets/pic/sponsor.png" alt="赞助作者" class="qr-code" />
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
            src="@/assets/pic/sponsor.png"
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

  box-sizing: border-box;
}

.col-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: #ff8c00;
}

.sponsor-content {
  display: flex;
  gap: 30px;
  align-items: center;
}

.qr-wrapper {
  position: relative;
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
  cursor: pointer;
}

.hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
  margin: 6px;
}

.hover-mask span {
  color: #fff;
  font-weight: bold;
  font-size: 0.95rem;
  pointer-events: none;
}

.qr-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 140, 0, 0.15);
  border-style: solid;
}

.qr-wrapper:hover .hover-mask {
  opacity: 1;
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
  backdrop-filter: blur(5px);
  z-index: 9999;
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

  transform: scale(1);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.large-qr {
  width: 350px;
  height: 350px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
  user-select: none;

  -webkit-touch-callout: default;
}

.modal-tip {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  font-weight: bold;
}

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

@media (max-width: 768px) {
  .qr-wrapper {
    width: 150px;
    height: 150px;
  }
  .large-qr {
    width: 250px;
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
