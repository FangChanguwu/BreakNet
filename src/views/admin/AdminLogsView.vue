<template>
  <main class="content-area">
    <div class="page-header">
      <div>
        <h2>用户日志</h2>
        <p class="subtitle">查看签到、登入登出、发票和物品解锁操作记录。</p>
      </div>
      <button class="refresh-btn" type="button" :disabled="loading" @click="fetchLogs(1)">
        {{ loading ? "刷新中" : "刷新" }}
      </button>
    </div>

    <section class="admin-section">
      <div class="filter-panel">
        <label>
          <span>日志分类</span>
          <select v-model="filters.category">
            <option value="">全部</option>
            <option value="sign">用户签到日志</option>
            <option value="auth">用户登入/登出日志</option>
            <option value="ticket">发票日志</option>
            <option value="unlock">物品解锁日志</option>
          </select>
        </label>

        <label>
          <span>操作类型</span>
          <input v-model.trim="filters.action" type="text" placeholder="login / logout / issue / unlock" />
        </label>

        <label>
          <span>用户</span>
          <input v-model.trim="filters.user" type="text" placeholder="QQ / 用户名 / 昵称" />
        </label>

        <label>
          <span>被操作 UserID</span>
          <input v-model.trim="filters.targetUserId" type="text" placeholder="maimai userId" />
        </label>

        <label>
          <span>账号名字</span>
          <input v-model.trim="filters.accountName" type="text" placeholder="maimai 账号名" />
        </label>

        <label>
          <span>关键词</span>
          <input v-model.trim="filters.search" type="text" placeholder="搜索日志内容" @keyup.enter="applyFilters" />
        </label>

        <label>
          <span>开始时间</span>
          <input v-model="filters.startTime" type="datetime-local" />
        </label>

        <label>
          <span>结束时间</span>
          <input v-model="filters.endTime" type="datetime-local" />
        </label>
      </div>

      <div class="toolbar">
        <div class="summary-text">
          共 {{ totalLogs }} 条，当前第 {{ currentPage }} / {{ totalPages }} 页，每页 {{ PAGE_SIZE }} 条
        </div>
        <div class="action-row">
          <button class="search-btn" type="button" @click="applyFilters">筛选</button>
          <button class="reset-btn" type="button" @click="resetFilters">重置</button>
        </div>
      </div>

      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>正在读取日志...</p>
      </div>

      <div v-else-if="!logs.length" class="state-box empty">
        <p>没有符合条件的日志。</p>
      </div>

      <div v-else class="log-list">
        <article v-for="log in logs" :key="log.id || log._id" class="log-card">
          <div class="log-main">
            <img
              v-if="getAvatar(log)"
              class="avatar"
              :src="getAvatar(log)"
              alt="avatar"
              @error="markAvatarFailed(log)"
            />
            <span v-else class="avatar avatar-fallback">{{ getUserInitial(log) }}</span>
            <div class="log-copy">
              <div class="log-title-row">
                <strong>{{ getUserName(log) }}</strong>
                <span class="category-badge" :class="log.category">{{ getCategoryLabel(log.category) }}</span>
              </div>
              <p>
                <span>{{ getActionLabel(log) }}</span>
                <template v-if="log.targetUserId"> · UserID {{ log.targetUserId }}</template>
                <template v-if="log.accountName"> · {{ log.accountName }}</template>
              </p>
            </div>
          </div>

          <div class="log-side">
            <time>{{ formatTime(log.createdAt || log.time) }}</time>
            <button
              v-if="hasUserAll(log)"
              class="detail-btn userall-btn"
              type="button"
              @click="openUserAll(log)"
            >
              查看 UserAll
            </button>
            <button
              v-if="hasDetail(log)"
              class="detail-btn"
              type="button"
              @click="openDetail(log)"
            >
              数据详情
            </button>
          </div>
        </article>
      </div>

      <div class="pagination-bar">
        <button class="page-btn" :disabled="currentPage <= 1 || loading" @click="goToPage(currentPage - 1)">
          上一页
        </button>
        <div class="page-jump">
          <span>跳转到</span>
          <input
            v-model.number="pageInput"
            type="number"
            min="1"
            :max="totalPages"
            @keyup.enter="jumpToPage"
          />
          <span>页</span>
          <button class="page-btn" :disabled="loading" @click="jumpToPage">前往</button>
        </div>
        <button class="page-btn" :disabled="currentPage >= totalPages || loading" @click="goToPage(currentPage + 1)">
          下一页
        </button>
      </div>
    </section>

    <transition name="fade">
      <div v-if="detailLog" class="modal-overlay" @click="detailLog = null">
        <div class="detail-modal" @click.stop>
          <button class="modal-close" type="button" @click="detailLog = null">×</button>
          <h3>日志数据详情</h3>
          <p>{{ getUserName(detailLog) }} · {{ getActionLabel(detailLog) }}</p>
          <div class="json-grid">
            <JsonBlock title="发送数据" :value="detailLog.requestData || detailLog.payload" />
            <JsonBlock title="返回数据" :value="detailLog.responseData || detailLog.result" />
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="userAllLog" class="modal-overlay" @click="userAllLog = null">
        <div class="detail-modal userall-modal" @click.stop>
          <button class="modal-close" type="button" @click="userAllLog = null">×</button>
          <div class="modal-head">
            <h3>完整 UserAll</h3>
            <button class="download-btn" type="button" @click="downloadUserAll(userAllLog)">
              下载 JSON
            </button>
          </div>
          <p>{{ getUserName(userAllLog) }} · {{ getActionLabel(userAllLog) }}</p>
          <JsonBlock title="UserAll Payload" :value="getUserAllPayload(userAllLog)" />
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import http from "@/utils/http";

