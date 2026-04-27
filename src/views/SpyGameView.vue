<template>
  <div class="spy-page">
    <div v-if="showFireworks" class="fireworks-layer" aria-hidden="true">
      <span v-for="item in 18" :key="item" class="firework"></span>
    </div>
    <div v-if="!activeRoomId && backgroundCovers.length" class="film-bg" :class="{ ready: backgroundFlowReady }" aria-hidden="true">
      <div class="film-row film-row-top">
        <div class="film-track">
          <div v-for="(cover, index) in repeatedTopBackgroundCovers" :key="`top-${index}`" class="film-frame">
            <img :src="cover" alt="" />
          </div>
        </div>
      </div>
      <div class="film-row film-row-bottom">
        <div class="film-track film-track-reverse">
          <div v-for="(cover, index) in repeatedBottomBackgroundCovers" :key="`bottom-${index}`" class="film-frame">
            <img :src="cover" alt="" />
          </div>
        </div>
      </div>
    </div>

    <div class="page-shell">
      <header class="page-topbar">
        <button class="back-btn" @click="handleTopLeftAction">
          {{ activeRoomId ? "退出房间" : "←返回主页" }}
        </button>
        <div class="topbar-actions">
          <div v-if="roomState && roomState.status !== 'lobby'" class="top-room-tools">
            <span class="top-room-id">房间 {{ roomState.roomId }}</span>
            <button class="mini-invite-btn" @click="copyInviteLink">邀请</button>
          </div>
          <button class="rules-btn" @click="showRules = true">?</button>
        </div>
      </header>

      <section v-if="!activeRoomId" class="entry-stage">
        <div class="hero-card">
          <h1 class="hero-title">
            谁是假舞萌痴
            <span class="hero-punct punct-question">？</span>
            <span class="hero-punct punct-exclaim">！</span>
          </h1>
          <p class="hero-subtitle">找出拿到不同歌曲卡的卧底，在发言和投票中活到最后。</p>

          <div class="entry-profile">
            <img class="entry-avatar" :src="entryAvatarUrl" alt="avatar" />
            <label class="entry-name-field">
              <span>游戏昵称</span>
              <input
                v-model.trim="joinDisplayName"
                type="text"
                maxlength="16"
                placeholder="输入房间内显示的昵称"
              />
            </label>
          </div>

          <div class="entry-actions">
            <button class="primary-btn" :disabled="!authStore.isLoggedIn" @click="handleCreateRoom">
              创建房间
            </button>
            <button class="secondary-btn" @click="showJoinModal = true">
              加入房间
            </button>
          </div>

          <p v-if="!authStore.isLoggedIn" class="entry-tip">
            未登录玩家可以加入房间；创建房间需要先登录。
          </p>
        </div>
      </section>

      <section v-else-if="roomState" class="room-stage">
        <div v-if="roomState.status === 'lobby'" class="room-header">
          <div class="room-header-spacer"></div>
          <div class="room-title-wrap">
            <h2 class="room-title">房间 {{ roomState.roomId }}</h2>
          </div>
          <button class="primary-btn invite-btn" @click="copyInviteLink">邀请玩家</button>
        </div>

        <div class="player-strip" :class="{ compact: roomState.status !== 'lobby' }">
          <button
            v-for="player in displayedPlayers"
            :key="player.id"
            class="player-chip"
            :class="{
              placeholder: player.isPlaceholder,
              owner: player.isOwner,
              self: player.isSelf,
              eliminated: player.isEliminated,
              offline: !player.isConnected,
            }"
            :disabled="player.isPlaceholder"
            @click="!player.isPlaceholder && (selectedPlayer = player)"
          >
            <div
              v-if="player.isPlaceholder"
              class="player-avatar placeholder-avatar"
            >
              +
            </div>
            <img v-else-if="getAvatarImageUrl(player)" class="player-avatar" :src="getAvatarImageUrl(player)" alt="avatar" />
            <div
              v-else-if="player.avatar.type === 'guest'"
              class="player-avatar guest-avatar"
              :style="{ background: player.avatar.color }"
            >
              {{ player.avatar.text }}
            </div>
            <span class="player-name" :title="player.name">
              <span v-if="player.isOwner" class="owner-crown">👑</span>
              {{ player.name }}
            </span>
          </button>
        </div>

        <div class="status-bar">
          <span class="status-pill">阶段：{{ phaseLabel }}</span>
          <span class="status-pill">人数：{{ roomState.playerCount }}/16</span>
          <span class="status-pill">第 {{ roomState.round || 0 }} 轮</span>
          <span class="status-pill" v-if="roomState.currentSpeakerId">
            当前发言：{{ getPlayerName(roomState.currentSpeakerId) }}
          </span>
        </div>

        <div class="room-grid">
          <section class="main-column">
            <div ref="endgameResultRef" v-if="roomState.me.songCard || roomState.status !== 'lobby'" tabindex="-1" class="panel my-card-panel" :class="{ finished: roomState.status === 'finished' }">
              <div v-if="roomState.status === 'finished'" class="endgame-summary">
                <div class="endgame-head">
                  <div class="outcome-strip" :class="{ lose: !didWinGame }">
                    {{ didWinGame ? "你赢了" : "你输了" }}
                  </div>
                  <div v-if="roomState.me.isOwner" class="endgame-owner-actions">
                    <button class="primary-btn compact-action" @click="restartGame">重新开始</button>
                    <button class="secondary-btn compact-action" @click="showEndgameSettings = !showEndgameSettings">
                      {{ showEndgameSettings ? "收起设置" : "调整设置" }}
                    </button>
                  </div>
                </div>
                <div v-if="roomState.me.isOwner && showEndgameSettings" class="endgame-settings settings-grid">
                  <label class="field">
                    <span>游戏模式</span>
                    <select v-model="draftSettings.mode">
                      <option value="reverse">反串模式</option>
                      <option value="whiteboard">白板模式</option>
                    </select>
                  </label>

                  <label class="field">
                    <span>最低定数</span>
                    <input v-model.number="draftSettings.minDs" type="number" min="1" max="15" step="0.1" />
                  </label>

                  <label class="field">
                    <span>最高定数</span>
                    <input v-model.number="draftSettings.maxDs" type="number" min="1" max="15" step="0.1" />
                  </label>

                  <label class="field field-wide">
                    <span>版本范围</span>
                    <div class="version-toolbar">
                      <button type="button" class="tiny-btn" @click="selectAllVersions">全选</button>
                      <button type="button" class="tiny-btn" @click="clearAllVersions">全不选</button>
                    </div>
                    <div class="version-checkbox-grid">
                      <label v-for="version in versionOptions" :key="version" class="version-check">
                        <input v-model="draftSettings.versions" type="checkbox" :value="version" />
                        <span>{{ version }}</span>
                      </label>
                    </div>
                  </label>

                  <div class="lobby-actions field-wide">
                    <button class="secondary-btn" @click="syncRoomSettings">保存设置</button>
                    <button class="primary-btn" @click="restartGame">按此设置重新开始</button>
                  </div>
                </div>
                <div class="endgame-meta">
                  <section class="role-board">
                    <div>
                      <strong>平民</strong>
                      <span>{{ civilianNames }}</span>
                    </div>
                    <div>
                      <strong>卧底</strong>
                      <span>{{ spyNames }}</span>
                    </div>
                  </section>
                </div>
                <div class="final-song-row">
                  <article v-if="civilianSongCard" class="final-song-card civilian-song">
                    <img :src="civilianSongCard.cover" alt="cover" />
                    <div>
                      <span>平民歌曲</span>
                      <strong>{{ civilianSongCard.title }}</strong>
                      <div class="final-ds-row">
                        <span v-for="badge in songDsBadges(civilianSongCard)" :key="badge.key" class="ds-badge" :class="badge.className">
                          {{ badge.text }}
                        </span>
                      </div>
                    </div>
                  </article>
                  <article v-if="spySongCard" class="final-song-card spy-song">
                    <img :src="spySongCard.cover" alt="cover" />
                    <div>
                      <span>卧底歌曲</span>
                      <strong>{{ spySongCard.title }}</strong>
                      <div class="final-ds-row">
                        <span v-for="badge in songDsBadges(spySongCard)" :key="badge.key" class="ds-badge" :class="badge.className">
                          {{ badge.text }}
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              </div>
              <template v-else>
              <div class="panel-head">
                <h3>我的歌曲卡</h3>
              </div>
              <div v-if="!roomState.me.songCard" class="whiteboard-card">
                你是卧底，无法得到任何信息，请根据其他玩家的发言猜测答案。
              </div>
              <div v-else-if="roomState.me.songCard" class="self-card-body">
                <img class="self-card-cover" :src="roomState.me.songCard.cover" alt="cover" />
                <div class="self-card-info">
                  <strong>{{ roomState.me.songCard.title }}</strong>
                  <span>{{ roomState.me.songCard.artist }}</span>
                  <span>{{ roomState.me.songCard.version }} / {{ roomState.me.songCard.type }} / BPM {{ roomState.me.songCard.bpm || "-" }}</span>
                  <div class="difficulty-details">
                    <div v-for="row in selfCardDifficultyRows" :key="row.key" class="difficulty-detail-row">
                      <span class="ds-badge" :class="[row.badgeClass, { wide: row.charter }]">
                        <span>{{ row.ds }}</span>
                        <small v-if="row.charter">{{ row.charter }}</small>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="pending-card">游戏开始后会在这里显示你的歌曲卡。</div>
              </template>
            </div>

            <div v-if="roomState.status === 'lobby'" class="panel lobby-panel">
              <div class="panel-head">
                <h3>房间准备</h3>
                <span>至少 3 人，最多 16 人</span>
              </div>

              <div v-if="roomState.me.isOwner" class="settings-grid">
                <label class="field">
                  <span>游戏模式</span>
                  <select v-model="draftSettings.mode">
                    <option value="reverse">反串模式</option>
                    <option value="whiteboard">白板模式</option>
                  </select>
                </label>

                <label class="field">
                  <span>最低定数</span>
                  <input v-model.number="draftSettings.minDs" type="number" min="1" max="15" step="0.1" />
                </label>

                <label class="field">
                  <span>最高定数</span>
                  <input v-model.number="draftSettings.maxDs" type="number" min="1" max="15" step="0.1" />
                </label>

                <label class="field field-wide">
                  <span>版本范围</span>
                  <div class="version-toolbar">
                    <button type="button" class="tiny-btn" @click="selectAllVersions">全选</button>
                    <button type="button" class="tiny-btn" @click="clearAllVersions">全不选</button>
                  </div>
                  <div class="version-checkbox-grid">
                    <label v-for="version in versionOptions" :key="version" class="version-check">
                      <input v-model="draftSettings.versions" type="checkbox" :value="version" />
                      <span>{{ version }}</span>
                    </label>
                  </div>
                </label>

                <div class="lobby-actions">
                  <button class="secondary-btn" @click="syncRoomSettings">同步设置</button>
                  <button class="primary-btn start-btn" :class="{ disabled: roomState.playerCount < 3 }" :disabled="roomState.playerCount < 3" @click="startGame">
                    开始游戏
                  </button>
                </div>
              </div>

              <div v-else class="waiting-text">
                房主正在设置歌曲范围，请稍候开始。
              </div>
            </div>

            <div v-else class="panel communication-panel">
              <div class="communication-grid">
                <section class="message-zone speech-zone" :class="{ locked: !roomState.me.canSpeak }">
                  <div class="message-list">
                    <article v-if="activeSpeakerId" class="message-item speaking-now-item">
                      <img class="message-avatar" :src="getPlayerAvatarById(activeSpeakerId)" alt="avatar" />
                      <div class="message-bubble">
                        <div class="message-meta">
                          <strong>{{ getPlayerName(activeSpeakerId) }}</strong>
                          <span>正在发言</span>
                        </div>
                        <div class="speaking-now-line">
                          <span>轮到 {{ getPlayerName(activeSpeakerId) }} 发言</span>
                          <span class="typing-dots" aria-hidden="true">
                            <i></i>
                            <i></i>
                            <i></i>
                          </span>
                        </div>
                      </div>
                    </article>
                    <article v-for="speech in roomState.speeches" :key="speech.id" class="message-item" :class="{ 'skip-message': speech.isSkip }">
                      <img class="message-avatar" :src="getPlayerAvatarById(speech.playerId)" alt="avatar" />
                      <div class="message-bubble">
                        <div class="message-meta">
                          <strong>{{ speech.playerName }}</strong>
                          <span>第 {{ speech.round }} 轮</span>
                        </div>
                        <p v-if="speech.isSkip" class="skip-copy">
                          <span class="skip-badge">跳过发言</span>
                          <span>{{ speech.text || "该玩家跳过了发言" }}</span>
                        </p>
                        <p v-else>{{ speech.text }}</p>
                      </div>
                    </article>
                    <div v-if="!roomState.speeches.length" class="empty-copy">本轮还没有发言。</div>
                  </div>

                  <div class="speech-form">
                    <textarea
                      v-model.trim="speechDraft"
                      :disabled="!roomState.me.canSpeak"
                      :placeholder="roomState.me.canSpeak ? (roomState.status === 'tie_speaking' ? '请输入你的加赛发言' : '请输入你的本轮发言') : '还没有轮到你发言'"
                      maxlength="60"
                    ></textarea>
                    <div class="speech-actions">
                      <button class="secondary-btn" :disabled="!roomState.me.canSpeak" @click="submitSpeech(true)">跳过发言</button>
                      <button class="primary-btn" :disabled="!roomState.me.canSpeak" @click="submitSpeech(false)">提交发言</button>
                    </div>
                  </div>
                </section>

                <section class="message-zone chat-zone">
                  <div class="message-list">
                    <article
                      v-for="message in roomState.chatMessages"
                      :key="message.id"
                      class="message-item chat-message"
                      :class="{ system: message.system }"
                    >
                      <img v-if="!message.system" class="message-avatar" :src="getPlayerAvatarById(message.playerId || null)" alt="avatar" />
                      <div class="message-bubble">
                        <div class="message-meta">
                          <strong>{{ message.system ? "系统" : message.playerName }}</strong>
                        </div>
                        <p>{{ message.text }}</p>
                      </div>
                    </article>
                  </div>
                  <div class="chat-form">
                    <input
                      v-model.trim="chatDraft"
                      type="text"
                      maxlength="50"
                      placeholder="发送一条闲聊消息"
                      @keyup.enter="sendChat"
                    />
                    <button class="primary-btn" @click="sendChat">发送</button>
                  </div>
                </section>
              </div>

            </div>
          </section>

        </div>
      </section>

      <section v-else-if="activeRoomId" class="room-stage room-preview-stage">
        <div class="room-header">
          <div class="room-header-spacer"></div>
          <div class="room-title-wrap">
            <h2 class="room-title">房间 {{ activeRoomId }}</h2>
          </div>
          <button class="primary-btn invite-btn" @click="copyRouteInviteLink">邀请玩家</button>
        </div>

        <div class="player-strip">
          <button
            v-for="player in publicDisplayedPlayers"
            :key="player.id"
            class="player-chip"
            :class="{
              placeholder: player.isPlaceholder,
              owner: player.isOwner,
              offline: !player.isPlaceholder && !player.isConnected,
            }"
            :disabled="player.isPlaceholder"
            @click="!player.isPlaceholder && (selectedPlayer = player)"
          >
            <div
              v-if="player.isPlaceholder"
              class="player-avatar placeholder-avatar"
            >
              +
            </div>
            <img v-else-if="getAvatarImageUrl(player)" class="player-avatar" :src="getAvatarImageUrl(player)" alt="avatar" />
            <div
              v-else-if="player.avatar.type === 'guest'"
              class="player-avatar guest-avatar"
              :style="{ background: player.avatar.color }"
            >
              {{ player.avatar.text }}
            </div>
            <span class="player-name" :title="player.name">
              <span v-if="player.isOwner" class="owner-crown">👑</span>
              {{ player.name }}
            </span>
          </button>
        </div>
      </section>
    </div>

    <transition name="fade">
      <div v-if="showRules" class="modal-overlay" @click="showRules = false">
        <div class="modal-card rules-card" @click.stop>
          <button class="close-icon" @click="showRules = false">×</button>
          <h3>游戏规则</h3>
          <div class="rules-copy">
            <p>1. 房主创建房间后可设置歌曲版本和最高定数范围，满 3 人即可开始。</p>
            <p>2. 开局后所有玩家会收到一张私密歌曲卡，卧底拿到不同歌曲；白板模式中会有一名白板拿不到歌曲卡。</p>
            <p>3. 系统会随机打乱发言顺序，玩家依次进行一条发言，也可以直接跳过，理由可不填。</p>
            <p>4. 发言结束后所有存活玩家投票；弃票过半或超过最高票数时，本轮作废。</p>
            <p>5. 若最高票出现平票，平票玩家进入加赛发言，再由其他玩家进行加赛投票。</p>
            <p>6. 所有卧底出局则平民获胜；卧底人数追平或超过平民人数时，卧底获胜。</p>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showJoinModal" class="modal-overlay" @click="showJoinModal = false">
        <div class="modal-card" @click.stop>
          <button class="close-icon" @click="showJoinModal = false">×</button>
          <h3>加入房间</h3>
          <div class="modal-form">
            <input v-model.trim="joinRoomInput" type="text" maxlength="4" placeholder="输入四位房间 ID" />
            <button class="primary-btn" @click="goToJoinRoom">进入房间</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showGuestJoinPrompt" class="modal-overlay">
        <div class="modal-card" @click.stop>
          <button class="close-icon" @click="cancelGuestJoin">×</button>
          <h3>加入房间 {{ activeRoomId }}</h3>
          <div class="modal-form">
            <img class="modal-player-avatar" :src="entryAvatarUrl" alt="avatar" />
            <input
              v-model.trim="joinDisplayName"
              type="text"
              maxlength="16"
              placeholder="输入加入游戏使用的昵称"
              @keyup.enter="joinCurrentRoom"
            />
            <button class="primary-btn" :disabled="isJoiningRoom" @click="joinCurrentRoom">进入房间</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="showVoteModal && roomState" class="modal-overlay">
        <div class="modal-card vote-modal" @click.stop>
          <h3>{{ voteModalTitle }}</h3>
          <p class="vote-progress">已投票 {{ voteSubmittedCount }}/{{ voteEligibleCount }}</p>
          <div class="vote-modal-grid">
            <button
              v-for="player in voteTargets"
              :key="player.id"
              class="vote-player-btn"
              :disabled="!roomState?.me.canVote"
              @click="submitVote(player.id)"
            >
              <img class="vote-player-avatar" :src="getAvatarImageUrl(player) || GUEST_AVATAR_URL" alt="avatar" />
              <span>{{ player.name }}</span>
              <div class="vote-token-row" aria-hidden="true">
                <span
                  v-for="index in getVoteMarkerCount(player.id)"
                  :key="`${player.id}-${index}`"
                  class="vote-token"
                  :style="{ animationDelay: `${Math.min(index - 1, 8) * 0.05}s` }"
                ></span>
              </div>
            </button>
          </div>
          <button
            v-if="isRegularVoting"
            class="vote-abstain-btn"
            :disabled="!roomState?.me.canVote"
            @click="submitVote('abstain')"
          >
            弃票
          </button>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="selectedPlayer" class="modal-overlay" @click="selectedPlayer = null">
        <div class="modal-card player-card-modal" @click.stop>
          <button class="close-icon" @click="selectedPlayer = null">×</button>
          <img
            v-if="getAvatarImageUrl(selectedPlayer)"
            class="player-modal-avatar"
            :src="getAvatarImageUrl(selectedPlayer)"
            alt="avatar"
          />
          <div
            v-else-if="selectedPlayer.avatar.type === 'guest'"
            class="player-modal-avatar guest-avatar"
            :style="{ background: selectedPlayer.avatar.color }"
          >
            {{ selectedPlayer.avatar.text }}
          </div>
          <div v-else class="player-modal-avatar guest-avatar">?</div>
          <h3>{{ selectedPlayer.name }}</h3>
          <p>{{ selectedPlayer.isOwner ? "房主" : "房间玩家" }}</p>
          <button
            v-if="canKickSelectedPlayer"
            class="danger-btn"
            @click="kickSelectedPlayer"
          >
            踢出玩家
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import Swal from "sweetalert2";
import { spyGameApi } from "@/api/spyGame";
import { maimaiApi, type MaimaiSongEntry } from "@/api/maimai";
import { useAuthStore } from "@/stores/auth";
import { useSpyGameStore, type RoomPlayer } from "@/stores/spyGame";
import type { SpyGameActionBody, SpyGameActionName, SpyGameMode, SpyGameRole, SpyGameSongCard } from "@/types/spyGame";
import http from "@/utils/http";

