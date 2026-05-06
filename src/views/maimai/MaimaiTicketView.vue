<template>
  <main class="ticket-page">
    <section class="page-header">
      <div>
        <span class="page-kicker">MAIMAI TICKET</span>
        <h2>跑图券</h2>
        <p class="subtitle">冲刺，冲！</p>
      </div>
      <button class="ghost-btn" type="button" :disabled="loadingAccounts || issuing" @click="fetchAccounts">
        {{ loadingAccounts ? "刷新中..." : "刷新账号" }}
      </button>
    </section>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <section class="ticket-workspace">
      <article class="panel-card account-panel">
        <div class="panel-head">
          <div>
            <h3>当前账号</h3>
          </div>
        </div>

        <div v-if="loadingAccounts" class="state-box">
          <div class="spinner"></div>
          <p>正在读取绑定账号...</p>
        </div>

        <div v-else-if="!accounts.length" class="state-box empty">
          <p>当前还没有绑定 maimai 账号，请先到账号管理页绑定。</p>
        </div>

        <div v-else class="custom-select">
          <button class="select-trigger" type="button" @click="accountMenuOpen = !accountMenuOpen">
            <AccountOption v-if="selectedAccount" :account="selectedAccount" />
            <span class="select-arrow" :class="{ open: accountMenuOpen }">›</span>
          </button>

          <transition name="drop">
            <div v-if="accountMenuOpen" class="select-menu">
              <button
                v-for="account in accounts"
                :key="account.uid"
                class="select-option"
                type="button"
                :class="{ active: account.index === selectedAccountIndex }"
                @click="selectAccount(account.index)"
              >
                <AccountOption :account="account" />
              </button>
            </div>
          </transition>
        </div>

        <div v-if="selectedAccount" class="owned-ticket-section">
          <div class="owned-ticket-head">
            <strong>已有跑图券</strong>
            <span v-if="ticketChargeLoading">读取中...</span>
          </div>
          <div v-if="selectedTicketCharges.length" class="owned-ticket-grid">
            <article v-for="charge in selectedTicketCharges" :key="charge.chargeId" class="owned-ticket-card">
              <img class="owned-ticket-image" :src="getTicketImage(charge.chargeId)" :alt="`${charge.chargeId} 倍跑图券`" />
              <div>
                <strong>{{ charge.chargeId }} 倍</strong>
                <span>库存 {{ charge.stock }}</span>
                <small>{{ charge.validDate || "暂无有效期" }}</small>
              </div>
            </article>
          </div>
          <p v-else class="owned-ticket-empty">
            {{ ticketChargeLoading ? "正在读取当前账号的跑图券。" : "当前账号暂无跑图券。" }}
          </p>
        </div>
      </article>

      <article class="panel-card ticket-panel">
        <div class="panel-head">
          <div>
            <h3>选择票券</h3>
          </div>
        </div>

        <div class="ticket-select">
          <button class="ticket-trigger" type="button" @click="ticketMenuOpen = !ticketMenuOpen">
            <img class="ticket-image large" :src="selectedTicket.image" :alt="selectedTicket.label" />
            <div>
              <span>当前票券</span>
              <strong>{{ selectedTicket.label }}</strong>
            </div>
            <span class="select-arrow" :class="{ open: ticketMenuOpen }">›</span>
          </button>

          <transition name="drop">
            <div v-if="ticketMenuOpen" class="ticket-menu">
              <button
                v-for="ticket in tickets"
                :key="ticket.chargeId"
                type="button"
                class="ticket-option"
                :class="{ active: ticket.chargeId === selectedTicketId }"
                @click="selectTicket(ticket.chargeId)"
              >
                <img class="ticket-image" :src="ticket.image" :alt="ticket.label" />
                <span>{{ ticket.label }}</span>
              </button>
            </div>
          </transition>
        </div>

        <div class="issue-summary">
          <div>
            <span>目标账号</span>
            <strong>{{ selectedAccount?.displayName || "--" }}</strong>
          </div>
          <div>
            <span>票券 ID</span>
            <strong>{{ selectedTicket.chargeId }}</strong>
          </div>
          <div>
            <span>消耗积分</span>
            <strong>{{ ticketCost }}</strong>
          </div>
        </div>

        <button class="primary-btn issue-btn" type="button" :disabled="!canIssue" @click="issueTicket()">
          <span v-if="issuing" class="issue-progress">
            <span>{{ issueButtonText }}</span>
            <span class="loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </span>
          <span v-else>{{ issueButtonText }}</span>
        </button>
      </article>
    </section>

    <QrcodeRequestModal
      v-model="qrText"
      :open="showQrModal"
      :busy="issuing"
      title="需要新的二维码"
      description="当前账号登录失败，请上传二维码截图或直接粘贴二维码字符串后重新发券。"
      :hint="qrHint"
      submit-text="使用二维码发券"
      :busy-text="issueButtonText"
      @close="showQrModal = false"
      @submit="issueTicket"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from "vue";
