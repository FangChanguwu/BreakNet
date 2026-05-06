<template>
  <div class="col-card sponsor-card" :class="{ 'modal-open': showModal }">
    <div class="card-header">
      <h3>💖 赞助与支持</h3>
    </div>

    <div class="sponsor-content">
      <div class="qr-wrapper" @click="openSponsorModal">
        <img src="@/assets/pic/sponsor.png" alt="赞助作者" class="qr-code" />
        <div class="hover-mask">
          <span>🔍 点击放大</span>
        </div>
      </div>

      <div class="text-content">
        <h4 class="title">请作者打把舞萌 🧤</h4>
        <p class="desc">
          BreakNet
          的开发与服务器日常维护都离不开您的支持。如果您觉得这个项目对您有帮助，欢迎随缘赞助！
        </p>
        <p class="thanks-text">感谢您的认可与支持 ~</p>
      </div>
    </div>

    <div class="sponsor-users">
      <p class="sponsor-users-title">感谢以下用户对Break的支持：</p>
      <div class="sponsor-avatar-row">
        <img
          v-for="sponsor in sponsors"
          :key="sponsor.qq"
          :src="sponsor.avatar"
          :alt="`赞助者 ${sponsor.qq}`"
          class="sponsor-avatar"
          loading="lazy"
          referrerpolicy="no-referrer"
        />
        <button
          v-if="isSuperAdmin"
          class="sponsor-add-avatar"
          type="button"
          title="添加赞助者"
          aria-label="添加赞助者"
          @click="openAddSponsorModal"
        >
          +
        </button>
      </div>
    </div>

    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="showModal" class="modal-overlay" @click="closeSponsorModal">
          <div class="modal-content" @click.stop>
            <button class="close-btn" type="button" @click="closeSponsorModal">✕</button>
            <img
              src="@/assets/pic/sponsor.png"
              alt="赞助收款码放大版"
              class="large-qr"
            />
            <p class="modal-tip">扫一扫，或截图保存</p>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/auth";
import { sponsorApi } from "@/api/sponsor";
import type { SponsorUser } from "@/api/sponsor";

const sponsorStorageKey = "breaknet_sponsor_users";
const qqPattern = /^[1-9]\d{4,11}$/;

// 控制弹窗显示的响应式变量
const showModal = ref(false);
const authStore = useAuthStore();
const isSuperAdmin = computed(() => authStore.role === "superadmin");

const openSponsorModal = () => {
  showModal.value = true;
};

const closeSponsorModal = () => {
  showModal.value = false;
};

const getQqAvatar = (qq: string) => `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=100`;

const readLocalSponsors = (): SponsorUser[] => {
  try {
    const raw = localStorage.getItem(sponsorStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item?.qq || "").trim())
      .filter((qq) => qqPattern.test(qq))
      .map((qq) => ({ qq, avatar: getQqAvatar(qq) }));
  } catch {
    return [];
  }
};

const sponsors = ref<SponsorUser[]>(readLocalSponsors());
const sponsorApiReady = ref(true);

const saveSponsors = () => {
  localStorage.setItem(
    sponsorStorageKey,
    JSON.stringify(sponsors.value.map((sponsor) => ({ qq: sponsor.qq }))),
  );
};

const normalizeSponsors = (items: SponsorUser[]) =>
  items
    .filter((item) => qqPattern.test(String(item.qq || "")))
    .map((item) => ({
      qq: String(item.qq),
      avatar: item.avatar || getQqAvatar(String(item.qq)),
    }));

const addSponsorLocally = (qq: string) => {
  if (sponsors.value.some((sponsor) => sponsor.qq === qq)) return;
  sponsors.value = [...sponsors.value, { qq, avatar: getQqAvatar(qq) }];
  saveSponsors();
};

const fetchSponsors = async () => {
  try {
    const res = await sponsorApi.getSponsors();
    const list = res.data?.data?.sponsors;
    if (res.data?.returnCode === 0 && Array.isArray(list)) {
      sponsors.value = normalizeSponsors(list);
      saveSponsors();
      sponsorApiReady.value = true;
      return;
    }
    sponsorApiReady.value = false;
  } catch {
    sponsorApiReady.value = false;
  }
};

