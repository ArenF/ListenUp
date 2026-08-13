import type { Socket } from "socket.io-client";
import { gameStore } from "./gameStore.svelte";
import { logPlayerState } from "./youtubePlayer.svelte";

/**
 * 서버가 보내오는 게임 이벤트 처리
 *
 * 각 핸들러는 수신한 내용을 gameStore에 반영하는 일만 한다.
 */
export function registerGameSocketHandlers(socket: Socket) {
  // ---------------------------------------------------------------- 연결
  socket.on("connect", () => {
    gameStore.connected = true;
    gameStore.socketId = socket.id ?? "";
    gameStore.statusMessage = `✅ 서버 연결 성공! (ID: ${socket.id})`;
    console.log("서버 연결:", socket.id);
  });

  socket.on("disconnect", () => {
    gameStore.connected = false;
    gameStore.socketId = "";
    gameStore.statusMessage = "❌ 서버 연결 끊김";
    console.log("서버 연결 해제");
  });

  socket.on("connect_error", (error) => {
    gameStore.statusMessage = `❌ 연결 실패: ${error.message}`;
    console.error("연결 에러:", error);
  });

  // ------------------------------------------------------------------ 방
  socket.on("player-joined", (data) => {
    console.log("새 플레이어 참가:", data);
    gameStore.statusMessage = `🎮 ${data.player.nickname}님이 입장했습니다!`;

    if (gameStore.currentRoom) {
      gameStore.players = [...gameStore.players, data.player];
    }
  });

  socket.on("player-left", (data) => {
    console.log("플레이어 퇴장:", data);
    gameStore.statusMessage = "👋 플레이어가 퇴장했습니다";
    gameStore.players = gameStore.players.filter((p) => p.id !== data.playerId);
  });

  socket.on("settings-updated", (data) => {
    console.log("설정 업데이트:", data);
    gameStore.statusMessage = "⚙️ 방 설정이 업데이트되었습니다";

    if (gameStore.currentRoom) {
      gameStore.currentRoom = {
        ...gameStore.currentRoom,
        settings: data.settings,
      };
    }
  });

  // ---------------------------------------------------------------- 게임
  socket.on("game-started", (data) => {
    console.log("🎮 게임 시작!", data);
    gameStore.gameStarted = true;
    gameStore.totalRounds = data.totalRounds;
    gameStore.statusMessage = `🎮 게임 시작! (총 ${data.totalRounds}라운드)`;
  });

  // 라운드 준비 요청 — 트랙을 미리 받아 플레이어를 만들어 둔다
  socket.on("prepare-round", (data) => {
    console.log("📋 라운드 준비 요청:", data);
    gameStore.preparedTrack = data.track;
    gameStore.currentRound = data.roundNumber;
    gameStore.roundEnded = false;
    gameStore.readyPlayers = 0;
    gameStore.isLoadingTrack = true;
    gameStore.statusMessage = `⏳ Round ${data.roundNumber} - 로딩 중...`;
  });

  socket.on("player-ready-status", (data) => {
    console.log("✅ 플레이어 준비:", data);
    gameStore.readyPlayers = data.readyCount;
    gameStore.statusMessage = `⏳ 플레이어 준비 중... (${data.readyCount}/${data.totalPlayers})`;
  });

  socket.on("round-started", (data) => {
    console.log("🎵 라운드 시작!", data);
    gameStore.currentTrack = data.track;
    gameStore.preparedTrack = null;
    gameStore.answer = "";
    gameStore.isLoadingTrack = false;
    gameStore.statusMessage = `🎵 Round ${data.roundNumber}/${gameStore.totalRounds} - 음악을 듣고 맞춰보세요!`;

    startPlayback();
  });

  socket.on("answer-submitted", (data) => {
    console.log("📝 답안 제출됨:", data);
    gameStore.statusMessage = `📝 ${data.nickname}님이 답을 제출했습니다!`;
  });

  socket.on("score-updated", (data) => {
    console.log("📊 점수 업데이트:", data);
    if (!gameStore.currentRoom) return;

    const scores = new Map<string, number>(data.scores);
    gameStore.players = gameStore.players.map((player) => {
      const score = scores.get(player.id);
      return score === undefined ? player : { ...player, score };
    });
  });

  socket.on("round-ended", (data) => {
    console.log("🏁 라운드 종료!", data);
    const { track } = data.result;
    gameStore.statusMessage = `🏁 정답: ${track.name} - ${track.artist}`;
    gameStore.currentTrack = null;
    gameStore.roundEnded = true;

    gameStore.player?.pauseVideo();
  });

  socket.on("game-end", (data) => {
    console.log("🎊 게임 종료!", data);
    gameStore.gameStarted = false;
    gameStore.gameResult = data.result;
    gameStore.statusMessage = `🎊 게임 종료! 우승: ${data.result.winner?.nickname || "없음"}`;
  });
}

/** 라운드가 시작되면 음소거를 풀고 재생을 시작한다 */
function startPlayback() {
  const player = gameStore.player;
  if (!player) return;

  logPlayerState("BEFORE", player);
  console.log("🎬 [ACTION] 음소거 해제 & 재생 시작...");

  player.unMute();
  gameStore.isMuted = false;
  player.setVolume(gameStore.volume);
  player.playVideo();

  setTimeout(() => logPlayerState("AFTER", player), 200);
}
