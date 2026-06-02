<template>
  <main class="notez-idle-page">
    <header class="idle-hud">
      <div class="brand-block">
        <h1>Notez</h1>
      </div>

      <div class="resource-strip">
        <span>Notez</span>
        <strong>{{ formatNumber(gameState.notez) }}</strong>
        <small>{{ formatNumber(gameState.totalNPS) }} NPS</small>
      </div>
    </header>

    <section class="game-board">
      <div class="left-stage">
        <section class="center-stage" aria-label="Notez main stage">
          <div class="stage-rings" aria-hidden="true"></div>

          <button
            class="main-note-button"
            type="button"
            :class="{ 'is-pressed': isButtonPressed }"
            @pointerdown="handlePointerDown"
            @pointerup="releaseButton"
            @pointerleave="releaseButton"
            @pointercancel="releaseButton"
          >
            <img
              v-if="!buttonImageFailed"
              :src="currentButtonImage"
              alt="Notez"
              draggable="false"
              @error="buttonImageFailed = true"
            />
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
            曲目库
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

        <div v-if="activeTab === 'songs'" class="song-list">
          <article
            v-for="song in visibleSongs"
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
                class="upgrade-btn"
                type="button"
                :disabled="!canAfford(songCost(song))"
                @click="upgradeSong(song.id)"
              >
                <span>{{ song.level ? "升级" : "解锁" }}</span>
                <strong>{{ formatNumber(songCost(song)) }}</strong>
              </button>
            </div>
          </article>
        </div>

        <div v-else-if="activeTab === 'partners'" class="tech-panel">
          <section class="tech-section">
            <div class="section-heading">
              <h2>旅行伙伴</h2>
              <span>升级后增加放置收益</span>
            </div>

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
                    <span class="type-pill">旅行伙伴</span>
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
                  :disabled="partner.level >= partner.maxLevel || !canAfford(partnerCost(partner))"
                  @click="upgradePartner(partner.id)"
                >
                  <span>{{ partner.level ? "升级" : "邀请" }}</span>
                  <strong>{{ partner.level >= partner.maxLevel ? "MAX" : formatNumber(partnerCost(partner)) }}</strong>
                </button>
              </article>
            </div>
          </section>
        </div>

        <div v-else-if="activeTab === 'shop'" class="tech-panel">
          <section class="tech-section">
            <div class="section-heading">
              <h2>商店</h2>
              <span>一次性购买，获得特殊效果</span>
            </div>

            <div class="tech-list">
              <article v-for="item in visibleShopItems" :key="item.id" class="tech-row shop-row">
                <div class="shop-icon">
                  <span>{{ item.iconText }}</span>
                </div>

                <div class="item-main">
                  <div class="item-title-row">
                    <strong>{{ item.name }}</strong>
                    <span class="type-pill">商店</span>
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
            <div class="section-heading">
              <h2>设置</h2>
              <span>管理本地存档</span>
            </div>

            <button class="danger-btn" type="button" @click="resetGameData">
              清空数据
            </button>
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
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import buttonPressedUrl from "@/assets/notez/UI_Button_Pressed.png";
import buttonUnpressedUrl from "@/assets/notez/UI_Button_Unpressed.png";

interface GameState {
  notez: number;
  clickValue: number;
  totalNPS: number;
}

interface Song {
  id: string;
  jacketId: number;
  name: string;
  description: string;
  isUnlocked: boolean;
  level: number;
  difficulty: number;
  baseNPS: number;
  baseCost: number;
}

interface PartnerNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  basePartnerNPS: number;
  prerequisiteId?: string;
}

type ShopEffect =
  | { type: "CLICK_VALUE_ADD"; amount: number }
  | { type: "CLICK_MULTIPLIER_ADD"; amount: number }
  | { type: "PARTNER_NPS_MULTIPLIER"; targetId: string; amount: number }
  | { type: "SONG_NPS_MULTIPLIER"; targetId: string; amount: number };

interface ShopItem {
  id: string;
  name: string;
  description: string;
  iconText: string;
  cost: number;
  isPurchased: boolean;
  effect: ShopEffect;
  prerequisitePartnerId?: string;
  prerequisiteShopId?: string;
}

interface SaveData {
  gameState?: Partial<GameState>;
  songs?: Song[];
  partners?: PartnerNode[];
  shopItems?: ShopItem[];
  techNodes?: PartnerNode[];
  lastSettledAt?: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: string;
}

const STORAGE_KEY = "breaknet-notez-idle-v2";
const LEGACY_STORAGE_KEY = "breaknet-notez-idle-v1";
const BUTTON_UNPRESSED = buttonUnpressedUrl;
const BUTTON_PRESSED = buttonPressedUrl;
const JACKET_CDN_BASE = "https://assets.breakdx.net/maimai/jacket";
const difficultyNames = ["BASIC", "ADVANCED", "EXPERT", "MASTER", "Re:MASTER"];