type DisplayedRoomPlayer = RoomPlayer & { isPlaceholder?: boolean };

const GUEST_AVATAR_URL = "https://assets.breakdx.net/maimai/icon/UI_Icon_106004.png";
const BACKGROUND_COVER_TARGET = 12;
const BACKGROUND_COVER_POOL_SIZE = 36;
const BACKGROUND_COVER_TIMEOUT_MS = 4500;

const authStore = useAuthStore();
const spyGameStore = useSpyGameStore();
const route = useRoute();
const router = useRouter();
const { roomState, publicRoom, socketErrorMessage } = storeToRefs(spyGameStore);

const showRules = ref(false);
const showJoinModal = ref(false);
const showGuestJoinPrompt = ref(false);
const showVoteModal = ref(false);
const showEndgameSettings = ref(false);
const joinRoomInput = ref("");
const joinDisplayName = ref("");
const speechDraft = ref("");
const chatDraft = ref("");
const selectedPlayer = ref<RoomPlayer | null>(null);
const endgameResultRef = ref<HTMLElement | null>(null);
const versionOptions = ref<string[]>([]);
const backgroundCovers = ref<string[]>([]);
const backgroundFlowReady = ref(false);
const profileName = ref("");
const previousTheme = ref<string | null>(null);
const isJoiningRoom = ref(false);
const isShowingRoomNotFound = ref(false);
let voteCloseTimer: number | null = null;

