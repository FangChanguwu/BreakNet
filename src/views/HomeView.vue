<template>
  <div class="login-page">
    <video
      ref="bgVideoRef"
      class="bg-video"
      autoplay
      muted
      playsinline
      :src="currentVideo"
      @ended="handleVideoEnded"
    ></video>
    <div class="glass-overlay"></div>
    <div class="video-controls">
      <button
        class="glass-icon-btn"
        @click="toggleMute"
        :title="isMuted ? '开启声音' : '静音'"
      >
        <svg v-if="isMuted" viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="currentColor"
            d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="24" height="24">
          <path
            fill="currentColor"
            d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
          />
        </svg>
      </button>
      <button
        class="glass-icon-btn"
        :class="{ active: isPlaylistOpen }"
        title="展开播放列表"
        @click="isPlaylistOpen = !isPlaylistOpen"
      >
        <svg viewBox="0 0 24 24" width="23" height="23">
          <path
            fill="currentColor"
            d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 4 6.5Zm0 5.5a1.5 1.5 0 0 1 1.5-1.5h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 4 12Zm1.5 4a1.5 1.5 0 0 0 0 3h8a1.5 1.5 0 0 0 0-3h-8Z"
          />
        </svg>
      </button>

      <transition name="playlist-fade">
        <div v-if="isPlaylistOpen" class="playlist-panel">
          <button
            v-for="(video, index) in videoList"
            :key="video.title"
            type="button"
            class="playlist-item"
            :class="{ active: index === currentVideoIndex }"
            @click="playVideo(index)"
          >
            <span>{{ index + 1 }}</span>
            <strong>{{ video.title }}</strong>
          </button>
        </div>
      </transition>
    </div>

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
        @req-login="handleLoginReq"
        @req-register="handleRegisterReq"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import LoginModal from "../components/Modal.vue";
import { authApi } from "../api/auth";
import { useAuthStore } from "../stores/auth";
import { storeToRefs } from "pinia";
const router = useRouter();

const title = "Break Net.";
const titleChars = title.split("");
const startTextAnim = ref(false);
const showModal = ref(false);
const loginModalRef = ref<any>(null);

const authStore = useAuthStore();
const { isLoggedIn } = storeToRefs(authStore);

const videoTitles = [
  "Break The Speakers",
  "Overjoy ★ OVERDOSE!!",
  "Divide et impera!",
  "Ref：rain (for 7th Heaven)",
  "宙天",
  "184億回のマルチトニック",
  "忙シー日",
  "Eureka",
  "Åntinomiε",
];
const videoBaseUrl = "https://assets.fangchang.asia/net/src/bg";
const videoList = videoTitles.map((title) => ({
  title,
  url: `${videoBaseUrl}/${encodeURIComponent(title)}.mp4`,
}));
const currentVideoIndex = ref(Math.floor(Math.random() * videoList.length));
const currentVideo = ref(videoList[currentVideoIndex.value].url);
const isPlaylistOpen = ref(false);

const handleVideoEnded = () => {
  if (videoList.length <= 1) {
    bgVideoRef.value?.play();
    return;
  }

  let nextIndex = currentVideoIndex.value;
  do {
    nextIndex = Math.floor(Math.random() * videoList.length);
  } while (nextIndex === currentVideoIndex.value);

  playVideo(nextIndex, false);
};

const playVideo = (index: number, closePlaylist = true) => {
  const target = videoList[index];
  if (!target) return;
  currentVideoIndex.value = index;
  currentVideo.value = target.url;
  if (closePlaylist) {
    isPlaylistOpen.value = false;
  }
  setTimeout(() => {
    if (bgVideoRef.value) {
      bgVideoRef.value.volume = 0.1;
      bgVideoRef.value.muted = isMuted.value;
      bgVideoRef.value.play().catch((e) => console.log("播放被拦截:", e));
    }
  }, 100);
};

onMounted(() => {
  if (bgVideoRef.value) {
    bgVideoRef.value.volume = 0.1;
  }

  setTimeout(() => {
    startTextAnim.value = true;
  }, 1000);
});

const bgVideoRef = ref<HTMLVideoElement | null>(null);
const isMuted = ref(true);

const toggleMute = () => {
  isMuted.value = !isMuted.value;

  if (bgVideoRef.value) {
    bgVideoRef.value.muted = isMuted.value;
  }
};

const onSubmit = () => {
  showModal.value = true;
};

const handleLogout = () => {
  authStore.logout();
};

const handleLoginReq = async (data: any) => {
  try {
    const res = await authApi.login(data);
    if(res.data?.ok) {
       authStore.setLoginInfo(res.data.token, res.data.qq, res.data.role); 
       router.push("/panel");
    }
  } catch(error: any) {
    loginModalRef.value?.showExternalError(error.response?.data?.detail || "账号或密码错误");
  }
};

