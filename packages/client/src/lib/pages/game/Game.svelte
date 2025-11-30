<script lang="ts">
  import { onMount } from "svelte";
  import { initSocket } from "../../socket";
  import type { Socket } from "socket.io-client";
  import { gameStore, isHost, updateGameStore, triggerPlayerAnimation, updatePlayerScore, markPlayerCorrect, markPlayerWrong, resetRoundState } from "../../stores/gameStore";
  import GameLobby from "./GameLobby.svelte";
  import GameRoom from "./GameRoom.svelte";
  import Hint from "../../components/common/Hint.svelte";

  // 스토어에서 상태 추출
  let socket: Socket;
  let {
    connected,
    statusMessage,
    roomCode,
    nickname,
    currentRoom,
    players,
    playlists,
    selectedPlaylistId,
    gameStarted,
    currentRound,
    totalRounds,
    currentTrack,
    preparedTrack,
    answer,
    gameResult,
    roundEnded,
    roundResult,
    player,
    playerReady,
    isMuted,
    isLoadingTrack,
    readyPlayers,
    volume,
    playerAnimations,
    previousScores,
    answeredCorrectly,
    answeredWrong,
    currentHint,
  } = $derived($gameStore);

  // 라운드 종료 후 준비 상태
  let canForceStart = $state(false);
  let forceStartTimer: NodeJS.Timeout | null = null;
  let forceStartCountdown: NodeJS.Timeout | null = null;
  let forceStartRemaining = $state(0);

  onMount(() => {
    // 플레이리스트 목록 로드
    loadPlaylists();

    // Socket.IO 초기화 및 연결
    socket = initSocket();
    updateGameStore({ socket });

    // 디버깅용: 콘솔에서 socket 접근 가능하게
    (window as any).socket = socket;

    // 연결 이벤트
    socket.on("connect", () => {
      updateGameStore({
        connected: true,
        statusMessage: `✅ 서버 연결 성공! (ID: ${socket.id})`,
      });
      console.log("서버 연결:", socket.id);
    });

    // 연결 해제 이벤트
    socket.on("disconnect", () => {
      updateGameStore({
        connected: false,
        statusMessage: "❌ 서버 연결 끊김",
      });
      console.log("서버 연결 해제");
    });

    // 연결 에러
    socket.on("connect_error", (error) => {
      updateGameStore({
        statusMessage: `❌ 연결 실패: ${error.message}`,
      });
      console.error("연결 에러:", error);
    });

    // 플레이어 참가 알림
    socket.on("player-joined", (data) => {
      console.log("새 플레이어 참가:", data);
      updateGameStore({
        statusMessage: `🎮 ${data.player.nickname}님이 입장했습니다!`,
      });
      if (currentRoom) {
        // 중복 체크: 이미 있는 플레이어는 추가하지 않음
        const existingPlayer = players.find((p) => p.id === data.player.id);
        if (!existingPlayer) {
          updateGameStore({ players: [...players, data.player] });
        }
      }
    });

    // 플레이어 퇴장 알림
    socket.on("player-left", (data) => {
      console.log("플레이어 퇴장:", data);
      updateGameStore({
        statusMessage: `👋 플레이어가 퇴장했습니다`,
        players: players.filter((p) => p.id !== data.playerId),
      });
    });

    // 설정 업데이트 알림
    socket.on("settings-updated", (data) => {
      console.log("설정 업데이트:", data);
      updateGameStore({
        statusMessage: "⚙️ 방 설정이 업데이트되었습니다",
      });
      if (currentRoom) {
        updateGameStore({
          currentRoom: { ...currentRoom, settings: data.settings },
        });
      }
    });

    // 게임 시작 알림
    socket.on("game-started", (data) => {
      console.log("🎮 게임 시작!", data);
      // players 데이터를 업데이트하여 점수 초기화 (score: 0)
      const playersWithScore = data.players.map((p: any) => ({
        ...p,
        score: p.score || 0,
      }));
      updateGameStore({
        gameStarted: true,
        totalRounds: data.totalRounds,
        players: playersWithScore,
        statusMessage: `🎮 게임 시작! (총 ${data.totalRounds}라운드)`,
      });
    });

    // 라운드 준비 요청
    socket.on("prepare-round", (data) => {
      console.log("📋 라운드 준비 요청:", data);

      // 기존 타이머 정리
      if (forceStartTimer) {
        clearTimeout(forceStartTimer);
        forceStartTimer = null;
      }
      if (forceStartCountdown) {
        clearInterval(forceStartCountdown);
        forceStartCountdown = null;
      }
      canForceStart = false;
      forceStartRemaining = 0;

      // 라운드 시작 시 정답 상태 초기화
      resetRoundState();
      updateGameStore({
        preparedTrack: data.track,
        currentRound: data.roundNumber,
        roundEnded: false,
        readyPlayers: 0,
        statusMessage: `⏳ Round ${data.roundNumber} - 로딩 중...`,
        isLoadingTrack: true,
      });
    });

    // 준비 상태 업데이트
    socket.on("player-ready-status", (data) => {
      console.log("✅ 플레이어 준비:", data);
      updateGameStore({
        readyPlayers: data.readyCount,
        statusMessage: `⏳ 플레이어 준비 중... (${data.readyCount}/${data.totalPlayers})`,
      });
    });

    // 라운드 시작 알림
    socket.on("round-started", (data) => {
      console.log("🎵 라운드 시작!", data);
      updateGameStore({
        currentTrack: data.track,
        preparedTrack: null,
        answer: "",
        isLoadingTrack: false,
        statusMessage: `🎵 Round ${data.roundNumber}/${totalRounds} - 음악을 듣고 맞춰보세요!`,
      });

      // 재생 에러가 있었다면 자동으로 다음 라운드로 스킵
      if (hasPlaybackError) {
        console.warn("⚠️ 재생 불가능한 트랙 - 3초 후 자동 스킵");
        updateGameStore({
          statusMessage: "⚠️ 재생 불가능한 트랙입니다. 곧 다음 라운드로 넘어갑니다...",
        });

        setTimeout(() => {
          console.log("⏭️ 다음 라운드로 자동 스킵");
          hasPlaybackError = false; // 플래그 리셋

          if (currentRoom) {
            socket.emit(
              "next-round",
              { roomCode: currentRoom.code },
              (response: any) => {
                if (!response.success) {
                  console.error("❌ 다음 라운드 실패:", response.error);
                }
              }
            );
          }
        }, 3000);
        return;
      }

      // YouTube 플레이어 재생
      if (player) {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔍 [BEFORE] 플레이어 상태:");
        console.log("  - isMuted:", player.isMuted());
        console.log("  - Volume:", player.getVolume());
        console.log(
          "  - PlayerState:",
          player.getPlayerState(),
          getPlayerStateName(player.getPlayerState())
        );

        console.log("\n🎬 [ACTION] 음소거 해제 & 재생 시작...");
        player.unMute();
        updateGameStore({ isMuted: false });
        player.setVolume(volume);
        player.playVideo();

        setTimeout(() => {
          console.log("\n🔍 [AFTER] 플레이어 상태:");
          console.log("  - isMuted:", player.isMuted());
          console.log("  - Volume:", player.getVolume());
          console.log(
            "  - PlayerState:",
            player.getPlayerState(),
            getPlayerStateName(player.getPlayerState())
          );
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }, 200);
      }
    });

    // 정답 제출 알림
    socket.on("answer-submitted", (data) => {
      console.log("📝 답안 제출됨:", data);
      // 다른 플레이어가 제출한 경우
      if (data.playerId) {
        if (data.isCorrect) {
          // 정답인 경우: 초록색 애니메이션 + 정답 상태로 마킹
          triggerPlayerAnimation(data.playerId, 'correct', 1000);
          markPlayerCorrect(data.playerId);
          updateGameStore({
            statusMessage: `✅ ${data.nickname}님이 정답을 맞췄습니다!`,
          });
        } else {
          // 오답인 경우: 빨간색 shake 애니메이션 + 오답 상태로 마킹
          triggerPlayerAnimation(data.playerId, 'wrong', 600);
          markPlayerWrong(data.playerId);
          updateGameStore({
            statusMessage: `❌ ${data.nickname}님이 오답을 제출했습니다!`,
          });
        }
      }
    });

    // 점수 업데이트
    socket.on("score-updated", (data) => {
      console.log("📊 점수 업데이트:", data);
      console.log("  현재 players:", players);
      console.log("  받은 scores:", data.scores);

      // 점수 맵 생성
      const scoresMap = new Map(data.scores);

      // 모든 플레이어의 점수를 업데이트 (새로운 객체 생성으로 reactivity 보장)
      const updatedPlayers = players.map((p) => {
        const newScore = scoresMap.get(p.id);
        if (typeof newScore === 'number') {
          const oldScore = p.score || 0;

          // 점수가 증가한 경우 애니메이션 및 이전 점수 저장
          if (newScore > oldScore) {
            updatePlayerScore(p.id, newScore);
          }

          return { ...p, score: newScore };
        }
        return p;
      });

      console.log("  업데이트된 players:", updatedPlayers);
      updateGameStore({ players: updatedPlayers });
    });

    // 라운드 종료
    socket.on("round-ended", (data) => {
      console.log("🏁 라운드 종료!", data);

      // 기존 타이머 정리
      if (forceStartTimer) {
        clearTimeout(forceStartTimer);
        forceStartTimer = null;
      }

      // 정답을 맞춘 플레이어들에게 초록색 애니메이션 트리거
      if (data.result && data.result.correctAnswers) {
        data.result.correctAnswers.forEach((answer: any) => {
          const playerId = answer.playerId;
          // 정답 맞춘 플레이어로 마킹
          markPlayerCorrect(playerId);
          // 초록색 애니메이션 (이미 자신은 submitAnswer에서 트리거했을 수 있지만 중복 트리거해도 괜찮음)
          triggerPlayerAnimation(playerId, 'correct', 1000);
        });
      }

      // 라운드 결과 저장
      const resultTrack = data.result.track;

      updateGameStore({
        statusMessage: `🏁 정답: ${resultTrack.name} - ${resultTrack.artist}`,
        currentTrack: resultTrack,  // 정답 트랙 설정 (GamePlayer 유지용)
        roundEnded: true,
        roundResult: data.result,
      });

      // 강제 시작 타이머 설정
      // 타이머 시간 = (endSeconds - startSeconds) / 2
      const videoDuration = resultTrack.endSeconds - resultTrack.startSeconds;
      const timerDuration = Math.floor(videoDuration / 2) * 1000; // ms로 변환

      console.log(`⏱️ 강제 시작 타이머 설정: ${timerDuration / 1000}초`);
      console.log(`🎬 정답 영상은 GameRoom iframe으로 표시됩니다`);

      // 초기 상태 설정
      canForceStart = false;
      forceStartRemaining = Math.floor(videoDuration / 2);

      // 카운트다운 타이머 (1초마다)
      forceStartCountdown = setInterval(() => {
        forceStartRemaining -= 1;
        if (forceStartRemaining <= 0) {
          if (forceStartCountdown) {
            clearInterval(forceStartCountdown);
            forceStartCountdown = null;
          }
        }
      }, 1000);

      // 강제 시작 활성화 타이머
      forceStartTimer = setTimeout(() => {
        canForceStart = true;
        forceStartRemaining = 0;
        console.log("✅ 강제 시작 버튼 활성화");
      }, timerDuration);
    });

    // 게임 종료
    socket.on("game-end", (data) => {
      console.log("🎊 게임 종료!", data);
      updateGameStore({
        gameStarted: false,
        gameResult: data.result,
        statusMessage: `🎊 게임 종료! 우승: ${data.result.winner?.nickname || "없음"}`,
      });
    });

    // 힌트 표시
    socket.on("hint-shown", (data) => {
      console.log("💡 힌트 표시:", data);
      updateGameStore({
        currentHint: data.hint,
      });

      // 5초 후 힌트 자동 숨김
      setTimeout(() => {
        updateGameStore({ currentHint: null });
      }, 5000);
    });

    // 서버 연결 시작
    socket.connect();

    // YouTube API 로드
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log("✅ YouTube Player API 로드 완료!");
      updateGameStore({ playerReady: true });
    };

    // 컴포넌트 정리
    return () => {
      socket.disconnect();
      if (player) {
        player.destroy();
      }
    };
  });

  // YouTube Player 초기화 및 업데이트
  // preparedTrack의 id만 추적하여 무한 루프 방지
  let lastLoadedTrackId: string | null = null;
  let hasPlaybackError = false; // 재생 에러 플래그

  $effect(() => {
    if (!playerReady || !preparedTrack || !currentRoom) {
      return;
    }

    // 같은 트랙이면 재생성하지 않음 (무한 루프 방지)
    if (lastLoadedTrackId === preparedTrack.id) {
      return;
    }

    const YT = (window as any).YT;
    if (!YT || !YT.Player) {
      console.error("❌ YouTube Player API가 로드되지 않았습니다");
      return;
    }

    // 기존 플레이어 파괴
    if (player && typeof player.destroy === "function") {
      console.log("🗑️ 기존 플레이어 파괴");
      try {
        player.destroy();
      } catch (e) {
        console.warn("플레이어 파괴 중 에러 (무시):", e);
      }
    }

    // DOM 요소 확인 및 재생성
    let playerElement = document.getElementById("youtube-player");
    if (!playerElement) {
      console.log("🔨 YouTube Player DOM 요소 재생성");
      const container = document.querySelector(".youtube-player-hidden");
      if (container) {
        const newDiv = document.createElement("div");
        newDiv.id = "youtube-player";
        container.appendChild(newDiv);
        playerElement = newDiv;
      } else {
        console.error("❌ YouTube Player 컨테이너를 찾을 수 없습니다");
        return;
      }
    }

    // 새 플레이어 생성
    console.log("🎬 YouTube Player 생성 중...", preparedTrack.id);
    lastLoadedTrackId = preparedTrack.id;  // 현재 로드된 트랙 ID 저장
    hasPlaybackError = false; // 새 트랙 로드 시 에러 플래그 리셋

    // onReady의 setTimeout을 저장하기 위한 변수
    let readyTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const newPlayer = new YT.Player("youtube-player", {
      height: "300",
      width: "100%",
      videoId: preparedTrack.id,
      playerVars: {
        autoplay: 1,
        start: preparedTrack.startSeconds,
        end: preparedTrack.endSeconds,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        disablekb: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log("✅ YouTube Player 준비 완료!");
          event.target.mute();
          updateGameStore({ isMuted: true });

          readyTimeoutId = setTimeout(() => {
            event.target.pauseVideo();
            notifyPlayerReady();
          }, 500);
        },
        onError: (event: any) => {
          const errorCode = event.data;
          console.error("❌ YouTube Player 에러:", errorCode);

          // onReady의 setTimeout 취소 (중복 호출 방지)
          if (readyTimeoutId) {
            clearTimeout(readyTimeoutId);
            readyTimeoutId = null;
            console.log("🚫 onReady의 준비 알림 예약 취소됨");
          }

          // 재생 에러 플래그 설정
          hasPlaybackError = true;

          // 에러 코드별 메시지
          let errorMessage = "❌ 영상 재생 오류";
          switch (errorCode) {
            case 2:
              errorMessage = "❌ 잘못된 비디오 설정";
              break;
            case 5:
              errorMessage = "❌ 비디오 재생 불가 (HTML5 오류)";
              break;
            case 100:
              errorMessage = "❌ 비디오를 찾을 수 없음";
              break;
            case 101:
            case 150:
              errorMessage = "❌ 이 비디오는 임베드 재생이 제한되어 있습니다";
              break;
            default:
              errorMessage = `❌ 영상 재생 오류 (코드: ${errorCode})`;
          }

          updateGameStore({
            statusMessage: errorMessage,
            isLoadingTrack: false,
          });

          // 에러 발생 시에도 다른 플레이어들이 대기하지 않도록 준비 완료 알림
          console.warn("⚠️ 에러 발생으로 인한 강제 준비 완료 처리");
          notifyPlayerReady();
        },
      },
    });

    // untrack을 사용하여 player 업데이트가 이 effect를 다시 트리거하지 않도록 함
    updateGameStore({ player: newPlayer });
  });

  // 플레이어 상태 이름 헬퍼 함수
  function getPlayerStateName(state: number): string {
    const states: Record<number, string> = {
      "-1": "UNSTARTED",
      "0": "ENDED",
      "1": "PLAYING",
      "2": "PAUSED",
      "3": "BUFFERING",
      "5": "CUED",
    };
    return states[state] || "UNKNOWN";
  }

  // 플레이리스트 목록 로드
  async function loadPlaylists() {
    try {
      const response = await fetch("/api/playlists");
      if (response.ok) {
        const data = await response.json();
        updateGameStore({ playlists: data });
        console.log("✅ Loaded playlists:", data);
      }
    } catch (error) {
      console.error("❌ Failed to load playlists:", error);
    }
  }

  // 서버에 플레이어 준비 완료 알림
  function notifyPlayerReady() {
    if (!currentRoom) return;

    console.log("📤 서버에 준비 완료 알림 전송");
    socket.emit(
      "player-ready",
      {
        roomCode: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          console.log("✅ 준비 완료 확인됨");
          updateGameStore({ isLoadingTrack: false });
        } else {
          console.error("❌ 준비 실패:", response.error);
        }
      }
    );
  }

  // 라운드 종료 후 준비 완료 알림 (다음 라운드 준비)
  function markReady() {
    if (!currentRoom) return;

    console.log("📤 라운드 종료 후 준비 완료 알림 전송");
    socket.emit(
      "player-ready",
      {
        roomCode: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          console.log("✅ 준비 완료 확인됨");
        } else {
          console.error("❌ 준비 실패:", response.error);
        }
      }
    );
  }

  // 방 생성
  function createRoom() {
    if (!nickname.trim()) {
      updateGameStore({ statusMessage: "⚠️ 닉네임을 입력해주세요" });
      return;
    }

    updateGameStore({ statusMessage: "⏳ 방 생성 중..." });
    socket.emit(
      "create-room",
      {
        nickname: nickname.trim(),
        settings: {
          maxPlayers: 8,
          roundInterval: 30,
          playlistId: selectedPlaylistId,
        },
      },
      (response: any) => {
        if (response.success) {
          updateGameStore({
            currentRoom: response.room,
            roomCode: response.room.code,
            players: response.room.players,
            statusMessage: `✅ 방 생성 완료! 코드: ${response.room.code}`,
          });
          console.log("방 생성 성공:", response.room);
        } else {
          updateGameStore({
            statusMessage: `❌ 방 생성 실패: ${response.error}`,
          });
          console.error("방 생성 실패:", response.error);
        }
      }
    );
  }

  // 방 참가
  function joinRoom() {
    if (!nickname.trim()) {
      updateGameStore({ statusMessage: "⚠️ 닉네임을 입력해주세요" });
      return;
    }
    if (!roomCode.trim()) {
      updateGameStore({ statusMessage: "⚠️ 방 코드를 입력해주세요" });
      return;
    }

    updateGameStore({ statusMessage: "⏳ 방 참가 중..." });
    socket.emit(
      "join-room",
      {
        code: roomCode.trim().toUpperCase(),
        nickname: nickname.trim(),
      },
      (response: any) => {
        if (response.success) {
          updateGameStore({
            currentRoom: response.room,
            players: response.room.players,
            statusMessage: `✅ 방 참가 완료! (${response.room.players.length}명)`,
          });
          console.log("방 참가 성공:", response.room);
        } else {
          updateGameStore({
            statusMessage: `❌ 방 참가 실패: ${response.error}`,
          });
          console.error("방 참가 실패:", response.error);
        }
      }
    );
  }

  // 방 나가기
  function leaveRoom() {
    if (!currentRoom) return;

    socket.emit(
      "leave-room",
      {
        code: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          updateGameStore({
            statusMessage: "👋 방을 나갔습니다",
            currentRoom: null,
            players: [],
            roomCode: "",
            gameStarted: false,
            gameResult: null,
          });
          console.log("방 나가기 성공");
        } else {
          updateGameStore({ statusMessage: "❌ 방 나가기 실패" });
          console.error("방 나가기 실패");
        }
      }
    );
  }

  // 게임 시작 (방장만)
  function startGame() {
    if (!currentRoom) return;

    updateGameStore({ statusMessage: "⏳ 게임 시작 중..." });
    socket.emit(
      "start-game",
      {
        roomCode: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          console.log("게임 시작 성공");
        } else {
          updateGameStore({
            statusMessage: `❌ 게임 시작 실패: ${response.error}`,
          });
          console.error("게임 시작 실패:", response.error);
        }
      }
    );
  }

  // 정답 제출
  function submitAnswer() {
    if (!currentRoom || !answer.trim() || !socket) return;

    const userAnswer = answer.trim();
    updateGameStore({ answer: "" });

    // 제출 애니메이션 트리거 (자신의 네임바)
    triggerPlayerAnimation(socket.id!, 'submitted', 600);

    socket.emit(
      "submit-answer",
      {
        roomCode: currentRoom.code,
        answer: userAnswer,
      },
      (response: any) => {
        if (response.success) {
          const result = response.result;
          if (result.isCorrect) {
            // 정답 애니메이션 트리거
            triggerPlayerAnimation(socket.id!, 'correct', 1000);
            // 정답 맞춘 플레이어로 마킹
            markPlayerCorrect(socket.id!);
            updateGameStore({
              statusMessage: `✅ ${result.message} (스트릭: ${result.streak})`,
            });
          } else {
            // 오답 애니메이션 트리거 (shake) + 오답 상태로 마킹
            triggerPlayerAnimation(socket.id!, 'wrong', 600);
            markPlayerWrong(socket.id!);
            updateGameStore({
              statusMessage: `❌ ${result.message}`,
            });
          }
          console.log("정답 제출 결과:", response);
        } else {
          updateGameStore({
            statusMessage: `❌ 제출 실패: ${response.error}`,
          });
          console.error("정답 제출 실패:", response.error);
        }
      }
    );
  }

  // 다음 라운드 (방장만)
  function nextRound() {
    if (!currentRoom) return;

    updateGameStore({ statusMessage: "⏳ 다음 라운드 준비 중..." });
    socket.emit(
      "next-round",
      {
        roomCode: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          console.log("다음 라운드 준비");
        } else {
          updateGameStore({
            statusMessage: `❌ 다음 라운드 실패: ${response.error}`,
          });
          console.error("다음 라운드 실패:", response.error);
        }
      }
    );
  }

  // 게임 종료 (방장만)
  function endGame() {
    if (!currentRoom) return;

    socket.emit(
      "game-end",
      {
        roomCode: currentRoom.code,
      },
      (response: any) => {
        if (response.success) {
          console.log("게임 강제 종료");
        } else {
          updateGameStore({
            statusMessage: `❌ 게임 종료 실패: ${response.error}`,
          });
          console.error("게임 종료 실패:", response.error);
        }
      }
    );
  }

  // 음량 조절 함수
  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newVolume = parseInt(target.value);
    updateGameStore({ volume: newVolume });

    if (player && typeof player.setVolume === "function") {
      player.setVolume(newVolume);
      console.log(`🔊 음량 변경: ${newVolume}%`);
    }
  }

  // 입력 업데이트 핸들러들
  function handleNicknameChange(e: Event) {
    const target = e.target as HTMLInputElement;
    updateGameStore({ nickname: target.value });
  }

  function handleRoomCodeChange(e: Event) {
    const target = e.target as HTMLInputElement;
    updateGameStore({ roomCode: target.value });
  }

  function handlePlaylistChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    updateGameStore({ selectedPlaylistId: target.value });
  }

  function handleAnswerChange(e: Event) {
    const target = e.target as HTMLInputElement;
    updateGameStore({ answer: target.value });
  }