const draftSettings = reactive({
  mode: "reverse" as SpyGameMode,
  minDs: 14.0,
  maxDs: 15.0,
  versions: [] as string[],
});

const activeRoomId = computed(() => String(route.params.roomId || "").trim().toLowerCase());
const forceGuestMode = computed(() => route.query.guest === "1");
const shouldJoinAsGuest = computed(() => forceGuestMode.value || !authStore.isLoggedIn);
const entryAvatarUrl = computed(() => {
  if (!shouldJoinAsGuest.value && authStore.qq) {
    return `http://q1.qlogo.cn/g?b=qq&nk=${authStore.qq}&s=100`;
  }
  return GUEST_AVATAR_URL;
});
const repeatedTopBackgroundCovers = computed(() => [...backgroundCovers.value, ...backgroundCovers.value]);
const repeatedBottomBackgroundCovers = computed(() => [...backgroundCovers.value, ...backgroundCovers.value]);

const publicDisplayedPlayers = computed<DisplayedRoomPlayer[]>(() => {
  const players = (publicRoom.value?.players || []).map((player) => ({
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    isOwner: !!player.isOwner,
    isGuest: player.avatar?.type === "guest",
    isSelf: false,
    isEliminated: false,
    isConnected: player.isConnected,
  }));
  const placeholdersNeeded = Math.max(0, 3 - players.length);
  const placeholders: DisplayedRoomPlayer[] = Array.from({ length: placeholdersNeeded }, (_, index) => ({
    id: `public-placeholder-${index}`,
    name: "等待加入",
    avatar: { type: "placeholder" as const, text: "+", color: "", url: "" },
    isOwner: false,
    isGuest: true,
    isSelf: false,
    isEliminated: false,
    isConnected: false,
    isPlaceholder: true,
  }));
  return [...players, ...placeholders];
});

const displayedPlayers = computed<DisplayedRoomPlayer[]>(() => {
  const roomPlayers = roomState.value?.players || [];
  const fallbackPlayers = (publicRoom.value?.players || []).map((player) => ({
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    isOwner: !!player.isOwner,
    isGuest: player.avatar?.type === "guest",
    isSelf: roomState.value?.me.id === player.id,
    isEliminated: false,
    isConnected: player.isConnected,
  }));
  const basePlayers = roomPlayers.length ? roomPlayers : fallbackPlayers;
  const players = roomState.value && roomState.value.status !== "lobby"
    ? orderPlayersBySpeakingOrder(basePlayers)
    : basePlayers;
  const placeholdersNeeded = Math.max(0, 3 - players.length);
  const placeholders: DisplayedRoomPlayer[] = Array.from({ length: placeholdersNeeded }, (_, index) => ({
    id: `placeholder-${index}`,
    name: "等待加入",
    avatar: { type: "placeholder" as const, text: "+", color: "", url: "" },
    isOwner: false,
    isGuest: true,
    isSelf: false,
    isEliminated: false,
    isConnected: false,
    isPlaceholder: true,
  }));
  return [...players, ...placeholders];
});

