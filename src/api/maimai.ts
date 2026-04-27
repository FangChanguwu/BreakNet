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

export const maimaiApi = {
  async getMusicData(forceRefresh = false) {
    if (!forceRefresh && musicDataCache) {
      return cloneMusicPayload(musicDataCache);
    }

    if (!forceRefresh && musicDataPromise) {
      const payload = await musicDataPromise;
      return cloneMusicPayload(payload);
    }

    musicDataPromise = http
      .get("/maimai/music/data")
      .then((res) => {
        if (!res.data?.ok || !res.data?.data) {
          throw new Error("Failed to fetch music data");
        }

        musicDataCache = res.data.data as MaimaiMusicDataPayload;
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

  getDelivery(ver?: string) {
    return http.get("/maimai/delivery", {
      params: ver ? { ver } : {},
      timeout: 60000,
    });
  },
};