const handleRegisterReq = async (data: any) => {
    try {
        const res = await authApi.register(data);
        if(res.data?.ok) {
            authStore.setLoginInfo(res.data.token, res.data.qq, res.data.role); 
            router.push("/panel");
        }
    } catch (error: any) {
       loginModalRef.value?.showExternalError(error.response?.data?.detail || "注册失败");
    }
};
</script>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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

.main-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 100%;
  padding: 24px;
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
  transform: scale(1.7);
  height: 100px;
  transform-origin: center;
  max-width: 100%;
}

.login-logo {
  height: 80px;
  width: auto;

  object-fit: contain;

  margin-right: 12px;

  position: relative;
  top: -5px;
  animation: logoEntry 0.8s ease-out forwards;
}

.login-title {
  display: flex;
  font-size: 2.2rem;
  font-weight: 800;

  opacity: 0;
  white-space: nowrap;
  transition: all 1s cubic-bezier(0.65, 0, 0.35, 1);

  font-family: "Arial Black", Impact, sans-serif;
  font-style: italic;
  font-weight: 900;
  letter-spacing: -1px;
}

.brand-wrapper.is-active .login-title {
  opacity: 1;
}

.form-layer {
  margin-top: 50px;
  opacity: 0;
  transform: translateY(20px);
  pointer-events: none;
  transition: all 0.8s ease-out 1.5s;
  max-width: 100%;
}

.form-layer.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.action-btn {
  padding: 0.8em 3em;

  font-size: clamp(14px, 2.5vw, 20px);

  font-weight: 700;
  color: #000;
  background: #fff;
  border: none;
  border-radius: 100px;
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

@media (max-width: 768px) {
  .main-content {
    padding: 20px 16px;
    margin-top: 0;
  }

  .brand-wrapper {
    transform: none;
    flex-direction: column;
    gap: 12px;
    height: auto;
  }

  .brand-wrapper.is-active .login-title {
    width: auto;
  }

  .login-logo {
    height: 64px;
    margin-right: 0;
    top: 0;
  }

  .login-title {
    font-size: 1.6rem;
    white-space: normal;
    justify-content: center;
    text-align: center;
  }

  .form-layer {
    margin-top: 30px;
  }

  .action-btn {
    width: min(100%, 320px);
    padding: 0.8em 1.5em;
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
  position: relative;

  padding: 0 0.15em;
  margin: 0 -0.1em;
  line-height: 1.2;

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

.modal-content {
  background: #ffffff;
  width: 85%;
  max-width: 400px;
  border-radius: 16px;
  padding: 30px 24px 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;

  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.modal-title {
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  font-size: 1rem;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s ease;
}

.modal-input:focus {
  background: #fff;
  border-color: #ff8c00;
  box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
}

.modal-input::placeholder {
  color: #aaa;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 28px;
}

.confirm-btn {
  background: #ff8c00;
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
  background: #ff9d2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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
  user-select: all;
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
  align-items: stretch;
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
}

.code-box {
  flex: 1;
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
  margin-bottom: 0;
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
  flex-wrap: wrap;
  max-width: 100%;
}

.enter-btn {
  background: #ff8c00 !important;
  color: #fff;
}

.enter-btn:hover {
  background: #ff9d2e !important;
  box-shadow: 0 4px 15px rgba(255, 140, 0, 0.4);
}

.logout-btn {
  background: #ffffff !important;
  color: #333333 !important;
  border: none !important;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.logout-btn:hover {
  background: #ff4d4f !important;
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(255, 77, 79, 0.4);
}

.video-controls {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.glass-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.glass-icon-btn:hover,
.glass-icon-btn.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.glass-icon-btn:active {
  transform: scale(0.95);
}

.playlist-panel {
  position: absolute;
  top: 54px;
  right: 0;
  display: grid;
  gap: 8px;
  width: min(320px, calc(100vw - 32px));
  max-height: min(520px, calc(100vh - 92px));
  overflow: auto;
  padding: 10px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.22);
}

.playlist-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s ease;
}

.playlist-item:hover,
.playlist-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.34);
}

.playlist-item span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.78rem;
  font-weight: 900;
}

.playlist-item strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.92rem;
  letter-spacing: 0;
}

.playlist-fade-enter-active,
.playlist-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.playlist-fade-enter-from,
.playlist-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 768px) {
  .video-controls {
    top: 16px;
    right: 16px;
  }

  .glass-icon-btn {
    width: 38px;
    height: 38px;
  }

  .playlist-panel {
    top: 48px;
  }
}
</style>
