<template>
  <main class="test-page">
    <section class="page-header">
      <div>
        <span class="page-kicker">MAIMAI TEST</span>
        <h2>测试</h2>
      </div>
    </section>

    <section class="workspace-grid">
      <article class="panel-card">
        <div class="panel-head">
          <h3>二维码输入</h3>
          <div class="head-actions">
            <button class="ghost-btn compact-btn" type="button" :disabled="busy || !userId.trim()" @click="downloadUserMusic">
              {{ busyAction === "music" ? "拉取中..." : "下载成绩 JSON" }}
            </button>
            <button class="ghost-btn compact-btn" type="button" :disabled="busy || !userId.trim()" @click="downloadNormalizedUserMusic">
              {{ busyAction === "music-normalized" ? "整理中..." : "下载格式化成绩" }}
            </button>
          </div>
        </div>

        <textarea
          v-model="qrcodeText"
          class="qr-textarea"
          placeholder="粘贴二维码字符串"
        ></textarea>

        <div class="action-row">
          <button class="ghost-btn" type="button" :disabled="busy" @click="fileInput?.click()">上传截图</button>
          <button class="primary-btn" type="button" :disabled="busy || !qrcodeText.trim()" @click="scanQrcode">
            {{ busyAction === "scan" ? "解析中..." : "解析二维码" }}
          </button>
        </div>

        <input ref="fileInput" class="hidden-input" type="file" accept="image/*" @change="handleFileChange" />

        <div class="field-grid">
          <label>
            <span>User ID</span>
            <input v-model="userId" type="text" placeholder="解析后自动填入，也可手动输入" />
          </label>
          <label>
            <span>Token</span>
            <input v-model="token" type="text" placeholder="解析后自动填入，可留空" />
          </label>
        </div>

        <div class="action-row stack">
          <button class="primary-btn" type="button" :disabled="busy || !userId.trim()" @click="fetchPreview">
            {{ busyAction === "preview" ? "读取中..." : "查看 Preview" }}
          </button>
          <button class="warn-btn" type="button" :disabled="busy || !userId.trim()" @click="loginAccount">
            {{ busyAction === "login" ? "登录中..." : "登录账号" }}
          </button>
          <button class="danger-btn" type="button" :disabled="busy || !userId.trim()" @click="logoutAccount">
            {{ busyAction === "logout" ? "登出中..." : "登出账号" }}
          </button>
        </div>
      </article>

      <article class="panel-card preview-card">
        <div class="panel-head">
          <h3>账号详情</h3>
        </div>

        <div v-if="previewData" class="preview-summary">
          <img :src="iconUrl" alt="icon" class="preview-icon" @error="handleIconError" />
          <div>
            <strong>{{ previewData.userName || "未命名账号" }}</strong>
            <span>Rating {{ previewData.playerRating ?? "--" }}</span>
            <small>UID {{ userId || "--" }}</small>
          </div>
        </div>

        <div v-else class="empty-state">
          解析二维码后，可以读取并查看账号 preview。
        </div>

        <JsonBlock title="Preview Response" :value="previewResponse" />
      </article>
    </section>

    <section class="panel-card log-panel">
      <div class="panel-head">
        <h3>接口调用记录</h3>
        <button class="ghost-btn compact-btn" type="button" :disabled="!logs.length" @click="clearLogs">
          清理
        </button>
      </div>

      <div v-if="!logs.length" class="empty-state compact">暂无请求记录。</div>
      <div v-else class="log-list">
        <article v-for="log in logs" :key="log.id" class="log-item" :class="{ error: log.error }">
          <button class="log-head" type="button" @click="toggleLog(log.id)">
            <span class="log-title">
              <strong>{{ log.title }}</strong>
              <small>{{ log.time }}</small>
            </span>
            <span class="log-meta">
              <b class="log-status" :class="{ error: log.error }">{{ log.error ? "失败" : "成功" }}</b>
              <i :class="{ open: isLogExpanded(log.id) }">▶</i>
            </span>
          </button>
          <transition name="log-expand">
            <div v-if="isLogExpanded(log.id)" class="log-grid">
              <JsonBlock title="Request" :value="log.request" />
              <JsonBlock title="Response" :value="log.response" />
            </div>
          </transition>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import Swal from "sweetalert2";
import { maimaiApi } from "@/api/maimai";

type BusyAction = "scan" | "preview" | "login" | "logout" | "music" | "music-normalized" | "";