type LogCategory = "sign" | "auth" | "ticket" | "unlock" | string;

type UserLogEntry = {
  _id?: string;
  id?: string;
  category: LogCategory;
  action?: string;
  qq?: number | string;
  username?: string;
  nickname?: string;
  userName?: string;
  actor?: {
    qq?: number | string;
    username?: string;
    nickname?: string;
  };
  targetUserId?: number | string;
  accountName?: string;
  createdAt?: string;
  time?: string;
  requestData?: unknown;
  responseData?: unknown;
  payload?: unknown;
  result?: unknown;
  userall?: unknown;
  userAll?: unknown;
  avatarFailed?: boolean;
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

const router = useRouter();
const PAGE_SIZE = 50;

const logs = ref<UserLogEntry[]>([]);
const loading = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const totalLogs = ref(0);
const pageInput = ref(1);
const detailLog = ref<UserLogEntry | null>(null);
const userAllLog = ref<UserLogEntry | null>(null);

const filters = reactive({
  category: "",
  action: "",
  user: "",
  targetUserId: "",
  accountName: "",
  search: "",
  startTime: "",
  endTime: "",
});

const categoryLabels: Record<string, string> = {
  sign: "签到",
  auth: "登入/登出",
  ticket: "发票",
  unlock: "物品解锁",
};

const actionLabels: Record<string, string> = {
  sign: "执行签到",
  login: "登录账号",
  logout: "退出登录",
  ticket_issue: "发放跑图券",
  issue_ticket: "发放跑图券",
  unlock_apply: "执行物品解锁",
  apply_unlock: "执行物品解锁",
};

const getApiParams = (page: number) => {
  const params: Record<string, string | number> = {
    page,
    limit: PAGE_SIZE,
  };

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params[key] = value;
  });
  return params;
};

const fetchLogs = async (page = currentPage.value) => {
  loading.value = true;
  try {
    const res = await http.get("/admin/logs", { params: getApiParams(page) });
    if (res.data?.ok) {
      const data = res.data.data || {};
      logs.value = data.list || data.logs || [];
      totalLogs.value = data.total || 0;
      totalPages.value = data.total_pages || data.totalPages || 1;
      currentPage.value = data.page || page;
      pageInput.value = currentPage.value;
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      router.push("/panel");
    }
  } finally {
    loading.value = false;
  }
};

