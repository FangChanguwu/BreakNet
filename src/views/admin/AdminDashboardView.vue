<template>
  <main class="content-area">
        <section class="page-header">
          <div>
            <h2>运行状态仪表盘</h2>
            <p class="subtitle">更稳的轮询节奏、离页暂停拉取，以及更清晰的实时状态概览。</p>
          </div>

          <div class="header-actions">
            <span :class="['status-pill', dashboardStatusClass]">
              {{ dashboardStatusText }}
            </span>
            <button class="refresh-btn" :disabled="isRefreshing" @click="refreshNow">
              {{ isRefreshing ? "刷新中..." : "立即刷新" }}
            </button>
          </div>
        </section>

        <div v-if="isInitialLoading" class="loading-state">
          <div class="spinner"></div>
          <p>正在拉取运行状态...</p>
        </div>

        <div v-else-if="dashboardData" class="admin-dashboard">
          <section class="overview-grid">
            <article class="hero-card">
              <div class="eyebrow">最近采样</div>
              <div class="hero-value">{{ sampledAtLabel }}</div>
              <p class="hero-desc">
                当前页面每 {{ pollingIntervalSeconds }} 秒轮询一次，页面隐藏时自动暂停，避免无效请求。
              </p>
              <div class="hero-meta">
                <span>请求总量 {{ dashboardData.network.total_api_req }}</span>
                <span>活跃连接 {{ dashboardData.network.nginx_active_conn }}</span>
              </div>
            </article>

            <article class="metric-card cpu">
              <div class="metric-label">CPU 负载</div>
              <div class="metric-value">{{ formatPercent(dashboardData.server.cpu_percent) }}</div>
              <div class="metric-desc">{{ cpuHealthText }}</div>
            </article>

            <article class="metric-card memory">
              <div class="metric-label">内存占用</div>
              <div class="metric-value">{{ formatPercent(dashboardData.server.ram_percent) }}</div>
              <div class="metric-desc">
                {{ dashboardData.server.ram_used_mb }} / {{ dashboardData.server.ram_total_mb }} MB
              </div>
            </article>

            <article class="metric-card qps">
              <div class="metric-label">接口 QPS</div>
              <div class="metric-value">{{ dashboardData.network.api_qps }}</div>
              <div class="metric-desc">{{ qpsHealthText }}</div>
            </article>

            <article class="metric-card users">
              <div class="metric-label">注册用户</div>
              <div class="metric-value">{{ dashboardData.business.total_users }}</div>
              <div class="metric-desc">今日签到 {{ dashboardData.business.today_signs }}</div>
            </article>
          </section>

          <section class="panel-grid">
            <article class="panel-card chart-panel">
              <div class="panel-head">
                <div>
                  <div class="panel-title">CPU 趋势</div>
                  <div class="panel-subtitle">近 {{ MAX_POINTS }} 次采样的处理器负载</div>
                </div>
                <span class="panel-tag">{{ latestCpuLabel }}</span>
              </div>
              <apexchart type="area" height="300" :options="cpuChartOptions" :series="cpuSeries" />
            </article>

            <article class="panel-card chart-panel" :class="{ danger: dashboardData.network.api_qps >= 50 }">
              <div class="panel-head">
                <div>
                  <div class="panel-title">QPS 趋势</div>
                  <div class="panel-subtitle">近 {{ MAX_POINTS }} 次采样的接口压力</div>
                </div>
                <span class="panel-tag">{{ latestQpsLabel }}</span>
              </div>
              <apexchart type="area" height="300" :options="qpsChartOptions" :series="qpsSeries" />
            </article>
          </section>

          <section class="detail-grid">
            <article class="detail-card">
              <div class="detail-title">网络概览</div>
              <div class="detail-row">
                <span>Nginx 活跃连接</span>
                <strong>{{ dashboardData.network.nginx_active_conn }}</strong>
              </div>
              <div class="detail-row">
                <span>Nginx 总请求</span>
                <strong>{{ dashboardData.network.nginx_total_req }}</strong>
              </div>
              <div class="detail-row">
                <span>接口总请求</span>
                <strong>{{ dashboardData.network.total_api_req }}</strong>
              </div>
            </article>

            <article class="detail-card">
              <div class="detail-title">业务概览</div>
              <div class="detail-row">
                <span>总站注册用户</span>
                <strong>{{ dashboardData.business.total_users }}</strong>
              </div>
              <div class="detail-row">
                <span>今日签到人数</span>
                <strong>{{ dashboardData.business.today_signs }}</strong>
              </div>
              <div class="detail-row">
                <span>轮询状态</span>
                <strong>{{ dashboardStatusText }}</strong>
              </div>
            </article>
          </section>

          <p v-if="lastError" class="error-banner">
            最近一次刷新失败：{{ lastError }}
          </p>
        </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useDocumentVisibility } from "@vueuse/core";
