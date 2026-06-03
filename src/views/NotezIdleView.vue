<template>
  <main class="notez-idle-page">
    <header class="idle-hud">
      <div class="brand-block">
        <h1>Notez</h1>
      </div>

      <div class="resource-strip">
        <span>Notez</span>
        <strong>{{ formatWholeNumber(gameState.notez) }}</strong>
        <small>{{ formatNumber(gameState.totalNPS) }} NPS</small>
        <small>点击 +{{ formatNumber(gameState.clickValue) }}</small>
      </div>
    </header>

    <section class="game-board">
      <div class="left-stage">
        <section class="center-stage" aria-label="Notez main stage">
          <div class="stage-rings" aria-hidden="true"></div>

          <button
            ref="mainButtonRef"
            class="main-note-button"
            type="button"
            :class="{ 'is-pressed': isButtonPressed }"
            @pointerdown="handlePointerDown"
            @pointerup="releaseButton"
            @pointerleave="releaseButton"
            @pointercancel="releaseButton"
          >
            <span v-if="!buttonImageFailed" class="button-image-stack" aria-hidden="true">
              <img
                class="button-state-image unpressed"
                :src="BUTTON_UNPRESSED"
                alt=""
                draggable="false"
                @error="buttonImageFailed = true"
              />
              <img
                class="button-state-image pressed"
                :src="BUTTON_PRESSED"
                alt=""
                draggable="false"
                @error="buttonImageFailed = true"
              />
            </span>
            <span v-else class="button-fallback">NOTEZ</span>
          </button>
        </section>

        <section class="progress-summary" aria-label="Game progress">
          <div>
            <span>曲目熟练度</span>
            <strong>{{ totalSongLevel }}</strong>
          </div>
          <div>
            <span>伙伴等级</span>
            <strong>{{ totalPartnerLevel }}</strong>
          </div>
          <div>
            <span>商店物品</span>
            <strong>{{ purchasedShopCount }}/{{ shopItems.length }}</strong>
          </div>
        </section>
      </div>

      <section class="right-panel">
        <nav class="dock-tabs" aria-label="Game panels">
          <button
            type="button"
            :class="{ active: activeTab === 'songs' }"
            @click="activeTab = 'songs'"
          >
            打歌
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'partners' }"
            @click="activeTab = 'partners'"
          >
            旅行伙伴
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'shop' }"
            @click="activeTab = 'shop'"
          >
            商店
          </button>
          <button
            type="button"
            :class="{ active: activeTab === 'settings' }"
            @click="activeTab = 'settings'"
          >
            设置
          </button>
        </nav>

        <div v-if="activeTab === 'songs' || activeTab === 'partners'" class="upgrade-mode-bar">
          <span>升级倍率</span>
          <div class="upgrade-mode-toggle" role="group" aria-label="升级倍率">
            <button
              v-for="mode in upgradeModes"
              :key="String(mode)"
              type="button"
              :class="{ active: upgradeMode === mode }"
              @click="upgradeMode = mode"
            >
              {{ upgradeModeLabel(mode) }}
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'songs'" class="song-list">
          <article
            v-for="(song, songIndex) in visibleSongs"
            :key="song.id"
            class="song-card"
            :class="{ locked: !song.isUnlocked }"
            :style="songCardStyle(song)"
          >
            <div class="song-card-shade">
              <div class="item-main">
                <div class="item-title-row">
                  <strong>{{ song.name }}</strong>
                  <span :class="['difficulty-pill', difficultyClass(song.difficulty)]">
                    {{ difficultyName(song.difficulty) }}
                  </span>
                </div>
                <p class="item-description">{{ song.description }}</p>
                <div class="item-meta">
                  <span>Lv.{{ song.level }}</span>
                  <span>{{ formatNumber(songNPS(song)) }} NPS</span>
                  <span>下次晋级 {{ nextDifficultyRemain(song) }} Lv</span>
                </div>
                <div class="progress-line">
                  <span :style="{ width: `${nextDifficultyProgress(song)}%` }"></span>
                </div>
              </div>

              <button
                :ref="(el) => setSongUpgradeButtonRef(el, songIndex)"
                class="upgrade-btn"
                type="button"
                :disabled="songUpgradeCount(song) <= 0"
                @click="upgradeSong(song.id)"
              >
                <span>{{ songUpgradeLabel(song) }}</span>
                <strong>{{ formatNumber(songUpgradeCost(song)) }}</strong>
              </button>
            </div>
          </article>
        </div>

        <div v-else-if="activeTab === 'partners'" class="tech-panel">
          <section class="tech-section">
            <div class="tech-list">
              <article v-for="partner in visiblePartners" :key="partner.id" class="tech-row">
                <div class="tech-art partner">
                  <img
                    v-if="!failedImages.has(partnerPath(partner))"
                    :src="partnerPath(partner)"
                    :alt="partner.name"
                    draggable="false"
                    @error="markImageFailed(partnerPath(partner))"
                  />
                  <span v-else>PARTNER</span>
                </div>

                <div class="item-main">
                  <div class="item-title-row">
                    <strong>{{ partner.name }}</strong>
                  </div>
                  <p class="item-description">{{ partner.description }}</p>
                  <div class="item-meta">
                    <span>Lv.{{ partner.level }}/{{ partner.maxLevel }}</span>
                    <span>{{ formatNumber(partnerNPS(partner)) }} NPS</span>
                  </div>
                </div>

                <button
                  class="upgrade-btn"
                  type="button"
                  :disabled="partnerUpgradeCount(partner) <= 0"
                  @click="upgradePartner(partner.id)"
                >
                  <span>{{ partnerUpgradeLabel(partner) }}</span>
                  <strong>{{ partner.level >= partner.maxLevel ? "MAX" : formatNumber(partnerUpgradeCost(partner)) }}</strong>
                </button>
              </article>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'shop'" class="tech-panel">
          <section class="tech-section">
            <div class="tech-list">
              <article v-for="item in sortedVisibleShopItems" :key="item.id" class="tech-row shop-row">
                <div class="item-main">
                  <div class="item-title-row">
                    <strong>{{ item.name }}</strong>
                  </div>
                  <p class="item-description">{{ item.description }}</p>
                  <div class="item-meta">
                    <span>{{ shopEffectText(item) }}</span>
                    <span v-if="item.isPurchased">已购买</span>
                  </div>
                </div>

                <button
                  class="upgrade-btn"
                  type="button"
                  :disabled="item.isPurchased || !canAfford(item.cost)"
                  @click="buyShopItem(item.id)"
                >
                  <span>{{ item.isPurchased ? "已购买" : "购买" }}</span>
                  <strong>{{ item.isPurchased ? "DONE" : formatNumber(item.cost) }}</strong>
                </button>
              </article>
            </div>
          </section>
        </div>

        <div v-else class="settings-panel">
          <section class="tech-section">
            <div class="settings-field">
              <span class="settings-title">数字显示方式</span>
              <div class="format-toggle" role="group" aria-label="数字显示方式">
                <button
                  type="button"
                  :class="{ active: numberFormatMode === 'metric' }"
                  @click="numberFormatMode = 'metric'"
                >
                  公制
                </button>
                <button
                  type="button"
                  :class="{ active: numberFormatMode === 'scientific' }"
                  @click="numberFormatMode = 'scientific'"
                >
                  科学计数法
                </button>
              </div>
            </div>

            <div class="settings-field">
              <span class="settings-title">管理存档</span>
              <div class="settings-actions">
                <button class="cloud-btn" type="button" :disabled="isCloudSaveBusy" @click="uploadCloudSave">
                  {{ isCloudSaveBusy ? "同步中" : "上传云存档" }}
                </button>
                <button class="cloud-btn" type="button" :disabled="isCloudSaveBusy" @click="downloadCloudSave">
                  {{ isCloudSaveBusy ? "同步中" : "下载云存档" }}
                </button>
              </div>

              <button class="danger-btn" type="button" @click="resetGameData">
                清空数据
              </button>
            </div>
          </section>
        </div>
      </section>
    </section>

    <span
      v-for="floatText in floatingTexts"
      :key="floatText.id"
      class="click-float-text"
      :style="{ left: `${floatText.x}px`, top: `${floatText.y}px` }"
    >
      +{{ floatText.value }}
    </span>

    <div v-if="tutorialStep" class="tutorial-layer" :class="{ plain: tutorialStep === 'demo' }" aria-live="polite">
      <div class="tutorial-dim"></div>
      <div
        v-if="tutorialHighlightStyle"
        class="tutorial-highlight"
        :style="tutorialHighlightStyle"
      ></div>
      <section
        class="tutorial-popover"
        :class="{ center: tutorialStep === 'demo' }"
        :style="tutorialPopoverStyle"
      >
        <strong>{{ tutorialTitle }}</strong>
        <p>{{ tutorialText }}</p>
        <button
          v-if="tutorialStep === 'demo'"
          type="button"
          @click="completeTutorial"
        >
          继续探索
        </button>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Swal from "sweetalert2";
