/**
 * 클라이언트 공용 도메인 타입
 *
 * 서버(`packages/server/src/types`)가 REST·Socket.IO로 내려주는 응답의
 * 실제 전송 형태를 기준으로 정의한다. 서버 내부에서 Map으로 다루는 값도
 * 전송 시에는 배열로 직렬화되므로 여기서는 배열로 선언한다.
 */

// ============================================================================
// 인증 / 사용자
// ============================================================================

/** 서버가 내려주는 공개 사용자 정보 (비밀번호 해시 제외) */
export interface PublicUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string;
  createdAt: number;
}

// ============================================================================
// 플레이리스트
// ============================================================================

/** 플레이리스트에 등록된 트랙 (영상 ID + 인정할 정답 목록) */
export interface PlaylistTrack {
  videoId: string;
  answers: string[];
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: PlaylistTrack[];
  roundCount: number;
}

/** YouTube에서 조회한 트랙 메타데이터 */
export interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number;
  startSeconds: number;
  endSeconds: number;
}

// ============================================================================
// 방
// ============================================================================

export interface Player {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  streak: number;
  isHost: boolean;
  joinedAt: number;
}

export interface RoomSettings {
  maxPlayers: number;
  roundInterval: number;
  playlistId: string;
}

/**
 * 서버가 직렬화해 보내는 방 정보
 *
 * 실제 페이로드에는 `gameState`도 포함되지만 화면에서 쓰지 않아 생략했다.
 */
export interface Room {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  createdAt: number;
}

// ============================================================================
// 게임 진행
// ============================================================================

/**
 * 라운드 진행 중 내려오는 트랙
 *
 * 정답을 미리 알 수 없도록 서버가 name·artist를 제거하고 보낸다.
 */
export interface HiddenTrack {
  id: string;
  embedUrl: string;
  startSeconds: number;
  endSeconds: number;
  duration: number;
  thumbnailUrl?: string;
}

/** 라운드가 끝나면 공개되는 정답 트랙 */
export interface RevealedTrack extends HiddenTrack {
  name: string;
  artist: string;
  answers: string[];
}

export interface AnswerSubmission {
  playerId: string;
  answer: string;
  timestamp: number;
  isCorrect: boolean;
  score: number;
}

export interface RoundResult {
  roundNumber: number;
  track: RevealedTrack;
  answers: AnswerSubmission[];
  correctAnswers: AnswerSubmission[];
  /** [플레이어 ID, 누적 점수] 목록 */
  scores: Array<[string, number]>;
  streaks: Array<[string, number]>;
}

/** 정답 제출에 대한 즉시 판정 결과 */
export interface AnswerCheckResult {
  isCorrect: boolean;
  score: number;
  message: string;
  streak: number;
}

export interface FinalScore {
  playerId: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  maxStreak: number;
}

export interface GameResult {
  roomCode: string;
  totalRounds: number;
  finalScores: FinalScore[];
  winner: { playerId: string; nickname: string; score: number } | null;
  playedAt: number;
}
