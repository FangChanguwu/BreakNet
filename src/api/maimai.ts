import type { AxiosRequestConfig } from "axios";
import http from "@/utils/http";

export interface MaimaiAliasEntry {
  Name: string;
  Alias: string[];
}

export interface MaimaiSongEntry {
  id: string;
  title: string;
  type: string;
  level: string[];
  ds: number[];
  charts: Array<{
    notes: number[];
    charter: string;
    dxscore?: number;
  }>;
  basic_info: {
    title: string;
    artist: string;
    genre: string;
    bpm: number;
    from: string;
  };
  aliases?: string[];
}

export interface MaimaiMusicDataPayload {
  songs: MaimaiSongEntry[];
  aliases: Record<string, MaimaiAliasEntry>;
}

export type MaimaiUnlockItemType = "music" | "icon" | "plate" | "frame" | "title" | "partner" | "kld";
export type MaimaiUnlockRole = "premium" | "tech_premium";

export interface MaimaiUnlockTemplate {
  id: string | number;
  name: string;
  itemType?: MaimaiUnlockItemType;
  type?: MaimaiUnlockItemType;
  itemIds?: number[];
  ids?: number[];
}

export interface MaimaiUnlockPlan {
  id: string | number;
  name: string;
  description?: string;
  templates?: MaimaiUnlockTemplate[];
  templateIds?: Array<string | number>;
  visibleRole?: MaimaiUnlockRole;
  executeRole?: MaimaiUnlockRole;
  minVisibleRole?: MaimaiUnlockRole;
  minExecuteRole?: MaimaiUnlockRole;
}

const getSiteBaseUrl = () =>
  String(http.defaults.baseURL || "").replace(/\/break\/?$/, "");

const requestSiteRoot = (config: AxiosRequestConfig) =>
  http.request({
    baseURL: getSiteBaseUrl(),
    ...config,
  });

let musicDataCache: MaimaiMusicDataPayload | null = null;
let musicDataPromise: Promise<MaimaiMusicDataPayload> | null = null;

const cloneMusicPayload = (payload: MaimaiMusicDataPayload): MaimaiMusicDataPayload =>
  structuredClone(payload);

const extractMusicPayload = (payload: unknown): MaimaiMusicDataPayload => {
  const root = payload as {
    ok?: boolean;
    returnCode?: number;
    data?: MaimaiMusicDataPayload | { data?: MaimaiMusicDataPayload };
    songs?: MaimaiSongEntry[];
    aliases?: Record<string, MaimaiAliasEntry>;
  };
  const nested = root.data as MaimaiMusicDataPayload | { data?: MaimaiMusicDataPayload } | undefined;
  const candidate =
    Array.isArray(root.songs)
      ? root
      : nested && "songs" in nested && Array.isArray(nested.songs)
        ? nested
        : nested && "data" in nested && nested.data && Array.isArray(nested.data.songs)
          ? nested.data
          : null;

  if (!candidate || !Array.isArray(candidate.songs)) {
    throw new Error("Failed to fetch music data");
  }

  return {
    songs: candidate.songs,
    aliases: candidate.aliases || {},
  };
};

const getMusicDataFromBackend = async (): Promise<MaimaiMusicDataPayload> => {
  const res = await http.get("/maimai/music/data", { timeout: 120000 });
  if (res.data?.ok === false || Number(res.data?.returnCode ?? 0) !== 0) {
    throw new Error("Failed to fetch music data");
  }

  return extractMusicPayload(res.data);
};

