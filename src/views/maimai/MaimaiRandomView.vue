<template>
  <main class="content-area">
        <section class="page-header">
          <div class="header-copy">
            <span class="page-kicker">Maimai Random Picker</span>
            <h2>随机选曲</h2>
            <p class="subtitle">只是一个随机选曲</p>
          </div>
        </section>

        <section class="control-panel">
          <div class="toolbar-row">
            <label class="search-shell">
              <span class="search-icon">⌕</span>
              <input
                v-model="filters.search"
                type="text"
                placeholder="搜索曲名、别名或艺术家..."
                class="main-search-input"
              />
            </label>

            <div class="draw-count-group">
              <span class="count-label">随机数量</span>
              <input
                v-model.number="drawCount"
                type="number"
                min="1"
                :max="maxDrawCount"
                class="count-select"
                @blur="normalizeDrawCount"
              />
              <span class="count-tip">当前最多可随机 {{ maxDrawCount }} 首</span>
            </div>

            <button class="action-btn" type="button" :disabled="loading || !filteredSongs.length" @click="drawRandomSongs">
              {{ randomResults.length ? "重新随机" : "开始随机" }}
            </button>
          </div>

          <div class="scope-row">
            <div class="scope-card">
              <span class="scope-label">当前范围</span>
              <strong>{{ filteredSongs.length }}</strong>
              <span class="scope-desc">首可参与随机</span>
            </div>
            <div class="scope-card">
              <span class="scope-label">本次数量</span>
              <strong>{{ actualDrawCount }}</strong>
              <span class="scope-desc">首会出现在结果区</span>
            </div>
            <button class="ghost-btn" type="button" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? "收起筛选" : "展开筛选" }}
            </button>
            <button class="ghost-btn" type="button" @click="resetFilters">
              清空筛选
            </button>
          </div>
        </section>

        <transition name="expand">
          <section v-show="showAdvanced" class="advanced-filter-panel">
            <div class="filter-grid">
              <div class="filter-group">
                <label>版本</label>
                <select v-model="filters.version">
                  <option value="">全部</option>
                  <option v-for="v in versions" :key="v" :value="v">{{ v }}</option>
                </select>
              </div>

              <div class="filter-group">
                <label>流派</label>
                <select v-model="filters.genre">
                  <option value="">全部</option>
                  <option v-for="g in genres" :key="g" :value="g">{{ g }}</option>
                </select>
              </div>

              <div class="filter-group">
                <label>类型</label>
                <select v-model="filters.type">
                  <option value="">全部</option>
                  <option value="SD">Standard (SD)</option>
                  <option value="DX">Deluxe (DX)</option>
                </select>
              </div>

              <div class="filter-group range-filter">
                <label>BPM</label>
                <div class="range-inputs">
                  <input v-model.number="filters.bpmMin" type="number" placeholder="最小" />
                  <span>-</span>
                  <input v-model.number="filters.bpmMax" type="number" placeholder="最大" />
                </div>
              </div>

              <div class="filter-group range-filter">
                <label>等级</label>
                <div class="range-inputs">
                  <select v-model="filters.levelMin">
                    <option value="">不限</option>
                    <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
                  </select>
                  <span>-</span>
                  <select v-model="filters.levelMax">
                    <option value="">不限</option>
                    <option v-for="l in levels" :key="l" :value="l">{{ l }}</option>
                  </select>
                </div>
              </div>

              <div class="filter-group ds-filter">
                <label>定数范围</label>
                <div class="ds-controls">
                  <select v-model.number="filters.dsDiff" class="diff-select">
                    <option :value="0">Basic</option>
                    <option :value="1">Advanced</option>
                    <option :value="2">Expert</option>
                    <option :value="3">Master</option>
                    <option :value="4">Re:Master</option>
                  </select>
                  <div class="range-inputs">
                    <input v-model.number="filters.dsMin" type="number" step="0.1" placeholder="最小" />
                    <span>-</span>
                    <input v-model.number="filters.dsMax" type="number" step="0.1" placeholder="最大" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </transition>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在同步曲库数据...</p>
        </div>

        <div v-else-if="!filteredSongs.length" class="empty-state">
          <div class="empty-icon">◎</div>
          <p>当前筛选条件下没有可随机的乐曲，换个范围试试。</p>
        </div>

        <section v-else class="result-panel">
          <div class="result-header">
            <div>
              <h3>预备展示区</h3>
              <p>{{ randomResults.length ? `已随机抽出 ${randomResults.length} 首乐曲` : "点击上方按钮开始随机" }}</p>
            </div>
            <div v-if="randomResults.length" class="page-badge">
              第 {{ currentPage }} / {{ totalPages }} 页
            </div>
          </div>

          <div v-if="randomResults.length > PAGE_SIZE" class="result-limit-tip">
            当前共随机出 {{ randomResults.length }} 首乐曲，结果区按每页 {{ PAGE_SIZE }} 首分页展示。
          </div>

          <div v-if="!randomResults.length" class="result-placeholder">
            <p>你可以直接全曲库随机，也可以先筛选版本、等级、定数，再开始抽。</p>
          </div>

          <div v-else class="result-grid">
            <article v-for="song in pagedRandomResults" :key="getSongKey(song)" class="result-card">
              <div class="result-cover-wrap">
                <img :src="getCoverUrl(song.id)" alt="Cover" class="result-cover" @error="handleImgError" />
                <span class="song-type-badge" :class="song.type.toLowerCase()">{{ song.type }}</span>
              </div>

              <div class="result-info">
                <div class="result-topline">
                  <span class="song-version-badge" :class="getVersionThemeClass(song.basic_info.from)">
                    {{ song.basic_info.from }}
                  </span>
                  <span class="song-id-badge">#{{ song.id }}</span>
                </div>
                <h4 class="result-title">{{ song.title }}</h4>
                <p class="result-artist">{{ song.basic_info.artist }}</p>

                <div class="result-meta">
                  <span>{{ song.basic_info.genre }}</span>
                  <span>BPM {{ song.basic_info.bpm }}</span>
                </div>

                <div class="difficulty-row">
                  <div
                    v-for="(lv, idx) in song.level"
                    :key="idx"
                    class="diff-badge"
                    :class="`diff-${idx}`"
                  >
                    <span class="diff-short">{{ getDiffNameShort(idx) }}</span>
                    <span class="lv-text">{{ lv }}</span>
                    <span v-if="song.ds[idx] !== undefined" class="ds-text">{{ song.ds[idx].toFixed(1) }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-if="randomResults.length > PAGE_SIZE" class="pagination-bar">
            <button class="ghost-btn" type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
              上一页
            </button>
            <div class="pagination-info">
              <span
                v-for="page in visiblePages"
                :key="page"
                class="page-chip"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </span>
            </div>
            <button class="ghost-btn" type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">
              下一页
            </button>
          </div>
        </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { maimaiApi } from "@/api/maimai";

interface Song {
  id: string;
  title: string;
  type: string;
  level: string[];
  ds: number[];
  charts: {
    notes: number[];
    charter: string;
    dxscore?: number;
  }[];
  basic_info: {
    title: string;
    artist: string;
    genre: string;
    bpm: number;
    from: string;
  };
  aliases?: string[];
}

const loading = ref(true);
const showAdvanced = ref(false);
const drawCount = ref(1);
const PAGE_SIZE = 20;
const currentPage = ref(1);
const allSongs = ref<Song[]>([]);
const randomResults = ref<Song[]>([]);
const aliases = ref<Record<string, { Name: string; Alias: string[] }>>({});
const versions = ref<string[]>([]);
const genres = ref<string[]>([]);

const filters = reactive({
  search: "",
  version: "",
  genre: "",
  type: "",
  bpmMin: null as number | null,
  bpmMax: null as number | null,
  levelMin: "",
  levelMax: "",
  dsMin: null as number | null,
  dsMax: null as number | null,
  dsDiff: 3,
});

const levels = [
  "1", "2", "3", "4", "5", "6", "7", "7+", "8", "8+", "9", "9+",
  "10", "10+", "11", "11+", "12", "12+", "13", "13+", "14", "14+", "15",
];

const getSongKey = (song: Song) => `${song.id}-${song.type}`;

const getLevelValue = (level: string) => {
  if (!level) return null;
  let value = parseInt(level, 10);
  if (level.includes("+")) value += 0.7;
  return value;
};

const getLevelUpperBound = (level: string) => {
  const value = getLevelValue(level);
  if (value === null) return null;
  return level.includes("+") ? Math.floor(value) + 0.9 : Math.floor(value) + 0.5;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const data = await maimaiApi.getMusicData();
    allSongs.value = data.songs;
    aliases.value = data.aliases;

      const versionSet = new Set<string>();
      const genreSet = new Set<string>();

      allSongs.value.forEach((song) => {
        if (song.basic_info.from) versionSet.add(song.basic_info.from);
        if (song.basic_info.genre) genreSet.add(song.basic_info.genre);

        const aliasEntry = aliases.value[song.id];
        if (aliasEntry) {
          song.aliases = aliasEntry.Alias;
        }
      });

    versions.value = Array.from(versionSet).sort();
    genres.value = Array.from(genreSet);
  } catch (error) {
    console.error("Failed to fetch music data:", error);
  } finally {
    loading.value = false;
  }
};

