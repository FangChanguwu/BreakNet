<template>
  <div class="app-layout">
    <LayoutSidebar />

    <div class="main-wrapper">
      <LayoutHeader />

      <main class="content-area">
        <div class="page-header">
          <div class="title-section">
            <h2>🎵 舞萌乐曲查询</h2>
            <p class="subtitle">Stop playing Maimai.</p>
          </div>
          <div class="search-box-wrapper">
            <input
              v-model="filters.search"
              type="text"
              placeholder="搜索曲名、别名或艺术家..."
              class="main-search-input"
            />
            <button class="filter-toggle-btn" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? '收起筛选' : '高级筛选' }}
              <span class="arrow" :class="{ 'up': showAdvanced }">▼</span>
            </button>
          </div>
        </div>

        <!-- 高级筛选面板 -->
        <transition name="expand">
          <div v-show="showAdvanced" class="advanced-filter-panel">
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

              <div class="filter-group">
                <label>BPM 范围</label>
                <div class="range-inputs">
                  <input v-model.number="filters.bpmMin" type="number" placeholder="最小" />
                  <span>-</span>
                  <input v-model.number="filters.bpmMax" type="number" placeholder="最大" />
                </div>
              </div>

              <div class="filter-group">
                <label>等级范围</label>
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
                <label>定数筛选 (针对特定难度)</label>
                <div class="ds-controls">
                  <select v-model="filters.dsDiff" class="diff-select">
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
              
              <div class="filter-group toggle-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="filters.showUtage" />
                  显示宴谱
                </label>
              </div>
            </div>
            <div class="filter-actions">
              <button class="reset-btn" @click="resetFilters">重置全部筛选</button>
            </div>
          </div>
        </transition>

        <!-- 乐曲列表 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>正在同步曲库数据...</p>
        </div>

        <div v-else-if="filteredSongs.length === 0" class="empty-state">
          <div class="empty-icon">📂</div>
          <p>没找到符合条件的乐曲呢...</p>
          <button class="reset-btn" @click="resetFilters">清空筛选条件</button>
        </div>

        <div v-else class="song-list-container">
          <div class="result-stats">
            共找到 <b>{{ filteredSongs.length }}</b> 首乐曲
          </div>
          
          <div class="song-grid">
            <div 
              v-for="song in displayedSongs" 
              :key="song.id + song.type" 
              class="song-card"
              :class="{ 'is-expanded': expandedId === song.id }"
              @click="toggleCard(song.id)"
            >
              <div class="card-inner">
                <div class="song-id-badge">#{{ song.id }}</div>
                <div class="card-main-row">
                  <div class="cover-wrapper">
                  <img 
                    :key="song.id"
                    :src="getCoverUrl(song.id)" 
                    alt="Cover" 
                    class="song-cover"
                    loading="lazy"
                    @error="handleImgError"
                  />
                  <div class="song-type-badge" :class="song.type.toLowerCase()">
                    <span class="badge-text">{{ song.type }}</span>
                  </div>
                </div>
                <div class="song-info">
                  <h3 class="song-title" :title="song.title">{{ song.title }}</h3>
                  <p class="song-artist" :title="song.basic_info.artist">{{ song.basic_info.artist }}</p>
                  
                  <div class="song-tags">
                    <span class="genre-tag">{{ song.basic_info.genre }}</span>
                    <span class="bpm-tag">BPM: {{ song.basic_info.bpm }}</span>
                  </div>

                  <div class="difficulty-row">
                    <div 
                      v-for="(lv, idx) in song.level" 
                      :key="idx"
                      class="diff-badge"
                      :class="`diff-${idx}`"
                    >
                      <span class="lv-text">{{ lv }}</span>
                      <span class="ds-text" v-if="song.ds && song.ds[idx]">({{ (song.ds[idx]).toFixed(1) }})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <!-- 展开详情区域 -->
              <transition name="expand">
                <div v-if="expandedId === song.id" class="song-expanded-detail" @click.stop>
                  <div class="detail-section">
                    <h4>📊 物量统计 (Notes)</h4>
                    <div class="notes-table-wrapper">
                      <table class="detail-table">
                        <thead>
                          <tr>
                            <th>难度</th>
                            <th>Tap</th>
                            <th>Hold</th>
                            <th>Slide</th>
                            <th>Touch</th>
                            <th>Break</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(_lv, idx) in song.level" :key="idx" :class="`row-diff-${idx}`">
                            <td class="diff-name">{{ getDiffName(idx) }}</td>
                            <template v-if="song.charts && song.charts[idx]">
                              <td v-for="(n, nIdx) in formatNotes(song.charts[idx].notes)" :key="nIdx">{{ n }}</td>
                              <td class="total-notes">{{ getTotalNotes(song.charts[idx].notes) }}</td>
                            </template>
                            <td v-else colspan="6" class="no-data">- 暂无数据 -</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="detail-section">
                    <h4>📈 Rating 对照表 (整数分)</h4>
                    <div class="rating-table-wrapper">
                      <table class="detail-table rating-table">
                        <thead>
                          <tr>
                            <th>达成率</th>
                            <th v-for="(ds, idx) in song.ds" :key="idx" :class="`col-diff-${idx}`">
                              {{ getDiffNameShort(idx) }} ({{ ds.toFixed(1) }})
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="threshold in ratingThresholds" :key="threshold.rank + threshold.ach" :class="threshold.class">
                            <td class="rank-cell">
                              <span class="rank-name">{{ threshold.rank }}</span>
                              <span class="rank-ach">{{ threshold.ach }}%</span>
                            </td>
                            <td v-for="(ds, idx) in song.ds" :key="idx">
                              {{ calcRating(ds, threshold.ach, threshold.coeff) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p class="rating-tip">* 计算不遵循四舍五入，直接取整数部分。包含 AP (+1分) 修正。</p>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div v-show="hasMore" ref="loadMoreRef" class="load-more">
            <div class="loading-more-spinner"></div>
            <p>正在努力加载更多内容...</p>
          </div>
        </div>
      </main>

      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
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
const expandedId = ref<string | null>(null);
const allSongs = ref<Song[]>([]);
const aliases = ref<Record<string, { Name: string; Alias: string[] }>>({});

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
  dsDiff: 3, // 默认 Master 难度
  showUtage: false
});

