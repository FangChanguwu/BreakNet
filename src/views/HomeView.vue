<template>
  <div class="login-page">
    <video
      class="bg-video"
      autoplay
      muted
      loop
      playsinline
      src="http://assets.fangchang.asia/maimai/bg.mp4"
    ></video>
    <div class="glass-overlay"></div>

    <div class="main-content">
      <div class="brand-layer">
        <div class="brand-wrapper" :class="{ 'is-active': startTextAnim }">
          <img src="../assets/pic/logo.png" class="login-logo" />
          <h1 class="login-title">
            <span
              v-for="(char, index) in titleChars"
              :key="index"
              :style="{ 'animation-delay': index * 0.08 + 's' }"
              class="char-fade-in"
            >
              {{ char === " " ? "&nbsp;" : char }}
            </span>
          </h1>
        </div>
      </div>

      <div class="form-layer" :class="{ show: startTextAnim }">
        <template v-if="!isLoggedIn">
          <button class="action-btn" @click="onSubmit">
            <span>登录或注册</span>
          </button>
        </template>

        <template v-else>
          <div class="logged-in-actions">
            <button
              class="action-btn enter-btn"
              @click="$router.push('/panel')"
            >
              <span>进入面板</span>
            </button>
            <button class="action-btn logout-btn" @click="handleLogout">
              <span>退出登录</span>
            </button>
          </div>
        </template>
      </div>
      <LoginModal
        ref="loginModalRef"
        v-model:show="showModal"
        @confirm="handleLogin"
      />

      <transition name="fade">
        <div v-if="showVerify" class="modal-overlay">
          <div class="verify-card">
            <h2 class="modal-title">等待验证</h2>
            <p class="verify-desc">请前往 Bot 处发送以下指令：</p>

            <div class="code-container">
              <div class="code-box">/verify {{ verifyCode }}</div>
              <button class="copy-btn" @click="copyCode">{{ copyText }}</button>
            </div>

            <div class="polling-status">
              <span class="loading-dot"></span>
              {{ pollStatusText }}
            </div>

            <button class="cancel-btn" @click="cancelVerify">取消登录</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import LoginModal from "../components/Modal.vue";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth";
import { storeToRefs } from "pinia"; // 👇 新增引入 storeToRefs

const router = useRouter();

const title = "Break Net.";
const titleChars = title.split("");
const startTextAnim = ref(false);
const showModal = ref(false);
const loginModalRef = ref<any>(null);
const copyText = ref("复制");
const showVerify = ref(false);
const verifyCode = ref("");
const pollStatusText = ref("等待您在 Bot 处验证...");
const currentQQ = ref("");

const authStore = useAuthStore();
// 👇 提取登录状态，确保它是响应式的
const { isLoggedIn } = storeToRefs(authStore);

let pollTimer: number | null = null;

onMounted(() => {
  setTimeout(() => {
    startTextAnim.value = true;
  }, 1000);
});

const onSubmit = () => {
  showModal.value = true;
};

// 👇 新增：在首页直接退出的方法
const handleLogout = () => {
  authStore.logout();
};

const handleLogin = async (qq: string) => {
  try {
    currentQQ.value = qq;
    const res = await authApi.apply(qq);
    const data = res.data;

    if (data.ok) {
      verifyCode.value = data.code;
      showModal.value = false;
      showVerify.value = true;
      startPolling();
    }
  } catch (error: any) {
    // console.log("完整的错误对象:", error);
    // console.log("后端的响应数据:", error.response);

    const errorMsg = error.response?.data?.detail || "请求失败，请稍后重试";
    loginModalRef.value?.showExternalError(errorMsg);
  }
};

