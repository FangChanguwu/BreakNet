<template>
  <main class="content-area">
        <div class="page-header">
          <div class="title-row">
            <h2>💰 我的积分</h2>
            <button
              class="redeem-btn"
              type="button"
              :disabled="isRedeeming"
              @click="handleRedeemCode"
            >
              {{ isRedeeming ? "兑换中..." : "兑换码" }}
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
                      :src="item.avatar_url"
                      :title="item.display_name"
                      alt="avatar"
                    />
                    <div class="rank-user">
                      <div class="rank-name-row">
                        <span class="rank-name">{{ item.display_name }}</span>
                      </div>
                      <span v-if="item.secondary_name" class="rank-meta">{{ item.secondary_name }}</span>
                    </div>
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
                      :src="item.avatar_url"
                      :title="item.display_name"
                      alt="avatar"
                    />
                    <div class="rank-user">
                      <div class="rank-name-row">
                        <span class="rank-name">{{ item.display_name }}</span>
                      </div>
                      <span v-if="item.secondary_name" class="rank-meta">{{ item.secondary_name }}</span>
                    </div>
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
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import Swal from "sweetalert2";
import http from "@/utils/http";

interface CreditData {
  _id: number;
  Credits: number;
  Affection: number;
  LastSignDate: string;
  ContiSignCount: number;
  TotalSignCount: number;
}

interface RankItem {
  rank: number;
  qq: number;
  score: number;
  is_me: boolean;
  display_name: string;
  secondary_name: string;
  registered: boolean;
  avatar_url: string;
}

interface RankSection {
  list: RankItem[];
  my_rank: string | number;
}

interface RankData {
  credit_rank: RankSection;
  affection_rank: RankSection;
}

const isLoading = ref(true);
const isRedeeming = ref(false);
const creditData = ref<CreditData | null>(null);
const rankData = ref<RankData | null>(null);

const helpType = ref<"credit" | "affection" | null>(null);
const openHelp = (type: "credit" | "affection") => {
  helpType.value = type;
};
const closeHelp = () => {
  helpType.value = null;
};

// Toast
const toastMsg = ref("");
const toastType = ref<"success" | "error">("success");
let toastTimer: any = null;

const showToast = (
  msg: string,
  type: "success" | "error" = "success",
  duration: number = 4000,
) => {
  if (toastTimer) clearTimeout(toastTimer);
  toastMsg.value = msg;
  toastType.value = type;

  toastTimer = setTimeout(() => {
    toastMsg.value = "";
  }, duration);
};

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

const handleRedeemCode = async () => {
  if (isRedeeming.value) return;

  const result = await Swal.fire({
    title: "兑换码",
    input: "text",
    inputPlaceholder: "请输入兑换码",
    showCancelButton: true,
    confirmButtonText: "兑换",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "var(--primary-color)",
    showLoaderOnConfirm: true,
    inputValidator: (value) => {
      if (!value.trim()) return "请输入兑换码";
      return null;
    },
    preConfirm: async (value) => {
      const code = String(value || "").trim();
      if (!code) {
        Swal.showValidationMessage("请输入兑换码");
        return false;
      }
      isRedeeming.value = true;
      try {
        const res = await http.post("/user/redeem-code", { code });
        if (res.data?.ok) return res.data;
        Swal.showValidationMessage(res.data?.message || "兑换失败");
        return false;
      } catch (error: any) {
        Swal.showValidationMessage(
          error?.response?.data?.detail || error?.response?.data?.message || "兑换码不存在",
        );
        return false;
      } finally {
        isRedeeming.value = false;
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });

  if (!result.isConfirmed || !result.value?.ok) return;
  const reward = Number(result.value.data?.credits || result.value.data?.reward || 0);
  showToast(
    `<div style="font-weight:bold; margin-bottom:4px; font-size:1.1rem;">兑换成功！</div><div style="color:#f59e0b;">💰 积分 +${reward}</div>`,
    "success",
  );
  await fetchAllData();
};

const handleCreditUpdated = () => {
  fetchAllData();
};

onMounted(() => {
  fetchAllData();
  window.addEventListener("breaknet:credit-updated", handleCreditUpdated);
});

onUnmounted(() => {
  window.removeEventListener("breaknet:credit-updated", handleCreditUpdated);
});
</script>

<style scoped>
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
  min-width: 0;
}
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
}

.page-header {
  margin-bottom: 8px;
  padding: 28px;
  border-radius: 28px;
  border: 1px solid rgba(255, 196, 61, 0.16);
  background:
    radial-gradient(circle at top right, rgba(255, 196, 61, 0.16), transparent 22%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.1), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 251, 255, 0.94));
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
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

.sign-btn,
.redeem-btn {
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

.redeem-btn {
  background: linear-gradient(135deg, #f97316, #f59e0b);
}

.sign-btn:hover:not(.is-disabled),
.redeem-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--primary-color-rgb), 0.4);
}