const versions = ref<string[]>([]);
const genres = ref<string[]>([]);
const levels = [
  "1", "2", "3", "4", "5", "6", "7", "7+", "8", "8+", "9", "9+", 
  "10", "10+", "11", "11+", "12", "12+", "13", "13+", "14", "14+", "15"
];

// Rating 计算阈值
const ratingThresholds = [
  { rank: "SSS+", ach: 100.5, coeff: 22.4, class: "rank-sssp" },
  { rank: "SSS", ach: 100.4999, coeff: 22.2, class: "rank-sss" },
  { rank: "SSS", ach: 100.0, coeff: 21.6, class: "rank-sss" },
  { rank: "SS+", ach: 99.9999, coeff: 21.4, class: "rank-ssp" },
  { rank: "SS+", ach: 99.5, coeff: 21.1, class: "rank-ssp" },
  { rank: "SS", ach: 99.0, coeff: 20.8, class: "rank-ss" },
  { rank: "S+", ach: 98.9999, coeff: 20.6, class: "rank-sp" },
  { rank: "S+", ach: 98.0, coeff: 20.3, class: "rank-sp" },
  { rank: "S", ach: 97.0, coeff: 20.0, class: "rank-s" },
];

const pageSize = 40;
const displayCount = ref(pageSize);
const loadMoreRef = useTemplateRef<HTMLElement>("loadMoreRef");

useInfiniteScroll(
  loadMoreRef,
  () => {
    if (hasMore.value) {
      loadMore();
    }
  },
  { distance: 200 }
);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await maimaiApi.getMusicData();
    if (res.data?.ok) {
      allSongs.value = res.data.data.songs;
      aliases.value = res.data.data.aliases;

      // 提取版本和流派用于筛选器
      const vSet = new Set<string>();
      const gSet = new Set<string>();
      allSongs.value.forEach(s => {
        if (s.basic_info.from) vSet.add(s.basic_info.from);
        if (s.basic_info.genre) gSet.add(s.basic_info.genre);
        
        // 绑定别名到乐曲对象方便搜索
        const aliasEntry = aliases.value[s.id];
        if (aliasEntry) {
          s.aliases = aliasEntry.Alias;
        }
      });
      versions.value = Array.from(vSet).sort();
      genres.value = Array.from(gSet);
    }
  } catch (error) {
    console.error("Failed to fetch music data:", error);
  } finally {
    loading.value = false;
  }
};

