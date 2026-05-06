<template>
  <main class="scores-page">
    <section class="page-header">
      <div class="title-section">
        <span class="page-kicker">MAIMAI SCORE</span>
        <h2>成绩管理</h2>
        <!-- <p class="subtitle">浏览缓存成绩、筛选谱面与按 RA 排序。</p> -->
      </div>

      <div class="header-actions">
        <div v-if="accounts.length" class="account-select">
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
        <button class="refresh-btn" type="button" :disabled="refreshing || selectedAccountIndex === null" @click="openScoreQrModal">
          {{ refreshing ? "更新中" : "更新成绩" }}
        </button>
      </div>
    </section>

    <section class="filter-panel">
      <label class="search-shell">
        <span class="search-icon">⌕</span>
        <input v-model.trim="filters.search" type="text" placeholder="搜索曲名、别名或 ID" />
        <button v-if="filters.search" type="button" @click="filters.search = ''">清空</button>
      </label>

      <div class="filter-grid">
        <label class="filter-group">
          <span>版本</span>
          <select v-model="filters.version">
            <option value="">全部</option>
            <option v-for="version in versions" :key="version" :value="version">{{ version }}</option>
          </select>
        </label>

        <label class="filter-group">
          <span>难度</span>
          <select v-model="filters.difficulty">
            <option value="">全部</option>
            <option v-for="diff in difficultyMeta" :key="diff.key" :value="String(diff.level)">
              {{ diff.label }}
            </option>
          </select>
        </label>

        <div class="filter-group range-filter">
          <span>达成率</span>
          <div class="range-inputs">
            <input v-model.number="filters.achievementMin" type="number" step="0.0001" placeholder="最小" />
            <i>-</i>
            <input v-model.number="filters.achievementMax" type="number" step="0.0001" placeholder="最大" />
          </div>
        </div>

        <div class="filter-group range-filter">
          <span>定数</span>
          <div class="range-inputs">
            <input v-model.number="filters.dsMin" type="number" step="0.1" placeholder="最小" />
            <i>-</i>
            <input v-model.number="filters.dsMax" type="number" step="0.1" placeholder="最大" />
          </div>
        </div>

        <div class="filter-group range-filter">
          <span>RA</span>
          <div class="range-inputs">
            <input v-model.number="filters.raMin" type="number" placeholder="最小" />
            <i>-</i>
            <input v-model.number="filters.raMax" type="number" placeholder="最大" />
          </div>
        </div>
      </div>

      <div class="sort-panel">
        <span class="sort-title">排序</span>
        <div class="sort-button-row">
          <button
            v-for="option in sortOptions"
            :key="option.key"
            class="sort-btn"
            :class="{ active: sortState.key === option.key }"
            type="button"
            @click="toggleSort(option.key)"
          >
            <span>{{ option.label }}</span>
            <span class="sort-arrows" aria-hidden="true">
              <i :class="{ active: sortState.key === option.key && sortState.direction === 'asc' }">▲</i>
              <i :class="{ active: sortState.key === option.key && sortState.direction === 'desc' }">▼</i>
            </span>
          </button>
        </div>
        <button class="reset-btn" type="button" @click="resetFilters">重置筛选</button>
      </div>
    </section>

    <section class="score-panel">
      <div class="score-toolbar">
        <div>
          <strong>{{ filteredScores.length }} / {{ allScores.length }} 条成绩</strong>
          <span>当前第 {{ currentPage }} / {{ totalPages }} 页</span>
        </div>
      </div>

      <div v-if="loading" class="state-box large">正在读取缓存成绩</div>
      <div v-else-if="loadError" class="state-box large error">{{ loadError }}</div>
      <div v-else-if="!displayedScores.length" class="state-box large">没有符合条件的成绩</div>

      <div v-else class="score-list">
        <article
          v-for="score in displayedScores"
          :key="score.scoreKey"
          class="score-card"
          :style="getCardStyle(score.difficultyKey)"
        >
          <img class="diff-rail" :src="getDifficultyImage(score.levelIndex)" alt="" aria-hidden="true" />
          <div class="jacket-stack">
            <img class="jacket" :src="getCoverUrl(score.musicId)" alt="jacket" loading="lazy" @error="handleCoverError" />
            <div class="jacket-meta-row">
              <b class="song-id">{{ score.musicId }}</b>
              <img class="type-image" :src="getTypeImage(score.type)" :alt="score.type" />
            </div>
          </div>

          <div class="score-copy">
            <div class="score-title-strip">
              <h3 :title="score.title">{{ score.title }}</h3>
            </div>

            <strong class="achievement-value">{{ formatAchievement(score.achievement) }}%</strong>

            <div class="score-detail-line">
              <span>{{ score.dsText }}</span>
              <span>→</span>
              <b>{{ score.rating }}</b>
              <span>{{ score.dxScore }}/{{ score.maxDxScore || "-" }}</span>
            </div>

            <div class="score-bottom-row">
              <img class="rank-image" :src="getRankImage(score.achievement)" alt="rank" />
              <span class="bonus-slot">
                <img v-if="getComboImage(score.comboStatus)" :src="getComboImage(score.comboStatus)" alt="combo" />
              </span>
              <span class="bonus-slot">
                <img v-if="getSyncImage(score.syncStatus)" :src="getSyncImage(score.syncStatus)" alt="sync" />
              </span>
              <span class="play-count">PC:{{ score.playCount }}</span>
              <span class="dx-stars">
                <span>{{ score.dxStars }}</span>
                <img :src="getDxStarImage(score.dxStars)" alt="dx star" />
              </span>
            </div>
          </div>
        </article>
      </div>

      <div class="pagination-bar">
        <button class="page-btn" type="button" :disabled="currentPage <= 1 || loading" @click="goToPage(currentPage - 1)">
          上一页
        </button>
        <div class="page-jump">
          <span>跳转到</span>
          <input v-model.number="pageInput" type="number" min="1" :max="totalPages" @keyup.enter="jumpToPage" />
          <button class="page-btn" type="button" :disabled="loading" @click="jumpToPage">前往</button>
        </div>
        <button class="page-btn" type="button" :disabled="currentPage >= totalPages || loading" @click="goToPage(currentPage + 1)">
          下一页
        </button>
      </div>
    </section>

    <QrcodeRequestModal
      v-model="qrText"
      :open="showQrModal"
      :busy="refreshing"
      title="更新成绩"
      description="请上传二维码截图或直接粘贴二维码字符串，后端会拉取该账号成绩并更新数据库缓存。"
      :hint="qrHint"
      submit-text="开始更新"
      busy-text="更新中"
      @close="showQrModal = false"
      @submit="refreshScores"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from "vue";
