import type {
  Room,
  Track,
  Playlist,
  GameState,
  AnswerSubmission,
  RoundResult,
  GameResult,
  AnswerCheckResult,
} from "../types/index.js";
import playlistsData from "../data/playlists.json" with { type: "json" };

/**
 * 게임 로직 관리 서비스
 *
 * 주요 기능:
 * - 게임 시작/종료
 * - 라운드 관리
 * - 정답 제출 및 채점
 * - 점수 계산
 */
export class GameService {
  // 플레이리스트 저장소 (추후 DB나 파일에서 로드)
  private playlists: Map<string, Playlist>;

  // 게임 히스토리 저장 (선택적)
  private gameHistory: GameResult[];

  constructor() {
    this.playlists = new Map();
    this.gameHistory = [];
    this.initializePlaylists();
  }

  /**
   * 플레이리스트 초기화 (JSON 파일에서 로드)
   */
  private initializePlaylists(): void {
    // playlists.json 파일에서 모든 플레이리스트 로드
    for (const [key, playlist] of Object.entries(playlistsData)) {
      // tracks 구조 검증
      if (playlist && typeof playlist === 'object' && 'tracks' in playlist) {
        const playlistObj = playlist as any;
        if (Array.isArray(playlistObj.tracks)) {
          this.playlists.set(key, playlistObj as Playlist);
        } else {
          console.warn(`⚠️ Invalid playlist format (tracks is not array): ${key}`);
        }
      } else {
        console.warn(`⚠️ Invalid playlist format (missing tracks): ${key}`);
      }
    }

    console.log(`✅ Loaded ${this.playlists.size} playlists from data/playlists.json`);
  }

  /**
   * 플레이리스트 가져오기
   */
  getPlaylist(playlistId: string): Playlist | undefined {
    return this.playlists.get(playlistId);
  }

  /**
   * 게임 시작
   *
   * @param room 방 정보
   * @returns 업데이트된 게임 상태 또는 에러
   */
  startGame(room: Room): { success: boolean; error?: string; gameState?: GameState } {
    // 검증: 이미 게임 진행 중
    if (room.gameState.isPlaying) {
      return { success: false, error: "이미 게임이 진행 중입니다" };
    }

    // 검증: 최소 인원 체크 (1명 이상)
    if (room.players.size < 1) {
      return { success: false, error: "게임을 시작하려면 최소 1명의 플레이어가 필요합니다" };
    }

    // 플레이리스트 로드
    const playlist = this.getPlaylist(room.settings.playlistId);
    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    // 게임 상태 초기화
    room.gameState.isPlaying = true;
    room.gameState.currentRound = 0;
    room.gameState.totalRounds = playlist.roundCount;
    room.gameState.currentTrack = null;
    room.gameState.nextTrack = null;
    room.gameState.roundStartTime = 0;
    room.gameState.answers = new Map();
    room.gameState.scores = new Map();
    room.gameState.streaks = new Map();
    room.gameState.readyPlayers = new Set();
    room.gameState.waitingForReady = false;
    room.gameState.tracks = [];
    room.gameState.hintTimers = [];

    // 모든 플레이어 점수 초기화
    for (const [playerId] of room.players) {
      room.gameState.scores.set(playerId, 0);
      room.gameState.streaks.set(playerId, 0);
    }

    console.log(`🎮 Game started in room ${room.code}`);
    console.log(`📋 Playlist: ${playlist.name} (${playlist.roundCount} rounds)`);

    return { success: true, gameState: room.gameState };
  }

