<template>
  <main class="content-area">
        <section class="page-header">
          <div class="header-copy">
            <span class="header-kicker">Delivery Console</span>
            <h2>Maimai SDGB Delivery</h2>
            <p class="desc">拉取指定版本的 Delivery 结果，并把 TXT 内的安装包地址直接整理成可复制的列表。</p>
          </div>
        </section>

        <section class="actions-card">
          <div class="input-group">
            <label>指定版本</label>
            <input
              v-model="versionInput"
              type="text"
              placeholder="例如: 1.53"
              class="version-input"
              @keyup.enter="fetchDelivery"
            />
            <span class="input-tip">留空时使用 SEGA 当前返回的默认版本。</span>
          </div>

          <div class="action-row">
            <button class="action-btn" type="button" @click="fetchDelivery" :disabled="loading">
              {{ loading ? "拉取中..." : "拉取 Delivery" }}
            </button>
            <button
              v-if="deliveryData"
              class="ghost-btn"
              type="button"
              @click="copyGroupedUrls"
              :disabled="!allPackageUrls.length"
            >
              复制全部包地址
            </button>
          </div>
        </section>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <section v-if="deliveryData" class="result-shell">
          <div class="summary-card">
            <div class="summary-top">
              <div>
                <h3>解析结果</h3>
                <p class="summary-desc">已将 TXT 里的安装链接拆分并按类型整理。</p>
              </div>
              <div class="summary-actions">
                <a
                  v-if="deliveryData.txt_urls.length === 1"
                  :href="deliveryData.txt_urls[0]"
                  target="_blank"
                  class="text-link"
                >
                  打开 TXT
                </a>
                <button class="ghost-btn" type="button" @click="copyTxtUrls">
                  复制 TXT 地址
                </button>
              </div>
            </div>

            <div class="summary-metrics">
              <div class="metric-card">
                <span class="metric-label">TXT</span>
                <strong>{{ deliveryData.txt_urls.length }}</strong>
              </div>
              <div class="metric-card metric-app">
                <span class="metric-label">APP</span>
                <strong>{{ deliveryData.app_urls.length }}</strong>
              </div>
              <div class="metric-card metric-opt">
                <span class="metric-label">OPT</span>
                <strong>{{ deliveryData.opt_urls.length }}</strong>
              </div>
              <div class="metric-card">
                <span class="metric-label">总条目</span>
                <strong>{{ deliveryData.package_urls.length }}</strong>
              </div>
            </div>
          </div>

          <div class="panel-grid">
            <section class="panel-card">
              <div class="panel-header">
                <div>
                  <h4>TXT 来源</h4>
                  <p>后端会依次访问这些 TXT 并提取包地址。</p>
                </div>
              </div>
              <ul class="link-list compact">
                <li v-for="txtUrl in deliveryData.txt_urls" :key="txtUrl" class="link-item">
                  <div class="link-main">
                    <span class="link-badge badge-txt">TXT</span>
                    <a :href="txtUrl" target="_blank" class="link-url">{{ txtUrl }}</a>
                  </div>
                  <button class="copy-icon-btn" type="button" @click="copySingleUrl(txtUrl)">复制</button>
                </li>
              </ul>
            </section>

            <section class="panel-card">
              <div class="panel-header">
                <div>
                  <h4>APP 包</h4>
                  <p>主程序安装包地址。</p>
                </div>
                <button class="ghost-btn" type="button" @click="copyUrls(deliveryData.app_urls)" :disabled="!deliveryData.app_urls.length">
                  复制 APP
                </button>
              </div>

              <div v-if="!deliveryData.app_urls.length" class="empty-state">没有解析到 APP 地址。</div>
              <ul v-else class="link-list">
                <li
                  v-for="item in appPackages"
                  :key="item.url"
                  class="link-item"
                >
                  <div class="link-main">
                    <span class="link-badge badge-app">APP</span>
                    <div class="link-copy">
                      <strong class="link-file">{{ item.filename }}</strong>
                      <a :href="item.url" target="_blank" class="link-url">{{ item.url }}</a>
                    </div>
                  </div>
                  <button class="copy-icon-btn" type="button" @click="copySingleUrl(item.url)">复制</button>
                </li>
              </ul>
            </section>

            <section class="panel-card">
              <div class="panel-header">
                <div>
                  <h4>OPT 包</h4>
                  <p>资源或附加包地址。</p>
                </div>
                <button class="ghost-btn" type="button" @click="copyUrls(deliveryData.opt_urls)" :disabled="!deliveryData.opt_urls.length">
                  复制 OPT
                </button>
              </div>

              <div v-if="!deliveryData.opt_urls.length" class="empty-state">没有解析到 OPT 地址。</div>
              <ul v-else class="link-list">
                <li
                  v-for="item in optPackages"
                  :key="item.url"
                  class="link-item"
                >
                  <div class="link-main">
                    <span class="link-badge badge-opt">OPT</span>
                    <div class="link-copy">
                      <strong class="link-file">{{ item.filename }}</strong>
                      <a :href="item.url" target="_blank" class="link-url">{{ item.url }}</a>
                    </div>
                  </div>
                  <button class="copy-icon-btn" type="button" @click="copySingleUrl(item.url)">复制</button>
                </li>
              </ul>
            </section>
          </div>

          <section class="panel-card full-width">
            <div class="panel-header">
              <div>
                <h4>全部条目</h4>
                <p>包含文件名、来源 TXT 和完整地址。</p>
              </div>
            </div>

            <div v-if="!deliveryData.package_urls.length" class="empty-state">
              没有解析到可用安装包地址。
            </div>

            <div v-else class="table-shell">
              <table class="package-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>文件名</th>
                    <th>来源 TXT</th>
                    <th>地址</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in deliveryData.package_urls" :key="item.url">
                    <td>
                      <span class="link-badge" :class="item.type === 'app' ? 'badge-app' : item.type === 'opt' ? 'badge-opt' : 'badge-txt'">
                        {{ item.type.toUpperCase() }}
                      </span>
                    </td>
                    <td class="mono-cell">{{ item.filename }}</td>
                    <td class="mono-cell">{{ getFileName(item.source_txt) }}</td>
                    <td class="mono-cell">
                      <a :href="item.url" target="_blank" class="link-url">{{ item.url }}</a>
                    </td>
                    <td>
                      <button class="copy-icon-btn" type="button" @click="copySingleUrl(item.url)">复制</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="deliveryData.fetch_errors?.length" class="fetch-warning">
              <strong>部分 TXT 抓取失败：</strong>
              <span>{{ deliveryData.fetch_errors.join(" | ") }}</span>
            </div>
            <div v-else-if="!deliveryData.fetch_txt_ok" class="fetch-warning">
              后端未能从 TXT 中解析到可用包地址，请检查 TXT 原文。
            </div>
          </section>
        </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import http from "@/utils/http";
