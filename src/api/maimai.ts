import type { AxiosRequestConfig } from "axios";
import http from "@/utils/http";

const getSiteBaseUrl = () =>
  String(http.defaults.baseURL || "").replace(/\/break\/?$/, "");

const requestSiteRoot = (config: AxiosRequestConfig) =>
  http.request({
    baseURL: getSiteBaseUrl(),
    ...config,
  });

export const maimaiApi = {
  getMusicData() {
    return http.get("/maimai/music/data");
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