import http from "@/utils/http";
import {
  NOTEZ_SAVE_VERSION,
  difficultyNames,
  initialPartners,
  initialShopItems,
  initialSongs,
  type GameState,
  type NumberFormatMode,
  type PartnerNode,
  type ShopItem,
  type Song,
  type UpgradeMode,
} from "@/data/notez";
interface SaveData {
  version?: number;
  gameState?: Partial<GameState>;
  songs?: Song[];
  partners?: PartnerNode[];
  shopItems?: ShopItem[];
  techNodes?: PartnerNode[];
  settings?: {
    numberFormatMode?: NumberFormatMode;
    upgradeMode?: UpgradeMode;
  };
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: string;
}

interface NotezCloudSaveResponse {
  saveData?: SaveData;
  updatedAt?: string;
}

interface ApiResult<T> {
  ok?: boolean;
  returnCode?: number;
  message?: string;
  data?: T;
}

type TutorialStep = "click" | "song" | "demo";
type TutorialRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const STORAGE_KEY = "breaknet-notez-idle-v2";
const LEGACY_STORAGE_KEY = "breaknet-notez-idle-v1";
const TUTORIAL_STORAGE_KEY = "breaknet-notez-tutorial-complete-v1";
const BUTTON_UNPRESSED = "/notez/UI_Button_Unpressed.png";
const BUTTON_PRESSED = "/notez/UI_Button_Pressed.png";
const JACKET_CDN_BASE = "https://assets.breakdx.net/maimai/jacket";
const partnerImageFiles: Record<string, [string, string?, string?]> = {
  deluxekuma: ["Deluxekuma.png"],
  milk: ["Milk_1.png", "Milk_2.png", "Milk_3.png"],
  shama: ["Shama_1.png", "Shama_2.png", "Shama_3.png"],
  salt: ["Salt_1.png", "Salt_2.png", "Salt_3.png"],
  chiffon: ["chiffon_1.png", "Chiffon_2.png", "Chiffon_3.png"],
  raz: ["Raz_1.png", "Raz_2.png", "Raz_3.png"],
  otohime: ["Otohime_1.png", "Otohime_2.png", "Otohime_3.png"],
  kurohime: ["Kurohime_1.png", "Kurohime_2.png", "Kurohime_3.png"],
};

type UpgradeTarget = Song | PartnerNode;

const gameState = reactive<GameState>({
  notez: 0,
  clickValue: 1,
  totalNPS: 0,
});
const songs = ref<Song[]>(structuredClone(initialSongs));
const partners = ref<PartnerNode[]>(structuredClone(initialPartners));
const shopItems = ref<ShopItem[]>(structuredClone(initialShopItems));
const activeTab = ref<"songs" | "partners" | "shop" | "settings">("songs");
const isButtonPressed = ref(false);
const buttonImageFailed = ref(false);
const failedImages = ref(new Set<string>());
const floatingTexts = ref<FloatingText[]>([]);
const isCloudSaveBusy = ref(false);
const numberFormatMode = ref<NumberFormatMode>("metric");
const upgradeModes: UpgradeMode[] = [1, 10, 100, "max"];
const upgradeMode = ref<UpgradeMode>(1);
const mainButtonRef = ref<HTMLButtonElement | null>(null);
const firstSongUpgradeButtonRef = ref<HTMLButtonElement | null>(null);
const tutorialStep = ref<TutorialStep | null>(null);
const tutorialRect = ref<TutorialRect | null>(null);
let tickTimer: number | undefined;
let floatTextId = 0;
let lastTickAt = 0;

