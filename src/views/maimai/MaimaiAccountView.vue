<template>
  <main class="content-area">
    <section class="page-header">
      <div class="header-copy">
        <span class="page-kicker">Maimai Account Hub</span>
        <h2>账号管理</h2>
        <p class="subtitle">
          管理当前 QQ 绑定的舞萌账号，支持二维码绑定、切换当前账号，以及通过激活刷新预览缓存和操作所需的 cookie。
        </p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="fetchAccounts">
        {{ loading ? "刷新中..." : "刷新列表" }}
      </button>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span class="summary-label">当前 QQ</span>
        <strong>{{ authStore.qq || "--" }}</strong>
        <p>站内账号</p>
      </article>
      <article class="summary-card highlight">
        <span class="summary-label">当前账号</span>
        <strong>{{ currentAccount?.uid ?? "--" }}</strong>
        <p>{{ currentAccount?.displayName || "尚未绑定舞萌账号" }}</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">已绑定</span>
        <strong>{{ accounts.length }}</strong>
        <p>个舞萌账号</p>
      </article>
      <article class="summary-card">
        <span class="summary-label">当前 Rating</span>
        <strong>{{ currentAccount?.preview.playerRating ?? "--" }}</strong>
        <p>{{ formatLastPlay(currentAccount?.preview.lastPlayDate) }}</p>
      </article>
    </section>

    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <section class="panel-card">
      <div class="panel-head">
        <div>
          <h3>已绑定账号</h3>
          <p>可以切换当前操作账号，也可以解绑不再使用的 UID。</p>
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>正在读取绑定账号...</p>
      </div>

      <div v-else-if="!accounts.length" class="state-box empty">
        <p>当前还没有绑定任何舞萌账号，可以先在下方粘贴二维码内容或上传二维码截图进行绑定。</p>
      </div>

      <div v-else class="account-grid">
        <article v-for="account in accounts" :key="account.uid" class="account-card" :class="{ current: account.isCurrent }">
          <div class="account-top">
            <div>
              <div class="account-name-row">
                <h4>{{ account.displayName }}</h4>
                <span v-if="account.isCurrent" class="current-badge">当前</span>
              </div>
              <p class="uid-text">UID {{ account.uid }}</p>
            </div>
            <div class="rating-pill">
              {{ account.preview.playerRating ?? "--" }}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span>最近游玩</span>
              <strong>{{ formatLastPlay(account.preview.lastPlayDate) }}</strong>
            </div>
            <div class="meta-item">
              <span>版本</span>
              <strong>{{ account.preview.lastRomVersion || "--" }}</strong>
            </div>
            <div class="meta-item">
              <span>数据版本</span>
              <strong>{{ account.preview.lastDataVersion || "--" }}</strong>
            </div>
            <div class="meta-item">
              <span>主要地区</span>
              <strong>{{ account.region.topRegion?.regionName || "暂无缓存" }}</strong>
            </div>
          </div>

          <p class="cache-note" :class="{ muted: !account.preview.hasCache }">
            {{
              account.preview.hasCache
                ? `预览缓存更新于 ${formatUpdatedAt(account.preview.updatedAt)}`
                : "暂未发现 preview 缓存，激活后通常会自动补齐。"
            }}
          </p>

          <div v-if="account.region.regions.length" class="region-tags">
            <span
              v-for="region in account.region.regions.slice(0, 4)"
              :key="`${account.uid}-${region.regionId}`"
              class="region-tag"
            >
              {{ region.regionName }} {{ region.playCount }}
            </span>
          </div>

          <div class="action-row">
            <button
              class="primary-btn"
              type="button"
              :disabled="account.isCurrent || switchingUid === account.uid"
              @click="switchCurrent(account.index)"
            >
              {{ switchingUid === account.uid ? "切换中..." : "设为当前" }}
            </button>
            <button
              class="danger-btn"
              type="button"
              :disabled="removingUid === account.uid"
              @click="unbindAccount(account)"
            >
              {{ removingUid === account.uid ? "解绑中..." : "解绑" }}
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="tool-grid">
      <article class="panel-card tool-card">
        <div class="panel-head">
          <div>
            <h3>绑定账号</h3>
            <p>粘贴二维码原文，或上传二维码截图识别后加入绑定列表。</p>
          </div>
        </div>

        <textarea
          v-model="bindQrText"
          class="qr-textarea"
          placeholder="在这里粘贴二维码字符串，或先点下方按钮识别截图"
        ></textarea>

        <div class="tool-actions">
          <button class="ghost-btn" type="button" @click="openFilePicker('bind')">
            上传截图识别
          </button>
          <button class="primary-btn" type="button" :disabled="binding" @click="bindAccount">
            {{ binding ? "绑定中..." : "绑定到列表" }}
          </button>
        </div>
        <p class="tool-tip">{{ bindHint }}</p>
        <input
          ref="bindFileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleFileChange($event, 'bind')"
        />
      </article>

      <article class="panel-card tool-card">
        <div class="panel-head">
          <div>
            <h3>二维码激活</h3>
            <p>激活会尝试刷新该 UID 的 cookie，并补齐 preview / region 缓存，同时设为当前账号。</p>
          </div>
        </div>

        <textarea
          v-model="activateQrText"
          class="qr-textarea"
          placeholder="粘贴用于激活的二维码字符串，或上传二维码截图识别"
        ></textarea>

        <div class="tool-actions">
          <button class="ghost-btn" type="button" @click="openFilePicker('activate')">
            上传截图识别
          </button>
          <button class="primary-btn" type="button" :disabled="activating" @click="activateAccount">
            {{ activating ? "激活中..." : "执行激活" }}
          </button>
        </div>
        <p class="tool-tip">{{ activateHint }}</p>
        <input
          ref="activateFileInput"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleFileChange($event, 'activate')"
        />
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { maimaiApi } from "@/api/maimai";
import { useAuthStore } from "@/stores/auth";

