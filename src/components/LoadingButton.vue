<!-- LoadingButton.vue -->
<template>
  <button class="lb-btn" :disabled="isLoading" @click="handleClick">
    <span class="lb-content">
      <Transition name="lb-slide-fade" mode="out-in">
        <!-- 常规文案 -->
        <span v-if="!isLoading" key="label">{{ label }}</span>

        <!-- 加载态：转圈 + 文字 -->
        <span v-else key="loading" class="lb-loading-wrap">
          <svg class="lb-spinner" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="lb-ring" cx="12" cy="12" r="9" />
            <path class="lb-arc" d="M21 12a9 9 0 0 1-9 9" />
          </svg>
          正在加载
        </span>
      </Transition>
    </span>
  </button>
</template>
  
<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  label?: string;
  loading?: boolean;
  // 点击时是否由组件内部托管loading（默认 true）
  managed?: boolean;
}>();

const emit = defineEmits<{
  // (event, done) => void；若 managed=true，异步完成后调用 done() 结束loading
  (e: "click", ev: MouseEvent, done: () => void): void;
}>();

const innerLoading = ref(false);
const isLoading = computed(() => props.loading ?? innerLoading.value);

const handleClick = (ev: MouseEvent) => {
  if (isLoading.value) return;

  const done = () => (innerLoading.value = false);

  if (props.managed !== false) {
    innerLoading.value = true;
    emit("click", ev, done);
  } else {
    // 受控模式：父组件自己用 :loading 控制
    emit("click", ev, () => {});
  }
};
</script>
  
  <style scoped>
.lb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  background: #3b82f6; /* 主题蓝 */
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease,
    background 0.2s ease;
  box-shadow: 0 6px 14px rgba(59, 130, 246, 0.2);
}
.lb-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.25);
}
.lb-btn:active {
  transform: translateY(0);
}
.lb-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.lb-content {
  display: inline-flex;
  align-items: center;
  min-height: 1em; /* 避免抖动 */
}

/* 过渡：丝滑的淡入+轻微下滑/上滑 */
.lb-slide-fade-enter-active,
.lb-slide-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.lb-slide-fade-enter-from,
.lb-slide-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 加载区布局 */
.lb-loading-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}

/* Spinner 样式与动画 */
.lb-spinner {
  width: 1.1em;
  height: 1.1em;
  display: inline-block;
  animation: lb-rotate 1s linear infinite;
}

/* 外环（浅） */
.lb-ring {
  fill: none;
  stroke: rgba(255, 255, 255, 0.35);
  stroke-width: 3;
}

/* 弧形（深） */
.lb-arc {
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-width: 3;
}

@keyframes lb-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
  