type PreviewPayload = {
  userName?: string;
  playerRating?: number;
  iconId?: number;
  [key: string]: unknown;
};

type BarcodeDetectorResult = {
  rawValue?: string;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => {
  detect: (source: ImageBitmap) => Promise<BarcodeDetectorResult[]>;
};

type RequestLog = {
  id: number;
  title: string;
  time: string;
  request: unknown;
  response: unknown;
  error: boolean;
};

type UserMusicDetail = {
  musicId?: number;
  level?: number;
  playCount?: number;
  achievement?: number;
  comboStatus?: number;
  syncStatus?: number;
  deluxscoreMax?: number;
};

type UserMusicGroup = {
  userMusicDetailList?: UserMusicDetail[];
  length?: number;
};

const JsonBlock = defineComponent({
  name: "JsonBlock",
  props: {
    title: { type: String, required: true },
    value: { type: null, required: false },
  },
  setup(props) {
    return () =>
      h("div", { class: "json-block" }, [
        h("span", props.title),
        h("pre", JSON.stringify(props.value ?? null, null, 2)),
      ]);
  },
});

const qrcodeText = ref("");
const userId = ref("");
const token = ref("");
const busyAction = ref<BusyAction>("");
const logs = ref<RequestLog[]>([]);
const expandedLogIds = ref(new Set<number>());
const previewResponse = ref<unknown>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2200,
  showConfirmButton: false,
  background: "var(--surface-color)",
  color: "var(--text-main)",
});

const busy = computed(() => !!busyAction.value);
const previewData = computed<PreviewPayload | null>(() => {
  const payload = previewResponse.value as { data?: { data?: PreviewPayload } } | null;
  return payload?.data?.data || null;
});

const formatAssetId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "000000";
  return String(value).slice(-6).padStart(6, "0");
};

const iconUrl = computed(() =>
  `https://assets.breakdx.net/maimai/icon/UI_Icon_${formatAssetId(previewData.value?.iconId as number | undefined)}.png`,
);

const addLog = (title: string, request: unknown, response: unknown, error = false) => {
  const id = Date.now() + Math.random();
  logs.value.unshift({
    id,
    title,
    time: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    request,
    response,
    error,
  });
  expandedLogIds.value = new Set([id]);
};

const isLogExpanded = (id: number) => expandedLogIds.value.has(id);

const toggleLog = (id: number) => {
  const nextIds = new Set(expandedLogIds.value);
  if (nextIds.has(id)) {
    nextIds.delete(id);
  } else {
    nextIds.add(id);
  }
  expandedLogIds.value = nextIds;
};

const getErrorPayload = (error: unknown) => {
  const shaped = error as { response?: { data?: unknown; status?: number }; message?: string };
  return shaped.response?.data || { message: shaped.message || "请求失败", status: shaped.response?.status };
};

const runAction = async (action: BusyAction, title: string, request: unknown, task: () => Promise<unknown>) => {
  busyAction.value = action;
  try {
    const response = await task();
    addLog(title, request, response, false);
    return response;
  } catch (error) {
    const payload = getErrorPayload(error);
    addLog(title, request, payload, true);
    Toast.fire({ icon: "error", title: `${title}失败` });
    return null;
  } finally {
    busyAction.value = "";
  }
};