const applyFilters = () => {
  currentPage.value = 1;
  pageInput.value = 1;
  void fetchLogs(1);
};

const resetFilters = () => {
  filters.category = "";
  filters.action = "";
  filters.user = "";
  filters.targetUserId = "";
  filters.accountName = "";
  filters.search = "";
  filters.startTime = "";
  filters.endTime = "";
  applyFilters();
};

const goToPage = (page: number) => {
  const targetPage = Math.min(Math.max(page, 1), totalPages.value);
  void fetchLogs(targetPage);
};

const jumpToPage = () => {
  goToPage(pageInput.value || 1);
};

const getActorQq = (log: UserLogEntry) => log.actor?.qq || log.qq || "";

const getAvatar = (log: UserLogEntry) => {
  const qq = getActorQq(log);
  if (!qq || log.avatarFailed) return "";
  return `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=100`;
};

const markAvatarFailed = (log: UserLogEntry) => {
  log.avatarFailed = true;
};

const getUserInitial = (log: UserLogEntry) => getUserName(log).slice(0, 1).toUpperCase() || "U";

const getUserName = (log: UserLogEntry) =>
  log.actor?.nickname ||
  log.nickname ||
  log.userName ||
  log.actor?.username ||
  log.username ||
  String(getActorQq(log) || "未知用户");

const getCategoryLabel = (category: string) => categoryLabels[category] || category || "日志";

const getActionLabel = (log: UserLogEntry) => actionLabels[log.action || ""] || log.action || getCategoryLabel(log.category);

const normalizeLogTimeValue = (value: string) => {
  const trimmed = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  // 用户日志后端按 UTC 入库；Mongo/PyMongo 默认读出时可能丢失 tzinfo。
  // 这里把无时区的 ISO 字符串按 UTC 处理，避免浏览器误当成本地时间。
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed) && !hasTimezone) {
    return `${trimmed}Z`;
  }
  return trimmed;
};

const formatTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(normalizeLogTimeValue(value));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

const hasDetail = (log: UserLogEntry) =>
  Boolean(log.requestData || log.responseData || log.payload || log.result);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getNestedField = (payload: unknown, keys: string[]): unknown => {
  if (!isRecord(payload)) return null;
  for (const key of keys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      return payload[key];
    }
  }
  return null;
};

const getDeepField = (payload: unknown, keys: string[]): unknown => {
  if (!isRecord(payload)) return null;
  for (const key of keys) {
    const direct = payload[key];
    if (direct !== undefined && direct !== null) return direct;
  }
  for (const value of Object.values(payload)) {
    const nested = getDeepField(value, keys);
    if (nested !== null && nested !== undefined) return nested;
  }
  return null;
};

const getUserAllPayload = (log: UserLogEntry) =>
  log.userall ||
  log.userAll ||
  getNestedField(log.requestData, ["userall", "userAll", "upsertUserAll"]) ||
  getNestedField(log.payload, ["userall", "userAll", "upsertUserAll"]) ||
  null;

const hasUserAll = (log: UserLogEntry) => Boolean(getUserAllPayload(log));

const sanitizeFilenamePart = (value: string) =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_") || "unknown";

const getUserAllUid = (log: UserLogEntry) =>
  String(
    log.targetUserId ||
      getDeepField(getUserAllPayload(log), ["userId", "userID", "uid"]) ||
      getDeepField(log.responseData, ["uid", "userId", "userID"]) ||
      "unknown",
  );

const getUserAllFileTime = (log: UserLogEntry) => {
  const source = log.createdAt || log.time || new Date().toISOString();
  const date = new Date(normalizeLogTimeValue(source));
  const value = Number.isNaN(date.getTime()) ? source : date.toISOString();
  return sanitizeFilenamePart(value.replace(/\.\d{3}Z$/, "Z"));
};