  /**
   * 라운드 시작
   *
   * @param room 방 정보
   * @param tracks 트랙 목록 (플레이리스트에서 로드된 실제 트랙 데이터)
   * @returns 라운드 정보 또는 에러
   */
  startRound(
    room: Room,
    tracks: Track[]
  ): { success: boolean; error?: string; track?: Track; roundNumber?: number } {
    // 검증: 게임이 진행 중이 아님
    if (!room.gameState.isPlaying) {
      return { success: false, error: "게임이 시작되지 않았습니다" };
    }

    // 검증: 모든 라운드 완료
    if (room.gameState.currentRound >= room.gameState.totalRounds) {
      return { success: false, error: "모든 라운드가 완료되었습니다" };
    }

    // 검증: 트랙 데이터 없음
    if (!tracks || tracks.length === 0) {
      return { success: false, error: "재생할 트랙이 없습니다" };
    }

    // 라운드 번호 증가
    room.gameState.currentRound += 1;

    // 이전 라운드 답안 초기화
    room.gameState.answers.clear();

    // 랜덤 트랙 선택 (중복 방지는 추후 개선)
    const randomIndex = Math.floor(Math.random() * tracks.length);
    const selectedTrack = tracks[randomIndex];

    room.gameState.currentTrack = selectedTrack;
    room.gameState.roundStartTime = Date.now();

    console.log(`🎵 Round ${room.gameState.currentRound}/${room.gameState.totalRounds} started`);
    console.log(`🎧 Track: ${selectedTrack.name} - ${selectedTrack.artist}`);

    return {
      success: true,
      track: selectedTrack,
      roundNumber: room.gameState.currentRound,
    };
  }

  /**
   * 정답 제출 및 채점
   *
   * @param room 방 정보
   * @param playerId 플레이어 ID
   * @param answer 제출된 답안
   * @returns 채점 결과
   */
  submitAnswer(
    room: Room,
    playerId: string,
    answer: string
  ): { success: boolean; error?: string; result?: AnswerCheckResult } {
    // 검증: 게임 진행 중이 아님
    if (!room.gameState.isPlaying) {
      return { success: false, error: "게임이 진행 중이 아닙니다" };
    }

    // 검증: 현재 트랙 없음
    if (!room.gameState.currentTrack) {
      return { success: false, error: "현재 재생 중인 트랙이 없습니다" };
    }

    // 검증: 플레이어가 방에 없음
    if (!room.players.has(playerId)) {
      return { success: false, error: "방에 존재하지 않는 플레이어입니다" };
    }

    // 검증: 이미 답안 제출함
    if (room.gameState.answers.has(playerId)) {
      return { success: false, error: "이미 답안을 제출했습니다" };
    }

    // 정답 체크
    const isCorrect = this.checkAnswer(answer, room.gameState.currentTrack);

    // 제출 시간 계산 (밀리초)
    const submissionTime = Date.now();
    const elapsedTime = submissionTime - room.gameState.roundStartTime;

    // 점수 계산
    const score = isCorrect ? this.calculateScore(elapsedTime, room.settings.roundInterval) : 0;

    // 스트릭 업데이트
    const currentStreak = room.gameState.streaks.get(playerId) || 0;
    const newStreak = isCorrect ? currentStreak + 1 : 0;
    room.gameState.streaks.set(playerId, newStreak);

    // 누적 점수 업데이트
    const currentScore = room.gameState.scores.get(playerId) || 0;
    const streakBonus = newStreak > 1 ? (newStreak - 1) * 100 : 0; // 연속 정답 보너스
    const totalScore = currentScore + score + streakBonus;
    room.gameState.scores.set(playerId, totalScore);

    // 답안 기록 (AnswerSubmission 객체로 저장)
    const answerSubmission: AnswerSubmission = {
      playerId,
      answer,
      timestamp: elapsedTime,
      isCorrect,
      score: score + streakBonus,
    };
    room.gameState.answers.set(playerId, answerSubmission);

    const player = room.players.get(playerId);
    const resultMessage = isCorrect
      ? `정답입니다! +${score + streakBonus}점`
      : `오답입니다. 정답: ${room.gameState.currentTrack.name}`;

    console.log(
      `📝 ${player?.nickname} submitted: "${answer}" - ${isCorrect ? "✅" : "❌"} (${elapsedTime}ms)`
    );

    return {
      success: true,
      result: {
        isCorrect,
        score: score + streakBonus,
        message: resultMessage,
        streak: newStreak,
      },
    };
  }

