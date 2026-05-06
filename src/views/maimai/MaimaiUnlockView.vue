<template>
  <main class="unlock-page">
    <section class="page-header">
      <div>
        <span class="page-kicker">MAIMAI UNLOCK</span>
        <h2>物品解锁</h2>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="refreshPage">
        {{ loading ? "刷新中" : "刷新" }}
      </button>
    </section>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <section class="unlock-layout">
      <article class="panel-card account-panel">
        <div class="panel-head">
          <h3>当前账号</h3>
        </div>

        <div v-if="loadingAccounts" class="state-box">
          <div class="spinner"></div>
          <p>正在读取绑定账号...</p>
        </div>

        <div v-else-if="!accounts.length" class="state-box empty">
          <p>当前还没有绑定 maimai 账号，请先到账号管理页面绑定。</p>
        </div>

        <div v-else class="account-select">
          <button class="select-trigger" type="button" @click="accountMenuOpen = !accountMenuOpen">
            <AccountOption v-if="selectedAccount" :account="selectedAccount" />
            <span class="select-arrow" :class="{ open: accountMenuOpen }">▶</span>
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

        <div class="unlock-summary">
          <strong>{{ selectedPlan?.name || "未选择计划" }}</strong>
          <span>{{ selectedPlanDescription }}</span>
        </div>

        <button class="primary-btn unlock-btn" type="button" :disabled="!canUnlock" @click="applySelectedPlan()">
          <span v-if="unlocking" class="unlock-progress">
            <span>{{ unlockButtonText }}</span>
            <span class="loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          </span>
          <span v-else>{{ unlockButtonText }}</span>
        </button>
      </article>

      <section class="plan-section">
        <div class="section-head">
          <div>
            <h3>解锁计划</h3>
          </div>
        </div>

        <div v-if="loadingPlans" class="plan-grid">
          <article v-for="index in 3" :key="index" class="plan-card skeleton"></article>
        </div>

        <div v-else-if="!plans.length" class="state-box empty">
          <p>暂无可用解锁计划。</p>
        </div>

        <div v-else class="plan-grid">
          <article
            v-for="plan in plans"
            :key="plan.id"
            class="plan-card"
            :class="{ active: plan.id === selectedPlanId }"
          >
            <button class="plan-select-btn" type="button" @click="selectedPlanId = plan.id">
              <span class="plan-role">{{ getPlanRoleLabel(plan) }}</span>
              <strong>{{ plan.name }}</strong>
              <p>{{ plan.description || "该计划暂无说明。" }}</p>
              <div class="template-pills">
                <span v-for="template in plan.templates || []" :key="template.id">
                  {{ template.name }}
                </span>
              </div>
            </button>
            <button
              v-if="authStore.isAdmin"
              class="plan-edit-btn"
              type="button"
              title="编辑计划"
              @click.stop="openEditPlan(plan)"
            >
              编辑
            </button>
          </article>
        </div>
      </section>
    </section>

    <section v-if="authStore.isAdmin" class="panel-card admin-panel">
      <div class="panel-head admin-head">
        <div>
          <h3>管理员工具</h3>
          <p>模板负责定义物品，计划负责组合模板与权限。</p>
        </div>
      </div>

      <div class="admin-grid">
        <form class="admin-form" @submit.prevent="createTemplate">
          <h4>添加模板</h4>
          <label>
            <span>字段</span>
            <input v-model="templateForm.name" type="text" placeholder="例如：4月更新常规" />
          </label>
          <label>
            <span>类型</span>
            <select v-model="templateForm.itemType">
              <option v-for="type in unlockItemTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </label>
          <label>
            <span>ID 列表</span>
            <textarea v-model="templateForm.itemIdsText" placeholder="111,222,333 或 111 222 333"></textarea>
          </label>
          <button class="primary-btn" type="submit" :disabled="savingTemplate">
            {{ savingTemplate ? "保存中" : "保存模板" }}
          </button>

          <div class="template-manage">
            <div class="template-manage-head">
              <span>已有模板</span>
              <small>{{ templates.length }} 个</small>
            </div>
            <div v-if="templates.length" class="template-manage-list">
              <article v-for="template in templates" :key="template.id" class="template-manage-item">
                <div>
                  <strong>{{ template.name }}</strong>
                  <span>{{ getTemplateType(template) }} · {{ getTemplateIds(template).length }} 个</span>
                </div>
                <button type="button" class="mini-edit-btn" @click="openEditTemplate(template)">编辑</button>
              </article>
            </div>
            <p v-else>还没有模板。</p>
          </div>
        </form>

        <form class="admin-form" @submit.prevent="createPlan">
          <h4>添加计划</h4>
          <label>
            <span>计划名称</span>
            <input v-model="planForm.name" type="text" placeholder="例如：4月常规解锁" />
          </label>
          <label>
            <span>说明</span>
            <input v-model="planForm.description" type="text" placeholder="展示给用户看的说明" />
          </label>
          <div class="template-picker">
            <span>模板</span>
            <div v-if="templates.length" class="template-checks">
              <label v-for="template in templates" :key="template.id">
                <input v-model="planForm.templateIds" type="checkbox" :value="template.id" />
                <span>{{ template.name }}</span>
                <small>{{ getTemplateType(template) }} · {{ getTemplateIds(template).length }} 个</small>
              </label>
            </div>
            <p v-else>还没有模板，请先添加模板。</p>
          </div>
          <div class="role-row">
            <label>
              <span>计划权限</span>
              <select v-model="planForm.visibleRole">
                <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select>
            </label>
          </div>
          <button class="primary-btn" type="submit" :disabled="savingPlan">
            {{ savingPlan ? "保存中" : "保存计划" }}
          </button>
        </form>
      </div>
    </section>

    <transition name="fade">
      <div v-if="editingTemplate" class="modal-overlay">
        <article class="plan-edit-modal" @click.stop>
          <button class="close-btn" type="button" :disabled="savingTemplateEdit" @click="closeEditTemplate">×</button>
          <span class="page-kicker">EDIT TEMPLATE</span>
          <h3>编辑解锁模板</h3>

          <form class="edit-form" @submit.prevent="updateTemplate">
            <label>
              <span>字段</span>
              <input v-model="editTemplateForm.name" type="text" placeholder="例如：4月更新常规" />
            </label>
            <label>
              <span>类型</span>
              <select v-model="editTemplateForm.itemType">
                <option v-for="type in unlockItemTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </label>
            <label>
              <span>ID 列表</span>
              <textarea v-model="editTemplateForm.itemIdsText" placeholder="111,222,333 或 111 222 333"></textarea>
            </label>
            <div class="modal-actions">
              <button class="ghost-btn" type="button" :disabled="savingTemplateEdit" @click="closeEditTemplate">取消</button>
              <button class="primary-btn" type="submit" :disabled="savingTemplateEdit">
                {{ savingTemplateEdit ? "保存中" : "保存修改" }}
              </button>
            </div>
          </form>
        </article>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="editingPlan" class="modal-overlay">
        <article class="plan-edit-modal" @click.stop>
          <button class="close-btn" type="button" :disabled="savingPlanEdit" @click="closeEditPlan">×</button>
          <span class="page-kicker">EDIT PLAN</span>
          <h3>编辑解锁计划</h3>

          <form class="edit-form" @submit.prevent="updatePlan">
            <label>
              <span>计划名称</span>
              <input v-model="editPlanForm.name" type="text" placeholder="计划名称" />
            </label>
            <label>
              <span>说明</span>
              <input v-model="editPlanForm.description" type="text" placeholder="展示给用户看的说明" />
            </label>
            <div class="template-picker">
              <span>模板</span>
              <div v-if="templates.length" class="template-checks">
                <label v-for="template in templates" :key="template.id">
                  <input v-model="editPlanForm.templateIds" type="checkbox" :value="template.id" />
                  <span>{{ template.name }}</span>
                  <small>{{ getTemplateType(template) }} · {{ getTemplateIds(template).length }} 个</small>
                </label>
              </div>
              <p v-else>还没有模板，请先添加模板。</p>
            </div>
            <div class="role-row">
              <label>
                <span>可见权限</span>
                <select v-model="editPlanForm.visibleRole">
                  <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
              </label>
              <label>
                <span>调用权限</span>
                <select v-model="editPlanForm.executeRole">
                  <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
                </select>
              </label>
            </div>
            <div class="modal-actions">
              <button class="ghost-btn" type="button" :disabled="savingPlanEdit" @click="closeEditPlan">取消</button>
              <button class="primary-btn" type="submit" :disabled="savingPlanEdit">
                {{ savingPlanEdit ? "保存中" : "保存修改" }}
              </button>
            </div>
          </form>
        </article>
      </div>
    </transition>

    <QrcodeRequestModal
      v-model="qrText"
      :open="showQrModal"
      :busy="unlocking"
      title="需要新的二维码"
      description="当前账号登录状态不可用，请上传二维码截图或直接粘贴二维码字符串后重新解锁。"
      :hint="qrHint"
      submit-text="使用二维码解锁"
      busy-text="解锁中"
      @close="showQrModal = false"
      @submit="applySelectedPlan"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref } from "vue";
