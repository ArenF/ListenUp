import { nanoid } from "nanoid";
import type { Room, Player, RoomSettings, GameState } from "../types/index.js";

// 방 관리 서비스

export class RoomService {
  private rooms: Map<string, Room>;

  constructor() {
    this.rooms = new Map();
  }

  /**
   * 방 코드 생성 (6자리 대문자)
   */
  private generateRoomCode(): string {
    // 6자리 대문자 코드 생성
    return nanoid(6).toUpperCase();
  }

  /**
   * 방 생성
   */
  createRoom(hostId: string, hostNickname: string, settings: RoomSettings): Room {
    const code = this.generateRoomCode();

    // 호스트 플레이어 생성
    const host: Player = {
      id: hostId,
      nickname: hostNickname,
      avatar: this.getRandomAvatar(),
      score: 0,
      streak: 0,
      isHost: true,
      joinedAt: Date.now(),
    };

    // 초기 게임 상태
    const gameState: GameState = {
      isPlaying: false,
      currentRound: 0,
      totalRounds: 0,
      currentTrack: null,
      nextTrack: null,
      roundStartTime: 0,
      answers: new Map(),
      scores: new Map(),
      streaks: new Map(),
      correctAnswerCounts: new Map(),
      readyPlayers: new Set(),
      waitingForReady: false,
      tracks: [],
      hintTimers: [],
    };

    const room: Room = {
      code,
      hostId,
      players: new Map([[hostId, host]]),
      settings,
      gameState,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    console.log(`✅ Room created: ${code} by ${hostNickname}`);

    return room;
  }

  /**
   * 방 조회
   */
  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  /**
   * 방 존재 여부 확인
   */
  roomExists(code: string): boolean {
    return this.rooms.has(code);
  }

  /**
   * 플레이어가 방에 참가
   */
  joinRoom(code: string, playerId: string, nickname: string): { success: boolean; room?: Room; error?: string } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: "방을 찾을 수 없습니다" };
    }

    if (room.players.has(playerId)) {
      return { success: false, error: "이미 방에 참가했습니다" };
    }

    if (room.players.size >= room.settings.maxPlayers) {
      return { success: false, error: "방이 가득 찼습니다" };
    }

    if (room.gameState.isPlaying) {
      return { success: false, error: "게임이 이미 시작되었습니다" };
    }

    // 닉네임 중복 체크
    const nicknameExists = Array.from(room.players.values()).some(
      (p) => p.nickname === nickname
    );
    if (nicknameExists) {
      return { success: false, error: "이미 사용 중인 닉네임입니다" };
    }

    const player: Player = {
      id: playerId,
      nickname,
      avatar: this.getRandomAvatar(),
      score: 0,
      streak: 0,
      isHost: false,
      joinedAt: Date.now(),
    };

    room.players.set(playerId, player);
    console.log(`✅ Player ${nickname} joined room ${code}`);

    return { success: true, room };
  }

  /**
   * 플레이어가 방에서 나감
   */
  leaveRoom(code: string, playerId: string): { success: boolean; roomDeleted?: boolean; newHostId?: string } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false };
    }

    const player = room.players.get(playerId);
    if (!player) {
      return { success: false };
    }

    room.players.delete(playerId);
    console.log(`✅ Player ${player.nickname} left room ${code}`);

    // 방에 아무도 없으면 방 삭제
    if (room.players.size === 0) {
      this.rooms.delete(code);
      console.log(`🗑️  Room ${code} deleted (empty)`);
      return { success: true, roomDeleted: true };
    }

    // 방장이 나갔으면 다음 플레이어를 방장으로 임명
    if (player.isHost) {
      const players = Array.from(room.players.values());
      const newHost = players[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      console.log(`👑 New host: ${newHost.nickname} in room ${code}`);
      return { success: true, newHostId: newHost.id };
    }

    return { success: true };
  }

  /**
   * 방 삭제
   */
  deleteRoom(code: string): boolean {
    const deleted = this.rooms.delete(code);
    if (deleted) {
      console.log(`🗑️  Room ${code} deleted`);
    }
    return deleted;
  }

  /**
   * 방의 플레이어 수 조회
   */
  getPlayerCount(code: string): number {
    const room = this.rooms.get(code);
    return room ? room.players.size : 0;
  }

  /**
   * 방의 플레이어 목록 조회 (직렬화 가능한 형태)
   */
  getPlayers(code: string): Player[] {
    const room = this.rooms.get(code);
    return room ? Array.from(room.players.values()) : [];
  }

  /**
   * 방 설정 업데이트 (방장만 가능)
   */
  updateSettings(code: string, hostId: string, settings: Partial<RoomSettings>): { success: boolean; error?: string } {
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: "방을 찾을 수 없습니다" };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: "방장만 설정을 변경할 수 있습니다" };
    }

    if (room.gameState.isPlaying) {
      return { success: false, error: "게임 중에는 설정을 변경할 수 없습니다" };
    }

    room.settings = { ...room.settings, ...settings };
    console.log(`⚙️  Room ${code} settings updated`);

    return { success: true };
  }

  /**
   * 랜덤 아바타 이모지 반환
   */
  private getRandomAvatar(): string {
    const avatars = ["😀", "😎", "🤓", "😺", "🐶", "🐻", "🦊", "🐼", "🐯", "🦁", "🐸", "🐙"];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  /**
   * 모든 방 조회 (디버깅용)
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * 방 통계
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.players.size,
        0
      ),
    };
  }
}

export const roomService = new RoomService();
