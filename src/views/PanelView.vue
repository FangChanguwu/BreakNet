<template>
  <div class="app-layout">
    <LayoutSidebar />

    <div class="main-wrapper">
      <LayoutHeader />

      <main class="content-area">
        <GroupBanner />

        <div class="two-col-layout">
          <SongCard />

          <SponsorCard />
        </div>
      </main>

      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import LayoutSidebar from "../components/layout/LayoutSidebar.vue";
import LayoutHeader from "../components/layout/LayoutHeader.vue";
import LayoutFooter from "../components/layout/LayoutFooter.vue";

import GroupBanner from "../components/panel/GroupBanner.vue";
import SongCard from "../components/panel/SongCard.vue";
import SponsorCard from "../components/panel/SponsorCard.vue";
</script>

<style scoped>
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
  transition: margin-left 0.3s ease;
}

.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 预留位的通用卡片样式 */
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
}

.col-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: var(--primary-color);
}

.two-col-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

/* 预留位内部样式 */
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

.item-desc {
  color: var(--text-muted);
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 1100px) {
  .two-col-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
  .content-area {
    padding: 0 20px 20px 20px;
  }
}
</style>