import { useRouter } from "vue-router";
import type { ApexOptions } from "apexcharts";
import http from "@/utils/http";

type DashboardResponse = {
  server: {
    cpu_percent: number;
    ram_percent: number;
    ram_used_mb: number;
    ram_total_mb: number;
  };
  network: {
    api_qps: number;
    total_api_req: number;
    nginx_active_conn: number;
    nginx_total_req: number;
  };
  business: {
    total_users: number;
    today_signs: number;
  };
  sampled_at?: string;
  cache_ttl_seconds?: number;
};

const router = useRouter();
const visibility = useDocumentVisibility();

const isInitialLoading = ref(true);
const isRefreshing = ref(false);
const dashboardData = ref<DashboardResponse | null>(null);
const lastError = ref("");
const lastUpdatedAt = ref<string>("");
const pollingTimer = ref<number | null>(null);
const isDarkTheme = ref(false);
const isViewActive = ref(false);
let themeObserver: MutationObserver | null = null;

const MAX_POINTS = 24;
const POLLING_INTERVAL_MS = 3000;
const RETRY_INTERVAL_MS = 6000;

const timeLabels = ref<string[]>([]);
const cpuData = ref<number[]>([]);
const qpsData = ref<number[]>([]);

const pollingIntervalSeconds = Math.round(POLLING_INTERVAL_MS / 1000);

const dashboardStatusText = computed(() => {
  if (isRefreshing.value) return "同步中";
  if (visibility.value !== "visible") return "后台暂停";
  if (lastError.value) return "最近有失败";
  return "正常轮询";
});

const dashboardStatusClass = computed(() => {
  if (isRefreshing.value) return "syncing";
  if (visibility.value !== "visible") return "paused";
  if (lastError.value) return "error";
  return "healthy";
});

const sampledAtLabel = computed(() => {
  const value = dashboardData.value?.sampled_at || lastUpdatedAt.value;
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});

const latestCpuLabel = computed(() => {
  const value = cpuData.value[cpuData.value.length - 1];
  return value === undefined ? "--" : `${value.toFixed(1)}%`;
});

const latestQpsLabel = computed(() => {
  const value = qpsData.value[qpsData.value.length - 1];
  return value === undefined ? "--" : `${value.toFixed(1)} QPS`;
});

const cpuHealthText = computed(() => {
  const cpu = dashboardData.value?.server.cpu_percent ?? 0;
  if (cpu >= 85) return "负载偏高，建议关注任务堆积";
  if (cpu >= 60) return "负载中等，处于可接受区间";
  return "负载平稳";
});

const qpsHealthText = computed(() => {
  const qps = dashboardData.value?.network.api_qps ?? 0;
  if (qps >= 50) return "接口压力较高";
  if (qps >= 20) return "接口有明显流量";
  return "接口压力较低";
});

const cpuSeries = computed(() => [{ name: "CPU", data: cpuData.value }]);
const qpsSeries = computed(() => [{ name: "QPS", data: qpsData.value }]);

const syncThemeMode = () => {
  const rootTheme = document.documentElement.getAttribute("data-theme");
  const bodyTheme = document.body.getAttribute("data-theme");
  isDarkTheme.value = rootTheme === "dark" || bodyTheme === "dark";
};

