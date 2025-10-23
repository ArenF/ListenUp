<script lang="ts">
  import { onMount } from "svelte";
  import { initSocket } from "./lib/socket";
  import type { Socket } from "socket.io-client";

  let socket: Socket;
  let connected = $state(false);
  let roomCode = $state("");
  let nickname = $state("");
  let statusMessage = $state("서버에 연결되지 않음");
  let players = $state<any[]>([]);
  let currentRoom = $state<any>(null);

  onMount(() => {
    // Socket.IO 초기화 및 연결
    socket = initSocket();

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

    // 서버 연결 시작
    socket.connect();

    // YouTube API 로드
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('YouTube Player API 로드 완료!');
    };

    // 컴포넌트 정리
    return () => {
      socket.disconnect();
    };
  });

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
        playlistId: "test-playlist"
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
        console.log("방 나가기 성공");
      } else {
        statusMessage = "❌ 방 나가기 실패";
        console.error("방 나가기 실패");
      }
    });
  }
</script>

<main>
  <h1>🎵 ListenUp! 테스트</h1>

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
            </span>
          </div>
        {/each}
      </div>

      <button class="leave-button" onclick={leaveRoom}>
        🚪 방 나가기
      </button>
    </div>
  {/if}

  <div class="info">
    <p>🔧 Socket.IO 연결 테스트 v1.0</p>
    <p>Backend: Node.js + Socket.IO + TypeScript</p>
    <p>Frontend: Svelte 5 + Socket.IO Client</p>
  </div>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    min-height: 100vh;
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

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  input:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
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