const orderPlayersBySpeakingOrder = (players: RoomPlayer[]) => {
  const order = roomState.value?.turnOrder || [];
  if (!order.length) return players;
  const orderIndex = new Map(order.map((playerId, index) => [playerId, index]));
  return [...players].sort((left, right) => {
    const leftIndex = orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER;
    if (leftIndex !== rightIndex) return leftIndex - rightIndex;
    return 0;
  });
};

const phaseLabel = computed(() => {
  if (!roomState.value) return "";
  const labels: Record<string, string> = {
    lobby: "准备中",
    speaking: "发言中",
    voting: "投票中",
    tie_speaking: "加赛发言",
    tie_voting: "加赛投票",
    finished: "已结束",
  };
  return labels[roomState.value.status] || roomState.value.status;
});

const isVotingPhase = computed(() => roomState.value?.status === "voting" || roomState.value?.status === "tie_voting");
const isRegularVoting = computed(() => roomState.value?.status === "voting");
const voteModalTitle = computed(() => {
  if (!isVotingPhase.value) return "投票完成";
  return roomState.value?.status === "tie_voting" ? "加赛投票" : "本轮投票";
});
const voteSubmittedIds = computed(() => {
  if (!roomState.value) return [];
  return roomState.value.status === "tie_voting"
    ? (roomState.value.votes?.tieSubmittedPlayerIds || [])
    : (roomState.value.votes?.submittedPlayerIds || []);
});
const voteSubmittedCount = computed(() => voteSubmittedIds.value.length);
const voteEligibleCount = computed(() => {
  if (!roomState.value) return 0;
  const alivePlayers = roomState.value.players.filter((player) => !player.isEliminated);
  if (roomState.value.status === "tie_voting") {
    return alivePlayers.filter((player) => !roomState.value?.tieCandidates.includes(player.id)).length;
  }
  return alivePlayers.length;
});
const voteComplete = computed(() =>
  isVotingPhase.value && voteEligibleCount.value > 0 && voteSubmittedCount.value >= voteEligibleCount.value,
);

const activeSpeakerId = computed(() =>
  roomState.value?.currentSpeakerId || roomState.value?.tieSpeakerId || null,
);

const difficultyNames = ["绿", "黄", "红", "紫", "白"];
const difficultyBadgeClasses = ["ds-green", "ds-yellow", "ds-red", "ds-purple", "ds-white"];
const selfCardDifficultyRows = computed(() => {
  const card = roomState.value?.me.songCard;
  if (!card) return [];
  return difficultyNames
    .map((name, index) => {
      const ds = card.ds?.[index];
      const level = card.levels?.[index];
      const charter = index >= 2 ? card.charts?.[index]?.charter || "" : "";
      return {
        key: `${name}-${index}`,
        index,
        name,
        ds: ds === undefined ? (level || "-") : Number(ds).toFixed(1),
        badgeClass: difficultyBadgeClasses[index] || "ds-purple",
        charter,
      };
    })
    .filter((row) => row.ds !== "-" || row.charter);
});

const getRevealEntry = (playerId: string) => roomState.value?.revealedCards?.[playerId] || null;
const getPlayerSide = (role?: SpyGameRole | null) => role === "spy" || role === "whiteboard" ? "spy" : "civilian";
const myFinalRole = computed(() => roomState.value?.me.id ? getRevealEntry(roomState.value.me.id)?.role || null : null);
const didWinGame = computed(() => {
  if (!roomState.value?.winner || !myFinalRole.value) return false;
  return getPlayerSide(myFinalRole.value) === roomState.value.winner;
});
const showFireworks = computed(() => roomState.value?.status === "finished" && didWinGame.value);
const revealedPlayers = computed(() =>
  (roomState.value?.players || []).map((player) => ({
    player,
    reveal: getRevealEntry(player.id),
  })),
);
const civilianNames = computed(() =>
  revealedPlayers.value
    .filter((item) => item.reveal?.role === "civilian")
    .map((item) => item.player.name)
    .join("、") || "-",
);
const spyNames = computed(() =>
  revealedPlayers.value
    .filter((item) => getPlayerSide(item.reveal?.role) === "spy")
    .map((item) => `${item.player.name}${item.reveal?.role === "whiteboard" ? "（白板）" : ""}`)
    .join("、") || "-",
);
const uniqueSongByRole = (role: "civilian" | "spy") => {
  const entry = revealedPlayers.value.find((item) => item.reveal?.role === role && item.reveal.card);
  return entry?.reveal?.card || null;
};
const civilianSongCard = computed(() => uniqueSongByRole("civilian"));
const spySongCard = computed(() => uniqueSongByRole("spy"));
const songDsBadges = (card: SpyGameSongCard) =>
  [3, 4]
    .filter((index) => card.ds?.[index] !== undefined)
    .map((index) => ({
      key: `${card.id}-${index}`,
      text: Number(card.ds[index]).toFixed(1),
      className: difficultyBadgeClasses[index] || "ds-purple",
    }));
const voteTargets = computed(() => {
  if (!roomState.value) return [];
  const candidateIds = roomState.value.status === "tie_voting"
    ? roomState.value.tieCandidates
    : roomState.value.players.filter((player) => !player.isEliminated && !player.isSelf).map((player) => player.id);
  return roomState.value.players.filter((player) => candidateIds.includes(player.id));
});

const currentVoteTally = computed(() => {
  if (!roomState.value) return {};
  if (roomState.value.status === "tie_voting") {
    return roomState.value.votes?.tieTally || roomState.value.votes?.result?.tally || {};
  }
  return roomState.value.votes?.tally || roomState.value.votes?.result?.tally || {};
});

const getVoteMarkerCount = (playerId: string) => Math.max(0, Number(currentVoteTally.value[playerId] || 0));

const canKickSelectedPlayer = computed(() => {
  if (!roomState.value || !selectedPlayer.value) return false;
  return !!roomState.value.me.isOwner && !selectedPlayer.value.isSelf && selectedPlayer.value.id !== roomState.value.ownerId;
});

const getStoredSession = (roomId: string) => spyGameStore.getStoredSession(roomId, forceGuestMode.value);

const getPlayerName = (playerId: string) =>
  roomState.value?.players.find((player) => player.id === playerId)?.name || "未知玩家";

const getAvatarImageUrl = (player: RoomPlayer | null) => {
  if (!player || player.avatar.type === "placeholder") return "";
  if (player.avatar.url) return player.avatar.url;
  return player.isGuest ? GUEST_AVATAR_URL : "";
};

const getPlayerAvatarById = (playerId?: string | null) => {
  const player = roomState.value?.players.find((item) => item.id === playerId) || null;
  return getAvatarImageUrl(player) || GUEST_AVATAR_URL;
};

const normalizeRoomId = (roomId: string) => roomId.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4);
const normalizeDisplayName = (name: string) => name.trim().slice(0, 16);

const getGameDisplayName = () =>
  normalizeDisplayName(joinDisplayName.value || profileName.value || "");

