<template>
  <transition name="fade">
    <div v-if="show" class="modal-overlay">
      <div class="modal-content">
        <button class="modal-close-btn" @click="onClose" title="关闭">×</button>
        <h2 class="modal-title">
          {{ mode === 'login' ? '账号登录' : '点我注册' }}
        </h2>

        <!-- ================= 登录模式 ================= -->
        <template v-if="mode === 'login'">
          <input
            v-model="identifier"
            type="text"
            class="modal-input"
            :class="{ 'is-error': isError && !password }"
            placeholder="用户名 或 QQ号码"
            @input="clearError"
          />
          <input
            v-model="password"
            type="password"
            class="modal-input mt-3"
            :class="{ 'is-error': isError && !identifier }"
            placeholder="登录密码"
            @input="clearError"
            @keyup.enter="handleLoginClick"
          />
          
          <label class="remember-row">
            <input v-model="rememberMe" type="checkbox" class="remember-checkbox" />
            <span>7天内免登录</span>
          </label>

          <transition name="slide-down">
            <div v-if="isError" class="error-msg">{{ errorText }}</div>
          </transition>
          
          <div class="modal-footer">
            <span class="register-link" @click="switchMode('register')">点我注册</span>
            <button class="confirm-btn" @click="handleLoginClick">登录</button>
          </div>
        </template>

        <!-- ================= 注册模式 ================= -->
        <template v-if="mode === 'register'">
          <input
            v-model="username"
            type="text"
            class="modal-input"
            placeholder="用户名 (3-32位英文/数字，登录使用)"
            @input="clearError"
          />
          <input
            v-model="nickname"
            type="text"
            class="modal-input mt-3"
            placeholder="用户昵称 (仅展示用)"
            @input="clearError"
          />
          <input
            v-model="password"
            type="password"
            class="modal-input mt-3"
            placeholder="用户密码"
            @input="clearError"
          />
          
          <!-- QQ 复合验证区域 -->
          <div class="qq-verify-group mt-3">
            <input
              v-model="qqNumber"
              type="text"
              class="modal-input qq-input"
              placeholder="输入验证QQ号"
              :disabled="verifyStatus === 'waiting' || verifyStatus === 'success'"
              @input="clearError"
            />
            <button 
                class="verify-btn" 
                :class="{ 'is-waiting': verifyStatus === 'waiting', 'is-success': verifyStatus === 'success' }"
                :disabled="verifyStatus === 'waiting' || verifyStatus === 'success'"
                @click="startVerification"
            >
              {{ verifyBtnText }}
            </button>
          </div>

          <!-- 内联验证码提示部分 -->
          <transition name="slide-down">
            <div v-if="verifyStatus === 'waiting'" class="inline-verify-area">
               <div class="verify-instructions">
                 请给Bot发送指令: 
                 <strong class="code-copy-text" @click="copyCode" :title="'点击复制'">/verify {{ verifyCode }}</strong>
               </div>
               <div class="polling-status">
                 <span class="loading-dot"></span>
                 等待机器人处理中... <span class="cancel-verify-text" @click="cancelVerify">(取消)</span>
               </div>
            </div>
          </transition>

          <transition name="slide-down">
            <div v-if="isError" class="error-msg mt-3">{{ errorText }}</div>
          </transition>
          
          <div class="modal-footer">
            <span class="register-link" @click="switchMode('login')">返回登录</span>
            <button 
                class="confirm-btn" 
                :class="{'disabled-btn': verifyStatus !== 'success'}" 
                @click="handleRegisterComplete"
            >
              确认注册
            </button>
          </div>
        </template>

      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from "vue";
import { authApi } from "../api/auth";

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "req-login", data: any): void;
  (e: "req-register", data: any): void;
}>();

const mode = ref<"login" | "register">("login");

// Form Data
const identifier = ref("");
const password = ref("");
const rememberMe = ref(false);
const qqNumber = ref("");
const username = ref("");
const nickname = ref("");

// State
const isError = ref(false);
const errorText = ref("");

// Verification State
const verifyStatus = ref<"idle" | "waiting" | "success" | "error">("idle");
const verifyCode = ref("");
let pollTimer: number | null = null;

const verifyBtnText = computed(() => {
    if (verifyStatus.value === 'success') return '✔ 验证成功';
    if (verifyStatus.value === 'waiting') return '检测中...';
    return '获取验证码';
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      mode.value = "login";
      resetForm();
    } else {
      stopPolling();
    }
  }
);

const resetForm = () => {
    identifier.value = "";
    password.value = "";
    rememberMe.value = false;
    qqNumber.value = "";
    username.value = "";
    nickname.value = "";
    isError.value = false;
    verifyStatus.value = "idle";
    verifyCode.value = "";
    stopPolling();
};

const clearError = () => {
  if (isError.value) {
    isError.value = false;
  }
};

const switchMode = (m: "login" | "register") => {
  mode.value = m;
  isError.value = false;
  if(m === 'login'){
      verifyStatus.value = "idle";
      stopPolling();
  }
};

const onClose = () => {
  emit("update:show", false);
};