const filteredSongs = computed(() => {
  let result = allSongs.value;

  if (filters.search) {
    const keyword = filters.search.toLowerCase();
    result = result.filter((song) => {
      const matchTitle = song.title.toLowerCase().includes(keyword);
      const matchArtist = song.basic_info.artist.toLowerCase().includes(keyword);
      const matchAlias = song.aliases?.some((alias) => alias.toLowerCase().includes(keyword));
      return matchTitle || matchArtist || matchAlias;
    });
  }

  if (filters.version) {
    result = result.filter((song) => song.basic_info.from === filters.version);
  }

  if (filters.genre) {
    result = result.filter((song) => song.basic_info.genre === filters.genre);
  }

  if (filters.type) {
    result = result.filter((song) => song.type === filters.type);
  }

  if (filters.bpmMin !== null) {
    result = result.filter((song) => song.basic_info.bpm >= filters.bpmMin!);
  }

  if (filters.bpmMax !== null) {
    result = result.filter((song) => song.basic_info.bpm <= filters.bpmMax!);
  }

  if (filters.levelMin || filters.levelMax) {
    const minValue = getLevelValue(filters.levelMin);
    const maxValue = filters.levelMax ? getLevelUpperBound(filters.levelMax) : null;

    result = result.filter((song) =>
      song.level.some((level) => {
        const value = getLevelValue(level);
        if (value === null) return false;
        if (minValue !== null && value < minValue) return false;
        if (maxValue !== null && value > maxValue) return false;
        return true;
      }),
    );
  }

  if (filters.dsMin !== null || filters.dsMax !== null) {
    const diffIdx = filters.dsDiff;
    result = result.filter((song) => {
      if (!song.ds || song.ds.length <= diffIdx) return false;
      const value = song.ds[diffIdx];
      if (filters.dsMin !== null && value < filters.dsMin) return false;
      if (filters.dsMax !== null && value > filters.dsMax) return false;
      return true;
    });
  }

  return [...result].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
});

