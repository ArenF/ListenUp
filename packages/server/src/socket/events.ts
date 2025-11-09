// Socket.IO 이벤트 상수

// 방 관리 이벤트
export const CREATE_ROOM = "create-room";
export const JOIN_ROOM = "join-room";
export const LEAVE_ROOM = "leave-room";
export const UPDATE_SETTINGS = "update-settings";

// 방 상태 업데이트 (서버 → 클라이언트)
export const PLAYER_JOINED = "player-joined";
export const PLAYER_LEFT = "player-left";
export const SETTINGS_UPDATED = "settings-updated";

// 게임 이벤트
export const START_GAME = "start-game";
export const SUBMIT_ANSWER = "submit-answer";
export const NEXT_ROUND = "next-round";
export const GAME_END = "game-end";
export const PLAYER_READY = "player-ready";  // 플레이어 준비 완료

// 게임 상태 업데이트 (서버 → 클라이언트)
export const GAME_STARTED = "game-started";
export const ROUND_STARTED = "round-started";
export const ROUND_ENDED = "round-ended";
export const ANSWER_SUBMITTED = "answer-submitted";
export const SCORE_UPDATED = "score-updated";
export const PREPARE_ROUND = "prepare-round";  // 라운드 준비 (트랙 로드 요청)
export const PLAYER_READY_STATUS = "player-ready-status";  // 준비 상태 업데이트
export const ALL_PLAYERS_READY = "all-players-ready";  // 모든 플레이어 준비 완료

// 채팅 이벤트
export const SEND_MESSAGE = "send-message";
export const NEW_MESSAGE = "new-message";