// ============ 获取验证码逻辑 ============
const startVerification = async () => {
    const qq = qqNumber.value.trim();
    if (!qq) {
      showExternalError("请先填写左侧您的QQ号");
      return;
    }
    const qqRegex = /^[1-9][0-9]{4,10}$/;
    if (!qqRegex.test(qq)) {
      showExternalError("请输入合法的QQ格式");
      return;
    }

    try {
        isError.value = false;
        verifyStatus.value = "waiting";
        const res = await authApi.apply(qq);
        if (res.data?.ok) {
            verifyCode.value = res.data.code;
            startPolling(qq);
        }
    } catch (e: any) {
        verifyStatus.value = "error";
        showExternalError(e.response?.data?.detail || "获取失败，请重试");
        setTimeout(() => { verifyStatus.value = "idle"; }, 2000);
    }
};

const startPolling = (qq: string) => {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const res = await authApi.checkStatus(qq);
      const data = res.data;
      if (data.status === "success") {
        stopPolling();
        verifyStatus.value = "success";
      } else if (data.status === "expired") {
        stopPolling();
        verifyStatus.value = "idle";
        showExternalError("验证码已过期，请重新点击获取");
      }
    } catch (error) {}
  }, 2500);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const cancelVerify = () => {
    stopPolling();
    verifyStatus.value = "idle";
};

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(`/verify ${verifyCode.value}`);
    alert("验证指令已复制！");
  } catch (err) {}
};

onUnmounted(() => {
    stopPolling();
});

// ============ 提交表单 ============

const handleLoginClick = () => {
  if (!identifier.value.trim() || !password.value.trim()) {
    showExternalError("请填满所有字段");
    return;
  }
  emit("req-login", {
    identifier: identifier.value.trim(),
    password: password.value.trim(),
    remember_me: rememberMe.value,
  });
};



const handleRegisterComplete = () => {
  if (verifyStatus.value !== "success") {
      showExternalError("请先完成QQ身份验证！");
      return;
  }
  if (!username.value.trim() || !password.value.trim() || !nickname.value.trim()) {
    showExternalError("请将信息填写完整");
    return;
  }
  emit("req-register", {
    qq: Number(qqNumber.value.trim()),
    username: username.value.trim(),
    password: password.value.trim(),
    nickname: nickname.value.trim(),
  });
};

const showExternalError = (msg: string) => {
  errorText.value = msg;
  isError.value = true;
};

defineExpose({
  showExternalError
});
</script>

<style scoped>
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
  width: 90%;
  max-width: 420px;
  border-radius: 16px;
  padding: 40px 32px 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  position: relative;
}

.modal-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  color: #999;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #ff4d4f;
  color: #fff;
  transform: scale(1.1);
}

.modal-title {
  margin: 0 0 28px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  text-align: center;
}

.modal-input {
  width: 100%;
  box-sizing: border-box;
  padding: 14px 18px;
  font-size: 1rem;
  color: #333;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  outline: none;
  transition: all 0.3s ease;
}

.modal-input.mt-3 {
  margin-top: 16px;
}

.modal-input:focus {
  background: #fff;
  border-color: #ff8c00;
  box-shadow: 0 0 0 3px rgba(255, 140, 0, 0.1);
}

.modal-input::placeholder {
  color: #aaa;
}

/* QQ 验证特供区域 */
.remember-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  margin-left: 2px;
  color: #666;
  font-size: 0.92rem;
  user-select: none;
}

.remember-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #ff8c00;
  cursor: pointer;
}

.qq-verify-group {
    display: flex;
    gap: 10px;
}
.qq-input {
    flex: 1;
}
.verify-btn {
    white-space: nowrap;
    padding: 0 18px;
    border-radius: 10px;
    border: none;
    background: #ff8c00;
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 110px;
}
.verify-btn:hover:not(:disabled) {
    background: #ffa73b;
}

/* 等待状态 */
.verify-btn.is-waiting {
    background: #d9d9d9;
    color: #666;
    cursor: wait;
}

/* 成功状态 */
.verify-btn.is-success {
    background: #52c41a;
    color: white;
    cursor: not-allowed;
}

.inline-verify-area {
    margin-top: 16px;
    background: #f4f6f8;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px dashed #ff8c00;
    font-size: 0.9rem;
    color: #555;
}

.verify-instructions {
    margin-bottom: 8px;
}

.code-copy-text {
    cursor: pointer;
    background: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    color: #ff8c00;
    font-size: 1.05rem;
    border: 1px solid #ffa73b;
    margin-left: 6px;
    transition: all 0.2s;
}

.code-copy-text:hover {
    background: #fff2e8;
}

.polling-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  font-weight: 500;
}

.loading-dot {
  width: 6px;
  height: 6px;
  background-color: #1890ff;
  border-radius: 50%;
  animation: blink 1s infinite alternate;
}

.cancel-verify-text {
    margin-left: auto;
    color: #999;
    cursor: pointer;
    text-decoration: underline;
}

@keyframes blink {
  0% { opacity: 0.3; }
  100% { opacity: 1; }
}


.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 28px;
}

.modal-input.is-error {
  border-color: #ff4d4f;
  background-color: #fff2f0;
  box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.15);
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  50% { transform: translateX(6px); }
  75% { transform: translateX(-6px); }
}

.confirm-btn {
  background: #ff8c00;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 600;
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.confirm-btn:hover:not(.disabled-btn) {
  background: #ff9d2e;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);
}

.confirm-btn.disabled-btn {
    background: #d9d9d9;
    color: #a3a3a3;
    pointer-events: none;
}

.confirm-btn:active:not(.disabled-btn) {
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
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.error-msg {
  color: #ff4d4f;
  font-size: 0.85rem;
  margin-top: 8px;
  margin-left: 4px;
  line-height: 1.2;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.register-link {
  color: #1890ff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}
</style>