</script>

<div class="game-container">
  <!-- 연결 상태 -->
  <div class="status-bar" class:connected={connected}>
    <div class="status-indicator"></div>
    <span>{statusMessage}</span>
  </div>

  {#if !currentRoom}
    <GameLobby
      {connected}
      {nickname}
      {roomCode}
      {selectedPlaylistId}
      {playlists}
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      onNicknameChange={handleNicknameChange}
      onRoomCodeChange={handleRoomCodeChange}
      onPlaylistChange={handlePlaylistChange}
    />
  {:else}
    <GameRoom
      {currentRoom}
      {players}
      {gameStarted}
      {gameResult}
      isHost={$isHost}
      {currentRound}
      {totalRounds}
      {isLoadingTrack}
      {readyPlayers}
      {preparedTrack}
      {currentTrack}
      {isMuted}
      {volume}
      {roundEnded}
      {roundResult}
      {canForceStart}
      {forceStartRemaining}
      {answer}
      {playerAnimations}
      {previousScores}
      {answeredCorrectly}
      {answeredWrong}
      onStartGame={startGame}
      onLeaveRoom={leaveRoom}
      onVolumeChange={handleVolumeChange}
      onAnswerChange={handleAnswerChange}
      onSubmitAnswer={submitAnswer}
      onNextRound={nextRound}
      onMarkReady={markReady}
      onEndGame={endGame}
    />
  {/if}

  <div class="info">
    <p>🔧 Socket.IO 연결 테스트 v2.0</p>
    <p>Backend: Node.js + Socket.IO + TypeScript</p>
    <p>Frontend: Svelte 5 + Socket.IO Client</p>
  </div>

  <!-- 힌트 표시 -->
  {#if currentHint}
    <Hint
      text={currentHint.text}
      index={currentHint.index}
      total={currentHint.total}
      onDismiss={() => updateGameStore({ currentHint: null })}
    />
  {/if}
</div>

<style>
  .game-container {
    text-align: center;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  /* 상태바 */
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background-color: #ffebee;
    border-radius: 8px;
    margin-bottom: 2rem;
    transition: background-color 0.3s;
  }

  .status-bar.connected {
    background-color: #e8f5e9;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #f44336;
    animation: pulse 2s infinite;
  }

  .status-bar.connected .status-indicator {
    background-color: #4caf50;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* 하단 정보 */
  .info {
    margin-top: 3rem;
    padding: 1.5rem;
    background-color: #f0f0f0;
    border-radius: 8px;
    font-size: 0.9rem;
    color: #666;
  }

  .info p {
    margin: 0.5rem 0;
  }
</style>