import Swal from "sweetalert2";
import { maimaiApi } from "@/api/maimai";
import QrcodeRequestModal from "@/components/maimai/QrcodeRequestModal.vue";
import { useGlobalProgressStore } from "@/stores/globalProgress";

type AccountEntry = {
  uid: number;
  index: number;
  isCurrent: boolean;
  displayName: string;
  preview: {
    playerRating?: number;
    iconId?: number;
  };
};

type AccountsPayload = {
  accounts: AccountEntry[];
};

type TicketOption = {
  chargeId: number;
  label: string;
  image: string;
};

type TicketChargeEntry = {
  chargeId: number;
  stock: number;
  purchaseDate?: string;
  validDate?: string;
  extNum1?: number;
};

type TicketChargesPayload = {
  uid: number;
  charges: TicketChargeEntry[];
};

const tickets: TicketOption[] = [2, 3, 4, 5, 6].map((id) => ({
  chargeId: id,
  label: `${id} 倍跑图券`,
  image: `/maimai/ticket/${id}.png`,
}));

const accounts = ref<AccountEntry[]>([]);
const selectedAccountIndex = ref<number | null>(null);
const selectedTicketId = ref(2);
const loadingAccounts = ref(false);
const issuing = ref(false);
const issueStage = ref<"idle" | "login" | "issue" | "logout" | "done">("idle");
const error = ref("");
const accountMenuOpen = ref(false);
const ticketMenuOpen = ref(false);
const showQrModal = ref(false);
const ticketChargeLoading = ref(false);
const qrText = ref("");
const qrHint = ref("支持截图识别，也可以直接粘贴二维码原文。");
const ticketChargeCache = ref(new Map<number, TicketChargeEntry[]>());
const globalProgress = useGlobalProgressStore();

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2600,
  showConfirmButton: false,
  background: "var(--surface-color)",
  color: "var(--text-main)",
});

const AccountOption = defineComponent({
  name: "AccountOption",
  props: {
    account: {
      type: Object as () => AccountEntry,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h("div", { class: "account-option-inner" }, [
        h("img", {
          class: "account-avatar",
          src: getIconUrl(props.account.preview.iconId),
          alt: "icon",
          onError: (event: Event) => {
            (event.target as HTMLImageElement).src = "https://placehold.co/80x80/f2fbff/f97316?text=Icon";
          },
        }),
        h("div", { class: "account-option-copy" }, [
          h("strong", props.account.displayName || `UID ${props.account.uid}`),
          h("span", `UID ${props.account.uid}`),
        ]),
        h("b", { class: "rating-number" }, String(props.account.preview.playerRating ?? "--")),
      ]);
  },
});

const selectedAccount = computed(() =>
  accounts.value.find((account) => account.index === selectedAccountIndex.value) || null,
);
const selectedTicket = computed(() =>
  tickets.find((ticket) => ticket.chargeId === selectedTicketId.value) || tickets[0],
);
const selectedTicketCharges = computed(() => {
  if (selectedAccountIndex.value === null) return [];
  return ticketChargeCache.value.get(selectedAccountIndex.value) || [];
});
const selectedTicketOwned = computed(() =>
  selectedTicketCharges.value.some(
    (charge) => Number(charge.chargeId) === selectedTicket.value.chargeId && Number(charge.stock || 0) >= 1,
  ),
);
const ticketCost = computed(() => selectedTicket.value.chargeId * 10);
const canIssue = computed(() => !!selectedAccount.value && !issuing.value && !selectedTicketOwned.value);
const issueButtonText = computed(() => {
  if (selectedTicketOwned.value) return "已有该跑图券";
  if (issueStage.value === "login") return "登录中";
  if (issueStage.value === "issue") return "发券中";
  if (issueStage.value === "logout") return "登出中";
  if (issueStage.value === "done") return "完成";
  return "发放跑图券";
});

const formatAssetId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "000000";
  return String(value).slice(-6).padStart(6, "0");
};