const startPolling = () => {
  if (pollTimer) clearInterval(pollTimer);

  pollTimer = setInterval(async () => {
    try {
      const res = await authApi.checkStatus(currentQQ.value);
      const data = res.data;

      if (data.status === "success") {
        stopPolling();
        pollStatusText.value = "验证成功！正在跳转...";
        authStore.setLoginInfo(data.token, currentQQ.value);

        // 👇 核心修改：登录成功后跳转到 /panel
        setTimeout(() => {
          router.push("/panel");
        }, 1000);
      } else if (data.status === "expired") {
        stopPolling();
        pollStatusText.value = "验证已过期，请重新登录";
      } else if (data.status === "not_found") {
        stopPolling();
        pollStatusText.value = "验证记录不存在，请重新登录";
      }
    } catch (error) {
      // console.error("轮询出错", error);
    }
  }, 2500);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(`/verify ${verifyCode.value}`);
    copyText.value = "已复制!";
    setTimeout(() => {
      copyText.value = "复制";
    }, 2000);
  } catch (err) {
    alert("复制失败，请手动长按或双击选择复制");
  }
};

const cancelVerify = () => {
  stopPolling();
  showVerify.value = false;
};

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  overflow: hidden;
  background: #000;
}

.bg-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -2;
}

.glass-overlay {
  position: absolute;
  inset: 0;
  z-index: -1;
  backdrop-filter: blur(15px) brightness(0.8);
  -webkit-backdrop-filter: blur(15px) brightness(0.8);
  background-color: rgba(255, 255, 255, 0.05);
  background-image: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0.1),
    rgba(0, 0, 0, 0.1)
  );
}

/* 主内容容器：通过 margin-top 微调视觉重心，防止手机端偏下 */
.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-top: -5vh;
}

.brand-layer {
  z-index: 2;
  transition: all 1s ease;
}

.brand-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1.7); /* 电脑端保持 1.7 */
  height: 100px;
}

.login-logo {
  width: 60px;
  height: 60px;
  position: relative;
  top: -5px;
  animation: logoEntry 0.8s ease-out forwards;
}

.login-title {
  display: flex;
  font-size: 2.2rem;
  font-weight: 800;
  /* 移除 width: 0 和 overflow: hidden，改用 opacity 控制整体显示 */
  opacity: 0;
  white-space: nowrap;
  transition: all 1s cubic-bezier(0.65, 0, 0.35, 1);

  /* 添加斜体和特殊字体 */
  font-family: "Arial Black", Impact, sans-serif;
  font-style: italic;
  font-weight: 900;
  letter-spacing: -1px; /* 稍微紧凑 */
}

.brand-wrapper.is-active .login-title {
  /* 移除 width 限制 */
  opacity: 1;
}
/* --- 表单层：移除绝对定位 top:52%，改用 margin 保持比例 --- */
.form-layer {
  margin-top: 50px; /* 调整标题与按钮的固定间距 */
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.8s ease-out 1.5s;
}

.form-layer.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* --- 按钮部分：响应式大小 --- */
.action-btn {
  /* 使用 em 单位：按钮的长宽会随 font-size 同比例缩放 */
  padding: 0.8em 3em;

  /* 基础字号：根据屏幕宽度动态计算，最小不低于 14px，最大不高于 20px */
  font-size: clamp(14px, 2.5vw, 20px);

  font-weight: 700;
  color: #000;
  background: #fff;
  border: none;
  border-radius: 100px; /* 足够大的圆角保持胶囊形状 */
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  white-space: nowrap;
  letter-spacing: 0.05em;
}

.action-btn:hover {
  transform: scale(1.05);
  background: #f0f0f0;
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.2);
}

.action-btn:active {
  transform: scale(0.98);
}

/* --- 移动端适配核心 --- */
@media (max-width: 768px) {
  .brand-wrapper {
    transform: scale(1.2); /* 手机端缩小比例，防止遮挡 */
  }
  .brand-wrapper.is-active .login-title {
    width: auto; /* 相应调小宽度 */
  }
  .login-title {
    font-size: 1.6rem; /* 调小字号 */
  }
  .form-layer {
    margin-top: 30px; /* 手机端拉近间距 */
  }
  .main-content {
    margin-top: -10vh; /* 手机端视觉位置再往上提一点 */
  }
  .char-fade-in {
    padding: 0 0.1em;
    margin: 0 -0.05em;
  }
}

