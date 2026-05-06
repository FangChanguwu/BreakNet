<template>
  <main class="region-page">
    <section class="region-head">
      <div>
        <span class="page-kicker">MAIMAI REGION</span>
        <h2>全国行脚</h2>
        <p>目标是成为舞萌旅游大师</p>
      </div>
    </section>

    <section class="region-layout">
      <aside class="side-column">
        <article class="panel-card account-panel">
          <div v-if="loading" class="state-box"></div>
          <div v-else-if="!accounts.length" class="empty-box"></div>
          <div v-else class="account-select">
            <button class="select-trigger" type="button" @click="accountMenuOpen = !accountMenuOpen">
              <AccountOption v-if="selectedAccount" :account="selectedAccount" />
              <span class="select-arrow" :class="{ open: accountMenuOpen }">▶</span>
            </button>

            <transition name="drop">
              <div v-if="accountMenuOpen" class="select-menu">
                <button
                  v-for="account in accounts"
                  :key="account.uid"
                  class="select-option"
                  type="button"
                  :class="{ active: account.index === selectedAccountIndex }"
                  @click="selectAccount(account.index)"
                >
                  <AccountOption :account="account" />
                </button>
              </div>
            </transition>
          </div>
        </article>

        <article class="panel-card rank-panel">
          <div v-if="rankedRegions.length" class="rank-list">
            <div v-for="(region, index) in rankedRegions" :key="region.regionId" class="rank-row">
              <span>{{ index + 1 }}</span>
              <strong>{{ region.regionName }}</strong>
              <em>{{ region.playCount }}</em>
            </div>
          </div>
          <div v-else class="empty-box"></div>
        </article>
      </aside>

      <section class="map-panel">
        <div ref="chartRef" class="region-chart"></div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as echarts from "echarts/core";
import { MapChart } from "echarts/charts";
import { TooltipComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { ComposeOption } from "echarts/core";
import type { MapSeriesOption } from "echarts/charts";
import type { TooltipComponentOption, VisualMapComponentOption } from "echarts/components";
import { maimaiApi } from "@/api/maimai";

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
    userName?: string;
    playerRating?: number;
    iconId?: number;
  };
  region: {
    updatedAt?: string;
    regions: RegionEntry[];
  };
};

type AccountsPayload = {
  accounts: AccountEntry[];
};

type RegionShape = {
  id: string;
  name: string;
};

type EChartsOption = ComposeOption<MapSeriesOption | TooltipComponentOption | VisualMapComponentOption>;