const getIconUrl = (iconId?: number | string | null) =>
  `https://assets.breakdx.net/maimai/icon/UI_Icon_${formatAssetId(iconId)}.png`;

const getTicketImage = (chargeId: number) => `/maimai/ticket/${chargeId}.png`;

const normalizeAccounts = (payload?: AccountsPayload) => {
  accounts.value = payload?.accounts || [];
  const current = accounts.value.find((account) => account.isCurrent) || accounts.value[0] || null;
  selectedAccountIndex.value = current?.index ?? null;
};

const fetchAccounts = async () => {
  loadingAccounts.value = true;
  error.value = "";
  try {
    const res = await maimaiApi.getAccounts();
    if (res.data?.returnCode === 0) {
      normalizeAccounts(res.data.data as AccountsPayload);
      return;
    }
    error.value = res.data?.message || "读取绑定账号失败";
  } catch (requestError) {
    error.value = getErrorMessage(requestError, "读取绑定账号失败");
  } finally {
    loadingAccounts.value = false;
  }
};

const normalizeTicketCharges = (payload?: TicketChargesPayload | { userChargeList?: TicketChargeEntry[] }) => {
  const rawCharges = Array.isArray((payload as TicketChargesPayload | undefined)?.charges)
    ? (payload as TicketChargesPayload).charges
    : ((payload as { userChargeList?: TicketChargeEntry[] } | undefined)?.userChargeList || []);
  const validChargeIds = new Set(tickets.map((ticket) => ticket.chargeId));
  return rawCharges
    .filter((charge) => validChargeIds.has(Number(charge.chargeId)) && Number(charge.stock || 0) > 0)
    .map((charge) => ({
      ...charge,
      chargeId: Number(charge.chargeId),
      stock: Number(charge.stock || 0),
    }))
    .sort((left, right) => left.chargeId - right.chargeId);
};

const toNumber = (value: unknown, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toTicketChargeEntry = (value: unknown, fallbackChargeId: number): TicketChargeEntry | null => {
  if (!isRecord(value)) return null;
  const chargeId = toNumber(value.chargeId, fallbackChargeId);
  if (chargeId !== fallbackChargeId) return null;

  return {
    chargeId,
    stock: Math.max(1, toNumber(value.stock, 1)),
    purchaseDate: typeof value.purchaseDate === "string" ? value.purchaseDate : undefined,
    validDate: typeof value.validDate === "string" ? value.validDate : undefined,
    extNum1: value.extNum1 === undefined ? undefined : toNumber(value.extNum1),
  };
};

const findTicketChargeInPayload = (
  payload: unknown,
  chargeId: number,
  depth = 0,
): TicketChargeEntry | null => {
  if (depth > 3) return null;

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const charge = findTicketChargeInPayload(item, chargeId, depth + 1);
      if (charge) return charge;
    }
    return null;
  }

  const directCharge = toTicketChargeEntry(payload, chargeId);
  if (directCharge) return directCharge;
  if (!isRecord(payload)) return null;

  for (const key of ["charges", "userChargeList", "chargeList", "data", "result"]) {
    const charge = findTicketChargeInPayload(payload[key], chargeId, depth + 1);
    if (charge) return charge;
  }
  return null;
};