const maxDrawCount = computed(() => Math.max(filteredSongs.value.length, 1));
const actualDrawCount = computed(() =>
  Math.min(Math.max(drawCount.value || 1, 1), filteredSongs.value.length),
);
const totalPages = computed(() => Math.max(Math.ceil(randomResults.value.length / PAGE_SIZE), 1));
const pagedRandomResults = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return randomResults.value.slice(start, start + PAGE_SIZE);
});
const visiblePages = computed(() => {
  const total = totalPages.value;
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(total, start + 4);
  const pages: number[] = [];
  for (let page = Math.max(1, end - 4); page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
});

const normalizeDrawCount = () => {
  drawCount.value = Math.min(
    Math.max(Number(drawCount.value) || 1, 1),
    maxDrawCount.value,
  );
};

const goToPage = (page: number) => {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value);
};

watch(
  () => ({ ...filters }),
  () => {
    randomResults.value = [];
    currentPage.value = 1;
    normalizeDrawCount();
  },
  { deep: true },
);

const drawRandomSongs = () => {
  if (!filteredSongs.value.length) {
    randomResults.value = [];
    return;
  }

  const shuffled = [...filteredSongs.value];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  randomResults.value = shuffled.slice(0, actualDrawCount.value);
  currentPage.value = 1;
};