type RegionEntry = {
  regionId: string;
  regionName: string;
  playCount: number;
  created?: string;
};

type AccountEntry = {
  uid: number;
  index: number;
  isCurrent: boolean;
  displayName: string;
  preview: {
    userName: string;
    playerRating?: number;
    lastGameId?: number | null;
    lastRomVersion?: string;
    lastDataVersion?: string;
    lastLoginDate?: string | null;
    lastPlayDate?: string | null;
    iconId?: number;
    nameplateId?: number;
    updatedAt?: string;
    hasCache: boolean;
  };
  region: {
    updatedAt?: string;
    totalRegions: number;
    topRegion?: RegionEntry;
    regions: RegionEntry[];
  };
};

type AccountsPayload = {
  qq: number;
  currentUid: number | null;
  switchIndex: number;
  accounts: AccountEntry[];
};

type DecodeTarget = "bind" | "activate";

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmap) => Promise<BarcodeDetectorResult[]>;
};

const authStore = useAuthStore();

const loading = ref(false);
const binding = ref(false);
const activating = ref(false);
const switchingUid = ref<number | null>(null);
const removingUid = ref<number | null>(null);
const error = ref("");

const bindQrText = ref("");
const activateQrText = ref("");
const bindHint = ref("支持直接粘贴二维码字符串，也支持从截图里识别二维码。");
const activateHint = ref("激活后会刷新缓存，并把该 UID 设为当前账号。");

const bindFileInput = ref<HTMLInputElement | null>(null);
const activateFileInput = ref<HTMLInputElement | null>(null);

const accountsPayload = ref<AccountsPayload>({
  qq: 0,
  currentUid: null,
  switchIndex: 0,
  accounts: [],
});

const accounts = computed(() => accountsPayload.value.accounts || []);
const currentAccount = computed(
  () => accounts.value.find((account) => account.isCurrent) || null,
);

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2500,
  showConfirmButton: false,
});

const hydrateAccounts = (payload?: AccountsPayload) => {
  accountsPayload.value = payload || {
    qq: 0,
    currentUid: null,
    switchIndex: 0,
    accounts: [],
  };
};

const getBarcodeDetectorCtor = (): BarcodeDetectorCtor | null => {
  if (typeof window === "undefined") return null;
  const detector = (window as Window & { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  return detector || null;
};

const decodeQrFromFile = async (file: File) => {
  const Detector = getBarcodeDetectorCtor();
  if (!Detector) {
    throw new Error("当前浏览器暂不支持截图识别，请直接粘贴二维码字符串。");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const results = await detector.detect(bitmap);
    const rawValue = results.find((item) => item.rawValue)?.rawValue?.trim();
    if (!rawValue) {
      throw new Error("没有在截图中识别到二维码，请换一张更清晰的图片。");
    }
    return rawValue;
  } finally {
    bitmap.close();
  }
};

const openFilePicker = (target: DecodeTarget) => {
  if (target === "bind") {
    bindFileInput.value?.click();
    return;
  }
  activateFileInput.value?.click();
};

const handleFileChange = async (event: Event, target: DecodeTarget) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const decoded = await decodeQrFromFile(file);
    if (target === "bind") {
      bindQrText.value = decoded;
      bindHint.value = `已从截图识别二维码：${file.name}`;
    } else {
      activateQrText.value = decoded;
      activateHint.value = `已从截图识别二维码：${file.name}`;
    }
    Toast.fire({ icon: "success", title: "二维码识别成功" });
  } catch (decodeError: any) {
    const message = decodeError?.message || "二维码识别失败";
    if (target === "bind") {
      bindHint.value = message;
    } else {
      activateHint.value = message;
    }
    Toast.fire({ icon: "error", title: message });
  } finally {
    input.value = "";
  }
};

