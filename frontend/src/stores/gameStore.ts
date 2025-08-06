import { writable } from "svelte/store";

const initialState = {
  currentScreen: "main",

  room: {
    code: null,
    title: null,
    host: null,
    maxPlayers: 8,
    playlist: null,
  },

  players: [],
  myPlayerId: null,

  gameStatus: "waiting",
  currentRound: 0,
  totalRounds: 10,
  currentSong: null,

  messages: [""],
  error: Error(),
  loading: false,
};

export const gameState = writable(initialState);

export const gameActions = {
  setRoom: (roomData) => {
    gameState.update((state) => ({
      ...state,
      room: { ...state.room, ...roomData },
    }));
  },

  // 플레이어 추가/업데이트
  updatePlayers: (players) => {
    gameState.update((state) => ({ ...state, players }));
  },

  // 채팅 메시지 추가
  addMessage: (message) => {
    gameState.update((state) => ({
      ...state,
      messages: [...state.messages, message],
    }));
  },

  // 에러 설정
  setError: (error) => {
    gameState.update((state) => ({ ...state, error }));
  },
};