const ensureGameDisplayName = async () => {
  const displayName = getGameDisplayName();
  if (displayName) {
    joinDisplayName.value = displayName;
    return displayName;
  }

  await Swal.fire({
    icon: "warning",
    title: "请先填写昵称",
    text: "昵称最多 16 个字，会作为你在游戏房间内显示的名字。",
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
  return "";
};

const syncDraftSettings = () => {
  if (!roomState.value) return;
  draftSettings.mode = roomState.value.settings.mode || "reverse";
  draftSettings.minDs = Number(roomState.value.settings.minDs || 14);
  draftSettings.maxDs = Number(roomState.value.settings.maxDs || 15);
  const roomVersions = roomState.value.settings.versions || [];
  draftSettings.versions = roomVersions.length ? [...roomVersions] : [...versionOptions.value];
};

const selectAllVersions = () => {
  draftSettings.versions = [...versionOptions.value];
};

const clearAllVersions = () => {
  draftSettings.versions = [];
};

type ApiErrorShape = {
  response?: {
    status?: number;
    data?: {
      detail?: unknown;
      message?: unknown;
    };
  };
};

const getApiErrorStatus = (error: unknown) => (error as ApiErrorShape).response?.status;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const payload = (error as ApiErrorShape).response?.data;
  if (typeof payload?.detail === "string") return payload.detail;
  if (typeof payload?.message === "string") return payload.message;
  return fallback;
};

const isRoomNotFoundError = (error: unknown) =>
  getApiErrorStatus(error) === 404 || getApiErrorMessage(error, "").includes("房间不存在");

const showRoomNotFoundAlert = async () => {
  if (isShowingRoomNotFound.value) return;
  isShowingRoomNotFound.value = true;
  const roomId = activeRoomId.value;
  showGuestJoinPrompt.value = false;
  if (roomId) {
    spyGameStore.clearRoomSession(roomId);
  } else {
    spyGameStore.resetRoomState();
  }

  await Swal.fire({
    icon: "error",
    title: "房间不存在",
    text: "该房间未创建或已经解散。",
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
  if (activeRoomId.value) {
    await router.replace("/game/spy");
  }
  isShowingRoomNotFound.value = false;
};

const goBackToPanel = async () => {
  await leaveRoom(false);
  await router.push("/panel");
};

const handleTopLeftAction = async () => {
  if (activeRoomId.value) {
    await leaveRoom();
    return;
  }
  await goBackToPanel();
};

const loadProfileName = async () => {
  if (!authStore.isLoggedIn) {
    profileName.value = "";
    return;
  }

  try {
    const res = await http.get("/auth/me");
    if (res.data?.ok) {
      profileName.value =
        res.data.data?.nickname || res.data.data?.username || `玩家${res.data.data?.qq || ""}`;
      joinDisplayName.value = profileName.value;
    }
  } catch {
    profileName.value = authStore.qq ? `玩家${authStore.qq}` : "";
    joinDisplayName.value = profileName.value;
  }
};

const preloadBackgroundCovers = (urls: string[], targetCount: number) =>
  new Promise<string[]>((resolve) => {
    if (!urls.length) {
      resolve([]);
      return;
    }

    const loadedUrls: string[] = [];
    const pendingImages: HTMLImageElement[] = [];
    let settledCount = 0;
    let finished = false;

    const cleanupImage = (image: HTMLImageElement) => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      pendingImages.forEach(cleanupImage);
      resolve(loadedUrls);
    };

    urls.forEach((url) => {
      const image = new Image();
      const timer = window.setTimeout(() => {
        if (finished) return;
        settledCount += 1;
        cleanupImage(image);
        if (settledCount >= urls.length || loadedUrls.length >= targetCount) finish();
      }, BACKGROUND_COVER_TIMEOUT_MS);

      pendingImages.push(image);
      image.decoding = "async";
      image.onload = () => {
        if (finished) return;
        window.clearTimeout(timer);
        loadedUrls.push(url);
        settledCount += 1;
        image.onload = null;
        image.onerror = null;
        if (loadedUrls.length >= targetCount || settledCount >= urls.length) finish();
      };
      image.onerror = () => {
        if (finished) return;
        window.clearTimeout(timer);
        settledCount += 1;
        cleanupImage(image);
        if (settledCount >= urls.length || loadedUrls.length >= targetCount) finish();
      };
      image.src = url;
    });
  });

const revealBackgroundFlow = async () => {
  await nextTick();
  window.requestAnimationFrame(() => {
    backgroundFlowReady.value = true;
  });
};

const loadBackgroundAssets = async () => {
  backgroundFlowReady.value = false;
  try {
    const data = await maimaiApi.getMusicData();
    const versionSet = new Set<string>();
    const candidateSongs = data.songs.filter((song: MaimaiSongEntry) => {
      const dsValues = (song.ds || []).map((item) => Number(item));
      const maxDs = dsValues.length ? Math.max(...dsValues) : 0;
      if (song.basic_info?.from) versionSet.add(song.basic_info.from);
      return maxDs >= 14;
    });

    versionOptions.value = Array.from(versionSet).sort();
    if (!draftSettings.versions.length) {
      selectAllVersions();
    }
    const shuffled = [...candidateSongs].sort(() => Math.random() - 0.5).slice(0, BACKGROUND_COVER_POOL_SIZE);
    const coverUrls = shuffled.map((song) => {
      const formattedId = String(song.id).slice(-4).padStart(6, "0");
      return `http://assets.breakdx.net/maimai/jacket/UI_Jacket_${formattedId}.png`;
    });
    backgroundCovers.value = await preloadBackgroundCovers(coverUrls, BACKGROUND_COVER_TARGET);
    if (backgroundCovers.value.length) {
      await revealBackgroundFlow();
    }
  } catch {
    backgroundCovers.value = [];
  }
};

const dispatchRoomMessage = async (type: SpyGameActionName, payload: SpyGameActionBody = {}) => {
  try {
    await spyGameStore.sendRoomMessage(type, payload);
    return true;
  } catch {
    // 只有真正无法建立连接（如已离开房间、房间不存在）才弹窗
    Swal.fire({
      icon: "warning",
      title: "连接未建立",
      text: "与房间的连接已断开，请返回主页重新进入房间。",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
    return false;
  }
};

const ensureRouteConnection = async () => {
  console.log("[SpyGameView] ensureRouteConnection:start", {
    activeRoomId: activeRoomId.value,
    forceGuestMode: forceGuestMode.value,
    isLoggedIn: authStore.isLoggedIn,
  });
  spyGameStore.resetRoomState();
  if (!activeRoomId.value) return;

  const stored = getStoredSession(activeRoomId.value);
  console.log("[SpyGameView] ensureRouteConnection:storedSession", stored);
  if (stored?.playerToken) {
    showGuestJoinPrompt.value = false;
    let nextPlayerToken = stored.playerToken;
    if (!forceGuestMode.value && authStore.isLoggedIn) {
      try {
        const res = await spyGameApi.joinRoom(activeRoomId.value, profileName.value || undefined);
        const payload = res.data.data;
        console.log("[SpyGameView] ensureRouteConnection:joinRoom refill", {
          roomId: payload.roomId,
          playerId: payload.playerId,
        });
        spyGameStore.setStoredSession(payload.roomId, false, {
          playerId: payload.playerId,
          playerToken: payload.playerToken,
        });
        if (payload.room) {
          spyGameStore.applyRoomState(payload.room);
        }
        nextPlayerToken = payload.playerToken;
      } catch {
        // HTTP 回填失败时继续尝试通过 WebSocket 恢复房间状态。
      }
    }
    spyGameStore.connectRoomSocket(activeRoomId.value, nextPlayerToken);
    return;
  }

  if (!shouldJoinAsGuest.value && getGameDisplayName()) {
    await joinCurrentRoom();
    return;
  }
  showGuestJoinPrompt.value = shouldJoinAsGuest.value;
  if (showGuestJoinPrompt.value) {
    spyGameStore.connectPublicRoomSocket(activeRoomId.value);
  }
};

const handleCreateRoom = async () => {
  if (!authStore.isLoggedIn) return;
  const displayName = await ensureGameDisplayName();
  if (!displayName) return;
  const res = await spyGameApi.createRoom(displayName);
  const payload = res.data.data;
  spyGameStore.setStoredSession(payload.roomId, false, {
    playerId: payload.playerId,
    playerToken: payload.playerToken,
  });
  await router.push(`/game/spy/${payload.roomId}`);
  showGuestJoinPrompt.value = false;
};

const goToJoinRoom = async () => {
  const roomId = normalizeRoomId(joinRoomInput.value);
  if (roomId.length !== 4) {
    Swal.fire({
      icon: "warning",
      title: "房间号无效",
      text: "请输入 4 位房间 ID。",
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
    return;
  }
  const displayName = await ensureGameDisplayName();
  if (!displayName) return;
  showJoinModal.value = false;
  await router.push(`/game/spy/${roomId}`);
};

const joinCurrentRoom = async () => {
  if (!activeRoomId.value || isJoiningRoom.value) return;
  isJoiningRoom.value = true;
  const displayName = await ensureGameDisplayName();
  if (!displayName) {
    isJoiningRoom.value = false;
    return;
  }

  try {
    const res =
      !shouldJoinAsGuest.value
        ? await spyGameApi.joinRoom(activeRoomId.value, displayName || undefined)
        : await spyGameApi.joinRoomAsGuest(activeRoomId.value, displayName || undefined);
    const payload = res.data.data;
    console.log("[SpyGameView] joinCurrentRoom", {
      roomId: payload.roomId,
      playerId: payload.playerId,
    });
    spyGameStore.setStoredSession(payload.roomId, forceGuestMode.value, {
      playerId: payload.playerId,
      playerToken: payload.playerToken,
    });
    if (payload.room) {
      spyGameStore.applyRoomState(payload.room);
    }
    showGuestJoinPrompt.value = false;
    spyGameStore.connectRoomSocket(payload.roomId, payload.playerToken);
  } catch (error) {
    if (isRoomNotFoundError(error)) {
      await showRoomNotFoundAlert();
      return;
    }
    Swal.fire({
      icon: "error",
      title: "加入失败",
      text: getApiErrorMessage(error, "暂时无法加入房间，请稍后重试。"),
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
  } finally {
    isJoiningRoom.value = false;
  }
};

const leaveRoom = async (goToLanding = true) => {
  const roomId = activeRoomId.value;

  if (roomId) {
    spyGameStore.clearStoredSession(roomId);
    spyGameStore.disconnectRoomSocket({ manual: true, sendLeave: true });
    spyGameStore.disconnectPublicRoomSocket({ manual: true });
  }
  showGuestJoinPrompt.value = false;
  spyGameStore.resetRoomState();
  if (goToLanding) {
    await router.push("/game/spy");
  }
};

const cancelGuestJoin = () => {
  showGuestJoinPrompt.value = false;
  void router.push("/game/spy");
};

const submitRoomSettings = () =>
  dispatchRoomMessage("update_settings", {
    mode: draftSettings.mode,
    minDs: draftSettings.minDs,
    maxDs: draftSettings.maxDs,
    versions: draftSettings.versions,
  });

const syncRoomSettings = () => {
  void submitRoomSettings();
};

const startGame = () => {
  syncRoomSettings();
  window.setTimeout(() => {
    void dispatchRoomMessage("start_game");
  }, 80);
};

const restartGame = async () => {
  if (!roomState.value?.me.isOwner) return;
  const saved = await submitRoomSettings();
  if (!saved) return;
  window.setTimeout(() => {
    void dispatchRoomMessage("restart_game");
  }, 80);
};

const submitSpeech = (skip: boolean) => {
  const speechText = speechDraft.value.trim();
  if (!skip && !speechText) return;
  void dispatchRoomMessage("speech_submit", {
    skip,
    text: speechText,
  }).then((ok) => {
    if (ok) {
      speechDraft.value = "";
    }
  });
};

const sendChat = () => {
  if (!chatDraft.value.trim()) return;
  void dispatchRoomMessage("chat_send", {
    text: chatDraft.value.trim().slice(0, 50),
  }).then((ok) => {
    if (ok) {
      chatDraft.value = "";
    }
  });
};

const submitVote = (targetId: string) => {
  void dispatchRoomMessage("vote_submit", { targetId });
};

const kickSelectedPlayer = async () => {
  if (!selectedPlayer.value) return;
  const result = await Swal.fire({
    icon: "warning",
    title: `确认踢出 ${selectedPlayer.value.name}？`,
    showCancelButton: true,
    confirmButtonText: "踢出",
    cancelButtonText: "取消",
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
  if (!result.isConfirmed) return;
  void dispatchRoomMessage("kick_player", { playerId: selectedPlayer.value.id }).then((ok) => {
    if (ok) {
      selectedPlayer.value = null;
    }
  });
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  }
};

const copyInviteLink = async () => {
  if (!roomState.value) return;
  const inviteLink = `${window.location.origin}/game/spy/${roomState.value.roomId}`;
  const ok = await copyText(inviteLink);
  Swal.fire({
    icon: ok ? "success" : "error",
    title: ok ? "邀请链接已复制" : "复制失败",
    toast: true,
    position: "top-end",
    timer: 1800,
    showConfirmButton: false,
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
};

const copyRouteInviteLink = async () => {
  if (!activeRoomId.value) return;
  const inviteLink = `${window.location.origin}/game/spy/${activeRoomId.value}`;
  const ok = await copyText(inviteLink);
  Swal.fire({
    icon: ok ? "success" : "error",
    title: ok ? "邀请链接已复制" : "复制失败",
    toast: true,
    position: "top-end",
    timer: 1800,
    showConfirmButton: false,
    background: "var(--surface-color)",
    color: "var(--text-main)",
  });
};

watch(
  () => roomState.value,
  (nextRoomState) => {
    if (nextRoomState) {
      syncDraftSettings();
    }
  },
  { deep: true },
);

watch(
  () => isVotingPhase.value,
  (voting) => {
    if (voting) {
      showVoteModal.value = true;
    } else if (showVoteModal.value) {
      if (voteCloseTimer !== null) window.clearTimeout(voteCloseTimer);
      voteCloseTimer = window.setTimeout(() => {
        showVoteModal.value = false;
        voteCloseTimer = null;
      }, 1000);
    }
  },
);

watch(
  () => voteComplete.value,
  (complete) => {
    if (!complete) return;
    if (voteCloseTimer !== null) window.clearTimeout(voteCloseTimer);
    voteCloseTimer = window.setTimeout(() => {
      showVoteModal.value = false;
      voteCloseTimer = null;
    }, 1000);
  },
);

watch(
  () => roomState.value?.status,
  async (nextStatus, previousStatus) => {
    if (nextStatus !== "finished" || (previousStatus !== "voting" && previousStatus !== "tie_voting")) return;
    await nextTick();
    endgameResultRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
    endgameResultRef.value?.focus({ preventScroll: true });
  },
);

watch(
  () => socketErrorMessage.value,
  (message) => {
    if (!message) return;
    if (message.includes("房间不存在")) {
      if (roomState.value?.roomId === activeRoomId.value) {
        spyGameStore.clearSocketError();
        return;
      }
      spyGameStore.clearSocketError();
      void showRoomNotFoundAlert();
      return;
    }
    Swal.fire({
      icon: "error",
      title: "操作失败",
      text: message,
      background: "var(--surface-color)",
      color: "var(--text-main)",
    });
    spyGameStore.clearSocketError();
  },
);

watch(
  () => activeRoomId.value,
  async () => {
    speechDraft.value = "";
    chatDraft.value = "";
    selectedPlayer.value = null;
    showVoteModal.value = false;
    showEndgameSettings.value = false;
    if (voteCloseTimer !== null) {
      window.clearTimeout(voteCloseTimer);
      voteCloseTimer = null;
    }
    showGuestJoinPrompt.value = false;
    spyGameStore.disconnectRoomSocket({ manual: true, sendLeave: false });
    spyGameStore.disconnectPublicRoomSocket({ manual: true });
    spyGameStore.resetRoomState();

    if (!activeRoomId.value) {
      return;
    }

    if (!joinDisplayName.value) {
      joinDisplayName.value = profileName.value;
    }

    await ensureRouteConnection();
  },
  { immediate: true },
);

watch(
  () => [profileName.value, forceGuestMode.value],
  async ([name, guestMode]) => {
    if (
      !name ||
      guestMode ||
      !activeRoomId.value ||
      roomState.value ||
      getStoredSession(activeRoomId.value) ||
      !authStore.isLoggedIn
    ) {
      return;
    }
    await ensureRouteConnection();
  },
);

onMounted(async () => {
  previousTheme.value = document.documentElement.getAttribute("data-theme");
  document.documentElement.setAttribute("data-theme", "light");
  await Promise.all([loadProfileName(), loadBackgroundAssets()]);
  if (activeRoomId.value && !joinDisplayName.value) {
    joinDisplayName.value = profileName.value;
  }
});

onBeforeUnmount(() => {
  if (voteCloseTimer !== null) {
    window.clearTimeout(voteCloseTimer);
    voteCloseTimer = null;
  }
  spyGameStore.disconnectRoomSocket({ manual: true, sendLeave: false });
  spyGameStore.disconnectPublicRoomSocket({ manual: true });
  if (previousTheme.value) {
    document.documentElement.setAttribute("data-theme", previousTheme.value);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
});
</script>

<style scoped>
.spy-page {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(255, 140, 0, 0.18), transparent 28%),
    radial-gradient(circle at bottom right, rgba(56, 189, 248, 0.16), transparent 30%),
    linear-gradient(180deg, rgba(244, 246, 248, 0.96), rgba(255, 255, 255, 0.94));
  overflow: hidden;
}

.fireworks-layer {
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
  overflow: hidden;
}

.firework {
  position: absolute;
  left: calc(var(--x, 50) * 1%);
  top: calc(var(--y, 45) * 1%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f97316;
  box-shadow:
    0 -34px #facc15,
    24px -24px #22c55e,
    34px 0 #38bdf8,
    24px 24px #a855f7,
    0 34px #ef4444,
    -24px 24px #14b8a6,
    -34px 0 #fb7185,
    -24px -24px #f59e0b;
  animation: firework-pop 1.35s ease-out infinite;
}

.firework:nth-child(3n) {
  --x: 24;
  --y: 28;
  animation-delay: 0.2s;
}

.firework:nth-child(3n + 1) {
  --x: 64;
  --y: 24;
  animation-delay: 0.55s;
}

.firework:nth-child(3n + 2) {
  --x: 48;
  --y: 38;
  animation-delay: 0.85s;
}

@keyframes firework-pop {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  35% {
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.film-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.film-bg.ready {
  opacity: 0.18;
}

.film-row {
  position: absolute;
  left: -12%;
  width: 124%;
  display: flex;
  overflow: hidden;
  --film-angle: -3deg;
  --film-enter-x: 115vw;
  transform: translate3d(var(--film-enter-x), 0, 0) rotate(var(--film-angle));
  transition: transform 820ms cubic-bezier(0.2, 0.82, 0.18, 1);
}

.film-bg.ready .film-row {
  transform: translate3d(0, 0, 0) rotate(var(--film-angle));
}

.film-row-top {
  top: 10%;
}

.film-row-bottom {
  top: 56%;
  --film-angle: 2.6deg;
  --film-enter-x: -115vw;
}

.film-track {
  display: flex;
  gap: clamp(10px, 1.4vw, 18px);
  min-width: max-content;
  animation: none;
}

.film-bg.ready .film-track {
  animation: scroll-film 36s linear 900ms infinite;
}

.film-track-reverse {
  transform: translateX(-50%);
}

.film-bg.ready .film-track-reverse {
  animation-name: scroll-film-reverse;
  animation-duration: 41s;
}

.film-frame {
  width: clamp(116px, 13vw, 180px);
  aspect-ratio: 1 / 1;
  flex: 0 0 auto;
  border-radius: clamp(12px, 1.3vw, 18px);
  overflow: hidden;
  border: clamp(4px, 0.45vw, 6px) solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.film-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes scroll-film {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes scroll-film-reverse {
  from {
    transform: translateX(-50%);
  }
  to {
    transform: translateX(0);
  }
}

.page-shell {
  position: relative;
  z-index: 1;
  width: min(1320px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 20px 0 32px;
}

.page-topbar,
.room-header,
.status-bar,
.entry-actions,
.speech-actions,
.chat-form,
.modal-actions,
.lobby-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-topbar {
  justify-content: space-between;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-room-tools {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px 5px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
}

.top-room-id {
  color: #0f172a;
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.mini-invite-btn {
  border: none;
  border-radius: 999px;
  background: #f97316;
  color: #fff;
  padding: 7px 11px;
  font: inherit;
  font-size: 0.84rem;
  font-weight: 800;
  cursor: pointer;
}

.back-btn,
.rules-btn,
.ghost-btn,
.primary-btn,
.secondary-btn,
.danger-btn {
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

.back-btn,
.ghost-btn,
.secondary-btn {
  background: rgba(255, 255, 255, 0.86);
  color: var(--text-main);
  border-radius: 999px;
  padding: 12px 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.primary-btn,
.danger-btn {
  color: #fff;
  border-radius: 999px;
  padding: 12px 20px;
  font-weight: 700;
}

.primary-btn {
  background: linear-gradient(135deg, #f97316, #fb923c);
  box-shadow: 0 12px 22px rgba(249, 115, 22, 0.2);
}

.start-btn.disabled {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  box-shadow: none;
  cursor: not-allowed;
}

.secondary-btn {
  font-weight: 700;
}

.danger-btn {
  background: linear-gradient(135deg, #ef4444, #f97316);
}

.rules-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: var(--text-main);
  font-size: 1.4rem;
  font-weight: 800;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.hero-card,
.join-card,
.panel,
.modal-card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(12px);
}

.entry-stage,
.join-stage {
  min-height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-card,
.join-card {
  width: min(760px, 100%);
  border-radius: 0;
  padding: 32px 12px;
  text-align: center;
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.6rem, 5vw, 4.6rem);
  font-weight: 900;
  letter-spacing: -0.06em;
  color: #0f172a;
}

.hero-punct {
  display: inline-block;
  margin-left: 6px;
  color: #f97316;
}

.punct-question {
  transform: rotate(-14deg) translateY(-8px);
}

.punct-exclaim {
  transform: rotate(12deg) translateY(-12px);
}

.hero-subtitle,
.entry-tip,
.panel-head span,
.waiting-text,
.rules-copy p,
.user-meta,
.pending-card,
.whiteboard-card,
.detail-copy {
  color: var(--text-muted);
  line-height: 1.7;
}

.hero-subtitle {
  margin: 18px auto 0;
  max-width: 520px;
  font-size: 1.05rem;
}

.entry-actions {
  justify-content: center;
  margin-top: 22px;
}

.entry-tip {
  margin-top: 16px;
}

.entry-profile {
  width: min(440px, 100%);
  margin: 24px auto 0;
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  text-align: left;
}

.entry-avatar,
.modal-player-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
}

.entry-name-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-name-field span {
  color: var(--text-muted);
  font-size: 0.92rem;
}

.entry-name-field input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-main);
  padding: 12px 14px;
  font: inherit;
}

.modal-player-avatar {
  margin: 0 auto;
}

.room-stage {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 18px;
  min-height: calc(100vh - 100px);
}

.room-header {
  justify-content: space-between;
  align-items: flex-start;
}

.room-header-spacer {
  width: 116px;
  flex: 0 0 116px;
}

.room-title-wrap {
  text-align: center;
  flex: 1;
}

.room-title {
  margin: 0;
  font-size: 2.15rem;
  letter-spacing: 0.08em;
  color: #0f172a;
}

.player-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
  gap: 16px;
}

.player-strip.compact {
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 8px;
}

.player-chip {
  border: none;
  background: transparent;
  border-radius: 20px;
  padding: 10px 6px;
  border: 1px dashed transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.player-strip.compact .player-chip {
  gap: 6px;
  padding: 6px 4px;
  border-radius: 14px;
}

.player-chip.owner {
  border-color: rgba(249, 115, 22, 0.34);
}

.player-chip.self {
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.18);
  background: rgba(255, 255, 255, 0.42);
}

.player-chip.eliminated {
  opacity: 0.52;
}

.player-chip.offline {
  filter: grayscale(0.3);
}

.player-chip.placeholder {
  cursor: default;
  opacity: 0.72;
}

.player-avatar,
.player-modal-avatar {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
}

.player-strip.compact .player-avatar {
  width: 42px;
  height: 42px;
  border-width: 2px;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.1);
}

.guest-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(15, 23, 42, 0.82);
  font-weight: 900;
}

.placeholder-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.52);
  color: rgba(100, 116, 139, 0.9);
  border-style: dashed;
  border-color: rgba(148, 163, 184, 0.5);
  font-size: 1.7rem;
  font-weight: 700;
}

.player-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 0.95rem;
}

.player-strip.compact .player-name {
  font-size: 0.78rem;
  line-height: 1.15;
}

.owner-crown {
  margin-right: 4px;
}

.status-bar {
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  font-size: 0.92rem;
}

.room-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  align-items: start;
}

.room-preview-stage .join-panel {
  width: min(560px, 100%);
}

.join-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.join-copy {
  margin: 0;
  color: var(--text-muted);
}

.join-submit-btn {
  align-self: flex-start;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.panel {
  border-radius: 28px;
  padding: 22px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.panel-head.small {
  margin-bottom: 10px;
}

.panel-head h3,
.panel-head h4,
.join-card h2,
.modal-card h3 {
  margin: 0;
}

.self-card-body {
  display: grid;
  grid-template-columns: 128px 1fr;
  gap: 14px;
  align-items: center;
}

.self-card-cover {
  width: 128px;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  object-fit: cover;
}

.self-card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.95rem;
}

.difficulty-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.difficulty-detail-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.difficulty-charter {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.ds-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 24px;
  border-radius: 7px;
  padding: 0 7px;
  color: #fff !important;
  font-weight: 900;
  font-size: 0.82rem;
  line-height: 1;
}

.ds-badge.wide {
  min-width: 128px;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 8px;
}

.ds-badge small {
  max-width: 82px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  font-size: 0.72rem;
  font-weight: 900;
  line-height: 1;
}

.ds-red.wide small {
  color: #dc2626 !important;
}

.ds-purple.wide small {
  color: #7e22ce !important;
}

.ds-white.wide small {
  color: #6b21a8 !important;
  background: rgba(255, 255, 255, 0.72);
}

.ds-green {
  background: #16a34a;
}

.ds-yellow {
  background: #ca8a04;
}

.ds-red {
  background: #dc2626;
}

.ds-purple {
  background: #7e22ce;
}

.ds-white {
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 48%, #c084fc 100%);
  color: #6b21a8 !important;
  border: 1px solid rgba(126, 34, 206, 0.26);
}

.my-card-panel.finished {
  background: rgba(255, 247, 237, 0.92);
}

.endgame-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.endgame-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.outcome-strip {
  align-self: flex-start;
  border-radius: 14px;
  background: #16a34a;
  color: #fff;
  padding: 8px 18px;
  font-size: 1.12rem;
  font-weight: 900;
}

.outcome-strip.lose {
  background: #dc2626;
}

.endgame-owner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.compact-action {
  padding: 9px 14px;
  font-size: 0.9rem;
}

.endgame-settings {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(249, 115, 22, 0.12);
  padding: 14px;
}

.endgame-meta {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
  gap: 10px;
}

.role-board {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(249, 115, 22, 0.12);
  padding: 12px;
}

.role-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.role-board div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.role-board strong {
  color: #9a3412;
}

.role-board span {
  color: var(--text-main);
  line-height: 1.5;
}

.final-song-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.final-song-card {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border-radius: 16px;
  background: rgba(240, 253, 244, 0.78);
  border: 1px solid rgba(34, 197, 94, 0.14);
  padding: 10px;
}

.final-song-card img {
  width: 84px;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
}

.final-song-card span {
  color: #166534;
  font-size: 0.82rem;
  font-weight: 800;
}

.final-song-card.spy-song {
  background: rgba(255, 228, 230, 0.72);
  border-color: rgba(244, 63, 94, 0.12);
}

.final-song-card.spy-song span {
  color: #9f1239;
}

.final-song-card strong {
  display: block;
  margin-top: 3px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.final-ds-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.whiteboard-card,
.pending-card {
  padding: 18px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.8);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-wide {
  grid-column: 1 / -1;
}

.field input,
.field select,
.join-card input,
.modal-form input,
.speech-form textarea,
.chat-form input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-main);
  padding: 12px 14px;
  font: inherit;
}

.version-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tiny-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-main);
  padding: 7px 12px;
  font: inherit;
  font-size: 0.86rem;
  cursor: pointer;
}

.version-checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  max-height: 190px;
  overflow-y: auto;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.62);
}

.version-check {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--text-main);
  font-size: 0.9rem;
}

.version-check input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.communication-panel {
  padding: 18px;
}

.communication-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.message-zone {
  display: flex;
  flex-direction: column;
  min-height: 420px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(248, 250, 252, 0.7);
  padding: 12px;
}

.message-zone.locked {
  opacity: 0.58;
  filter: grayscale(0.2);
}

.message-zone.locked textarea,
.message-zone.locked button {
  cursor: not-allowed;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 340px;
  overflow-y: auto;
  flex: 1;
}

.message-item,
.reveal-card {
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(248, 250, 252, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.message-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 8px;
  padding: 8px 10px;
  border-radius: 14px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.1);
}

.message-bubble {
  min-width: 0;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.message-meta strong {
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-item p {
  margin: 2px 0 0;
  color: var(--text-main);
  line-height: 1.45;
  font-size: 0.92rem;
  word-break: break-word;
}

.message-item.skip-message {
  background: linear-gradient(135deg, rgba(148, 163, 184, 0.14), rgba(255, 247, 237, 0.78));
  border: 1px dashed rgba(249, 115, 22, 0.32);
}

.skip-copy {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--text-muted) !important;
  font-size: 0.9rem;
  font-weight: 700;
}

.skip-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  border-radius: 999px;
  padding: 3px 9px;
  background: rgba(249, 115, 22, 0.14);
  color: #c2410c;
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1;
}

.speaking-now-item {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgba(255, 247, 237, 0.96);
  border-color: rgba(249, 115, 22, 0.28);
  box-shadow: 0 10px 18px rgba(249, 115, 22, 0.08);
}

.speaking-now-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
  color: #9a3412;
  font-weight: 800;
  font-size: 0.92rem;
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.typing-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #f97316;
  animation: typing-bounce 1s infinite ease-in-out;
}

.typing-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.speech-form {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.speech-form textarea {
  min-height: 76px;
  resize: vertical;
}

.reveal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.chat-message.system {
  background: rgba(255, 247, 237, 0.82);
  display: block;
}

.chat-form {
  margin-top: 10px;
}

.join-card input {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.92);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.54);
  backdrop-filter: blur(8px);
}

.modal-card {
  position: relative;
  width: min(520px, calc(100vw - 32px));
  border-radius: 28px;
  padding: 24px;
}

.rules-card {
  width: min(680px, calc(100vw - 32px));
}

.vote-modal {
  width: min(640px, calc(100vw - 32px));
}

.vote-modal h3 {
  text-align: center;
  margin-bottom: 8px;
}

.vote-progress {
  margin: 0 0 16px;
  text-align: center;
  color: var(--text-muted);
  font-weight: 800;
}

.vote-modal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 12px;
}

.vote-player-btn {
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.9);
  color: var(--text-main);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.vote-player-btn:disabled,
.vote-abstain-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.vote-player-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
}

.vote-player-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.9);
}

.vote-token-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  min-height: 18px;
  flex-wrap: wrap;
}

