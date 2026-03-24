<template>
  <div class="app-layout">
    <LayoutSidebar />

    <div class="main-wrapper">
      <LayoutHeader />

      <main class="content-area">
        <div class="page-header">
          <div class="title-row">
            <h2>💰 我的积分</h2>
            <button
              class="sign-btn"
              :class="{ 'is-disabled': hasSignedInToday }"
              @click="handleSignIn"
              :disabled="hasSignedInToday || isSigning"
            >
              {{
                isSigning
                  ? "签到中..."
                  : hasSignedInToday
                    ? "今日已签到"
                    : "🎁 立即签到"
              }}
            </button>
          </div>
          <p class="subtitle">在这里查看你的积分、好感度与签到记录</p>
        </div>

        <div v-if="isLoading" class="stats-grid">
          <div class="stat-card skeleton-card" v-for="i in 4" :key="i">
            <div class="skeleton-icon"></div>
            <div class="skeleton-text">
              <div class="line short"></div>
              <div class="line long"></div>
            </div>
          </div>
        </div>

        <template v-else-if="creditData">
          <div class="stats-grid">
            <div class="stat-card highlight-card">
              <div class="card-icon">💰</div>
              <div class="card-info">
                <span class="label">
                  当前积分 (Credits)
                  <button
                    class="help-btn"
                    @click="openHelp('credit')"
                    title="积分说明"
                  >
                    ?
                  </button>
                </span>
                <span class="value">{{ creditData.Credits }}</span>
              </div>
            </div>

            <div class="stat-card affection-card">
              <div class="card-icon">❤️</div>
              <div class="card-info">
                <span class="label">
                  Break 好感度 (Affection)
                  <button
                    class="help-btn"
                    @click="openHelp('affection')"
                    title="好感度说明"
                  >
                    ?
                  </button>
                </span>
                <span class="value">
                  {{ creditData.Affection }}
                  <span class="aff-level">{{ affectionLevelName }}</span>
                </span>
              </div>
            </div>

            <div class="stat-card">
              <div class="card-icon">🔥</div>
              <div class="card-info">
                <span class="label">连续签到</span>
                <span class="value"
                  >{{ creditData.ContiSignCount }}
                  <span class="unit">天</span></span
                >
              </div>
            </div>

            <div class="stat-card">
              <div class="card-icon">📅</div>
              <div class="card-info">
                <span class="label">累计签到</span>
                <span class="value"
                  >{{ creditData.TotalSignCount }}
                  <span class="unit">天</span></span
                >
                <span class="sub-text" v-if="creditData.LastSignDate">
                  上次: {{ formattedLastSignDate }}
                </span>
                <span class="sub-text" v-else> 暂无签到记录 </span>
              </div>
            </div>
          </div>

          <div class="rank-boards-container" v-if="rankData">
            <div class="rank-section">
              <div class="rank-header">
                <h3>🏆 积分榜</h3>
                <span class="my-rank-badge"
                  >我的排名: <b>{{ rankData.credit_rank.my_rank }}</b></span
                >
              </div>
              <div class="rank-list">
                <div
                  v-for="item in rankData.credit_rank.list"
                  :key="'c' + item.qq"
                  class="rank-item"
                  :class="{ 'is-me': item.is_me }"
                >
                  <div class="rank-left">
                    <div class="rank-num" :class="'top-' + item.rank">
                      {{
                        item.rank <= 3
                          ? ["🥇", "🥈", "🥉"][item.rank - 1]
                          : item.rank
                      }}
                    </div>
                    <img
                      class="rank-avatar"
                      :src="`http://q1.qlogo.cn/g?b=qq&nk=${item.qq}&s=100`"
                      :title="'QQ: ' + item.qq"
                      alt="avatar"
                    />
                  </div>
                  <div class="rank-score">
                    {{ item.score }} <span>pts</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="rank-section">
              <div class="rank-header">
                <h3>❤️ 好感榜</h3>
                <span class="my-rank-badge"
                  >我的排名: <b>{{ rankData.affection_rank.my_rank }}</b></span
                >
              </div>
              <div class="rank-list">
                <div
                  v-for="item in rankData.affection_rank.list"
                  :key="'a' + item.qq"
                  class="rank-item"
                  :class="{ 'is-me': item.is_me }"
                >
                  <div class="rank-left">
                    <div class="rank-num" :class="'top-' + item.rank">
                      {{
                        item.rank <= 3
                          ? ["🥇", "🥈", "🥉"][item.rank - 1]
                          : item.rank
                      }}
                    </div>
                    <img
                      class="rank-avatar"
                      :src="`http://q1.qlogo.cn/g?b=qq&nk=${item.qq}&s=100`"
                      :title="'QQ: ' + item.qq"
                      alt="avatar"
                    />
                  </div>
                  <div class="rank-score affection-color">
                    {{ item.score }} <span>♥</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="error-msg">获取资产数据失败，请刷新页面重试。</div>
      </main>

      <LayoutFooter />
    </div>

    <transition name="fade">
      <div class="help-modal-overlay" v-if="helpType" @click="closeHelp">
        <div class="help-modal-content" @click.stop>
          <h3>{{ helpType === "credit" ? "💰 关于积分" : "❤️ 关于好感度" }}</h3>

          <div class="help-text" v-if="helpType === 'credit'">
            <p>
              <b>什么是积分？</b><br />积分是 Break Bot / Break Net
              的基础交互资产。
            </p>
            <p>
              <b>如何获得？</b><br />1.
              每日在网页端或有Bot的QQ群内发送“签到”。<br />2.
              签到时可能触发各种随机事件获取大量积分。<br />3.
              参与群内的抽奖、抢劫等互动玩法。
            </p>
            <p>
              <b>有什么用？</b
              ><br />积分可以在Maimai等功能处消耗，未来也会开放更多与积分有关的玩法！
            </p>
          </div>

          <div class="help-text" v-else-if="helpType === 'affection'">
            <p>
              <b>什么是好感度？</b><br />好感度代表了 Break
              对你的态度与羁绊深度的量化。
            </p>
            <p>
              <b>如何获得？</b><br />每次签到时，Break
              都有几率对你触发随机事件的交互，每次触发都会提升不同数值的好感度。
            </p>
            <p>
              <b>阶段说明：</b><br />Lv.0 陌生 (0~9)<br />Lv.1 初识 (10~49)<br />Lv.2
              熟悉 (50~149)<br />Lv.3 亲近 (150~499)<br />Lv.4 亲密 (500~999)<br />Lv.5
              羁绊 (1000+)
            </p>
            <p class="easter-egg">
              <span class="spoiler-text" title="你知道的太多了">没有HCG</span>
            </p>
          </div>

          <button class="close-modal-btn" @click="closeHelp">我知道了</button>
        </div>
      </div>
    </transition>

    <transition name="toast-slide">
      <div v-if="toastMsg" class="custom-toast" :class="toastType">
        <div class="toast-icon">
          <span v-if="toastType === 'success'">✅</span>
          <span v-else-if="toastType === 'error'">❌</span>
        </div>
        <div class="toast-content" v-html="toastMsg"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import LayoutSidebar from "@/components/layout/LayoutSidebar.vue";
