<template>
  <main class="xiamai-page">
    <section class="page-header">
      <div>
        <span class="page-kicker">MAIMAI BURY SCORE</span>
        <h2>乐曲下埋</h2>
      </div>
      <button class="ghost-btn" type="button" :disabled="loading" @click="refreshPage">
        {{ loading ? "刷新中" : "刷新" }}
      </button>
    </section>

    <div v-if="error" class="error-banner">{{ error }}</div>

    <section class="xiamai-layout">
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

        <div class="task-panel" v-if="activeTask">
          <div class="task-copy">
            <strong>{{ activeTask.message || taskStatusLabel }}</strong>
            <span>{{ activeTask.sentCount }}/{{ activeTask.total }} 条 · {{ taskStatusLabel }}</span>
          </div>
          <div class="task-bar">
            <i :style="{ width: `${taskPercent}%` }"></i>
          </div>
          <button
            v-if="activeTask.status === 'interrupted' || activeTask.status === 'failed'"
            class="primary-btn"
            type="button"
            :disabled="taskBusy"
            @click="openResumeQr"
          >
            继续任务
          </button>
        </div>
      </article>

      <section class="builder-section">
        <article class="panel-card builder-card">
          <div class="panel-head">
            <div>
              <h3>创建下埋计划</h3>
              <p>按版本快速添加歌曲，也可以手动增删 ID。</p>
            </div>
          </div>

          <form class="builder-form" @submit.prevent="createPlan">
            <label>
              <span>计划名称</span>
              <input v-model.trim="planName" type="text" placeholder="例如：旧曲 BA 补埋" />
            </label>

            <div class="version-picker">
              <span>版本快速添加</span>
              <div class="version-row">
                <select v-model="selectedVersion">
                  <option value="">选择版本</option>
                  <option v-for="version in versionOptions" :key="version" :value="version">
                    {{ version }}
                  </option>
                </select>
                <button class="ghost-btn" type="button" :disabled="!selectedVersion" @click="addVersionSongs">
                  添加版本
                </button>
              </div>
            </div>

            <label>
              <span>歌曲 ID</span>
              <textarea
                v-model="musicIdsText"
                placeholder="可以输入 111,222,333，也可以先用版本添加后再删改"
                @blur="syncMusicIdsFromText"
              ></textarea>
            </label>

            <div class="level-checks">
              <span>难度</span>
              <label><input v-model="selectedLevels" type="checkbox" :value="0" /> Basic</label>
              <label><input v-model="selectedLevels" type="checkbox" :value="1" /> Advanced</label>
            </div>

            <div class="score-grid">
              <label>
                <span>达成率下限</span>
                <input v-model.number="scoreRule.achievementMin" type="number" min="0" max="1010000" step="1" />
              </label>
              <label>
                <span>达成率上限</span>
                <input v-model.number="scoreRule.achievementMax" type="number" min="0" max="1010000" step="1" />
              </label>
              <label>
                <span>DX 星下限</span>
                <input v-model.number="scoreRule.dxStarMin" type="number" min="1" max="5" step="1" />
              </label>
              <label>
                <span>DX 星上限</span>
                <input v-model.number="scoreRule.dxStarMax" type="number" min="1" max="5" step="1" />
              </label>
              <label>
                <span>游玩次数</span>
                <input v-model.number="scoreRule.playCount" type="number" min="1" step="1" />
              </label>
            </div>

            <div class="status-checks">
              <span>Combo</span>
              <label v-for="item in comboOptions" :key="item.value">
                <input v-model="scoreRule.comboStatuses" type="checkbox" :value="item.value" />
                {{ item.label }}
              </label>
            </div>

            <div class="status-checks">
              <span>Sync</span>
              <label v-for="item in syncOptions" :key="item.value">
                <input v-model="scoreRule.syncStatuses" type="checkbox" :value="item.value" />
                {{ item.label }}
              </label>
            </div>

            <label>
              <span>单个成绩覆盖</span>
              <textarea
                v-model="overrideText"
                placeholder="每行：歌曲ID,难度,达成率,DX星,DX分。例如 123,advanced,1008500,5, 或 123,0,1010000,5,300"
              ></textarea>
            </label>

            <div class="plan-summary">
              <strong>{{ selectedMusicIds.length }}</strong>
              <span>首歌曲 · {{ selectedLevels.length }} 个难度 · 将生成 {{ previewRecordCount }} 条成绩</span>
            </div>

            <button class="primary-btn" type="submit" :disabled="savingPlan || !canCreatePlan">
              {{ savingPlan ? "创建中" : "创建计划" }}
            </button>
          </form>
        </article>

        <section class="plan-section">
          <div class="section-head">
            <h3>我的下埋计划</h3>
          </div>

          <div v-if="loadingPlans" class="plan-grid">
            <article v-for="index in 3" :key="index" class="xiamai-plan skeleton"></article>
          </div>

          <div v-else-if="!plans.length" class="state-box empty">
            <p>暂无下埋计划。</p>
          </div>

          <div v-else class="plan-grid">
            <article
              v-for="plan in plans"
              :key="plan.id"
              class="xiamai-plan"
              :class="{ active: selectedPlanId === plan.id }"
            >
              <button class="plan-main" type="button" @click="selectedPlanId = plan.id">
                <strong>{{ plan.name }}</strong>
                <span>{{ plan.musicIds.length }} 首 · {{ plan.recordCount }} 条成绩</span>
                <small>{{ formatLevels(plan.levels) }}</small>
              </button>
              <div class="plan-actions">
                <button class="ghost-btn" type="button" :disabled="taskBusy" @click="startPlan(plan.id)">
                  执行
                </button>
                <button class="danger-btn" type="button" :disabled="taskBusy" @click="deletePlan(plan)">
                  删除
                </button>
              </div>
            </article>
          </div>
        </section>
      </section>
    </section>

    <QrcodeRequestModal
      v-model="qrText"
      :open="showQrModal"
      :busy="taskBusy"
      title="需要新的二维码"
      description="当前账号登录状态不可用，请上传二维码截图或直接粘贴二维码字符串后继续下埋。"
      hint="支持截图识别，也可以直接粘贴二维码原文。"
      :submit-text="qrSubmitText"
      busy-text="处理中"
      @close="showQrModal = false"
      @submit="submitQrcode"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from "vue";
