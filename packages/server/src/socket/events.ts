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

// 게임 상태 업데이트 (서버 → 클라이언트)
export const GAME_STARTED = "game-started";
export const ROUND_STARTED = "round-started";
export const ROUND_ENDED = "round-ended";
export const ANSWER_SUBMITTED = "answer-submitted";
export const SCORE_UPDATED = "score-updated";

// 채팅 이벤트
export const SEND_MESSAGE = "send-message";
export const NEW_MESSAGE = "new-message";