// 曲目描述在这里改：description 字段会显示在曲目库每张长方形曲绘卡上。
const initialSongs: Song[] = [
  {
    id: "417",
    jacketId: 417,
    name: "ウミユリ海底譚",
    description: "作为入门曲目，海底谭是个不错的选择",
    isUnlocked: true,
    level: 0,
    difficulty: 0,
    baseNPS: 0.8,
    baseCost: 15,
  },
  {
    id: "overjoy_overdose",
    jacketId: 100002,
    name: "Overjoy OVERDOSE",
    description: "高速段落开始出现，升级后自动收益明显提高。",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 1.8,
    baseCost: 120,
  },
  {
    id: "divide_et_impera",
    jacketId: 100003,
    name: "Divide et impera!",
    description: "需要更多 Notez 驱动的中期曲目。",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 4.2,
    baseCost: 720,
  },
  {
    id: "ref_rain",
    jacketId: 100004,
    name: "Ref:rain",
    description: "适合堆高熟练度，晋级后收益跨度更大。",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 9.5,
    baseCost: 3600,
  },
  {
    id: "antinomi",
    jacketId: 100005,
    name: "AntinomiE",
    description: "后期核心曲目，需要完整伙伴与商店体系支撑。",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 22,
    baseCost: 16000,
  },
];

// 旅行伙伴描述在这里改：旅行伙伴可重复升级，提供放置 NPS。
const initialPartners: PartnerNode[] = [
  {
    id: "tour_partner",
    name: "旅行搭档",
    description: "带来独立 NPS，帮你在不点击时继续积累 Notez。",
    level: 0,
    maxLevel: 100,
    baseCost: 80,
    basePartnerNPS: 1.5,
  },
  {
    id: "club_partner",
    name: "练习室伙伴",
    description: "熟悉节奏训练的队友，升级后提供更高放置产出。",
    level: 0,
    maxLevel: 100,
    baseCost: 850,
    basePartnerNPS: 8,
    prerequisiteId: "tour_partner",
  },
  {
    id: "tour_master",
    name: "远征领队",
    description: "后期放置核心，适合配合商店里的团队加成。",
    level: 0,
    maxLevel: 100,
    baseCost: 4600,
    basePartnerNPS: 28,
    prerequisiteId: "club_partner",
  },
];

// 商店描述在这里改：商店物品只能购买一次，effect 决定特殊效果。
const initialShopItems: ShopItem[] = [
  {
    id: "socks",
    name: "袜子",
    description: "呃，你真的要用这玩意打舞萌吗？（点击收益+5）",
    iconText: "SOCKS",
    cost: 140,
    isPurchased: false,
    effect: { type: "CLICK_VALUE_ADD", amount: 5 },
    prerequisitePartnerId: "tour_partner",
  },
  {
    id: "touch_panel",
    name: "触控校准器",
    description: "让每次点击的总收益获得额外倍率。",
    iconText: "PANEL",
    cost: 900,
    isPurchased: false,
    effect: { type: "CLICK_MULTIPLIER_ADD", amount: 0.5 },
    prerequisiteShopId: "arcade_gloves",
  },
  {
    id: "travel_badge",
    name: "远征徽章",
    description: "强化旅行搭档，使他的放置产出提高。",
    iconText: "NPS",
    cost: 1800,
    isPurchased: false,
    effect: { type: "PARTNER_NPS_MULTIPLIER", targetId: "tour_partner", amount: 1 },
    prerequisitePartnerId: "club_partner",
  },
  {
    id: "speaker_boost",
    name: "音箱增幅器",
    description: "强化 Break The Speakers 的自动产出。",
    iconText: "SONG",
    cost: 5200,
    isPurchased: false,
    effect: { type: "SONG_NPS_MULTIPLIER", targetId: "break_the_speakers", amount: 1 },
    prerequisiteShopId: "touch_panel",
  },
];

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
let tickTimer: number | undefined;
let floatTextId = 0;
let lastSettledAt = Date.now();

const currentButtonImage = computed(() => (isButtonPressed.value ? BUTTON_PRESSED : BUTTON_UNPRESSED));
const totalSongLevel = computed(() => songs.value.reduce((sum, song) => sum + finiteNumber(song.level), 0));
const totalPartnerLevel = computed(() => partners.value.reduce((sum, partner) => sum + finiteNumber(partner.level), 0));
const purchasedShopCount = computed(() => shopItems.value.filter((item) => item.isPurchased).length);
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
  if (safeValue < 1000) return safeValue.toFixed(safeValue >= 100 ? 0 : safeValue >= 10 ? 1 : 2);
  return Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(safeValue);
};