const fetchAccounts = async () => {
  loading.value = true;
  error.value = "";

  try {
    const res = await maimaiApi.getAccounts();
    if (res.data?.returnCode === 0) {
      hydrateAccounts(res.data.data as AccountsPayload);
      return;
    }
    error.value = res.data?.message || "读取绑定账号失败";
  } catch (requestError: any) {
    error.value = requestError.response?.data?.detail || "读取绑定账号失败";
  } finally {
    loading.value = false;
  }
};

const bindAccount = async () => {
  if (!bindQrText.value.trim()) {
    Toast.fire({ icon: "warning", title: "请先输入二维码内容" });
    return;
  }

  binding.value = true;
  try {
    const res = await maimaiApi.bindAccount(bindQrText.value.trim());
    if (res.data?.returnCode === 0) {
      hydrateAccounts(res.data.data?.accounts as AccountsPayload);
      bindQrText.value = "";
      bindHint.value = res.data?.message || "绑定成功";
      Toast.fire({ icon: "success", title: res.data?.message || "绑定成功" });
      return;
    }
    Toast.fire({ icon: "error", title: res.data?.message || "绑定失败" });
  } catch (requestError: any) {
    Toast.fire({
      icon: "error",
      title: requestError.response?.data?.detail || "绑定失败",
    });
  } finally {
    binding.value = false;
  }
};

const activateAccount = async () => {
  if (!activateQrText.value.trim()) {
    Toast.fire({ icon: "warning", title: "请先输入二维码内容" });
    return;
  }

  activating.value = true;
  try {
    const res = await maimaiApi.activateAccount(activateQrText.value.trim());
    if (res.data?.returnCode === 0) {
      hydrateAccounts(res.data.data?.accounts as AccountsPayload);
      activateQrText.value = "";
      activateHint.value = res.data?.message || "激活成功";
      Toast.fire({ icon: "success", title: res.data?.message || "激活成功" });
      return;
    }
    Toast.fire({ icon: "error", title: res.data?.message || "激活失败" });
  } catch (requestError: any) {
    Toast.fire({
      icon: "error",
      title: requestError.response?.data?.detail || "激活失败",
    });
  } finally {
    activating.value = false;
  }
};

const switchCurrent = async (index: number) => {
  const target = accounts.value.find((item) => item.index === index);
  if (!target) return;

  switchingUid.value = target.uid;
  try {
    const res = await maimaiApi.switchAccount(index);
    if (res.data?.returnCode === 0) {
      hydrateAccounts(res.data.data as AccountsPayload);
      Toast.fire({ icon: "success", title: res.data?.message || "切换成功" });
      return;
    }
    Toast.fire({ icon: "error", title: res.data?.message || "切换失败" });
  } catch (requestError: any) {
    Toast.fire({
      icon: "error",
      title: requestError.response?.data?.detail || "切换失败",
    });
  } finally {
    switchingUid.value = null;
  }
};

const unbindAccount = async (account: AccountEntry) => {
  const result = await Swal.fire({
    title: "确认解绑？",
    text: `UID ${account.uid} 会从当前 QQ 的绑定列表中移除。`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "确认解绑",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });

  if (!result.isConfirmed) return;

  removingUid.value = account.uid;
  try {
    const res = await maimaiApi.unbindAccount(account.index);
    if (res.data?.returnCode === 0) {
      hydrateAccounts(res.data.data as AccountsPayload);
      Toast.fire({ icon: "success", title: res.data?.message || "解绑成功" });
      return;
    }
    Toast.fire({ icon: "error", title: res.data?.message || "解绑失败" });
  } catch (requestError: any) {
    Toast.fire({
      icon: "error",
      title: requestError.response?.data?.detail || "解绑失败",
    });
  } finally {
    removingUid.value = null;
  }
};

const formatLastPlay = (value?: string | null) => {
  if (!value || value.startsWith("1970-01-01")) return "暂无记录";
  return value;
};

const formatUpdatedAt = (value?: string) => {
  if (!value) return "未知";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  fetchAccounts();
});
</script>

<style scoped>
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 40px 40px;
  min-width: 0;
}

.page-header,
.panel-card,
.summary-card,
.error-banner {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.page-header {
  padding: 28px;
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.15), transparent 18%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
}