import Swal from "sweetalert2";
import { maimaiApi } from "@/api/maimai";
import type {
  MaimaiSongEntry,
  MaimaiXiamaiPlan,
  MaimaiXiamaiRecordOverride,
  MaimaiXiamaiTask,
} from "@/api/maimai";
import QrcodeRequestModal from "@/components/maimai/QrcodeRequestModal.vue";

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

type XiamaiListPayload = {
  plans?: MaimaiXiamaiPlan[];
  plan?: MaimaiXiamaiPlan;
};

const accounts = ref<AccountEntry[]>([]);
const plans = ref<MaimaiXiamaiPlan[]>([]);
const songs = ref<MaimaiSongEntry[]>([]);
const selectedAccountIndex = ref<number | null>(null);
const selectedPlanId = ref("");
const accountMenuOpen = ref(false);
const loadingAccounts = ref(false);
const loadingPlans = ref(false);
const loadingSongs = ref(false);
const savingPlan = ref(false);
const taskBusy = ref(false);
const showQrModal = ref(false);
const qrText = ref("");
const qrMode = ref<"start" | "resume">("start");
const activeTask = ref<MaimaiXiamaiTask | null>(null);
const activeTaskTimer = ref<number | null>(null);
const error = ref("");

const planName = ref("");
const selectedVersion = ref("");
const selectedMusicIds = ref<number[]>([]);
const musicIdsText = ref("");
const overrideText = ref("");
const selectedLevels = ref<number[]>([0, 1]);
const scoreRule = reactive({
  achievementMin: 1008500,
  achievementMax: 1010000,
  dxStarMin: 3,
  dxStarMax: 5,
  comboStatuses: [3, 4],
  syncStatuses: [3, 4],
  playCount: 1,
});

const comboOptions = [
  { value: 0, label: "无" },
  { value: 1, label: "FC" },
  { value: 2, label: "FC+" },
  { value: 3, label: "AP" },
  { value: 4, label: "AP+" },
];

const syncOptions = [
  { value: 0, label: "无" },
  { value: 1, label: "FS" },
  { value: 2, label: "FS+" },
  { value: 3, label: "FSD" },
  { value: 4, label: "FSD+" },
  { value: 5, label: "Sync" },
];

