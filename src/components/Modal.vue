<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="onClose">
      <div class="modal-content">
        <h2 class="modal-title">登录</h2>

        <input
          v-model="qqNumber"
          type="text"
          class="modal-input"
          :class="{ 'is-error': isError }"
          placeholder="请输入qq号码"
          @input="clearError"
          @keyup.enter="onConfirm"
        />
        <transition name="slide-down">
          <div v-if="isError" class="error-msg">
            {{ errorText }}
          </div>
        </transition>
        <div class="modal-footer">
          <span class="register-link" @click="showRegisterTip">如何注册?</span>
          <button class="confirm-btn" @click="onConfirm">确定</button>
        </div>
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div
      v-if="showRegisterDialog"
      class="register-overlay"
      @click.self="closeRegisterTip"
    >
      <div class="register-dialog">
        <h3 class="register-title">我怎么知道</h3>
        <button class="got-it-btn" @click="closeRegisterTip">OK</button>
      </div>
    </div>
  </transition>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

// 接收父组件传来的状态
const props = defineProps<{
  show: boolean;
}>();

// 定义向父组件发射的事件
const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", qq: string): void;
}>();

const qqNumber = ref("");
const isError = ref(false);
const errorText = ref("输入内容为空");

// 监听弹窗打开状态，每次打开时清空输入框
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      qqNumber.value = "";
      isError.value = false;
    }
  },
);

const clearError = () => {
  if (isError.value) {
    isError.value = false;
  }
};

const onClose = () => {
  emit("update:show", false);
};

const onConfirm = () => {
  const qq = qqNumber.value.trim();

  if (!qq) {
    errorText.value = "输入内容为空";
    isError.value = true;
    return;
  }

  const qqRegex = /^[1-9][0-9]{4,10}$/;
  if (!qqRegex.test(qq)) {
    errorText.value = "格式有误";
    isError.value = true;
    return;
  }

  emit("confirm", qq);
};

const showRegisterDialog = ref(false);

const showRegisterTip = () => {
  showRegisterDialog.value = true;
};

const closeRegisterTip = () => {
  showRegisterDialog.value = false;
};

// 向父组件暴露触发外部错误的方法
const showExternalError = (msg: string) => {
  errorText.value = msg;
  isError.value = true;
};

defineExpose({
  showExternalError,
});
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗主内容 (已应用放大的尺寸) */
.modal-content {
  background: #ffffff;
  width: 90%;
  max-width: 420px;
  border-radius: 16px;
  padding: 40px 32px 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 标题 */
.modal-title {
  margin: 0 0 28px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-align: center;
}

/* 输入框 */
.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 18px;
  font-size: 1.1rem;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s ease;
}

.modal-input:focus {
  background: #fff;
  border-color: #ff8c00;
  box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
}

.modal-input::placeholder {
  color: #aaa;
}

/* 底部按钮区 */
.modal-footer {
  display: flex;
  justify-content: space-between; /* 左边链接，右边按钮 */
  align-items: center; /* 确保文字和按钮在同一水平线上 */
  margin-top: 28px;
}

.modal-input.is-error {
  border-color: #ff4d4f;
  background-color: #fff2f0;
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.15);
  animation: shake 0.4s ease-in-out;
}

.modal-input.is-error:focus {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.25);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  50% {
    transform: translateX(6px);
  }
  75% {
    transform: translateX(-6px);
  }
}

/* 确定按钮 */
.confirm-btn {
  background: #ff8c00;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background: #ff9d2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes modalPop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* =========================================
   新增：错误提示文字及滑出动画
========================================= */

/* 错误提示文字样式 */
.error-msg {
  color: #ff4d4f; /* 与红框保持一致的红色 */
  font-size: 0.85rem;
  margin-top: 8px;
  margin-left: 4px;
  /* 避免占据过大空间，导致底部按钮被猛地撑开 */
  line-height: 1.2;
}

/* Vue <transition name="slide-down"> 的滑出动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* 初始和离开时的状态：透明且向上偏移 */
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 新增：蓝色超链接样式 */
.register-link {
  color: #1890ff; /* 经典的链接蓝 */
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-link:hover {
  color: #40a9ff; /* 鼠标悬停时变亮一点 */
  text-decoration: underline; /* 悬停时加下划线，体验更好 */
}

/* =========================================
   新增：自定义注册提示小弹窗
========================================= */

/* 提示弹窗的遮罩层，层级(200)要比主弹窗(100)高 */
.register-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5); /* 稍微深一点的遮罩，突出焦点 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 提示弹窗主体 */
.register-dialog {
  background: #fff;
  width: 80%;
  max-width: 300px; /* 比主弹窗小一点，层级感更强 */
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: popScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 标题 */
.register-title {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

/* 描述文字 */
.register-desc {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* “我知道了”按钮 */
.got-it-btn {
  background: #1890ff; /* 蓝色按钮，呼应蓝色链接 */
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%; /* 按钮占满弹窗底部，方便手机端点击 */
  transition: all 0.2s ease;
}

.got-it-btn:hover {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.got-it-btn:active {
  transform: translateY(0);
}

/* 复用之前的弹出放大动画 */
@keyframes popScale {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