import Swal from "sweetalert2";
import { maimaiApi } from "@/api/maimai";
import type {
  MaimaiUnlockItemType,
  MaimaiUnlockPlan,
  MaimaiUnlockRole,
  MaimaiUnlockTemplate,
} from "@/api/maimai";
import QrcodeRequestModal from "@/components/maimai/QrcodeRequestModal.vue";
import { useAuthStore } from "@/stores/auth";
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

type UnlockListPayload = {
  plans?: MaimaiUnlockPlan[];
  templates?: MaimaiUnlockTemplate[];
};

const authStore = useAuthStore();
const accounts = ref<AccountEntry[]>([]);
const plans = ref<MaimaiUnlockPlan[]>([]);
const templates = ref<MaimaiUnlockTemplate[]>([]);
const selectedAccountIndex = ref<number | null>(null);
const selectedPlanId = ref<string | number | null>(null);
const accountMenuOpen = ref(false);
const loadingAccounts = ref(false);
const loadingPlans = ref(false);
const savingTemplate = ref(false);
const savingPlan = ref(false);
const savingTemplateEdit = ref(false);
const savingPlanEdit = ref(false);
const unlocking = ref(false);
const showQrModal = ref(false);
const qrText = ref("");
const qrHint = ref("支持截图识别，也可以直接粘贴二维码原文。");
const error = ref("");
const unlockStage = ref<"idle" | "login" | "unlock" | "logout" | "done">("idle");
const globalProgress = useGlobalProgressStore();

