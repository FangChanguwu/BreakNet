import { computed, ref } from "vue";
import { defineStore } from "pinia";
import http from "@/utils/http";

interface CreditPayload {
  LastSignDate?: string;
}

interface SignReward {
  added_credits?: number;
  added_affection?: number;
  event_info?: string;
  affection_info?: string;
}

interface SignResult {
  ok: boolean;
  message: string;
  data?: SignReward;
}

const todayString = () => {
  const today = new Date();
  return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
};

const autoSignKey = (qq: string) => `breaknet:auto-sign:${qq}:${todayString()}`;
const rewardKey = (qq: string) => `breaknet:sign-reward:${qq}:${todayString()}`;

const normalizeReward = (reward: SignReward): SignReward => ({
  ...reward,
  added_credits: Number(reward.added_credits ?? 0),
  added_affection: Number(reward.added_affection ?? 0),
});

export const useDailySignStore = defineStore("dailySign", () => {
  const checkedKey = ref("");
  const isChecking = ref(false);
  const isSigning = ref(false);
  const lastMessage = ref("");
  const lastReward = ref<SignReward | null>(null);
  const signedDate = ref("");

  const hasSignedInToday = computed(() => signedDate.value === todayString());

  const markSignedToday = () => {
    signedDate.value = todayString();
  };

  const loadCachedReward = (qq: string) => {
    if (!qq) return;
    const raw = localStorage.getItem(rewardKey(qq));
    if (!raw) return;
    try {
      lastReward.value = normalizeReward(JSON.parse(raw) as SignReward);
    } catch (error) {
      console.error("Load cached sign reward failed:", error);
      localStorage.removeItem(rewardKey(qq));
    }
  };

  const saveCachedReward = (qq: string, reward: SignReward) => {
    if (!qq) return;
    localStorage.setItem(rewardKey(qq), JSON.stringify(normalizeReward(reward)));
  };

  const checkToday = async (qq: string) => {
    const key = `${qq}:${todayString()}`;
    if (!qq || checkedKey.value === key || isChecking.value) return hasSignedInToday.value;

    isChecking.value = true;
    try {
      const res = await http.get("/user/credit");
      const data = res.data?.data as CreditPayload | undefined;
      signedDate.value = String(data?.LastSignDate || "");
      if (signedDate.value === todayString()) {
        loadCachedReward(qq);
      }
      checkedKey.value = key;
    } catch (error) {
      console.error("Check daily sign failed:", error);
    } finally {
      isChecking.value = false;
    }

    return hasSignedInToday.value;
  };

  const signToday = async (qq = ""): Promise<SignResult> => {
    if (hasSignedInToday.value) {
      return { ok: false, message: "今日已签到" };
    }
    if (isSigning.value) {
      return { ok: false, message: "签到中" };
    }

    isSigning.value = true;
    lastMessage.value = "";
    lastReward.value = null;

    try {
      const res = await http.post("/user/sign");
      if (res.data?.ok) {
        const data = normalizeReward(res.data.data as SignReward);
        markSignedToday();
        lastReward.value = data;
        saveCachedReward(qq, data);
        lastMessage.value = res.data?.message || "签到成功";
        return { ok: true, message: lastMessage.value, data };
      }

      lastMessage.value = res.data?.message || "签到失败";
      return { ok: false, message: lastMessage.value };
    } catch (error: unknown) {
      console.error("Daily sign failed:", error);
      lastMessage.value = "网络请求出错，请稍后重试";
      return { ok: false, message: lastMessage.value };
    } finally {
      isSigning.value = false;
    }
  };

  const autoSignToday = async (qq: string): Promise<SignResult | null> => {
    if (!qq) return null;

    const key = autoSignKey(qq);
    if (localStorage.getItem(key) === "done") {
      markSignedToday();
      loadCachedReward(qq);
      return null;
    }

    const alreadySigned = await checkToday(qq);
    if (alreadySigned) {
      loadCachedReward(qq);
      localStorage.setItem(key, "done");
      return null;
    }

    const result = await signToday(qq);
    if (result.ok || hasSignedInToday.value) {
      localStorage.setItem(key, "done");
    }
    return result.ok ? result : null;
  };

  const reset = () => {
    checkedKey.value = "";
    isChecking.value = false;
    isSigning.value = false;
    lastMessage.value = "";
    lastReward.value = null;
    signedDate.value = "";
  };

  return {
    isChecking,
    isSigning,
    hasSignedInToday,
    lastMessage,
    lastReward,
    checkToday,
    signToday,
    autoSignToday,
    reset,
  };
});