type GeoJsonFeature = {
  type: "Feature";
  properties: { name: string; id: string };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

const chinaRegionMapName = "maimai-region-china";
const chinaGeoJsonUrl = "https://geojson.cn/api/china/1.6.3/china.json";
const hiddenLabelRegions = new Set(["北京", "天津", "上海", "海南"]);

const regionShapes: RegionShape[] = [
  { id: "1", name: "北京" },
  { id: "2", name: "重庆" },
  { id: "3", name: "上海" },
  { id: "4", name: "天津" },
  { id: "5", name: "安徽" },
  { id: "6", name: "福建" },
  { id: "7", name: "甘肃" },
  { id: "8", name: "广东" },
  { id: "9", name: "贵州" },
  { id: "10", name: "海南" },
  { id: "11", name: "河北" },
  { id: "12", name: "黑龙江" },
  { id: "13", name: "河南" },
  { id: "14", name: "湖北" },
  { id: "15", name: "湖南" },
  { id: "16", name: "江苏" },
  { id: "17", name: "江西" },
  { id: "18", name: "吉林" },
  { id: "19", name: "辽宁" },
  { id: "20", name: "青海" },
  { id: "21", name: "陕西" },
  { id: "22", name: "山东" },
  { id: "23", name: "山西" },
  { id: "24", name: "四川" },
  { id: "26", name: "云南" },
  { id: "27", name: "浙江" },
  { id: "28", name: "广西" },
  { id: "29", name: "内蒙古" },
  { id: "30", name: "宁夏" },
  { id: "31", name: "新疆" },
  { id: "32", name: "西藏" },
];

const fallbackShapes = [
  { id: "31", name: "新疆", x: 44, y: 132, w: 142, h: 90 },
  { id: "32", name: "西藏", x: 92, y: 318, w: 146, h: 82 },
  { id: "20", name: "青海", x: 218, y: 252, w: 104, h: 76 },
  { id: "7", name: "甘肃", x: 250, y: 174, w: 118, h: 58 },
  { id: "29", name: "内蒙古", x: 330, y: 96, w: 220, h: 64 },
  { id: "30", name: "宁夏", x: 386, y: 204, w: 54, h: 42 },
  { id: "21", name: "陕西", x: 424, y: 252, w: 62, h: 76 },
  { id: "23", name: "山西", x: 490, y: 206, w: 58, h: 70 },
  { id: "11", name: "河北", x: 548, y: 190, w: 66, h: 62 },
  { id: "1", name: "北京", x: 562, y: 156, w: 44, h: 28 },
  { id: "4", name: "天津", x: 612, y: 190, w: 42, h: 28 },
  { id: "19", name: "辽宁", x: 616, y: 124, w: 74, h: 48 },
  { id: "18", name: "吉林", x: 652, y: 72, w: 70, h: 44 },
  { id: "12", name: "黑龙江", x: 630, y: 18, w: 92, h: 46 },
  { id: "13", name: "河南", x: 496, y: 286, w: 74, h: 58 },
  { id: "22", name: "山东", x: 580, y: 268, w: 80, h: 48 },
  { id: "5", name: "安徽", x: 568, y: 348, w: 62, h: 62 },
  { id: "16", name: "江苏", x: 634, y: 340, w: 62, h: 52 },
  { id: "3", name: "上海", x: 704, y: 384, w: 38, h: 28 },
  { id: "15", name: "湖南", x: 464, y: 412, w: 70, h: 62 },
  { id: "14", name: "湖北", x: 480, y: 350, w: 74, h: 56 },
  { id: "17", name: "江西", x: 548, y: 424, w: 64, h: 62 },
  { id: "27", name: "浙江", x: 624, y: 410, w: 58, h: 56 },
  { id: "6", name: "福建", x: 602, y: 486, w: 62, h: 50 },
  { id: "24", name: "四川", x: 332, y: 348, w: 112, h: 76 },
  { id: "2", name: "重庆", x: 432, y: 344, w: 50, h: 42 },
  { id: "9", name: "贵州", x: 402, y: 456, w: 68, h: 52 },
  { id: "26", name: "云南", x: 310, y: 474, w: 82, h: 58 },
  { id: "28", name: "广西", x: 464, y: 492, w: 76, h: 46 },
  { id: "8", name: "广东", x: 544, y: 500, w: 74, h: 42 },
  { id: "10", name: "海南", x: 536, y: 548, w: 46, h: 28 },
];

const toFeature = (shape: (typeof fallbackShapes)[number]): GeoJsonFeature => {
  const x1 = shape.x;
  const y1 = -shape.y;
  const x2 = shape.x + shape.w;
  const y2 = -(shape.y + shape.h);
  return {
    type: "Feature",
    properties: { name: shape.name, id: shape.id },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [x1, y1],
          [x2, y1],
          [x2, y2],
          [x1, y2],
          [x1, y1],
        ],
      ],
    },
  };
};

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);

let registeredMapSource = "";

const simplifyRegionName = (name: string) =>
  name
    .replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市/g, "")
    .replace(/^内蒙古.*$/, "内蒙古")
    .replace(/^黑龙江.*$/, "黑龙江")
    .replace(/^新疆.*$/, "新疆")
    .replace(/^广西.*$/, "广西")
    .replace(/^宁夏.*$/, "宁夏")
    .replace(/^西藏.*$/, "西藏");

const registerFallbackMap = () => {
  if (registeredMapSource === "fallback") return;
  echarts.registerMap(chinaRegionMapName, {
    type: "FeatureCollection",
    features: fallbackShapes.map(toFeature),
  });
  registeredMapSource = "fallback";
};

