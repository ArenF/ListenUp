import { getSocket } from "../../socket";
import { fetchPlaylists } from "../../api/playlists";
import { gameStore } from "./gameStore.svelte";
import type { AckResponse } from "../../socketEvents";
import type { AnswerCheckResult, Room, RoomSummary } from "../../types";

/**
 * 게임 화면에서 서버로 보내는 요청 모음
 *
 * 모든 소켓 요청은 ack 콜백으로 결과를 받으며,
 * 성공/실패 메시지는 gameStore.statusMessage에 반영한다.
 */

interface RequestHandlers<T> {
  /** 실패 메시지 앞에 붙일 문구 (예: "방 생성 실패") */
  failMessage: string;
  onSuccess?: (result: T) => void;
}

/**
 * 소켓 요청을 보내고 ack 응답을 처리한다.
 *
 * @typeParam T 성공했을 때 응답에 함께 실려오는 값
 */
function request<T = unknown>(
  event: string,
  payload: unknown,
  { failMessage, onSuccess }: RequestHandlers<T>
) {
  const socket = getSocket();
  if (!socket) {
    gameStore.statusMessage = "❌ 서버에 연결되지 않았습니다";
    return;
  }

  socket.emit(event, payload, (response: AckResponse<T>) => {
    if (response.success) {
      onSuccess?.(response);
      return;
    }

    gameStore.statusMessage = response.error
      ? `❌ ${failMessage}: ${response.error}`
      : `❌ ${failMessage}`;
    console.error(`${failMessage}:`, response.error);
  });
}

/** 방 생성 화면에서 고를 수 있는 플레이리스트 목록을 불러온다 */
export async function loadPlaylists() {
  try {
    gameStore.playlists = await fetchPlaylists();
    console.log("✅ Loaded playlists:", gameStore.playlists);
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
        gameStore.publicRooms = rooms;
      },
    }
  );
}

export function createRoom() {
  const nickname = gameStore.nickname.trim();
  if (!nickname) {
    gameStore.statusMessage = "⚠️ 닉네임을 입력해주세요";
    return;
  }

  gameStore.statusMessage = "⏳ 방 생성 중...";
  request<{ room: Room }>(
    "create-room",
    {
      nickname,
      title: gameStore.roomTitle.trim(),
      settings: {
        maxPlayers: 8,
        roundInterval: 30,
        playlistId: gameStore.selectedPlaylistId,
        isPublic: gameStore.roomIsPublic,
      },
    },
    {
      failMessage: "방 생성 실패",
      onSuccess: ({ room }) => {
        gameStore.currentRoom = room;
        gameStore.roomCode = room.code;
        gameStore.players = room.players;
        gameStore.statusMessage = `✅ 방 생성 완료! 코드: ${room.code}`;
        console.log("방 생성 성공:", room);
      },
    }
  );
}

/**
 * 방에 참가한다.
 *
 * @param codeArg 로비에서 방 카드를 클릭한 경우 그 방의 코드. 생략하면
 *                참가 모달에 입력한 `gameStore.roomCode`를 사용한다.
 */
export function joinRoom(codeArg?: string) {
  const nickname = gameStore.nickname.trim();
  if (!nickname) {
    gameStore.statusMessage = "⚠️ 닉네임을 입력해주세요";
    return;
  }

  const code = (codeArg ?? gameStore.roomCode).trim();
  if (!code) {
    gameStore.statusMessage = "⚠️ 방 코드를 입력해주세요";
    return;
  }

  gameStore.statusMessage = "⏳ 방 참가 중...";
  request<{ room: Room }>(
    "join-room",
    { code: code.toUpperCase(), nickname },
    {
      failMessage: "방 참가 실패",
      onSuccess: ({ room }) => {
        gameStore.currentRoom = room;
        gameStore.players = room.players;
        gameStore.statusMessage = `✅ 방 참가 완료! (${room.players.length}명)`;
        console.log("방 참가 성공:", room);
      },
    }
  );
}

export function leaveRoom() {
  if (!gameStore.currentRoom) return;

  request(
    "leave-room",
    { code: gameStore.currentRoom.code },
    {
      failMessage: "방 나가기 실패",
      onSuccess: () => {
        gameStore.resetRoom();
        gameStore.statusMessage = "👋 방을 나갔습니다";
        console.log("방 나가기 성공");
      },
    }
  );
}

export function startGame() {
  if (!gameStore.currentRoom) return;

  gameStore.statusMessage = "⏳ 게임 시작 중...";
  request(
    "start-game",
    { roomCode: gameStore.currentRoom.code },
    {
      failMessage: "게임 시작 실패",
      onSuccess: () => console.log("게임 시작 성공"),
    }
  );
}

export function submitAnswer() {
  const answer = gameStore.answer.trim();
  if (!gameStore.currentRoom || !answer) return;

  // 제출 즉시 입력란을 비워 중복 제출을 막는다
  gameStore.answer = "";

  request<{ result: AnswerCheckResult }>(
    "submit-answer",
    { roomCode: gameStore.currentRoom.code, answer },
    {
      failMessage: "제출 실패",
      onSuccess: (response) => {
        const { isCorrect, message, streak } = response.result;
        gameStore.statusMessage = isCorrect
          ? `✅ ${message} (스트릭: ${streak})`
          : `❌ ${message}`;
        console.log("정답 제출 결과:", response);
      },
    }
  );
}

export function nextRound() {
  if (!gameStore.currentRoom) return;

  gameStore.statusMessage = "⏳ 다음 라운드 준비 중...";
  request(
    "next-round",
    { roomCode: gameStore.currentRoom.code },
    {
      failMessage: "다음 라운드 실패",
      onSuccess: () => console.log("다음 라운드 준비"),
    }
  );
}

export function endGame() {
  if (!gameStore.currentRoom) return;

  request(
    "game-end",
    { roomCode: gameStore.currentRoom.code },
    {
      failMessage: "게임 종료 실패",
      onSuccess: () => console.log("게임 강제 종료"),
    }
  );
}

/**
 * 트랙 로딩이 끝났음을 서버에 알린다.
 *
 * 모든 플레이어가 준비돼야 라운드가 시작되므로 YouTube 플레이어가
 * 재생 가능 상태가 된 직후에 호출된다.
 */
export function notifyPlayerReady() {
  if (!gameStore.currentRoom) return;

  console.log("📤 서버에 준비 완료 알림 전송");
  request(
    "player-ready",
    { roomCode: gameStore.currentRoom.code },
    {
      failMessage: "준비 실패",
      onSuccess: () => {
        console.log("✅ 준비 완료 확인됨");
        gameStore.isLoadingTrack = false;
      },
    }
  );
}