const commonChartOptions = computed<ApexOptions>(() => ({
  chart: {
    animations: { enabled: true, speed: 350 },
    toolbar: { show: false },
    background: "transparent",
    zoom: { enabled: false },
    foreColor: isDarkTheme.value ? "#94a3b8" : "#6b7280",
  },
  theme: { mode: isDarkTheme.value ? "dark" : "light" },
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 3 },
  tooltip: { theme: isDarkTheme.value ? "dark" : "light" },
  grid: {
    borderColor: isDarkTheme.value ? "rgba(71, 85, 105, 0.35)" : "#e5e7eb",
    strokeDashArray: 4,
  },
  legend: { show: false },
}));

const cpuChartOptions = computed<ApexOptions>(() => ({
  ...commonChartOptions.value,
  colors: ["#2563eb"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.03,
      stops: [0, 95, 100],
    },
  },
  xaxis: {
    categories: timeLabels.value,
    labels: { rotate: 0, hideOverlappingLabels: true },
  },
  yaxis: {
    min: 0,
    max: 100,
    labels: {
      formatter: (value) => `${Math.round(value)}%`,
    },
  },
}));

const qpsChartOptions = computed<ApexOptions>(() => ({
  ...commonChartOptions.value,
  colors: ["#059669"],
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.35,
      opacityTo: 0.03,
      stops: [0, 95, 100],
    },
  },
  xaxis: {
    categories: timeLabels.value,
    labels: { rotate: 0, hideOverlappingLabels: true },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      formatter: (value) => value.toFixed(0),
    },
  },
}));

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const pushTrendPoint = (label: string, cpu: number, qps: number) => {
  if (timeLabels.value.length >= MAX_POINTS) {
    timeLabels.value.shift();
    cpuData.value.shift();
    qpsData.value.shift();
  }

  timeLabels.value.push(label);
  cpuData.value.push(cpu);
  qpsData.value.push(qps);
};

const clearPollingTimer = () => {
  if (pollingTimer.value !== null) {
    window.clearTimeout(pollingTimer.value);
    pollingTimer.value = null;
  }
};

const scheduleNextPoll = (delay = POLLING_INTERVAL_MS) => {
  clearPollingTimer();
  if (!isViewActive.value || visibility.value !== "visible") return;

  pollingTimer.value = window.setTimeout(() => {
    void fetchDashboard();
  }, delay);
};

const fetchDashboard = async (manual = false) => {
  if (!isViewActive.value) return;
  if (visibility.value !== "visible" && !manual) return;

  isRefreshing.value = true;
  try {
    const res = await http.get("/admin/dashboard");
    if (!isViewActive.value) return;
    if (res.data?.ok) {
      const data = res.data.data as DashboardResponse;
      dashboardData.value = data;
      lastUpdatedAt.value = data.sampled_at || new Date().toISOString();
      lastError.value = "";

      const label = new Date().toLocaleTimeString("zh-CN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      pushTrendPoint(label, data.server.cpu_percent, data.network.api_qps);
    }
  } catch (error: any) {
    if (!isViewActive.value) return;
    lastError.value = error.response?.data?.message || error.message || "未知错误";

    if (error.response?.status === 403) {
      alert("权限不足：您不是超级管理员");
      clearPollingTimer();
      void router.push("/panel");
      return;
    }
  } finally {
    if (!isViewActive.value) return;
    isRefreshing.value = false;
    isInitialLoading.value = false;
    scheduleNextPoll(lastError.value ? RETRY_INTERVAL_MS : POLLING_INTERVAL_MS);
  }
};

const refreshNow = async () => {
  await fetchDashboard(true);
};

const handleVisibilityChange = () => {
  if (!isViewActive.value) return;
  if (visibility.value === "visible") {
    void fetchDashboard(true);
  } else {
    clearPollingTimer();
  }
};

onMounted(() => {
  isViewActive.value = true;
  syncThemeMode();
  themeObserver = new MutationObserver(() => {
    syncThemeMode();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  themeObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  void fetchDashboard(true);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  isViewActive.value = false;
  clearPollingTimer();
  themeObserver?.disconnect();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 28%),
    radial-gradient(circle at top right, rgba(5, 150, 105, 0.08), transparent 24%),
    var(--bg-color);
  color: var(--text-main);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 300px;
  min-width: 0;
}

.content-area {
  flex: 1;
  padding: 0 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 2rem;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  color: var(--text-muted);
  max-width: 720px;
  line-height: 1.6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.status-pill,
.panel-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
}

.status-pill.healthy {
  background: rgba(5, 150, 105, 0.12);
  color: #047857;
}

.status-pill.syncing {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
}

.status-pill.paused {
  background: rgba(107, 114, 128, 0.12);
  color: #4b5563;
}

.status-pill.error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
}

.refresh-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.loading-state {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-muted);
}

.spinner {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 4px solid rgba(37, 99, 235, 0.15);
  border-top-color: #2563eb;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(4, minmax(180px, 1fr));
  gap: 20px;
}

.hero-card,
.metric-card,
.panel-card,
.detail-card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 24px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
}