const registerRemoteChinaMap = async () => {
  if (registeredMapSource === "remote") return;
  try {
    const response = await fetch(chinaGeoJsonUrl, { cache: "force-cache" });
    if (!response.ok) throw new Error(`GeoJSON ${response.status}`);
    const geoJson = await response.json();
    if (Array.isArray(geoJson.features)) {
      geoJson.features = geoJson.features.map((feature: { properties?: { name?: string } }) => ({
        ...feature,
        properties: {
          ...feature.properties,
          name: simplifyRegionName(String(feature.properties?.name || "")),
        },
      }));
    }
    echarts.registerMap(chinaRegionMapName, geoJson);
    registeredMapSource = "remote";
  } catch (error) {
    console.error("中国地图 GeoJSON 加载失败，使用本地 fallback：", error);
    registerFallbackMap();
  }
};

const chartRef = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const accounts = ref<AccountEntry[]>([]);
const selectedAccountIndex = ref<number | null>(null);
const loading = ref(false);
const accountMenuOpen = ref(false);

const formatAssetId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "000000";
  return String(value).slice(-6).padStart(6, "0");
};

const getIconUrl = (iconId?: number | string | null) =>
  `https://assets.breakdx.net/maimai/icon/UI_Icon_${formatAssetId(iconId)}.png`;

const AccountOption = defineComponent({
  name: "AccountOption",
  props: {
    account: {
      type: Object as () => AccountEntry,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "account-option-inner" }, [
        h("img", {
          class: "account-avatar",
          src: getIconUrl(props.account.preview.iconId),
          alt: "icon",
          onError: (event: Event) => {
            const image = event.target as HTMLImageElement;
            image.onerror = null;
            image.src = "https://assets.breakdx.net/maimai/icon/UI_Icon_106004.png";
          },
        }),
        h("div", { class: "account-option-copy" }, [
          h("strong", props.account.displayName || props.account.preview.userName || `UID ${props.account.uid}`),
          h("span", `UID ${props.account.uid}`),
        ]),
        h("b", { class: "rating-number" }, String(props.account.preview.playerRating ?? "--")),
      ]);
  },
});

const selectedAccount = computed(
  () => accounts.value.find((account) => account.index === selectedAccountIndex.value) || accounts.value[0] || null,
);

const regionMap = computed(() => {
  const map = new Map<string, RegionEntry>();
  for (const item of selectedAccount.value?.region?.regions || []) {
    map.set(String(item.regionId), item);
  }
  return map;
});

const nonZeroCounts = computed(() =>
  [...regionMap.value.values()]
    .map((region) => Number(region.playCount || 0))
    .filter((count) => count > 0)
    .sort((a, b) => a - b),
);

const visualPieces = computed(() => {
  const counts = nonZeroCounts.value;
  if (!counts.length) {
    return [{ value: 0, label: "0", color: "#e5e7eb" }];
  }

  const unique = Array.from(new Set(counts));
  if (unique.length <= 3) {
    return [
      { value: 0, label: "0", color: "#e5e7eb" },
      ...unique.map((value, index) => ({
        value,
        label: String(value),
        color: ["#fed7aa", "#fb923c", "#ea580c"][Math.min(index, 2)],
      })),
    ];
  }

  const pick = (ratio: number) => counts[Math.min(counts.length - 1, Math.floor((counts.length - 1) * ratio))];
  const q1 = pick(0.34);
  const q2 = pick(0.67);
  const max = counts[counts.length - 1];
  return [
    { value: 0, label: "0", color: "#e5e7eb" },
    { min: 1, max: q1, label: `1-${q1}`, color: "#fed7aa" },
    { min: q1 + 1, max: q2, label: `${q1 + 1}-${q2}`, color: "#fb923c" },
    { min: q2 + 1, max, label: `${q2 + 1}+`, color: "#ea580c" },
  ].filter((piece) => !("min" in piece) || Number(piece.min) <= Number(piece.max));
});

