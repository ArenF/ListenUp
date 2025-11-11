<script lang="ts">
  import { onMount } from "svelte";
  import { initSocket } from "./lib/socket";
  import type { Socket } from "socket.io-client";
  import PlaylistManager from "./lib/components/PlaylistManager.svelte";

  // 페이지 라우팅
  let currentPage = $state<"game" | "playlist">("game");

  let socket: Socket;
  let connected = $state(false);
  let roomCode = $state("");
  let nickname = $state("");
  let statusMessage = $state("서버에 연결되지 않음");
  let players = $state<any[]>([]);
  let currentRoom = $state<any>(null);

  // 플레이리스트 선택
  let playlists = $state<any[]>([]);
  let selectedPlaylistId = $state("test-playlist");

  // 게임 상태
  let gameStarted = $state(false);
  let currentRound = $state(0);
  let totalRounds = $state(0);
  let currentTrack = $state<any>(null);
  let preparedTrack = $state<any>(null);  // 준비 중인 트랙
  let answer = $state("");
  let gameResult = $state<any>(null);

  // YouTube Player 상태
  let player: any = null;
  let playerReady = $state(false);
  let isMuted = $state(true);
  let isLoadingTrack = $state(false);  // 트랙 로딩 중
  let readyPlayers = $state(0);  // 준비된 플레이어 수
  let volume = $state(50);  // 음량 (0-100)

  // 라운드 종료 상태
  let roundEnded = $state(false);

  onMount(() => {
    // 플레이리스트 목록 로드
    loadPlaylists();

    // Socket.IO 초기화 및 연결
    socket = initSocket();

    // 디버깅용: 콘솔에서 socket 접근 가능하게
    (window as any).socket = socket;

    // 연결 이벤트
    socket.on("connect", () => {
      connected = true;
      statusMessage = `✅ 서버 연결 성공! (ID: ${socket.id})`;
      console.log("서버 연결:", socket.id);
    });

    // 연결 해제 이벤트
    socket.on("disconnect", () => {
      connected = false;
      statusMessage = "❌ 서버 연결 끊김";
      console.log("서버 연결 해제");
    });

    // 연결 에러
    socket.on("connect_error", (error) => {
      statusMessage = `❌ 연결 실패: ${error.message}`;
      console.error("연결 에러:", error);
    });

    // 플레이어 참가 알림
    socket.on("player-joined", (data) => {
      console.log("새 플레이어 참가:", data);
      statusMessage = `🎮 ${data.player.nickname}님이 입장했습니다!`;
      if (currentRoom) {
        players = [...players, data.player];
      }
    });

    // 플레이어 퇴장 알림
    socket.on("player-left", (data) => {
      console.log("플레이어 퇴장:", data);
      statusMessage = `👋 플레이어가 퇴장했습니다`;
      players = players.filter(p => p.id !== data.playerId);
    });

    // 설정 업데이트 알림
    socket.on("settings-updated", (data) => {
      console.log("설정 업데이트:", data);
      statusMessage = "⚙️ 방 설정이 업데이트되었습니다";
      if (currentRoom) {
        currentRoom.settings = data.settings;
      }
    });

    // 게임 시작 알림
    socket.on("game-started", (data) => {
      console.log("🎮 게임 시작!", data);
      gameStarted = true;
      totalRounds = data.totalRounds;
      statusMessage = `🎮 게임 시작! (총 ${data.totalRounds}라운드)`;
    });

    // 라운드 준비 요청 (새로운 이벤트!)
    socket.on("prepare-round", (data) => {
      console.log("📋 라운드 준비 요청:", data);
      preparedTrack = data.track;
      currentRound = data.roundNumber;
      roundEnded = false;
      readyPlayers = 0;
      statusMessage = `⏳ Round ${data.roundNumber} - 로딩 중...`;
      isLoadingTrack = true;

      // YouTube Player에 트랙 로드 (자동으로 $effect 트리거)
    });

    // 준비 상태 업데이트
    socket.on("player-ready-status", (data) => {
      console.log("✅ 플레이어 준비:", data);
      readyPlayers = data.readyCount;
      statusMessage = `⏳ 플레이어 준비 중... (${data.readyCount}/${data.totalPlayers})`;
    });

    // 라운드 시작 알림 (모든 플레이어 준비 완료 후)
    socket.on("round-started", (data) => {
      console.log("🎵 라운드 시작!", data);
      currentTrack = data.track;
      preparedTrack = null;
      answer = "";
      isLoadingTrack = false;
      statusMessage = `🎵 Round ${data.roundNumber}/${totalRounds} - 음악을 듣고 맞춰보세요!`;

      // ⭐ 디버깅: 플레이어 상태 확인
      if (player) {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🔍 [BEFORE] 플레이어 상태:");
        console.log("  - isMuted:", player.isMuted());
        console.log("  - Volume:", player.getVolume());
        console.log("  - PlayerState:", player.getPlayerState(), getPlayerStateName(player.getPlayerState()));

        console.log("\n🎬 [ACTION] 음소거 해제 & 재생 시작...");
        player.unMute();
        isMuted = false;
        player.setVolume(volume);
        player.playVideo();

        // 약간의 딜레이 후 다시 확인
        setTimeout(() => {
          console.log("\n🔍 [AFTER] 플레이어 상태:");
          console.log("  - isMuted:", player.isMuted());
          console.log("  - Volume:", player.getVolume());
          console.log("  - PlayerState:", player.getPlayerState(), getPlayerStateName(player.getPlayerState()));
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        }, 200);
      } else {
        console.error("❌ player 객체가 없습니다!");
      }
    });

    // 플레이어 상태 이름 헬퍼 함수
    function getPlayerStateName(state: number): string {
      const states: Record<number, string> = {
        '-1': 'UNSTARTED',
        '0': 'ENDED',
        '1': 'PLAYING',
        '2': 'PAUSED',
        '3': 'BUFFERING',
        '5': 'CUED'
      };
      return states[state] || 'UNKNOWN';
    }

    // 정답 제출 알림
    socket.on("answer-submitted", (data) => {
      console.log("📝 답안 제출됨:", data);
      statusMessage = `📝 ${data.nickname}님이 답을 제출했습니다!`;
    });

    // 점수 업데이트
    socket.on("score-updated", (data) => {
      console.log("📊 점수 업데이트:", data);
      // 점수 정보를 players 배열에 업데이트
      if (currentRoom) {
        data.scores.forEach(([playerId, score]: [string, number]) => {
          const player = players.find(p => p.id === playerId);
          if (player) {
            player.score = score;
          }
        });
        players = [...players]; // 반응성 트리거
      }
    });

    // 라운드 종료
    socket.on("round-ended", (data) => {
      console.log("🏁 라운드 종료!", data);
      statusMessage = `🏁 정답: ${data.result.track.name} - ${data.result.track.artist}`;
      currentTrack = null;
      roundEnded = true;

      // 플레이어 일시정지
      if (player) {
        player.pauseVideo();
      }
    });

    // 게임 종료
    socket.on("game-end", (data) => {
      console.log("🎊 게임 종료!", data);
      gameStarted = false;
      gameResult = data.result;
      statusMessage = `🎊 게임 종료! 우승: ${data.result.winner?.nickname || "없음"}`;
    });

    // 서버 연결 시작
    socket.connect();

    // YouTube API 로드
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('✅ YouTube Player API 로드 완료!');
      playerReady = true;
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
  $effect(() => {
    if (!playerReady || !preparedTrack || !currentRoom) {
      return;
    }

    const YT = (window as any).YT;
    if (!YT || !YT.Player) {
      console.error('❌ YouTube Player API가 로드되지 않았습니다');
      return;
    }

    // ⭐ 기존 플레이어 파괴 (매번 새로 생성)
    if (player && typeof player.destroy === 'function') {
      console.log('🗑️ 기존 플레이어 파괴');
      try {
        player.destroy();
      } catch (e) {
        console.warn('플레이어 파괴 중 에러 (무시):', e);
      }
      player = null;
    }

    // 새 플레이어 생성
    console.log('🎬 YouTube Player 생성 중...', preparedTrack.id);
    player = new YT.Player('youtube-player', {
      height: '300',
      width: '100%',
      videoId: preparedTrack.id,
      playerVars: {
        autoplay: 1,
        start: preparedTrack.startSeconds,
        end: preparedTrack.endSeconds,
        controls: 0,  // 컨트롤 숨김
        rel: 0,
        modestbranding: 1,
        disablekb: 1,  // 키보드 입력 비활성화
      },
      events: {
        onReady: (event: any) => {
          console.log('✅ YouTube Player 준비 완료!');

          // 음소거로 시작 (자동 재생 허용)
          event.target.mute();
          isMuted = true;

          // 일시정지 (준비만 하고 대기)
          setTimeout(() => {
            event.target.pauseVideo();
            notifyPlayerReady();
          }, 500);
        },
        onError: (event: any) => {
          console.error('❌ YouTube Player 에러:', event.data);
          statusMessage = '❌ 영상 재생 오류';
          isLoadingTrack = false;
        },
      },
    });
  });

  // 플레이리스트 목록 로드
  async function loadPlaylists() {
    try {
      const response = await fetch("/api/playlists");
      if (response.ok) {
        playlists = await response.json();
        console.log("✅ Loaded playlists:", playlists);
      }
    } catch (error) {
      console.error("❌ Failed to load playlists:", error);
    }
  }

  // 서버에 플레이어 준비 완료 알림
  function notifyPlayerReady() {
    if (!currentRoom) return;

    console.log('📤 서버에 준비 완료 알림 전송');
    socket.emit("player-ready", {
      roomCode: currentRoom.code
    }, (response: any) => {
      if (response.success) {
        console.log('✅ 준비 완료 확인됨');
        isLoadingTrack = false;
      } else {
        console.error('❌ 준비 실패:', response.error);
      }
    });
  }

  // 방 생성
  function createRoom() {
    if (!nickname.trim()) {
      statusMessage = "⚠️ 닉네임을 입력해주세요";
      return;
    }

    statusMessage = "⏳ 방 생성 중...";
    socket.emit("create-room", {
      nickname: nickname.trim(),
      settings: {
        maxPlayers: 8,
        roundInterval: 30,
        playlistId: selectedPlaylistId
      }
    }, (response: any) => {
      if (response.success) {
        currentRoom = response.room;
        roomCode = response.room.code;
        players = response.room.players;
        statusMessage = `✅ 방 생성 완료! 코드: ${response.room.code}`;
        console.log("방 생성 성공:", response.room);
      } else {
        statusMessage = `❌ 방 생성 실패: ${response.error}`;
        console.error("방 생성 실패:", response.error);
      }
    });
  }

  // 방 참가
  function joinRoom() {
    if (!nickname.trim()) {
      statusMessage = "⚠️ 닉네임을 입력해주세요";
      return;
    }
    if (!roomCode.trim()) {
      statusMessage = "⚠️ 방 코드를 입력해주세요";
      return;
    }

    statusMessage = "⏳ 방 참가 중...";
    socket.emit("join-room", {
      code: roomCode.trim().toUpperCase(),
      nickname: nickname.trim()
    }, (response: any) => {
      if (response.success) {
        currentRoom = response.room;
        players = response.room.players;
        statusMessage = `✅ 방 참가 완료! (${response.room.players.length}명)`;
        console.log("방 참가 성공:", response.room);
      } else {
        statusMessage = `❌ 방 참가 실패: ${response.error}`;
        console.error("방 참가 실패:", response.error);
      }
    });
  }

  // 방 나가기
  function leaveRoom() {
    if (!currentRoom) return;

    socket.emit("leave-room", {
      code: currentRoom.code
    }, (response: any) => {
      if (response.success) {
        statusMessage = "👋 방을 나갔습니다";
        currentRoom = null;
        players = [];
        roomCode = "";
        gameStarted = false;
        gameResult = null;
        console.log("방 나가기 성공");
      } else {
        statusMessage = "❌ 방 나가기 실패";
        console.error("방 나가기 실패");
      }
    });
  }

  // 게임 시작 (방장만)
  function startGame() {
    if (!currentRoom) return;

    statusMessage = "⏳ 게임 시작 중...";
    socket.emit("start-game", {
      roomCode: currentRoom.code
    }, (response: any) => {
      if (response.success) {
        console.log("게임 시작 성공");
      } else {
        statusMessage = `❌ 게임 시작 실패: ${response.error}`;
        console.error("게임 시작 실패:", response.error);
      }
    });
  }

  // 정답 제출
  function submitAnswer() {
    if (!currentRoom || !answer.trim()) return;

    const userAnswer = answer.trim();
    answer = ""; // 입력 초기화

    socket.emit("submit-answer", {
      roomCode: currentRoom.code,
      answer: userAnswer
    }, (response: any) => {
      if (response.success) {
        const result = response.result;
        if (result.isCorrect) {
          statusMessage = `✅ ${result.message} (스트릭: ${result.streak})`;
        } else {
          statusMessage = `❌ ${result.message}`;
        }
        console.log("정답 제출 결과:", response);
      } else {
        statusMessage = `❌ 제출 실패: ${response.error}`;
        console.error("정답 제출 실패:", response.error);
      }
    });
  }

  // 다음 라운드 (방장만)
  function nextRound() {
    if (!currentRoom) return;

    statusMessage = "⏳ 다음 라운드 준비 중...";
    socket.emit("next-round", {
      roomCode: currentRoom.code
    }, (response: any) => {
      if (response.success) {
        console.log("다음 라운드 준비");
      } else {
        statusMessage = `❌ 다음 라운드 실패: ${response.error}`;
        console.error("다음 라운드 실패:", response.error);
      }
    });
  }

  // 게임 종료 (방장만)
  function endGame() {
    if (!currentRoom) return;

    socket.emit("game-end", {
      roomCode: currentRoom.code
    }, (response: any) => {
      if (response.success) {
        console.log("게임 강제 종료");
      } else {
        statusMessage = `❌ 게임 종료 실패: ${response.error}`;
        console.error("게임 종료 실패:", response.error);
      }
    });
  }

  // 음량 조절 함수
  function handleVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    volume = parseInt(target.value);

    if (player && typeof player.setVolume === 'function') {
      player.setVolume(volume);
      console.log(`🔊 음량 변경: ${volume}%`);
    }
  }

  // 방장 여부 확인
  let isHost = $derived(currentRoom && currentRoom.players.some((p: any) => p.id === socket?.id && p.isHost));
</script>

<main>
  <!-- 네비게이션 -->
  <nav class="navbar">
    <h1>🎵 ListenUp!</h1>
    <div class="nav-buttons">
      <button
        class="nav-button"
        class:active={currentPage === "game"}
        onclick={() => currentPage = "game"}
      >
        🎮 게임
      </button>
      <button
        class="nav-button"
        class:active={currentPage === "playlist"}
        onclick={() => currentPage = "playlist"}
      >
        🎵 플레이리스트 관리
      </button>
    </div>
  </nav>

  {#if currentPage === "playlist"}
    <!-- 플레이리스트 관리 페이지 -->
    <PlaylistManager />
  {:else}
    <!-- 게임 페이지 -->
    <div class="game-container">
      <!-- 연결 상태 -->
      <div class="status-bar" class:connected={connected}>
        <div class="status-indicator"></div>
        <span>{statusMessage}</span>
      </div>

  {#if !currentRoom}
    <!-- 방 생성/참가 폼 -->
    <div class="form-container">
      <div class="input-group">
        <label for="nickname">닉네임</label>
        <input
          id="nickname"
          type="text"
          bind:value={nickname}
          placeholder="닉네임 입력"
          disabled={!connected}
        />
      </div>

      <div class="section">
        <h2>방 생성</h2>
        <div class="input-group">
          <label for="playlist">플레이리스트 선택</label>
          <select id="playlist" bind:value={selectedPlaylistId} disabled={!connected}>
            {#each playlists as playlist}
              <option value={playlist.id}>{playlist.name} ({playlist.tracks?.length || 0} 트랙)</option>
            {/each}
          </select>
        </div>
        <button
          onclick={createRoom}
          disabled={!connected || !nickname.trim()}
        >
          🏠 새 방 만들기
        </button>
      </div>

      <div class="divider">또는</div>

      <div class="section">
        <h2>방 참가</h2>
        <div class="input-group">
          <label for="roomcode">방 코드</label>
          <input
            id="roomcode"
            type="text"
            bind:value={roomCode}
            placeholder="6자리 방 코드"
            maxlength="6"
            disabled={!connected}
          />
        </div>
        <button
          onclick={joinRoom}
          disabled={!connected || !nickname.trim() || !roomCode.trim()}
        >
          🚪 방 참가하기
        </button>
      </div>
    </div>
  {:else}
    <!-- 방 정보 -->
    <div class="room-info">
      <h2>🏠 방 정보</h2>
      <div class="info-item">
        <strong>방 코드:</strong>
        <span class="room-code">{currentRoom.code}</span>
      </div>
      <div class="info-item">
        <strong>방장:</strong> {currentRoom.players.find((p: any) => p.isHost)?.nickname}
      </div>
      <div class="info-item">
        <strong>플레이어:</strong> {players.length} / {currentRoom.settings.maxPlayers}명
      </div>
      <div class="info-item">
        <strong>라운드 시간:</strong> {currentRoom.settings.roundInterval}초
      </div>

      <h3>👥 참가자 목록</h3>
      <div class="players-list">
        {#each players as player}
          <div class="player-card">
            <span class="avatar">{player.avatar}</span>
            <span class="player-name">
              {player.nickname}
              {#if player.isHost}
                <span class="host-badge">👑</span>
              {/if}
              {#if player.score !== undefined}
                <span class="score">({player.score}점)</span>
              {/if}
            </span>
          </div>
        {/each}
      </div>

      {#if !gameStarted && !gameResult}
        <!-- 게임 시작 전 -->
        {#if isHost}
          <button class="game-button" onclick={startGame}>
            🎮 게임 시작
          </button>
        {:else}
          <div class="waiting-message">
            ⏳ 방장이 게임을 시작하기를 기다리는 중...
          </div>
        {/if}
      {:else if gameStarted}
        <!-- 게임 진행 중 -->
        <div class="game-controls">
          <h3>🎮 게임 진행 중 (Round {currentRound}/{totalRounds})</h3>

          {#if isLoadingTrack}
            <div class="loading-status">
              ⏳ 트랙 로딩 중... ({readyPlayers}/{players.length} 플레이어 준비 완료)
            </div>
          {/if}

          {#if preparedTrack || currentTrack}
            <!-- YouTube 플레이어 (화면 숨김) -->
            <div class="youtube-player-hidden">
              <div id="youtube-player"></div>
            </div>

            {/if}

          {#if (preparedTrack || currentTrack) && !isMuted}
            <!-- 음량 조절 슬라이더 -->
            <div class="volume-control">
              <label for="volume-slider">
                🔊 음량: {volume}%
              </label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="100"
                bind:value={volume}
                oninput={handleVolumeChange}
                class="volume-slider"
              />
            </div>
          {/if}

          {#if currentTrack && !roundEnded}
            <!-- 정답 입력 -->
            <div class="answer-input">
              <input
                type="text"
                bind:value={answer}
                placeholder="정답을 입력하세요..."
                onkeydown={(e) => e.key === 'Enter' && submitAnswer()}
              />
              <button onclick={submitAnswer} disabled={!answer.trim()}>
                ✅ 제출
              </button>
            </div>
          {/if}

          {#if isHost && roundEnded}
            <div class="host-controls">
              <button onclick={nextRound}>
                ⏭️ 다음 라운드
              </button>
              <button class="end-button" onclick={endGame}>
                🛑 게임 종료
              </button>
            </div>
          {:else if roundEnded}
            <div class="waiting-message">
              ⏳ 방장이 다음 라운드를 시작하기를 기다리는 중...
            </div>
          {/if}
        </div>
      {:else if gameResult}
        <!-- 게임 결과 -->
        <div class="game-result">
          <h3>🎊 게임 종료!</h3>
          {#if gameResult.winner}
            <div class="winner">
              <p>🏆 우승자: <strong>{gameResult.winner.nickname}</strong></p>
              <p>점수: {gameResult.winner.score}점</p>
            </div>
          {/if}

          <h4>최종 순위</h4>
          <div class="final-scores">
            {#each gameResult.finalScores as score, index}
              <div class="score-item">
                <span class="rank">{index + 1}위</span>
                <span class="player">{score.nickname}</span>
                <span class="score">{score.score}점</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <button class="leave-button" onclick={leaveRoom}>
        🚪 방 나가기
      </button>
    </div>
  {/if}

      <div class="info">
        <p>🔧 Socket.IO 연결 테스트 v2.0</p>
        <p>Backend: Node.js + Socket.IO + TypeScript</p>
        <p>Frontend: Svelte 5 + Socket.IO Client</p>
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
  }

  /* 네비게이션 */
  .navbar {
    background-color: #ff3e00;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .navbar h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .nav-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .nav-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .nav-button.active {
    background-color: white;
    color: #ff3e00;
    border-color: white;
  }

  /* 게임 컨테이너 */
  .game-container {
    text-align: center;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  h3 {
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #555;
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
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* 폼 컨테이너 */
  .form-container {
    background-color: #f9f9f9;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .section {
    margin: 1.5rem 0;
  }

  .input-group {
    margin-bottom: 1rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #ff3e00;
  }

  input:disabled,
  select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  select {
    cursor: pointer;
  }

  button {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    background-color: #ff3e00;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: #e63900;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  .divider {
    margin: 1.5rem 0;
    color: #999;
    font-weight: 500;
  }

  /* 방 정보 */
  .room-info {
    background-color: #f9f9f9;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    text-align: left;
  }

  .info-item {
    margin: 0.75rem 0;
    font-size: 1.1rem;
  }

  .room-code {
    font-family: 'Courier New', monospace;
    font-size: 1.5rem;
    font-weight: bold;
    color: #ff3e00;
    background-color: #fff;
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    border: 2px solid #ff3e00;
  }

  /* 플레이어 목록 */
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .player-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }

  .avatar {
    font-size: 2rem;
  }

  .player-name {
    font-size: 1.1rem;
    font-weight: 500;
    flex: 1;
    text-align: left;
  }

  .host-badge {
    margin-left: 0.5rem;
  }

  .leave-button {
    margin-top: 2rem;
    background-color: #757575;
  }

  .leave-button:hover:not(:disabled) {
    background-color: #616161;
  }

  /* 게임 컨트롤 */
  .score {
    color: #ff3e00;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .game-button {
    margin-top: 1.5rem;
    background-color: #4caf50;
  }

  .game-button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .waiting-message {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #fff3cd;
    border-radius: 8px;
    color: #856404;
    font-weight: 500;
  }

  .loading-status {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #e3f2fd;
    border-radius: 8px;
    color: #1976d2;
    font-weight: 500;
  }

  .game-controls {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  /* YouTube 플레이어 숨김 */
  .youtube-player-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    opacity: 0;
    pointer-events: none;
  }

  /* 음량 조절 */
  .volume-control {
    margin: 1.5rem 0;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;
    text-align: center;
  }

  .volume-control label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #555;
    font-size: 1rem;
  }

  .volume-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #ddd 0%, #ff3e00 100%);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ff3e00;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px rgba(255, 62, 0, 0.4);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ff3e00;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }

  .volume-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px rgba(255, 62, 0, 0.4);
  }

  .answer-input {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .answer-input input {
    flex: 1;
  }

  .answer-input button {
    width: auto;
    padding: 0.75rem 1.5rem;
  }

  .host-controls {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .host-controls button {
    flex: 1;
  }

  .end-button {
    background-color: #f44336;
  }

  .end-button:hover:not(:disabled) {
    background-color: #d32f2f;
  }

  .game-result {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background-color: #fff;
    border-radius: 8px;
    text-align: center;
  }

  .winner {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #fff8e1;
    border-radius: 8px;
    border: 2px solid #ffd54f;
  }

  .winner p {
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }

  .winner strong {
    color: #ff3e00;
  }

  .final-scores {
    margin-top: 1rem;
    text-align: left;
  }

  .score-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: #f9f9f9;
    border-radius: 8px;
  }

  .score-item .rank {
    font-weight: 700;
    color: #ff3e00;
    min-width: 40px;
  }

  .score-item .player {
    flex: 1;
    font-weight: 500;
  }

  .score-item .score {
    font-weight: 600;
    color: #4caf50;
    margin: 0;
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