const upsertIssuedTicketCharge = (index: number, chargeId: number, payload: unknown) => {
  const issuedCharge = findTicketChargeInPayload(payload, chargeId) || {
    chargeId,
    stock: 1,
    purchaseDate: "刚刚发放",
  };
  const nextCache = new Map(ticketChargeCache.value);
  const currentCharges = nextCache.get(index) || [];
  const existingCharge = currentCharges.find((charge) => Number(charge.chargeId) === chargeId);
  const mergedCharge = existingCharge
    ? {
        ...existingCharge,
        ...issuedCharge,
        stock: Math.max(Number(existingCharge.stock || 0), Number(issuedCharge.stock || 0), 1),
      }
    : issuedCharge;

  nextCache.set(
    index,
    [...currentCharges.filter((charge) => Number(charge.chargeId) !== chargeId), mergedCharge].sort(
      (left, right) => left.chargeId - right.chargeId,
    ),
  );
  ticketChargeCache.value = nextCache;
};

const loadTicketCharges = async (index: number, forceRefresh = false) => {
  if (!forceRefresh && ticketChargeCache.value.has(index)) return;

  ticketChargeLoading.value = true;
  try {
    const res = await maimaiApi.getTicketCharges(index);
    if (res.data?.returnCode === 0) {
      const nextCache = new Map(ticketChargeCache.value);
      nextCache.set(index, normalizeTicketCharges(res.data.data));
      ticketChargeCache.value = nextCache;
      return;
    }
    Toast.fire({ icon: "error", title: res.data?.message || "读取跑图券失败" });
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "读取跑图券失败") });
  } finally {
    ticketChargeLoading.value = false;
  }
};

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
  accountMenuOpen.value = false;
};

const selectTicket = (chargeId: number) => {
  selectedTicketId.value = chargeId;
  ticketMenuOpen.value = false;
};

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const errorShape = requestError as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return errorShape.response?.data?.detail || errorShape.response?.data?.message || errorShape.message || fallback;
};

const cookieLostMessage = "Cookie已被服务端丢失导致发放失败，账号已进入小黑屋";
const qrcodeRequiredMessage = "登录状态已失效，请上传新的二维码截图或粘贴二维码内容后重试。";

const needsQrcode = (message: string) =>
  /qrcode|qr code|二维码|过期|未激活|失效|102|106/i.test(message);

const readStringField = (payload: unknown, key: string) => {
  if (!isRecord(payload)) return "";
  const value = payload[key];
  return typeof value === "string" ? value : "";
};

const hasCookieLostIssueError = (payload: unknown, message: string, depth = 0): boolean => {
  if (depth > 3) return false;
  if (/Cookie已被服务端丢失|CookieLosedError|CookieLostError|小黑屋/i.test(message)) {
    return true;
  }
  if (!isRecord(payload)) return false;

  const stage = readStringField(payload, "stage");
  const error = readStringField(payload, "error");
  const detail = readStringField(payload, "detail");
  const nestedMessage = readStringField(payload, "message");
  if (/CookieLosedError|CookieLostError|CookieExpiredError/i.test(`${error} ${detail} ${nestedMessage}`)) {
    return true;
  }

  const result = payload.result;
  if (isRecord(result)) {
    const resultError = readStringField(result, "error");
    const resultDetail = readStringField(result, "detail");
    const resultMessage = readStringField(result, "message");
    if (/Cookie已被服务端丢失|CookieLosedError|CookieLostError|CookieExpiredError|小黑屋/i.test(`${resultError} ${resultDetail} ${resultMessage}`)) {
      return true;
    }
  }
  if (/logout/i.test(stage) && /Cookie/i.test(`${detail} ${nestedMessage}`)) return true;
  return hasCookieLostIssueError(payload.data, "", depth + 1) || hasCookieLostIssueError(result, "", depth + 1);
};

const showCookieLostError = async () => {
  await Swal.fire({
    icon: "error",
    title: "发放失败",
    text: cookieLostMessage,
    confirmButtonText: "知道了",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#dc2626",
  });
};

const hasLoginBusyError = (payload: unknown): boolean => {
  if (!isRecord(payload)) return false;
  const returnCode = Number(payload.returnCode ?? -1);
  if (returnCode === 100 && isRecord(payload.data) && isRecord(payload.data.login)) return true;
  if (isRecord(payload.login) && Number(payload.login.returnCode ?? -1) === 100) return true;
  if (isRecord(payload.data)) return hasLoginBusyError(payload.data);
  return false;
};

