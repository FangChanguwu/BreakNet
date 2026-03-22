<template>
  <div class="col-card maimai-card">
    <div class="card-header">
      <h3>🎵 每日推荐谱面</h3>
      <span
        class="badge"
        @click="fetchRandomSong"
        title="换一首"
        style="cursor: pointer"
        >🔄 换一首</span
      >
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
// 引入我们配置好的全局 axios 实例 (请确保路径正确，可能在 src/utils/http.ts)
import http from "@/utils/http.ts";

const isLoading = ref(true);
const songData = ref<any>(null);

const formatJacketId = (id: string | number) => {
  const idStr = String(id);
  // 取后四位（不足四位取全部），并在前面补 0 到 6 位
  return idStr.slice(-4).padStart(6, "0");
};

// 获取随机歌曲的方法
const fetchRandomSong = async () => {
  try {
    isLoading.value = true;
    // 因为你在后端挂载了 app.include_router(breakweb, prefix="/break")
    const res = await http.get("/music/random");

    if (res.data && res.data.ok) {
      songData.value = res.data.data;
    }
  } catch (error) {
    console.error("获取随机乐曲失败:", error);
    songData.value = null; // 触发错误提示
  } finally {
    isLoading.value = false;
  }
};

// 页面加载时自动请求
onMounted(() => {
  fetchRandomSong();
});

// 图片加载失败的后备方案 (Fallback)
const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = "https://placehold.co/120x120/1e1e1e/ff8c00?text=No+Cover";
};
</script>

<style scoped>
/* ================= 原有保留样式 ================= */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}
.badge {
  background: var(--primary-color);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  transition: opacity 0.2s;
}
.badge:hover {
  opacity: 0.8;
}

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
  /* height: 100%; */
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
  animation: pulse 1.5s infinite alternate; /* 增加一点呼吸动效 */
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
  overflow: hidden; /* 防止长标题撑破布局 */
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

/* 舞萌标准难度颜色映射 */
.diff-0 {
  background-color: #22c55e;
} /* 绿 Basic */
.diff-1 {
  background-color: #eab308;
} /* 黄 Advanced */
.diff-2 {
  background-color: #ef4444;
} /* 红 Expert */
.diff-3 {
  background-color: #a855f7;
} /* 紫 Master */
.diff-4 {
  background-color: #d946ef;
} /* 白/粉 Re:Master */

.error-msg {
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
  padding: 20px 0;
}

@media (max-width: 480px) {
  .col-card {
    padding: 20px 16px; /* 手机端减小卡片内边距 */
  }

  .song-info,
  .song-placeholder {
    gap: 12px; /* 减小封面和文字的间距 */
  }

  .song-cover,
  .cover-mockup {
    width: 84px; /* 手机端封面缩小 */
    height: 84px;
  }

  .song-name {
    font-size: 1.15rem; /* 标题字号略微调小 */
  }

  .song-meta {
    flex-wrap: wrap; /* 如果标签太多，允许标签换行 */
  }
}
</style>
