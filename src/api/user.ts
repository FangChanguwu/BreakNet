// src/api/user.ts
import http from "@/utils/http";

export const fetchUserCredit = async () => {
  try {
    const res = await http.get("/user/credit");

    if (res.data && res.data.ok) {
      return res.data.data;
    } else {
      console.error(res.data?.message || "请求积分失败");
      return null;
    }
  } catch (error) {
    console.error("请求积分接口异常:", error);
    return null;
  }
};
