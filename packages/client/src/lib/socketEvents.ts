import type {
  GameResult,
  HiddenTrack,
  Player,
  RoomSettings,
  RoomSummary,
  RoundResult,
} from "./types";

/**
 * 서버 → 클라이언트 Socket.IO 이벤트 정의
 *
 * 이벤트 이름은 `packages/server/src/socket/events.ts`와 짝을 이룬다.
 */
export interface ServerToClientEvents {
  "player-joined": (data: { player: Player; playerCount: number }) => void;
  "player-left": (data: { playerId: string; playerCount: number }) => void;
  "settings-updated": (data: { settings: RoomSettings }) => void;
  "rooms-updated": (data: { rooms: RoomSummary[] }) => void;

  "game-started": (data: { totalRounds: number; players: Player[] }) => void;
  "prepare-round": (data: {
    roundNumber: number;
    track: HiddenTrack;
    duration: number;
  }) => void;
  "player-ready-status": (data: {
    playerId: string;
    nickname?: string;
    readyCount: number;
    totalPlayers: number;
  }) => void;
  "round-started": (data: {
    roundNumber: number;
    track: HiddenTrack;
    duration: number;
  }) => void;
  "answer-submitted": (data: {
    playerId: string;
    nickname: string;
    hasAnswered: boolean;
    timestamp: number;
  }) => void;
  "score-updated": (data: {
    scores: Array<[string, number]>;
    streaks: Array<[string, number]>;
  }) => void;
  "round-ended": (data: { result: RoundResult }) => void;
  "game-end": (data: { result: GameResult; forced?: boolean }) => void;
}

/**
 * 클라이언트 → 서버 이벤트
 *
 * 요청마다 페이로드와 ack 형태가 달라 이벤트별로 일일이 정의하지 않는다.
 * 실제 ack 응답 타입은 `gameActions`의 request()가 AckResponse<T>로 좁힌다.
 */
export interface ClientToServerEvents {
  [event: string]: (...args: unknown[]) => void;
}

/**
 * 소켓 요청(ack)의 응답 형태
 *
 * 성공하면 요청별 결과가 함께 오고, 실패하면 사유만 온다.
 */
export type AckResponse<T> =
  | ({ success: true } & T)
  | { success: false; error?: string };
