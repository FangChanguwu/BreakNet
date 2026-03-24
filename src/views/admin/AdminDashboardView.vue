<template>
  <div class="app-layout">
    <LayoutSidebar />
    <div class="main-wrapper">
      <LayoutHeader />
      <main class="content-area">
        <div class="page-header">
          <h2>📊 仪表盘 (Dashboard)</h2>
          <p class="subtitle">实时监控服务器性能与业务宏观数据 (每 1 秒刷新)</p>
        </div>

        <div v-if="isInitialLoading" class="loading-state">
          获取服务器数据中...
        </div>

        <div class="admin-dashboard" v-else-if="dashboardData">
          <div class="stats-grid small-cards">
            <div class="stat-card">
              <div class="card-title">物理内存占用</div>
              <div class="card-value">
                {{ dashboardData.server.ram_percent }}%
              </div>
              <div class="sub-text">
                {{ dashboardData.server.ram_used_mb }} /
                {{ dashboardData.server.ram_total_mb }} MB
              </div>
            </div>

            <div class="stat-card">
              <div class="card-title">Nginx 活跃连接 (含静态)</div>
              <div class="card-value">
                {{ dashboardData.network?.nginx_active_conn || 0 }}
                <span class="unit">个</span>
              </div>
              <div class="sub-text">
                总处理: {{ dashboardData.network?.nginx_total_req || 0 }}
              </div>
            </div>

            <div class="stat-card">
              <div class="card-title">全服总注册用户</div>
              <div class="card-value">
                {{ dashboardData.business.total_users }}
                <span class="unit">人</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="card-title">今日活跃签到</div>
              <div class="card-value">
                {{ dashboardData.business.today_signs }}
                <span class="unit">人</span>
              </div>
            </div>
          </div>

          <div class="stats-grid charts-grid">
            <div class="stat-card chart-card">
              <div class="card-title">💻 CPU 实时负载 (%)</div>
              <apexchart
                type="area"
                height="280"
                :options="cpuChartOptions"
                :series="cpuSeries"
              />
            </div>

            <div
              class="stat-card chart-card"
              :class="{ 'danger-border': dashboardData.network?.api_qps > 50 }"
            >
              <div class="card-title">🌐 后端接口实时 QPS (次/秒)</div>
              <apexchart
                type="area"
                height="280"
                :options="qpsChartOptions"
                :series="qpsSeries"
              />
            </div>
          </div>
        </div>
      </main>
      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";

// 引入 ApexCharts
import apexchart from "vue3-apexcharts";
import type { ApexOptions } from "apexcharts";

const router = useRouter();
const isInitialLoading = ref(true);
const dashboardData = ref<any>(null);
const isPolling = ref(false);

// ================= 图表数据存储 (保留最近 30 秒的数据) =================
const MAX_POINTS = 30;
const timeLabels = ref<string[]>([]);
const cpuData = ref<number[]>([]);
const qpsData = ref<number[]>([]);

// 注入给图表的 Series 数据
const cpuSeries = computed(() => [{ name: "CPU 负载", data: cpuData.value }]);
const qpsSeries = computed(() => [{ name: "接口 QPS", data: qpsData.value }]);

// ================= 图表基础配置 (暗黑风格) =================
const commonChartOptions: ApexOptions = {
  chart: {
    animations: { enabled: false }, // 1秒1刷，关掉动画防止闪烁
    toolbar: { show: false },
    background: "transparent",
    zoom: { enabled: false },
  },
  theme: { mode: "dark" }, // 完美适配你的深色后台
  dataLabels: { enabled: false },
  stroke: { curve: "smooth", width: 2 },
  tooltip: { theme: "dark" },
  grid: { borderColor: "#333333", strokeDashArray: 4 },
};

// CPU 图表专属配置
const cpuChartOptions = computed<ApexOptions>(() => ({
  ...commonChartOptions,
  colors: ["#3b82f6"], // 科技蓝
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
  },
  xaxis: {
    categories: timeLabels.value,
    labels: { style: { colors: "#888" } },
  },
  yaxis: { max: 100, min: 0, labels: { style: { colors: "#888" } } },
}));

// QPS 图表专属配置
const qpsChartOptions = computed<ApexOptions>(() => ({
  ...commonChartOptions,
  colors: ["#10b981"], // 荧光绿
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.7,
      opacityTo: 0.1,
      stops: [0, 90, 100],
    },
  },
  xaxis: {
    categories: timeLabels.value,
    labels: { style: { colors: "#888" } },
  },
  yaxis: { min: 0, labels: { style: { colors: "#888" } } },
}));

// ================= 请求逻辑 =================
const fetchDashboard = async () => {
  try {
    const res = await http.get("/admin/dashboard");
    if (res.data?.ok) {
      dashboardData.value = res.data.data;

      // 组装时间轴标签 (例如 "14:05:30")
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

      // 压入新数据，如果超长则抛弃旧数据
      if (timeLabels.value.length >= MAX_POINTS) {
        timeLabels.value.shift();
        cpuData.value.shift();
        qpsData.value.shift();
      }

      timeLabels.value.push(timeStr);
      cpuData.value.push(res.data.data.server.cpu_percent);
      qpsData.value.push(res.data.data.network.api_qps);
    }
  } catch (error: any) {
    if (error.response?.status === 403) {
      alert("权限不足：您不是超级管理员！");
      isPolling.value = false;
      router.push("/panel");
    }
  } finally {
    isInitialLoading.value = false;
  }
};

const startPolling = async () => {
  isPolling.value = true;
  while (isPolling.value) {
    await fetchDashboard();
    if (!isPolling.value) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
};

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  isPolling.value = false;
});
</script>

<style scoped>
/* 基础布局 */
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-main);
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 300px;
}
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  color: var(--text-main);
}
.subtitle {
  margin: 0;
  color: var(--text-muted);
}

/* 网格系统优化 */
.stats-grid {
  display: grid;
  gap: 24px;
}
.small-cards {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.charts-grid {
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  margin-top: 10px;
}

/* 卡片样式 */
.stat-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 15px var(--shadow-color);
  display: flex;
  flex-direction: column;
}

.chart-card {
  padding: 20px 10px 10px 10px; /* 给图表预留更多空间 */
}

.card-title {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 12px;
  font-weight: bold;
}
.card-value {
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 8px;
}
.unit {
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-secondary);
}
.sub-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: auto;
}

.danger-border {
  border-color: #ef4444 !important;
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0; /* 手机端取消左侧 300px 的推挤 */
    transition: margin-left 0.3s ease; /* 加上平滑过渡动画 */
  }

  .content-area {
    padding: 0 20px 20px 20px; /* 手机端屏幕小，四周的留白缩小一点 */
  }

  /* 针对用户数据页：防止表格太宽把页面撑破 */
  .table-container {
    overflow-x: auto; /* 允许表格在手机上横向滑动 */
    -webkit-overflow-scrolling: touch; /* 让苹果手机滑动更丝滑 */
  }

  /* 针对用户数据页：搜索框适应手机宽度 */
  .search-box {
    flex-direction: column; /* 手机上搜索框和按钮竖着排 */
  }
  .search-box input {
    max-width: 100%;
  }
}
</style>