const versionOrder = [
  "maimai",
  "maimai PLUS",
  "maimai GreeN",
  "maimai GreeN PLUS",
  "maimai ORANGE",
  "maimai ORANGE PLUS",
  "maimai PiNK",
  "maimai PiNK PLUS",
  "maimai MURASAKi",
  "maimai MURASAKi PLUS",
  "maimai MiLK",
  "maimai MiLK PLUS",
  "maimai FiNALE",
  "maimai でらっくす",
  "maimai でらっくす PLUS",
  "maimai Splash",
  "maimai Splash PLUS",
  "maimai UNiVERSE",
  "maimai UNiVERSE PLUS",
  "maimai FESTiVAL",
  "maimai FESTiVAL PLUS",
  "maimai BUDDiES",
  "maimai BUDDiES PLUS",
  "maimai PRiSM",
  "maimai PRiSM PLUS",
  "maimai CiRCLE",
  "maimai CiRCLE PLUS",
];

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  timer: 2600,
  showConfirmButton: false,
  background: "var(--surface-color)",
  color: "var(--text-main)",
});

const loading = computed(() => loadingAccounts.value || loadingPlans.value || loadingSongs.value);
const selectedAccount = computed(() =>
  accounts.value.find((account) => account.index === selectedAccountIndex.value) || null,
);
const selectedPlan = computed(() => plans.value.find((plan) => plan.id === selectedPlanId.value) || null);
const canCreatePlan = computed(() => !!selectedAccount.value && !!planName.value.trim() && selectedMusicIds.value.length > 0 && selectedLevels.value.length > 0);
const previewRecordCount = computed(() => selectedMusicIds.value.length * selectedLevels.value.length);
const qrSubmitText = computed(() => (qrMode.value === "resume" ? "继续任务" : "使用二维码执行"));
const taskPercent = computed(() => {
  if (!activeTask.value?.total) return 0;
  return Math.min(100, Math.round((activeTask.value.sentCount / activeTask.value.total) * 100));
});
const taskStatusLabel = computed(() => {
  if (!activeTask.value) return "未开始";
  if (activeTask.value.status === "success") return "已完成";
  if (activeTask.value.status === "running") return "执行中";
  if (activeTask.value.status === "interrupted") return "已中断";
  return "失败";
});
const versionOptions = computed(() => {
  const existing = new Set(songs.value.map((song) => normalizeVersionName(song.basic_info?.from || "")));
  return versionOrder.filter((version) => existing.has(version));
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

const normalizeVersionName = (value: string) =>
  value.replace(/^maimai\s+でらっくす\s+(Splash|UNiVERSE|FESTiVAL|BUDDiES|PRiSM|CiRCLE)/, "maimai $1");

const getResponseData = <T,>(payload: unknown, key: keyof XiamaiListPayload): T[] => {
  const response = payload as { data?: { data?: XiamaiListPayload | T[] } };
  const data = response.data?.data;
  if (Array.isArray(data)) return data;
  const list = data?.[key];
  return Array.isArray(list) ? (list as T[]) : [];
};

const getResponseItem = <T,>(payload: unknown, key: keyof XiamaiListPayload): T | null => {
  const response = payload as { data?: { data?: XiamaiListPayload } };
  const item = response.data?.data?.[key];
  return item && !Array.isArray(item) ? (item as T) : null;
};

const getTaskPayload = (payload: unknown): MaimaiXiamaiTask | null => {
  const response = payload as { data?: { data?: MaimaiXiamaiTask } };
  return response.data?.data || null;
};

const getErrorMessage = (requestError: unknown, fallback: string) => {
  const shape = requestError as { response?: { data?: { detail?: string; message?: string } }; message?: string };
  return shape.response?.data?.detail || shape.response?.data?.message || shape.message || fallback;
};

const parseMusicIds = (text: string) =>
  Array.from(
    new Set(
      text
        .split(/[\s,，、]+/)
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  );

const parseLevelText = (value: string): 0 | 1 | null => {
  const normalized = value.trim().toLowerCase();
  if (normalized === "0" || normalized === "basic" || normalized === "bas") return 0;
  if (normalized === "1" || normalized === "advanced" || normalized === "adv") return 1;
  return null;
};

const parseOptionalNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseRecordOverrides = (): MaimaiXiamaiRecordOverride[] =>
  overrideText.value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): MaimaiXiamaiRecordOverride | null => {
      const [musicIdText, levelText, achievementText = "", dxStarText = "", dxScoreText = ""] = line.split(/[,，\s]+/);
      const musicId = Number(musicIdText);
      const level = parseLevelText(levelText || "");
      if (!Number.isInteger(musicId) || musicId <= 0 || level === null) return null;
      const override: MaimaiXiamaiRecordOverride = {
        musicId,
        level,
      };
      const achievement = parseOptionalNumber(achievementText);
      const dxStar = parseOptionalNumber(dxStarText);
      const dxScore = parseOptionalNumber(dxScoreText);
      if (achievement !== undefined) override.achievement = achievement;
      if (dxStar !== undefined) override.dxStar = dxStar;
      if (dxScore !== undefined) override.dxScore = dxScore;
      return override;
    })
    .filter((item): item is MaimaiXiamaiRecordOverride => Boolean(item));

const syncMusicIdsText = () => {
  musicIdsText.value = selectedMusicIds.value.join(", ");
};

const syncMusicIdsFromText = () => {
  selectedMusicIds.value = parseMusicIds(musicIdsText.value);
  syncMusicIdsText();
};

const addVersionSongs = () => {
  if (!selectedVersion.value) return;
  const ids = songs.value
    .filter((song) => normalizeVersionName(song.basic_info?.from || "") === selectedVersion.value)
    .map((song) => Number(song.id))
    .filter((id) => Number.isInteger(id) && id > 0);
  selectedMusicIds.value = Array.from(new Set([...selectedMusicIds.value, ...ids])).sort((a, b) => a - b);
  syncMusicIdsText();
  Toast.fire({ icon: "success", title: `已添加 ${ids.length} 首` });
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

const fetchSongs = async () => {
  loadingSongs.value = true;
  try {
    const payload = await maimaiApi.getMusicData();
    songs.value = payload.songs || [];
  } catch (requestError) {
    error.value = getErrorMessage(requestError, "读取曲库失败");
  } finally {
    loadingSongs.value = false;
  }
};

const fetchPlans = async () => {
  if (selectedAccountIndex.value === null) return;
  loadingPlans.value = true;
  try {
    const res = await maimaiApi.getXiamaiPlans(selectedAccountIndex.value);
    plans.value = getResponseData<MaimaiXiamaiPlan>(res, "plans");
    if (!selectedPlanId.value && plans.value.length) selectedPlanId.value = plans.value[0].id;
  } catch (requestError) {
    error.value = getErrorMessage(requestError, "读取下埋计划失败");
  } finally {
    loadingPlans.value = false;
  }
};

const refreshPage = async () => {
  error.value = "";
  await Promise.all([fetchAccounts(), fetchSongs()]);
  await fetchPlans();
};

const selectAccount = (index: number) => {
  selectedAccountIndex.value = index;
  selectedPlanId.value = "";
  activeTask.value = null;
  accountMenuOpen.value = false;
};

const createPlan = async () => {
  if (selectedAccountIndex.value === null) return;
  syncMusicIdsFromText();
  if (!canCreatePlan.value) {
    Toast.fire({ icon: "warning", title: "请填写计划名称、歌曲和难度" });
    return;
  }

  savingPlan.value = true;
  try {
    const res = await maimaiApi.createXiamaiPlan({
      index: selectedAccountIndex.value,
      name: planName.value.trim(),
      musicIds: selectedMusicIds.value,
      levels: selectedLevels.value,
      scoreRule: {
        achievementMin: scoreRule.achievementMin,
        achievementMax: scoreRule.achievementMax,
        dxStarMin: scoreRule.dxStarMin,
        dxStarMax: scoreRule.dxStarMax,
        comboStatuses: scoreRule.comboStatuses,
        syncStatuses: scoreRule.syncStatuses,
        playCount: scoreRule.playCount,
      },
      recordOverrides: parseRecordOverrides(),
    });
    const plan = getResponseItem<MaimaiXiamaiPlan>(res, "plan");
    Toast.fire({ icon: "success", title: "下埋计划已创建" });
    planName.value = "";
    selectedMusicIds.value = [];
    musicIdsText.value = "";
    overrideText.value = "";
    await fetchPlans();
    if (plan) selectedPlanId.value = plan.id;
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "创建计划失败") });
  } finally {
    savingPlan.value = false;
  }
};