const formatJacketId = (id: number): string => {
  return String(Math.max(0, Math.floor(finiteNumber(id)))).padStart(6, "0");
};

const songCost = (song: Song): number => {
  return Math.ceil(finiteNumber(song.baseCost, 1) * Math.pow(1.15, finiteNumber(song.level)));
};

const songMultiplier = (songId: string): number => {
  return 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "SONG_NPS_MULTIPLIER" || item.effect.targetId !== songId) {
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
  return Math.ceil(finiteNumber(partner.baseCost, 1) * Math.pow(1.25, finiteNumber(partner.level)));
};

const partnerMultiplier = (partnerId: string): number => {
  return 1 + shopItems.value.reduce((sum, item) => {
    if (!item.isPurchased || item.effect.type !== "PARTNER_NPS_MULTIPLIER" || item.effect.targetId !== partnerId) {
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
  return songTotal + partnerTotal;
};

const syncDerivedState = () => {
  gameState.clickValue = calculateClickValue();
  gameState.totalNPS = calculateTotalNPS();
};

const canAfford = (cost: number): boolean => {
  return gameState.notez >= finiteNumber(cost, Number.POSITIVE_INFINITY);
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
  const cost = songCost(song);
  if (!spendNotez(cost)) return;

  song.isUnlocked = true;
  song.level += 1;
  if (song.level > 0 && song.level % 20 === 0) {
    song.difficulty = clampNumber(song.difficulty + 1, 0, 4);
  }
  syncDerivedState();
};

const upgradePartner = (partnerId: string) => {
  const partner = partners.value.find((item) => item.id === partnerId);
  if (!partner || partner.level >= partner.maxLevel) return;
  const cost = partnerCost(partner);
  if (!spendNotez(cost)) return;

  partner.level += 1;
  syncDerivedState();
};

const buyShopItem = (itemId: string) => {
  const item = shopItems.value.find((candidate) => candidate.id === itemId);
  if (!item || item.isPurchased) return;
  if (!spendNotez(item.cost)) return;

  item.isPurchased = true;
  syncDerivedState();
};

const resetGameData = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  gameState.notez = 0;
  songs.value = structuredClone(initialSongs);
  partners.value = structuredClone(initialPartners);
  shopItems.value = structuredClone(initialShopItems);
  floatingTexts.value = [];
  lastSettledAt = Date.now();
  syncDerivedState();
  saveGame();
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
      return `${partner?.name ?? "伙伴"} NPS +${formatNumber(effect.amount * 100)}%`;
    }
    case "SONG_NPS_MULTIPLIER": {
      const song = initialSongs.find((candidate) => candidate.id === effect.targetId);
      return `${song?.name ?? "曲目"} NPS +${formatNumber(effect.amount * 100)}%`;
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
  const tier = partner.level >= 100 ? "tier3" : partner.level >= 50 ? "tier2" : "tier1";
  return `/assets/partners/${partner.id}_${tier}.png`;
};

const markImageFailed = (path: string) => {
  const next = new Set(failedImages.value);
  next.add(path);
  failedImages.value = next;
};

const saveGame = () => {
  const payload: SaveData = {
    gameState: { ...gameState },
    songs: songs.value,
    partners: partners.value,
    shopItems: shopItems.value,
    lastSettledAt,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadGame = () => {
  const rawSave = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!rawSave) return;

  try {
    const parsed = JSON.parse(rawSave) as SaveData;
    gameState.notez = finiteNumber(parsed.gameState?.notez);
    songs.value = mergeSongs(parsed.songs);
    partners.value = mergePartners(parsed.partners ?? parsed.techNodes);
    shopItems.value = mergeShopItems(parsed.shopItems);
    lastSettledAt = finiteNumber(parsed.lastSettledAt, Date.now());
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

const settleIdleGain = () => {
  const now = Date.now();
  const deltaSeconds = Math.max(0, (now - lastSettledAt) / 1000);
  lastSettledAt = now;
  syncDerivedState();
  gameState.notez += finiteNumber(gameState.totalNPS) * deltaSeconds;
  saveGame();
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    settleIdleGain();
  } else {
    settleIdleGain();
  }
};

watch(
  [songs, partners, shopItems, () => gameState.notez],
  () => {
    syncDerivedState();
    saveGame();
  },
  { deep: true },
);

onMounted(() => {
  loadGame();
  syncDerivedState();
  settleIdleGain();
  tickTimer = window.setInterval(settleIdleGain, 1000);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  if (tickTimer) window.clearInterval(tickTimer);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  settleIdleGain();
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

.main-note-button img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  filter: drop-shadow(0 18px 24px rgba(255, 140, 0, 0.24));
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

.tech-art,
.shop-icon {
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

.shop-icon {
  background: linear-gradient(135deg, rgba(31, 41, 55, 0.08), rgba(255, 140, 0, 0.16));
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
