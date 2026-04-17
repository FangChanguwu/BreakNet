<template>
  <div class="app-shell">
    <LayoutSidebar />
    <div class="shell-main">
      <LayoutHeader />
      <router-view :key="route.fullPath" />
      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-main);
  overflow-x: hidden;
}

.shell-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 300px;
  min-width: 0;
  transition: margin-left 0.3s ease;
}

@media (max-width: 1200px) {
  .shell-main {
    margin-left: 0;
  }
}
</style>
