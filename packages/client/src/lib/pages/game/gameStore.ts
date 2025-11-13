import { writable, derived } from 'svelte/store';
import type { Socket } from 'socket.io-client';

// 타입 정의
export interface GameState {
  socket: Socket | null;
  connected: boolean;
  statusMessage: string;

  // 방 상태
  roomCode: string;
  nickname: string;
  currentRoom: any | null;
  players: any[];

  // 플레이리스트
  playlists: any[];
  selectedPlaylistId: string;

  // 게임 상태
  gameStarted: boolean;
  currentRound: number;
  totalRounds: number;
  currentTrack: any | null;
  preparedTrack: any | null;
  answer: string;
  gameResult: any | null;
  roundEnded: boolean;

  // YouTube Player
  player: any | null;
  playerReady: boolean;
  isMuted: boolean;
  isLoadingTrack: boolean;
  readyPlayers: number;
  volume: number;
}

// 초기 상태
const initialState: GameState = {
  socket: null,
  connected: false,
  statusMessage: "서버에 연결되지 않음",

  roomCode: "",
  nickname: "",
  currentRoom: null,
  players: [],

  playlists: [],
  selectedPlaylistId: "test-playlist",

  gameStarted: false,
  currentRound: 0,
  totalRounds: 0,
  currentTrack: null,
  preparedTrack: null,
  answer: "",
  gameResult: null,
  roundEnded: false,

  player: null,
  playerReady: false,
  isMuted: true,
  isLoadingTrack: false,
  readyPlayers: 0,
  volume: 50,
};

// 메인 스토어
export const gameStore = writable<GameState>(initialState);

// Derived stores (편의성을 위해)
export const isHost = derived(gameStore, $store => {
  if (!$store.currentRoom || !$store.socket) return false;
  return $store.currentRoom.players.some((p: any) =>
    p.id === $store.socket?.id && p.isHost
  );
});

// 헬퍼 함수들
export function updateGameStore(updates: Partial<GameState>) {
  gameStore.update(state => ({ ...state, ...updates }));
}

export function resetGameStore() {
  gameStore.set(initialState);
}