const openAddSponsorModal = async () => {
  const result = await Swal.fire({
    title: "添加赞助者",
    input: "text",
    inputLabel: "QQ号",
    inputPlaceholder: "请输入赞助者 QQ 号",
    showCancelButton: true,
    confirmButtonText: "添加",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "#ff8c00",
    inputValidator: (value) => {
      const qq = value.trim();
      if (!qq) return "请输入 QQ 号";
      if (!qqPattern.test(qq)) return "QQ 号格式不正确";
      if (sponsors.value.some((sponsor) => sponsor.qq === qq)) return "这个赞助者已经添加过了";
      return null;
    },
  });

  const qq = typeof result.value === "string" ? result.value.trim() : "";
  if (!result.isConfirmed || !qq) return;
  if (sponsorApiReady.value) {
    try {
      const res = await sponsorApi.addSponsor(qq);
      if (res.data?.returnCode === 0) {
        await fetchSponsors();
      } else {
        throw new Error(res.data?.message || "添加赞助者失败");
      }
    } catch (error) {
      sponsorApiReady.value = false;
      addSponsorLocally(qq);
      console.error("添加赞助者接口不可用，已临时保存到本地：", error);
    }
  } else {
    addSponsorLocally(qq);
  }
  await Swal.fire({
    icon: "success",
    title: sponsorApiReady.value ? "已添加赞助者" : "已临时添加到本地",
    timer: 1200,
    showConfirmButton: false,
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
};

onMounted(() => {
  fetchSponsors();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}
.col-card {
  background: var(--surface-color);
  border-radius: 16px;
  padding: 28px;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 15px var(--shadow-color);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  box-sizing: border-box;
}

.col-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px var(--shadow-color);
  border-color: #ff8c00;
}

.col-card.modal-open,
.col-card.modal-open:hover {
  transform: none;
}

.sponsor-content {
  display: flex;
  gap: 30px;
  align-items: center;
}

.qr-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 180px;
  height: 180px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed var(--primary-color);
  padding: 6px;
  background: var(--bg-color);
  transition:
    transform 0.3s ease,
    border-color 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
  margin: 6px;
}

.hover-mask span {
  color: #fff;
  font-weight: bold;
  font-size: 0.95rem;
  pointer-events: none;
}

.qr-wrapper:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(255, 140, 0, 0.15);
  border-style: solid;
}

.qr-wrapper:hover .hover-mask {
  opacity: 1;
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
  user-select: none;
  -webkit-user-drag: none;
}

.text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title {
  margin: 0 0 12px 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.desc {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.thanks-text {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary-color);
}

.sponsor-users {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.sponsor-users-title {
  margin: 0 0 14px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
}

.sponsor-avatar-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.sponsor-avatar,
.sponsor-add-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.sponsor-avatar {
  display: block;
  object-fit: cover;
  border: 2px solid rgba(255, 140, 0, 0.24);
  background: var(--bg-color);
  box-shadow: 0 4px 10px rgba(255, 140, 0, 0.12);
}

.sponsor-add-avatar {
  border: 1px dashed var(--border-color);
  background: color-mix(in srgb, var(--text-muted) 14%, transparent);
  color: var(--text-muted);
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.sponsor-add-avatar:hover {
  transform: translateY(-2px);
  border-color: #ff8c00;
  color: #ff8c00;
  background: rgba(255, 140, 0, 0.12);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

.modal-content {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  max-width: min(430px, 100%);
}

.large-qr {
  width: min(350px, calc(100vw - 96px));
  height: min(350px, calc(100vw - 96px));
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 16px;
  user-select: none;

  -webkit-touch-callout: default;
}

.modal-tip {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
  font-weight: bold;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f0f0f0;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #ff4d4f;
  color: #fff;
  transform: rotate(90deg);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .qr-wrapper {
    width: 150px;
    height: 150px;
  }
  .large-qr {
    width: 250px;
    height: 250px;
  }
}

@media (max-width: 600px) {
  .sponsor-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  .qr-wrapper {
    width: 160px;
    height: 160px;
  }
  .sponsor-users {
    text-align: left;
  }
  .sponsor-avatar-row {
    justify-content: center;
  }
}
</style>