import Swal from "sweetalert2";

interface DeliveryPackage {
  type: string;
  url: string;
  filename: string;
  source_txt: string;
}

interface DeliveryResponse {
  txt_uri: string;
  txt_urls: string[];
  package_urls: DeliveryPackage[];
  app_urls: string[];
  opt_urls: string[];
  fetch_txt_ok: boolean;
  fetch_errors: string[];
}

const versionInput = ref("");
const loading = ref(false);
const error = ref("");
const deliveryData = ref<DeliveryResponse | null>(null);

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2500,
  showConfirmButton: false,
});

const appPackages = computed(() =>
  deliveryData.value?.package_urls.filter((item) => item.type === "app") ?? [],
);

const optPackages = computed(() =>
  deliveryData.value?.package_urls.filter((item) => item.type === "opt") ?? [],
);

const allPackageUrls = computed(() => deliveryData.value?.package_urls.map((item) => item.url) ?? []);

const fetchDelivery = async () => {
  loading.value = true;
  error.value = "";
  deliveryData.value = null;

  try {
    const params: Record<string, string> = {};
    if (versionInput.value.trim()) {
      params.ver = versionInput.value.trim();
    }

    const res = await http.get("/maimai/delivery", { params, timeout: 60000 });
    if (res.data?.ok) {
      deliveryData.value = {
        txt_uri: res.data.data.txt_uri ?? "",
        txt_urls: res.data.data.txt_urls ?? [],
        package_urls: res.data.data.package_urls ?? [],
        app_urls: res.data.data.app_urls ?? [],
        opt_urls: res.data.data.opt_urls ?? [],
        fetch_txt_ok: Boolean(res.data.data.fetch_txt_ok),
        fetch_errors: res.data.data.fetch_errors ?? [],
      };
      Toast.fire({ icon: "success", title: "获取成功" });
    }
  } catch (e: any) {
    error.value = e.response?.data?.detail || "获取失败，可能是 SEGA 服务器超时或返回异常。";
    Toast.fire({ icon: "error", title: "请求失败" });
  } finally {
    loading.value = false;
  }
};