import LayoutHeader from "@/components/layout/LayoutHeader.vue";
import LayoutFooter from "@/components/layout/LayoutFooter.vue";
import http from "@/utils/http";

interface CreditData {
  _id: number;
  Credits: number;
  Affection: number;
  LastSignDate: string;
  ContiSignCount: number;
  TotalSignCount: number;
}

const isLoading = ref(true);
const isSigning = ref(false);
const creditData = ref<CreditData | null>(null);
const rankData = ref<any>(null);

const helpType = ref<"credit" | "affection" | null>(null);
const openHelp = (type: "credit" | "affection") => {
  helpType.value = type;
};
const closeHelp = () => {
  helpType.value = null;
};

// ✨ 新增：Toast 相关状态与控制函数
const toastMsg = ref("");
const toastType = ref<"success" | "error">("success");
let toastTimer: any = null;

const showToast = (
  msg: string,
  type: "success" | "error" = "success",
  duration: number = 4000,
) => {
  if (toastTimer) clearTimeout(toastTimer); // 如果连点，重置定时器
  toastMsg.value = msg;
  toastType.value = type;

  toastTimer = setTimeout(() => {
    toastMsg.value = "";
  }, duration);
};

// ================= 1. 数据计算与格式化 =================

const affectionLevelName = computed(() => {
  if (!creditData.value) return "";
  const aff = creditData.value.Affection;
  if (aff < 10) return "Lv.0 陌生";
  if (aff < 50) return "Lv.1 初识";
  if (aff < 150) return "Lv.2 熟悉";
  if (aff < 500) return "Lv.3 亲近";
  if (aff < 1000) return "Lv.4 亲密";
  return "Lv.5 羁绊";
});