const totalSongLevel = computed(() => songs.value.reduce((sum, song) => sum + finiteNumber(song.level), 0));
const totalPartnerLevel = computed(() => partners.value.reduce((sum, partner) => sum + finiteNumber(partner.level), 0));
const purchasedShopCount = computed(() => shopItems.value.filter((item) => item.isPurchased).length);
const tutorialTitle = computed(() => {
  if (tutorialStep.value === "click") return "点击按钮";
  if (tutorialStep.value === "song") return "解锁曲目";
  return "Demo 版本";
});
const tutorialText = computed(() => {
  if (tutorialStep.value === "click") return "先点击按键获得 Notez。攒到 15 Notez 后，就能解锁第一首曲目。";
  if (tutorialStep.value === "song") return "曲目会提供自动 Notez 收益。点击这里解锁第一首曲目。";
  return "Notez 当前仍是 demo 版，后面的曲目、伙伴和商店内容就交给你自己探索了。";
});
const tutorialHighlightStyle = computed<Record<string, string> | null>(() => {
  if (!tutorialRect.value || tutorialStep.value === "demo") return null;
  const padding = tutorialStep.value === "click" ? 14 : 8;
  return {
    top: `${tutorialRect.value.top - padding}px`,
    left: `${tutorialRect.value.left - padding}px`,
    width: `${tutorialRect.value.width + padding * 2}px`,
    height: `${tutorialRect.value.height + padding * 2}px`,
  };
});
const tutorialPopoverStyle = computed<Record<string, string>>(() => {
  if (tutorialStep.value === "demo" || !tutorialRect.value) {
    return {} as Record<string, string>;
  }

  const width = 270;
  const gap = 18;
  const rect = tutorialRect.value;
  const viewportWidth = window.innerWidth || 360;
  const viewportHeight = window.innerHeight || 640;
  const left = clampNumber(rect.left + rect.width / 2 - width / 2, 14, Math.max(14, viewportWidth - width - 14));
  const belowTop = rect.top + rect.height + gap;
  const top = belowTop + 150 < viewportHeight ? belowTop : Math.max(14, rect.top - 168);

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
  };
});
const visibleSongs = computed(() => {
  return songs.value.filter((_song, index) => {
    if (index === 0) return true;
    const previousSong = songs.value[index - 1];
    return Boolean(previousSong && previousSong.isUnlocked && previousSong.difficulty >= 2);
  });
});
const visiblePartners = computed(() => {
  return partners.value.filter((partner) => {
    if (!partner.prerequisiteId) return true;
    const prerequisite = partners.value.find((item) => item.id === partner.prerequisiteId);
    return Boolean(prerequisite && prerequisite.level > 0);
  });
});
const visibleShopItems = computed(() => {
  return shopItems.value.filter((item) => {
    if (item.prerequisitePartnerId) {
      const partner = partners.value.find((partnerItem) => partnerItem.id === item.prerequisitePartnerId);
      if (!partner || partner.level <= 0) return false;
    }
    if (item.prerequisiteShopId) {
      const shopItem = shopItems.value.find((candidate) => candidate.id === item.prerequisiteShopId);
      if (!shopItem || !shopItem.isPurchased) return false;
    }
    return true;
  });
});
const sortedVisibleShopItems = computed(() => {
  return [...visibleShopItems.value].sort((left, right) => {
    if (left.isPurchased === right.isPurchased) return 0;
    return left.isPurchased ? 1 : -1;
  });
});

const finiteNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const formatNumber = (value: number): string => {
  const safeValue = finiteNumber(value);
  if (numberFormatMode.value === "scientific") {
    if (safeValue === 0) return "0";
    if (Math.abs(safeValue) < 1000) {
      return safeValue.toFixed(safeValue >= 100 ? 0 : safeValue >= 10 ? 1 : 2);
    }
    return safeValue.toExponential(2).replace("e+", "e");
  }

  if (safeValue < 1000) return safeValue.toFixed(safeValue >= 100 ? 0 : safeValue >= 10 ? 1 : 2);
  return Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatWholeNumber = (value: number): string => {
  return formatNumber(Math.floor(Math.max(0, finiteNumber(value))));
};

const formatJacketId = (id: number): string => {
  return String(Math.max(0, Math.floor(finiteNumber(id)))).padStart(6, "0");
};

const songCostReduction = (): number => {
  return shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "SONG_COST_REDUCTION") return sum;
    return sum + finiteNumber(item.effect.amount);
  }, 0);
};

const songCost = (song: Song): number => {
  return songCostAtLevel(song, song.level);
};

const songCostAtLevel = (song: Song, level: number): number => {
  const reduction = clampNumber(songCostReduction(), 0, 0.75);
  return Math.ceil(finiteNumber(song.baseCost, 1) * Math.pow(1.15, Math.max(0, level)) * (1 - reduction));
};

const songMultiplier = (songId: string): number => {
  return 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "SONG_NPS_MULTIPLIER") {
      return sum;
    }
    if (item.effect.targetId && item.effect.targetId !== songId) {
      return sum;
    }
    return sum + finiteNumber(item.effect.amount);
  }, 0);
};

const songNPS = (song: Song): number => {
  if (!song.isUnlocked || song.level <= 0) return 0;
  const base = finiteNumber(song.baseNPS) * finiteNumber(song.level) * (1 + finiteNumber(song.difficulty) * 0.5);
  return base * songMultiplier(song.id);
};

const partnerCost = (partner: PartnerNode): number => {
  return partnerCostAtLevel(partner, partner.level);
};

const partnerCostAtLevel = (partner: PartnerNode, level: number): number => {
  return Math.ceil(finiteNumber(partner.baseCost, 1) * Math.pow(1.25, Math.max(0, level)));
};

const partnerMultiplier = (partnerId: string): number => {
  return 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "PARTNER_NPS_MULTIPLIER") {
      return sum;
    }
    if (item.effect.targetId && item.effect.targetId !== partnerId) {
      return sum;
    }
    return sum + finiteNumber(item.effect.amount);
  }, 0);
};

