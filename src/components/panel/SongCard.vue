<template>
  <div class="col-card maimai-card">
    <div class="card-header">
      <h3>🎵 每日推荐谱面</h3>
    </div>

    <div v-if="isLoading" class="song-placeholder">
      <div class="cover-mockup">加载中...</div>
      <div class="info-mockup">
        <div class="line title-line"></div>
        <div class="line artist-line"></div>
        <div class="line diff-line"></div>
      </div>
    </div>

    <div v-else-if="songData" class="song-info">
      <img
        :src="`http://assets.fangchang.asia/maimai/jacket/UI_Jacket_${formatJacketId(songData.id)}.png`"
        alt="Cover"
        class="song-cover"
        @error="handleImageError"
      />

      <div class="song-details">
        <h4 class="song-name" :title="songData.basic_info.title">
          {{ songData.basic_info.title }}
        </h4>
        <p class="song-artist" :title="songData.basic_info.artist">
          {{ songData.basic_info.artist }}
        </p>

        <div class="song-meta">
          <span class="meta-tag type-tag">{{ songData.type }}</span>
          <span class="meta-tag bpm-tag"
            >BPM: {{ songData.basic_info.bpm }}</span
          >
        </div>

        <div class="song-levels">
          <span
            v-for="(lv, index) in songData.level"
            :key="index"
            :class="['level-badge', `diff-${index}`]"
          >
            {{ lv }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="error-msg">获取谱面失败，请稍后重试。</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import http from "@/utils/http.ts"; // 确保路径正确

const isLoading = ref(true);
const songData = ref<any>(null);

const formatJacketId = (id: string | number) => {
  const idStr = String(id);
  return idStr.slice(-4).padStart(6, "0");
};

// ✨ 核心逻辑：获取并缓存每日乐曲
const fetchDailySong = async () => {
  try {
    isLoading.value = true;

    // 获取今天的日期和当前的登录凭证 (Token)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    // 注意：这里的 "auth" 请换成你实际存 token 的 localStorage key，如果你存的就叫 auth 则不用动
    const currentToken = localStorage.getItem("auth");

    // 1. 先尝试从本地存储读取
    const cachedData = localStorage.getItem("daily_song_cache");
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);

      // ✨ 严格校验：日期必须是今天，且 Token 必须是当前账号的 Token！
      if (
        parsedCache.date === todayStr &&
        parsedCache.token === currentToken &&
        parsedCache.song
      ) {
        songData.value = parsedCache.song;
        isLoading.value = false;
        return; // 校验完美通过，直接使用缓存，0 延迟！
      }
    }

    // 2. 如果没缓存、跨天了、或者【切换了账号】，再去请求后端
    const res = await http.get("/music/random");

    if (res.data && res.data.ok) {
      songData.value = res.data.data;

      // 3. 将新歌、今天的日期，以及当前账号的 Token 一并存入缓存
      localStorage.setItem(
        "daily_song_cache",
        JSON.stringify({
          date: todayStr,
          token: currentToken, // 绑定账号防串号
          song: res.data.data,
        }),
      );
    }
  } catch (error) {
    console.error("获取每日乐曲失败:", error);
    songData.value = null;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchDailySong();
});

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = "https://placehold.co/120x120/1e1e1e/ff8c00?text=No+Cover";
};
</script>

<style scoped>
/* ================= 原有保留样式 ================= */
.card-header {
  display: flex;
  /* 即使删了按钮，这里保持 flex 也不影响，方便以后左边加 icon 等 */
  align-items: center;
  margin-bottom: 24px;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}

/* ✨ 已经删除了 .badge 相关的样式 */

.col-card {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
}
.col-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: var(--primary-color);
}

/* ================= 骨架屏样式 ================= */
.song-placeholder {
  display: flex;
  gap: 20px;
  align-items: center;
}
.cover-mockup {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px dashed var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 0.85rem;
}
.info-mockup {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.line {
  height: 14px;
  background: var(--bg-color);
  border-radius: 8px;
  animation: pulse 1.5s infinite alternate;
}
.title-line {
  width: 80%;
  height: 20px;
}
.artist-line {
  width: 50%;
}
.diff-line {
  width: 30%;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

/* ================= 真实数据展示区样式 ================= */
.song-info {
  display: flex;
  gap: 20px;
  align-items: center;
  animation: fadeIn 0.4s ease-out;
  width: 100%;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.song-cover {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
}

.song-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.song-name {
  margin: 0 0 6px 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.song-artist {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}
.song-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.meta-tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--bg-color);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.type-tag {
  color: #ff8c00;
  border-color: #ff8c00;
  background: rgba(255, 140, 0, 0.1);
}

.song-levels {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.level-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.diff-0 {
  background-color: #22c55e;
}
.diff-1 {
  background-color: #eab308;
}
.diff-2 {
  background-color: #ef4444;
}
.diff-3 {
  background-color: #a855f7;
}
.diff-4 {
  background-color: #d946ef;
}

.error-msg {
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 480px) {
  .col-card {
    padding: 20px 16px;
  }
  .song-info,
  .song-placeholder {
    gap: 12px;
  }
  .song-cover,
  .cover-mockup {
    width: 84px;
    height: 84px;
  }
  .song-name {
    font-size: 1.15rem;
  }
  .song-meta {
    flex-wrap: wrap;
  }
}
</style>