import Swal from "sweetalert2";
import { maimaiApi, type MaimaiAliasEntry, type MaimaiSongEntry } from "@/api/maimai";
import QrcodeRequestModal from "@/components/maimai/QrcodeRequestModal.vue";

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
};

type RawScore = {
  uid?: number;
  musicId: number | string;
  level: number;
  playCount?: number;
  achievement?: number;
  achievementPercent?: number | string;
  comboStatus?: number;
  syncStatus?: number;
  dxScore?: number;
  deluxscore?: number;
  deluxscoreMax?: number;
  scoreKey?: string;
};

type ScoresPayload = {
  uid?: number;
  scoreDocs?: RawScore[];
  list?: RawScore[];
  scores?: RawScore[];
  records?: RawScore[];
  total?: number;
  page?: number;
  limit?: number;
};

type ApiEnvelope = {
  returnCode?: number;
  message?: string;
  detail?: string;
  data?: unknown;
};

type ScoreCard = {
  uid: number;
  musicId: string;
  scoreKey: string;
  title: string;
  artist: string;
  version: string;
  aliases: string[];
  type: string;
  levelIndex: number;
  difficultyKey: string;
  difficultyLabel: string;
  levelText: string;
  ds: number;
  dsText: string;
  achievement: number;
  dxScore: number;
  maxDxScore: number;
  dxRatio: number;
  dxStars: number;
  playCount: number;
  comboStatus: number;
  syncStatus: number;
  rating: number;
};

type SortKey = "ra" | "achievement" | "ds" | "dx" | "playCount" | "id" | "version";
type SortDirection = "asc" | "desc";

const PAGE_SIZE = 20;
const LOCAL_SCORE_URL = "/scores.json";

const accounts = ref<AccountEntry[]>([]);
const selectedAccountIndex = ref<number | null>(null);
const accountMenuOpen = ref(false);
const loading = ref(false);
const loadingAccounts = ref(false);
const refreshing = ref(false);
const loadError = ref("");
const allScores = ref<ScoreCard[]>([]);
const showQrModal = ref(false);
const qrText = ref("");
const qrHint = ref("支持截图识别，也可以直接粘贴二维码原文。");
const currentPage = ref(1);
const pageInput = ref(1);
const songMap = ref(new Map<string, MaimaiSongEntry>());
const aliasMap = ref(new Map<string, string[]>());

const filters = reactive({
  search: "",
  version: "",
  difficulty: "",
  achievementMin: undefined as number | undefined,
  achievementMax: undefined as number | undefined,
  dsMin: undefined as number | undefined,
  dsMax: undefined as number | undefined,
  raMin: undefined as number | undefined,
  raMax: undefined as number | undefined,
});

const sortState = reactive<{ key: SortKey; direction: SortDirection }>({
  key: "ra",
  direction: "desc",
});

