<template>
  <div class="login-page">
    <video class="bg-video" autoplay muted loop playsinline src="/bg.mp4"></video>
    <div class="glass-overlay"></div>

    <div class="main-content">
      <div class="brand-layer">
        <div class="brand-wrapper" :class="{ 'is-active': startTextAnim }">
          <img src="../assets/pic/logo.png" class="login-logo" />
          <h1 class="login-title">
            <span v-for="(char, index) in titleChars" :key="index" 
                  :style="{ 'animation-delay': (index * 0.08 + 0.5) + 's' }" 
                  class="char-fade-in">
              {{ char === ' ' ? '&nbsp;' : char }}
            </span>
          </h1>
        </div>
      </div>

      <div class="form-layer" :class="{ 'show': startTextAnim }">
        <button class="action-btn" @click="onSubmit">
          <span>登录或注册</span>
        </button>
      </div>

      <LoginModal 
      v-model:show="showModal" 
      @confirm="handleLogin" 
    />
    </div>
  </div>
</template>

<script setup lang="ts">


import { ref, onMounted ,onBeforeUnmount} from 'vue';

const title = "Break Net.";
const titleChars = title.split('');
const startTextAnim = ref(false);

onMounted(() => {
  // 1. 页面加载后，Logo 首先在中心显现（由 CSS 控制）
  // 2. 1秒后，Logo 开始向左滑，同时文字开始逐个出现
  setTimeout(() => {
    startTextAnim.value = true;
  }, 1000);
});

// --- 新增：弹窗控制逻辑 ---
const showModal = ref(false); // 控制弹窗显示隐藏
const qqNumber = ref('');     // 绑定QQ号输入框的值

// 原有“登录”按钮的点击事件
const onSubmit = () => {
  showModal.value = true;
};

import LoginModal from '../components/Modal.vue';


// 处理子组件传回来的确认事件
const handleLogin = (qq: string) => {
  console.log('接收到弹窗提交的QQ号码:', qq);
  
  // 这里写你的请求逻辑
  // api.login({ qq }).then(...)
  
  // 提交成功后关闭弹窗
  showModal.value = false;
};

// import { useRouter, useRoute } from "vue-router";
// import http from "../utils/http";
// import Modal from "../components/Modal.vue";
// import CryptoJS from 'crypto-js'
// import { useAuthStore } from '../stores/auth'
// const auth = useAuthStore()
// const qq = ref("");
// const router = useRouter();
// const route = useRoute();

// const loading = ref(false);
// const error = ref("");
// const code = ref<string>("");

// // 弹窗控制
// const showModal = ref(false);
// const modalTitle = ref("提示");
// const modalMessage = ref("");
// const modalType = ref<"code" | "info">("info");

// let poller: number | null = null;
// let elapsed = 0;
// const INTERVAL = 1000;
// const TIMEOUT = 30_000;
// const remaining = ref(TIMEOUT / 1000);

// const onSubmit = async () => {
//   if (!qq.value) {
//     error.value = "请输入qq";
//     modalTitle.value = "提示";
//     modalMessage.value = "请输入 QQ 号";
//     modalType.value = "info";
//     showModal.value = true;
//     return;
//   }

//   error.value = "";
//   code.value = "";
//   loading.value = true;
//   elapsed = 0;

//   try {
//     // --- 新增：签名逻辑 ---
//     const timestamp = Math.floor(Date.now() / 1000); // 获取秒级时间戳
//     const SECRET_KEY = "breakthefangchang"; // 必须与后端 SECRET_KEY 完全一致
    
//     // 生成签名：md5(qq + t + SECRET_KEY)
//     // 注意：确保拼接顺序与后端一致
//     const sign = CryptoJS.MD5(`${qq.value}${timestamp}${SECRET_KEY}`).toString();
//     // ----------------------

//     // 1) 申请验证码
//     // 将 t 和 sign 作为 params (Query 参数) 传递
//     const res = await http.post(
//       "/auth/apply", 
//       { qq: Number(qq.value) }, 
//       { 
//         params: { 
//           t: timestamp, 
//           sign: sign 
//         } 
//       }
//     );