const templateForm = reactive({
  name: "",
  itemType: "music" as MaimaiUnlockItemType,
  itemIdsText: "",
});

const planForm = reactive({
  name: "",
  description: "",
  templateIds: [] as Array<string | number>,
  visibleRole: "premium" as MaimaiUnlockRole,
});

const editPlanForm = reactive({
  name: "",
  description: "",
  templateIds: [] as Array<string | number>,
  visibleRole: "premium" as MaimaiUnlockRole,
  executeRole: "premium" as MaimaiUnlockRole,
});

const editTemplateForm = reactive({
  name: "",
  itemType: "music" as MaimaiUnlockItemType,
  itemIdsText: "",
});

const editingTemplate = ref<MaimaiUnlockTemplate | null>(null);
const editingPlan = ref<MaimaiUnlockPlan | null>(null);

const unlockItemTypes: { value: MaimaiUnlockItemType; label: string }[] = [
  { value: "music", label: "music" },
  { value: "icon", label: "icon" },
  { value: "plate", label: "plate" },
  { value: "frame", label: "frame" },
  { value: "title", label: "title" },
  { value: "partner", label: "partner" },
  { value: "kld", label: "kld" },
];

const roleOptions: { value: MaimaiUnlockRole; label: string }[] = [
  { value: "premium", label: "网站会员" },
  { value: "tech_premium", label: "技术会员" },
];

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2600,
  showConfirmButton: false,
  background: "var(--surface-color)",
  color: "var(--text-main)",
});

const formatAssetId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") return "000000";
  return String(value).slice(-6).padStart(6, "0");
};

const getIconUrl = (iconId?: number | string | null) =>
  `https://assets.breakdx.net/maimai/icon/UI_Icon_${formatAssetId(iconId)}.png`;

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
            const image = event.target as HTMLImageElement;
            image.onerror = null;
            image.src = "https://assets.breakdx.net/maimai/icon/UI_Icon_106004.png";
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

const selectedPlan = computed(() => plans.value.find((plan) => plan.id === selectedPlanId.value) || null);

const selectedPlanDescription = computed(() => {
  if (!selectedPlan.value) return "请选择一个解锁计划后再执行。";
  const templateCount = selectedPlan.value.templates?.length || selectedPlan.value.templateIds?.length || 0;
  return `${templateCount} 个模板 · ${getPlanRoleLabel(selectedPlan.value)}`;
});

const loading = computed(() => loadingAccounts.value || loadingPlans.value);
const canUnlock = computed(() => !!selectedAccount.value && !!selectedPlan.value && !unlocking.value);
const unlockButtonText = computed(() => {
  if (unlockStage.value === "login") return "登录中";
  if (unlockStage.value === "unlock") return "解锁中";
  if (unlockStage.value === "logout") return "登出中";
  if (unlockStage.value === "done") return "完成";
  return "解锁选中计划";
});

const getResponseData = <T,>(payload: unknown, key: keyof UnlockListPayload): T[] => {
  const response = payload as { data?: { data?: UnlockListPayload | T[] } };
  const data = response.data?.data;
  if (Array.isArray(data)) return data;
  const list = data?.[key];
  return Array.isArray(list) ? (list as T[]) : [];
};

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const shape = requestError as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return shape.response?.data?.detail || shape.response?.data?.message || shape.message || fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readStringField = (payload: unknown, key: string) => {
  if (!isRecord(payload)) return "";
  const value = payload[key];
  return typeof value === "string" ? value : "";
};

const getNestedPayload = (payload: unknown, key: string): unknown => {
  if (!isRecord(payload)) return undefined;
  return payload[key];
};

const getUnlockTaskPayload = (payload: unknown): unknown => {
  const data = getNestedPayload(payload, "data");
  if (isRecord(data) && ("status" in data || "taskId" in data || "result" in data)) return data;
  return payload;
};

