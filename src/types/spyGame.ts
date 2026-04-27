export type SpyGameRole = "civilian" | "spy" | "whiteboard";

export type SpyGamePhase =
  | "lobby"
  | "speaking"
  | "voting"
  | "tie_speaking"
  | "tie_voting"
  | "finished";

export type SpyGameMode = "reverse" | "whiteboard";

export type SpyGameAvatar = {
  type: "qq" | "guest" | "placeholder";
  text: string;
  color: string;
  url: string;
};

export type SpyGameSongCard = {
  id: string;
  title: string;
  type: string;
  artist: string;
  genre: string;
  version: string;
  bpm?: number | string | null;
  levels: string[];
  ds: number[];
  maxDs: number;
  cover: string;
  charts?: Array<{
    notes?: number[];
    charter?: string;
    dxscore?: number;
  }>;
};

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: SpyGameAvatar;
  isOwner: boolean;
  isGuest: boolean;
  isSelf: boolean;
  isEliminated: boolean;
  isConnected: boolean;
};

export type SpyGameSettings = {
  mode: SpyGameMode;
  minDs: number;
  maxDs: number;
  versions: string[];
};

export type SpyGameSpeech = {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  isSkip: boolean;
  round: number;
};

export type SpyGameChatMessage = {
  id: string;
  playerId?: string | null;
  playerName: string;
  text: string;
  system: boolean;
};

export type RoomState = {
  roomId: string;
  ownerId: string;
  status: SpyGamePhase;
  settings: SpyGameSettings;
  playerCount: number;
  maxPlayers?: number;
  minPlayers?: number;
  players: RoomPlayer[];
  round: number;
  turnOrder: string[];
  currentSpeakerId: string | null;
  tieCandidates: string[];
  tieSpeakerId: string | null;
  speeches: SpyGameSpeech[];
  chatMessages: SpyGameChatMessage[];
  winner: "civilian" | "spy" | null;
  winnerReason: string;
  votes?: {
    submittedPlayerIds?: string[];
    tieSubmittedPlayerIds?: string[];
    tally?: Record<string, number>;
    tieTally?: Record<string, number>;
    result?: {
      phase?: "voting" | "tie_voting";
      eliminatedPlayerId?: string | null;
      abstainCount?: number;
      tally?: Record<string, number>;
    } | null;
  };
  revealedCards: Record<string, { role: SpyGameRole; card: SpyGameSongCard | null }> | null;
  me: {
    id: string | null;
    name: string;
    isOwner: boolean;
    isEliminated: boolean;
    secretRole: SpyGameRole | null;
    songCard: SpyGameSongCard | null;
    canSpeak: boolean;
    canVote: boolean;
  };
};

export type PublicRoomState = {
  roomId: string;
  status: SpyGamePhase;
  playerCount: number;
  players: Array<{
    id: string;
    name: string;
    avatar: SpyGameAvatar;
    isOwner: boolean;
    isConnected: boolean;
  }>;
};

export type SpyGameJoinPayload = {
  roomId: string;
  playerId: string;
  playerToken: string;
  room: RoomState;
};

export type SpyGameActionPayload = {
  room?: RoomState;
};

export type SpyGameActionName =
  | "ping"
  | "update_settings"
  | "start_game"
  | "speech_submit"
  | "chat_send"
  | "vote_submit"
  | "kick_player"
  | "leave_room"
  | "restart_game";

export type SpyGameActionBody = Record<string, unknown>;

export type SpySocketMessage =
  | { type: "snapshot"; scope: "room"; payload: RoomState }
  | { type: "snapshot"; scope: "public"; payload: PublicRoomState }
  | { type: "ack"; requestId?: string; action?: string }
  | { type: "error"; message?: string; status?: number; requestId?: string };
