<template>
  <div class="app-layout">
    <LayoutSidebar />

    <div class="main-wrapper">
      <LayoutHeader />

      <main class="content-area">
        <div class="page-header">
          <h2>📥 Maimai SDGB Delivery</h2>
          <p class="desc">0MG,it's leak。</p>
        </div>

        <div class="actions-card">
          <div class="input-group">
            <label>指定版本 (可选)</label>
            <input v-model="versionInput" type="text" placeholder="例如: 1.53" class="version-input" />
          </div>
          <button class="action-btn" @click="fetchDelivery" :disabled="loading">
            {{ loading ? '请求中...' : '拉取 Delivery 参数' }}
          </button>
        </div>

        <div v-if="error" class="error-msg">
          ❌ {{ error }}
        </div>

        <div v-if="deliveryData" class="result-card">
          <div class="result-header">
            <h3>解析结果</h3>
            <div class="actions">
              <a :href="deliveryData.txt_uri" target="_blank" class="text-link" v-if="deliveryData.txt_uri">查看原始TXT文件</a>
              <button class="copy-btn" @click="copyAllUrls" style="margin-left: 12px;">复制所有OPT地址</button>
            </div>
          </div>
          <div class="list-container">
            <div v-if="!deliveryData.opt_urls || deliveryData.opt_urls.length === 0" class="empty-state">
              未找到任何可用的 OPT 链接。
            </div>
            <ul v-else class="url-list">
              <li v-for="(url, idx) in deliveryData.opt_urls" :key="idx">
                <span class="url-text">{{ url }}</span>
                <button class="copy-icon-btn" @click="copySingleUrl(url)" title="复制该链接">📋</button>
              </li>
            </ul>
            
            <div v-if="!deliveryData.fetch_txt_ok" class="fetch-warning">
              ⚠️ 自动抓取安装包链接失败（已返回原始 TXT 链接），请点击上方“查看原始TXT文件”手动提取。
            </div>
          </div>
        </div>
      </main>

      <LayoutFooter />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";
import Swal from "sweetalert2";

const versionInput = ref("");
const loading = ref(false);
const error = ref("");
const deliveryData = ref<any>(null);

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2500,
  showConfirmButton: false,
});

const fetchDelivery = async () => {
  loading.value = true;
  error.value = "";
  deliveryData.value = null;

  try {
    const params: any = {};
    if (versionInput.value.trim()) {
      params.ver = versionInput.value.trim();
    }
    const res = await http.get("/maimai/delivery", { params });
    if (res.data?.ok) {
      deliveryData.value = res.data.data;
      Toast.fire({ icon: "success", title: "获取成功" });
    }
  } catch (e: any) {
    error.value = e.response?.data?.detail || "获取失败, 可能是SEGA服务器请求超时等原因。";
    Toast.fire({ icon: "error", title: "请求失败" });
  } finally {
    loading.value = false;
  }
};

const copyAllUrls = async () => {
  if (!deliveryData.value?.opt_urls?.length) return;
  const text = deliveryData.value.opt_urls.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    Toast.fire({ icon: "success", title: "全部复制成功" });
  } catch (e) {
    Toast.fire({ icon: "error", title: "复制失败" });
  }
};

const copySingleUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    Toast.fire({ icon: "success", title: "链接已复制" });
  } catch (e) {
    Toast.fire({ icon: "error", title: "复制失败" });
  }
};
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
  min-width: 0;
}

.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.8rem;
  color: var(--text-main);
}

.desc {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.95rem;
}

.actions-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text-muted);
}

.version-input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-main);
  font-size: 1rem;
  min-width: 200px;
  outline: none;
  transition: all 0.2s;
}

.version-input:focus {
  border-color: var(--primary-color);
}

.action-btn {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 11px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-2px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 16px;
  border-radius: 12px;
  font-size: 0.95rem;
}

.result-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.result-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0,0,0,0.02);
}

.result-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.copy-btn {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--text-main);
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.list-container {
  padding: 16px 24px;
  background: var(--bg-color);
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  color: var(--text-muted);
  text-align: center;
  padding: 32px 0;
  font-size: 0.95rem;
}

.url-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.url-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  padding: 10px 16px;
  border-radius: 8px;
  gap: 16px;
}

.url-text {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  color: var(--text-main);
  word-break: break-all;
}

.copy-icon-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 4px;
}

.copy-icon-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.actions {
  display: flex;
  align-items: center;
}

.text-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: bold;
}

.text-link:hover {
  text-decoration: underline;
}

.fetch-warning {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 140, 0, 0.1);
  border-left: 4px solid var(--primary-color);
  color: var(--primary-color);
  font-size: 0.9rem;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }

  .content-area {
    padding: 20px;
  }
}
</style>