const difficultyMeta = [
  { level: 0, key: "basic", label: "BASIC", colors: ["#81d955", "#45c124", "#16af4f"] },
  { level: 1, key: "advanced", label: "ADVANCED", colors: ["#f8df3a", "#ffba01", "#efa407"] },
  { level: 2, key: "expert", label: "EXPERT", colors: ["#ff8c97", "#ff5a66", "#e84e69"] },
  { level: 3, key: "master", label: "MASTER", colors: ["#b66fed", "#9f51dc", "#8433c4"] },
  { level: 4, key: "remaster", label: "Re:MASTER", colors: ["#dbaaff", "#c280f3", "#e6e6e6"] },
  { level: 10, key: "utage", label: "宴", colors: ["#ff76fd", "#ff76fd", "#ff76fd"] },
];

const versionOrder = [
  "maimai",
  "maimai PLUS",
  "maimai GreeN",
  "maimai GreeN PLUS",
  "maimai ORANGE",
  "maimai ORANGE PLUS",
  "maimai PiNK",
  "maimai PiNK PLUS",
  "maimai MURASAKi",
  "maimai MURASAKi PLUS",
  "maimai MiLK",
  "maimai MiLK PLUS",
  "maimai FiNALE",
  "maimai でらっくす",
  "maimai でらっくす PLUS",
  "maimai Splash",
  "maimai Splash PLUS",
  "maimai UNiVERSE",
  "maimai UNiVERSE PLUS",
  "maimai FESTiVAL",
  "maimai FESTiVAL PLUS",
  "maimai BUDDiES",
  "maimai BUDDiES PLUS",
  "maimai PRiSM",
  "maimai PRiSM PLUS",
  "maimai CiRCLE",
  "maimai CiRCLE PLUS",
];

const getVersionAliases = (version: string) => {
  const trimmed = version.trim();
  const aliases = new Set<string>([trimmed]);
  if (trimmed.startsWith("maimai ")) {
    aliases.add(trimmed.replace(/^maimai\s+/, ""));
  }
  if (trimmed.startsWith("maimai でらっくす ")) {
    aliases.add(trimmed.replace(/^maimai\s+でらっくす\s+/, ""));
  }
  if (trimmed === "maimai でらっくす") {
    aliases.add("でらっくす");
  }
  return Array.from(aliases);
};

const versionOrderMap = new Map<string, number>(
  versionOrder.flatMap((version, index) => getVersionAliases(version).map((alias) => [alias, index] as const)),
);

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: "ra", label: "RA" },
  { key: "achievement", label: "达成率" },
  { key: "ds", label: "定数" },
  { key: "dx", label: "DX分" },
  { key: "playCount", label: "游玩" },
  { key: "id", label: "ID" },
  { key: "version", label: "版本" },
];

const selectedAccount = computed(() =>
  accounts.value.find((account) => account.index === selectedAccountIndex.value) || accounts.value[0] || null,
);

const versions = computed(() => {
  const set = new Set(allScores.value.map((score) => score.version).filter(Boolean));
  return Array.from(set).sort(compareVersions);
});

const filteredScores = computed(() => {
  const keyword = filters.search.trim().toLowerCase();
  return allScores.value
    .filter((score) => {
      if (filters.version && score.version !== filters.version) return false;
      if (filters.difficulty !== "" && score.levelIndex !== Number(filters.difficulty)) return false;
      if (filters.achievementMin !== undefined && score.achievement < Number(filters.achievementMin)) return false;
      if (filters.achievementMax !== undefined && score.achievement > Number(filters.achievementMax)) return false;
      if (filters.dsMin !== undefined && score.ds < Number(filters.dsMin)) return false;
      if (filters.dsMax !== undefined && score.ds > Number(filters.dsMax)) return false;
      if (filters.raMin !== undefined && score.rating < Number(filters.raMin)) return false;
      if (filters.raMax !== undefined && score.rating > Number(filters.raMax)) return false;
      if (!keyword) return true;
      const haystack = [
        score.musicId,
        score.title,
        score.artist,
        score.version,
        score.type,
        ...score.aliases,
      ].join(" ").toLowerCase();
      return haystack.includes(keyword);
    })
    .sort(compareScores);
});

const totalPages = computed(() => Math.max(Math.ceil(filteredScores.value.length / PAGE_SIZE), 1));

const displayedScores = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredScores.value.slice(start, start + PAGE_SIZE);
});

const formatAssetId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "000000";
  return String(value).slice(-6).padStart(6, "0");
};

const getIconUrl = (value?: number | string | null) =>
  `https://assets.breakdx.net/maimai/icon/UI_Icon_${formatAssetId(value)}.png`;