const rankedRegions = computed(() =>
  [...regionMap.value.values()]
    .filter((region) => region.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount),
);

const chartData = computed(() =>
  regionShapes.map((shape) => {
    const region = regionMap.value.get(shape.id);
    return {
      name: shape.name,
      value: region?.playCount || 0,
      firstTime: region?.created || "",
    };
  }),
);

const formatDate = (value?: string) => {
  if (!value) return "首次时间：暂无";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return `首次时间：${value}`;
  return `首次时间：${date.toLocaleDateString("zh-CN")}`;
};

const renderChart = async () => {
  await nextTick();
  if (!chartRef.value) return;
  await registerRemoteChinaMap();
  chart ||= echarts.init(chartRef.value);
  const isNarrow = chartRef.value.clientWidth < 720;

  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      appendToBody: true,
      borderWidth: 0,
      padding: 0,
      backgroundColor: "transparent",
      extraCssText: "box-shadow:none;",
      formatter: (params) => {
        const item = Array.isArray(params) ? params[0] : params;
        const data = item.data as { value?: number; firstTime?: string } | undefined;
        return `
          <div class="maimai-region-tip">
            <strong>${item.name}</strong>
            <span>${data?.value || 0}</span>
            <small>${formatDate(data?.firstTime)}</small>
          </div>
        `;
      },
    },
    visualMap: {
      type: "piecewise",
      pieces: visualPieces.value,
      right: isNarrow ? 10 : 18,
      bottom: isNarrow ? 10 : 18,
      orient: isNarrow ? "vertical" : "horizontal",
      itemWidth: 16,
      itemHeight: 14,
      textStyle: { color: "#64748b", fontWeight: 800 },
      calculable: false,
    },
    series: [
      {
        type: "map",
        map: chinaRegionMapName,
        roam: false,
        layoutCenter: isNarrow ? ["50%", "48%"] : ["48%", "50%"],
        layoutSize: isNarrow ? "118%" : "120%",
        label: {
          show: !isNarrow,
          formatter: (params) => {
            const data = params.data as { value?: number } | undefined;
            const name = String(params.name);
            return Number(data?.value || 0) > 0 && !hiddenLabelRegions.has(name) ? name : "";
          },
          color: "#7c2d12",
          fontSize: 10,
          fontWeight: 800,
        },
        itemStyle: {
          borderColor: "rgba(154, 52, 18, 0.34)",
          borderWidth: 2,
        },
        emphasis: {
          label: { color: "#431407", fontSize: 12, fontWeight: 900 },
          itemStyle: {
            areaColor: "#fdba74",
            borderColor: "#ea580c",
            shadowBlur: 16,
            shadowColor: "rgba(249, 115, 22, 0.24)",
          },
        },
        data: chartData.value,
      },
    ],
  };

  chart.setOption(option, true);
};

const fetchAccounts = async () => {
  loading.value = true;
  try {
    const res = await maimaiApi.getAccounts();
    if (res.data?.returnCode === 0) {
      const payload = res.data.data as AccountsPayload;
      accounts.value = payload.accounts || [];
      const current = accounts.value.find((account) => account.isCurrent) || accounts.value[0] || null;
      selectedAccountIndex.value = current?.index ?? null;
    }
  } finally {
    loading.value = false;
    void renderChart();
  }
};

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
  accountMenuOpen.value = false;
};

const resizeChart = () => chart?.resize();

watch([selectedAccountIndex, chartData], () => {
  void renderChart();
});

onMounted(() => {
  void fetchAccounts();
  window.addEventListener("resize", resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", resizeChart);
  chart?.dispose();
  chart = null;
});
</script>

<style scoped>
.region-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 0 40px 40px;
  min-width: 0;
}

.region-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.page-kicker {
  color: #ea580c;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.region-head h2 {
  margin: 4px 0 0;
  color: var(--text-main);
  font-size: 1.9rem;
}

.region-head p {
  margin: 6px 0 0;
  color: var(--text-muted);
}

