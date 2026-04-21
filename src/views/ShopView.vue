<template>
  <main class="content-area">
    <section class="page-header">
      <div class="header-copy">
        <h2>商店</h2>
        <p class="subtitle">用积分兑换心仪的物品</p>
        <div class="credit-pill" v-if="shopData">
          <span class="credit-label">当前积分</span>
          <span class="credit-value">{{ shopData.credits }}</span>
        </div>
      </div>
    </section>

    <section v-if="isLoading" class="shop-grid">
      <article v-for="i in 1" :key="i" class="product-card skeleton-card">
        <div class="product-image skeleton-block"></div>
        <div class="skeleton-line title"></div>
        <div class="skeleton-line price"></div>
        <div class="skeleton-button"></div>
      </article>
    </section>

    <section v-else-if="shopData" class="shop-grid">
      <article
        v-for="item in shopData.items"
        :key="item.id"
        class="product-card"
        :class="{ disabled: !item.can_purchase && !item.purchased }"
        @click="openItemDetail(item)"
      >
        <div class="product-image-wrap">
          <img
            v-if="!imageErrors[item.id]"
            class="product-image"
            :src="item.image"
            :alt="item.name"
            @error="markImageError(item.id)"
          />
          <div v-else class="product-image placeholder">
            <span>{{ item.name }}</span>
          </div>
          <span v-if="item.purchased" class="status-badge purchased">已购买</span>
        </div>

        <div class="product-body">
          <h3>{{ item.name }}</h3>
          <p class="product-summary">{{ item.summary }}</p>
          <div class="price-row">
            <span class="price">{{ item.price }} 积分</span>
            <span class="status-text">{{ item.status_text }}</span>
          </div>
          <button
            class="buy-btn"
            :class="{ purchased: item.purchased }"
            :disabled="!item.can_purchase"
            @click.stop="handlePurchase(item)"
          >
            {{ item.purchased ? "已购买" : "购买" }}
          </button>
        </div>
      </article>
    </section>

    <section v-else class="empty-state">
      商店数据加载失败，请稍后再试。
    </section>

    <transition name="fade">
      <div v-if="selectedItem" class="modal-overlay" @click="closeItemDetail">
        <div class="detail-modal" @click.stop>
          <button class="close-btn" @click="closeItemDetail">×</button>

          <div class="detail-media">
            <img
              v-if="!imageErrors[selectedItem.id]"
              class="detail-image"
              :src="selectedItem.image"
              :alt="selectedItem.name"
              @error="markImageError(selectedItem.id)"
            />
            <div v-else class="detail-image placeholder">
              <span>{{ selectedItem.name }}</span>
            </div>
          </div>

          <div class="detail-content">
            <div class="detail-head">
              <div>
                <h3>{{ selectedItem.name }}</h3>
                <p class="detail-summary">{{ selectedItem.summary }}</p>
              </div>
              <span v-if="selectedItem.purchased" class="status-badge purchased">已购买</span>
            </div>

            <div class="detail-block">
              <span class="detail-label">商品说明</span>
              <p>{{ selectedItem.description }}</p>
            </div>

            <div class="detail-block">
              <span class="detail-label">购买条件</span>
              <p>{{ selectedItem.purchase_condition }}</p>
            </div>

            <div class="detail-footer">
              <div>
                <span class="detail-label">价格</span>
                <div class="detail-price">{{ selectedItem.price }} 积分</div>
              </div>
              <button
                class="buy-btn detail-buy-btn"
                :class="{ purchased: selectedItem.purchased }"
                :disabled="!selectedItem.can_purchase"
                @click="handlePurchase(selectedItem)"
              >
                {{ selectedItem.purchased ? "已购买" : "购买" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import Swal from "sweetalert2";
import http from "@/utils/http";
import { useAuthStore } from "@/stores/auth";

interface ShopItem {
  id: string;
  name: string;
  price: number;
  image: string;
  summary: string;
  description: string;
  purchase_condition: string;
  purchased: boolean;
  can_purchase: boolean;
  status_text: string;
}

interface ShopData {
  credits: number;
  role: string;
  items: ShopItem[];
}

const authStore = useAuthStore();
const isLoading = ref(true);
const isPurchasing = ref(false);
const shopData = ref<ShopData | null>(null);
const selectedItem = ref<ShopItem | null>(null);
const imageErrors = ref<Record<string, boolean>>({});

const fetchShopData = async () => {
  isLoading.value = true;
  try {
    const res = await http.get("/shop/items");
    if (res.data?.ok) {
      const nextShopData = res.data.data as ShopData;
      shopData.value = nextShopData;
      if (selectedItem.value) {
        selectedItem.value =
          nextShopData.items.find((item) => item.id === selectedItem.value?.id) || null;
      }
    }
  } finally {
    isLoading.value = false;
  }
};

const markImageError = (itemId: string) => {
  imageErrors.value = {
    ...imageErrors.value,
    [itemId]: true,
  };
};

const openItemDetail = (item: ShopItem) => {
  selectedItem.value = item;
};

const closeItemDetail = () => {
  selectedItem.value = null;
};

const handlePurchase = async (item: ShopItem) => {
  if (!item.can_purchase || isPurchasing.value) {
    return;
  }

  const result = await Swal.fire({
    title: `确认购买 ${item.name}？`,
    text: `将消耗 ${item.price} 积分，购买后会立即生效。`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "确认购买",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
    confirmButtonColor: "var(--primary-color)",
  });

  if (!result.isConfirmed) {
    return;
  }

  isPurchasing.value = true;
  try {
    const res = await http.post(`/shop/purchase/${item.id}`);
    if (res.data?.ok) {
      await authStore.refreshStatus();
      await fetchShopData();
      await Swal.fire({
        icon: "success",
        title: "购买成功",
        text: "购买成功，刷新网页后或许可以发现新的功能！",
        background: "var(--surface-color)",
        color: "var(--text-main)",
        confirmButtonColor: "var(--primary-color)",
      });
      return;
    }
    throw new Error(res.data?.message || "购买失败");
  } catch (error: any) {
    await Swal.fire({
      icon: "error",
      title: "购买失败",
      text: error?.response?.data?.detail || error?.message || "请稍后再试",
      background: "var(--surface-color)",
      color: "var(--text-main)",
      confirmButtonColor: "var(--primary-color)",
    });
  } finally {
    isPurchasing.value = false;
  }
};

onMounted(() => {
  fetchShopData();
});
</script>

<style scoped>
.content-area {
  flex: 1;
  padding: 0 40px 40px 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  min-width: 0;
}

.page-header {
  display: block;
  padding: 28px 30px;
  border-radius: 28px;
  border: 1px solid rgba(249, 115, 22, 0.14);
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 24%),
    radial-gradient(circle at left center, rgba(251, 191, 36, 0.12), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 247, 237, 0.96));
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.header-copy {
  max-width: 420px;
}

.page-header h2 {
  margin: 0;
  font-size: 1.9rem;
  color: var(--text-main);
}

.subtitle {
  margin: 8px 0 0 0;
  color: var(--text-muted);
}

.credit-pill {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  min-height: 52px;
  margin-top: 18px;
  padding: 0 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(249, 115, 22, 0.14);
}

.credit-label {
  display: inline-block;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.credit-value {
  display: inline-block;
  font-size: 1.45rem;
  font-weight: 900;
  color: #ea580c;
  line-height: 1;
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 260px));
  gap: 20px;
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
  transition:
    transform 0.24s ease,
    box-shadow 0.24s ease,
    border-color 0.24s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(249, 115, 22, 0.22);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
}