const isBusinessSuccess = (payload: unknown): boolean => {
  if (!isRecord(payload)) return false;
  const taskStatus = readStringField(payload.data, "status").toLowerCase();
  const taskResult = getNestedPayload(payload.data, "result");
  if (taskStatus && !["success", "done", "completed"].includes(taskStatus)) {
    return false;
  }
  if (isRecord(taskResult) && "returnCode" in taskResult) {
    return Number(taskResult.returnCode) === 0;
  }
  if ("returnCode" in payload) {
    return Number(payload.returnCode) === 0;
  }
  return payload.ok === true;
};

const hasLoginBusyError = (payload: unknown): boolean => {
  if (!isRecord(payload)) return false;
  const returnCode = Number(payload.returnCode ?? -1);
  if (returnCode === 100) return true;
  if (isRecord(payload.login) && Number(payload.login.returnCode ?? -1) === 100) return true;
  return hasLoginBusyError(payload.data) || hasLoginBusyError(payload.result);
};

const needsQrcode = (message: string, payload?: unknown): boolean => {
  if (hasLoginBusyError(payload)) return false;
  if (/qrcode|qr code|二维码|过期|未激活|失效|cookie|Cookie|CookieExpiredError|Cookie is None|102|106/i.test(message)) return true;
  if (!isRecord(payload)) return false;

  const returnCode = Number(payload.returnCode ?? -1);
  const error = readStringField(payload, "error");
  const detail = readStringField(payload, "detail");
  const nestedMessage = readStringField(payload, "message");
  if (
    returnCode === 102 ||
    returnCode === 104 ||
    returnCode === 106 ||
    /CookieExpiredError|QRCodeExpiredError|QRCodeUnactiveError|qrcode|qr code|二维码|过期|未激活|失效/i.test(
      `${error} ${detail} ${nestedMessage}`,
    )
  ) {
    return true;
  }

  return needsQrcode("", payload.data) || needsQrcode("", payload.result);
};

const qrcodeRequiredMessage = "登录状态已失效，请上传新的二维码截图或粘贴二维码内容后重试。";
const loginBusyMessage = "该账号正在登录状态中，请登出后再试。";
const cookieLostMessage = "Cookie已被服务端丢失导致发放失败，账号已进入小黑屋";
const unlockTimeoutMessage =
  "服务端响应超时，但解锁请求可能已经执行完成。请进游戏或刷新账号数据确认结果，先不要重复点击。";
const unlockTaskTimeoutMessage = "解锁任务仍在执行中，请稍后查看结果，先不要重复点击。";

const getResponseStatus = (requestError: unknown) =>
  (requestError as { response?: { status?: number } }).response?.status || 0;

const isUnlockResponseTimeout = (requestError: unknown, message: string) =>
  getResponseStatus(requestError) === 504 || /504|timeout|timed out|超时/i.test(message);

const payloadContains = (payload: unknown, pattern: RegExp): boolean => {
  if (typeof payload === "string") return pattern.test(payload);
  if (typeof payload === "number" || typeof payload === "boolean" || payload === null || payload === undefined) {
    return false;
  }
  if (Array.isArray(payload)) return payload.some((item) => payloadContains(item, pattern));
  if (!isRecord(payload)) return false;
  return Object.values(payload).some((value) => payloadContains(value, pattern));
};

const isCookieLostError = (message: string, payload?: unknown) =>
  /CookieLosedError|CookieLostError/i.test(message) ||
  payloadContains(payload, /CookieLosedError|CookieLostError/i);

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type UnlockOutcome =
  | { status: "running"; message: string; taskId: string }
  | { status: "success"; message: string }
  | { status: "qrcode_required"; message: string }
  | { status: "login_busy"; message: string }
  | { status: "cookie_lost"; message: string }
  | { status: "failed"; message: string };

const resolveUnlockOutcome = (payload: unknown): UnlockOutcome => {
  const task = getUnlockTaskPayload(payload);
  const taskStatus = readStringField(task, "status").toLowerCase();
  const taskId = readStringField(task, "taskId");
  const taskMessage = readStringField(task, "message");
  const rootMessage = readStringField(payload, "message");
  const message = taskMessage || rootMessage || "解锁失败";
  const result = getNestedPayload(task, "result");
  const checkPayload = result || task || payload;

  if (taskStatus === "running" || taskStatus === "pending") {
    return { status: "running", message: message || "解锁任务执行中", taskId };
  }
  if (taskStatus === "qrcode_required") {
    return { status: "qrcode_required", message: message || qrcodeRequiredMessage };
  }
  if (taskStatus === "login_busy") {
    return { status: "login_busy", message: loginBusyMessage };
  }
  if (taskStatus === "success" || taskStatus === "done" || taskStatus === "completed") {
    if (isRecord(result) && "returnCode" in result && Number(result.returnCode) !== 0) {
      if (hasLoginBusyError(result)) return { status: "login_busy", message: loginBusyMessage };
      if (isCookieLostError(message, result)) return { status: "cookie_lost", message: cookieLostMessage };
      if (needsQrcode(message, result)) return { status: "qrcode_required", message: qrcodeRequiredMessage };
      return { status: "failed", message: readStringField(result, "message") || message };
    }
    return { status: "success", message: message || "解锁完成" };
  }

  if (hasLoginBusyError(checkPayload)) return { status: "login_busy", message: loginBusyMessage };
  if (isCookieLostError(message, checkPayload)) return { status: "cookie_lost", message: cookieLostMessage };
  if (needsQrcode(message, checkPayload)) return { status: "qrcode_required", message: qrcodeRequiredMessage };
  if (isBusinessSuccess(payload)) return { status: "success", message: message || "解锁完成" };
  return { status: "failed", message };
};