const downloadUserAll = (log: UserLogEntry) => {
  const payload = getUserAllPayload(log);
  const content = JSON.stringify(payload ?? null, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `userall_${sanitizeFilenamePart(getUserAllUid(log))}_${getUserAllFileTime(log)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const openDetail = (log: UserLogEntry) => {
  detailLog.value = log;
};

const openUserAll = (log: UserLogEntry) => {
  userAllLog.value = log;
};

onMounted(() => {
  void fetchLogs(1);
});
</script>

<style scoped>
.content-area {
  flex: 1;
  padding: 0 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  padding: 28px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  background: var(--surface-color);
  box-shadow: 0 12px 30px var(--shadow-color);
}

.page-header h2 {
  margin: 0 0 8px;
  color: var(--text-main);
  font-size: 1.8rem;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
}

.admin-section {
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 22px;
  background: var(--surface-color);
  box-shadow: 0 10px 28px var(--shadow-color);
}

.filter-panel {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.filter-panel label {
  display: grid;
  gap: 7px;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 800;
}

.filter-panel input,
.filter-panel select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--bg-color);
  color: var(--text-main);
  font: inherit;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin: 18px 0;
}

.action-row {
  display: flex;
  gap: 10px;
}

.summary-text {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.search-btn,
.reset-btn,
.refresh-btn,
.page-btn,
.detail-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 16px;
  font-weight: 800;
  cursor: pointer;
}

.search-btn,
.refresh-btn {
  background: var(--primary-color);
  color: #fff;
}

.reset-btn,
.page-btn,
.detail-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-secondary);
}

.userall-btn {
  border-color: rgba(236, 72, 153, 0.28);
  background: rgba(236, 72, 153, 0.1);
  color: #be185d;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.log-list {
  display: grid;
  gap: 12px;
}

.log-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 14px 16px;
  background: var(--bg-color);
}

.log-main {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.16), rgba(59, 130, 246, 0.14));
  color: #f97316;
  font-size: 1rem;
  font-weight: 900;
}

.log-copy {
  min-width: 0;
}

.log-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.log-title-row strong {
  overflow: hidden;
  color: var(--text-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-copy p {
  margin: 5px 0 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.category-badge {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  font-size: 0.74rem;
  font-weight: 900;
}

.category-badge.sign {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.category-badge.auth {
  background: rgba(168, 85, 247, 0.12);
  color: #7e22ce;
}

.category-badge.ticket {
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
}

.category-badge.unlock {
  background: rgba(236, 72, 153, 0.12);
  color: #be185d;
}

.log-side {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
}

.log-side time {
  color: var(--text-muted);
  font-size: 0.86rem;
  white-space: nowrap;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 18px;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.page-jump input {
  width: 80px;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 9px 10px;
  background: var(--bg-color);
  color: var(--text-main);
}

.state-box {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: var(--text-muted);
  text-align: center;
}

.state-box.empty {
  min-height: 140px;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 140;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(5px);
}

.detail-modal {
  position: relative;
  width: min(980px, 100%);
  max-height: min(760px, 92vh);
  overflow: auto;
  border-radius: 22px;
  padding: 26px;
  background: var(--surface-color);
  color: var(--text-main);
}

.userall-modal {
  width: min(1180px, 100%);
}

.userall-modal .json-block pre {
  min-height: 420px;
  max-height: 68vh;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-right: 36px;
}

.modal-head h3 {
  margin: 0;
}

.download-btn {
  border: 0;
  border-radius: 10px;
  padding: 9px 14px;
  background: var(--primary-color);
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: var(--bg-color);
  color: var(--text-secondary);
  cursor: pointer;
}

.json-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.json-block {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.json-block span {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 900;
}

.json-block pre {
  min-height: 180px;
  max-height: 520px;
  overflow: auto;
  margin: 0;
  border-radius: 14px;
  padding: 12px;
  background: #0f172a;
  color: #d1fae5;
  font-size: 0.82rem;
  line-height: 1.55;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1100px) {
  .filter-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .content-area {
    padding: 0 14px 24px;
  }

  .page-header,
  .toolbar,
  .log-card,
  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-panel,
  .json-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .log-side {
    justify-content: space-between;
  }
}
</style>