const partnerNPS = (partner: PartnerNode): number => {
  if (partner.level <= 0) return 0;
  return finiteNumber(partner.basePartnerNPS) * finiteNumber(partner.level) * partnerMultiplier(partner.id);
};

const clickValueBonus = (): number => {
  return shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "CLICK_VALUE_ADD") return sum;
    return sum + finiteNumber(item.effect.amount);
  }, 0);
};

const clickMultiplier = (): number => {
  return 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "CLICK_MULTIPLIER_ADD") return sum;
    return sum + finiteNumber(item.effect.amount);
  }, 0);
};

const calculateClickValue = (): number => {
  return (1 + clickValueBonus()) * clickMultiplier();
};

const calculateTotalNPS = (): number => {
  const songTotal = songs.value.reduce((sum, song) => sum + songNPS(song), 0);
  const partnerTotal = partners.value.reduce((sum, partner) => sum + partnerNPS(partner), 0);
  const globalMultiplier = 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "GLOBAL_NPS_MULTIPLIER") return sum;
    return sum + finiteNumber(item.effect.amount);
  }, 0);
  return (songTotal + partnerTotal) * globalMultiplier;
};

const syncDerivedState = () => {
  gameState.clickValue = calculateClickValue();
  gameState.totalNPS = calculateTotalNPS();
};

const canAfford = (cost: number): boolean => {
  return gameState.notez >= finiteNumber(cost, Number.POSITIVE_INFINITY);
};

const upgradeModeLabel = (mode: UpgradeMode): string => {
  return mode === "max" ? "xN" : `x${mode}`;
};

const resolveUpgradeLimit = (maxLevel?: number, forceSingle = false): number => {
  if (forceSingle) return 1;
  if (upgradeMode.value !== "max") return upgradeMode.value;
  return Number.isFinite(maxLevel) ? Math.max(0, Math.floor(finiteNumber(maxLevel))) : 10000;
};

const resolveUpgradePlan = (
  target: UpgradeTarget,
  costAtLevel: (level: number) => number,
  maxLevel?: number,
  forceSingle = false,
): { count: number; cost: number } => {
  const currentLevel = Math.max(0, Math.floor(finiteNumber(target.level)));
  const limit = resolveUpgradeLimit(maxLevel, forceSingle);

  let nextLevel = currentLevel;
  let totalCost = 0;
  let count = 0;

  while (count < limit && (!Number.isFinite(maxLevel) || nextLevel < finiteNumber(maxLevel))) {
    const nextCost = costAtLevel(nextLevel);
    if (!Number.isFinite(nextCost)) break;

    totalCost += nextCost;
    nextLevel += 1;
    count += 1;

    // 只有 xN 模式才按“买得起多少”截断
    if (!forceSingle && upgradeMode.value === "max" && totalCost > gameState.notez) {
      totalCost -= nextCost;
      count -= 1;
      break;
    }
  }

  // x1 / x10 / x100：显示完整价格，但买不起时 count 变 0，让按钮灰色
  if ((forceSingle || upgradeMode.value !== "max") && totalCost > gameState.notez) {
    return { count: 0, cost: totalCost };
  }

  return { count, cost: totalCost };
};

const songUpgradePlan = (song: Song) => {
  return resolveUpgradePlan(song, (level) => songCostAtLevel(song, level), undefined, song.level <= 0);
};

const songUpgradeCount = (song: Song): number => songUpgradePlan(song).count;

const songUpgradeCost = (song: Song): number => {
  const plan = songUpgradePlan(song);

  // xN 买不起任何一级时，兜底显示 x1 的价格
  if ((upgradeMode.value === "max" || song.level <= 0) && plan.count <= 0) {
    return songCost(song);
  }

  return plan.cost;
};

const songUpgradeLabel = (song: Song): string => {
  const count = songUpgradeCount(song);
  const action = song.level ? "升级" : "解锁";

  if (song.level <= 0 || upgradeMode.value === 1) {
    return action;
  }

  // xN 买不起任何一级时，也显示 x1
  if (upgradeMode.value === "max") {
    return `${action} x${Math.max(1, count)}`;
  }

  return `${action} ${upgradeModeLabel(upgradeMode.value)}`;
};

const partnerUpgradePlan = (partner: PartnerNode) => {
  return resolveUpgradePlan(partner, (level) => partnerCostAtLevel(partner, level), partner.maxLevel, partner.level <= 0);
};

const partnerUpgradeCount = (partner: PartnerNode): number => partnerUpgradePlan(partner).count;

const partnerUpgradeCost = (partner: PartnerNode): number => {
  if (partner.level >= partner.maxLevel) return 0;

  const plan = partnerUpgradePlan(partner);

  // xN 买不起任何一级时，兜底显示 x1 的价格
  if ((upgradeMode.value === "max" || partner.level <= 0) && plan.count <= 0) {
    return partnerCost(partner);
  }

  return plan.cost;
};

const partnerUpgradeLabel = (partner: PartnerNode): string => {
  if (partner.level >= partner.maxLevel) return "MAX";

  const count = partnerUpgradeCount(partner);
  const action = partner.level ? "升级" : "邀请";

  if (partner.level <= 0 || upgradeMode.value === 1) {
    return action;
  }

  // xN 买不起任何一级时，也显示 x1
  if (upgradeMode.value === "max") {
    return `${action} x${Math.max(1, count)}`;
  }

  return `${action} ${upgradeModeLabel(upgradeMode.value)}`;
};
const spendNotez = (cost: number): boolean => {
  const safeCost = finiteNumber(cost, Number.POSITIVE_INFINITY);
  if (!canAfford(safeCost)) return false;
  gameState.notez = Math.max(0, gameState.notez - safeCost);
  return true;
};

const handlePointerDown = (event: PointerEvent) => {
  isButtonPressed.value = true;
  const gainedNotez = finiteNumber(gameState.clickValue, 1);
  gameState.notez += gainedNotez;
  showClickFloat(event.clientX, event.clientY, gainedNotez);
};

const releaseButton = () => {
  isButtonPressed.value = false;
};

const showClickFloat = (x: number, y: number, value: number) => {
  const id = floatTextId;
  floatTextId += 1;
  floatingTexts.value.push({
    id,
    x,
    y,
    value: formatNumber(value),
  });

  window.setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter((item) => item.id !== id);
  }, 920);
};