.product-card.disabled {
  opacity: 0.92;
}

.product-image-wrap {
  position: relative;
}

.product-image,
.detail-image {
  width: 100%;
  aspect-ratio: 1 / 0.82;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(135deg, rgba(255, 248, 235, 0.96), rgba(255, 237, 213, 0.72));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9a3412;
  font-size: 1.1rem;
  font-weight: 800;
  object-fit: cover;
}

.placeholder {
  padding: 24px;
  text-align: center;
}

.status-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-badge.purchased {
  background: rgba(22, 163, 74, 0.16);
  color: #15803d;
}

.product-body h3,
.detail-head h3 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-main);
}

.product-summary,
.detail-summary,
.detail-block p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.7;
}

.product-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-body h3 {
  font-size: 1.12rem;
}

.product-summary {
  font-size: 0.92rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.price,
.detail-price {
  font-size: 1.12rem;
  font-weight: 900;
  color: #ea580c;
}

.status-text {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.buy-btn {
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24);
}

.buy-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.buy-btn:disabled {
  cursor: not-allowed;
  opacity: 0.56;
  box-shadow: none;
}

.buy-btn.purchased {
  background: linear-gradient(135deg, #16a34a, #22c55e);
}

.empty-state {
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface-color);
  border: 1px solid var(--border-color);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(8px);
}

.detail-modal {
  position: relative;
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
  gap: 24px;
  padding: 24px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.97));
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.detail-block {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.detail-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-muted);
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-top: auto;
}

