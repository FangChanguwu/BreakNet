import http from "../utils/http";
import { MD5 } from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_APP_SECRET_KEY;

export const authApi = {
  apply(qq: string) {
    const t = Math.floor(Date.now() / 1000);
    const sign = MD5(`${qq}${t}${SECRET_KEY}`).toString();

    return http.post(`/auth/apply?t=${t}&sign=${sign}`, {
      qq: Number(qq),
    });
  },

  checkStatus(qq: string) {
    return http.get("/auth/status", {
      params: { qq: Number(qq) },
    });
  },

  sendEmailCode(email: string) {
    return http.post("/auth/email/send-code", {
      email: email.trim().toLowerCase(),
    });
  },

  verifyEmailCode(email: string, code: string) {
    return http.post("/auth/email/verify", {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
  },

  register(data: any) {
    return http.post("/auth/register", data);
  },

  login(data: any) {
    return http.post("/auth/login", data);
  }
};
