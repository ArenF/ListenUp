import { fetchPlaylists } from "../api/playlists";
import { connection, request, socket } from "./socket.svelte";
import type { Player, Playlist, Room, RoomSummary } from "../types/index";

/**
 * 로비와 방 상태
 *
 * 공개 방 목록, 현재 들어가 있는 방과 참가자를 다룬다.
 * 게임 진행(라운드·트랙·점수 결과)은 `game` store가 맡는다.
 */
class RoomStore {
  /** 게임에서 쓸 닉네임 (로그인 상태면 계정 닉네임으로 고정된다) */
  nickname = $state("");

  /** 로비: 공개 방 목록 */
  publicRooms = $state<RoomSummary[]>([]);
  /** 방 생성 화면에서 고를 수 있는 플레이리스트 */
  playlists = $state<Playlist[]>([]);

  current = $state<Room | null>(null);
  players = $state<Player[]>([]);

  /**
   * 현재 사용자가 방장인지 여부
   *
   * socket 객체 자체는 반응형이 아니므로 연결 시점에 저장해 둔 socketId를 쓴다.
   */
  readonly isHost = $derived(
    this.current?.players.some(
      (p) => p.id === connection.socketId && p.isHost
    ) ?? false
  );

  /** 방에서 나왔을 때 방 상태를 비운다 (닉네임·방 목록은 유지) */
  reset() {
    this.current = null;
    this.players = [];
  }
}

export const roomStore = new RoomStore();

// ------------------------------------------------------------ 서버 → 클라이언트

// 연결되면 로비에 뿌릴 공개 방 목록을 받아온다
socket.on("connect", () => {
  listRooms();
});

// 로비 공개 방 목록 실시간 갱신
socket.on("rooms-updated", (data) => {
  roomStore.publicRooms = data.rooms;
});

socket.on("player-joined", (data) => {
  console.log("새 플레이어 참가:", data);
  connection.statusMessage = `🎮 ${data.player.nickname}님이 입장했습니다!`;

  if (roomStore.current) {
    roomStore.players = [...roomStore.players, data.player];
  }
});

socket.on("player-left", (data) => {
  console.log("플레이어 퇴장:", data);
  connection.statusMessage = "👋 플레이어가 퇴장했습니다";
  roomStore.players = roomStore.players.filter((p) => p.id !== data.playerId);
});

socket.on("settings-updated", (data) => {
  console.log("설정 업데이트:", data);
  connection.statusMessage = "⚙️ 방 설정이 업데이트되었습니다";

  if (roomStore.current) {
    roomStore.current = { ...roomStore.current, settings: data.settings };
  }
});

socket.on("score-updated", (data) => {
  console.log("📊 점수 업데이트:", data);
  if (!roomStore.current) return;

  const scores = new Map<string, number>(data.scores);
  roomStore.players = roomStore.players.map((player) => {
    const score = scores.get(player.id);
    return score === undefined ? player : { ...player, score };
  });
});

// ------------------------------------------------------------ 클라이언트 → 서버

/** 방 생성 화면에서 고를 수 있는 플레이리스트 목록을 불러온다 */
export async function loadPlaylists() {
  try {
    roomStore.playlists = await fetchPlaylists();
    console.log("✅ Loaded playlists:", roomStore.playlists);
  } catch (error) {
    console.error("❌ Failed to load playlists:", error);
  }
}

/** 로비의 공개 방 목록을 서버에서 받아온다 (최초 진입 시) */
export function listRooms() {
  request<{ rooms: RoomSummary[] }>(
    "list-rooms",
    {},
    {
      failMessage: "방 목록 조회 실패",
      onSuccess: ({ rooms }) => {
        roomStore.publicRooms = rooms;
      },
    }
  );
}

/** 사용자가 방 생성 화면에서 고른 값 */
export interface CreateRoomOptions {
  title: string;
  playlistId: string;
  isPublic: boolean;
}

export function createRoom({ title, playlistId, isPublic }: CreateRoomOptions) {
  const nickname = roomStore.nickname.trim();
  if (!nickname) {
    connection.statusMessage = "⚠️ 닉네임을 입력해주세요";
    return;
  }

  connection.statusMessage = "⏳ 방 생성 중...";
  request<{ room: Room }>(
    "create-room",
    {
      nickname,
      title: title.trim(),
      settings: {
        maxPlayers: 8,
        roundInterval: 30,
        playlistId,
        isPublic,
      },
    },
    {
      failMessage: "방 생성 실패",
      onSuccess: ({ room }) => {
        roomStore.current = room;
        roomStore.players = room.players;
        connection.statusMessage = `✅ 방 생성 완료! 코드: ${room.code}`;
        console.log("방 생성 성공:", room);
      },
    }
  );
}

/**
 * 방에 참가한다.
 *
 * @param code 로비에서 클릭한 방 카드의 코드, 또는 참가 모달에 입력한 코드
 */
export function joinRoom(code: string) {
  const nickname = roomStore.nickname.trim();
  if (!nickname) {
    connection.statusMessage = "⚠️ 닉네임을 입력해주세요";
    return;
  }

  code = code.trim();
  if (!code) {
    connection.statusMessage = "⚠️ 방 코드를 입력해주세요";
    return;
  }

  connection.statusMessage = "⏳ 방 참가 중...";
  request<{ room: Room }>(
    "join-room",
    { code: code.toUpperCase(), nickname },
    {
      failMessage: "방 참가 실패",
      onSuccess: ({ room }) => {
        roomStore.current = room;
        roomStore.players = room.players;
        connection.statusMessage = `✅ 방 참가 완료! (${room.players.length}명)`;
        console.log("방 참가 성공:", room);
      },
    }
  );
}

/**
 * 방을 나간다.
 *
 * @param onLeft 나가기에 성공한 뒤 호출된다 (게임 상태 정리 등)
 */
export function leaveRoom(onLeft?: () => void) {
  if (!roomStore.current) return;

  request(
    "leave-room",
    { code: roomStore.current.code },
    {
      failMessage: "방 나가기 실패",
      onSuccess: () => {
        roomStore.reset();
        onLeft?.();
        connection.statusMessage = "👋 방을 나갔습니다";
        console.log("방 나가기 성공");
      },
    }
  );
}