@keyframes charShow {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes logoEntry {
  from {
    opacity: 0;
    transform: scale(0.65);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.char-fade-in {
  opacity: 0;
  display: inline-block;
  transform: translateY(5px);
  position: relative; /* 确保 z-index 能生效 */

  /* --- 核心修复：为斜体腾出空间 --- */
  padding: 0 0.15em; /* 左右增加内边距，防止斜体笔画被切 */
  margin: 0 -0.1em; /* 用负外边距抵消，保持字母靠拢 */
  line-height: 1.2; /* 防止上下被切 */

  /* 橙红渐变文字效果 */
  background: linear-gradient(135deg, #faa033, #ff4d4f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.brand-wrapper.is-active .char-fade-in {
  animation: charShow 0.5s ease-out forwards;
}

/* =========================================
   新增：弹窗样式
========================================= */

/* 遮罩层：全屏、半透明黑底带一点模糊 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 弹窗主内容：白色圆角 */
.modal-content {
  background: #ffffff;
  width: 85%;
  max-width: 400px;
  border-radius: 16px; /* 大圆角 */
  padding: 30px 24px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  /* 弹窗缩放出现动画 */
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

/* 弹窗标题：上方居中 */
.modal-title {
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  text-align: center;
}

/* 输入框样式 */
.modal-input {
  width: 100%;
  box-sizing: border-box; /* 确保 padding 不撑破宽度 */
  padding: 12px 16px;
  font-size: 1rem;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s ease;
}

/* 输入框聚焦时的主题色反馈 */
.modal-input:focus {
  background: #fff;
  border-color: #ff8c00; /* 橙色边框 */
  box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
}

.modal-input::placeholder {
  color: #aaa;
}

/* 底部按钮区：右对齐 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

/* 橙色确定按钮 */
.confirm-btn {
  background: #ff8c00; /* 橙色 */
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover {
  background: #ff9d2e; /* hover 时稍微变亮 */
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

/* Vue <transition name="fade"> 的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 弹窗弹出的 keyframes */
@keyframes modalPop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* =========================================
   新增：等待验证弹窗样式
========================================= */
.verify-card {
  background: #ffffff;
  width: 90%;
  max-width: 380px;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.verify-desc {
  color: #666;
  font-size: 1rem;
  margin-bottom: 16px;
}

.code-box {
  background: #f4f6f8;
  border: 2px dashed #ff8c00;
  color: #ff8c00;
  font-size: 1.5rem;
  font-weight: 800;
  padding: 12px 24px;
  border-radius: 8px;
  letter-spacing: 2px;
  margin-bottom: 24px;
  user-select: all; /* 方便用户双击复制 */
}

.polling-status {
  font-size: 0.9rem;
  color: #1890ff;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  background-color: #1890ff;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}

.cancel-btn {
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f5f5f5;
  color: #666;
}

@keyframes blink {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 1;
  }
}

/* =========================================
   修改/新增：指令框与复制按钮布局
========================================= */
.code-container {
  display: flex;
  align-items: stretch; /* 让按钮和框一样高 */
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
}

.code-box {
  flex: 1; /* 让指令框自动撑满剩余空间 */
  background: #f4f6f8;
  border: 2px dashed #ff8c00;
  color: #ff8c00;
  font-size: 1.4rem;
  font-weight: 800;
  padding: 10px 16px;
  border-radius: 8px;
  letter-spacing: 1px;
  user-select: all;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0; /* 移除之前的 marginBottom */
}

.copy-btn {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  padding: 0 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.copy-btn:active {
  transform: scale(0.96);
}

.logged-in-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.enter-btn {
  background: #ff8c00 !important; /* 强制覆盖原有背景色 */
  color: #fff;
}

.enter-btn:hover {
  background: #ff9d2e !important;
  box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
}

.logout-btn {
  background: #ffffff !important; /* 纯白背景 */
  color: #333333 !important; /* 深灰色文字，保证能看清 */
  border: none !important; /* 纯色按钮不需要边框 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); /* 加一点黑色阴影让它更立体 */
}

.logout-btn:hover {
  background: #ff4d4f !important; /* 悬浮时变成警示红 */
  color: #ffffff !important; /* 悬浮时文字变回纯白 */
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.4);
}
</style>
