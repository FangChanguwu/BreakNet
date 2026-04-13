import http from "@/utils/http";

export const maimaiApi = {
  /**
   * 获取舞萌乐曲全量数据（包括乐曲列表和别名库）
   */
  getMusicData() {
    return http.get("/maimai/music/data");
  }
};
