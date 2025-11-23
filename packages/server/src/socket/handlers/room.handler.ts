import type { Server, Socket } from "socket.io";
import { roomService } from "../../services/room.js";
import type { Room, RoomSettings } from "../../types/index.js";
import * as events from "../events.js";
import { config } from "../../config/env.js";

// ============================================================================
// 타입 정의
// ============================================================================

interface SocketCallback<T = any> {
  (response: { success: true } & T): void;
  (response: { success: false; error?: string }): void;
}

interface SerializedRoom {
  code: string;
  hostId: string;
  players: any[];
  settings: RoomSettings;
  gameState: {
    isPlaying: boolean;
    currentRound: number;
    totalRounds: number;
    currentTrack: any;
    roundStartTime: number;
    answers: any[];  // AnswerSubmission 배열로 변경
    scores: [string, number][];
    streaks: [string, number][];
  };
  createdAt: number;
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * Room 객체를 Socket.IO로 안전하게 전송하기 위해 직렬화
 * Map 객체를 JSON 직렬화를 위해 배열로 변환
 */
function serializeRoom(room: Room): SerializedRoom {
  return {
    code: room.code,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
    settings: room.settings,
    gameState: {
      ...room.gameState,
      // AnswerSubmission 객체만 배열로 변환
      answers: Array.from(room.gameState.answers.values()),
      scores: Array.from(room.gameState.scores.entries()),
      streaks: Array.from(room.gameState.streaks.entries()),
    },
    createdAt: room.createdAt,
  };
}

/**
 * 소켓 이벤트 핸들러를 위한 공통 에러 핸들러
 */
function handleSocketError(
  error: unknown,
  callback: SocketCallback,
  context: string
): void {
  const errorMessage = error instanceof Error ? error.message : "알 수 없는 에러";
  console.error(`Error in ${context}:`, error);
  callback({ success: false, error: errorMessage });
}

/**
 * 방 설정을 기본값으로 검증하고 정규화
 */
function validateRoomSettings(settings: Partial<RoomSettings>): RoomSettings {
  return {
    maxPlayers: settings.maxPlayers || 8,
    roundInterval: settings.roundInterval || 30,
    playlistId: settings.playlistId || config.game.defaultPlaylistId,
  };
}

// ============================================================================
// 이벤트 핸들러
// ============================================================================

/**
 * 방 생성 이벤트 처리
 * 호스트 플레이어와 초기 설정으로 새 방 생성
 */
export function handleCreateRoom(_io: Server, socket: Socket): void {
  socket.on(
    events.CREATE_ROOM,
    (
      data: { nickname: string; settings: RoomSettings },
      callback: SocketCallback<{ room: SerializedRoom }>
    ) => {
      try {
        const { nickname, settings } = data;

        // 설정 검증 및 정규화
        const roomSettings = validateRoomSettings(settings);

        // 방 생성
        const room = roomService.createRoom(socket.id, nickname, roomSettings);

        // 소켓을 방 채널에 참가시킴
        socket.join(room.code);

        // 전송을 위해 방 데이터 직렬화
        const roomData = serializeRoom(room);

        // 성공 응답 전송
        callback({ success: true, room: roomData });

        console.log(`Room ${room.code} created by ${nickname}`);
      } catch (error) {
        handleSocketError(error, callback, "handleCreateRoom");
      }
    }
  );
}

/**
 * 방 참가 이벤트 처리
 * 플레이어가 기존 방에 참가할 수 있도록 함
 */
export function handleJoinRoom(_io: Server, socket: Socket): void {
  socket.on(
    events.JOIN_ROOM,
    (
      data: { code: string; nickname: string },
      callback: SocketCallback<{ room: SerializedRoom }>
    ) => {
      try {
        const { code, nickname } = data;

        // 방 참가 시도
        const result = roomService.joinRoom(code, socket.id, nickname);

        if (!result.success || !result.room) {
          callback({ success: false, error: result.error });
          return;
        }

        // 소켓을 방 채널에 참가시킴
        socket.join(code);

        // 전송을 위해 방 데이터 직렬화
        const roomData = serializeRoom(result.room);

        // 참가하는 플레이어에게 성공 응답 전송
        callback({ success: true, room: roomData });

        // 방의 다른 플레이어들에게 알림
        const joiningPlayer = result.room.players.get(socket.id);
        socket.to(code).emit(events.PLAYER_JOINED, {
          player: joiningPlayer,
          playerCount: result.room.players.size,
        });

        console.log(`${nickname} joined room ${code}`);
      } catch (error) {
        handleSocketError(error, callback, "handleJoinRoom");
      }
    }
  );
}

/**
 * 방 나가기 이벤트 처리
 * 플레이어를 방에서 제거하고 필요시 방장 권한 이전 처리
 */
export function handleLeaveRoom(_io: Server, socket: Socket): void {
  socket.on(
    events.LEAVE_ROOM,
    (
      data: { code: string },
      callback: SocketCallback<{ roomDeleted?: boolean }>
    ) => {
      try {
        const { code } = data;

        const result = roomService.leaveRoom(code, socket.id);

        if (!result.success) {
          callback({ success: false });
          return;
        }

        // 소켓을 방 채널에서 제거
        socket.leave(code);

        // 성공 응답 전송
        callback({ success: true, roomDeleted: result.roomDeleted });

        // 방이 아직 존재하면 다른 플레이어들에게 알림
        if (!result.roomDeleted) {
          socket.to(code).emit(events.PLAYER_LEFT, {
            playerId: socket.id,
            playerCount: roomService.getPlayerCount(code),
            newHostId: result.newHostId,
          });
        }

        console.log(`Player left room ${code}`);
      } catch (error) {
        handleSocketError(error, callback, "handleLeaveRoom");
      }
    }
  );
}

/**
 * 설정 업데이트 이벤트 처리
 * 방장이 게임 시작 전 방 설정을 변경할 수 있도록 함
 */
export function handleUpdateSettings(io: Server, socket: Socket): void {
  socket.on(
    events.UPDATE_SETTINGS,
    (
      data: { code: string; settings: Partial<RoomSettings> },
      callback: SocketCallback
    ) => {
      try {
        const { code, settings } = data;

        const result = roomService.updateSettings(code, socket.id, settings);

        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }

        const room = roomService.getRoom(code);
        if (!room) {
          callback({ success: false, error: "방을 찾을 수 없습니다" });
          return;
        }

        callback({ success: true });

        // 업데이트된 설정을 모든 플레이어에게 브로드캐스트
        io.to(code).emit(events.SETTINGS_UPDATED, {
          settings: room.settings,
        });

        console.log(`Room ${code} settings updated`);
      } catch (error) {
        handleSocketError(error, callback, "handleUpdateSettings");
      }
    }
  );
}

/**
 * 소켓 연결 해제 이벤트 처리
 * 플레이어가 속한 방에서 자동으로 제거
 */
export function handleDisconnect(_io: Server, socket: Socket): void {
  socket.on("disconnect", () => {
    // 플레이어가 속한 모든 방 찾기
    const rooms = roomService.getAllRooms();

    for (const room of rooms) {
      if (room.players.has(socket.id)) {
        const result = roomService.leaveRoom(room.code, socket.id);

        if (!result.roomDeleted) {
          socket.to(room.code).emit(events.PLAYER_LEFT, {
            playerId: socket.id,
            playerCount: roomService.getPlayerCount(room.code),
            newHostId: result.newHostId,
          });
        }

        console.log(`Player disconnected from room ${room.code}`);
        break;
      }
    }
  });
}

// ============================================================================
// 핸들러 등록
// ============================================================================

/**
 * 소켓 연결에 대한 모든 방 관련 이벤트 핸들러 등록
 */
export function registerRoomHandlers(io: Server, socket: Socket): void {
  handleCreateRoom(io, socket);
  handleJoinRoom(io, socket);
  handleLeaveRoom(io, socket);
  handleUpdateSettings(io, socket);
  handleDisconnect(io, socket);
}