const AccountOption = defineComponent({
  name: "AccountOption",
  props: {
    account: { type: Object as () => AccountEntry, required: true },
  },
  setup(props) {
    return () =>
      h("div", { class: "account-option-inner" }, [
        h("img", {
          class: "account-avatar",
          src: getIconUrl(props.account.preview?.iconId),
          onError: (event: Event) => {
            (event.target as HTMLImageElement).src = "https://assets.breakdx.net/maimai/icon/UI_Icon_106004.png";
          },
        }),
        h("div", { class: "account-option-copy" }, [
          h("strong", props.account.displayName || props.account.preview?.userName || `UID ${props.account.uid}`),
          h("span", `UID ${props.account.uid}`),
        ]),
        h("b", { class: "rating-value" }, props.account.preview?.playerRating ?? "--"),
      ]);
  },
});

function compareVersions(left: string, right: string) {
  const leftIndex = getVersionIndex(left);
  const rightIndex = getVersionIndex(right);
  return leftIndex - rightIndex || left.localeCompare(right);
}

function getVersionIndex(version: string) {
  for (const alias of getVersionAliases(version)) {
    const index = versionOrderMap.get(alias);
    if (index !== undefined) return index;
  }
  return Number.MAX_SAFE_INTEGER;
}

function compareScores(left: ScoreCard, right: ScoreCard) {
  const leftMissingDs = left.ds <= 0;
  const rightMissingDs = right.ds <= 0;
  if (leftMissingDs !== rightMissingDs) return leftMissingDs ? 1 : -1;

  const direction = sortState.direction === "asc" ? 1 : -1;
  let result = 0;
  if (sortState.key === "ra") result = left.rating - right.rating;
  if (sortState.key === "achievement") result = left.achievement - right.achievement;
  if (sortState.key === "ds") result = left.ds - right.ds;
  if (sortState.key === "dx") result = left.dxRatio - right.dxRatio;
  if (sortState.key === "playCount") result = left.playCount - right.playCount;
  if (sortState.key === "id") result = Number(left.musicId) - Number(right.musicId);
  if (sortState.key === "version") result = compareVersions(left.version, right.version);
  return result * direction || right.achievement - left.achievement || right.rating - left.rating || Number(left.musicId) - Number(right.musicId);
}

const toggleSort = (key: SortKey) => {
  if (sortState.key === key) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
    return;
  }
  sortState.key = key;
  sortState.direction = key === "id" || key === "version" ? "asc" : "desc";
};

const resetFilters = () => {
  filters.search = "";
  filters.version = "";
  filters.difficulty = "";
  filters.achievementMin = undefined;
  filters.achievementMax = undefined;
  filters.dsMin = undefined;
  filters.dsMax = undefined;
  filters.raMin = undefined;
  filters.raMax = undefined;
  sortState.key = "ra";
  sortState.direction = "desc";
};

const normalizeAccounts = (payload: unknown) => {
  const root = payload as { data?: { data?: { accounts?: AccountEntry[]; switchIndex?: number } } };
  const data = root.data?.data || {};
  accounts.value = data.accounts || [];
  const current = accounts.value.find((account) => account.isCurrent) || accounts.value[data.switchIndex || 0];
  selectedAccountIndex.value = current?.index ?? null;
};

const fetchAccounts = async () => {
  loadingAccounts.value = true;
  try {
    const res = await maimaiApi.getAccounts();
    normalizeAccounts(res);
  } catch {
    accounts.value = [];
  } finally {
    loadingAccounts.value = false;
  }
};

const ensureFallbackAccount = (uid: number) => {
  if (accounts.value.length) return;
  accounts.value = [
    {
      uid,
      index: 0,
      isCurrent: true,
      displayName: `UID ${uid}`,
      preview: {},
    },
  ];
  selectedAccountIndex.value = 0;
};

const loadMusicData = async () => {
  const payload = await maimaiApi.getMusicData();
  songMap.value = new Map(payload.songs.map((song) => [String(song.id), song]));
  aliasMap.value = buildAliasMap(payload.aliases);
};

const buildAliasMap = (aliases: Record<string, MaimaiAliasEntry>) => {
  const map = new Map<string, string[]>();
  Object.entries(aliases || {}).forEach(([id, entry]) => {
    const values = [entry.Name, ...(entry.Alias || [])].filter(Boolean);
    map.set(String(id), values);
  });
  return map;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasScoreRows = (value: unknown) => {
  if (!isRecord(value)) return false;
  return ["scoreDocs", "list", "scores", "records"].some((key) => Array.isArray(value[key]));
};

const unwrapScoresPayload = (payload: unknown): ScoresPayload => {
  if (hasScoreRows(payload)) return payload as ScoresPayload;
  if (isRecord(payload) && hasScoreRows(payload.data)) return payload.data as ScoresPayload;
  if (isRecord(payload) && isRecord(payload.data) && hasScoreRows(payload.data.data)) {
    return payload.data.data as ScoresPayload;
  }
  return {};
};

const getScoresFromPayload = (payload: ScoresPayload) =>
  payload.scoreDocs || payload.list || payload.scores || payload.records || [];

const loadLocalScores = async () => {
  const response = await fetch(LOCAL_SCORE_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`读取 ${LOCAL_SCORE_URL} 失败`);
  return (await response.json()) as ScoresPayload;
};

const loadRemoteScoresPage = async (index: number, page: number, limit: number) => {
  const response = await maimaiApi.getScores(index, page, limit);
  return unwrapScoresPayload(response.data);
};

const loadRemoteScores = async (index: number) => {
  const pageLimit = PAGE_SIZE;
  const firstPayload = await loadRemoteScoresPage(index, 1, pageLimit);
  const firstRows = getScoresFromPayload(firstPayload);
  const total = Number(firstPayload.total || firstRows.length);
  const limit = Number(firstPayload.limit || pageLimit) || pageLimit;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  if (totalPages <= 1) return firstPayload;

  const restPayloads = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, itemIndex) => loadRemoteScoresPage(index, itemIndex + 2, limit)),
  );
  return {
    ...firstPayload,
    scoreDocs: [firstRows, ...restPayloads.map(getScoresFromPayload)].flat(),
    total,
    page: 1,
    limit,
  };
};