export const maimaiApi = {
  async getMusicData(forceRefresh = false) {
    if (!forceRefresh && musicDataCache) {
      return cloneMusicPayload(musicDataCache);
    }

    if (!forceRefresh && musicDataPromise) {
      const payload = await musicDataPromise;
      return cloneMusicPayload(payload);
    }

    musicDataPromise = getMusicDataFromBackend()
      .then((payload) => {
        musicDataCache = payload;
        return musicDataCache;
      })
      .finally(() => {
        musicDataPromise = null;
      });

    const payload = await musicDataPromise;
    return cloneMusicPayload(payload);
  },

  getAccounts() {
    return requestSiteRoot({
      url: "/api/maimai/accounts",
      method: "get",
    });
  },

  bindAccount(qrcode: string) {
    return requestSiteRoot({
      url: "/api/maimai/accounts/bind",
      method: "post",
      data: { qrcode },
    });
  },

  switchAccount(index: number) {
    return requestSiteRoot({
      url: "/api/maimai/accounts/switch",
      method: "post",
      data: { index },
    });
  },

  unbindAccount(index: number) {
    return requestSiteRoot({
      url: `/api/maimai/accounts/${index}`,
      method: "delete",
    });
  },

  activateAccount(qrcode: string) {
    return requestSiteRoot({
      url: "/api/maimai/accounts/activate",
      method: "post",
      data: { qrcode },
      timeout: 60000,
    });
  },

  issueTicket(index: number, chargeId: number, qrcode?: string) {
    return requestSiteRoot({
      url: "/api/maimai/ticket/issue",
      method: "post",
      data: {
        index,
        chargeId,
        ...(qrcode ? { qrcode } : {}),
      },
      timeout: 180000,
    });
  },

  getTicketCharges(index: number) {
    return requestSiteRoot({
      url: "/api/maimai/ticket/charges",
      method: "get",
      params: { index },
      timeout: 30000,
    });
  },

  getUnlockPlans() {
    return requestSiteRoot({
      url: "/api/maimai/unlock/plans",
      method: "get",
      timeout: 30000,
    });
  },

  getUnlockTemplates() {
    return requestSiteRoot({
      url: "/api/maimai/unlock/templates",
      method: "get",
      timeout: 30000,
    });
  },

  createUnlockTemplate(data: { name: string; itemType: MaimaiUnlockItemType; itemIds: number[] }) {
    return requestSiteRoot({
      url: "/api/maimai/unlock/templates",
      method: "post",
      data,
      timeout: 30000,
    });
  },

  updateUnlockTemplate(
    templateId: string | number,
    data: { name: string; itemType: MaimaiUnlockItemType; itemIds: number[] },
  ) {
    return requestSiteRoot({
      url: `/api/maimai/unlock/templates/${templateId}`,
      method: "put",
      data,
      timeout: 30000,
    });
  },

  createUnlockPlan(data: {
    name: string;
    description?: string;
    templateIds: Array<string | number>;
    visibleRole: MaimaiUnlockRole;
    executeRole?: MaimaiUnlockRole;
  }) {
    return requestSiteRoot({
      url: "/api/maimai/unlock/plans",
      method: "post",
      data,
      timeout: 30000,
    });
  },

  updateUnlockPlan(
    planId: string | number,
    data: {
      name: string;
      description?: string;
      templateIds: Array<string | number>;
      visibleRole: MaimaiUnlockRole;
      executeRole?: MaimaiUnlockRole;
    },
  ) {
    return requestSiteRoot({
      url: `/api/maimai/unlock/plans/${planId}`,
      method: "put",
      data,
      timeout: 30000,
    });
  },

  applyUnlockPlan(index: number, planId: string | number, qrcode?: string) {
    return requestSiteRoot({
      url: "/api/maimai/unlock/apply",
      method: "post",
      data: {
        index,
        planId,
        ...(qrcode ? { qrcode } : {}),
      },
      timeout: 300000,
    });
  },

  getUnlockTask(taskId: string) {
    return requestSiteRoot({
      url: `/api/maimai/unlock/tasks/${taskId}`,
      method: "get",
      timeout: 30000,
    });
  },

  getScores(index: number, page = 1, limit = 20) {
    return requestSiteRoot({
      url: "/api/maimai/scores",
      method: "get",
      params: { index, page, limit },
      timeout: 60000,
    });
  },

  refreshScores(index: number, qrcode: string) {
    return requestSiteRoot({
      url: "/api/maimai/scores/refresh",
      method: "post",
      data: { index, qrcode },
      timeout: 300000,
    });
  },

  scanQrcode(qrcode: string) {
    return requestSiteRoot({
      url: "/api/maimai/scan",
      method: "post",
      data: { qrcode },
      timeout: 30000,
    });
  },

  getUserPreview(userId: number | string, token?: string) {
    return requestSiteRoot({
      url: "/api/maimai/userpreview",
      method: "post",
      data: {
        userId: Number(userId),
        ...(token ? { token } : {}),
      },
      timeout: 30000,
    });
  },

  loginUser(userId: number | string, token?: string) {
    return requestSiteRoot({
      url: "/api/maimai/login",
      method: "post",
      data: {
        userId: Number(userId),
        ...(token ? { token } : {}),
      },
      timeout: 30000,
    });
  },

  logoutUser(userId: number | string) {
    return requestSiteRoot({
      url: "/api/maimai/logout",
      method: "post",
      data: { userId: Number(userId) },
      timeout: 30000,
    });
  },

  getUserMusic(userId: number | string) {
    return requestSiteRoot({
      url: "/api/maimai/usermusic",
      method: "post",
      data: { userId: Number(userId) },
      timeout: 120000,
    });
  },

  getDelivery(ver?: string) {
    return http.get("/maimai/delivery", {
      params: ver ? { ver } : {},
      timeout: 60000,
    });
  },
};
