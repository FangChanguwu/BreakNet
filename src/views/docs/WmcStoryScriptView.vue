<template>
  <main class="doc-reader-page">
    <header class="doc-reader-header">
      <h1>WMC Story Script</h1>

      <div class="doc-actions">
        <a :href="docxUrl" download>Download</a>
      </div>
    </header>

    <section class="doc-reader-frame">
      <object :data="pdfUrl" type="application/pdf">
        <div class="doc-fallback">
          <h2>PDF 文件暂未生成</h2>
          <p>请将同名 PDF 放到 public 目录后刷新页面。</p>
          <a :href="docxUrl" download>下载原始 DOCX</a>
        </div>
      </object>
    </section>
  </main>
</template>

<script setup lang="ts">
const encodedName = "WMC%20Story%20Script%20English%20Translation";
const docxUrl = `/${encodedName}.docx`;
const pdfUrl = `/${encodedName}.pdf`;
</script>

<style scoped>
.doc-reader-page {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: #f6f7fb;
  color: #111827;
}

.doc-reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 14px clamp(14px, 3vw, 28px);
  border-bottom: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.96);
}

.doc-reader-header h1 {
  margin: 0;
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  line-height: 1.1;
}

.doc-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.doc-actions a,
.doc-fallback a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 8px 12px;
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 0;
  background: #fff;
  color: #111827;
  font-size: 0.86rem;
  font-weight: 850;
  text-decoration: none;
}

.doc-reader-frame {
  min-height: 0;
  padding: clamp(8px, 1.4vw, 16px);
}

.doc-reader-frame object {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 86px);
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
}

.doc-fallback {
  min-height: calc(100vh - 120px);
  display: grid;
  place-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}

.doc-fallback h2,
.doc-fallback p {
  margin: 0;
}

.doc-fallback p {
  color: #64748b;
}

@media (max-width: 640px) {
  .doc-reader-header {
    display: block;
  }

  .doc-actions {
    justify-content: flex-start;
    margin-top: 12px;
  }
}
</style>