.region-layout {
  display: grid;
  grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.side-column {
  display: grid;
  gap: 18px;
}

.panel-card,
.map-panel {
  border-radius: 20px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
}

.panel-card {
  padding: 16px;
}

.account-select {
  position: relative;
}

.select-trigger,
.select-option {
  width: 100%;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 86px;
  border-radius: 18px;
  padding: 14px 16px;
  background: #fff7ed;
  border: 1px solid rgba(249, 115, 22, 0.18);
}

.select-arrow {
  margin-left: auto;
  color: #fb923c;
  font-size: 1.25rem;
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(90deg);
}

.select-menu {
  position: absolute;
  z-index: 8;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  display: grid;
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
  border-radius: 18px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(249, 115, 22, 0.18);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}

.select-option {
  border-radius: 14px;
  padding: 10px;
  background: transparent;
}

.select-option.active,
.select-option:hover {
  background: rgba(249, 115, 22, 0.1);
}

.account-option-inner {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.account-avatar {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.account-option-copy {
  min-width: 0;
}

.account-option-copy strong,
.account-option-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-option-copy strong {
  color: #0f172a;
}

.account-option-copy span {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.86rem;
}

.rating-number {
  min-width: 64px;
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  text-align: center;
}

.state-box,
.empty-box {
  min-height: 86px;
  border-radius: 18px;
  background:
    linear-gradient(90deg, rgba(254, 215, 170, 0.3), rgba(255, 247, 237, 0.86), rgba(254, 215, 170, 0.3));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.map-panel {
  position: relative;
  min-height: 620px;
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 237, 0.92));
  overflow: hidden;
}

.region-chart {
  width: 100%;
  max-width: 100%;
  height: 620px;
  min-width: 0;
}

.rank-panel {
  max-height: 516px;
  overflow-y: auto;
}

.rank-list {
  display: grid;
  gap: 8px;
}

.rank-row {
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(255, 247, 237, 0.72);
  border: 1px solid rgba(249, 115, 22, 0.16);
  color: var(--text-main);
}

.rank-row span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffedd5;
  color: #ea580c;
  font-weight: 900;
}

.rank-row strong {
  min-width: 0;
  font-size: 0.92rem;
}

.rank-row em {
  color: #ea580c;
  font-style: normal;
  font-weight: 900;
}

.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

:global(.maimai-region-tip) {
  display: grid;
  gap: 2px;
  min-width: 94px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.9);
  color: #fff;
  pointer-events: none;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.2);
}

:global(.maimai-region-tip strong),
:global(.maimai-region-tip span),
:global(.maimai-region-tip small) {
  line-height: 1.25;
}

:global(.maimai-region-tip strong) {
  font-size: 0.82rem;
}

:global(.maimai-region-tip span) {
  font-size: 1rem;
  font-weight: 900;
}

:global(.maimai-region-tip small) {
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.68rem;
}

[data-theme="dark"] .map-panel {
  background:
    linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(154, 52, 18, 0.16));
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.26);
}

[data-theme="dark"] .panel-card,
[data-theme="dark"] .select-menu {
  background: rgba(15, 23, 42, 0.94);
  border-color: rgba(251, 146, 60, 0.18);
}

[data-theme="dark"] .select-trigger {
  background: rgba(67, 31, 13, 0.36);
  border-color: rgba(251, 146, 60, 0.18);
}

[data-theme="dark"] .account-option-copy strong {
  color: #f8fafc;
}

[data-theme="dark"] .rank-row {
  background: rgba(15, 23, 42, 0.82);
  border-color: rgba(251, 146, 60, 0.16);
}

@media (max-width: 900px) {
  .region-page {
    padding: 0 20px 24px;
  }

  .region-head {
    align-items: stretch;
    flex-direction: column;
  }

  .region-layout {
    grid-template-columns: 1fr;
  }

  .map-panel {
    min-height: 460px;
    width: 100%;
  }

  .region-chart {
    width: 100%;
    height: 460px;
  }

  .rank-panel {
    max-height: 320px;
  }
}
</style>