const showLoginBusyError = async () => {
  await Swal.fire({
    icon: "warning",
    title: "该账号正在登录状态中",
    text: loginBusyMessage,
    confirmButtonText: "知道了",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#f59e0b",
  });
};

const showUnlockTimeoutWarning = async () => {
  await Swal.fire({
    icon: "warning",
    title: "服务端响应超时",
    text: unlockTimeoutMessage,
    confirmButtonText: "知道了",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#f59e0b",
  });
};

const openQrModal = async () => {
  Swal.close();
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  showQrModal.value = true;
  qrHint.value = qrcodeRequiredMessage;
};

const finishUnlockOutcome = async (outcome: UnlockOutcome, progressId: number): Promise<boolean> => {
  if (outcome.status === "running") {
    return false;
  }
  if (outcome.status === "success") {
    unlockStage.value = "done";
    globalProgress.succeed(progressId, "完成");
    showQrModal.value = false;
    qrText.value = "";
    qrHint.value = "支持截图识别，也可以直接粘贴二维码原文。";
    Toast.fire({ icon: "success", title: outcome.message || "解锁完成" });
    return true;
  }
  if (outcome.status === "login_busy") {
    globalProgress.fail(progressId, loginBusyMessage);
    await showLoginBusyError();
    return true;
  }
  if (outcome.status === "cookie_lost") {
    globalProgress.fail(progressId, cookieLostMessage);
    return true;
  }
  if (outcome.status === "qrcode_required") {
    globalProgress.dismiss(progressId);
    await openQrModal();
    return true;
  }
  globalProgress.fail(progressId, outcome.message || "解锁失败");
  return true;
};

const waitUnlockTask = async (taskId: string, progressId: number) => {
  if (!taskId) {
    globalProgress.fail(progressId, "服务端没有返回任务 ID");
    return;
  }

  unlockStage.value = "unlock";
  globalProgress.update(progressId, "解锁任务执行中...");

  for (let attempt = 0; attempt < 150; attempt += 1) {
    await sleep(attempt < 3 ? 1000 : 2000);
    const res = await maimaiApi.getUnlockTask(taskId);
    const outcome = resolveUnlockOutcome(res.data);
    if (outcome.status === "running") {
      globalProgress.update(progressId, outcome.message || "解锁任务执行中...");
      continue;
    }
    await finishUnlockOutcome(outcome, progressId);
    return;
  }

  globalProgress.fail(progressId, unlockTaskTimeoutMessage);
};

const parseItemIds = (text: string) => {
  const ids = text
    .split(/[\s,，、]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
  return Array.from(new Set(ids));
};

const getTemplateType = (template: MaimaiUnlockTemplate) => template.itemType || template.type || "music";
const getTemplateIds = (template: MaimaiUnlockTemplate) => template.itemIds || template.ids || [];
const getPlanTemplateIds = (plan: MaimaiUnlockPlan) =>
  plan.templateIds?.length ? plan.templateIds : (plan.templates || []).map((template) => template.id);

const getPlanRoleLabel = (plan: MaimaiUnlockPlan) => {
  const role = plan.executeRole || plan.minExecuteRole || plan.visibleRole || plan.minVisibleRole || "premium";
  return roleOptions.find((item) => item.value === role)?.label || role;
};

const normalizeAccounts = (payload?: AccountsPayload) => {
  accounts.value = payload?.accounts || [];
  const current = accounts.value.find((account) => account.isCurrent) || accounts.value[0] || null;
  selectedAccountIndex.value = current?.index ?? null;
};

const fetchAccounts = async () => {
  loadingAccounts.value = true;
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

const fetchPlans = async () => {
  loadingPlans.value = true;
  try {
    const res = await maimaiApi.getUnlockPlans();
    plans.value = getResponseData<MaimaiUnlockPlan>(res, "plans");
    if (!selectedPlanId.value && plans.value.length) {
      selectedPlanId.value = plans.value[0].id;
    }
  } catch (requestError) {
    error.value = getErrorMessage(requestError, "读取解锁计划失败");
  } finally {
    loadingPlans.value = false;
  }
};

const fetchTemplates = async () => {
  if (!authStore.isAdmin) return;
  try {
    const res = await maimaiApi.getUnlockTemplates();
    templates.value = getResponseData<MaimaiUnlockTemplate>(res, "templates");
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "读取模板失败") });
  }
};