const copyUrls = async (urls: string[]) => {
  if (!urls.length) {
    return;
  }

  try {
    await navigator.clipboard.writeText(urls.join("\n"));
    Toast.fire({ icon: "success", title: "复制成功" });
  } catch {
    Toast.fire({ icon: "error", title: "复制失败" });
  }
};

const copyGroupedUrls = async () => {
  await copyUrls(allPackageUrls.value);
};

const copyTxtUrls = async () => {
  await copyUrls(deliveryData.value?.txt_urls ?? []);
};

const copySingleUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    Toast.fire({ icon: "success", title: "链接已复制" });
  } catch {
    Toast.fire({ icon: "error", title: "复制失败" });
  }
};

const getFileName = (url: string) => url.split("/").pop()?.split("?")[0] ?? url;
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 191, 36, 0.14), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #f6fbff 48%, #f7fcfa 100%);
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

.page-header {
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(255, 191, 36, 0.18);
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 20%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(246, 251, 255, 0.94));
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.header-kicker {
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

.desc {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.actions-card,
.summary-card,
.panel-card,
.error-msg {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
}

.actions-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
  padding: 24px;
}

.input-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: min(100%, 280px);
}

.input-group label {
  color: #475569;
  font-size: 0.9rem;
  font-weight: 800;
}

.input-tip {
  color: #94a3b8;
  font-size: 0.8rem;
}

.version-input {
  min-width: 0;
  max-width: 360px;
  padding: 13px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #f8fbff;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.version-input:focus {
  border-color: rgba(249, 115, 22, 0.4);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.12);
}

.action-row,
.summary-actions,
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn,
.ghost-btn,
.copy-icon-btn {
  border: 0;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.action-btn:hover:not(:disabled),
.ghost-btn:hover:not(:disabled),
.copy-icon-btn:hover {
  transform: translateY(-1px);
}

.action-btn {
  padding: 12px 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.22);
}

.ghost-btn {
  padding: 11px 16px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #334155;
  font-weight: 700;
}

.action-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  padding: 16px 18px;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.95);
  border-color: rgba(239, 68, 68, 0.18);
}

.result-shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-card {
  padding: 22px 24px;
}

.summary-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-card h3,
.panel-card h4 {
  margin: 0;
  color: #0f172a;
}

.summary-desc,
.panel-header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.summary-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.metric-card {
  padding: 16px;
  border-radius: 18px;
  background: #f8fbff;
}

.metric-app {
  background: rgba(59, 130, 246, 0.08);
}

.metric-opt {
  background: rgba(249, 115, 22, 0.08);
}