const upgradeSong = (songId: string) => {
  const song = songs.value.find((item) => item.id === songId);
  if (!song) return;
  const plan = songUpgradePlan(song);
  if (plan.count <= 0 || !spendNotez(plan.cost)) return;

  song.isUnlocked = true;
  const previousLevel = song.level;
  song.level += plan.count;
  const gainedDifficulty = Math.floor(song.level / 20) - Math.floor(previousLevel / 20);
  song.difficulty = clampNumber(song.difficulty + Math.max(0, gainedDifficulty), 0, 4);
  syncDerivedState();
};

const upgradePartner = (partnerId: string) => {
  const partner = partners.value.find((item) => item.id === partnerId);
  if (!partner || partner.level >= partner.maxLevel) return;
  const plan = partnerUpgradePlan(partner);
  if (plan.count <= 0 || !spendNotez(plan.cost)) return;

  partner.level = Math.min(partner.maxLevel, partner.level + plan.count);
  syncDerivedState();
};

const buyShopItem = (itemId: string) => {
  const item = shopItems.value.find((candidate) => candidate.id === itemId);
  if (!item || item.isPurchased) return;
  if (!spendNotez(item.cost)) return;

  item.isPurchased = true;
  syncDerivedState();
};

const resetGameData = async () => {
  const confirmResult = await Swal.fire({
    title: "清空本地存档？",
    text: "当前 Notez 本地进度会被重置，云存档不会被删除。",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "清空",
    cancelButtonText: "取消",
    confirmButtonColor: "#ef4444",
  });
  if (!confirmResult.isConfirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  gameState.notez = 0;
  songs.value = structuredClone(initialSongs);
  partners.value = structuredClone(initialPartners);
  shopItems.value = structuredClone(initialShopItems);
  floatingTexts.value = [];
  syncDerivedState();
  saveGame();
  showSaveToast("success", "本地存档已清空");
};

const difficultyName = (difficulty: number): string => {
  return difficultyNames[clampNumber(Math.floor(difficulty), 0, 4)] ?? difficultyNames[0];
};

const difficultyClass = (difficulty: number): string => {
  return `diff-${clampNumber(Math.floor(difficulty), 0, 4)}`;
};

const nextDifficultyProgress = (song: Song): number => {
  if (song.difficulty >= 4) return 100;
  return ((song.level % 20) / 20) * 100;
};

const nextDifficultyRemain = (song: Song): number => {
  if (song.difficulty >= 4) return 0;
  const remain = 20 - (song.level % 20);
  return remain === 20 && song.level > 0 ? 20 : remain;
};

const shopEffectText = (item: ShopItem): string => {
  const effect = item.effect;
  switch (effect.type) {
    case "CLICK_VALUE_ADD":
      return `点击 +${formatNumber(effect.amount)}`;
    case "CLICK_MULTIPLIER_ADD":
      return `点击倍率 +${formatNumber(effect.amount * 100)}%`;
    case "PARTNER_NPS_MULTIPLIER": {
      const partner = initialPartners.find((candidate) => candidate.id === effect.targetId);
      return `${partner?.name ?? "全部伙伴"} NPS +${formatNumber(effect.amount * 100)}%`;
    }
    case "SONG_NPS_MULTIPLIER": {
      const song = initialSongs.find((candidate) => candidate.id === effect.targetId);
      return `${song?.name ?? "全部曲目"} NPS +${formatNumber(effect.amount * 100)}%`;
    }
    case "GLOBAL_NPS_MULTIPLIER":
      return `总 NPS +${formatNumber(effect.amount * 100)}%`;
    case "SONG_COST_REDUCTION": {
      return `曲目升级消耗 -${formatNumber(effect.amount * 100)}%`;
    }
    default:
      return "特殊效果";
  }
};

const jacketPath = (song: Song): string => {
  return `${JACKET_CDN_BASE}/UI_Jacket_${formatJacketId(song.jacketId)}.png`;
};

const songCardStyle = (song: Song): Record<string, string> => {
  return {
    backgroundImage: `linear-gradient(90deg, rgba(12, 16, 24, 0.9), rgba(12, 16, 24, 0.55)), url("${jacketPath(song)}")`,
  };
};

const partnerPath = (partner: PartnerNode): string => {
  const tierIndex = partner.level >= 100 ? 2 : partner.level >= 50 ? 1 : 0;
  const fileName = partnerImageFiles[partner.id]?.[tierIndex] ?? partnerImageFiles[partner.id]?.[0];
  if (!fileName) return "";

  return `/notez/Chara/${fileName}`;
};

const markImageFailed = (path: string) => {
  const next = new Set(failedImages.value);
  next.add(path);
  failedImages.value = next;
};

const setSongUpgradeButtonRef = (element: unknown, index: number) => {
  if (index !== 0) return;
  firstSongUpgradeButtonRef.value = element instanceof HTMLButtonElement ? element : null;
};

const updateTutorialRect = () => {
  if (!tutorialStep.value || tutorialStep.value === "demo") {
    tutorialRect.value = null;
    return;
  }

  const target = tutorialStep.value === "click" ? mainButtonRef.value : firstSongUpgradeButtonRef.value;
  if (!target) {
    tutorialRect.value = null;
    return;
  }

  const rect = target.getBoundingClientRect();
  tutorialRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
};

const moveTutorialToSongStep = async () => {
  activeTab.value = "songs";
  tutorialStep.value = "song";
  await nextTick();
  updateTutorialRect();
};

const completeTutorial = () => {
  tutorialStep.value = null;
  tutorialRect.value = null;
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
};

const startTutorialIfNeeded = async () => {
  if (localStorage.getItem(TUTORIAL_STORAGE_KEY)) return;

  if ((songs.value[0]?.level ?? 0) > 0) {
    tutorialStep.value = "demo";
    return;
  }

  if (gameState.notez >= 15) {
    await moveTutorialToSongStep();
    return;
  }

  tutorialStep.value = "click";
  await nextTick();
  updateTutorialRect();
};

const normalizeNumberFormatMode = (value: unknown): NumberFormatMode => {
  return value === "scientific" ? "scientific" : "metric";
};

const normalizeUpgradeMode = (value: unknown): UpgradeMode => {
  if (value === 10 || value === 100 || value === "max") return value;
  return 1;
};

const buildSavePayload = (): SaveData => {
  return {
    version: NOTEZ_SAVE_VERSION,
    gameState: { ...gameState },
    songs: songs.value,
    partners: partners.value,
    shopItems: shopItems.value,
    settings: {
      numberFormatMode: numberFormatMode.value,
      upgradeMode: upgradeMode.value,
    },
  };
};

const saveGame = () => {
  const payload = buildSavePayload();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const applySaveData = (payload?: SaveData): boolean => {
  if (!payload) return false;

  gameState.notez = finiteNumber(payload.gameState?.notez);
  songs.value = mergeSongs(payload.songs);
  partners.value = mergePartners(payload.partners ?? payload.techNodes);
  shopItems.value = mergeShopItems(payload.shopItems);
  numberFormatMode.value = normalizeNumberFormatMode(payload.settings?.numberFormatMode);
  upgradeMode.value = normalizeUpgradeMode(payload.settings?.upgradeMode);
  syncDerivedState();
  saveGame();
  return true;
};

const loadGame = () => {
  const rawSave = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!rawSave) return;

  try {
    const parsed = JSON.parse(rawSave) as SaveData;
    applySaveData(parsed);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
};

const mergeSongs = (savedSongs?: Song[]): Song[] => {
  if (!Array.isArray(savedSongs)) return structuredClone(initialSongs);
  return initialSongs.map((baseSong) => {
    const saved = savedSongs.find((song) => song.id === baseSong.id);
    return {
      ...baseSong,
      ...saved,
      jacketId: baseSong.jacketId,
      description: baseSong.description,
      level: Math.max(0, Math.floor(finiteNumber(saved?.level, baseSong.level))),
      difficulty: clampNumber(Math.floor(finiteNumber(saved?.difficulty, baseSong.difficulty)), 0, 4),
      isUnlocked: Boolean(saved?.isUnlocked ?? baseSong.isUnlocked),
    };
  });
};

const mergePartners = (savedPartners?: PartnerNode[]): PartnerNode[] => {
  if (!Array.isArray(savedPartners)) return structuredClone(initialPartners);
  return initialPartners.map((basePartner) => {
    const saved = savedPartners.find((partner) => partner.id === basePartner.id);
    return {
      ...basePartner,
      ...saved,
      description: basePartner.description,
      level: clampNumber(Math.floor(finiteNumber(saved?.level, basePartner.level)), 0, basePartner.maxLevel),
      maxLevel: basePartner.maxLevel,
      basePartnerNPS: basePartner.basePartnerNPS,
      prerequisiteId: basePartner.prerequisiteId,
    };
  });
};

const mergeShopItems = (savedItems?: ShopItem[]): ShopItem[] => {
  if (!Array.isArray(savedItems)) return structuredClone(initialShopItems);
  return initialShopItems.map((baseItem) => {
    const saved = savedItems.find((item) => item.id === baseItem.id);
    return {
      ...baseItem,
      isPurchased: Boolean(saved?.isPurchased ?? baseItem.isPurchased),
    };
  });
};

const isApiSuccess = <T,>(payload?: ApiResult<T>): boolean => {
  return Boolean(payload?.ok || payload?.returnCode === 0);
};

const showSaveToast = (icon: "success" | "error" | "warning", title: string) => {
  void Swal.fire({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2400,
    timerProgressBar: true,
    icon,
    title,
  });
};

const getRequestMessage = (error: unknown, fallback: string): string => {
  const responseData = (error as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
  if (responseData?.message || responseData?.detail) {
    return responseData.message || responseData.detail || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const uploadCloudSave = async () => {
  if (isCloudSaveBusy.value) return;

  isCloudSaveBusy.value = true;
  try {
    saveGame();
    const res = await http.put<ApiResult<NotezCloudSaveResponse>>("/game/notez/save", {
      saveData: buildSavePayload(),
    });
    if (!isApiSuccess(res.data)) {
      throw new Error(res.data?.message || "上传云存档失败");
    }
    showSaveToast("success", "云存档已上传");
  } catch (error) {
    const message = getRequestMessage(error, "上传云存档失败");
    showSaveToast("error", message);
  } finally {
    isCloudSaveBusy.value = false;
  }
};

const downloadCloudSave = async () => {
  if (isCloudSaveBusy.value) return;

  const confirmResult = await Swal.fire({
    title: "下载云存档？",
    text: "当前本地 Notez 存档会被云端存档覆盖。",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "下载",
    cancelButtonText: "取消",
    confirmButtonColor: "#ff8c00",
  });
  if (!confirmResult.isConfirmed) return;

  isCloudSaveBusy.value = true;
  try {
    const res = await http.get<ApiResult<NotezCloudSaveResponse>>("/game/notez/save");
    if (!isApiSuccess(res.data)) {
      throw new Error(res.data?.message || "下载云存档失败");
    }
    if (!applySaveData(res.data.data?.saveData)) {
      throw new Error("云端暂无可用存档");
    }
    showSaveToast("success", "云存档已下载");
  } catch (error) {
    const message = getRequestMessage(error, "下载云存档失败");
    showSaveToast("error", message);
  } finally {
    isCloudSaveBusy.value = false;
  }
};

const tickGame = () => {
  const now = performance.now();
  const deltaSeconds = lastTickAt > 0 ? Math.max(0, (now - lastTickAt) / 1000) : 0;
  lastTickAt = now;
  syncDerivedState();
  gameState.notez += finiteNumber(gameState.totalNPS) * deltaSeconds;
  saveGame();
};

const stopGameLoop = () => {
  if (!tickTimer) return;
  window.clearInterval(tickTimer);
  tickTimer = undefined;
  lastTickAt = 0;
};

const startGameLoop = () => {
  if (tickTimer || document.visibilityState !== "visible") return;
  lastTickAt = performance.now();
  tickTimer = window.setInterval(tickGame, 1000);
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    startGameLoop();
  } else {
    stopGameLoop();
    saveGame();
  }
};

watch(
  [songs, partners, shopItems, numberFormatMode, upgradeMode, () => gameState.notez],
  () => {
    syncDerivedState();
    saveGame();
  },
  { deep: true },
);

watch(
  () => gameState.notez,
  async (notez) => {
    if (tutorialStep.value === "click" && notez >= 15) {
      await moveTutorialToSongStep();
    }
  },
);

watch(
  () => songs.value[0]?.level,
  (level) => {
    if (tutorialStep.value === "song" && finiteNumber(level) > 0) {
      tutorialStep.value = "demo";
      tutorialRect.value = null;
    }
  },
);

watch(
  [tutorialStep, activeTab, visibleSongs],
  async () => {
    await nextTick();
    updateTutorialRect();
  },
);

onMounted(() => {
  loadGame();
  syncDerivedState();
  void startTutorialIfNeeded();
  startGameLoop();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("resize", updateTutorialRect);
  window.addEventListener("scroll", updateTutorialRect, true);
});

onBeforeUnmount(() => {
  stopGameLoop();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("resize", updateTutorialRect);
  window.removeEventListener("scroll", updateTutorialRect, true);
  saveGame();
});
</script>

<style scoped>
.notez-idle-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  padding: clamp(16px, 3vw, 32px);
  background:
    radial-gradient(circle at 28% 44%, rgba(255, 140, 0, 0.18), transparent 28%),
    radial-gradient(circle at 86% 14%, rgba(239, 68, 68, 0.1), transparent 30%),
    linear-gradient(180deg, #fffaf3 0%, var(--bg-color) 58%, #fff 100%);
}

.idle-hud {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.brand-block h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: clamp(2rem, 4vw, 4.2rem);
  font-style: italic;
  font-weight: 950;
  line-height: 0.95;
  letter-spacing: 0;
  transform: skewX(-7deg);
}

.resource-strip {
  min-width: 150px;
  text-align: right;
}

.resource-strip span,
.progress-summary span {
  display: block;
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 850;
  text-transform: uppercase;
}

.resource-strip strong,
.progress-summary strong {
  display: block;
  margin-top: 4px;
  color: var(--text-main);
  font-size: clamp(1.2rem, 2vw, 2rem);
  line-height: 1;
}

.resource-strip strong {
  color: var(--primary-color);
}

.resource-strip small {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 850;
}

.game-board {
  display: grid;
  grid-template-columns: minmax(220px, 0.58fr) minmax(420px, 1.42fr);
  gap: clamp(36px, 6vw, 96px);
  align-items: start;
  margin-top: clamp(28px, 6vh, 70px);
}

.left-stage {
  min-height: 68vh;
  display: grid;
  align-content: center;
  justify-items: center;
}

.center-stage {
  position: relative;
  min-height: 330px;
  width: min(100%, 360px);
  display: grid;
  align-items: center;
  justify-items: center;
  isolation: isolate;
}

.stage-rings {
  position: absolute;
  left: 50%;
  width: min(30vw, 320px);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    repeating-conic-gradient(from 8deg, rgba(255, 140, 0, 0.16) 0deg 10deg, transparent 10deg 22deg),
    radial-gradient(circle, transparent 0 42%, rgba(255, 140, 0, 0.08) 43% 47%, transparent 48%);
  filter: blur(0.2px);
  opacity: 0.8;
  z-index: -1;
  transform: translateX(-50%);
}

.main-note-button {
  width: clamp(132px, 18vw, 196px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transform: translateZ(0);
  transition: transform 80ms ease, filter 80ms ease;
}

.main-note-button.is-pressed {
  transform: scale(0.955) translateZ(0);
  filter: brightness(0.98);
}

.button-image-stack {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
}

.main-note-button img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 18px 24px rgba(255, 140, 0, 0.24));
  transition: opacity 42ms linear;
}

.button-state-image.pressed {
  opacity: 0;
}

.main-note-button.is-pressed .button-state-image.unpressed {
  opacity: 0;
}

.main-note-button.is-pressed .button-state-image.pressed {
  opacity: 1;
}

.button-fallback {
  width: 86%;
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffba54, #ff7a00);
  border: 10px solid rgba(255, 255, 255, 0.72);
  color: white;
  font-size: 2.5rem;
  font-weight: 950;
}

.click-float-text {
  position: fixed;
  z-index: 20;
  pointer-events: none;
  transform: translate(-50%, -50%);
  color: var(--primary-color);
  font-size: 1.15rem;
  font-weight: 950;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.95),
    0 8px 18px rgba(255, 140, 0, 0.28);
  animation: click-float 920ms ease-out forwards;
}

.tutorial-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;
}

.tutorial-dim {
  position: absolute;
  inset: 0;
  background: transparent;
  animation: tutorial-dim-in 260ms ease forwards;
}

.tutorial-layer.plain .tutorial-dim {
  background: rgba(15, 23, 42, 0.58);
}

.tutorial-highlight {
  position: fixed;
  border: 2px solid rgba(255, 255, 255, 0.98);
  border-radius: 6px;
  box-shadow:
    0 0 0 9999px rgba(15, 23, 42, 0.58),
    0 0 0 8px rgba(255, 140, 0, 0.26),
    0 18px 48px rgba(255, 140, 0, 0.34);
  transition:
    top 360ms cubic-bezier(0.22, 1, 0.36, 1),
    left 360ms cubic-bezier(0.22, 1, 0.36, 1),
    width 360ms cubic-bezier(0.22, 1, 0.36, 1),
    height 360ms cubic-bezier(0.22, 1, 0.36, 1);
}

.tutorial-popover {
  position: fixed;
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid rgba(255, 140, 0, 0.32);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-main);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(14px);
  pointer-events: auto;
  transition:
    top 360ms cubic-bezier(0.22, 1, 0.36, 1),
    left 360ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
  animation: tutorial-pop-in 280ms ease both;
}