const refreshPage = async () => {
  error.value = "";
  await Promise.all([fetchAccounts(), fetchPlans(), fetchTemplates()]);
};

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
  accountMenuOpen.value = false;
};

const createTemplate = async () => {
  const itemIds = parseItemIds(templateForm.itemIdsText);
  if (!templateForm.name.trim() || !itemIds.length) {
    Toast.fire({ icon: "warning", title: "请填写模板字段和 ID 列表" });
    return;
  }

  savingTemplate.value = true;
  try {
    await maimaiApi.createUnlockTemplate({
      name: templateForm.name.trim(),
      itemType: templateForm.itemType,
      itemIds,
    });
    Toast.fire({ icon: "success", title: "模板已保存" });
    templateForm.name = "";
    templateForm.itemIdsText = "";
    await fetchTemplates();
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "保存模板失败") });
  } finally {
    savingTemplate.value = false;
  }
};

const createPlan = async () => {
  if (!planForm.name.trim() || !planForm.templateIds.length) {
    Toast.fire({ icon: "warning", title: "请填写计划名称并选择模板" });
    return;
  }

  savingPlan.value = true;
  try {
    await maimaiApi.createUnlockPlan({
      name: planForm.name.trim(),
      description: planForm.description.trim() || undefined,
      templateIds: planForm.templateIds,
      visibleRole: planForm.visibleRole,
      executeRole: planForm.visibleRole,
    });
    Toast.fire({ icon: "success", title: "计划已保存" });
    planForm.name = "";
    planForm.description = "";
    planForm.templateIds = [];
    await Promise.all([fetchPlans(), fetchTemplates()]);
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "保存计划失败") });
  } finally {
    savingPlan.value = false;
  }
};

const openEditPlan = (plan: MaimaiUnlockPlan) => {
  editingPlan.value = plan;
  editPlanForm.name = plan.name || "";
  editPlanForm.description = plan.description || "";
  editPlanForm.templateIds = [...getPlanTemplateIds(plan)];
  editPlanForm.visibleRole = plan.visibleRole || plan.minVisibleRole || plan.executeRole || plan.minExecuteRole || "premium";
  editPlanForm.executeRole = plan.executeRole || plan.minExecuteRole || editPlanForm.visibleRole;
};

const closeEditPlan = () => {
  if (savingPlanEdit.value) return;
  editingPlan.value = null;
};

const openEditTemplate = (template: MaimaiUnlockTemplate) => {
  editingTemplate.value = template;
  editTemplateForm.name = template.name || "";
  editTemplateForm.itemType = getTemplateType(template);
  editTemplateForm.itemIdsText = getTemplateIds(template).join(", ");
};

const closeEditTemplate = () => {
  if (savingTemplateEdit.value) return;
  editingTemplate.value = null;
};

const updateTemplate = async () => {
  if (!editingTemplate.value) return;
  const itemIds = parseItemIds(editTemplateForm.itemIdsText);
  if (!editTemplateForm.name.trim() || !itemIds.length) {
    Toast.fire({ icon: "warning", title: "请填写模板字段和 ID 列表" });
    return;
  }

  savingTemplateEdit.value = true;
  try {
    await maimaiApi.updateUnlockTemplate(editingTemplate.value.id, {
      name: editTemplateForm.name.trim(),
      itemType: editTemplateForm.itemType,
      itemIds,
    });
    Toast.fire({ icon: "success", title: "模板已更新" });
    editingTemplate.value = null;
    await Promise.all([fetchTemplates(), fetchPlans()]);
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "保存模板失败") });
  } finally {
    savingTemplateEdit.value = false;
  }
};

const updatePlan = async () => {
  if (!editingPlan.value) return;
  if (!editPlanForm.name.trim() || !editPlanForm.templateIds.length) {
    Toast.fire({ icon: "warning", title: "请填写计划名称并选择模板" });
    return;
  }

  savingPlanEdit.value = true;
  try {
    await maimaiApi.updateUnlockPlan(editingPlan.value.id, {
      name: editPlanForm.name.trim(),
      description: editPlanForm.description.trim() || undefined,
      templateIds: editPlanForm.templateIds,
      visibleRole: editPlanForm.visibleRole,
      executeRole: editPlanForm.executeRole,
    });
    Toast.fire({ icon: "success", title: "计划已更新" });
    const updatedPlanId = editingPlan.value.id;
    editingPlan.value = null;
    await Promise.all([fetchPlans(), fetchTemplates()]);
    selectedPlanId.value = updatedPlanId;
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "保存计划失败") });
  } finally {
    savingPlanEdit.value = false;
  }
};