const downloadJson = (payload: unknown, filename: string) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadUserMusic = async () => {
  const request = { userId: Number(userId.value) };
  const response = await runAction("music", "User Music", request, () => maimaiApi.getUserMusic(userId.value.trim()));
  if (!response) return;
  downloadJson(response, `maimai_usermusic_${userId.value.trim()}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  Toast.fire({ icon: "success", title: "成绩 JSON 已生成" });
};

const extractUserMusicPayload = (payload: unknown) => {
  const root = payload as {
    data?: {
      data?: {
        data?: { userId?: number; userMusicList?: UserMusicGroup[]; length?: number; nextIndex?: number };
        userId?: number;
        userMusicList?: UserMusicGroup[];
        length?: number;
        nextIndex?: number;
      };
      userId?: number;
      userMusicList?: UserMusicGroup[];
      length?: number;
      nextIndex?: number;
    };
    userId?: number;
    userMusicList?: UserMusicGroup[];
    length?: number;
    nextIndex?: number;
  };
  return root.data?.data?.data || root.data?.data || root.data || root;
};

const normalizeUserMusicPayload = (payload: unknown) => {
  const data = extractUserMusicPayload(payload);
  const uid = Number(data.userId || userId.value);
  const formatAchievementPercent = (rawValue: number) => {
    const raw = Number(rawValue || 0);
    const percent = raw > 1010 ? raw / 10000 : raw / 10;
    return percent.toFixed(4);
  };
  const scoreDocs = (data.userMusicList || [])
    .flatMap((group) => group.userMusicDetailList || [])
    .filter((detail) => detail.musicId !== undefined && detail.level !== undefined)
    .map((detail) => ({
      uid,
      musicId: Number(detail.musicId),
      level: Number(detail.level),
      playCount: Number(detail.playCount || 0),
      achievement: Number(detail.achievement || 0),
      achievementPercent: formatAchievementPercent(Number(detail.achievement || 0)),
      comboStatus: Number(detail.comboStatus || 0),
      syncStatus: Number(detail.syncStatus || 0),
      dxScore: Number(detail.deluxscoreMax || 0),
      scoreKey: `${uid}:${Number(detail.musicId)}:${Number(detail.level)}`,
    }))
    .sort((left, right) => left.musicId - right.musicId || left.level - right.level);

  const songMap = new Map<number, typeof scoreDocs>();
  scoreDocs.forEach((score) => {
    const list = songMap.get(score.musicId) || [];
    list.push(score);
    songMap.set(score.musicId, list);
  });

  const songDocs = Array.from(songMap.entries()).map(([musicId, scores]) => ({
    uid,
    musicId,
    levels: scores.map(({ level, playCount, achievement, achievementPercent, comboStatus, syncStatus, dxScore }) => ({
      level,
      playCount,
      achievement,
      achievementPercent,
      comboStatus,
      syncStatus,
      dxScore,
    })),
  }));

  return {
    uid,
    source: "GetUserMusic",
    declaredSongCount: Number(data.length || 0),
    nextIndex: Number(data.nextIndex || 0),
    totalSongs: songDocs.length,
    totalScores: scoreDocs.length,
    scoreDocs,
    songDocs,
  };
};

const downloadNormalizedUserMusic = async () => {
  const request = { userId: Number(userId.value), format: "normalized" };
  const response = await runAction("music-normalized", "User Music Normalized", request, () =>
    maimaiApi.getUserMusic(userId.value.trim()),
  );
  if (!response) return;
  const normalized = normalizeUserMusicPayload(response);
  downloadJson(normalized, `maimai_scores_normalized_${userId.value.trim()}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  Toast.fire({ icon: "success", title: "格式化成绩 JSON 已生成" });
};

const scanQrcode = async () => {
  const qrcode = qrcodeText.value.trim();
  const request = { qrcode };
  const response = await runAction("scan", "Scan QR", request, () => maimaiApi.scanQrcode(qrcode));
  const scanResult = (response as { data?: { result?: { userID?: number | string; token?: string } } } | null)?.data?.result;
  if (!scanResult?.userID) return;
  userId.value = String(scanResult.userID);
  token.value = String(scanResult.token || "");
  await fetchPreview();
};

const fetchPreview = async () => {
  const request = { userId: Number(userId.value), token: token.value.trim() || undefined };
  const response = await runAction("preview", "User Preview", request, () =>
    maimaiApi.getUserPreview(userId.value.trim(), token.value.trim() || undefined),
  );
  if (response) {
    previewResponse.value = response;
  }
};

const loginAccount = async () => {
  const request = { userId: Number(userId.value), token: token.value.trim() || undefined };
  await runAction("login", "User Login", request, () =>
    maimaiApi.loginUser(userId.value.trim(), token.value.trim() || undefined),
  );
};

const logoutAccount = async () => {
  const request = { userId: Number(userId.value) };
  await runAction("logout", "User Logout", request, () => maimaiApi.logoutUser(userId.value.trim()));
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
    qrcodeText.value = await decodeQrFromFile(file);
    Toast.fire({ icon: "success", title: "二维码识别成功" });
  } catch (error) {
    Toast.fire({ icon: "error", title: (error as Error).message || "二维码识别失败" });
  } finally {
    input.value = "";
  }
};

const clearLogs = () => {
  logs.value = [];
  expandedLogIds.value = new Set();
  previewResponse.value = null;
};

const handleIconError = (event: Event) => {
  (event.target as HTMLImageElement).src = "https://placehold.co/90x90/f2fbff/f97316?text=Icon";
};
</script>

<style scoped>
.test-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
  padding: 0 40px 40px;
}

