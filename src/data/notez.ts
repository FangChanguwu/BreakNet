export interface GameState {
  notez: number;
  clickValue: number;
  totalNPS: number;
}

export interface Song {
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

export interface PartnerNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  basePartnerNPS: number;
  prerequisiteId?: string;
}

export type ShopEffect =
  | { type: "CLICK_VALUE_ADD"; amount: number }
  | { type: "CLICK_MULTIPLIER_ADD"; amount: number }
  | { type: "PARTNER_NPS_MULTIPLIER"; targetId?: string; amount: number }
  | { type: "SONG_NPS_MULTIPLIER"; targetId?: string; amount: number }
  | { type: "GLOBAL_NPS_MULTIPLIER"; amount: number }
  | { type: "SONG_COST_REDUCTION"; amount: number };

export type ShopCategory = "HAND_GEAR" | "HEADPHONE" | "UTILITY" | "ENDGAME";
export type NumberFormatMode = "metric" | "scientific";
export type UpgradeMode = 1 | 10 | 100 | "max";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  cost: number;
  isPurchased: boolean;
  effect: ShopEffect;
  prerequisitePartnerId?: string;
  prerequisiteShopId?: string;
}

export const NOTEZ_SAVE_VERSION = 1;
export const difficultyNames = ["BASIC", "ADVANCED", "EXPERT", "MASTER", "Re:MASTER"];

export const initialSongs: Song[] = [
  {
    id: "189",
    jacketId: 189,
    name: "弱虫モンブラン",
    description: "作为入门曲目，弱虫是个不错的选择",
    isUnlocked: true,
    level: 0,
    difficulty: 0,
    baseNPS: 0.8,
    baseCost: 15,
  },
  {
    id: "363",
    jacketId: 363,
    name: "Oshama Scramble!",
    description: "牛奶猫是你绕不过的坎",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 1.8,
    baseCost: 120,
  },
  {
    id: "417",
    jacketId: 417,
    name: "ウミユリ海底譚",
    description: "你可能与这首歌会经历一段难忘的时光",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 4.2,
    baseCost: 720,
  },
  {
    id: "772",
    jacketId: 772,
    name: "FREEDOM DiVE (tpz Overcute Remix)",
    description: "听说你喜欢越级，那么试试自由落体吧",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 9.5,
    baseCost: 3600,
  },
  {
    id: "11475",
    jacketId: 11475,
    name: "SUPER AMBULANCE",
    description: "千夏救护车开创",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 22,
    baseCost: 16000,
  },
  {
    id: "11687",
    jacketId: 11687,
    name: "MarbleBlue.",
    description: "妈宝蓝是好谱面吗",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 52,
    baseCost: 72000,
  },
  {
    id: "11686",
    jacketId: 11686,
    name: "Λzure Vixen",
    description: "3============D",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 125,
    baseCost: 340000,
  },
  {
    id: "844",
    jacketId: 844,
    name: "End Time",
    description: "终焉之时.",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 300,
    baseCost: 1650000,
  },
  {
    id: "11662",
    jacketId: 11662,
    name: "raputa",
    description: "𐎼𐎠𐎱𐎹𐎢𐎫𐎠",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 720,
    baseCost: 8200000,
  },
  {
    id: "11820",
    jacketId: 11820,
    name: "Xaleid◆scopiX",
    description: "Acid 拯救了失控的 Riz，穿越了七重门与世界。最终，一场宝石之雨倾洒而下，每一面万花筒都映出它的光芒。请见证这些「战胜一切者」所编织的下一个世界与额外篇章。",
    isUnlocked: false,
    level: 0,
    difficulty: 0,
    baseNPS: 1700,
    baseCost: 42000000,
  },
];