.page-kicker {
  display: inline-flex;
  padding: 6px 12px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header h2,
.panel-head h3,
.account-name-row h4 {
  margin: 0;
  color: #0f172a;
}

.subtitle,
.panel-head p,
.summary-card p,
.uid-text,
.cache-note,
.tool-tip {
  color: #64748b;
  line-height: 1.7;
}

.subtitle {
  margin: 8px 0 0;
  max-width: 68ch;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 18px 20px;
}

.summary-card.highlight {
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(239, 246, 255, 0.95));
}

.summary-label {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.55rem;
  color: #0f172a;
}

.error-banner {
  padding: 16px 18px;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.95);
}

.panel-card {
  padding: 24px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel-head p {
  margin: 8px 0 0;
}

.state-box {
  margin-top: 18px;
  min-height: 180px;
  border-radius: 20px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  text-align: center;
  color: #64748b;
  padding: 24px;
}

.state-box.empty {
  min-height: 140px;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid rgba(148, 163, 184, 0.2);
  border-top-color: #fb923c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.account-grid,
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.account-card {
  padding: 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
}

.account-card.current {
  border-color: rgba(249, 115, 22, 0.28);
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.12);
}

.account-top,
.account-name-row,
.tool-actions,
.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.account-name-row {
  justify-content: flex-start;
}

.uid-text {
  margin: 6px 0 0;
  font-size: 0.92rem;
}

.current-badge,
.rating-pill,
.region-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-weight: 800;
}

.current-badge {
  padding: 5px 10px;
  background: rgba(249, 115, 22, 0.14);
  color: #ea580c;
  font-size: 0.78rem;
}

.rating-pill {
  min-width: 70px;
  padding: 10px 12px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
}

.meta-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.meta-item {
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fbff;
}

.meta-item span {
  display: block;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
}

.meta-item strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
}

.cache-note {
  margin: 16px 0 0;
  font-size: 0.9rem;
}

.cache-note.muted {
  color: #94a3b8;
}

.region-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.region-tag {
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.06);
  color: #475569;
  font-size: 0.78rem;
}

.tool-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.qr-textarea {
  min-height: 148px;
  resize: vertical;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fbff;
  color: #0f172a;
  outline: none;
  box-sizing: border-box;
}

.primary-btn,
.ghost-btn,
.danger-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 800;
  cursor: pointer;
}

.primary-btn {
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.2);
}

.ghost-btn {
  background: #f8fbff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.danger-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.primary-btn:disabled,
.ghost-btn:disabled,
.danger-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .summary-card,
[data-theme="dark"] .account-card,
[data-theme="dark"] .meta-item,
[data-theme="dark"] .qr-textarea,
[data-theme="dark"] .ghost-btn,
[data-theme="dark"] .error-banner,
[data-theme="dark"] .state-box {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  color: #e2e8f0;
}

[data-theme="dark"] .page-header {
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 18%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(135deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .page-header h2,
[data-theme="dark"] .panel-head h3,
[data-theme="dark"] .account-name-row h4,
[data-theme="dark"] .summary-card strong,
[data-theme="dark"] .meta-item strong,
[data-theme="dark"] .qr-textarea {
  color: #e2e8f0;
}

[data-theme="dark"] .subtitle,
[data-theme="dark"] .panel-head p,
[data-theme="dark"] .summary-label,
[data-theme="dark"] .summary-card p,
[data-theme="dark"] .uid-text,
[data-theme="dark"] .cache-note,
[data-theme="dark"] .tool-tip,
[data-theme="dark"] .meta-item span {
  color: #94a3b8;
}

[data-theme="dark"] .summary-card.highlight {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.28), rgba(30, 41, 59, 0.96));
}

[data-theme="dark"] .rating-pill {
  background: rgba(29, 78, 216, 0.24);
  color: #93c5fd;
}

[data-theme="dark"] .region-tag {
  background: rgba(30, 41, 59, 0.9);
  color: #cbd5e1;
}

[data-theme="dark"] .danger-btn {
  background: rgba(127, 29, 29, 0.28);
  color: #fca5a5;
}

[data-theme="dark"] .error-banner {
  background: rgba(127, 29, 29, 0.24);
  color: #fca5a5;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .content-area {
    padding: 0 20px 24px;
  }

  .account-grid,
  .tool-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .content-area {
    padding: 0 16px 20px;
  }

  .page-header,
  .panel-card {
    padding: 18px;
    border-radius: 20px;
  }

  .page-header,
  .panel-head,
  .tool-actions,
  .action-row,
  .account-top {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-grid,
  .meta-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .primary-btn,
  .ghost-btn,
  .danger-btn {
    width: 100%;
  }
}
</style>
