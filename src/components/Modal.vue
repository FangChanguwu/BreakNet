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
          
          <!-- QQ 邮箱验证区域 -->
          <div class="qq-verify-group mt-3">
            <input
              v-model="emailAddress"
              type="email"
              class="modal-input qq-input"
              placeholder="输入用于验证的 QQ 邮箱"
              :disabled="isVerifyBusy || verifyStatus === 'success'"
              @input="handleEmailInput"
            />
            <button 
                class="verify-btn" 
                :class="{ 'is-waiting': isVerifyBusy, 'is-success': verifyStatus === 'success' }"
                :disabled="isVerifyBusy"
                @click="sendEmailCode"
            >
              {{ verifyBtnText }}
            </button>
          </div>

          <transition name="slide-down">
            <div v-if="showCodeInput" class="inline-verify-area">
               <div class="verify-instructions">
                 验证码已发送，请输入邮箱中收到的 6 位验证码
               </div>
               <div class="qq-verify-group mt-3">
                 <input
                   v-model="emailCode"
                   type="text"
                   class="modal-input qq-input"
                   maxlength="6"
                   placeholder="输入 6 位验证码"
                   :disabled="verifyStatus === 'verifying' || verifyStatus === 'success'"
                   @input="clearError"
                 />
                 <button
                   class="verify-btn secondary"
                   :class="{ 'is-waiting': verifyStatus === 'verifying', 'is-success': verifyStatus === 'success' }"
                   :disabled="verifyStatus === 'verifying' || verifyStatus === 'success'"
                   @click="confirmEmailCode"
                 >
                   {{ verifyCodeBtnText }}
                 </button>
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
import { computed, ref, watch } from "vue";
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

const identifier = ref("");
const password = ref("");
const rememberMe = ref(false);
const username = ref("");
const nickname = ref("");
const emailAddress = ref("");
const emailCode = ref("");
const verificationEmail = ref("");

const isError = ref(false);
const errorText = ref("");
const verifyStatus = ref<
  "idle" | "sending" | "code-sent" | "verifying" | "success" | "error"
>("idle");

const isVerifyBusy = computed(
  () => verifyStatus.value === "sending" || verifyStatus.value === "verifying"
);
const showCodeInput = computed(
  () =>
    verifyStatus.value === "code-sent" ||
    verifyStatus.value === "verifying" ||
    verifyStatus.value === "success"
);
const verifyBtnText = computed(() => {
  if (verifyStatus.value === "sending") return "发送中...";
  if (verifyStatus.value === "success") return "✔ 已验证";
  if (verifyStatus.value === "code-sent" || verifyStatus.value === "verifying") {
    return "重新发送";
  }
  return "发送验证码";
});
const verifyCodeBtnText = computed(() => {
  if (verifyStatus.value === "verifying") return "验证中...";
  if (verifyStatus.value === "success") return "✔ 已通过";
  return "确认验证码";
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      mode.value = "login";
      resetForm();
    }
  }
);

const resetVerificationState = () => {
  verifyStatus.value = "idle";
  verificationEmail.value = "";
  emailCode.value = "";
};

const resetForm = () => {
  identifier.value = "";
  password.value = "";
  rememberMe.value = false;
  username.value = "";
  nickname.value = "";
  emailAddress.value = "";
  emailCode.value = "";
  verificationEmail.value = "";
  isError.value = false;
  verifyStatus.value = "idle";
};

const clearError = () => {
  if (isError.value) {
    isError.value = false;
  }
};

const handleEmailInput = () => {
  clearError();
  const normalized = emailAddress.value.trim().toLowerCase();
  if (verificationEmail.value && normalized !== verificationEmail.value) {
    resetVerificationState();
  }
};

const switchMode = (m: "login" | "register") => {
  mode.value = m;
  isError.value = false;
  if (m === "login") {
    resetVerificationState();
  }
};

const onClose = () => {
  emit("update:show", false);
};

const sendEmailCode = async () => {
  const email = emailAddress.value.trim().toLowerCase();
  const qqEmailRegex = /^[1-9][0-9]{4,10}@qq\.com$/i;

  if (!email) {
    showExternalError("请先输入用于验证的 QQ 邮箱");
    return;
  }
  if (!qqEmailRegex.test(email)) {
    showExternalError("请输入正确的 QQ 邮箱地址");
    return;
  }

  try {
    clearError();
    verifyStatus.value = "sending";
    await authApi.sendEmailCode(email);
    verificationEmail.value = email;
    emailCode.value = "";
    verifyStatus.value = "code-sent";
  } catch (error: any) {
    verifyStatus.value = "error";
    showExternalError(error.response?.data?.detail || "验证码发送失败，请稍后重试");
    verifyStatus.value = "idle";
  }
};

const confirmEmailCode = async () => {
  const email = verificationEmail.value || emailAddress.value.trim().toLowerCase();
  const code = emailCode.value.trim();

  if (!email) {
    showExternalError("请先发送邮箱验证码");
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    showExternalError("请输入 6 位数字验证码");
    return;
  }

  try {
    clearError();
    verifyStatus.value = "verifying";
    await authApi.verifyEmailCode(email, code);
    verifyStatus.value = "success";
    emailAddress.value = email;
  } catch (error: any) {
    verifyStatus.value = "code-sent";
    showExternalError(error.response?.data?.detail || "验证码校验失败，请重试");
  }
};

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
    showExternalError("请先完成 QQ 邮箱验证");
    return;
  }
  if (
    !username.value.trim() ||
    !password.value.trim() ||
    !nickname.value.trim() ||
    !emailAddress.value.trim()
  ) {
    showExternalError("请将信息填写完整");
    return;
  }
  emit("req-register", {
    email: emailAddress.value.trim().toLowerCase(),
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
  showExternalError,
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

.verify-btn.secondary {
    background: #1890ff;
}

.verify-btn.secondary:hover:not(:disabled) {
    background: #40a9ff;
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
