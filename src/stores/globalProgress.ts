import { ref } from "vue";
import { defineStore } from "pinia";

export type GlobalProgressStatus = "running" | "success" | "error";

export type GlobalProgressItem = {
  id: number;
  status: GlobalProgressStatus;
  title: string;
  message: string;
  closable: boolean;
};

export const useGlobalProgressStore = defineStore("globalProgress", () => {
  const items = ref<GlobalProgressItem[]>([]);
  const autoHideTimers = new Map<number, number>();
  let nextId = 1;

  function clearAutoHideTimer(id: number) {
    const timer = autoHideTimers.get(id);
    if (!timer) return;
    window.clearTimeout(timer);
    autoHideTimers.delete(id);
  }

  function findItem(id: number) {
    return items.value.find((item) => item.id === id);
  }

  function start(title: string, message: string) {
    const id = nextId;
    nextId += 1;
    items.value.unshift({
      id,
      status: "running",
      title,
      message,
      closable: false,
    });
    return id;
  }

  function update(id: number, message: string, title?: string) {
    const item = findItem(id);
    if (!item) return;
    if (title) item.title = title;
    item.message = message;
  }

  function succeed(id: number, message = "完成", autoHideMs = 1800) {
    const item = findItem(id);
    if (!item) return;
    clearAutoHideTimer(id);
    item.status = "success";
    item.message = message;
    item.closable = false;
    autoHideTimers.set(
      id,
      window.setTimeout(() => {
        dismiss(id);
      }, autoHideMs),
    );
  }

  function fail(id: number, message: string, title?: string) {
    const item = findItem(id);
    if (!item) return;
    clearAutoHideTimer(id);
    item.status = "error";
    if (title) item.title = title;
    item.message = message;
    item.closable = true;
  }

  function dismiss(id: number) {
    clearAutoHideTimer(id);
    items.value = items.value.filter((item) => item.id !== id);
  }

  return {
    items,
    start,
    update,
    succeed,
    fail,
    dismiss,
  };
});