const deletePlan = async (plan: MaimaiXiamaiPlan) => {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "删除下埋计划",
    text: `确认删除「${plan.name}」？`,
    showCancelButton: true,
    confirmButtonText: "删除",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#ef4444",
  });
  if (!confirm.isConfirmed) return;

  try {
    await maimaiApi.deleteXiamaiPlan(plan.id);
    Toast.fire({ icon: "success", title: "计划已删除" });
    if (selectedPlanId.value === plan.id) selectedPlanId.value = "";
    await fetchPlans();
  } catch (requestError) {
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "删除计划失败") });
  }
};

const pollTask = async (taskId: string) => {
  if (activeTaskTimer.value !== null) {
    window.clearTimeout(activeTaskTimer.value);
  }

  const run = async () => {
    try {
      const res = await maimaiApi.getXiamaiTask(taskId);
      const task = getTaskPayload(res);
      if (task) activeTask.value = task;
      if (task?.status === "running") {
        activeTaskTimer.value = window.setTimeout(run, 2500);
        return;
      }
      taskBusy.value = false;
      if (task?.status === "success") {
        Toast.fire({ icon: "success", title: "乐曲下埋完成" });
        return;
      }
      if (task?.status === "interrupted") {
        Toast.fire({ icon: "warning", title: task.message || "任务已中断" });
      }
    } catch (requestError) {
      taskBusy.value = false;
      Toast.fire({ icon: "error", title: getErrorMessage(requestError, "读取任务失败") });
    }
  };

  await run();
};