.tutorial-popover.center {
  top: 50%;
  left: 50%;
  width: min(320px, calc(100vw - 36px));
  transform: translate(-50%, -50%);
  animation-name: tutorial-center-pop-in;
}

.tutorial-popover strong {
  color: var(--primary-color);
  font-size: 1rem;
  font-weight: 950;
}

.tutorial-popover p {
  margin: 0;
  color: var(--text-main);
  font-size: 0.86rem;
  font-weight: 760;
  line-height: 1.55;
}

.tutorial-popover button {
  justify-self: start;
  border: 0;
  border-radius: 3px;
  padding: 9px 14px;
  background: var(--primary-color);
  color: white;
  font-weight: 950;
  cursor: pointer;
}

@keyframes tutorial-dim-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes tutorial-pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes tutorial-center-pop-in {
  from {
    opacity: 0;
    transform: translate(-50%, calc(-50% + 10px)) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes click-float {
  0% {
    opacity: 0;
    transform: translate(-50%, -20%) scale(0.92);
  }

  16% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translate(-50%, -115%) scale(1.08);
  }
}

.progress-summary {
  display: flex;
  justify-content: center;
  gap: clamp(16px, 4vw, 52px);
  margin-top: 12px;
  text-align: center;
}

.right-panel {
  width: 100%;
}

.dock-tabs {
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  margin-bottom: 16px;
}

.dock-tabs button {
  border: 0;
  border-radius: 4px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-muted);
  font-weight: 950;
  cursor: pointer;
}

