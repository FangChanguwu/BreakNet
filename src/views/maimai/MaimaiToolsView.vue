<template>
  <main class="tools-page">
    <section class="page-header">
      <div>
        <span class="page-kicker">MAIMAI TOOLS</span>
        <h2>工具下载</h2>
      </div>
      <span class="access-pill">管理员</span>
    </section>

    <section class="tools-grid">
      <article v-for="tool in tools" :key="tool.name" class="tool-card">
        <div class="tool-icon">
          <span>{{ tool.initial }}</span>
        </div>
        <div class="tool-copy">
          <div class="tool-title-row">
            <h3>{{ tool.name }}</h3>
            <span>{{ tool.type }}</span>
          </div>
          <p>{{ tool.description }}</p>
        </div>
        <a class="download-btn" :href="tool.url" :download="tool.fileName">
          下载
        </a>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
type ToolItem = {
  name: string;
  initial: string;
  type: string;
  description: string;
  fileName: string;
  url: string;
};

const tools: ToolItem[] = [
  {
    name: "unsega",
    initial: "U",
    type: "EXE",
    description: "用于解包 maimai 的 app 与 opt 文件。",
    fileName: "unsega.exe",
    url: "https://assets.fangchang.asia/tool/unsega.exe",
  },
  {
    name: "maimai_dumper",
    initial: "M",
    type: "EXE",
    description: "读取 maimai hdd 的 StreamingAssets，并导出收藏品与乐曲信息。",
    fileName: "maimai_dumper.exe",
    url: "https://assets.fangchang.asia/tool/maimai_dumper.exe",
  },
];
</script>

<style scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 40px 40px;
  min-width: 0;
}

.page-header,
.tool-card {
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
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 24%),
    var(--surface-color);
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

.access-pill {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.14);
  color: var(--primary-color);
  font-weight: 900;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.tool-card {
  display: grid;
  grid-template-columns: 62px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.tool-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(59, 130, 246, 0.12));
}

.tool-icon span {
  color: var(--primary-color);
  font-size: 1.35rem;
  font-weight: 950;
}

.tool-copy {
  min-width: 0;
}

.tool-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.tool-title-row h3 {
  margin: 0;
  color: var(--text-main);
  font-size: 1.15rem;
}

.tool-title-row span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 900;
}

.tool-copy p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.65;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: #fff;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.22);
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .tool-card {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
}

[data-theme="dark"] .page-header {
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 24%),
    linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .tool-title-row span {
  background: rgba(148, 163, 184, 0.14);
}

@media (max-width: 720px) {
  .tools-page {
    padding: 0 16px 24px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .tools-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .tool-card {
    grid-template-columns: 52px minmax(0, 1fr);
  }

  .tool-icon {
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }

  .download-btn {
    grid-column: 1 / -1;
  }
}
</style>
