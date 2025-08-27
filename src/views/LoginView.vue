<template>
  <div class="login-container">
    <img
      src="../assets/pic/logo.png"
      class="login-logo"
      :class="{ rotating: loading }"
    />
    <h1 class="login-title">
      <transition name="fade-char">
        <span v-if="!loading" key="char1">登</span>
      </transition>
      <span key="char2">录</span>
    </h1>

    <div class="input-wrapper">
      <input
        v-model="qq"
        type="text"
        class="login-input"
        placeholder="请输入你的qq号"
        :disabled="loading"
      />
    </div>

    <!-- 改造后的按钮 -->
    <button
      class="login-btn"
      :class="{ rotating: loading }"
      :disabled="loading || !qq"
      @click="onSubmit"
    >
      <transition name="fade" mode="out-in">
        <span v-if="!loading" key="normal">发送</span>
        <span v-else key="loading" class="loading-wrap">
          <span role="status" aria-hidden="true"></span>
          正在验证...
        </span>
      </transition>
    </button>
    <p v-if="loading" class="verify-code">
      验证指令:/verify {{ code }}（剩余 {{ remaining }} 秒）
    </p>

    <p v-if="error" class="login-error">{{ error }}</p>
  </div>
  <!-- …你的原模板保持不变，仅在末尾追加： -->
  <Modal v-model="showModal" :title="modalTitle">
    <template #default>
      <div v-if="modalType === 'code'">
        你的验证码：<strong>{{ code }}</strong
        ><br />
        请在bot处发送<strong>/verify {{ code }}</strong
        >完成验证。系统会在 30 秒内自动检测是否通过。
      </div>
      <div v-else>
        {{ modalMessage }}
      </div>
    </template>
    <template #footer>
      <button type="button" class="btn btn-primary" @click="showModal = false">
        我知道了
      </button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import http from "../utils/http";
import Modal from "../components/Modal.vue";

const qq = ref("");
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const error = ref("");
const code = ref<string>("");

// 弹窗控制
const showModal = ref(false);
const modalTitle = ref("提示");
const modalMessage = ref("");
const modalType = ref<"code" | "info">("info");

let poller: number | null = null;
let elapsed = 0;
const INTERVAL = 1000;
const TIMEOUT = 30_000;
const remaining = ref(TIMEOUT / 1000);

const onSubmit = async () => {
  if (!qq.value) {
    error.value = "请输入qq";
    // 也可以用弹窗提示
    modalTitle.value = "提示";
    modalMessage.value = "请输入 QQ 号";
    modalType.value = "info";
    showModal.value = true;
    return;
  }

  error.value = "";
  code.value = "";
  loading.value = true;
  elapsed = 0;

  try {
    // 1) 申请验证码（后端会校验是否绑定 uid）
    const res = await http.post("/auth/apply", { qq: Number(qq.value) });
    code.value = res.data?.code ?? "";

    // 弹窗展示验证码
    modalTitle.value = "验证码已生成";
    modalType.value = "code";
    showModal.value = true;

    // 2) 开始轮询
    startPolling();
  } catch (e: any) {
    loading.value = false;
    const msg = e?.response?.data?.detail || e?.message || "申请失败";
    error.value = msg;

    modalTitle.value = "申请失败";
    modalMessage.value = msg;
    modalType.value = "info";
    showModal.value = true;
  }
};

function startPolling() {
  if (poller) clearInterval(poller);
  elapsed = 0;
  remaining.value = TIMEOUT / 1000;

  poller = window.setInterval(async () => {
    elapsed += INTERVAL;
    remaining.value = Math.max(0, (TIMEOUT - elapsed) / 1000);
    try {
      const s = await http.get("/auth/status", {
        params: { qq: Number(qq.value) },
      });
      const status = s.data?.status;

      if (status === "success") {
        stopPolling();
        loading.value = false;

        modalTitle.value = "登录成功！";
        modalMessage.value = "正在跳转...";
        modalType.value = "info";
        showModal.value = true;

        setTimeout(() => {
          localStorage.setItem("token", qq.value);
          const redirect = (route.query.redirect as string) || "/";
          router.replace(redirect);
        }, 1500);
        return;
      }

      if (status === "expired" || status === "not_found") {
        stopPolling();
        loading.value = false;
        const msg =
          status === "expired"
            ? "验证码已过期，请重新提交"
            : "未找到验证信息，请重新提交";
        error.value = msg;
        modalTitle.value = "验证未通过";
        modalMessage.value = msg;
        modalType.value = "info";
        showModal.value = true;
        return;
      }

      // pending：继续等待
      if (elapsed >= TIMEOUT) {
        stopPolling();
        loading.value = false;
        error.value = "超时未验证，请重新提交";
        modalTitle.value = "超时提示";
        modalMessage.value = "超时未完成验证，请重新提交申请。";
        modalType.value = "info";
        showModal.value = true;
      }
    } catch (e: any) {
      stopPolling();
      loading.value = false;
      const msg = e?.response?.data?.detail || e?.message || "状态检查失败";
      error.value = msg;
      modalTitle.value = "状态检查失败";
      modalMessage.value = msg;
      modalType.value = "info";
      showModal.value = true;
    }
  }, INTERVAL);
}

function stopPolling() {
  if (poller) {
    clearInterval(poller);
    poller = null;
  }
  remaining.value = TIMEOUT / 1000;
}

onBeforeUnmount(() => stopPolling());
</script>



<style scoped>
.verify-code {
  margin: 50px auto;
}

/* 标题 */
.fade-char-enter-active,
.fade-char-leave-active {
  transition: opacity 0.6s ease;
}

.fade-char-enter-from,
.fade-char-leave-to {
  opacity: 0;
}

.rotating {
  animation: spin 0.2s linear infinite;
}

/* 容器整体布局 */
.login-container {
  max-width: 400px;
  margin: 80px auto;
  text-align: center;
}

/* logo 图片 */
.login-logo {
  max-width: 120px;
  margin-bottom: 20px;
}

/* 标题 */
.login-title {
  margin-bottom: 24px;
  font-size: 28px;
  font-weight: 600;
}

/* 输入框外层 */
.input-wrapper {
  margin-bottom: 16px;
}

/* 输入框 */
.login-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
}

/* 按钮 */
.login-btn {
  display: block;
  margin: 0 auto;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  background-color: #0d6efd;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease, opacity 0.2s ease;
}
.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.login-btn:hover:not(:disabled) {
  background-color: #0b5ed7;
}

/* 加载中内容 */
.loading-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 小 spinner */
/* .spinner {
  width: 1em;
  height: 1em;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
} */

/* 错误提示 */
.login-error {
  margin-top: 16px;
  color: #dc3545;
  font-size: 14px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
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
</style>