const showLoginBusyError = async () => {
  await Swal.fire({
    icon: "warning",
    title: "该账号正在登录状态中",
    text: "该账号正在登录状态中，请登出后再试",
    confirmButtonText: "知道了",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#f59e0b",
  });
};

const isUpsertChargeResult = (payload: unknown) =>
  isRecord(payload) && String(payload.apiName || "").includes("UpsertUserChargelogApi");

const getIssueUpsertResult = (payload: unknown): Record<string, unknown> | null => {
  if (!isRecord(payload)) return null;
  const directResult = payload.result;
  if (isUpsertChargeResult(directResult) && isRecord(directResult)) return directResult;
  if (isRecord(payload.data)) return getIssueUpsertResult(payload.data);
  return null;
};

const isIssueSuccess = (payload: unknown) => {
  if (!isRecord(payload)) return false;
  const upsertResult = getIssueUpsertResult(payload);
  if (upsertResult) {
    return Number(upsertResult.returnCode ?? -1) === 1;
  }
  return Number(payload.returnCode ?? -1) === 0;
};

const issueTicket = async (qrcode?: string) => {
  if (!selectedAccount.value) {
    Toast.fire({ icon: "warning", title: "请先选择账号" });
    return;
  }
  if (selectedTicketOwned.value) {
    Toast.fire({ icon: "warning", title: "当前账号已有该跑图券" });
    return;
  }

  issuing.value = true;
  issueStage.value = "login";
  const progressId = globalProgress.start("跑图券发放", "登录中...");
  const stageTimers = [
    window.setTimeout(() => {
      if (!issuing.value) return;
      issueStage.value = "issue";
      globalProgress.update(progressId, "发券中...");
    }, 900),
    window.setTimeout(() => {
      if (!issuing.value) return;
      issueStage.value = "logout";
      globalProgress.update(progressId, "登出中...");
    }, 49000),
  ];
  if (qrcode) {
    showQrModal.value = false;
  }
  try {
    const res = await maimaiApi.issueTicket(selectedAccount.value.index, selectedTicket.value.chargeId, qrcode);
    if (isIssueSuccess(res.data)) {
      issueStage.value = "done";
      globalProgress.succeed(progressId, "完成");
      showQrModal.value = false;
      qrText.value = "";
      qrHint.value = "支持截图识别，也可以直接粘贴二维码原文。";
      if (selectedAccount.value) {
        upsertIssuedTicketCharge(selectedAccount.value.index, selectedTicket.value.chargeId, res.data.data);
      }
      Toast.fire({ icon: "success", title: res.data?.message || "跑图券发放成功" });
      return;
    }

    const message = res.data?.message || "跑图券发放失败";
    if (hasLoginBusyError(res.data)) {
      globalProgress.fail(progressId, "该账号正在登录状态中，请登出后再试");
      await showLoginBusyError();
      return;
    }
    if (needsQrcode(message)) {
      globalProgress.fail(progressId, qrcodeRequiredMessage);
      showQrModal.value = true;
      qrHint.value = qrcodeRequiredMessage;
      return;
    }
    if (hasCookieLostIssueError(res.data?.data, message)) {
      globalProgress.fail(progressId, cookieLostMessage);
      await showCookieLostError();
      return;
    }
    globalProgress.fail(progressId, message);
    Toast.fire({ icon: "error", title: message });
  } catch (requestError) {
    const message = getErrorMessage(requestError, "跑图券发放失败");
    if (hasLoginBusyError((requestError as { response?: { data?: unknown } }).response?.data)) {
      globalProgress.fail(progressId, "该账号正在登录状态中，请登出后再试");
      await showLoginBusyError();
      return;
    }
    if (needsQrcode(message)) {
      globalProgress.fail(progressId, qrcodeRequiredMessage);
      showQrModal.value = true;
      qrHint.value = qrcodeRequiredMessage;
      return;
    }
    if (hasCookieLostIssueError((requestError as { response?: { data?: unknown } }).response?.data, message)) {
      globalProgress.fail(progressId, cookieLostMessage);
      await showCookieLostError();
      return;
    }
    globalProgress.fail(progressId, message);
    Toast.fire({ icon: "error", title: message });
  } finally {
    stageTimers.forEach((timer) => window.clearTimeout(timer));
    issuing.value = false;
    window.setTimeout(() => {
      if (!issuing.value) issueStage.value = "idle";
    }, issueStage.value === "done" ? 900 : 0);
  }
};