const applySelectedPlan = async (qrcode?: string) => {
  if (!selectedAccount.value || !selectedPlan.value) return;

  if (!qrcode) {
    const confirm = await Swal.fire({
      icon: "question",
      title: "确认解锁",
      text: `将对 ${selectedAccount.value.displayName || selectedAccount.value.uid} 执行「${selectedPlan.value.name}」。`,
      showCancelButton: true,
      confirmButtonText: "开始解锁",
      cancelButtonText: "取消",
      background: "var(--surface-color)",
      color: "var(--text-main)",
      confirmButtonColor: "#f97316",
    });
    if (!confirm.isConfirmed) return;
    Swal.close();
  } else {
    showQrModal.value = false;
  }

  unlocking.value = true;
  unlockStage.value = "login";
  const progressId = globalProgress.start("物品解锁", "登录中...");
  const stageTimers = [
    window.setTimeout(() => {
      if (!unlocking.value) return;
      unlockStage.value = "unlock";
      globalProgress.update(progressId, "解锁中...");
    }, 900),
    window.setTimeout(() => {
      if (!unlocking.value) return;
      unlockStage.value = "logout";
      globalProgress.update(progressId, "登出中...");
    }, 150000),
  ];
  try {
    const res = await maimaiApi.applyUnlockPlan(selectedAccount.value.index, selectedPlan.value.id, qrcode);
    const outcome = resolveUnlockOutcome(res.data);
    if (outcome.status === "running") {
      await waitUnlockTask(outcome.taskId, progressId);
      return;
    }
    await finishUnlockOutcome(outcome, progressId);
  } catch (requestError) {
    const message = getErrorMessage(requestError, "解锁失败");
    const responseData = (requestError as { response?: { data?: unknown } }).response?.data;
    if (isUnlockResponseTimeout(requestError, message)) {
      unlockStage.value = "done";
      globalProgress.succeed(progressId, "响应超时，请确认结果", 6000);
      await showUnlockTimeoutWarning();
      return;
    }
    if (hasLoginBusyError(responseData)) {
      globalProgress.fail(progressId, loginBusyMessage);
      await showLoginBusyError();
      return;
    }
    if (isCookieLostError(message, responseData)) {
      globalProgress.fail(progressId, cookieLostMessage);
      return;
    }
    if (needsQrcode(message, responseData) || getResponseStatus(requestError) === 500) {
      globalProgress.dismiss(progressId);
      await openQrModal();
      return;
    }
    globalProgress.fail(progressId, message);
  } finally {
    stageTimers.forEach((timer) => window.clearTimeout(timer));
    unlocking.value = false;
    window.setTimeout(() => {
      if (!unlocking.value) unlockStage.value = "idle";
    }, unlockStage.value === "done" ? 900 : 0);
  }
};

onMounted(() => {
  void refreshPage();
});
</script>

<style scoped>
.unlock-page {
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
.plan-section,
.plan-edit-modal,
.qr-modal {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.07);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 30px;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 20%),
    radial-gradient(circle at left center, rgba(59, 130, 246, 0.12), transparent 24%),
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
.section-head h3 {
  margin: 0;
  color: #0f172a;
}

.page-header h2 {
  font-size: 2.35rem;
}

.unlock-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.88fr) minmax(420px, 1.12fr);
  gap: 18px;
}

.panel-card,
.plan-section {
  padding: 24px;
}

.panel-head,
.section-head,
.admin-head {
  margin-bottom: 18px;
}

.section-head p,
.admin-head p,
.state-box,
.unlock-summary span,
.plan-card p,
.template-picker p {
  color: #64748b;
}

.account-select {
  position: relative;
}