export const initialPartners: PartnerNode[] = [
  {
    id: "deluxekuma",
    name: "迪拉熊",
    description: "熊的脑袋上为什么会有八个按键呢...",
    level: 0,
    maxLevel: 100,
    baseCost: 80,
    basePartnerNPS: 1.2,
  },
  {
    id: "milk",
    name: "米璐库",
    description: "喝牛奶打舞萌可以变得更厉害吗？",
    level: 0,
    maxLevel: 100,
    baseCost: 620,
    basePartnerNPS: 5.5,
    prerequisiteId: "deluxekuma",
  },
  {
    id: "shama",
    name: "夏玛",
    description: "身高和欧派是纯天然无科技的哦！",
    level: 0,
    maxLevel: 100,
    baseCost: 3600,
    basePartnerNPS: 18,
    prerequisiteId: "milk",
  },
  {
    id: "salt",
    name: "纱露朵",
    description: "CAFE MiLK的面点师傅，很会揉揉搓搓捏捏",
    level: 0,
    maxLevel: 100,
    baseCost: 12000,
    basePartnerNPS: 44,
    prerequisiteId: "shama",
  },
  {
    id: "chiffon",
    name: "戚风",
    description: "CAFE MiLK的点心大师，看起来大小姐其实是个腹黑",
    level: 0,
    maxLevel: 100,
    baseCost: 52000,
    basePartnerNPS: 150,
    prerequisiteId: "salt",
  },
  {
    id: "raz",
    name: "拉兹",
    description: "CAFE MiLK的主理人(划掉)老板娘，时常熬夜钻研菜谱",
    level: 0,
    maxLevel: 100,
    baseCost: 210000,
    basePartnerNPS: 520,
    prerequisiteId: "chiffon",
  },
  {
    id: "otohime",
    name: "乙姬",
    description: "龙宫茶馆的老板娘，与CAFE MiLK的三小只关系不错",
    level: 0,
    maxLevel: 100,
    baseCost: 820000,
    basePartnerNPS: 1800,
    prerequisiteId: "raz",
  },
  {
    id: "kurohime",
    name: "黑姬",
    description: "███?██???████??████",
    level: 0,
    maxLevel: 100,
    baseCost: 3200000,
    basePartnerNPS: 6200,
    prerequisiteId: "otohime",
  },
];

export const initialShopItems: ShopItem[] = [
  {
    id: "socks",
    name: "袜子",
    description: "呃...你真的要戴着这个打舞萌吗...",
    category: "HAND_GEAR",
    cost: 80,
    isPurchased: false,
    effect: { type: "CLICK_VALUE_ADD", amount: 2 },
  },
  {
    id: "cotton_gloves",
    name: "棉织手套",
    description: "便宜耐造，但是可能闷闷的",
    category: "HAND_GEAR",
    cost: 420,
    isPurchased: false,
    effect: { type: "CLICK_VALUE_ADD", amount: 8 },
    prerequisiteShopId: "socks",
  },
  {
    id: "nylon_gloves",
    name: "尼龙手套",
    description: "轻薄顺滑，已经完全能满足舞萌的需求了",
    category: "HAND_GEAR",
    cost: 2400,
    isPurchased: false,
    effect: { type: "CLICK_VALUE_ADD", amount: 20 },
    prerequisiteShopId: "cotton_gloves",
  },
  {
    id: "rainbow_gloves",
    name: "彩虹手套",
    description: "虽然不知道为什么手套是彩色的，但是加成好像不错",
    category: "HAND_GEAR",
    cost: 14000,
    isPurchased: false,
    effect: { type: "CLICK_MULTIPLIER_ADD", amount: 0.35 },
    prerequisiteShopId: "nylon_gloves",
  },
  {
    id: "normal_headphones",
    name: "普通耳机",
    description: "不带耳机怎么玩舞萌...",
    category: "HEADPHONE",
    cost: 1600,
    isPurchased: false,
    effect: { type: "SONG_NPS_MULTIPLIER", amount: 0.1 },
    prerequisitePartnerId: "deluxekuma",
  },
  {
    id: "yuan_headphones",
    name: "原道耳机",
    description: "早知道，还是原道！",
    category: "HEADPHONE",
    cost: 12000,
    isPurchased: false,
    effect: { type: "SONG_NPS_MULTIPLIER", amount: 0.25 },
    prerequisiteShopId: "normal_headphones",
  },
  {
    id: "hifi_headphones",
    name: "降噪耳机",
    description: "代价是别人和你说话你需要摘下耳机才能听见",
    category: "HEADPHONE",
    cost: 85000,
    isPurchased: false,
    effect: { type: "SONG_NPS_MULTIPLIER", amount: 0.5 },
    prerequisiteShopId: "yuan_headphones",
  },
  {
    id: "practice_notes",
    name: "谱面练习视频",
    description: "练习视频能帮助你的前提是你有足够的游戏理解",
    category: "UTILITY",
    cost: 36000,
    isPurchased: false,
    effect: { type: "SONG_COST_REDUCTION", amount: 0.08 },
    prerequisitePartnerId: "shama",
  },
  {
    id: "travel_badge",
    name: "6倍票",
    description: "这是什么?...好像能提高旅行伙伴的加成...",
    category: "UTILITY",
    cost: 180000,
    isPurchased: false,
    effect: { type: "PARTNER_NPS_MULTIPLIER", amount: 0.25 },
    prerequisiteShopId: "practice_notes",
  },
  {
    id: "mixing_console",
    name: "调音台",
    description: "终局用的全局增幅装置，提升所有放置收益。",
    category: "ENDGAME",
    cost: 1200000,
    isPurchased: false,
    effect: { type: "GLOBAL_NPS_MULTIPLIER", amount: 0.2 },
    prerequisitePartnerId: "kurohime",
    prerequisiteShopId: "travel_badge",
  },
];