const startPlan = async (planId: string, qrcode?: string) => {
  if (selectedAccountIndex.value === null) return;
  showQrModal.value = false;
  taskBusy.value = true;
  try {
    const res = await maimaiApi.startXiamaiTask(selectedAccountIndex.value, planId, qrcode);
    const task = getTaskPayload(res);
    if (task) {
      activeTask.value = task;
      await pollTask(task.taskId);
      return;
    }
    throw new Error("服务端没有返回任务");
  } catch (requestError) {
    taskBusy.value = false;
    const message = getErrorMessage(requestError, "启动下埋任务失败");
    if (/二维码|过期|Cookie|cookie|未激活/i.test(message)) {
      qrMode.value = "start";
      showQrModal.value = true;
      return;
    }
    Toast.fire({ icon: "error", title: message });
  }
};

const openResumeQr = () => {
  if (!activeTask.value) return;
  qrMode.value = "resume";
  qrText.value = "";
  showQrModal.value = true;
};

const resumeTask = async (qrcode: string) => {
  if (!activeTask.value) return;
  showQrModal.value = false;
  taskBusy.value = true;
  try {
    const res = await maimaiApi.resumeXiamaiTask(activeTask.value.taskId, qrcode);
    const task = getTaskPayload(res);
    if (task) {
      activeTask.value = task;
      await pollTask(task.taskId);
    }
  } catch (requestError) {
    taskBusy.value = false;
    Toast.fire({ icon: "error", title: getErrorMessage(requestError, "继续任务失败") });
  }
};

const submitQrcode = (value: string) => {
  const qrcode = value.trim();
  if (!qrcode) return;
  if (qrMode.value === "resume") {
    void resumeTask(qrcode);
    return;
  }
  if (selectedPlan.value) {
    void startPlan(selectedPlan.value.id, qrcode);
  }
};

const formatLevels = (levels: number[]) => {
  const names = levels.map((level) => (level === 0 ? "Basic" : "Advanced"));
  return names.join(" / ");
};

watch(selectedAccountIndex, () => {
  void fetchPlans();
});

onMounted(() => {
  void refreshPage();
});
</script>

<style scoped>
.xiamai-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header,
.panel-card {
  border: 1px solid rgba(251, 146, 60, 0.16);
  background: var(--surface-color);
  box-shadow: 0 18px 48px rgba(124, 45, 18, 0.08);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px;
  border-radius: 22px;
}

.page-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  color: #ea580c;
  font-size: 0.78rem;
  font-weight: 900;
}

.page-header h2,
.panel-head h3,
.section-head h3 {
  margin: 0;
  color: var(--text-main);
}

.error-banner {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  font-weight: 800;
}