.select-trigger,
.select-option {
  width: 100%;
  border: 0;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.select-trigger {
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
  font-size: 1.4rem;
  transition: transform 0.2s ease;
}

.select-arrow.open {
  transform: rotate(90deg);
}

.select-menu {
  position: absolute;
  z-index: 8;
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

.select-option {
  border-radius: 14px;
  padding: 10px;
  background: transparent;
}

.select-option.active,
.select-option:hover {
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

.unlock-summary {
  display: grid;
  gap: 6px;
  margin-top: 18px;
  border-radius: 18px;
  padding: 16px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.unlock-summary strong {
  color: #0f172a;
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

.unlock-btn {
  width: 100%;
  min-height: 56px;
  margin-top: 18px;
}

.unlock-progress {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 38px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.plan-card {
  position: relative;
  min-height: 178px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: #f8fbff;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.plan-card:hover,
.plan-card.active {
  border-color: rgba(249, 115, 22, 0.42);
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.plan-select-btn {
  display: grid;
  gap: 10px;
  width: 100%;
  min-height: 178px;
  border: 0;
  padding: 16px;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.plan-edit-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  border: 1px solid rgba(249, 115, 22, 0.24);
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #c2410c;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}

.plan-edit-btn:hover {
  background: rgba(249, 115, 22, 0.12);
}

.plan-card strong {
  color: #0f172a;
  font-size: 1.06rem;
  padding-right: 52px;
}

.plan-card p {
  margin: 0;
  line-height: 1.55;
}

.plan-role {
  width: fit-content;
  border-radius: 999px;
  padding: 5px 9px;
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
  font-size: 0.76rem;
  font-weight: 900;
}

.template-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-self: end;
}

.template-pills span {
  border-radius: 999px;
  padding: 5px 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #1d4ed8;
  font-size: 0.76rem;
  font-weight: 800;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.admin-form {
  display: grid;
  gap: 14px;
  border-radius: 18px;
  padding: 18px;
  background: #f8fbff;
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.admin-form h4 {
  margin: 0;
  color: #0f172a;
}

.admin-form label,
.template-picker {
  display: grid;
  gap: 7px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
}

.admin-form input,
.admin-form select,
.admin-form textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #fff;
  color: #0f172a;
  font: inherit;
  padding: 11px 12px;
}

.admin-form textarea {
  min-height: 104px;
  resize: vertical;
}

.template-manage {
  display: grid;
  gap: 10px;
  margin-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.16);
  padding-top: 14px;
}

.template-manage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 900;
}

.template-manage-list {
  display: grid;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.template-manage-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.template-manage-item strong,
.template-manage-item span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-manage-item strong {
  color: #0f172a;
  font-size: 0.92rem;
}

.template-manage-item span {
  margin-top: 3px;
  color: #64748b;
  font-size: 0.78rem;
}

.mini-edit-btn {
  border: 1px solid rgba(249, 115, 22, 0.24);
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(249, 115, 22, 0.1);
  color: #c2410c;
  font-size: 0.74rem;
  font-weight: 900;
  cursor: pointer;
}

.template-checks {
  display: grid;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
}

.template-checks label {
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  border-radius: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.82);
}

.template-checks small {
  color: #64748b;
}

.role-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.plan-edit-modal {
  position: relative;
  width: min(640px, 100%);
  max-height: min(760px, 92vh);
  overflow-y: auto;
  padding: 28px;
}

.plan-edit-modal h3 {
  margin: 0 0 18px;
  color: #0f172a;
}

.edit-form {
  display: grid;
  gap: 14px;
}

.edit-form label {
  display: grid;
  gap: 7px;
  color: #64748b;
  font-size: 0.84rem;
  font-weight: 800;
}

.edit-form input,
.edit-form select,
.edit-form textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #fff;
  color: #0f172a;
  font: inherit;
  padding: 11px 12px;
}

.edit-form textarea {
  min-height: 128px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.state-box {
  min-height: 160px;
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
  min-height: 120px;
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

.skeleton {
  background: linear-gradient(90deg, #f8fbff, #eef5ff, #f8fbff);
  background-size: 240% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
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

.qr-modal h3 {
  margin: 0;
  color: #0f172a;
}

.qr-modal p {
  color: #64748b;
  line-height: 1.7;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
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
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@keyframes shimmer {
  to {
    background-position: -240% 0;
  }
}

[data-theme="dark"] .page-header,
[data-theme="dark"] .panel-card,
[data-theme="dark"] .plan-section,
[data-theme="dark"] .select-trigger,
[data-theme="dark"] .select-menu,
[data-theme="dark"] .unlock-summary,
[data-theme="dark"] .plan-card,
[data-theme="dark"] .admin-form,
[data-theme="dark"] .plan-edit-modal,
[data-theme="dark"] .qr-modal,
[data-theme="dark"] .qr-textarea,
[data-theme="dark"] .ghost-btn {
  background: linear-gradient(180deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.96));
  border-color: rgba(71, 85, 105, 0.34);
  color: #e2e8f0;
}

[data-theme="dark"] .page-header h2,
[data-theme="dark"] .panel-head h3,
[data-theme="dark"] .section-head h3,
[data-theme="dark"] .account-option-copy strong,
[data-theme="dark"] .unlock-summary strong,
[data-theme="dark"] .plan-card strong,
[data-theme="dark"] .admin-form h4,
[data-theme="dark"] .plan-edit-modal h3,
[data-theme="dark"] .edit-form input,
[data-theme="dark"] .edit-form select,
[data-theme="dark"] .admin-form input,
[data-theme="dark"] .admin-form select,
[data-theme="dark"] .admin-form textarea {
  color: #e2e8f0;
}

[data-theme="dark"] .admin-form input,
[data-theme="dark"] .admin-form select,
[data-theme="dark"] .admin-form textarea,
[data-theme="dark"] .edit-form input,
[data-theme="dark"] .edit-form select,
[data-theme="dark"] .edit-form textarea,
[data-theme="dark"] .template-checks label,
[data-theme="dark"] .template-manage-item {
  background: rgba(15, 23, 42, 0.9);
  border-color: rgba(71, 85, 105, 0.36);
}

[data-theme="dark"] .template-manage-item strong {
  color: #e2e8f0;
}

@media (max-width: 1040px) {
  .unlock-page {
    padding: 0 24px 32px;
  }

  .unlock-layout,
  .admin-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .unlock-page {
    padding: 0 14px 24px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 24px;
  }

  .page-header h2 {
    font-size: 2rem;
  }

  .panel-card,
  .plan-section {
    padding: 20px;
  }

  .plan-grid,
  .role-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