.detail-buy-btn {
  max-width: 220px;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.08);
  color: var(--text-main);
  font-size: 1.5rem;
  cursor: pointer;
}

.skeleton-card {
  pointer-events: none;
}

.skeleton-block,
.skeleton-line,
.skeleton-button {
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.72), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.72));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

.skeleton-block {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
}

.skeleton-line {
  height: 18px;
  border-radius: 999px;
}

.skeleton-line.title {
  width: 58%;
}

.skeleton-line.price {
  width: 42%;
}

.skeleton-button {
  height: 50px;
  border-radius: 16px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

[data-theme="dark"] .page-header {
  border-color: rgba(251, 146, 60, 0.18);
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.2), transparent 24%),
    radial-gradient(circle at left center, rgba(245, 158, 11, 0.14), transparent 28%),
    linear-gradient(135deg, rgba(20, 28, 43, 0.98), rgba(15, 23, 42, 0.98));
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
}

[data-theme="dark"] .credit-pill,
[data-theme="dark"] .product-card,
[data-theme="dark"] .detail-modal,
[data-theme="dark"] .detail-block,
[data-theme="dark"] .empty-state {
  background: linear-gradient(180deg, rgba(21, 29, 45, 0.98), rgba(17, 24, 39, 0.96));
  border-color: rgba(71, 85, 105, 0.42);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.24);
}

[data-theme="dark"] .product-image,
[data-theme="dark"] .detail-image {
  border-color: rgba(71, 85, 105, 0.42);
  background: linear-gradient(135deg, rgba(67, 31, 13, 0.82), rgba(120, 53, 15, 0.48));
  color: #fed7aa;
}

[data-theme="dark"] .status-badge.purchased {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

[data-theme="dark"] .price,
[data-theme="dark"] .detail-price,
[data-theme="dark"] .credit-value {
  color: #fb923c;
}

[data-theme="dark"] .close-btn {
  background: rgba(148, 163, 184, 0.12);
}

[data-theme="dark"] .skeleton-block,
[data-theme="dark"] .skeleton-line,
[data-theme="dark"] .skeleton-button {
  background: linear-gradient(90deg, rgba(30, 41, 59, 0.76), rgba(51, 65, 85, 0.96), rgba(30, 41, 59, 0.76));
  background-size: 200% 100%;
}

@media (max-width: 900px) {
  .content-area {
    padding: 0 20px 24px 20px;
  }

  .page-header {
    padding: 24px 20px;
  }

  .credit-pill {
    width: 100%;
    justify-content: space-between;
  }

  .detail-modal {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .shop-grid {
    grid-template-columns: 1fr;
  }

  .detail-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-buy-btn {
    max-width: none;
  }
}
</style>