const fetchScores = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    await loadMusicData();
    let payload: ScoresPayload;
    if (selectedAccountIndex.value !== null) {
      try {
        payload = await loadRemoteScores(selectedAccountIndex.value);
      } catch {
        payload = await loadLocalScores();
      }
    } else {
      payload = await loadLocalScores();
    }
    const rows = getScoresFromPayload(payload);
    const uid = Number(payload.uid || rows[0]?.uid || 0);
    ensureFallbackAccount(uid);
    allScores.value = rows.map((row) => buildScoreCard(row, uid)).sort(compareScores);
    currentPage.value = 1;
    pageInput.value = 1;
  } catch (error) {
    allScores.value = [];
    loadError.value = (error as Error).message || "成绩缓存读取失败";
  } finally {
    loading.value = false;
  }
};

const getApiMessage = (payload: unknown) => {
  const data = payload as ApiEnvelope;
  return data.message || data.detail || "后端更新接口暂不可用";
};

const openScoreQrModal = () => {
  if (selectedAccountIndex.value === null) return;
  qrHint.value = "支持截图识别，也可以直接粘贴二维码原文。";
  showQrModal.value = true;
};

const refreshScores = async (qrcode: string) => {
  if (selectedAccountIndex.value === null) return;
  qrcode = qrcode.trim();
  if (!qrcode) return;

  refreshing.value = true;
  try {
    const response = await maimaiApi.refreshScores(selectedAccountIndex.value, qrcode);
    const body = response.data as ApiEnvelope;
    if (typeof body.returnCode === "number" && body.returnCode !== 0) {
      throw new Error(getApiMessage(body));
    }
    await fetchScores();
    showQrModal.value = false;
    qrText.value = "";
    await Swal.fire({
      title: "更新完成",
      text: "成绩已拉取、格式化并更新到数据库缓存。",
      icon: "success",
      timer: 1600,
      showConfirmButton: false,
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  } catch (error: any) {
    await Swal.fire({
      title: "更新失败",
      text: error.response?.data?.message || error.response?.data?.detail || error.message || "后端更新接口暂不可用",
      icon: "error",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  } finally {
    refreshing.value = false;
  }
};

const getDifficultyIndex = (score: RawScore) => Number(score.level ?? 0);

const normalizeCompactAchievement = (rawValue: number) => {
  const raw = Number(rawValue || 0);
  return raw > 1010 ? raw / 10000 : raw / 10;
};

const normalizeAchievement = (score: RawScore) => {
  if (score.achievementPercent !== undefined) {
    const percent = Number(score.achievementPercent);
    if (Number.isFinite(percent) && percent <= 101) return percent;
  }
  const raw = Number(score.achievement || 0);
  return normalizeCompactAchievement(raw);
};

const getRatingCoefficient = (achievement: number) => {
  if (achievement >= 100.5) return 22.4;
  if (achievement >= 100) return 21.6;
  if (achievement >= 99.5) return 21.1;
  if (achievement >= 99) return 20.8;
  if (achievement >= 98) return 20.3;
  if (achievement >= 97) return 20;
  if (achievement >= 94) return 16.8;
  if (achievement >= 90) return 15.2;
  if (achievement >= 80) return 13.6;
  if (achievement >= 75) return 12;
  if (achievement >= 70) return 11.2;
  if (achievement >= 60) return 9.6;
  if (achievement >= 50) return 8;
  return 0;
};

const calcRating = (ds: number, achievement: number) =>
  Math.floor((ds * Math.min(achievement, 100.5) * getRatingCoefficient(achievement)) / 100);

const getMaxDxScore = (song: MaimaiSongEntry | undefined, levelIndex: number) => {
  const chart = song?.charts?.[levelIndex];
  const fromData = Number(chart?.dxscore || 0);
  if (fromData > 0) return fromData;
  return (chart?.notes || []).reduce((sum, value) => sum + Number(value || 0), 0) * 3;
};

const getDxStars = (score: number, maxScore: number) => {
  if (!score || !maxScore) return 0;
  const percent = score / maxScore;
  if (percent >= 0.97) return 5;
  if (percent >= 0.95) return 4;
  if (percent >= 0.93) return 3;
  if (percent >= 0.90) return 2;
  if (percent >= 0.85) return 1;
  return 0;
};

const buildScoreCard = (raw: RawScore, fallbackUid: number): ScoreCard => {
  const musicId = String(raw.musicId);
  const uid = Number(raw.uid || fallbackUid || 0);
  const song = songMap.value.get(musicId);
  const levelIndex = getDifficultyIndex(raw);
  const meta = difficultyMeta.find((item) => item.level === levelIndex) || difficultyMeta[0];
  const achievement = normalizeAchievement(raw);
  const dxScore = Number(raw.dxScore ?? raw.deluxscore ?? raw.deluxscoreMax ?? 0);
  const maxDxScore = getMaxDxScore(song, levelIndex);
  const ds = Number(song?.ds?.[levelIndex] || 0);
  const aliases = aliasMap.value.get(musicId) || [];

  return {
    uid,
    musicId,
    scoreKey: raw.scoreKey || `${uid}:${musicId}:${levelIndex}`,
    title: song?.title || song?.basic_info?.title || `Music ${musicId}`,
    artist: song?.basic_info?.artist || "",
    version: song?.basic_info?.from || "未知版本",
    aliases,
    type: song?.type || "DX",
    levelIndex,
    difficultyKey: meta.key,
    difficultyLabel: meta.label,
    levelText: song?.level?.[levelIndex] || "-",
    ds,
    dsText: ds ? ds.toFixed(1).replace(/\.0$/, "") : "-",
    achievement,
    dxScore,
    maxDxScore,
    dxRatio: maxDxScore > 0 ? dxScore / maxDxScore : 0,
    dxStars: getDxStars(dxScore, maxDxScore),
    playCount: Number(raw.playCount || 0),
    comboStatus: Number(raw.comboStatus || 0),
    syncStatus: Number(raw.syncStatus || 0),
    rating: calcRating(ds, achievement),
  };
};

const selectAccount = async (index: number) => {
  selectedAccountIndex.value = index;
  accountMenuOpen.value = false;
  currentPage.value = 1;
  pageInput.value = 1;
  await fetchScores();
};

const goToPage = (page: number) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
  pageInput.value = currentPage.value;
};

const jumpToPage = () => goToPage(pageInput.value || 1);

const getCardStyle = (difficultyKey: string) => {
  const meta = difficultyMeta.find((item) => item.key === difficultyKey) || difficultyMeta[0];
  return {
    "--diff-secondary-a": meta.colors[0],
    "--diff-main": meta.colors[1],
    "--diff-secondary-b": meta.colors[2],
  };
};

const getCoverUrl = (id: string) => {
  const formattedId = id.slice(-4).padStart(6, "0");
  return `https://assets.breakdx.net/maimai/jacket/UI_Jacket_${formattedId}.png`;
};

const getRankName = (achievement: number) => {
  if (achievement >= 100.5) return "SSSp";
  if (achievement >= 100) return "SSS";
  if (achievement >= 99.5) return "SSp";
  if (achievement >= 99) return "SS";
  if (achievement >= 98) return "Sp";
  if (achievement >= 97) return "S";
  if (achievement >= 94) return "AAA";
  if (achievement >= 90) return "AA";
  if (achievement >= 80) return "A";
  if (achievement >= 75) return "BBB";
  if (achievement >= 70) return "BB";
  if (achievement >= 60) return "B";
  if (achievement >= 50) return "C";
  return "D";
};

const getRankImage = (achievement: number) => `/maimai/static/Rank_${getRankName(achievement)}.png`;

const getDxStarImage = (stars: number) => {
  const suffix = stars >= 5 ? "03" : stars >= 3 ? "02" : "01";
  return `/maimai/static/DXScore_Star_${suffix}.png`;
};

const formatAchievement = (value: number) => value.toFixed(4);

const getDifficultyImage = (levelIndex: number) => {
  const suffixMap: Record<number, string> = {
    0: "bas",
    1: "adv",
    2: "exp",
    3: "mas",
    4: "rem",
    10: "utage",
  };
  return `/maimai/static/diff_${suffixMap[levelIndex] || "bas"}.png`;
};

const getTypeImage = (type: string) => {
  const normalized = String(type || "").toLowerCase();
  return `/maimai/static/${normalized === "sd" ? "sd" : "dx"}.png`;
};

const getComboImage = (status: number) => {
  const suffixMap: Record<number, string> = {
    1: "fc",
    2: "fcp",
    3: "ap",
    4: "app",
  };
  const suffix = suffixMap[status];
  return suffix ? `/maimai/static/PlayBonus_${suffix}.png` : "";
};

const getSyncImage = (status: number) => {
  const suffixMap: Record<number, string> = {
    1: "fs",
    2: "fsp",
    3: "fsd",
    4: "fsdp",
    5: "sync",
  };
  const suffix = suffixMap[status];
  return suffix ? `/maimai/static/PlayBonus_${suffix}.png` : "";
};

const handleCoverError = (event: Event) => {
  (event.target as HTMLImageElement).src = "https://assets.breakdx.net/maimai/icon/UI_Icon_106004.png";
};

watch(
  () => ({ ...filters, sortKey: sortState.key, sortDirection: sortState.direction }),
  () => {
    currentPage.value = 1;
    pageInput.value = 1;
  },
);

onMounted(async () => {
  await fetchAccounts();
  await fetchScores();
});
</script>

<style scoped>
.scores-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  padding: 0 40px 40px;
}

.page-header,
.filter-panel,
.score-panel {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: var(--surface-color);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 28px;
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--primary-color);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.page-header h2 {
  margin: 0;
  color: var(--text-main);
  font-size: 2rem;
}

.subtitle {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: min(520px, 48%);
}

.account-select {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.select-trigger,
.select-option {
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: var(--bg-color);
  color: var(--text-main);
  cursor: pointer;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
}

.select-menu {
  position: absolute;
  inset-inline: 0;
  top: calc(100% + 8px);
  z-index: 20;
  display: grid;
  gap: 8px;
  max-height: 360px;
  overflow: auto;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: var(--surface-color);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.16);
}

.select-option {
  padding: 8px;
  text-align: left;
}

.select-option.active {
  outline: 2px solid rgba(255, 140, 0, 0.28);
}

.select-arrow {
  color: var(--text-muted);
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(90deg);
}

.account-option-inner {
  display: grid;
  grid-template-columns: 44px minmax(120px, max-content) auto;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.account-avatar {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.account-option-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.account-option-copy strong,
.account-option-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-option-copy span,
.score-toolbar span,
.pagination-bar {
  color: var(--text-muted);
}

.rating-value {
  justify-self: end;
  color: var(--primary-color);
}

.refresh-btn,
.page-btn,
.reset-btn,
.sort-btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 15px;
  font-weight: 900;
  cursor: pointer;
}

.refresh-btn,
.page-btn {
  background: var(--primary-color);
  color: #fff;
}

.reset-btn,
.sort-btn {
  background: var(--bg-color);
  color: var(--text-main);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.filter-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  border-radius: 16px;
  padding: 0 14px;
  background: var(--bg-color);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.search-shell input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-main);
  font: inherit;
}

.search-shell button {
  border: 0;
  background: transparent;
  color: var(--primary-color);
  font-weight: 900;
  cursor: pointer;
}

.search-icon {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.filter-group {
  display: grid;
  gap: 7px;
  min-width: 0;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 900;
}

.filter-group input,
.filter-group select {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--bg-color);
  color: var(--text-main);
  font: inherit;
}

.range-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.range-inputs i {
  color: var(--text-muted);
  font-style: normal;
}

.sort-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.sort-title {
  color: var(--text-muted);
  font-weight: 900;
}

.sort-button-row {
  display: flex;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
}

.sort-btn.active {
  border-color: rgba(255, 140, 0, 0.36);
  color: var(--primary-color);
}

.sort-arrows {
  display: inline-grid;
  gap: 0;
  color: rgba(148, 163, 184, 0.7);
  font-size: 0.66rem;
  line-height: 0.8;
}

.sort-arrows i {
  font-style: normal;
}

.sort-arrows i.active {
  color: var(--primary-color);
}

.score-panel {
  padding: 20px;
}

.score-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.score-toolbar div {
  display: grid;
  gap: 4px;
}

.score-toolbar strong {
  color: var(--text-main);
  font-size: 1.15rem;
}

.score-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  column-gap: 14px;
  row-gap: 20px;
  padding-top: 16px;
}

.score-card {
  position: relative;
  display: grid;
  grid-template-columns: 102px minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  min-height: 134px;
  overflow: visible;
  padding: 8px;
  border-radius: 14px;
  color: #fff;
  background:
    radial-gradient(circle at 2% 10%, rgba(255, 255, 255, 0.72), transparent 18%),
    linear-gradient(135deg, color-mix(in srgb, var(--diff-secondary-a) 58%, #fff 42%), var(--diff-main) 46%, var(--diff-secondary-b)),
    var(--diff-main);
  box-shadow: 0 14px 28px color-mix(in srgb, var(--diff-main) 22%, transparent);
}

.score-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.55);
}

.diff-rail {
  position: absolute;
  top: -9px;
  left: 12px;
  z-index: 5;
  width: auto;
  height: 20px;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 8px 10px rgba(15, 23, 42, 0.18));
}