const formattedLastSignDate = computed(() => {
  const dateStr = creditData.value?.LastSignDate;
  if (!dateStr || dateStr.length !== 8) return "暂无";
  const y = dateStr.substring(0, 4);
  const m = parseInt(dateStr.substring(4, 6), 10);
  const d = parseInt(dateStr.substring(6, 8), 10);
  return `${y}-${m}-${d}`;
});

const hasSignedInToday = computed(() => {
  if (!creditData.value?.LastSignDate) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, "0")}${today.getDate().toString().padStart(2, "0")}`;
  return creditData.value.LastSignDate === todayStr;
});

// ================= 2. 网络请求 =================

const fetchAllData = async () => {
  isLoading.value = true;
  try {
    const [creditRes, rankRes] = await Promise.all([
      http.get("/user/credit"),
      http.get("/user/rank"),
    ]);

    if (creditRes.data && creditRes.data.ok) {
      creditData.value = creditRes.data.data;
    }
    if (rankRes.data && rankRes.data.ok) {
      rankData.value = rankRes.data.data;
    }
  } catch (error) {
    console.error("请求数据异常:", error);
  } finally {
    isLoading.value = false;
  }
};

const handleSignIn = async () => {
  if (hasSignedInToday.value || isSigning.value) return;

  isSigning.value = true;
  try {
    const res = await http.post("/user/sign");
    if (res.data?.ok) {
      const d = res.data.data;
      // ✨ 优化：使用 HTML 格式的精美 Toast 提示
      const htmlMsg = `
        <div style="font-weight:bold; margin-bottom:4px; font-size:1.1rem;">签到成功！</div>
        <div style="color:#f59e0b;">💰 积分 +${d.added_credits}</div>
        <div style="color:#ef4444; margin-bottom:4px;">❤️ 好感度 +${d.added_affection}</div>
        <div style="font-size:0.9rem; color:var(--text-secondary);">${d.event_info.replace(/\n/g, "<br>")}</div>
        <div style="font-size:0.9rem; color:var(--text-secondary);">${d.affection_info.replace(/\n/g, "<br>")}</div>
      `;
      showToast(htmlMsg, "success");
      await fetchAllData();
    } else {
      showToast(res.data?.message || "签到失败", "error");
    }
  } catch (err) {
    showToast("网络请求出错，请稍后重试", "error");
  } finally {
    isSigning.value = false;
  }
};

onMounted(() => {
  fetchAllData();
});
</script>

<style scoped>
/* 保持原有所有样式不变 */
/* ... (请保留你代码里原本的 .app-layout, .stats-grid, .rank-boards-container, .help-modal-overlay 等所有的 CSS) ... */

.app-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-main);
  overflow-x: hidden;
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
  gap: 32px;
}

.page-header {
  margin-bottom: 8px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 8px;
}
.title-row h2 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--text-main);
}
.subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.95rem;
}

.sign-btn {
  background: var(--primary-color);
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(var(--primary-color-rgb), 0.3);
  transition: all 0.3s ease;
  white-space: nowrap;
}
.sign-btn:hover:not(.is-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--primary-color-rgb), 0.4);
}
.sign-btn.is-disabled {
  background: var(--border-color);
  color: var(--text-muted);
  cursor: not-allowed;
  box-shadow: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  animation: fadeIn 0.4s ease-out;
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

.stat-card {
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 15px var(--shadow-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: var(--bg-color);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}
.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.card-info .label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}
.card-info .value {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text-main);
  line-height: 1.2;
}
.card-info .unit {
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-secondary);
}
.card-info .sub-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 6px;
}

.help-btn {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--text-muted);
  color: var(--surface-color);
  border: none;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  margin-left: 8px;
  opacity: 0.6;
  transition:
    opacity 0.2s,
    transform 0.2s;
}
.help-btn:hover {
  opacity: 1;
  transform: scale(1.1);
  background-color: var(--text-main);
}

.highlight-card {
  border-color: var(--primary-color);
  background: linear-gradient(
    145deg,
    var(--surface-color) 60%,
    rgba(var(--primary-color-rgb), 0.1)
  );
}
.affection-card {
  border-color: #ff4d4f;
  background: linear-gradient(
    145deg,
    var(--surface-color) 60%,
    rgba(255, 77, 79, 0.05)
  );
}
.aff-level {
  font-size: 0.85rem;
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
  padding: 4px 8px;
  border-radius: 6px;
  margin-left: 8px;
  vertical-align: middle;
  font-weight: bold;
}

.skeleton-card {
  background: var(--surface-color);
}
.skeleton-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  background: var(--bg-color);
  animation: pulse 1.5s infinite alternate;
}
.skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.skeleton-text .line {
  height: 16px;
  background: var(--bg-color);
  border-radius: 8px;
  animation: pulse 1.5s infinite alternate;
}
.skeleton-text .short {
  width: 60%;
}
.skeleton-text .long {
  width: 90%;
  height: 28px;
}
@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.error-msg {
  color: #ef4444;
  padding: 20px;
  text-align: center;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 12px;
}

.rank-boards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 10px;
}
.rank-section {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  flex: 0 1 360px;
  min-width: 280px;
}
.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.rank-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}
.my-rank-badge {
  background: var(--bg-color);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}
.my-rank-badge b {
  color: var(--primary-color);
  font-size: 0.95rem;
}
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rank-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-radius: 12px;
  background: var(--bg-color);
  transition:
    transform 0.2s,
    background 0.3s;
}
.rank-item:hover {
  transform: translateX(5px);
  background: var(--surface-color);
}
.rank-item.is-me {
  border: 1px solid var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.05);
}
.rank-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.rank-num {
  width: 28px;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--text-muted);
  text-align: center;
}
.rank-num.top-1 {
  color: #ffd700;
  font-size: 1.4rem;
}
.rank-num.top-2 {
  color: #c0c0c0;
  font-size: 1.4rem;
}
.rank-num.top-3 {
  color: #cd7f32;
  font-size: 1.4rem;
}
.rank-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  object-fit: cover;
  cursor: help;
}
.rank-score {
  font-weight: 900;
  font-size: 1.1rem;
  color: #ff8c00;
  text-align: right;
}
.rank-score.affection-color {
  color: #ff4d4f;
}
.rank-score span {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: normal;
  margin-left: 2px;
}

.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.help-modal-content {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 30px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
}
.help-modal-content h3 {
  margin: 0 0 16px 0;
  color: var(--text-main);
  font-size: 1.3rem;
}
.help-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 24px;
}
.help-text p {
  margin-top: 0;
  margin-bottom: 12px;
}
.help-text b {
  color: var(--text-main);
}
.close-modal-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-color);
  color: var(--text-main);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.close-modal-btn:hover {
  background: var(--border-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0;
  }
  .content-area {
    padding: 0 16px 20px 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .title-row {
    flex-wrap: wrap;
  }
  .rank-section {
    flex: 1 1 100%;
  }
}

.easter-egg {
  margin-top: 16px !important;
  text-align: right;
}
.spoiler-text {
  background-color: #2a2a2a;
  color: #2a2a2a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: help;
  transition: color 0.3s ease;
  user-select: none;
}
.spoiler-text:hover {
  color: #ffffff;
}

/* ================= ✨ 新增：Toast 轻提示样式 ================= */
.custom-toast {
  position: fixed;
  top: 40px; /* 距离顶部的距离 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 9999; /* 确保它在最顶层 */
  min-width: 280px;
}

.custom-toast.success {
  border-left: 4px solid #10b981;
} /* 成功是绿边 */
.custom-toast.error {
  border-left: 4px solid #ef4444;
} /* 失败是红边 */

.toast-icon {
  font-size: 1.2rem;
  margin-top: 2px; /* 和文字对齐 */
}

.toast-content {
  color: var(--text-main);
  line-height: 1.5;
}

/* Toast 滑动进入和离开的动画 */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 带一点回弹效果 */
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px); /* 向上缩回 */
}
</style>