.vote-token {
  width: 13px;
  height: 13px;
  display: inline-block;
  background: #f97316;
  clip-path: polygon(50% 0, 67% 8%, 76% 25%, 70% 43%, 58% 52%, 79% 60%, 92% 78%, 96% 100%, 4% 100%, 8% 78%, 21% 60%, 42% 52%, 30% 43%, 24% 25%, 33% 8%);
  animation: vote-token-slide 0.28s ease-out both;
}

@keyframes vote-token-slide {
  from {
    transform: translateY(16px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.vote-abstain-btn {
  width: 100%;
  margin-top: 14px;
  border: none;
  border-radius: 16px;
  background: #dc2626;
  color: #fff;
  padding: 13px 16px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
}

.close-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.14);
  color: var(--text-main);
  font-size: 1.4rem;
  cursor: pointer;
}

.player-card-modal {
  text-align: center;
}

.player-modal-avatar {
  margin: 10px auto 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 980px) {
  .room-grid {
    grid-template-columns: 1fr;
  }

  .communication-grid {
    grid-template-columns: 1fr;
  }

  .endgame-meta,
  .final-song-row,
  .role-board {
    grid-template-columns: 1fr;
  }

  .self-card-body,
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: calc(100vw - 20px);
    padding-top: 14px;
  }

  .film-row-top {
    top: 14%;
  }

  .film-row-bottom {
    top: 66%;
  }

  .film-row {
    left: -24%;
    width: 148%;
    --film-enter-x: 130vw;
  }

  .film-row-bottom {
    --film-enter-x: -130vw;
  }

  .hero-card,
  .join-card,
  .panel,
  .modal-card {
    padding: 20px;
  }

  .room-header,
  .entry-actions,
  .speech-actions,
  .chat-form,
  .lobby-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .room-title {
    font-size: 1.6rem;
  }

  .room-header-spacer {
    display: none;
  }

  .join-submit-btn {
    align-self: stretch;
  }

  .player-avatar,
  .player-modal-avatar {
    width: 58px;
    height: 58px;
  }
}
</style>