onMounted(() => {
  void fetchAccounts();
});

watch(
  () => selectedAccountIndex.value,
  (index) => {
    if (index === null) return;
    void loadTicketCharges(index);
  },
);
</script>

<style scoped>
.ticket-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
  padding: 0 40px 40px;
}

.page-header,
.panel-card,
.error-banner,
.qr-modal {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.07);
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 20%),
    radial-gradient(circle at left center, rgba(251, 146, 60, 0.14), transparent 24%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(247, 251, 255, 0.94));
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.page-header h2,
.panel-head h3,
.qr-modal h3 {
  margin: 0;
  color: #0f172a;
}

.page-header h2 {
  font-size: 2.4rem;
}

.subtitle,
.panel-head p,
.state-box,
.qr-modal p {
  color: #64748b;
  line-height: 1.7;
}

.subtitle,
.panel-head p {
  margin: 8px 0 0;
}

.ticket-workspace {
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(360px, 1.08fr);
  gap: 18px;
}

.panel-card {
  padding: 24px;
}

.custom-select,
.ticket-select {
  position: relative;
  margin-top: 18px;
}

.select-trigger,
.select-option,
.ticket-trigger,
.ticket-option {
  width: 100%;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.select-trigger,
.ticket-trigger {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 86px;
  border-radius: 20px;
  padding: 14px 16px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.select-arrow {
  margin-left: auto;
  color: #94a3b8;
  font-size: 1.6rem;
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(-90deg);
}

.select-menu,
.ticket-menu {
  position: absolute;
  z-index: 5;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  display: grid;
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
  border-radius: 18px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.12);
}

.select-option,
.ticket-option {
  border-radius: 14px;
  padding: 10px;
  background: transparent;
}

.select-option.active,
.ticket-option.active,
.select-option:hover,
.ticket-option:hover {
  background: rgba(249, 115, 22, 0.1);
}

.account-option-inner {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.account-avatar {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.account-option-copy {
  min-width: 0;
}

.account-option-copy strong,
.account-option-copy span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-option-copy strong {
  color: #0f172a;
}

.account-option-copy span {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.86rem;
}

.rating-number {
  min-width: 64px;
  border-radius: 999px;
  padding: 8px 10px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  text-align: center;
}

.owned-ticket-section {
  margin-top: 18px;
  border-radius: 18px;
  padding: 16px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.owned-ticket-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  color: #0f172a;
}

.owned-ticket-head span,
.owned-ticket-empty {
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 800;
}

.owned-ticket-grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.owned-ticket-card {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  border-radius: 14px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.owned-ticket-image {
  width: 76px;
  height: auto;
  display: block;
  transform: rotate(-14deg);
  filter: drop-shadow(0 8px 10px rgba(15, 23, 42, 0.12));
}

.owned-ticket-card strong,
.owned-ticket-card span,
.owned-ticket-card small {
  display: block;
}

.owned-ticket-card strong {
  color: #0f172a;
}

.owned-ticket-card span {
  margin-top: 4px;
  color: #c2410c;
  font-weight: 900;
}

.owned-ticket-card small {
  margin-top: 3px;
  color: #64748b;
}

.owned-ticket-empty {
  margin: 12px 0 0;
}

.ticket-trigger {
  align-items: center;
}

.ticket-trigger span,
.issue-summary span {
  display: block;
  color: #64748b;
  font-size: 0.82rem;
  font-weight: 800;
}

.ticket-trigger strong,
.issue-summary strong {
  display: block;
  margin-top: 6px;
  color: #0f172a;
  font-size: 1.2rem;
}

.ticket-option {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #0f172a;
  font-weight: 900;
}

.ticket-image {
  width: 96px;
  height: auto;
  flex: 0 0 auto;
  display: block;
  object-fit: contain;
  transform: rotate(-18deg);
  transform-origin: center;
  filter: drop-shadow(0 10px 12px rgba(15, 23, 42, 0.16));
}

.ticket-image.large {
  width: min(180px, 34vw);
}

.issue-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.issue-summary div {
  border-radius: 16px;
  padding: 14px;
  background: #f8fbff;
}

.primary-btn,
.ghost-btn {
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 900;
  cursor: pointer;
}

.primary-btn {
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  box-shadow: 0 14px 28px rgba(249, 115, 22, 0.22);
}

.ghost-btn {
  background: #f8fbff;
  color: #334155;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.primary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.issue-btn {
  width: 100%;
  min-height: 66px;
  margin-top: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.issue-progress {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 42px;
  line-height: 1.1;
  overflow: visible;
}

.state-box {
  margin-top: 18px;
  min-height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.24);
  text-align: center;
  padding: 24px;
}

.state-box.empty {
  min-height: 140px;
}

.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid rgba(148, 163, 184, 0.2);
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 22px;
  overflow: visible;
}

.loading-dots i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: dot-bounce 0.8s ease-in-out infinite;
}

.loading-dots i:nth-child(2) {
  animation-delay: 0.12s;
}

.loading-dots i:nth-child(3) {
  animation-delay: 0.24s;
}

.error-banner {
  padding: 16px 18px;
  color: #dc2626;
  background: rgba(254, 242, 242, 0.95);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.46);
  backdrop-filter: blur(5px);
}

.qr-modal {
  position: relative;
  width: min(520px, 100%);
  padding: 28px;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.14);
  color: #475569;
  font-size: 1.3rem;
  cursor: pointer;
}

