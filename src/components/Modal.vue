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

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", qq: string): void;
}>();

const qqNumber = ref("");
const isError = ref(false);
const errorText = ref("输入内容为空");

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

const showExternalError = (msg: string) => {
  errorText.value = msg;
  isError.value = true;
};

defineExpose({
  showExternalError,
});
</script>

<style scoped>
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

.modal-title {
  margin: 0 0 28px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-align: center;
}

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

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.error-msg {
  color: #ff4d4f;
  font-size: 0.85rem;
  margin-top: 8px;
  margin-left: 4px;
  line-height: 1.2;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.register-link {
  color: #1890ff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.register-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-dialog {
  background: #fff;
  width: 80%;
  max-width: 300px;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: popScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.register-title {
  margin: 0 0 12px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.register-desc {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 24px;
}

.got-it-btn {
  background: #1890ff;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
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
