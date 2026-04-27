import axios from "axios";
import http from "@/utils/http";
import type {
  PublicRoomState,
  RoomState,
  SpyGameActionBody,
  SpyGameActionName,
  SpyGameActionPayload,
  SpyGameJoinPayload,
} from "@/types/spyGame";

const guestHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/break",
  timeout: 5000,
});

const getApiBaseUrl = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "/break";
  return new URL(baseURL, window.location.origin);
};

const getWebSocketBaseUrl = () => {
  const configuredBaseURL = import.meta.env.VITE_SPY_WS_BASE_URL;
  if (configuredBaseURL) {
    const resolved = new URL(configuredBaseURL, window.location.origin);
    if (resolved.protocol === "http:") {
      resolved.protocol = "ws:";
    } else if (resolved.protocol === "https:") {
      resolved.protocol = "wss:";
    }
    return resolved;
  }

  const apiBaseUrl = getApiBaseUrl();
  apiBaseUrl.protocol = apiBaseUrl.protocol === "https:" ? "wss:" : "ws:";
  return apiBaseUrl;
};

const buildWebSocketUrl = (path: string, params?: Record<string, string>) => {
  const wsBaseUrl = getWebSocketBaseUrl();
  const url = new URL(wsBaseUrl.toString());
  const basePath = wsBaseUrl.pathname.replace(/\/$/, "");
  url.pathname = path.startsWith(basePath)
    ? path
    : `${basePath}${path}`;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
};

export const spyGameApi = {
  isWebSocketEnabled() {
    return import.meta.env.VITE_SPY_WS_DISABLED !== "true";
  },

  createRoom(displayName?: string) {
    return http.post<{ ok: boolean; data: SpyGameJoinPayload }>("/game/spy/rooms", {
      display_name: displayName || null,
    });
  },

  joinRoom(roomId: string, displayName?: string) {
    return http.post<{ ok: boolean; data: SpyGameJoinPayload }>(`/game/spy/rooms/${roomId}/join`, {
      display_name: displayName || null,
    });
  },

  joinRoomAsGuest(roomId: string, displayName?: string) {
    return guestHttp.post<{ ok: boolean; data: SpyGameJoinPayload }>(`/game/spy/rooms/${roomId}/join`, {
      display_name: displayName || null,
    });
  },

  getRoomState(roomId: string, playerToken: string) {
    return guestHttp.get<{ ok: boolean; data: { room: RoomState } }>(`/game/spy/rooms/${roomId}/state`, {
      params: { playerToken, t: Date.now() },
    });
  },

  getPublicRoomState(roomId: string) {
    return guestHttp.get<{ ok: boolean; data: { room: PublicRoomState } }>(`/game/spy/rooms/${roomId}/public`, {
      params: { t: Date.now() },
    });
  },

  submitRoomAction(
    roomId: string,
    playerToken: string,
    action: SpyGameActionName,
    payload: SpyGameActionBody = {},
  ) {
    return guestHttp.post<{ ok: boolean; data: SpyGameActionPayload }>(`/game/spy/rooms/${roomId}/actions`, {
      player_token: playerToken,
      playerToken,
      action,
      payload: payload || {},
    });
  },

  getWebSocketUrl(roomId: string, playerToken: string) {
    return buildWebSocketUrl(`/break/game/spy/ws/room/${roomId}`, {
      playerToken,
    });
  },

  getPublicWebSocketUrl(roomId: string) {
    return buildWebSocketUrl(`/break/game/spy/ws/public/${roomId}`);
  },
};