const getCoverUrl = (id: string) => {
  const formattedId = id.slice(-4).padStart(6, "0");
  return `http://assets.fangchang.asia/maimai/jacket/UI_Jacket_${formattedId}.png`;
};

const handleImgError = (e: Event) => {
  (e.target as HTMLImageElement).src = "https://placehold.co/120x120/1e1e1e/ff8c00?text=No+Cover";
};

const filteredSongs = computed(() => {
  let result = allSongs.value;

  // 1. 基本 ID 过滤 (宴谱)
  if (!filters.showUtage) {
    result = result.filter(s => s.id.length < 6);
  }

  // 2. 搜索过滤 (标题, 别名, 艺术家)
  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(song => {
      const matchTitle = song.title.toLowerCase().includes(s);
      const matchArtist = song.basic_info.artist.toLowerCase().includes(s);
      const matchAlias = song.aliases?.some(a => a.toLowerCase().includes(s));
      return matchTitle || matchArtist || matchAlias;
    });
  }

  // 3. 版本筛选
  if (filters.version) {
    result = result.filter(s => s.basic_info.from === filters.version);
  }

  // 4. 流派筛选
  if (filters.genre) {
    result = result.filter(s => s.basic_info.genre === filters.genre);
  }

  // 5. 类型筛选 (SD/DX)
  if (filters.type) {
    result = result.filter(s => s.type === filters.type);
  }

  // 6. BPM 范围
  if (filters.bpmMin !== null) {
    result = result.filter(s => s.basic_info.bpm >= filters.bpmMin!);
  }
  if (filters.bpmMax !== null) {
    result = result.filter(s => s.basic_info.bpm <= filters.bpmMax!);
  }

  // 7. 等级范围
  if (filters.levelMin || filters.levelMax) {
    const getLevelVal = (l: string) => {
      if (!l) return null;
      let val = parseInt(l);
      if (l.includes('+')) val += 0.7;
      return val;
    };
    const minVal = getLevelVal(filters.levelMin);
    const maxVal = getLevelVal(filters.levelMax);
    
    result = result.filter(s => {
      // 只要乐曲中【任何一个】难度在指定范围内，就显示该乐曲
      return s.level.some(l => {
        const v = getLevelVal(l);
        if (v === null) return false;
        if (minVal !== null && v < minVal) return false;
        // 注意：如果用户选了 12 作为上限，通常希望包含 12 和 12+，但目前 12+ 是 12.7
        // 所以我们对 maxVal 的判断稍作调整：如果 maxVal 是整数且不带 +，则允许到 x.9
        let effectiveMax = maxVal;
        if (maxVal !== null && !filters.levelMax.includes('+')) {
          effectiveMax = Math.floor(maxVal) + 0.9;
        }

        if (effectiveMax !== null && v > effectiveMax) return false;
        return true;
      });
    });
  }

  // 8. 定数范围 (针对特定难度)
  if (filters.dsMin !== null || filters.dsMax !== null) {
    const diffIdx = filters.dsDiff;
    result = result.filter(s => {
      if (!s.ds || s.ds.length <= diffIdx) return false;
      const val = s.ds[diffIdx];
      if (filters.dsMin !== null && val < filters.dsMin) return false;
      if (filters.dsMax !== null && val > filters.dsMax) return false;
      return true;
    });
  }

  // 默认排序：ID 从大到小 (除了 6 位宴谱外的正常 ID)
  // 注意：ID 是字符串，但由于 maimai ID 的特性（10001+ 为 DX），转换成数字排序较稳
  return result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
});

const displayedSongs = computed(() => {
  return filteredSongs.value.slice(0, displayCount.value);
});

const hasMore = computed(() => {
  return displayCount.value < filteredSongs.value.length;
});

const loadMore = () => {
  displayCount.value += pageSize;
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
};