.jacket-stack {
  position: relative;
  z-index: 2;
  align-self: stretch;
  display: grid;
  grid-template-rows: 1fr auto;
  align-items: center;
  justify-items: center;
  gap: 3px;
  width: 102px;
  min-width: 0;
}

.jacket {
  width: 102px;
  aspect-ratio: 1;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.18);
  transform: translateY(4px);
}

.jacket-meta-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px;
  width: 102px;
  min-width: 0;
}

.type-image {
  width: 54px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 3px 5px rgba(15, 23, 42, 0.22));
}

.score-copy {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  align-content: start;
  gap: 4px;
  min-width: 0;
}

.score-title-strip {
  display: flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.22);
  min-width: 0;
}

.score-title-strip h3 {
  margin: 0;
  min-width: 0;
  color: #fff;
  font-size: 0.9rem;
  line-height: 1.1;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.16);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.achievement-value {
  color: #fff;
  font-size: clamp(1.65rem, 4.2vw, 2.38rem);
  line-height: 0.98;
  letter-spacing: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-detail-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: rgba(255, 255, 255, 0.96);
  font-size: 0.98rem;
  font-weight: 900;
  white-space: nowrap;
  overflow: hidden;
}

.score-detail-line span,
.score-detail-line b {
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-bottom-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  margin-top: 2px;
  align-self: end;
}

