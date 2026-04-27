<template>
  <div class="collections-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">maimai Collection</p>
        <h1>收藏品总览</h1>
      </div>
      <div class="summary-pill">
        {{ filteredItems.length }} / {{ currentCategoryTotal }}
      </div>
    </header>

    <section class="toolbar">
      <div class="category-tabs" role="tablist" aria-label="收藏品分类">
        <button
          v-for="category in categories"
          :key="category.key"
          type="button"
          class="category-tab"
          :class="{ active: selectedCategory === category.key }"
          @click="selectedCategory = category.key"
        >
          <span>{{ category.label }}</span>
          <strong>{{ categoryCounts[category.key] }}</strong>
        </button>
      </div>

      <div class="filters">
        <label class="search-field">
          <span>搜索</span>
          <input v-model.trim="query" type="search" placeholder="ID / 名称 / 获取方式" />
        </label>
        <label class="filter-field">
          <span>版本</span>
          <select v-model="selectedVersion">
            <option value="">全部版本</option>
            <option v-for="version in versionOptions" :key="version" :value="version">
              {{ version }}
            </option>
          </select>
        </label>
        <label class="filter-field">
          <span>分类</span>
          <select v-model="selectedGenre">
            <option value="">全部分类</option>
            <option v-for="genre in genreOptions" :key="genre" :value="genre">
              {{ genre }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <div v-if="isLoading" class="empty-state">
      正在加载收藏品数据...
    </div>

    <section v-else class="collection-grid" :class="selectedCategory">
      <article v-for="item in visibleItems" :key="`${item.category}-${item.id}`" class="collection-card">
        <div class="image-box">
          <img :src="getImageUrl(item)" :alt="item.name" loading="lazy" @error="markImageError" />
        </div>
        <div class="item-body">
          <div class="item-title-row">
            <span class="item-id">#{{ item.id }}</span>
            <span class="item-version">{{ item.version }}</span>
          </div>
          <h2>{{ item.name || "未命名收藏品" }}</h2>
          <p>{{ item.normText || "暂无获取条件" }}</p>
        </div>
      </article>
    </section>

    <div v-if="visibleItems.length < filteredItems.length" class="load-more-row">
      <button type="button" class="load-more-btn" @click="visibleLimit += pageSize">
        加载更多
      </button>
    </div>

    <div v-if="!filteredItems.length" class="empty-state">
      没有找到匹配的收藏品。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

type MaimaiCollectionCategory = "icon" | "plate" | "frame";

type MaimaiCollectionItem = {
  category: MaimaiCollectionCategory;
  id: string;
  paddedId: string;
  name: string;
  normText: string;
  genreId: string;
  genre: string;
  version: string;
};

type CategoryOption = {
  key: MaimaiCollectionCategory;
  label: string;
  assetPath: string;
  assetPrefix: string;
};

const pageSize = 72;

const categories: CategoryOption[] = [
  { key: "icon", label: "头像 Icon", assetPath: "icon", assetPrefix: "UI_Icon" },
  { key: "plate", label: "牌子 Plate", assetPath: "plate", assetPrefix: "UI_Plate" },
  { key: "frame", label: "背景 Frame", assetPath: "frame", assetPrefix: "UI_Frame" },
];

const selectedCategory = ref<MaimaiCollectionCategory>("icon");
const selectedVersion = ref("");
const selectedGenre = ref("");
const query = ref("");
const visibleLimit = ref(pageSize);
const isLoading = ref(true);
const maimaiCollectionItems = ref<MaimaiCollectionItem[]>([]);

const categoryMetaMap = new Map(categories.map((category) => [category.key, category]));

const categoryCounts = computed<Record<MaimaiCollectionCategory, number>>(() => ({
  icon: maimaiCollectionItems.value.filter((item) => item.category === "icon").length,
  plate: maimaiCollectionItems.value.filter((item) => item.category === "plate").length,
  frame: maimaiCollectionItems.value.filter((item) => item.category === "frame").length,
}));

const currentCategoryItems = computed(() =>
  maimaiCollectionItems.value.filter((item) => item.category === selectedCategory.value),
);

const currentCategoryTotal = computed(() => currentCategoryItems.value.length);

const versionOptions = computed(() =>
  Array.from(new Set(currentCategoryItems.value.map((item) => item.version).filter(Boolean))).sort(),
);

const genreOptions = computed(() =>
  Array.from(new Set(currentCategoryItems.value.map((item) => item.genre).filter(Boolean))).sort(),
);

const normalizedQuery = computed(() => query.value.trim().toLowerCase());

const filteredItems = computed(() => {
  const keyword = normalizedQuery.value;
  return currentCategoryItems.value.filter((item) => {
    if (selectedVersion.value && item.version !== selectedVersion.value) return false;
    if (selectedGenre.value && item.genre !== selectedGenre.value) return false;
    if (!keyword) return true;
    return [item.id, item.paddedId, item.name, item.normText, item.genre, item.version]
      .some((value) => value.toLowerCase().includes(keyword));
  });
});

const visibleItems = computed(() => filteredItems.value.slice(0, visibleLimit.value));

const getImageUrl = (item: MaimaiCollectionItem) => {
  const meta = categoryMetaMap.get(item.category) || categories[0];
  return `https://assets.breakdx.net/maimai/${meta.assetPath}/${meta.assetPrefix}_${item.paddedId}.png`;
};

const markImageError = (event: Event) => {
  const image = event.target as HTMLImageElement;
  image.classList.add("is-missing");
};

const loadCollectionItems = async () => {
  isLoading.value = true;
  try {
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${baseUrl}/data/maimai-collections.json`);
    if (!response.ok) throw new Error("Failed to load maimai collection data");
    maimaiCollectionItems.value = await response.json() as MaimaiCollectionItem[];
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [selectedCategory.value, selectedVersion.value, selectedGenre.value, query.value],
  () => {
    visibleLimit.value = pageSize;
  },
);

watch(
  () => selectedCategory.value,
  () => {
    selectedVersion.value = "";
    selectedGenre.value = "";
  },
);

onMounted(() => {
  void loadCollectionItems();
});
</script>

<style scoped>
.collections-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.page-header,
.toolbar,
.collection-card,
.empty-state {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 28px var(--shadow-color);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
  padding: 22px 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  color: var(--text-main);
  letter-spacing: 0;
}

.summary-pill {
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(255, 140, 0, 0.12);
  color: var(--primary-color);
  padding: 10px 14px;
  font-weight: 900;
}

.toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 18px;
  padding: 16px;
}

.category-tabs,
.filters {
  display: grid;
  gap: 10px;
}

.category-tabs {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.category-tab {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-color);
  color: var(--text-main);
  padding: 12px 14px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.category-tab strong {
  color: var(--text-muted);
  font-size: 0.86rem;
}

.category-tab.active {
  border-color: rgba(255, 140, 0, 0.42);
  background: rgba(255, 140, 0, 0.12);
  color: var(--primary-color);
}

.filters {
  grid-template-columns: minmax(220px, 1fr) minmax(160px, 220px) minmax(160px, 220px);
}

.search-field,
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.search-field input,
.filter-field select {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: var(--bg-color);
  color: var(--text-main);
  padding: 0 12px;
  font: inherit;
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(178px, 1fr));
  gap: 14px;
}

.collection-grid.plate,
.collection-grid.frame {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.collection-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
}

.image-box {
  display: grid;
  place-items: center;
  min-height: 148px;
  background:
    linear-gradient(45deg, rgba(148, 163, 184, 0.12) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(148, 163, 184, 0.12) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.12) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.12) 75%);
  background-size: 18px 18px;
  background-position: 0 0, 0 9px, 9px -9px, -9px 0;
}

.collection-grid.icon .image-box img {
  width: min(112px, 70%);
  aspect-ratio: 1 / 1;
}

.collection-grid.plate .image-box,
.collection-grid.frame .image-box {
  min-height: 120px;
}

.collection-grid.plate .image-box img,
.collection-grid.frame .image-box img {
  width: min(248px, 92%);
}

.image-box img {
  display: block;
  max-width: 100%;
  object-fit: contain;
}

.image-box img.is-missing {
  opacity: 0.18;
  filter: grayscale(1);
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 14px;
}

.item-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
}

.item-id {
  color: var(--primary-color);
}

.item-version {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-body h2 {
  margin: 0;
  color: var(--text-main);
  font-size: 1rem;
  line-height: 1.3;
  letter-spacing: 0;
}

.item-body p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.45;
}

.load-more-row {
  display: flex;
  justify-content: center;
}

.load-more-btn {
  border: none;
  border-radius: 999px;
  background: var(--primary-color);
  color: #fff;
  padding: 12px 24px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.empty-state {
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-weight: 800;
}

@media (max-width: 760px) {
  .collections-page {
    gap: 14px;
    padding: 0 10px 18px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px;
  }

  .toolbar {
    padding: 14px;
  }

  .category-tabs,
  .filters {
    grid-template-columns: 1fr;
  }

  .category-tab {
    min-height: 46px;
  }

  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .collection-grid.plate,
  .collection-grid.frame {
    grid-template-columns: minmax(0, min(100%, 420px));
    justify-content: center;
  }

  .collection-grid.icon .collection-card {
    min-width: 0;
  }

  .image-box,
  .collection-grid.plate .image-box,
  .collection-grid.frame .image-box {
    min-height: 108px;
  }

  .collection-grid.icon .image-box img {
    width: min(82px, 68%);
  }

  .collection-grid.plate .image-box img,
  .collection-grid.frame .image-box img {
    width: min(280px, 88%);
  }

  .item-body {
    padding: 10px 11px 12px;
  }

  .item-title-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }

  .item-body h2 {
    font-size: 0.92rem;
  }

  .item-body p {
    font-size: 0.8rem;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
}

@media (max-width: 380px) {
  .collections-page {
    padding-inline: 6px;
  }

  .collection-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