.xiamai-layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.panel-card {
  border-radius: 20px;
  padding: 20px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.panel-head p {
  margin: 6px 0 0;
  color: var(--text-secondary);
}

.account-panel {
  position: sticky;
  top: 18px;
}

.state-box {
  min-height: 120px;
  display: grid;
  place-items: center;
  gap: 10px;
  color: var(--text-secondary);
  text-align: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(249, 115, 22, 0.16);
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.account-select {
  position: relative;
}

.select-trigger,
.select-option {
  width: 100%;
  border: 0;
  border-radius: 16px;
  background: rgba(255, 247, 237, 0.9);
  color: inherit;
  cursor: pointer;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
}

.select-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  display: grid;
  gap: 8px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid rgba(251, 146, 60, 0.18);
  background: var(--surface-color);
  box-shadow: 0 18px 44px rgba(124, 45, 18, 0.14);
}

.select-option {
  padding: 8px;
  text-align: left;
}

.select-option.active {
  outline: 2px solid rgba(249, 115, 22, 0.4);
}

.select-arrow {
  transition: transform 0.18s ease;
}

.select-arrow.open {
  transform: rotate(90deg);
}

.account-option-inner {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 10px;
  align-items: center;
}

.account-avatar {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  object-fit: cover;
}

.account-option-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.account-option-copy strong,
.account-option-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-option-copy span,
.rating-number {
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.task-panel {
  margin-top: 16px;
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 247, 237, 0.9);
}

.task-copy {
  display: grid;
  gap: 4px;
}

.task-copy span {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.task-bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(251, 146, 60, 0.16);
}

.task-bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #fb923c, #f97316);
  transition: width 0.2s ease;
}

.builder-section {
  display: grid;
  gap: 18px;
}

.builder-form,
.score-grid,
.status-checks,
.level-checks,
.version-picker {
  display: grid;
  gap: 10px;
}

.builder-form label,
.version-picker,
.level-checks,
.status-checks {
  color: var(--text-secondary);
  font-weight: 800;
}

.builder-form input,
.builder-form select,
.builder-form textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(251, 146, 60, 0.2);
  border-radius: 14px;
  padding: 11px 12px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-main);
  font: inherit;
  outline: none;
}

.builder-form textarea {
  min-height: 98px;
  resize: vertical;
}

.builder-form input:focus,
.builder-form select:focus,
.builder-form textarea:focus {
  border-color: rgba(249, 115, 22, 0.68);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1);
}

.version-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.score-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.level-checks,
.status-checks {
  grid-template-columns: auto repeat(6, auto);
  align-items: center;
  justify-content: start;
}

.level-checks label,
.status-checks label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  background: rgba(255, 247, 237, 0.9);
  color: var(--text-main);
}

.plan-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(249, 115, 22, 0.1);
  color: #9a3412;
}

.plan-summary strong {
  font-size: 1.4rem;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.xiamai-plan {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid rgba(251, 146, 60, 0.16);
  background: var(--surface-color);
}

.xiamai-plan.active {
  border-color: rgba(249, 115, 22, 0.55);
  box-shadow: 0 14px 32px rgba(249, 115, 22, 0.12);
}

.plan-main {
  display: grid;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.plan-main span,
.plan-main small {
  color: var(--text-secondary);
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.primary-btn,
.ghost-btn,
.danger-btn {
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  padding: 0 16px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.primary-btn {
  background: linear-gradient(135deg, #fb923c, #f97316);
  color: #fff;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.22);
}

.ghost-btn {
  background: rgba(251, 146, 60, 0.12);
  color: #c2410c;
}

.danger-btn {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.primary-btn:disabled,
.ghost-btn:disabled,
.danger-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.skeleton {
  min-height: 126px;
  background: linear-gradient(90deg, rgba(251, 146, 60, 0.08), rgba(251, 146, 60, 0.18), rgba(251, 146, 60, 0.08));
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

[data-theme="dark"] .select-trigger,
[data-theme="dark"] .select-option,
[data-theme="dark"] .task-panel,
[data-theme="dark"] .builder-form input,
[data-theme="dark"] .builder-form select,
[data-theme="dark"] .builder-form textarea,
[data-theme="dark"] .level-checks label,
[data-theme="dark"] .status-checks label {
  background: rgba(15, 23, 42, 0.76);
}

@media (max-width: 980px) {
  .xiamai-layout {
    grid-template-columns: 1fr;
  }

  .account-panel {
    position: static;
  }

  .score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .page-header,
  .version-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    align-items: stretch;
  }

  .level-checks,
  .status-checks {
    grid-template-columns: 1fr 1fr;
  }

  .level-checks > span,
  .status-checks > span {
    grid-column: 1 / -1;
  }

  .score-grid,
  .plan-grid {
    grid-template-columns: 1fr;
  }
}
</style>