.qr-textarea {
  width: 100%;
  min-height: 128px;
  margin-top: 14px;
  resize: vertical;
  box-sizing: border-box;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 14px;
  background: #f8fbff;
  color: #0f172a;
  font: inherit;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.modal-actions button {
  flex: 1;
}

.qr-hint {
  margin: 12px 0 0;
  font-size: 0.9rem;
}

.hidden-input {
  display: none;
}

.drop-enter-active,
.drop-leave-active,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes dot-bounce {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .select-trigger,
[data-theme="dark"] .ticket-trigger,
[data-theme="dark"] .select-menu,
[data-theme="dark"] .ticket-menu,
[data-theme="dark"] .issue-summary div,
[data-theme="dark"] .owned-ticket-section,
[data-theme="dark"] .owned-ticket-card,
[data-theme="dark"] .qr-modal,
[data-theme="dark"] .qr-textarea,
[data-theme="dark"] .ghost-btn {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  color: #e2e8f0;
}

[data-theme="dark"] .page-header h2,
[data-theme="dark"] .panel-head h3,
[data-theme="dark"] .qr-modal h3,
[data-theme="dark"] .account-option-copy strong,
[data-theme="dark"] .ticket-trigger strong,
[data-theme="dark"] .ticket-option,
[data-theme="dark"] .issue-summary strong,
[data-theme="dark"] .owned-ticket-head,
[data-theme="dark"] .owned-ticket-card strong,
[data-theme="dark"] .qr-textarea {
  color: #e2e8f0;
}

[data-theme="dark"] .subtitle,
[data-theme="dark"] .panel-head p,
[data-theme="dark"] .state-box,
[data-theme="dark"] .qr-modal p,
[data-theme="dark"] .account-option-copy span,
[data-theme="dark"] .ticket-trigger span,
[data-theme="dark"] .owned-ticket-head span,
[data-theme="dark"] .owned-ticket-empty,
[data-theme="dark"] .owned-ticket-card small,
[data-theme="dark"] .issue-summary span {
  color: #94a3b8;
}

@media (max-width: 1024px) {
  .ticket-page {
    padding: 0 24px 32px;
  }

  .ticket-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .ticket-page {
    padding: 0 14px 24px;
  }

  .page-header {
    flex-direction: column;
    padding: 24px;
  }

  .page-header h2 {
    font-size: 2rem;
  }

  .panel-card,
  .qr-modal {
    padding: 20px;
  }

  .account-option-inner {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .rating-number {
    grid-column: 2;
    width: fit-content;
  }

  .ticket-trigger {
    flex-wrap: wrap;
  }

  .ticket-image.large {
    width: 150px;
  }

  .issue-summary {
    grid-template-columns: minmax(0, 1fr);
  }

  .modal-actions {
    flex-direction: column;
  }
}
</style>
