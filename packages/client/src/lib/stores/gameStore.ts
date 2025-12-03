import { writable, derived } from 'svelte/store';
import type { Socket } from 'socket.io-client';

// 애니메이션 타입
export type AnimationType = 'correct' | 'wrong' | 'submitted' | 'score-up' | null;

// 힌트 아이템 타입
export interface HintItem {
  id: string;           // 고유 ID
  text: string;         // 힌트 텍스트
  index: number;        // 힌트 순서 (1, 2, 3...)
  total: number;        // 전체 힌트 개수
  timestamp: number;    // 표시된 시간 (밀리초)
  isNew: boolean;       // 새로 추가된 힌트인지 (하이라이트용)
}

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
  roundResult: any | null;  // 라운드 종료 후 결과 (정답 트랙, correctAnswers 등)

  // YouTube Player
  player: any | null;
  playerReady: boolean;
  isMuted: boolean;
  isLoadingTrack: boolean;
  readyPlayers: number;
  volume: number;

  // UI 애니메이션 (플레이어별 애니메이션 상태)
  playerAnimations: Record<string, AnimationType>;
  // 점수 증가 추적 (이전 점수 저장)
  previousScores: Record<string, number>;
  // 정답을 맞춘 플레이어 추적 (라운드별)
  answeredCorrectly: Set<string>;
  // 오답을 제출한 플레이어 추적 (라운드별)
  answeredWrong: Set<string>;

  // 힌트 시스템 (배열로 변경)
  hints: HintItem[];
  hintsMinimized: boolean;  // 힌트 박스 최소화 상태
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
  roundResult: null,

  player: null,
  playerReady: false,
  isMuted: true,
  isLoadingTrack: false,
  readyPlayers: 0,
  volume: 50,

  playerAnimations: {},
  previousScores: {},
  answeredCorrectly: new Set(),
  answeredWrong: new Set(),
  hints: [],
  hintsMinimized: false,
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

// 플레이어 애니메이션 트리거
export function triggerPlayerAnimation(playerId: string, animationType: AnimationType, duration: number = 1000) {
  // 애니메이션 설정
  gameStore.update(state => ({
    ...state,
    playerAnimations: {
      ...state.playerAnimations,
      [playerId]: animationType
    }
  }));

  // duration 후 애니메이션 초기화
  setTimeout(() => {
    gameStore.update(state => ({
      ...state,
      playerAnimations: {
        ...state.playerAnimations,
        [playerId]: null
      }
    }));
  }, duration);
}

// 점수 업데이트 시 이전 점수 저장 및 애니메이션 트리거
export function updatePlayerScore(playerId: string, newScore: number) {
  gameStore.update(state => {
    const previousScore = state.previousScores[playerId] || 0;

    // 점수가 증가했다면 score-up 애니메이션 트리거
    if (newScore > previousScore) {
      triggerPlayerAnimation(playerId, 'score-up', 1500);
    }

    return {
      ...state,
      previousScores: {
        ...state.previousScores,
        [playerId]: newScore
      }
    };
  });
}

// 정답 맞춘 플레이어 추가
export function markPlayerCorrect(playerId: string) {
  gameStore.update(state => {
    const newSet = new Set(state.answeredCorrectly);
    newSet.add(playerId);
    return {
      ...state,
      answeredCorrectly: newSet
    };
  });
}

// 오답 제출한 플레이어 추가
export function markPlayerWrong(playerId: string) {
  gameStore.update(state => {
    const newSet = new Set(state.answeredWrong);
    newSet.add(playerId);
    return {
      ...state,
      answeredWrong: newSet
    };
  });
}

// 라운드 초기화 (정답/오답 상태 초기화)
export function resetRoundState() {
  gameStore.update(state => ({
    ...state,
    answeredCorrectly: new Set(),
    answeredWrong: new Set(),
  }));
}

// 힌트 추가
export function addHint(hint: Omit<HintItem, 'id' | 'timestamp' | 'isNew'>) {
  gameStore.update(state => {
    const newHint: HintItem = {
      ...hint,
      id: `hint-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now(),
      isNew: true
    };

    // 3초 후 isNew 플래그 제거 (하이라이트 해제)
    setTimeout(() => {
      gameStore.update(s => ({
        ...s,
        hints: s.hints.map(h =>
          h.id === newHint.id ? { ...h, isNew: false } : h
        )
      }));
    }, 3000);

    return {
      ...state,
      hints: [...state.hints, newHint]
    };
  });
}

// 모든 힌트 초기화
export function clearHints() {
  gameStore.update(state => ({
    ...state,
    hints: []
  }));
}

// 힌트 박스 최소화/최대화 토글
export function toggleHintsMinimized() {
  gameStore.update(state => ({
    ...state,
    hintsMinimized: !state.hintsMinimized
  }));
}