:global(.swal2-input.swal2-inputerror) {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16) !important;
}

:global(.swal2-popup .swal2-input) {
  border-radius: 16px !important;
}

:global(.swal2-validation-message) {
  width: calc(100% - 5em) !important;
  margin: 6px 2em 0 auto !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  color: #dc2626 !important;
  font-size: 0.82rem !important;
  font-weight: 600 !important;
  justify-content: flex-start !important;
  text-align: left !important;
}

:global(.swal2-validation-message::before) {
  display: none !important;
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
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 251, 255, 0.94));
  border-radius: 22px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
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
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  color: var(--text-muted);
  border: 1px solid rgba(148, 163, 184, 0.16);
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
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.12);
  transition:
    transform 0.2s,
    background 0.3s,
    box-shadow 0.3s;
}
.rank-item:hover {
  transform: translateX(4px);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05);
}
.rank-item.is-me {
  border: 1px solid rgba(249, 115, 22, 0.28);
  background: linear-gradient(135deg, rgba(255, 237, 213, 0.72), rgba(255, 255, 255, 0.96));
}
.rank-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
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
  border: 2px solid rgba(255, 255, 255, 0.96);
  object-fit: cover;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
}
.rank-user {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.rank-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}
.rank-name {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.2;
  word-break: break-word;
}
.rank-meta {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.3;
  word-break: break-word;
}
.rank-score {
  font-weight: 900;
  font-size: 1.1rem;
  color: #ff8c00;
  text-align: right;
  flex-shrink: 0;
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

  .sign-btn {
    width: 100%;
  }

  .rank-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .rank-item {
    gap: 12px;
    padding: 12px;
  }

  .rank-left {
    min-width: 0;
    gap: 10px;
  }

  .rank-score {
    font-size: 1rem;
  }

  .rank-section {
    flex: 1 1 100%;
    min-width: 0;
  }

  .custom-toast {
    top: 20px;
    width: calc(100vw - 32px);
    min-width: 0;
    max-width: 420px;
    padding: 14px 16px;
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

.custom-toast {
  position: fixed;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  z-index: 9999;
  min-width: 280px;
}

.custom-toast.success {
  border-left: 4px solid #10b981;
}
.custom-toast.error {
  border-left: 4px solid #ef4444;
}

.toast-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.toast-content {
  color: var(--text-main);
  line-height: 1.5;
}

.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -30px);
}

[data-theme="dark"] .page-header {
  border-color: rgba(251, 191, 36, 0.18);
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.16), transparent 22%),
    radial-gradient(circle at left center, rgba(56, 189, 248, 0.12), transparent 26%),
    linear-gradient(135deg, rgba(20, 28, 43, 0.96), rgba(15, 23, 42, 0.96));
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.28);
}

[data-theme="dark"] .stat-card,
[data-theme="dark"] .rank-section {
  background: linear-gradient(180deg, rgba(21, 29, 45, 0.98), rgba(17, 24, 39, 0.96));
  border-color: rgba(71, 85, 105, 0.4);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.22);
}

[data-theme="dark"] .card-icon,
[data-theme="dark"] .help-modal-content,
[data-theme="dark"] .close-modal-btn,
[data-theme="dark"] .skeleton-icon,
[data-theme="dark"] .skeleton-text .line {
  background: rgba(30, 41, 59, 0.96);
}

[data-theme="dark"] .highlight-card {
  background: linear-gradient(145deg, rgba(21, 29, 45, 0.98) 60%, rgba(255, 140, 0, 0.16));
}

[data-theme="dark"] .affection-card {
  background: linear-gradient(145deg, rgba(21, 29, 45, 0.98) 60%, rgba(255, 77, 79, 0.12));
}

[data-theme="dark"] .aff-level {
  background: rgba(255, 77, 79, 0.16);
}

[data-theme="dark"] .rank-item {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(71, 85, 105, 0.34);
}

[data-theme="dark"] .rank-item:hover {
  background: rgba(17, 24, 39, 0.96);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.24);
}

[data-theme="dark"] .rank-item.is-me {
  border-color: rgba(249, 115, 22, 0.35);
  background: linear-gradient(135deg, rgba(91, 45, 12, 0.5), rgba(17, 24, 39, 0.96));
}

[data-theme="dark"] .my-rank-badge,
[data-theme="dark"] .modal-close,
[data-theme="dark"] .custom-toast {
  background: rgba(15, 23, 42, 0.96);
  border-color: rgba(71, 85, 105, 0.34);
}

[data-theme="dark"] .rank-name {
  color: #e2e8f0;
}

[data-theme="dark"] .rank-meta,
[data-theme="dark"] .my-rank-badge {
  color: #94a3b8;
}

[data-theme="dark"] .error-msg {
  background: rgba(127, 29, 29, 0.24);
}

@media (max-width: 1200px) {
  .main-wrapper {
    margin-left: 0;
  }
}
</style>