const resetFilters = () => {
  filters.search = "";
  filters.version = "";
  filters.genre = "";
  filters.type = "";
  filters.bpmMin = null;
  filters.bpmMax = null;
  filters.levelMin = "";
  filters.levelMax = "";
  filters.dsMin = null;
  filters.dsMax = null;
  filters.dsDiff = 3;
  randomResults.value = [];
  currentPage.value = 1;
};

const getCoverUrl = (id: string) => {
  const formattedId = id.slice(-4).padStart(6, "0");
  return `http://assets.fangchang.asia/maimai/jacket/UI_Jacket_${formattedId}.png`;
};

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = "https://placehold.co/240x240/f2fbff/ff8c00?text=Maimai";
};

const getVersionThemeClass = (version: string) => {
  const normalized = version.toUpperCase();
  if (normalized.includes("CIRCLE")) return "theme-circle";
  if (normalized.includes("BUDDIES")) return "theme-buddies";
  if (normalized.includes("FESTIVAL")) return "theme-festival";
  if (normalized.includes("UNIVERSE")) return "theme-universe";
  if (normalized.includes("SPLASH")) return "theme-splash";
  if (normalized.includes("DX")) return "theme-dx";
  if (normalized.includes("MILK")) return "theme-milk";
  if (normalized.includes("MURASAKI")) return "theme-murasaki";
  if (normalized.includes("PINK")) return "theme-pink";
  if (normalized.includes("ORANGE")) return "theme-orange";
  if (normalized.includes("GREEN")) return "theme-green";
  return "theme-default";
};

const getDiffNameShort = (idx: number) => {
  const names = ["BAS", "ADV", "EXP", "MAS", "ReM"];
  return names[idx] || "??";
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 196, 61, 0.16), transparent 24%),
    radial-gradient(circle at left top, rgba(45, 212, 191, 0.12), transparent 22%),
    linear-gradient(180deg, #fffdf9 0%, #f7fbff 54%, #f5fbf8 100%);
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
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 40px 40px;
  min-width: 0;
}

.page-header,
.control-panel,
.advanced-filter-panel,
.result-panel {
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.page-header {
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.18), transparent 18%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
}

.page-kicker {
  display: inline-flex;
  padding: 6px 12px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: rgba(251, 146, 60, 0.12);
  color: #ea580c;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 2rem;
  color: #0f172a;
}

.subtitle {
  margin: 0;
  max-width: 66ch;
  color: #64748b;
  line-height: 1.7;
}

.control-panel,
.advanced-filter-panel,
.result-panel {
  padding: 24px;
  overflow: visible;
}

.toolbar-row,
.scope-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.scope-row {
  margin-top: 18px;
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: min(100%, 280px);
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 196, 61, 0.18);
  background: #fff;
}

.search-icon {
  color: #f59e0b;
  font-weight: 900;
}

.main-search-input,
.filter-group select,
.filter-group input,
.count-select {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.main-search-input {
  padding: 16px 0;
}

.draw-count-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 120px;
}

.count-tip {
  color: #94a3b8;
  font-size: 0.76rem;
}

.count-label,
.scope-label,
.filter-group label {
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.count-select,
.filter-group select,
.filter-group input {
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #f8fbff;
  box-sizing: border-box;
}

.filter-group select {
  appearance: auto;
  -webkit-appearance: menulist;
  font-size: 16px;
  line-height: 1.2;
  position: relative;
  z-index: 3;
}

.action-btn,
.ghost-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 800;
  cursor: pointer;
}

.action-btn {
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.2);
}

