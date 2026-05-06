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
    }, {
      timeout: 30000,
    });
  },

  verifyEmailCode(email: string, code: string) {
    return http.post("/auth/email/verify", {
      email: email.trim().toLowerCase(),
      code: code.trim(),
    });
  },

  sendPasswordResetCode(email: string) {
    return http.post("/auth/password-reset/send-code", {
      email: email.trim().toLowerCase(),
    }, {
      timeout: 30000,
    });
  },

  resetPassword(data: { email: string; code: string; new_password: string }) {
    return http.post("/auth/password-reset/confirm", {
      email: data.email.trim().toLowerCase(),
      code: data.code.trim(),
      new_password: data.new_password,
    });
  },

  register(data: any) {
    return http.post("/auth/register", data);
  },

  login(data: any) {
    return http.post("/auth/login", data);
  }
};