.metric-label {
  display: block;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.5rem;
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.panel-card {
  padding: 20px;
  min-width: 0;
}

.full-width {
  width: 100%;
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.link-list.compact {
  gap: 10px;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.link-main,
.link-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.link-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.badge-txt {
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
}

.badge-app {
  background: rgba(59, 130, 246, 0.14);
  color: #1d4ed8;
}

.badge-opt {
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
}

.link-file,
.mono-cell {
  font-family: "Consolas", "Monaco", monospace;
  word-break: break-all;
}

.link-url {
  color: #1d4ed8;
  word-break: break-all;
  text-decoration: none;
}

.link-url:hover,
.text-link:hover {
  text-decoration: underline;
}

.copy-icon-btn {
  padding: 8px 12px;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.18);
  white-space: nowrap;
}

.empty-state {
  margin-top: 16px;
  padding: 26px 16px;
  border-radius: 16px;
  background: #f8fbff;
  color: #64748b;
  text-align: center;
}

.table-shell {
  margin-top: 16px;
  overflow-x: auto;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.package-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

.package-table th,
.package-table td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  text-align: left;
  vertical-align: top;
}

.package-table th {
  background: #f8fbff;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 800;
}

.fetch-warning {
  margin-top: 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 247, 237, 0.96);
  border: 1px solid rgba(249, 115, 22, 0.16);
  color: #c2410c;
  line-height: 1.7;
}

.text-link {
  color: #f97316;
  text-decoration: none;
  font-weight: 800;
}

[data-theme="dark"] .app-layout {
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.1), transparent 22%),
    linear-gradient(180deg, #0f172a 0%, #111827 48%, #0b1220 100%);
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .actions-card,
[data-theme="dark"] .summary-card,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .error-msg,
[data-theme="dark"] .metric-card,
[data-theme="dark"] .link-item,
[data-theme="dark"] .empty-state,
[data-theme="dark"] .table-shell,
[data-theme="dark"] .package-table,
[data-theme="dark"] .version-input,
[data-theme="dark"] .ghost-btn,
[data-theme="dark"] .copy-icon-btn {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  color: #e2e8f0;
}

[data-theme="dark"] .page-header {
  background:
    radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 20%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(135deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
}

[data-theme="dark"] .page-header h2,
[data-theme="dark"] .summary-card h3,
[data-theme="dark"] .panel-card h4,
[data-theme="dark"] .metric-card strong,
[data-theme="dark"] .version-input {
  color: #e2e8f0;
}

[data-theme="dark"] .desc,
[data-theme="dark"] .input-group label,
[data-theme="dark"] .input-tip,
[data-theme="dark"] .summary-desc,
[data-theme="dark"] .panel-header p,
[data-theme="dark"] .metric-label,
[data-theme="dark"] .badge-txt {
  color: #94a3b8;
}

[data-theme="dark"] .metric-app {
  background: rgba(30, 64, 175, 0.22);
}

[data-theme="dark"] .metric-opt {
  background: rgba(154, 52, 18, 0.3);
}

[data-theme="dark"] .package-table th {
  background: rgba(30, 41, 59, 0.92);
  color: #cbd5e1;
}

[data-theme="dark"] .package-table td {
  border-bottom-color: rgba(71, 85, 105, 0.24);
}

[data-theme="dark"] .fetch-warning {
  background: rgba(120, 53, 15, 0.34);
  border-color: rgba(249, 115, 22, 0.22);
  color: #fdba74;
}

[data-theme="dark"] .error-msg {
  background: rgba(127, 29, 29, 0.24);
  color: #fca5a5;
}

@media (max-width: 1200px) {
  .main-wrapper {
    margin-left: 260px;
  }

  .panel-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .actions-card,
  .summary-card,
  .panel-card {
    padding: 18px;
    border-radius: 20px;
  }

  .summary-metrics {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .version-input,
  .action-btn,
  .ghost-btn {
    width: 100%;
    max-width: none;
  }

  .action-row,
  .summary-actions {
    width: 100%;
  }

  .link-item {
    flex-direction: column;
  }

  .package-table th,
  .package-table td {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
}
</style>
