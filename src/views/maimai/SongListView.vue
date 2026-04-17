<template>
  <main class="content-area">
        <div class="page-header">
          <div class="title-section">
            <span class="page-kicker">Maimai Song Explorer</span>
            <h2>🎵 舞萌乐曲查询</h2>
            <p class="subtitle">查询乐曲、筛选版本与定数，并查看谱面详情和对应谱师信息。</p>
          </div>
          <div class="search-box-wrapper">
            <label class="search-shell">
              <span class="search-icon">⌕</span>
            <input
              v-model="filters.search"
              type="text"
              placeholder="搜索曲名、别名或艺术家..."
              class="main-search-input"
            />
              <button
                v-if="filters.search"
                class="search-clear-btn"
                type="button"
                @click="filters.search = ''"
              >
                清空
              </button>
            </label>
            <button class="filter-toggle-btn" type="button" @click="showAdvanced = !showAdvanced">
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
                <label>定数范围筛选</label>
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
            <span>共找到 <b>{{ filteredSongs.length }}</b> 首乐曲</span>
            <!--
              随机选曲
            -->
          </div>
          <!--
            已为你随机到 <strong>{{ randomPickedSong.title }}</strong>
            <span>{{ randomPickedSong.basic_info.genre }} · {{ randomPickedSong.type }}</span>
          -->
          
          <div class="song-grid">
            <div 
              v-for="song in displayedSongs" 
              :key="getSongKey(song)"
              class="song-card"
              :class="{ 'is-expanded': expandedKey === getSongKey(song) }"
              :data-song-key="getSongKey(song)"
              @click="toggleCard(song)"
            >
              <div class="card-inner">
                <div class="card-topline">
                  <div class="song-id-badge">#{{ song.id }}</div>
                  <div class="song-version-badge" :class="getVersionThemeClass(song.basic_info.from)">{{ song.basic_info.from }}</div>
                </div>
                <div class="card-main-row">
                  <div class="cover-wrapper">
                  <img 
                    :key="getSongKey(song)"
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
                  <div class="card-action-hint">
                    {{ expandedKey === getSongKey(song) ? '点击收起详情' : '点击查看详情' }}
                  </div>
                </div>
              </div>
            </div>

              <!-- 展开详情区域 -->
              <transition name="expand">
                <div v-if="expandedKey === getSongKey(song)" class="song-expanded-detail" @click.stop>
                  <div class="detail-hero">
                    <div class="detail-hero-main">
                      <p class="detail-kicker">{{ song.basic_info.from }} · {{ song.type }}</p>
                      <h4 class="detail-song-title">{{ song.title }}</h4>
                      <p class="detail-song-artist">{{ song.basic_info.artist }}</p>
                    </div>
                    <div class="detail-meta-grid">
                      <div class="detail-meta-card">
                        <span class="detail-meta-label">流派</span>
                        <strong>{{ song.basic_info.genre }}</strong>
                      </div>
                      <div class="detail-meta-card">
                        <span class="detail-meta-label">BPM</span>
                        <strong>{{ song.basic_info.bpm }}</strong>
                      </div>
                      <div class="detail-meta-card">
                        <span class="detail-meta-label">谱面数</span>
                        <strong>{{ song.level.length }}</strong>
                      </div>
                    </div>
                  </div>

                  <div v-if="song.aliases?.length" class="detail-section">
                    <h4>别名</h4>
                    <div class="alias-list">
                      <span v-for="alias in song.aliases.slice(0, 6)" :key="alias" class="alias-pill">
                        {{ alias }}
                      </span>
                    </div>
                  </div>

                  <div v-if="getCharterEntries(song).length" class="detail-section">
                    <h4>谱师信息</h4>
                    <div class="charter-grid">
                      <div
                        v-for="entry in getCharterEntries(song)"
                        :key="entry.idx"
                        class="charter-card"
                        :class="`charter-${entry.idx}`"
                      >
                        <span class="charter-level">{{ entry.name }}</span>
                        <strong class="charter-name">{{ entry.charter }}</strong>
                        <span class="charter-short">{{ entry.short }}</span>
                      </div>
                    </div>
                  </div>
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
                    <h4>DX分数对照表</h4>
                    <p class="dx-score-intro">
                      DX分理论值 = 该难度总 Notes*3。下表按各难度理论满分，给出对应星级所需的 DX 分门槛。
                    </p>
                    <div class="rating-table-wrapper">
                      <table class="detail-table rating-table dx-score-table">
                        <thead>
                          <tr>
                            <th>评级</th>
                            <th>占比</th>
                            <th v-for="(_ds, idx) in song.ds" :key="`dx-head-${idx}`">
                              {{ getDiffNameShort(idx) }} ({{ getDxMaxScore(song, idx) }})
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="threshold in dxScoreThresholds"
                            :key="threshold.label"
                            :class="['dx-row', threshold.className]"
                          >
                            <td class="rank-cell">
                              <span class="rank-name dx-rank-name">{{ threshold.label }}</span>
                            </td>
                            <td class="dx-percent-cell">{{ threshold.range }}</td>
                            <td v-for="(_ds, idx) in song.ds" :key="`dx-score-${threshold.label}-${idx}`">
                              {{ getDxThresholdScore(song, idx, threshold.minRatio) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p class="rating-tip">* “✦✦✦✦✦✦” 为玩家常用的民间 6 星定义，这里按 99.00% 一并展示。</p>
                  </div>

                  <div class="detail-section">
                    <h4>📈 Rating 对照表</h4>
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
                          <tr class="rank-ap">
                            <td class="rank-cell">
                              <span class="rank-name">AP</span>
                              <span class="rank-ach">SSS+ 100.5%</span>
                            </td>
                            <td v-for="(ds, idx) in song.ds" :key="idx">
                              {{ calcRating(ds, 100.5, 22.4) + 1 }}
                            </td>
                          </tr>
                          <tr v-for="threshold in ratingThresholds" :key="threshold.rank + threshold.ach" :class="threshold.class">
                            <td class="rank-cell">
                              <span class="rank-name" v-if="threshold.rank === 'SSS+'"><span class="sss-s1">S</span><span class="sss-s2">S</span><span class="sss-s3">S</span><span>+</span></span>
                              <span class="rank-name" v-else-if="threshold.rank === 'SSS'"><span class="sss-s1">S</span><span class="sss-s2">S</span><span class="sss-s3">S</span></span>
                              <span class="rank-name" v-else>{{ threshold.rank }}</span>
                              <span class="rank-ach">{{ threshold.ach }}%</span>
                            </td>
                            <td v-for="(ds, idx) in song.ds" :key="idx">
                              {{ calcRating(ds, threshold.ach, threshold.coeff) }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p class="rating-tip">* CiRCLE的 AP+1 分机制。</p>
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
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, useTemplateRef, nextTick } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
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

interface CharterEntry {
  idx: number;
  name: string;
  short: string;
  charter: string;
}

const loading = ref(true);
const showAdvanced = ref(false);
const expandedKey = ref<string | null>(null);
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

const dxScoreThresholds = [
  { label: "✦✦✦✦✦✦", range: "99.00% - 100.00%", minRatio: 0.99, className: "dx-six" },
  { label: "✦✦✦✦✦", range: "97.00% - 100.00%", minRatio: 0.97, className: "dx-five" },
  { label: "✦✦✦✦", range: "95.00% - 96.99%", minRatio: 0.95, className: "dx-four" },
  { label: "✦✦✦", range: "93.00% - 94.99%", minRatio: 0.93, className: "dx-three" },
  { label: "✦✦", range: "90.00% - 92.99%", minRatio: 0.9, className: "dx-two" },
  { label: "✦", range: "85.00% - 89.99%", minRatio: 0.85, className: "dx-one" },
  { label: "-", range: "0.00% - 84.99%", minRatio: 0, className: "dx-zero" },
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

const getSongKey = (song: Song) => `${song.id}-${song.type}`;

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

watch(filteredSongs, (songs) => {
  if (!expandedKey.value) {
    return;
  }

  const stillVisible = songs.some((song) => getSongKey(song) === expandedKey.value);
  if (!stillVisible) {
    expandedKey.value = null;
  }
});

const scrollSongIntoView = async (songKey: string) => {
  await nextTick();
  const target = document.querySelector<HTMLElement>(`[data-song-key="${songKey}"]`);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const toggleCard = async (song: Song) => {
  const songKey = getSongKey(song);
  expandedKey.value = expandedKey.value === songKey ? null : songKey;

  if (expandedKey.value === songKey) {
    if (window.innerWidth <= 768 && showAdvanced.value) {
      showAdvanced.value = false;
    }
    await scrollSongIntoView(songKey);
  }
};

const getDiffName = (idx: number) => {
  const names = ["Basic", "Advanced", "Expert", "Master", "Re:Master"];
  return names[idx] || "Unknown";
};

const getDiffNameShort = (idx: number) => {
  const names = ["BAS", "ADV", "EXP", "MAS", "ReM"];
  return names[idx] || "??";
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

const getCharterEntries = (song: Song): CharterEntry[] =>
  [2, 3, 4]
    .filter((idx) => Boolean(song.charts?.[idx]?.charter))
    .map((idx) => ({
      idx,
      name: getDiffName(idx),
      short: getDiffNameShort(idx),
      charter: song.charts[idx].charter,
    }));

const formatNotes = (notes: number[]) => {
  if (notes.length === 4) {
    return [notes[0], notes[1], notes[2], 0, notes[3]]; // [Tap, Hold, Slide, Touch(0), Break]
  }
  return notes; // [Tap, Hold, Slide, Touch, Break]
};

const getTotalNotes = (notes: number[]) => {
  return notes.reduce((a, b) => a + b, 0);
};

const getDxMaxScore = (song: Song, idx: number) => {
  const notes = song.charts?.[idx]?.notes;
  if (!notes?.length) return "-";
  return getTotalNotes(notes) * 3;
};

const getDxThresholdScore = (song: Song, idx: number, ratio: number) => {
  const maxScore = getDxMaxScore(song, idx);
  if (maxScore === "-") return "-";
  return Math.ceil(Number(maxScore) * ratio);
};

const calcRating = (ds: number, ach: number, coeff: number) => {
  const base = ds * Math.min(ach / 100, 1.005) * coeff;
  return Math.floor(base);
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
  width: 100%;
  max-width: 100%;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 300px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
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
  min-width: 0;
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
  overflow: hidden;
}

.range-filter {
  grid-column: span 2;
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
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.filter-group select:focus,
.filter-group input:focus {
  border-color: var(--primary-color);
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.range-inputs input,
.range-inputs select {
  flex: 1;
  min-width: 60px;
  width: 0;
}

.ds-filter {
  grid-column: 1 / -1;
}

.ds-controls {
  display: flex;
  gap: 12px;
}

.ds-controls .range-inputs {
  flex: 1;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.result-stats b {
  color: var(--primary-color);
}

/* .random-pick-btn {
  border: 0;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
} */

.random-pick-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(249, 115, 22, 0.24);
}

.random-picked-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: -4px 0 18px;
  padding: 12px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.86), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(249, 115, 22, 0.16);
  color: #9a3412;
}

.random-picked-banner strong {
  color: #7c2d12;
}

.random-picked-banner span {
  color: #c2410c;
  font-size: 0.84rem;
}

/* 乐曲网格 */
.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.song-card {
  perspective: 1000px;
  cursor: pointer;
  min-width: 0;
  max-width: 100%;
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.song-id-badge {
  position: static;
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--text-muted);
  background: rgba(0,0,0,0.05);
  padding: 5px 10px;
  border-radius: 999px;
  z-index: 1;
}

.card-main-row {
  display: flex;
  gap: 16px;
  margin-top: 12px;
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
  width: 100%;
  max-width: 100%;
  min-width: 0;
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
.rank-sssp { background: rgba(250, 204, 21, 0.05); }
.rank-sss { background: transparent; }

.sss-s1 { color: #facc15; } /* 黄 */
.sss-s2 { color: #60a5fa; } /* 蓝 */
.sss-s3 { color: #f87171; } /* 红 */

.rank-sssp .rank-ach,
.rank-sss .rank-ach { color: var(--text-muted); }

.rank-ssp { color: #d4a017; background: rgba(212, 160, 23, 0.05); }
.rank-ssp .rank-name { text-shadow: 0 0 6px rgba(212, 160, 23, 0.3); }
.rank-ss { color: #d4a017; }
.rank-sp { color: #d4a017; background: rgba(212, 160, 23, 0.05); }
.rank-s { color: #d4a017; }

.rank-ap {
  color: #facc15;
  background: rgba(250, 204, 21, 0.08);
  border-top: 2px dashed rgba(250, 204, 21, 0.4);
}
.rank-ap .rank-name {
  text-shadow: 0 0 10px rgba(250, 204, 21, 0.5);
}

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

.dx-score-intro {
  margin: 0 0 12px 0;
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

.dx-score-table .rank-cell {
  min-width: 110px;
}

.dx-rank-name {
  font-style: normal;
}

.dx-percent-cell {
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.dx-one,
.dx-two {
  color: #16a34a;
}

.dx-three,
.dx-four {
  color: #ea580c;
}

.dx-five,
.dx-six {
  color: #ca8a04;
}

.page-header {
  position: relative;
  overflow: hidden;
  padding: 28px;
  border: 1px solid rgba(255, 196, 61, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(255, 196, 61, 0.18), transparent 24%),
    radial-gradient(circle at left center, rgba(34, 211, 238, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 251, 255, 0.94));
  box-shadow: 0 18px 36px rgba(255, 183, 3, 0.12);
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 183, 3, 0.14);
  color: #f59e0b;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 0 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 196, 61, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 28px rgba(56, 189, 248, 0.08);
}

.search-icon {
  color: #f59e0b;
  font-size: 1rem;
  font-weight: 900;
}

.search-clear-btn {
  border: 0;
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(148, 163, 184, 0.14);
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
}

.result-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(45, 212, 191, 0.14);
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
}

.card-topline {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.song-version-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  border: 1px solid transparent;
}

.song-version-badge.theme-default {
  background: rgba(45, 212, 191, 0.12);
  color: #0f766e;
}

.song-version-badge.theme-circle {
  background: rgba(236, 72, 153, 0.14);
  border-color: rgba(236, 72, 153, 0.2);
  color: #be185d;
}

.song-version-badge.theme-buddies {
  background: rgba(249, 115, 22, 0.14);
  border-color: rgba(249, 115, 22, 0.2);
  color: #c2410c;
}

.song-version-badge.theme-festival {
  background: rgba(234, 179, 8, 0.16);
  border-color: rgba(234, 179, 8, 0.2);
  color: #a16207;
}

.song-version-badge.theme-universe {
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.2);
  color: #1d4ed8;
}

.song-version-badge.theme-splash {
  background: rgba(6, 182, 212, 0.14);
  border-color: rgba(6, 182, 212, 0.2);
  color: #0f766e;
}

.song-version-badge.theme-dx {
  background: rgba(168, 85, 247, 0.14);
  border-color: rgba(168, 85, 247, 0.2);
  color: #7e22ce;
}

.song-version-badge.theme-milk {
  background: rgba(148, 163, 184, 0.14);
  border-color: rgba(148, 163, 184, 0.2);
  color: #475569;
}

.song-version-badge.theme-murasaki {
  background: rgba(192, 132, 252, 0.14);
  border-color: rgba(192, 132, 252, 0.2);
  color: #9333ea;
}

.song-version-badge.theme-pink {
  background: rgba(244, 114, 182, 0.14);
  border-color: rgba(244, 114, 182, 0.2);
  color: #db2777;
}

.song-version-badge.theme-orange {
  background: rgba(251, 146, 60, 0.14);
  border-color: rgba(251, 146, 60, 0.2);
  color: #ea580c;
}

.song-version-badge.theme-green {
  background: rgba(34, 197, 94, 0.14);
  border-color: rgba(34, 197, 94, 0.2);
  color: #15803d;
}

.card-action-hint {
  margin-top: 12px;
  color: #fb8500;
  font-size: 0.8rem;
  font-weight: 800;
}

.card-inner {
  border-color: rgba(255, 196, 61, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 251, 255, 0.94)),
    linear-gradient(135deg, rgba(255, 196, 61, 0.05), rgba(34, 211, 238, 0.05));
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.08);
}

.song-expanded-detail {
  margin-top: 12px;
  border-top: 1px solid rgba(255, 196, 61, 0.14);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 252, 255, 0.96)),
    linear-gradient(135deg, rgba(255, 183, 3, 0.06), rgba(34, 211, 238, 0.04));
}

.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 183, 3, 0.1), rgba(45, 212, 191, 0.12));
}

.detail-song-title {
  margin: 6px 0;
  color: #1f2937;
  font-size: clamp(1.3rem, 2vw, 1.6rem);
}

.detail-song-artist,
.detail-kicker {
  margin: 0;
}

.detail-kicker {
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-song-artist {
  color: #64748b;
}

.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.detail-meta-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
}

.detail-meta-label {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.alias-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.alias-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.16);
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}

.charter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.charter-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  color: #fff;
  min-width: 0;
}

.charter-2 { background: linear-gradient(135deg, #fb7185, #ef4444); }
.charter-3 { background: linear-gradient(135deg, #a855f7, #7c3aed); }
.charter-4 { background: linear-gradient(135deg, #f472b6, #db2777); }

.charter-level,
.charter-short {
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.charter-name {
  font-size: 1rem;
  line-height: 1.4;
  word-break: break-word;
}

.charter-short {
  width: fit-content;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

[data-theme="dark"] .app-layout {
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.12), transparent 24%),
    radial-gradient(circle at left top, rgba(45, 212, 191, 0.1), transparent 24%),
    linear-gradient(180deg, #0f172a 0%, #111827 52%, #0b1220 100%);
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .advanced-filter-panel,
[data-theme="dark"] .card-inner,
[data-theme="dark"] .song-expanded-detail,
[data-theme="dark"] .detail-meta-card,
[data-theme="dark"] .alias-pill,
[data-theme="dark"] .search-shell {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.36);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
}

[data-theme="dark"] .page-header {
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.14), transparent 24%),
    radial-gradient(circle at left center, rgba(34, 211, 238, 0.1), transparent 28%),
    linear-gradient(135deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .detail-hero {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.32), rgba(17, 94, 89, 0.24));
}

[data-theme="dark"] .detail-song-title,
[data-theme="dark"] .song-title,
[data-theme="dark"] .main-search-input {
  color: #e2e8f0;
}

[data-theme="dark"] .detail-song-artist,
[data-theme="dark"] .detail-kicker,
[data-theme="dark"] .detail-meta-label,
[data-theme="dark"] .song-artist,
[data-theme="dark"] .dx-percent-cell,
[data-theme="dark"] .page-kicker,
[data-theme="dark"] .subtitle {
  color: #94a3b8;
}

[data-theme="dark"] .song-id-badge,
[data-theme="dark"] .genre-tag,
[data-theme="dark"] .bpm-tag,
[data-theme="dark"] .detail-table th,
[data-theme="dark"] .rating-table .rank-cell,
[data-theme="dark"] .total-notes {
  background: rgba(30, 41, 59, 0.9);
  color: #cbd5e1;
}

[data-theme="dark"] .random-picked-banner {
  background: linear-gradient(135deg, rgba(120, 53, 15, 0.4), rgba(30, 41, 59, 0.92));
  border-color: rgba(249, 115, 22, 0.22);
  color: #fdba74;
}

[data-theme="dark"] .random-picked-banner strong {
  color: #ffedd5;
}

[data-theme="dark"] .random-picked-banner span,
[data-theme="dark"] .card-action-hint {
  color: #fb923c;
}

[data-theme="dark"] .filter-group select,
[data-theme="dark"] .filter-group input {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(71, 85, 105, 0.36);
  color: #e2e8f0;
}

[data-theme="dark"] .notes-table-wrapper,
[data-theme="dark"] .rating-table-wrapper {
  border-color: rgba(71, 85, 105, 0.36);
}

@media (max-width: 1200px) {
  .main-wrapper { margin-left: 260px; }
  .filter-grid { grid-template-columns: repeat(2, 1fr); }
  .ds-filter { grid-column: span 2; }
  .range-filter { grid-column: span 2; }
}

@media (max-width: 1024px) {
  .main-wrapper { margin-left: 0; }
  .content-area { padding: 0 20px 20px 20px; }
}

@media (max-width: 768px) {
  .app-layout,
  .main-wrapper,
  .content-area {
    overflow-x: clip;
  }

  .content-area {
    padding: 0 16px 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 100%;
    padding: 20px 18px;
  }
  .search-box-wrapper {
    max-width: none;
    flex-direction: column;
    width: 100%;
    min-width: 0;
  }
  .main-search-input {
    width: 100%;
    min-width: 0;
  }
  .search-shell {
    width: 100%;
    box-sizing: border-box;
  }
  .filter-toggle-btn {
    width: 100%;
    justify-content: center;
    padding: 12px;
    min-width: 0;
  }
  .random-pick-btn {
    width: 100%;
    justify-content: center;
  }
  .advanced-filter-panel {
    padding: 16px;
    border-radius: 12px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
  .ds-filter {
    grid-column: span 1;
  }
  .range-filter {
    grid-column: span 1;
  }
  .ds-controls {
    flex-direction: column;
  }

  .range-inputs {
    flex-wrap: wrap;
  }

  .diff-select {
    flex: unset;
    width: 100%;
  }

  .song-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }

  .song-expanded-detail {
    padding: 16px;
    padding-top: 32px;
  }
  .detail-meta-grid,
  .charter-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .alias-list {
    justify-content: center;
  }

  .card-main-row {
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    min-width: 0;
  }
  .cover-wrapper {
    width: 140px;
    height: 140px;
  }
  .song-info {
    width: 100%;
    align-items: center;
  }
  .song-title,
  .song-artist {
    max-width: 100%;
  }
  .song-tags {
    justify-content: center;
    flex-wrap: wrap;
  }
  .difficulty-row {
    justify-content: center;
  }
  .card-action-hint {
    text-align: center;
  }

  .notes-table-wrapper,
  .rating-table-wrapper {
    margin: 0;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .rank-cell {
    background: var(--bg-color) !important;
    min-width: 80px;
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
