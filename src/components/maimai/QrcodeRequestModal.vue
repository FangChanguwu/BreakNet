<template>
  <transition name="qr-fade">
    <div v-if="open" class="qr-modal-overlay" @click="handleClose">
      <article class="qr-modal-card" @click.stop>
        <button class="qr-close-btn" type="button" :disabled="busy" @click="handleClose">×</button>
        <span class="qr-kicker">QR REQUIRED</span>
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>

        <textarea
          :value="modelValue"
          class="qr-textarea"
          placeholder="粘贴二维码字符串"
          spellcheck="false"
          @input="updateText"
        ></textarea>

        <div class="qr-actions">
          <button class="qr-ghost-btn" type="button" :disabled="busy" @click="fileInput?.click()">上传截图</button>
          <button class="qr-primary-btn" type="button" :disabled="busy || !modelValue.trim()" @click="submitText">
            <span v-if="busy && busyText" class="qr-progress">
              <span>{{ busyText }}</span>
              <span class="qr-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            </span>
            <span v-else>{{ submitTextLabel }}</span>
          </button>
        </div>

        <p class="qr-hint">{{ displayHint }}</p>
        <input ref="fileInput" class="qr-hidden-input" type="file" accept="image/*" @change="handleFileChange" />
      </article>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmap) => Promise<BarcodeDetectorResult[]>;
};

const props = withDefaults(
  defineProps<{
    open: boolean;
    modelValue: string;
    title?: string;
    description?: string;
    hint?: string;
    submitText?: string;
    busyText?: string;
    busy?: boolean;
  }>(),
  {
    title: "需要新的二维码",
    description: "请上传二维码截图或直接粘贴二维码字符串后继续操作。",
    hint: "支持截图识别，也可以直接粘贴二维码原文。",
    submitText: "使用二维码",
    busyText: "",
    busy: false,
  },
);

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
  (event: "close"): void;
  (event: "submit", value: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const localHint = ref("");

const displayHint = computed(() => localHint.value || props.hint);
const submitTextLabel = computed(() => props.submitText || "使用二维码");

watch(
  () => props.hint,
  () => {
    localHint.value = "";
  },
);

const updateText = (event: Event) => {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
};

const handleClose = () => {
  if (!props.busy) emit("close");
};

const submitText = () => {
  const value = props.modelValue.trim();
  if (value) emit("submit", value);
};

const getBarcodeDetectorCtor = (): BarcodeDetectorCtor | null => {
  if (typeof window === "undefined") return null;
  return (window as Window & { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector || null;
};

const decodeQrFromFile = async (file: File) => {
  const Detector = getBarcodeDetectorCtor();
  if (!Detector) throw new Error("当前浏览器不支持截图识别，请直接粘贴二维码字符串。");

  const bitmap = await createImageBitmap(file);
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const results = await detector.detect(bitmap);
    const rawValue = results.find((item) => item.rawValue)?.rawValue?.trim();
    if (!rawValue) throw new Error("没有识别到二维码，请换一张更清晰的截图。");
    return rawValue;
  } finally {
    bitmap.close();
  }
};

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const qrcode = await decodeQrFromFile(file);
    emit("update:modelValue", qrcode);
    localHint.value = `已从截图识别二维码：${file.name}`;
  } catch (error) {
    localHint.value = (error as Error).message || "二维码识别失败";
  } finally {
    input.value = "";
  }
};
</script>

<style scoped>
.qr-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(5px);
}

.qr-modal-card {
  position: relative;
  width: min(520px, 100%);
  box-sizing: border-box;
  padding: 28px;
  border-radius: 22px;
  border: 1px solid rgba(251, 146, 60, 0.22);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(255, 247, 237, 0.96));
  box-shadow: 0 24px 70px rgba(124, 45, 18, 0.22);
}

.qr-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0;
}

.qr-modal-card h3 {
  margin: 12px 0 0;
  color: #0f172a;
  font-size: 1.35rem;
}

.qr-modal-card p {
  margin: 10px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.qr-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(251, 146, 60, 0.12);
  color: #9a3412;
  font-size: 1.3rem;
  cursor: pointer;
}

.qr-close-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.qr-textarea {
  width: 100%;
  min-height: 128px;
  margin-top: 14px;
  resize: vertical;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba(251, 146, 60, 0.24);
  padding: 14px;
  background: #fffaf5;
  color: #0f172a;
  font: inherit;
  outline: none;
}

.qr-textarea:focus {
  border-color: rgba(249, 115, 22, 0.72);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}

.qr-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.qr-actions button {
  flex: 1;
  min-height: 42px;
  border-radius: 999px;
  border: 0;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.qr-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.qr-ghost-btn {
  background: rgba(251, 146, 60, 0.12);
  color: #c2410c;
}

.qr-primary-btn {
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24);
}

.qr-hint {
  min-height: 22px;
  font-size: 0.9rem;
}

.qr-hidden-input {
  display: none;
}

.qr-progress,
.qr-loading-dots {
  display: inline-flex;
  align-items: center;
}

.qr-progress {
  gap: 8px;
  justify-content: center;
}

.qr-loading-dots {
  gap: 4px;
}

.qr-loading-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: qr-dot-bounce 0.8s ease-in-out infinite;
}

.qr-loading-dots i:nth-child(2) {
  animation-delay: 0.12s;
}

.qr-loading-dots i:nth-child(3) {
  animation-delay: 0.24s;
}

.qr-fade-enter-active,
.qr-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.qr-fade-enter-from,
.qr-fade-leave-to {
  opacity: 0;
}

.qr-fade-enter-from .qr-modal-card,
.qr-fade-leave-to .qr-modal-card {
  transform: translateY(8px) scale(0.98);
}

@keyframes qr-dot-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-4px);
  }
}

[data-theme="dark"] .qr-modal-card {
  border-color: rgba(251, 146, 60, 0.26);
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .qr-modal-card h3,
[data-theme="dark"] .qr-textarea {
  color: #e2e8f0;
}

[data-theme="dark"] .qr-modal-card p {
  color: #94a3b8;
}

[data-theme="dark"] .qr-textarea {
  border-color: rgba(251, 146, 60, 0.3);
  background: rgba(15, 23, 42, 0.9);
}

@media (max-width: 560px) {
  .qr-modal-card {
    padding: 24px 18px 20px;
  }

  .qr-actions {
    flex-direction: column;
  }
}
</style>