.hero-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(5, 150, 105, 0.08)),
    rgba(255, 255, 255, 0.9);
}

.eyebrow {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

.hero-value {
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  font-weight: 900;
  line-height: 1.1;
}

.hero-desc {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #475569;
  font-size: 0.9rem;
}

.hero-meta span {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 999px;
  padding: 8px 12px;
}

.metric-card {
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 700;
}

.metric-value {
  font-size: clamp(1.8rem, 2.6vw, 2.4rem);
  font-weight: 900;
  line-height: 1;
}

.metric-desc {
  color: #475569;
  line-height: 1.6;
}

.metric-card.cpu .metric-value {
  color: #1d4ed8;
}

.metric-card.memory .metric-value {
  color: #7c3aed;
}

.metric-card.qps .metric-value {
  color: #059669;
}

.metric-card.users .metric-value {
  color: #ea580c;
}

.panel-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.panel-card,
.detail-card {
  padding: 20px;
}

.chart-panel.danger {
  border-color: rgba(239, 68, 68, 0.35);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.panel-title,
.detail-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.panel-subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.panel-tag {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.detail-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #475569;
}

.detail-row strong {
  color: var(--text-main);
  font-size: 1rem;
}

.error-banner {
  margin: 0;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.18);
}

[data-theme="dark"] .app-layout {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(5, 150, 105, 0.12), transparent 24%),
    linear-gradient(180deg, #0f172a 0%, #111827 52%, #0b1220 100%);
}

[data-theme="dark"] .hero-card,
[data-theme="dark"] .metric-card,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .detail-card {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.24);
}

[data-theme="dark"] .hero-card {
  background:
    linear-gradient(135deg, rgba(30, 64, 175, 0.22), rgba(5, 150, 105, 0.16)),
    linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .eyebrow,
[data-theme="dark"] .metric-card.cpu .metric-value {
  color: #60a5fa;
}

[data-theme="dark"] .metric-card.memory .metric-value {
  color: #c084fc;
}

[data-theme="dark"] .metric-card.qps .metric-value {
  color: #34d399;
}

[data-theme="dark"] .metric-card.users .metric-value {
  color: #fb923c;
}

[data-theme="dark"] .hero-meta,
[data-theme="dark"] .metric-desc,
[data-theme="dark"] .detail-row,
[data-theme="dark"] .panel-tag {
  color: #94a3b8;
}

[data-theme="dark"] .hero-meta span,
[data-theme="dark"] .panel-tag {
  background: rgba(30, 41, 59, 0.92);
}

[data-theme="dark"] .status-pill.healthy {
  background: rgba(5, 150, 105, 0.18);
  color: #6ee7b7;
}

[data-theme="dark"] .status-pill.syncing {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
}

[data-theme="dark"] .status-pill.paused {
  background: rgba(100, 116, 139, 0.22);
  color: #cbd5e1;
}

[data-theme="dark"] .status-pill.error {
  background: rgba(127, 29, 29, 0.28);
  color: #fca5a5;
}

[data-theme="dark"] .error-banner {
  background: rgba(127, 29, 29, 0.24);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.24);
}

@media (max-width: 1400px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }

  .content-area {
    padding: 0 20px 20px;
  }

  .panel-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .hero-card,
  .metric-card,
  .panel-card,
  .detail-card {
    border-radius: 20px;
  }
}
</style>
