// Socket.IO 이벤트 상수
// TODO: Phase 1에서 구현 예정

export const SOCKET_EVENTS = {
  // Room events
  CREATE_ROOM: "create-room",
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",

  // Game events
  START_GAME: "start-game",
  SUBMIT_ANSWER: "submit-answer",

  // Chat events
  SEND_MESSAGE: "send-message",
} as const;