.dock-tabs button.active {
  background: var(--primary-color);
  color: #fff;
  box-shadow: 0 12px 24px rgba(255, 140, 0, 0.22);
}

.upgrade-mode-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: -4px 0 14px;
}

.upgrade-mode-bar > span {
  color: var(--text-muted);
  font-size: 0.76rem;
  font-weight: 900;
}

.upgrade-mode-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.upgrade-mode-toggle button {
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 2px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-main);
  font-size: 0.78rem;
  font-weight: 950;
  cursor: pointer;
}

.upgrade-mode-toggle button.active {
  border-color: rgba(255, 140, 0, 0.72);
  background: var(--primary-color);
  color: #fff;
}

.song-list,
.tech-list,
.tech-panel,
.settings-panel {
  display: grid;
  gap: 10px;
}

.song-list {
  width: min(100%, 640px);
}

.tech-panel {
  gap: 22px;
}

.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.section-heading h2 {
  margin: 0;
  font-size: 1rem;
  line-height: 1;
}

.section-heading span {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
}

.song-card {
  min-height: 148px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
}

.song-card.locked {
  filter: grayscale(0.7);
}

.song-card-shade {
  min-height: inherit;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(112px, auto);
  align-items: end;
  gap: 16px;
  padding: 16px;
  color: white;
}

