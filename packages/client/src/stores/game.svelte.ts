import { connection, request, socket } from "./socket.svelte";
import { onRoomLeft, roomStore } from "./room.svelte";
import { playerStore } from "./player.svelte";
import type {
  AnswerCheckResult,
  GameResult,
  HiddenTrack,
} from "../types/index";

/**
 * 게임 진행 상태
 *
 * 라운드 진행, 트랙 로딩·재생 시점, 정답 제출, 최종 결과를 다룬다.
 * 방과 참가자 목록은 `room` store, YouTube 제어는 `player` store가 맡는다.
 */
class GameStore {
  started = $state(false);
  currentRound = $state(0);
  totalRounds = $state(0);
  /** 재생 중인 트랙 (라운드 시작 후) */
  currentTrack = $state<HiddenTrack | null>(null);
  /** 미리 받아둔 다음 트랙 (플레이어 로딩용) */
  preparedTrack = $state<HiddenTrack | null>(null);
  roundEnded = $state(false);
  isLoadingTrack = $state(false);
  readyPlayers = $state(0);
  result = $state<GameResult | null>(null);

  /** 정답 입력란. 새 라운드가 시작되면 서버 이벤트로 비워지므로 store에 둔다 */
  answer = $state("");

  /** 게임 상태를 비우고 플레이어를 정리한다 (방을 나가면 자동으로 호출된다) */
  reset() {
    this.started = false;
    this.currentRound = 0;
    this.totalRounds = 0;
    this.currentTrack = null;
    this.preparedTrack = null;
    this.roundEnded = false;
    this.isLoadingTrack = false;
    this.readyPlayers = 0;
    this.result = null;
    this.answer = "";

    playerStore.destroy();
  }
}

export const gameStore = new GameStore();

// 방을 나가면 진행 중이던 게임 상태도 비운다
onRoomLeft(() => gameStore.reset());

// ------------------------------------------------------------ 서버 → 클라이언트

socket.on("game-started", (data) => {
  console.log("🎮 게임 시작!", data);
  gameStore.started = true;
  gameStore.totalRounds = data.totalRounds;
  connection.statusMessage = `🎮 게임 시작! (총 ${data.totalRounds}라운드)`;
});

// 라운드 준비 요청 — 트랙을 미리 받아 플레이어를 만들어 둔다
socket.on("prepare-round", (data) => {
  console.log("📋 라운드 준비 요청:", data);
  gameStore.preparedTrack = data.track;
  gameStore.currentRound = data.roundNumber;
  gameStore.roundEnded = false;
  gameStore.readyPlayers = 0;
  gameStore.isLoadingTrack = true;
  connection.statusMessage = `⏳ Round ${data.roundNumber} - 로딩 중...`;

  playerStore.load(data.track, {
    onReady: notifyPlayerReady,
    onError: () => {
      connection.statusMessage = "❌ 영상 재생 오류";
      gameStore.isLoadingTrack = false;
    },
  });
});

socket.on("player-ready-status", (data) => {
  console.log("✅ 플레이어 준비:", data);
  gameStore.readyPlayers = data.readyCount;
  connection.statusMessage = `⏳ 플레이어 준비 중... (${data.readyCount}/${data.totalPlayers})`;
});

socket.on("round-started", (data) => {
  console.log("🎵 라운드 시작!", data);
  gameStore.currentTrack = data.track;
  gameStore.preparedTrack = null;
  gameStore.answer = "";
  gameStore.isLoadingTrack = false;
  connection.statusMessage = `🎵 Round ${data.roundNumber}/${gameStore.totalRounds} - 음악을 듣고 맞춰보세요!`;

  playerStore.play();
});

socket.on("answer-submitted", (data) => {
  console.log("📝 답안 제출됨:", data);
  connection.statusMessage = `📝 ${data.nickname}님이 답을 제출했습니다!`;
});

socket.on("round-ended", (data) => {
  console.log("🏁 라운드 종료!", data);
  const { track } = data.result;
  connection.statusMessage = `🏁 정답: ${track.name} - ${track.artist}`;
  gameStore.currentTrack = null;
  gameStore.roundEnded = true;

  playerStore.pause();
});

socket.on("game-end", (data) => {
  console.log("🎊 게임 종료!", data);
  gameStore.started = false;
  gameStore.result = data.result;
  connection.statusMessage = `🎊 게임 종료! 우승: ${data.result.winner?.nickname || "없음"}`;
});

// ------------------------------------------------------------ 클라이언트 → 서버

export function startGame() {
  if (!roomStore.current) return;

  connection.statusMessage = "⏳ 게임 시작 중...";
  request(
    "start-game",
    { roomCode: roomStore.current.code },
    {
      failMessage: "게임 시작 실패",
      onSuccess: () => console.log("게임 시작 성공"),
    }
  );
}

export function submitAnswer() {
  const answer = gameStore.answer.trim();
  if (!roomStore.current || !answer) return;

  // 제출 즉시 입력란을 비워 중복 제출을 막는다
  gameStore.answer = "";

  request<{ result: AnswerCheckResult }>(
    "submit-answer",
    { roomCode: roomStore.current.code, answer },
    {
      failMessage: "제출 실패",
      onSuccess: (response) => {
        const { isCorrect, message, streak } = response.result;
        connection.statusMessage = isCorrect
          ? `✅ ${message} (스트릭: ${streak})`
          : `❌ ${message}`;
        console.log("정답 제출 결과:", response);
      },
    }
  );
}

export function nextRound() {
  if (!roomStore.current) return;

  connection.statusMessage = "⏳ 다음 라운드 준비 중...";
  request(
    "next-round",
    { roomCode: roomStore.current.code },
    {
      failMessage: "다음 라운드 실패",
      onSuccess: () => console.log("다음 라운드 준비"),
    }
  );
}

export function endGame() {
  if (!roomStore.current) return;

  request(
    "game-end",
    { roomCode: roomStore.current.code },
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
function notifyPlayerReady() {
  if (!roomStore.current) return;

  console.log("📤 서버에 준비 완료 알림 전송");
  request(
    "player-ready",
    { roomCode: roomStore.current.code },
    {
      failMessage: "준비 실패",
      onSuccess: () => {
        console.log("✅ 준비 완료 확인됨");
        gameStore.isLoadingTrack = false;
      },
    }
  );
}
