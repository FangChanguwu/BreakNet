import { ref } from "vue";
import { defineStore } from "pinia";
import { spyGameApi } from "@/api/spyGame";
import type {
  PublicRoomState,
  RoomState,
  SpyGameActionBody,
  SpyGameActionName,
  SpySocketMessage,
} from "@/types/spyGame";

export type { PublicRoomState, RoomPlayer, RoomState } from "@/types/spyGame";

type WsStatus = "idle" | "connecting" | "connected" | "closed";

const parseSocketMessage = (raw: string): SpySocketMessage | null => {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") {
      return null;
    }
    return data as SpySocketMessage;
  } catch {
    return null;
  }
};

export const useSpyGameStore = defineStore("spyGame", () => {
  const roomState = ref<RoomState | null>(null);
  const publicRoom = ref<PublicRoomState | null>(null);
  const wsStatus = ref<WsStatus>("idle");
  const publicWsStatus = ref<WsStatus>("idle");
  const socketErrorMessage = ref("");

  let socket: WebSocket | null = null;
  let publicSocket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let publicReconnectTimer: number | null = null;
  let pendingRoomId = "";
  let pendingPlayerToken = "";
  let pendingPublicRoomId = "";
  let manualDisconnect = false;
  let manualPublicDisconnect = false;
  let reconnectAttempts = 0;
  let publicReconnectAttempts = 0;
  let requestCounter = 0;
  let pendingMessages: Array<{ action: SpyGameActionName; payload: SpyGameActionBody }> = [];
  let heartbeatTimer: number | null = null;
  let heartbeatTimeoutTimer: number | null = null;
  let lastMessageTime = 0;
  let fallbackPollTimer: number | null = null;
  let publicFallbackPollTimer: number | null = null;
  let lastRoomLogSignature = "";

  const sessionKey = (roomId: string, asGuest: boolean) =>
    `spy-room-${roomId}-${asGuest ? "guest" : "user"}`;

  const getStoredSession = (roomId: string, asGuest: boolean) => {
    const raw = sessionStorage.getItem(sessionKey(roomId, asGuest));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as { playerId: string; playerToken: string };
    } catch {
      return null;
    }
  };

  const setStoredSession = (
    roomId: string,
    asGuest: boolean,
    payload: { playerId: string; playerToken: string },
  ) => {
    sessionStorage.setItem(sessionKey(roomId, asGuest), JSON.stringify(payload));
  };

  const clearStoredSession = (roomId: string) => {
    sessionStorage.removeItem(sessionKey(roomId, true));
    sessionStorage.removeItem(sessionKey(roomId, false));
  };

  const syncPublicRoomFromState = (data: RoomState | null) => {
    if (!data) {
      publicRoom.value = null;
      return;
    }

    publicRoom.value = {
      roomId: data.roomId,
      status: data.status,
      playerCount: data.playerCount,
      players: data.players.map((player) => ({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        isOwner: player.isOwner,
        isConnected: player.isConnected,
      })),
    };
  };

  const applyRoomState = (data: RoomState | null) => {
    if (data) {
      const nextLogSignature = JSON.stringify({
        roomId: data.roomId,
        playerCount: data.playerCount,
        playerIds: data.players?.map((player) => player.id) ?? [],
        status: data.status,
        round: data.round,
        meId: data.me?.id ?? null,
      });
      if (nextLogSignature !== lastRoomLogSignature) {
        lastRoomLogSignature = nextLogSignature;
        console.log("[spyGame] applyRoomState", {
          roomId: data.roomId,
          playerCount: data.playerCount,
          playersLength: data.players?.length ?? 0,
          playerNames: data.players?.map((player) => player.name) ?? [],
          meId: data.me?.id ?? null,
        });
      }
    } else {
      lastRoomLogSignature = "";
    }
    roomState.value = data;
    syncPublicRoomFromState(data);
  };

  const setPublicRoom = (data: PublicRoomState | null) => {
    if (data) {
      console.log("[spyGame] setPublicRoom", {
        roomId: data.roomId,
        playerCount: data.playerCount,
        playersLength: data.players?.length ?? 0,
        playerNames: data.players?.map((player) => player.name) ?? [],
      });
    }
    publicRoom.value = data;
  };

  const clearSocketError = () => {
    socketErrorMessage.value = "";
  };

  const startHeartbeat = () => {
    stopHeartbeat();
    lastMessageTime = Date.now();
    heartbeatTimer = window.setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        stopHeartbeat();
        return;
      }
      // 如果超过 45 秒没收到任何消息，认为连接已静默断开，强制重连
      if (Date.now() - lastMessageTime > 45000) {
        console.log("[spyGame] heartbeat: no message for 45s, forcing reconnect");
        stopHeartbeat();
        const closingSocket = socket;
        socket = null;
        wsStatus.value = "closed";
        try { closingSocket.close(); } catch { /* ignore */ }
        if (!manualDisconnect) {
          scheduleReconnect();
        }
        return;
      }
      // 每 30 秒发送一次 ping
      try {
        socket.send(JSON.stringify(buildActionMessage("ping")));
      } catch {
        stopHeartbeat();
      }
    }, 30000);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (heartbeatTimeoutTimer !== null) {
      window.clearTimeout(heartbeatTimeoutTimer);
      heartbeatTimeoutTimer = null;
    }
  };

  const stopFallbackPolling = () => {
    if (fallbackPollTimer !== null) {
      window.clearInterval(fallbackPollTimer);
      fallbackPollTimer = null;
    }
  };

  const stopPublicFallbackPolling = () => {
    if (publicFallbackPollTimer !== null) {
      window.clearInterval(publicFallbackPollTimer);
      publicFallbackPollTimer = null;
    }
  };

  const refreshRoomStateByHttp = async () => {
    if (!pendingRoomId || !pendingPlayerToken) return;
    try {
      const res = await spyGameApi.getRoomState(pendingRoomId, pendingPlayerToken);
      const payload = res.data?.data;
      if (payload?.room) {
        applyRoomState(payload.room);
      }
    } catch (error) {
      console.warn("[spyGame] fallback room state refresh failed", error);
    }
  };

  const startFallbackPolling = () => {
    if (fallbackPollTimer !== null || !pendingRoomId || !pendingPlayerToken) {
      return;
    }
    void refreshRoomStateByHttp();
    fallbackPollTimer = window.setInterval(() => {
      void refreshRoomStateByHttp();
    }, 1000);
  };

  const refreshPublicRoomStateByHttp = async () => {
    if (!pendingPublicRoomId) return;
    try {
      const res = await spyGameApi.getPublicRoomState(pendingPublicRoomId);
      const payload = res.data?.data;
      if (payload?.room) {
        setPublicRoom(payload.room);
      }
    } catch (error) {
      console.warn("[spyGame] fallback public room refresh failed", error);
    }
  };

  const startPublicFallbackPolling = () => {
    if (publicFallbackPollTimer !== null || !pendingPublicRoomId) {
      return;
    }
    void refreshPublicRoomStateByHttp();
    publicFallbackPollTimer = window.setInterval(() => {
      void refreshPublicRoomStateByHttp();
    }, 1500);
  };

  const buildActionMessage = (action: SpyGameActionName, payload: SpyGameActionBody = {}) => {
    requestCounter += 1;
    return {
      type: "action",
      action,
      payload,
      requestId: `${Date.now()}-${requestCounter}`,
    };
  };

  const closeSocket = () => {
    stopHeartbeat();
    if (socket) {
      const closingSocket = socket;
      socket = null;
      closingSocket.close();
    }
    wsStatus.value = "closed";
  };

  const closePublicSocket = () => {
    if (publicSocket) {
      const closingSocket = publicSocket;
      publicSocket = null;
      closingSocket.close();
    }
    publicWsStatus.value = "closed";
  };

  const scheduleReconnect = () => {
    if (!pendingRoomId || !pendingPlayerToken || manualDisconnect) {
      return;
    }
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
    }
    const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
    const jitter = 0.85 + Math.random() * 0.3;
    reconnectTimer = window.setTimeout(() => {
      reconnectAttempts += 1;
      connectRoomSocket(pendingRoomId, pendingPlayerToken);
    }, Math.round(delay * jitter));
  };

  const schedulePublicReconnect = () => {
    if (!pendingPublicRoomId || manualPublicDisconnect) {
      return;
    }
    if (publicReconnectTimer) {
      window.clearTimeout(publicReconnectTimer);
    }
    const delay = Math.min(1000 * Math.pow(1.5, publicReconnectAttempts), 15000);
    const jitter = 0.85 + Math.random() * 0.3;
    publicReconnectTimer = window.setTimeout(() => {
      publicReconnectAttempts += 1;
      connectPublicRoomSocket(pendingPublicRoomId);
    }, Math.round(delay * jitter));
  };

  const handleRoomSocketMessage = (raw: string) => {
    const data = parseSocketMessage(raw);
    if (!data) return;
    lastMessageTime = Date.now();
    console.log("[spyGame] room socket message", data);

    if (data.type === "snapshot" && data.scope === "room") {
      applyRoomState(data.payload);
      return;
    }

    if (data.type === "error") {
      socketErrorMessage.value = data.message || "房间连接操作失败。";
    }
  };

  const handlePublicSocketMessage = (raw: string) => {
    const data = parseSocketMessage(raw);
    if (!data) return;
    console.log("[spyGame] public socket message", data);

    if (data.type === "snapshot" && data.scope === "public") {
      setPublicRoom(data.payload);
      return;
    }

    if (data.type === "error") {
      socketErrorMessage.value = data.message || "房间连接操作失败。";
    }
  };

  const handleRoomSocketClose = (event: CloseEvent, roomId: string) => {
    console.log("[spyGame] room socket close", {
      roomId,
      code: event.code,
      reason: event.reason,
    });
    if (event.code === 4403) {
      clearStoredSession(roomId);
      pendingRoomId = "";
      pendingPlayerToken = "";
      reconnectAttempts = 0;
      if (event.reason) {
        socketErrorMessage.value = event.reason;
      }
      applyRoomState(null);
      if (!manualDisconnect && event.code === 4403) {
        connectPublicRoomSocket(roomId);
      }
      return;
    }

    if (event.code === 4404) {
      reconnectAttempts = 0;
      if (roomState.value?.roomId === roomId) {
        console.warn("[spyGame] room socket reported missing room after HTTP snapshot, fallback polling", {
          roomId,
          reason: event.reason,
        });
        startFallbackPolling();
      } else if (event.reason) {
        socketErrorMessage.value = event.reason;
      }
      return;
    }

    if (!manualDisconnect) {
      scheduleReconnect();
    }
  };

  const handlePublicSocketClose = (event: CloseEvent) => {
    console.log("[spyGame] public socket close", {
      code: event.code,
      reason: event.reason,
    });
    if (event.code === 4404) {
      pendingPublicRoomId = "";
      publicReconnectAttempts = 0;
      setPublicRoom(null);
      if (event.reason) {
        socketErrorMessage.value = event.reason;
      }
      return;
    }

    if (!manualPublicDisconnect) {
      schedulePublicReconnect();
    }
  };

  const connectRoomSocket = (roomId: string, playerToken: string) => {
    pendingRoomId = roomId;
    pendingPlayerToken = playerToken;
    manualDisconnect = false;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    closeSocket();
    if (!spyGameApi.isWebSocketEnabled()) {
      wsStatus.value = "closed";
      startFallbackPolling();
      return;
    }
    wsStatus.value = "connecting";
    const nextSocket = new WebSocket(spyGameApi.getWebSocketUrl(roomId, playerToken));
    socket = nextSocket;

    nextSocket.onopen = () => {
      if (socket !== nextSocket) return;
      console.log("[spyGame] room socket open", { roomId });
      reconnectAttempts = 0;
      wsStatus.value = "connected";
      stopFallbackPolling();
      // 连接成功后冲刷积压的消息队列
      flushPendingMessages();
      // 启动心跳检测
      startHeartbeat();
    };

    nextSocket.onmessage = (event) => {
      if (socket !== nextSocket) return;
      handleRoomSocketMessage(event.data);
    };

    nextSocket.onclose = (event) => {
      if (socket !== nextSocket) return;
      socket = null;
      wsStatus.value = "closed";
      handleRoomSocketClose(event, roomId);
    };
  };

  const connectPublicRoomSocket = (roomId: string) => {
    pendingPublicRoomId = roomId;
    if (!spyGameApi.isWebSocketEnabled()) {
      publicWsStatus.value = "closed";
      startPublicFallbackPolling();
      return;
    }
    manualPublicDisconnect = false;
    if (publicReconnectTimer) {
      window.clearTimeout(publicReconnectTimer);
      publicReconnectTimer = null;
    }
    closePublicSocket();
    publicWsStatus.value = "connecting";
    const nextSocket = new WebSocket(spyGameApi.getPublicWebSocketUrl(roomId));
    publicSocket = nextSocket;

    nextSocket.onopen = () => {
      if (publicSocket !== nextSocket) return;
      console.log("[spyGame] public socket open", { roomId });
      publicReconnectAttempts = 0;
      publicWsStatus.value = "connected";
      stopPublicFallbackPolling();
    };

    nextSocket.onmessage = (event) => {
      if (publicSocket !== nextSocket) return;
      handlePublicSocketMessage(event.data);
    };

    nextSocket.onclose = (event) => {
      if (publicSocket !== nextSocket) return;
      publicSocket = null;
      publicWsStatus.value = "closed";
      handlePublicSocketClose(event);
    };
  };

  const disconnectRoomSocket = (options?: { manual?: boolean; sendLeave?: boolean }) => {
    const { manual = true, sendLeave = false } = options || {};
    manualDisconnect = manual;
    if (manual) {
      pendingRoomId = "";
      pendingPlayerToken = "";
      reconnectAttempts = 0;
      pendingMessages = [];
      stopFallbackPolling();
    }
    stopHeartbeat();
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (sendLeave && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(buildActionMessage("leave_room")));
    }
    closeSocket();
  };

  const disconnectPublicRoomSocket = (options?: { manual?: boolean }) => {
    const { manual = true } = options || {};
    manualPublicDisconnect = manual;
    if (manual) {
      pendingPublicRoomId = "";
      publicReconnectAttempts = 0;
      stopPublicFallbackPolling();
    }
    if (publicReconnectTimer) {
      window.clearTimeout(publicReconnectTimer);
      publicReconnectTimer = null;
    }
    closePublicSocket();
  };

  const flushPendingMessages = () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !pendingMessages.length) {
      return;
    }
    const messages = pendingMessages.splice(0);
    for (const msg of messages) {
      try {
        socket.send(JSON.stringify(buildActionMessage(msg.action, msg.payload)));
      } catch {
        // 单条发送失败不影响队列中其他消息
      }
    }
  };

  const sendRoomMessage = async (action: SpyGameActionName, payload: SpyGameActionBody = {}) => {
    if (!spyGameApi.isWebSocketEnabled()) {
      if (!pendingRoomId || !pendingPlayerToken) {
        throw new Error("ROOM_SOCKET_UNAVAILABLE");
      }
      const res = await spyGameApi.submitRoomAction(pendingRoomId, pendingPlayerToken, action, payload);
      const responsePayload = res.data?.data;
      if (responsePayload?.room) {
        applyRoomState(responsePayload.room);
      }
      return;
    }

    // 如果 socket 正在连接中或已打开，将消息入队等待冲刷
    if (socket && socket.readyState === WebSocket.CONNECTING) {
      pendingMessages.push({ action, payload });
      return; // 不抛异常，等 onopen 时冲刷
    }
    if (socket && socket.readyState === WebSocket.OPEN) {
      // socket 已就绪，先冲刷队列再发送当前消息
      flushPendingMessages();
      socket.send(JSON.stringify(buildActionMessage(action, payload)));
      return;
    }
    // socket 为 null 或状态为 CLOSING/CLOSED —— 如果正在重连中则入队，否则抛错
    if (pendingRoomId && pendingPlayerToken && !manualDisconnect) {
      // 重连进行中，入队等待
      pendingMessages.push({ action, payload });
      return;
    }
    throw new Error("ROOM_SOCKET_UNAVAILABLE");
  };

  const resetRoomState = () => {
    applyRoomState(null);
    setPublicRoom(null);
  };

  const clearRoomSession = (roomId: string) => {
    clearStoredSession(roomId);
    disconnectRoomSocket({ manual: true, sendLeave: false });
    disconnectPublicRoomSocket({ manual: true });
    resetRoomState();
    pendingRoomId = "";
    pendingPlayerToken = "";
    pendingPublicRoomId = "";
    reconnectAttempts = 0;
    publicReconnectAttempts = 0;
    pendingMessages = [];
    stopFallbackPolling();
  };

  return {
    roomState,
    publicRoom,
    wsStatus,
    publicWsStatus,
    socketErrorMessage,
    getStoredSession,
    setStoredSession,
    clearStoredSession,
    clearSocketError,
    applyRoomState,
    connectRoomSocket,
    disconnectRoomSocket,
    connectPublicRoomSocket,
    disconnectPublicRoomSocket,
    sendRoomMessage,
    resetRoomState,
    clearRoomSession,
  };
});