watch(() => filters, () => {
  displayCount.value = pageSize; // 筛选条件变化时重置滚动位置
}, { deep: true });

const toggleCard = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const getDiffName = (idx: number) => {
  const names = ["Basic", "Advanced", "Expert", "Master", "Re:Master"];
  return names[idx] || "Unknown";
};

const getDiffNameShort = (idx: number) => {
  const names = ["BAS", "ADV", "EXP", "MAS", "ReM"];
  return names[idx] || "??";
};

const formatNotes = (notes: number[]) => {
  if (notes.length === 4) {
    return [notes[0], notes[1], notes[2], 0, notes[3]]; // [Tap, Hold, Slide, Touch(0), Break]
  }
  return notes; // [Tap, Hold, Slide, Touch, Break]
};

const getTotalNotes = (notes: number[]) => {
  return notes.reduce((a, b) => a + b, 0);
};

const calcRating = (ds: number, ach: number, coeff: number) => {
  // Rating = Math.floor(ds * Math.min(ach / 100, 1.005) * coeff)
  const base = ds * Math.min(ach / 100, 1.005) * coeff;
  return Math.floor(base) + 1; // 默认显示 AP 奖励后的分值 (+1)
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-main);
  overflow-x: hidden;
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
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.title-section h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  background: linear-gradient(135deg, var(--primary-color), #ff4d4f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.search-box-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  max-width: 600px;
}

.main-search-input {
  flex: 1;
  padding: 12px 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-main);
  font-size: 1rem;
  outline: none;
  transition: all 0.3s;
  box-shadow: 0 4px 15px var(--shadow-color);
}

.main-search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 4px 20px rgba(255, 140, 0, 0.2);
}

.filter-toggle-btn {
  padding: 0 20px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--surface-color);
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-toggle-btn:hover {
  background: var(--bg-color);
  color: var(--primary-color);
}

.filter-toggle-btn .arrow {
  font-size: 0.7rem;
  transition: transform 0.3s;
}

.filter-toggle-btn .arrow.up {
  transform: rotate(180deg);
}

/* 高级筛选面板 */
.advanced-filter-panel {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 10px 30px var(--shadow-color);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
}

.filter-group select,
.filter-group input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-main);
  outline: none;
  transition: border-color 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  border-color: var(--primary-color);
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.range-inputs input,
.range-inputs select {
  flex: 1;
  min-width: 0;
}

.ds-filter {
  grid-column: span 2;
}

.ds-controls {
  display: flex;
  gap: 12px;
}

.diff-select {
  flex: 0 0 120px;
}

.toggle-group {
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary) !important;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #ff4d4f;
  background: transparent;
  color: #ff4d4f;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #ff4d4f;
  color: #fff;
}

/* 列表统计 */
.result-stats {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.result-stats b {
  color: var(--primary-color);
}

/* 乐曲网格 */
.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.song-card {
  perspective: 1000px;
  cursor: pointer;
}

.song-card.is-expanded {
  grid-column: 1 / -1; /* 展开时占据整行 */
}

.card-inner {
  position: relative;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px var(--shadow-color);
}

.song-id-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-muted);
  background: rgba(0,0,0,0.05);
  padding: 2px 6px;
  border-radius: 6px;
  z-index: 2;
}

.card-main-row {
  display: flex;
  gap: 16px;
}

.card-inner:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 35px var(--shadow-color);
  border-color: var(--primary-color);
}

.cover-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.song-cover {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  object-fit: cover;
  background: var(--bg-color);
}

.song-type-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 4px;
  color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.song-type-badge.sd { 
  background: #3b82f6; 
  color: #fff;
  border: 1px solid rgba(255,255,255,0.2);
}

.song-type-badge.dx { 
  background: #fff; 
  border: 1px solid rgba(0,0,0,0.1);
  padding: 1px 5px;
}

.badge-text {
  display: inline-block;
  font-weight: 900;
}