.song-id,
.bonus-slot,
.play-count,
.dx-stars {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
  border-radius: 999px;
  padding: 2px 7px;
  background: rgba(255, 255, 255, 0.86);
  color: color-mix(in srgb, var(--diff-main) 70%, #4b5563 30%);
  font-weight: 900;
  font-size: 0.78rem;
  min-width: 0;
  max-width: 100%;
}

.song-id {
  border-radius: 6px;
  min-height: 18px;
  min-width: 0;
  padding: 0 5px;
  color: var(--diff-main);
  line-height: 1;
}

.rank-image {
  height: 32px;
  width: auto;
  flex: 0 0 auto;
}

.bonus-slot {
  width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.56);
  transform: translateX(-2px);
}

.play-count {
  color: #6366f1;
  letter-spacing: 0;
}

.bonus-slot img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  max-width: none;
}

.dx-stars {
  position: relative;
  isolation: isolate;
  overflow: visible;
  gap: 3px;
  margin-left: auto;
  padding-right: 4px;
  background: rgba(255, 255, 255, 0.86);
}

.play-count {
  transform: translateX(-3px);
}

.dx-stars img {
  position: relative;
  z-index: 0;
  height: 22px;
  width: auto;
  margin-left: -3px;
  pointer-events: none;
}

.dx-stars span {
  position: relative;
  z-index: 3;
  padding: 0 2px;
  overflow: visible;
}

