<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="close">
        <div
          class="modal-card"
          role="dialog"
          aria-modal="true"
          :aria-label="title || '提示'"
        >
          <div class="modal-header">
            <h5 class="modal-title">{{ title || "提示" }}</h5>
            <button
              type="button"
              class="btn-close"
              aria-label="Close"
              @click="close"
            ></button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div class="modal-footer">
            <slot name="footer">
              <button type="button" class="btn btn-primary" @click="close">
                知道了
              </button>
            </slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
  
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";

interface Props {
  modelValue: boolean;
  title?: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const close = () => emit("update:modelValue", false);

const onEsc = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.modelValue) close();
};

onMounted(() => window.addEventListener("keydown", onEsc));
onBeforeUnmount(() => window.removeEventListener("keydown", onEsc));
</script>
  
<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 1050;
}
.modal-card {
  width: min(520px, calc(100vw - 32px));
  background: #fff;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}
.modal-header,
.modal-footer {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  margin: 0;
  font-weight: 600;
}
.btn-close {
  appearance: none;
  background: transparent;
  border: 0;
  width: 1rem;
  height: 1rem;
  mask: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="%23000" d="M3.3 2.3l5.2 5.2 5.2-5.2 1.1 1.1-5.2 5.2 5.2 5.2-1.1 1.1-5.2-5.2-5.2 5.2-1.1-1.1 5.2-5.2-5.2-5.2z"/></svg>')
    center/contain no-repeat;
  background-color: #000;
  opacity: 0.5;
}
.btn-close:hover {
  opacity: 0.8;
}
.modal-body {
  padding: 1rem;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.15s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
  