.ghost-btn {
  background: #f8fbff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.action-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scope-card {
  min-width: 132px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f8fbff;
}

.scope-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.45rem;
}

.scope-desc {
  color: #94a3b8;
  font-size: 0.8rem;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.range-filter {
  grid-column: span 2;
}

.ds-filter {
  grid-column: 1 / -1;
}

.range-inputs,
.ds-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs input,
.range-inputs select {
  flex: 1;
}

.diff-select {
  flex: 0 0 140px;
}

.loading-state,
.empty-state,
.result-placeholder,
.result-limit-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 240px;
  padding: 24px;
  border-radius: 24px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.72);
  color: #64748b;
  text-align: center;
}

.result-limit-tip {
  min-height: auto;
  margin: 16px 0 0;
  padding: 14px 16px;
  border-style: solid;
  background: rgba(255, 247, 237, 0.92);
  color: #c2410c;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(148, 163, 184, 0.2);
  border-top-color: #fb8500;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: rgba(251, 146, 60, 0.12);
  color: #ea580c;
  font-size: 2rem;
}

.result-header h3 {
  margin: 0;
  color: #0f172a;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.page-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 800;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.page-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  color: #475569;
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
}

.page-chip.active {
  background: linear-gradient(135deg, #fb923c, #f97316);
  border-color: transparent;
  color: #fff;
}

.result-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.result-cover-wrap {
  position: relative;
}

.result-cover {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff3bf, #d7f9ff);
}

.song-type-badge {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 999px;
  color: #fff;
  font-size: 0.76rem;
  font-weight: 900;
}

.song-type-badge.sd {
  background: linear-gradient(135deg, #38bdf8, #2563eb);
}

.song-type-badge.dx {
  background: linear-gradient(135deg, #a855f7, #7c3aed);
}

.result-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.song-id-badge,
.song-version-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
}

.song-id-badge {
  background: rgba(148, 163, 184, 0.12);
  color: #475569;
}

.song-version-badge {
  border: 1px solid transparent;
}

.song-version-badge.theme-default { background: rgba(45, 212, 191, 0.12); color: #0f766e; }
.song-version-badge.theme-circle { background: rgba(236, 72, 153, 0.14); border-color: rgba(236, 72, 153, 0.2); color: #be185d; }
.song-version-badge.theme-buddies { background: rgba(249, 115, 22, 0.14); border-color: rgba(249, 115, 22, 0.2); color: #c2410c; }
.song-version-badge.theme-festival { background: rgba(234, 179, 8, 0.16); border-color: rgba(234, 179, 8, 0.2); color: #a16207; }
.song-version-badge.theme-universe { background: rgba(59, 130, 246, 0.14); border-color: rgba(59, 130, 246, 0.2); color: #1d4ed8; }
.song-version-badge.theme-splash { background: rgba(6, 182, 212, 0.14); border-color: rgba(6, 182, 212, 0.2); color: #0f766e; }
.song-version-badge.theme-dx { background: rgba(168, 85, 247, 0.14); border-color: rgba(168, 85, 247, 0.2); color: #7e22ce; }
.song-version-badge.theme-milk { background: rgba(148, 163, 184, 0.14); border-color: rgba(148, 163, 184, 0.2); color: #475569; }
.song-version-badge.theme-murasaki { background: rgba(192, 132, 252, 0.14); border-color: rgba(192, 132, 252, 0.2); color: #9333ea; }
.song-version-badge.theme-pink { background: rgba(244, 114, 182, 0.14); border-color: rgba(244, 114, 182, 0.2); color: #db2777; }
.song-version-badge.theme-orange { background: rgba(251, 146, 60, 0.14); border-color: rgba(251, 146, 60, 0.2); color: #ea580c; }
.song-version-badge.theme-green { background: rgba(34, 197, 94, 0.14); border-color: rgba(34, 197, 94, 0.2); color: #15803d; }

.result-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  line-height: 1.4;
}

.result-artist,
.result-meta {
  margin: 0;
  color: #64748b;
}

.result-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.84rem;
}

.difficulty-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.diff-badge {
  display: grid;
  justify-items: center;
  gap: 2px;
  min-width: 52px;
  padding: 8px 8px 7px;
  border-radius: 14px;
  color: #fff;
}

.diff-short {
  font-size: 0.56rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  opacity: 0.9;
}

.lv-text {
  font-size: 0.88rem;
  font-weight: 900;
}

.ds-text {
  font-size: 0.68rem;
  opacity: 0.92;
}

.diff-0 { background: linear-gradient(180deg, #22c55e, #16a34a); }
.diff-1 { background: linear-gradient(180deg, #facc15, #eab308); }
.diff-2 { background: linear-gradient(180deg, #fb7185, #ef4444); }
.diff-3 { background: linear-gradient(180deg, #a855f7, #7e22ce); }
.diff-4 { background: linear-gradient(180deg, #f472b6, #db2777); }

.expand-enter-active,
.expand-leave-active {
  overflow: hidden;
  transition: max-height 0.28s ease, opacity 0.24s ease;
  max-height: 800px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

[data-theme="dark"] .app-layout {
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.1), transparent 22%),
    radial-gradient(circle at left top, rgba(45, 212, 191, 0.08), transparent 24%),
    linear-gradient(180deg, #0f172a 0%, #111827 52%, #0b1220 100%);
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .control-panel,
[data-theme="dark"] .advanced-filter-panel,
[data-theme="dark"] .result-panel,
[data-theme="dark"] .result-card,
[data-theme="dark"] .scope-card,
[data-theme="dark"] .loading-state,
[data-theme="dark"] .empty-state,
[data-theme="dark"] .result-placeholder,
[data-theme="dark"] .search-shell,
[data-theme="dark"] .page-chip,
[data-theme="dark"] .ghost-btn,
[data-theme="dark"] .count-select,
[data-theme="dark"] .filter-group select,
[data-theme="dark"] .filter-group input {
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
[data-theme="dark"] .result-header h3,
[data-theme="dark"] .scope-card strong,
[data-theme="dark"] .result-title,
[data-theme="dark"] .main-search-input {
  color: #e2e8f0;
}

[data-theme="dark"] .subtitle,
[data-theme="dark"] .count-tip,
[data-theme="dark"] .count-label,
[data-theme="dark"] .scope-label,
[data-theme="dark"] .scope-desc,
[data-theme="dark"] .filter-group label,
[data-theme="dark"] .result-header p,
[data-theme="dark"] .result-artist,
[data-theme="dark"] .result-meta,
[data-theme="dark"] .song-id-badge {
  color: #94a3b8;
}

[data-theme="dark"] .result-limit-tip {
  background: rgba(120, 53, 15, 0.36);
  border-color: rgba(249, 115, 22, 0.24);
  color: #fdba74;
}

[data-theme="dark"] .page-badge {
  background: rgba(29, 78, 216, 0.24);
  color: #93c5fd;
}

[data-theme="dark"] .song-id-badge {
  background: rgba(30, 41, 59, 0.9);
}

[data-theme="dark"] .result-cover {
  background: linear-gradient(135deg, #2d1b0d, #102a43);
}

@media (max-width: 1200px) {
  .main-wrapper {
    margin-left: 260px;
  }

  .filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .range-filter,
  .ds-filter {
    grid-column: span 2;
  }
}

@media (max-width: 1024px) {
  .main-wrapper {
    margin-left: 0;
  }

  .content-area {
    padding: 0 20px 24px;
  }
}

@media (max-width: 768px) {
  .content-area {
    padding: 0 16px 20px;
  }

  .page-header,
  .control-panel,
  .advanced-filter-panel,
  .result-panel {
    padding: 18px;
    border-radius: 22px;
  }

  .toolbar-row,
  .scope-row {
    align-items: stretch;
  }

  .search-shell,
  .draw-count-group,
  .action-btn,
  .ghost-btn {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .range-filter,
  .ds-filter {
    grid-column: span 1;
  }

  .ds-controls {
    flex-direction: column;
  }

  .diff-select {
    flex: 1 1 auto;
    width: 100%;
  }

  .result-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
