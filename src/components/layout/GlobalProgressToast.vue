<template>
  <transition-group name="global-progress" tag="div" class="global-progress-stack">
    <aside v-for="item in progress.items" :key="item.id" class="global-progress-toast" :class="item.status" role="status">
      <div class="progress-icon" aria-hidden="true">
        <span v-if="item.status === 'running'" class="spinner"></span>
        <span v-else-if="item.status === 'success'">✓</span>
        <span v-else>!</span>
      </div>
      <div class="progress-copy">
        <strong>{{ item.title || "任务进度" }}</strong>
        <span>{{ item.message }}</span>
      </div>
      <button v-if="item.closable" class="progress-close" type="button" aria-label="关闭" @click="progress.dismiss(item.id)">
        ×
      </button>
    </aside>
  </transition-group>
</template>

<script setup lang="ts">
import { useGlobalProgressStore } from "@/stores/globalProgress";

const progress = useGlobalProgressStore();
</script>

<style scoped>
.global-progress-stack {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 2200;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(360px, calc(100vw - 32px));
  pointer-events: none;
}

.global-progress-toast {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 14px 14px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: #102033;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.global-progress-toast.running {
  border-color: rgba(14, 165, 233, 0.35);
}

.global-progress-toast.success {
  border-color: rgba(34, 197, 94, 0.38);
}

.global-progress-toast.error {
  border-color: rgba(220, 38, 38, 0.36);
}

.progress-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-weight: 800;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
}

.success .progress-icon {
  background: rgba(34, 197, 94, 0.14);
  color: #16a34a;
}

.error .progress-icon {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(2, 132, 199, 0.18);
  border-top-color: #0284c7;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.progress-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-copy strong,
.progress-copy span {
  overflow-wrap: anywhere;
}

.progress-copy strong {
  font-size: 14px;
  line-height: 1.3;
}

.progress-copy span {
  font-size: 13px;
  line-height: 1.45;
  color: rgba(15, 23, 42, 0.72);
}

.progress-close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.74);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.progress-close:hover {
  background: rgba(15, 23, 42, 0.12);
}

.global-progress-enter-active,
.global-progress-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.global-progress-enter-from,
.global-progress-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .global-progress-stack {
    top: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>