//     code.value = res.data?.code ?? "";
//     modalTitle.value = "验证码已生成";
//     modalType.value = "code";
//     showModal.value = true;

//     // 2) 开始轮询
//     startPolling();
//   } catch (e: any) {
//     loading.value = false;
//     const msg = e?.response?.data?.detail || e?.message || "申请失败";
//     error.value = msg;
//     modalTitle.value = "申请失败";
//     modalMessage.value = msg;
//     modalType.value = "info";
//     showModal.value = true;
//   }
// };

// function startPolling() {
//   if (poller) clearInterval(poller);
//   elapsed = 0;
//   remaining.value = TIMEOUT / 1000;

//   poller = window.setInterval(async () => {
//     elapsed += INTERVAL;
//     remaining.value = Math.max(0, (TIMEOUT - elapsed) / 1000);
//     try {
//       const s = await http.get("/auth/status", {
//         params: { qq: Number(qq.value) },
//       });
//       const status = s.data?.status;

//       if (status === "success") {
//         stopPolling();
//         auth.setLoginInfo(s.data.token, String(qq.value))
//         loading.value = false;
    
//         modalTitle.value = "登录成功！";
//         modalMessage.value = "正在跳转...";
//         modalType.value = "info";
//         showModal.value = true;

//         setTimeout(() => {
//           const redirect = (route.query.redirect as string) || "/";
//           router.replace(redirect);
//         }, 1500);
//         return;
//       }

//       if (status === "expired" || status === "not_found") {
//         stopPolling();
//         loading.value = false;
//         const msg =
//           status === "expired"
//             ? "验证码已过期，请重新提交"
//             : "未找到验证信息，请重新提交";
//         error.value = msg;
//         modalTitle.value = "验证未通过";
//         modalMessage.value = msg;
//         modalType.value = "info";
//         showModal.value = true;
//         return;
//       }

//       // pending：继续等待
//       if (elapsed >= TIMEOUT) {
//         stopPolling();
//         loading.value = false;
//         error.value = "超时未验证，请重新提交";
//         modalTitle.value = "超时提示";
//         modalMessage.value = "超时未完成验证，请重新提交申请。";
//         modalType.value = "info";
//         showModal.value = true;
//       }
//     } catch (e: any) {
//       stopPolling();
//       loading.value = false;
//       const msg = e?.response?.data?.detail || e?.message || "状态检查失败";
//       error.value = msg;
//       modalTitle.value = "状态检查失败";
//       modalMessage.value = msg;
//       modalType.value = "info";
//       showModal.value = true;
//     }
//   }, INTERVAL);
// }

// function stopPolling() {
//   if (poller) {
//     clearInterval(poller);
//     poller = null;
//   }
//   remaining.value = TIMEOUT / 1000;
// }

// onBeforeUnmount(() => stopPolling());
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
  background-image: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.1));
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
  top: -7px;
  left: 15px;
  transition: all 1s cubic-bezier(0.65, 0, 0.35, 1);
  animation: logoEntry 0.8s ease-out;
}

.login-title {
  display: flex;
  font-size: 2.2rem;
  font-weight: 800;
  color: #fff;
  width: 0;
  opacity: 0;
  white-space: nowrap;
  overflow: hidden;
  transition: all 1s cubic-bezier(0.65, 0, 0.35, 1);
}

.brand-wrapper.is-active .login-title {
  width: 200px;
  opacity: 1;
  margin-left: 20px;
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
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
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
    width: 140px; /* 相应调小宽度 */
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
}

@keyframes charShow { to { opacity: 1; transform: translateY(0); } }
@keyframes logoEntry { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
.char-fade-in { opacity: 0; display: inline-block; transform: translateY(5px); }
.brand-wrapper.is-active .char-fade-in { animation: charShow 0.5s ease-out forwards; }

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
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>