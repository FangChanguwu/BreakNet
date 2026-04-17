import type { AxiosRequestConfig } from "axios";
import http from "@/utils/http";

const getRootBaseUrl = () =>
  String(http.defaults.baseURL || "").replace(/\/break\/?$/, "");

const requestRoot = (config: AxiosRequestConfig) =>
  http.request({
    baseURL: getRootBaseUrl(),
    ...config,
  });

export const maimaiApi = {
  getMusicData() {
    return http.get("/maimai/music/data");
  },

  getAccounts() {
    return requestRoot({
      url: "/maimai/accounts",
      method: "get",
    });
  },

  bindAccount(qrcode: string) {
    return requestRoot({
      url: "/maimai/accounts/bind",
      method: "post",
      data: { qrcode },
    });
  },

  switchAccount(index: number) {
    return requestRoot({
      url: "/maimai/accounts/switch",
      method: "post",
      data: { index },
    });
  },

  unbindAccount(index: number) {
    return requestRoot({
      url: `/maimai/accounts/${index}`,
      method: "delete",
    });
  },

  activateAccount(qrcode: string) {
    return requestRoot({
      url: "/maimai/accounts/activate",
      method: "post",
      data: { qrcode },
    });
  },
};