.tech-row {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) minmax(116px, auto);
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.22);
}

.shop-row {
  grid-template-columns: minmax(0, 1fr) minmax(116px, auto);
}

.tech-art {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 3px;
  background: linear-gradient(135deg, rgba(255, 140, 0, 0.16), rgba(239, 68, 68, 0.12));
  color: var(--primary-color);
  font-size: 0.7rem;
  font-weight: 950;
}

.tech-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-main {
  min-width: 0;
}

.item-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item-title-row strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1.08rem;
}

.song-card .item-title-row strong,
.song-card .item-meta,
.song-card .item-description {
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.42);
}

.difficulty-pill,
.type-pill {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 3px;
  color: white;
  font-size: 0.68rem;
  font-weight: 950;
  text-shadow: none;
}

.type-pill {
  background: #ff8c00;
}

.diff-0 {
  background: #45c124;
}

.diff-1 {
  background: #ffba01;
}

.diff-2 {
  background: #ff5a66;
}

.diff-3 {
  background: #9f51dc;
}

.diff-4 {
  background: linear-gradient(135deg, #c280f3, #f7f7f7);
  color: #8433c4;
}

.item-description {
  margin: 7px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.song-card .item-description {
  color: rgba(255, 255, 255, 0.86);
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 800;
}

.song-card .item-meta {
  color: rgba(255, 255, 255, 0.9);
}

.progress-line {
  width: min(340px, 100%);
  height: 5px;
  margin-top: 9px;
  overflow: hidden;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.2);
}

.progress-line span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #ef4444);
}

.upgrade-btn {
  justify-self: end;
  min-width: 112px;
  border: 0;
  border-radius: 4px;
  padding: 8px 12px;
  background: var(--primary-color);
  color: white;
  font-weight: 950;
  cursor: pointer;
}

.upgrade-btn span,
.upgrade-btn strong {
  display: block;
  line-height: 1.15;
}

.upgrade-btn strong {
  font-size: 0.82rem;
}

.upgrade-btn:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  filter: grayscale(0.4);
}

.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.settings-field {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.settings-title {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1.1;
}

.format-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.format-toggle button {
  border: 1px solid rgba(148, 163, 184, 0.42);
  border-radius: 2px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-main);
  font-weight: 900;
  cursor: pointer;
}

.format-toggle button.active {
  border-color: rgba(255, 140, 0, 0.72);
  background: var(--primary-color);
  color: white;
}

.cloud-btn {
  width: fit-content;
  border: 1px solid rgba(255, 140, 0, 0.45);
  border-radius: 4px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--primary-color);
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(255, 140, 0, 0.12);
}

.cloud-btn:disabled {
  cursor: wait;
  opacity: 0.58;
}

.danger-btn {
  width: fit-content;
  border: 0;
  border-radius: 4px;
  padding: 10px 18px;
  background: #ef4444;
  color: white;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.18);
}

@media (max-width: 900px) {
  .game-board {
    grid-template-columns: 1fr;
    margin-top: 24px;
  }

  .left-stage {
    min-height: auto;
  }

  .center-stage {
    min-height: 300px;
    justify-items: center;
    padding-left: 0;
  }

  .stage-rings {
    left: 50%;
    width: min(62vw, 320px);
    transform: translateX(-50%);
  }
}

@media (max-width: 620px) {
  .notez-idle-page {
    padding: 14px;
  }

  .idle-hud,
  .section-heading {
    display: block;
  }

  .resource-strip {
    margin-top: 16px;
    text-align: left;
  }

  .section-heading span {
    display: block;
    margin-top: 5px;
  }

  .progress-summary {
    justify-content: space-between;
    gap: 10px;
  }

  .progress-summary div {
    min-width: 0;
  }

  .song-card-shade,
  .tech-row {
    grid-template-columns: 1fr;
  }

  .song-card-shade {
    padding: 16px;
  }

  .upgrade-btn {
    justify-self: start;
    min-width: 132px;
  }
}
</style>
