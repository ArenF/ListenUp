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
  roundStartTime: number;
  answers: Map<string, number>;
  scores: Map<string, number>;
  streaks: Map<string, number>;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  releaseDate: string;
  year: string;
  previewUrl: string;
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  roundCount: number;
}