.song-id,
.bonus-slot,
.play-count,
.dx-stars span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-jump input {
  width: 82px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 9px 10px;
  background: var(--bg-color);
  color: var(--text-main);
}

.state-box {
  display: grid;
  place-items: center;
  min-height: 76px;
  border-radius: 16px;
  color: var(--text-muted);
  background: var(--bg-color);
  text-align: center;
}

.state-box.large {
  min-height: 220px;
}

.state-box.error {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.08);
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

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .scores-page {
    padding: 0 24px 32px;
  }

  .page-header,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    min-width: 0;
    width: 100%;
  }

  .account-select {
    min-width: 0;
  }
}

@media (max-width: 680px) {
  .scores-page {
    padding: 0 14px 24px;
  }

  .page-header,
  .filter-panel,
  .score-panel {
    border-radius: 18px;
  }

  .filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .score-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .sort-panel,
  .pagination-bar,
  .page-jump {
    align-items: stretch;
    flex-direction: column;
  }

  .score-card {
    grid-template-columns: 86px minmax(0, 1fr);
    padding: 8px;
  }

  .diff-rail {
    top: -7px;
    left: 10px;
    height: 24px;
  }

  .jacket {
    width: 86px;
    max-width: 86px;
    height: auto;
    border-radius: 10px;
  }

  .jacket-stack {
    width: 86px;
    gap: 2px;
  }

  .jacket-meta-row {
    width: 86px;
    gap: 3px;
  }

  .type-image {
    width: 46px;
  }

  .achievement-value {
    font-size: 1.45rem;
  }

  .score-detail-line {
    gap: 7px;
    font-size: 0.84rem;
  }

  .score-bottom-row {
    gap: 4px;
  }

  .rank-image {
    height: 28px;
  }

  .bonus-slot {
    width: 28px;
    height: 28px;
    min-height: 28px;
  }

  .bonus-slot img {
    width: 34px;
    height: 34px;
  }
}
</style>