.page-header,
.panel-card {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.07);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 20%),
    radial-gradient(circle at left center, rgba(20, 184, 166, 0.14), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.page-header h2,
.panel-head h3 {
  margin: 0;
  color: #0f172a;
}

.page-header h2 {
  font-size: 2.35rem;
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
  gap: 18px;
}

.panel-card {
  padding: 24px;
  min-width: 0;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.qr-textarea,
.field-grid input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #f8fbff;
  color: #0f172a;
  font: inherit;
}

.qr-textarea {
  min-height: 160px;
  resize: vertical;
  padding: 14px;
}

.field-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.field-grid label {
  display: grid;
  gap: 6px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
}

.field-grid input {
  min-height: 42px;
  padding: 0 12px;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.action-row.stack {
  flex-wrap: wrap;
}

.action-row.stack button {
  flex: 1 1 160px;
}

.primary-btn,
.ghost-btn,
.warn-btn,
.danger-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 900;
  cursor: pointer;
}

.compact-btn {
  min-height: 36px;
  padding: 8px 14px;
}

.primary-btn {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: #fff;
}

.ghost-btn {
  background: #f8fbff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.warn-btn {
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.preview-summary {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  background: #f8fbff;
  margin-bottom: 16px;
}

.preview-icon {
  width: 78px;
  height: 78px;
  object-fit: contain;
}

.preview-summary strong,
.preview-summary span,
.preview-summary small {
  display: block;
}

.preview-summary strong {
  color: #0f172a;
  font-size: 1.25rem;
}

.preview-summary span {
  margin-top: 6px;
  color: #0f766e;
  font-weight: 900;
}

.preview-summary small {
  margin-top: 4px;
  color: #64748b;
}

.empty-state {
  display: grid;
  place-items: center;
  min-height: 120px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  color: #64748b;
  text-align: center;
  padding: 20px;
}

.empty-state.compact {
  min-height: 76px;
}

.log-list {
  display: grid;
  gap: 14px;
}

.log-item {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: #f8fbff;
  overflow: hidden;
}

.log-item.error {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(254, 242, 242, 0.82);
}

.log-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  padding: 14px;
  background: transparent;
  color: #0f172a;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.log-title {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.log-title strong,
.log-title small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-title small {
  color: #64748b;
  font-size: 0.86rem;
}

.log-meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.log-status {
  min-width: 42px;
  border-radius: 999px;
  padding: 5px 9px;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  font-size: 0.78rem;
  text-align: center;
}

.log-status.error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.log-meta i {
  color: #94a3b8;
  font-style: normal;
  transition: transform 0.2s ease;
}

.log-meta i.open {
  transform: rotate(90deg);
}

.log-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0 14px 14px;
}

.log-expand-enter-active,
.log-expand-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.log-expand-enter-from,
.log-expand-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.json-block {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.json-block span {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 900;
}

.json-block pre {
  min-height: 96px;
  max-height: 460px;
  overflow: auto;
  margin: 0;
  border-radius: 14px;
  padding: 12px;
  background: #0f172a;
  color: #d1fae5;
  font-size: 0.82rem;
  line-height: 1.55;
}

.hidden-input {
  display: none;
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .qr-textarea,
[data-theme="dark"] .field-grid input,
[data-theme="dark"] .preview-summary,
[data-theme="dark"] .log-item,
[data-theme="dark"] .log-head,
[data-theme="dark"] .ghost-btn {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  color: #e2e8f0;
}

[data-theme="dark"] .page-header h2,
[data-theme="dark"] .panel-head h3,
[data-theme="dark"] .preview-summary strong,
[data-theme="dark"] .log-head,
[data-theme="dark"] .log-title strong,
[data-theme="dark"] .qr-textarea,
[data-theme="dark"] .field-grid input {
  color: #e2e8f0;
}

[data-theme="dark"] .empty-state,
[data-theme="dark"] .field-grid label,
[data-theme="dark"] .preview-summary small,
[data-theme="dark"] .log-title small,
[data-theme="dark"] .json-block span {
  color: #94a3b8;
}

@media (max-width: 1040px) {
  .test-page {
    padding: 0 24px 32px;
  }

  .workspace-grid,
  .log-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .test-page {
    padding: 0 14px 24px;
  }

  .page-header {
    flex-direction: column;
    padding: 24px;
  }

  .panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .head-actions {
    justify-content: stretch;
  }

  .head-actions button {
    flex: 1 1 0;
  }

  .page-header h2 {
    font-size: 2rem;
  }

  .panel-card {
    padding: 20px;
  }

  .action-row {
    flex-direction: column;
  }
}
</style>