  /**
   * 정답 체크 (유사도 기반)
   *
   * @param userAnswer 사용자 답안
   * @param track 트랙 정보 (answers 배열 포함)
   * @returns 정답 여부
   */
  private checkAnswer(userAnswer: string, track: Track): boolean {
    // 정규화: 소문자 변환, 공백/특수문자 제거
    const normalize = (str: string): string => {
      return str
        .toLowerCase()
        .replace(/[\s\-_.()[\]{}!?,;:'"]/g, "")
        .trim();
    };

    const normalizedUser = normalize(userAnswer);

    // 1. 정답 배열이 있으면 그것과 비교 (우선순위)
    if (track.answers && track.answers.length > 0) {
      for (const correctAnswer of track.answers) {
        const normalizedCorrect = normalize(correctAnswer);

        // 완전 일치
        if (normalizedUser === normalizedCorrect) {
          return true;
        }

        // 부분 일치 (정답이 사용자 답안에 포함)
        if (normalizedCorrect.includes(normalizedUser) && normalizedUser.length >= 3) {
          return true;
        }

        // 유사도 체크 (Levenshtein distance)
        const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect);
        if (similarity > 0.8) {
          return true; // 80% 이상 유사하면 정답
        }
      }
      // 모든 정답과 매치되지 않음
      return false;
    }

    // 2. 정답 배열이 비어있으면 기존 방식 (YouTube 제목 사용)
    const normalizedCorrect = normalize(track.name);

    // 완전 일치
    if (normalizedUser === normalizedCorrect) {
      return true;
    }

    // 부분 일치 (정답이 사용자 답안에 포함)
    if (normalizedCorrect.includes(normalizedUser) && normalizedUser.length >= 3) {
      return true;
    }

    // 유사도 체크 (Levenshtein distance)
    const similarity = this.calculateSimilarity(normalizedUser, normalizedCorrect);
    return similarity > 0.8; // 80% 이상 유사하면 정답
  }

  /**
   * 문자열 유사도 계산 (Levenshtein distance 기반)
   *
   * @param str1 문자열 1
   * @param str2 문자열 2
   * @returns 0~1 사이의 유사도 (1이 완전 일치)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance 계산
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // 치환
            matrix[i][j - 1] + 1,     // 삽입
            matrix[i - 1][j] + 1      // 삭제
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 점수 계산
   *
   * @param elapsedTime 경과 시간 (밀리초)
   * @param roundInterval 라운드 시간 (초)
   * @returns 획득 점수
   */
  private calculateScore(elapsedTime: number, roundInterval: number): number {
    const baseScore = 1000; // 기본 점수
    const maxTime = roundInterval * 1000; // 초를 밀리초로 변환

    // 시간 보너스: 빠를수록 높은 점수
    // 0초: +500점, roundInterval초: +0점
    const timeBonus = Math.max(0, Math.floor((maxTime - elapsedTime) / maxTime * 500));

    return baseScore + timeBonus;
  }

  /**
   * 라운드 종료
   *
   * @param room 방 정보
   * @returns 라운드 결과
   */
  endRound(room: Room): { success: boolean; error?: string; result?: RoundResult } {
    // 검증: 게임 진행 중이 아님
    if (!room.gameState.isPlaying) {
      return { success: false, error: "게임이 진행 중이 아닙니다" };
    }

    // 검증: 현재 트랙 없음
    if (!room.gameState.currentTrack) {
      return { success: false, error: "종료할 라운드가 없습니다" };
    }

    const currentTrack = room.gameState.currentTrack;

    // 모든 플레이어의 답안 수집 (이제 AnswerSubmission 객체가 저장되어 있음)
    const answers: AnswerSubmission[] = [];
    const correctAnswers: AnswerSubmission[] = [];

    for (const [playerId, submission] of room.gameState.answers.entries()) {
      const player = room.players.get(playerId);
      if (!player) continue;

      // 답안 추가
      answers.push(submission);

      // 정답만 별도 수집
      if (submission.isCorrect) {
        correctAnswers.push(submission);
      }
    }

    const result: RoundResult = {
      roundNumber: room.gameState.currentRound,
      track: currentTrack,
      answers,
      correctAnswers,
      scores: new Map(room.gameState.scores),
      streaks: new Map(room.gameState.streaks),
    };

    console.log(`🏁 Round ${room.gameState.currentRound} ended`);
    console.log(`✅ ${correctAnswers.length}/${room.players.size} players answered correctly`);

    // 현재 트랙 초기화
    room.gameState.currentTrack = null;

    // 라운드 종료 후 다음 라운드 준비를 위해 대기 상태로 전환
    room.gameState.waitingForReady = true;
    room.gameState.readyPlayers.clear();

    return { success: true, result };
  }

  /**
   * 게임 종료
   *
   * @param room 방 정보
   * @returns 게임 결과
   */
  endGame(room: Room): { success: boolean; error?: string; result?: GameResult } {
    // 검증: 게임 진행 중이 아님
    if (!room.gameState.isPlaying) {
      return { success: false, error: "진행 중인 게임이 없습니다" };
    }

    // 최종 점수 집계
    const finalScores = Array.from(room.players.values()).map((player) => {
      const score = room.gameState.scores.get(player.id) || 0;
      const streak = room.gameState.streaks.get(player.id) || 0;

      // 정답 개수 계산 (간소화: 점수로 추정)
      const correctAnswers = Math.floor(score / 1000);

      return {
        playerId: player.id,
        nickname: player.nickname,
        score,
        correctAnswers,
        maxStreak: streak,
      };
    });

    // 점수 순으로 정렬
    finalScores.sort((a, b) => b.score - a.score);

    // 우승자 결정
    const winner = finalScores.length > 0 ? {
      playerId: finalScores[0].playerId,
      nickname: finalScores[0].nickname,
      score: finalScores[0].score,
    } : null;

    const gameResult: GameResult = {
      roomCode: room.code,
      totalRounds: room.gameState.totalRounds,
      finalScores,
      winner,
      playedAt: Date.now(),
    };

    // 게임 히스토리 저장
    this.gameHistory.push(gameResult);

    // 게임 상태 초기화
    room.gameState.isPlaying = false;
    room.gameState.currentRound = 0;
    room.gameState.currentTrack = null;
    room.gameState.roundStartTime = 0;
    room.gameState.answers.clear();

    console.log(`🎊 Game ended in room ${room.code}`);
    if (winner) {
      console.log(`👑 Winner: ${winner.nickname} (${winner.score} points)`);
    }

    return { success: true, result: gameResult };
  }

  /**
   * 게임 히스토리 조회
   */
  getGameHistory(): GameResult[] {
    return [...this.gameHistory];
  }

  /**
   * 특정 방의 게임 상태 조회
   */
  getGameState(room: Room): GameState {
    return room.gameState;
  }

  // ============================================================================
  // 플레이어 준비 상태 관리
  // ============================================================================

  /**
   * 게임 트랙 목록 저장
   *
   * @param room 방 정보
   * @param tracks 트랙 목록
   */
  setTracks(room: Room, tracks: Track[]): void {
    room.gameState.tracks = tracks;
    console.log(`📀 Loaded ${tracks.length} tracks for room ${room.code}`);
  }

  /**
   * 다음 라운드 트랙 준비
   *
   * @param room 방 정보
   * @returns 다음 트랙 또는 null
   */
  prepareNextRound(room: Room): Track | null {
    const tracks = room.gameState.tracks;

    if (!tracks || tracks.length === 0) {
      return null;
    }

    // 다음 라운드 번호
    const nextRoundNumber = room.gameState.currentRound + 1;

    if (nextRoundNumber > room.gameState.totalRounds) {
      return null; // 모든 라운드 완료
    }

    // 순차적 트랙 선택 (라운드 번호에 맞춰 순서대로)
    // nextRoundNumber는 1부터 시작하므로 인덱스는 0부터 시작하도록 -1
    const trackIndex = (nextRoundNumber - 1) % tracks.length;
    const selectedTrack = tracks[trackIndex];

    room.gameState.nextTrack = selectedTrack;
    room.gameState.waitingForReady = true;
    room.gameState.readyPlayers.clear();

    console.log(`🎵 Prepared next track: ${selectedTrack.name} - ${selectedTrack.artist}`);

    return selectedTrack;
  }

  /**
   * 플레이어를 준비 완료 상태로 표시
   *
   * @param room 방 정보
   * @param playerId 플레이어 ID
   * @returns 성공 여부
   */
  markPlayerReady(room: Room, playerId: string): { success: boolean; error?: string } {
    // 검증: 플레이어가 방에 없음
    if (!room.players.has(playerId)) {
      return { success: false, error: "방에 존재하지 않는 플레이어입니다" };
    }

    // 검증: 준비 대기 중이 아님
    if (!room.gameState.waitingForReady) {
      return { success: false, error: "현재 준비를 기다리는 상태가 아닙니다" };
    }

    // 이미 준비된 플레이어
    if (room.gameState.readyPlayers.has(playerId)) {
      return { success: true }; // 중복 준비는 무시
    }

    room.gameState.readyPlayers.add(playerId);

    const player = room.players.get(playerId);
    console.log(`✅ ${player?.nickname} is ready (${room.gameState.readyPlayers.size}/${room.players.size})`);

    return { success: true };
  }

  /**
   * 모든 플레이어가 준비되었는지 확인
   *
   * @param room 방 정보
   * @returns 모든 플레이어 준비 여부
   */
  isAllPlayersReady(room: Room): boolean {
    return room.gameState.readyPlayers.size === room.players.size;
  }

  /**
   * 준비 상태 초기화
   *
   * @param room 방 정보
   */
  resetReadyStatus(room: Room): void {
    room.gameState.readyPlayers.clear();
    room.gameState.waitingForReady = false;
  }

  /**
   * 준비된 트랙으로 라운드 시작
   * (prepareNextRound로 준비된 트랙을 currentTrack으로 이동)
   *
   * @param room 방 정보
   * @returns 라운드 정보
   */
  activatePreparedRound(room: Room): { success: boolean; error?: string; track?: Track; roundNumber?: number } {
    // 검증: 게임이 진행 중이 아님
    if (!room.gameState.isPlaying) {
      return { success: false, error: "게임이 시작되지 않았습니다" };
    }

    // 검증: 준비된 트랙이 없음
    if (!room.gameState.nextTrack) {
      return { success: false, error: "준비된 트랙이 없습니다" };
    }

    // 검증: 모든 플레이어가 준비되지 않음
    if (!this.isAllPlayersReady(room)) {
      return { success: false, error: "모든 플레이어가 준비되지 않았습니다" };
    }

    // 라운드 번호 증가
    room.gameState.currentRound += 1;

    // 이전 라운드 답안 초기화
    room.gameState.answers.clear();

    // 준비된 트랙을 현재 트랙으로 이동
    const selectedTrack = room.gameState.nextTrack;
    room.gameState.currentTrack = selectedTrack;
    room.gameState.nextTrack = null;
    room.gameState.roundStartTime = Date.now();

    // 준비 상태 초기화
    this.resetReadyStatus(room);

    console.log(`🎵 Round ${room.gameState.currentRound}/${room.gameState.totalRounds} activated`);
    console.log(`🎧 Track: ${selectedTrack.name} - ${selectedTrack.artist}`);

    return {
      success: true,
      track: selectedTrack,
      roundNumber: room.gameState.currentRound,
    };
  }
}

// 싱글톤 인스턴스 생성
export const gameService = new GameService();
