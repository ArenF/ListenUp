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

export interface Room {
  code: string;
  hostId: string;
  players: Map<string, Player>;
  settings: RoomSettings;
  gameState: GameState;
  createdAt: number;
}

export interface GameState {
  isPlaying: boolean;
  currentRound: number;
  totalRounds: number;
  currentTrack: Track | null;
  nextTrack: Track | null;           // 다음 라운드 트랙 (플레이어 준비용)
  roundStartTime: number;
  answers: Map<string, number>;
  scores: Map<string, number>;
  streaks: Map<string, number>;
  readyPlayers: Set<string>;          // 준비 완료된 플레이어 ID
  waitingForReady: boolean;           // 플레이어 준비 대기 중
  tracks: Track[];                    // 게임의 전체 트랙 목록
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  roundCount: number;
}

export interface Track {
  id: string;                   
  name: string;                  
  artist: string;                
  uploadDate: string;            
  year: string;                  
  embedUrl: string;              
  duration: number;            
  startSeconds: number;          
  endSeconds: number;            
  thumbnailUrl?: string;         
}

export interface YouTubeVideoSnippet {
  title: string;
  publishedAt: string;
  channelTitle: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

export interface YouTubeVideoContentDetails {
  duration: string;              // ISO 8601 형식 (PT3M45S)
}

export interface YouTubeApiResponse {
  items: Array<{
    id: string;
    snippet: YouTubeVideoSnippet;
    contentDetails: YouTubeVideoContentDetails;
  }>;
}

// ============================================================================
// Game Service Types
// ============================================================================

export interface AnswerSubmission {
  playerId: string;
  answer: string;
  timestamp: number;          // 제출 시간 (ms)
  isCorrect: boolean;
  score: number;              // 해당 라운드에서 획득한 점수
}

export interface RoundResult {
  roundNumber: number;
  track: Track;                           // 정답 트랙 정보
  answers: AnswerSubmission[];            // 모든 플레이어의 답안
  correctAnswers: AnswerSubmission[];     // 정답자들
  scores: Map<string, number>;            // 현재까지 누적 점수
  streaks: Map<string, number>;           // 연속 정답 스트릭
}

export interface GameResult {
  roomCode: string;
  totalRounds: number;
  finalScores: Array<{
    playerId: string;
    nickname: string;
    score: number;
    correctAnswers: number;
    maxStreak: number;
  }>;
  winner: {
    playerId: string;
    nickname: string;
    score: number;
  } | null;
  playedAt: number;
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  score: number;
  message: string;
  streak: number;
}