.dx .badge-text {
  background: linear-gradient(
    135deg, 
    #ff6b6b, #feca57, #48dbfb, #ff9ff3
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* 移除之前的 ::after 逻辑，改用更直接的内部文本样式 */
.song-type-badge.dx {
  color: initial;
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.song-title {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.genre-tag, .bpm-tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 100px;
  background: var(--bg-color);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.difficulty-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.diff-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  min-width: 40px;
  color: #fff;
  transition: transform 0.2s;
}

.lv-text { font-size: 0.75rem; font-weight: 900; }
.ds-text { font-size: 0.6rem; opacity: 0.8; margin-top: -2px; }

.diff-0 { background-color: #22c55e; }
.diff-1 { background-color: #eab308; }
.diff-2 { background-color: #ef4444; }
.diff-3 { background-color: #a855f7; }
.diff-4 { background-color: #d946ef; }

/* 状态展示 */
.loading-state, .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.load-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.loading-more-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

/* 过渡动画 */
.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 500px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 展开详情样式 */
.song-expanded-detail {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 20px 20px;
  padding: 24px;
  margin-top: -20px;
  padding-top: 36px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  animation: slideDown 0.4s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-section h4 {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
}

.notes-table-wrapper, .rating-table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  text-align: center;
  white-space: nowrap;
}

.detail-table th {
  background: var(--bg-color);
  padding: 12px;
  font-weight: bold;
  color: var(--text-secondary);
  border-bottom: 2px solid var(--border-color);
}

.detail-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
}

.diff-name {
  font-weight: bold;
  text-align: left;
}

.row-diff-0 { color: #22c55e; }
.row-diff-1 { color: #eab308; }
.row-diff-2 { color: #ef4444; }
.row-diff-3 { color: #a855f7; }
.row-diff-4 { color: #d946ef; }

.total-notes {
  font-weight: 900;
  background: rgba(0,0,0,0.02);
}

.rating-table .rank-cell {
  background: var(--bg-color);
  text-align: left;
  position: sticky;
  left: 0;
}

.rank-name {
  font-weight: 900;
  font-size: 1.2rem;
  margin-right: 8px;
  font-style: italic;
  font-family: 'Outfit', sans-serif;
}

.rank-ach {
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: bold;
}

/* 等级色彩 */
.rank-sssp { color: #facc15; background: rgba(250, 204, 21, 0.05); }
.rank-sssp .rank-name { text-shadow: 0 0 10px rgba(250, 204, 21, 0.4); }

.rank-sss { color: #fbbf24; }
.rank-ssp { color: #94a3b8; background: rgba(148, 163, 184, 0.05); }
.rank-ss { color: #64748b; }
.rank-sp { color: #fb923c; background: rgba(251, 146, 60, 0.05); }
.rank-s { color: #ea580c; }

.rating-table td:not(.rank-cell) {
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  font-size: 1rem;
}

.rating-tip {
  margin: 12px 0 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

@media (max-width: 1200px) {
  .main-wrapper { margin-left: 260px; }
  .filter-grid { grid-template-columns: repeat(2, 1fr); }
  .ds-filter { grid-column: span 2; }
}

@media (max-width: 1024px) {
  .main-wrapper { margin-left: 0; }
  .content-area { padding: 0 20px 20px 20px; }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-box-wrapper {
    max-width: none;
    flex-direction: column;
    width: 100%;
  }
  .main-search-input {
    width: 100%;
  }
  .filter-toggle-btn {
    width: 100%;
    justify-content: center;
    padding: 12px;
  }
  .advanced-filter-panel {
    padding: 16px;
  }
  .filter-grid {
    grid-template-columns: 1fr;
  }
  .ds-filter {
    grid-column: span 1;
  }
  .ds-controls {
    flex-direction: column;
  }

  .song-expanded-detail {
    padding: 16px;
    padding-top: 32px;
  }
  .card-main-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .cover-wrapper {
    width: 140px;
    height: 140px;
  }
  .song-info {
    width: 100%;
    align-items: center;
  }
  .song-tags {
    justify-content: center;
  }
  .difficulty-row {
    justify-content: center;
  }
  .rank-cell {
    background: var(--bg-color) !important;
    min-width: 80px;
  }
  .rating-table-wrapper {
    margin: 0 -16px;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
  .detail-table th, .detail-table td {
    padding: 8px 6px;
    font-size: 0.8rem;
  }
  .rank-name {
    font-size: 0.9rem;
  }
}
</style>
