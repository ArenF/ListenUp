import type { Server, Socket } from "socket.io";
import { gameService } from "../../services/game.js";
import { roomService } from "../../services/room.js";
import { youtubeService } from "../../services/youtube.js";
import type { Track, RoundResult } from "../../types/index.js";
import * as events from "../events.js";
import { emitRoomList } from "./room.handler.js";

// ============================================================================
// 타입 정의
// ============================================================================

interface SocketCallback<T = any> {
  (response: { success: true } & T): void;
  (response: { success: false; error?: string }): void;
}

interface HiddenTrack {
  id: string;
  embedUrl: string;
  startSeconds: number;
  endSeconds: number;
  duration: number;
  thumbnailUrl?: string;
  // name과 artist는 숨김 (정답 방지)
}

interface SerializedRoundResult {
  roundNumber: number;
  track: Track; // 라운드 종료 시에는 정답 포함
  answers: Array<{
    playerId: string;
    answer: string;
    timestamp: number;
    isCorrect: boolean;
    score: number;
  }>;
  correctAnswers: Array<{
    playerId: string;
    answer: string;
    timestamp: number;
    isCorrect: boolean;
    score: number;
  }>;
  scores: [string, number][];
  streaks: [string, number][];
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 트랙 정보 숨김 (정답 방지)
 * 클라이언트에 전송할 때 정답을 제거
 */
function hideTrackInfo(track: Track): HiddenTrack {
  return {
    id: track.id,
    embedUrl: track.embedUrl,
    startSeconds: track.startSeconds,
    endSeconds: track.endSeconds,
    duration: track.duration,
    thumbnailUrl: track.thumbnailUrl,
  };
}

/**
 * RoundResult를 직렬화 (Map을 Array로 변환)
 */
function serializeRoundResult(result: RoundResult): SerializedRoundResult {
  return {
    roundNumber: result.roundNumber,
    track: result.track,
    answers: result.answers,
    correctAnswers: result.correctAnswers,
    scores: Array.from(result.scores.entries()),
    streaks: Array.from(result.streaks.entries()),
  };
}

/**
 * 소켓 이벤트 에러 처리 유틸리티
 */
function handleSocketError(
  error: unknown,
  callback: SocketCallback,
  context: string
): void {
  const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
  console.error(`❌ Error in ${context}:`, error);
  callback({ success: false, error: errorMessage });
}

// ============================================================================
// 이벤트 핸들러
// ============================================================================

/**
 * 게임 시작 핸들러
 * 방장만 호출할 수 있으며, 트랙 로드 후 첫 라운드 준비 요청
 */
export function handleStartGame(io: Server, socket: Socket): void {
  socket.on(
    events.START_GAME,
    async (data: { roomCode: string }, callback: SocketCallback) => {
      try {
        const { roomCode } = data;

        // 방 검증
        const room = roomService.getRoom(roomCode);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        // 방장 권한 검증
        if (room.hostId !== socket.id) {
          callback({
            success: false,
            error: "방장만 게임을 시작할 수 있습니다",
          });
          return;
        }

        // 게임 시작
        const result = gameService.startGame(room);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        // YouTube 트랙 로드
        const playlist = gameService.getPlaylist(room.settings.playlistId);
        if (!playlist) {
          // 게임 상태 롤백
          room.gameState.isPlaying = false;
          callback({ success: false, error: "플레이리스트를 찾을 수 없습니다" });
          return;
        }

        let tracks: Track[] = [];
        try {
          // playlist.tracks에서 videoId 추출 및 answers 매핑
          const videoIds = playlist.tracks.map((t) => t.videoId);
          tracks = await youtubeService.getTracks(videoIds, playlist.tracks);

          if (tracks.length === 0) {
            // 게임 상태 롤백
            room.gameState.isPlaying = false;
            callback({
              success: false,
              error: "트랙을 로드할 수 없습니다",
            });
            return;
          }
        } catch (error) {
          console.error("Failed to load tracks from YouTube:", error);
          // 게임 상태 롤백
          room.gameState.isPlaying = false;
          callback({
            success: false,
            error: "YouTube 트랙을 로드하는 데 실패했습니다",
          });
          return;
        }

        // 트랙 목록 저장
        gameService.setTracks(room, tracks);

        // 첫 번째 라운드 준비
        const nextTrack = gameService.prepareNextRound(room);
        if (!nextTrack) {
          callback({ success: false, error: "라운드를 준비할 수 없습니다" });
          return;
        }

        // 성공 응답
        callback({ success: true });

        // 게임 시작 알림
        io.to(roomCode).emit(events.GAME_STARTED, {
          totalRounds: room.gameState.totalRounds,
          players: Array.from(room.players.values()),
        });

        // 게임이 시작된 방은 로비 목록에서 사라진다
        emitRoomList(io);

        console.log(`🎮 Game started in room ${roomCode}`);

        // 첫 번째 라운드 준비 요청 (모든 플레이어에게 트랙 로드 요청)
        io.to(roomCode).emit(events.PREPARE_ROUND, {
          roundNumber: 1,
          track: hideTrackInfo(nextTrack),
          duration: room.settings.roundInterval,
        });

        console.log(
          `📋 Waiting for all players to load track: ${nextTrack.name}`
        );
      } catch (error) {
        handleSocketError(error, callback, "handleStartGame");
      }
    }
  );
}

/**
 * 플레이어 준비 핸들러
 * 플레이어가 YouTube 트랙 로딩을 완료하면 호출
 */
export function handlePlayerReady(io: Server, socket: Socket): void {
  socket.on(
    events.PLAYER_READY,
    (data: { roomCode: string }, callback: SocketCallback) => {
      try {
        const { roomCode } = data;

        // 방 검증
        const room = roomService.getRoom(roomCode);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        // 플레이어 준비 표시
        const result = gameService.markPlayerReady(room, socket.id);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        callback({ success: true });

        const player = room.players.get(socket.id);

        // 준비 상태 업데이트 브로드캐스트
        io.to(roomCode).emit(events.PLAYER_READY_STATUS, {
          playerId: socket.id,
          nickname: player?.nickname,
          readyCount: room.gameState.readyPlayers.size,
          totalPlayers: room.players.size,
        });

        // 모든 플레이어가 준비되었는지 확인
        if (gameService.isAllPlayersReady(room)) {
          console.log(`✅ All players ready in room ${roomCode}`);

          // 준비된 트랙으로 라운드 활성화
          const roundResult = gameService.activatePreparedRound(room);
          if (roundResult.success && roundResult.track) {
            // 라운드 시작 알림
            io.to(roomCode).emit(events.ROUND_STARTED, {
              roundNumber: roundResult.roundNumber,
              track: hideTrackInfo(roundResult.track),
              duration: room.settings.roundInterval,
            });

            console.log(
              `🎵 Round ${roundResult.roundNumber} started with track: ${roundResult.track.name}`
            );
          }
        }
      } catch (error) {
        handleSocketError(error, callback, "handlePlayerReady");
      }
    }
  );
}

/**
 * 정답 제출 핸들러
 * 플레이어가 정답을 제출하면 채점
 */
export function handleSubmitAnswer(io: Server, socket: Socket): void {
  socket.on(
    events.SUBMIT_ANSWER,
    (
      data: { roomCode: string; answer: string },
      callback: SocketCallback<{
        result: {
          isCorrect: boolean;
          score: number;
          message: string;
          streak: number;
        };
      }>
    ) => {
      try {
        const { roomCode, answer } = data;

        // 방 검증
        const room = roomService.getRoom(roomCode);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        // 플레이어 확인
        const player = room.players.get(socket.id);
        if (!player) {
          callback({ success: false, error: "방에 참가하지 않은 플레이어입니다" });
          return;
        }

        // 정답 제출
        const result = gameService.submitAnswer(room, socket.id, answer);
        if (!result.success || !result.result) {
          callback({ success: false, error: result.error });
          return;
        }

        // 클라이언트에 응답
        callback({
          success: true,
          result: result.result,
        });

        console.log(
          `📝 ${player.nickname} submitted: "${answer}" - ${result.result.isCorrect ? "✅ Correct" : "❌ Wrong"} (${result.result.score} points)`
        );

        // 다른 플레이어들에게 제출 알림 (정답 숨김)
        socket.to(roomCode).emit(events.ANSWER_SUBMITTED, {
          playerId: socket.id,
          nickname: player.nickname,
          hasAnswered: true,
          timestamp: Date.now(),
        });

        // 점수 업데이트 브로드캐스트
        io.to(roomCode).emit(events.SCORE_UPDATED, {
          scores: Array.from(room.gameState.scores.entries()),
          streaks: Array.from(room.gameState.streaks.entries()),
        });

        // 모든 플레이어가 답안을 제출하면 자동으로 라운드 종료
        if (room.gameState.answers.size === room.players.size) {
          console.log(
            `✅ All players submitted answers in room ${roomCode}. Auto-ending round in 2 seconds...`
          );

          // 2초 후에 라운드 종료
          setTimeout(() => {
            const endResult = gameService.endRound(room);
            if (endResult.success && endResult.result) {
              // 라운드 종료 브로드캐스트
              io.to(roomCode).emit(events.ROUND_ENDED, {
                result: serializeRoundResult(endResult.result),
              });

              console.log(
                `🏁 Round ${endResult.result.roundNumber} ended in room ${roomCode}`
              );
              console.log(
                `   ${endResult.result.correctAnswers.length}/${room.players.size} players answered correctly`
              );
            }
          }, 2000);
        }
      } catch (error) {
        handleSocketError(error, callback, "handleSubmitAnswer");
      }
    }
  );
}

/**
 * 다음 라운드 핸들러
 * 방장이 다음 라운드로 넘어가기 요청
 */
export function handleNextRound(io: Server, socket: Socket): void {
  socket.on(
    events.NEXT_ROUND,
    async (data: { roomCode: string }, callback: SocketCallback) => {
      try {
        const { roomCode } = data;

        // 방 검증
        const room = roomService.getRoom(roomCode);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        // 방장 권한 검증
        if (room.hostId !== socket.id) {
          callback({
            success: false,
            error: "방장만 다음 라운드를 시작할 수 있습니다",
          });
          return;
        }

        // 게임 진행 중 확인
        if (!room.gameState.isPlaying) {
          callback({ success: false, error: "진행 중인 게임이 없습니다" });
          return;
        }

        // 모든 라운드 완료 확인
        if (room.gameState.currentRound >= room.gameState.totalRounds) {
          // 게임 종료
          const gameResult = gameService.endGame(room);
          if (gameResult.success && gameResult.result) {
            callback({ success: true });

            // 게임 종료 브로드캐스트
            io.to(roomCode).emit(events.GAME_END, {
              result: {
                roomCode: gameResult.result.roomCode,
                totalRounds: gameResult.result.totalRounds,
                finalScores: gameResult.result.finalScores,
                winner: gameResult.result.winner,
                playedAt: gameResult.result.playedAt,
              },
            });

            // 게임이 끝난 방은 다시 로비 목록에 노출된다
            emitRoomList(io);

            console.log(`🎊 Game ended in room ${roomCode}`);
            if (gameResult.result.winner) {
              console.log(
                `👑 Winner: ${gameResult.result.winner.nickname} (${gameResult.result.winner.score} points)`
              );
            }
          }
          return;
        }

        // 다음 라운드 준비
        const nextTrack = gameService.prepareNextRound(room);
        if (!nextTrack) {
          callback({ success: false, error: "다음 라운드를 준비할 수 없습니다" });
          return;
        }

        // 성공 응답
        callback({ success: true });

        // 다음 라운드 준비 요청 (모든 플레이어에게 트랙 로드 요청)
        io.to(roomCode).emit(events.PREPARE_ROUND, {
          roundNumber: room.gameState.currentRound + 1,
          track: hideTrackInfo(nextTrack),
          duration: room.settings.roundInterval,
        });

        console.log(
          `📋 Preparing round ${room.gameState.currentRound + 1}/${room.gameState.totalRounds} in room ${roomCode}`
        );
        console.log(`   Track: ${nextTrack.name} - ${nextTrack.artist}`);
      } catch (error) {
        handleSocketError(error, callback, "handleNextRound");
      }
    }
  );
}

/**
 * 강제 게임 종료 핸들러
 * 방장이 게임을 강제로 종료
 */
export function handleForceEndGame(io: Server, socket: Socket): void {
  socket.on(
    events.GAME_END,
    (data: { roomCode: string }, callback: SocketCallback) => {
      try {
        const { roomCode } = data;

        // 방 검증
        const room = roomService.getRoom(roomCode);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        // 방장 권한 검증
        if (room.hostId !== socket.id) {
          callback({
            success: false,
            error: "방장만 게임을 종료할 수 있습니다",
          });
          return;
        }

        // 게임 종료
        const result = gameService.endGame(room);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        callback({ success: true });

        // 게임 종료 브로드캐스트
        if (result.result) {
          io.to(roomCode).emit(events.GAME_END, {
            result: {
              roomCode: result.result.roomCode,
              totalRounds: result.result.totalRounds,
              finalScores: result.result.finalScores,
              winner: result.result.winner,
              playedAt: result.result.playedAt,
            },
            forced: true, // 강제 종료 표시
          });

          // 강제 종료된 방도 다시 로비 목록에 노출된다
          emitRoomList(io);

          console.log(`🛑 Game force-ended by host in room ${roomCode}`);
        }
      } catch (error) {
        handleSocketError(error, callback, "handleForceEndGame");
      }
    }
  );
}

// ============================================================================
// 핸들러 등록
// ============================================================================

/**
 * 모든 게임 관련 이벤트 핸들러 등록
 */
export function registerGameHandlers(io: Server, socket: Socket): void {
  handleStartGame(io, socket);
  handlePlayerReady(io, socket);  // 새로 추가
  handleSubmitAnswer(io, socket);
  handleNextRound(io, socket);
  handleForceEndGame(io, socket);
}
