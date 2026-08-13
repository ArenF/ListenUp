<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { startGameSession } from "./gameSession.svelte";
  import {
    createRoom,
    endGame,
    joinRoom,
    leaveRoom,
    nextRound,
    startGame,
    submitAnswer,
  } from "./gameActions";
  import GameLobby from "./GameLobby.svelte";
  import GameRoom from "./GameRoom.svelte";

  startGameSession();
</script>

<div class="game-container">
  <!-- 연결 상태 -->
  <div class="status-bar" class:connected={gameStore.connected}>
    <div class="status-indicator"></div>
    <span>{gameStore.statusMessage}</span>
  </div>

  {#if !gameStore.currentRoom}
    <GameLobby
      connected={gameStore.connected}
      bind:nickname={gameStore.nickname}
      bind:roomCode={gameStore.roomCode}
      bind:selectedPlaylistId={gameStore.selectedPlaylistId}
      playlists={gameStore.playlists}
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
    />
  {:else}
    <GameRoom
      currentRoom={gameStore.currentRoom}
      players={gameStore.players}
      gameStarted={gameStore.gameStarted}
      gameResult={gameStore.gameResult}
      isHost={gameStore.isHost}
      currentRound={gameStore.currentRound}
      totalRounds={gameStore.totalRounds}
      isLoadingTrack={gameStore.isLoadingTrack}
      readyPlayers={gameStore.readyPlayers}
      preparedTrack={gameStore.preparedTrack}
      currentTrack={gameStore.currentTrack}
      isMuted={gameStore.isMuted}
      roundEnded={gameStore.roundEnded}
      bind:volume={gameStore.volume}
      bind:answer={gameStore.answer}
      onStartGame={startGame}
      onLeaveRoom={leaveRoom}
      onSubmitAnswer={submitAnswer}
      onNextRound={nextRound}
      onEndGame={endGame}
    />
  {/if}

  <div class="info">
    <p>🔧 Socket.IO 연결 테스트 v2.0</p>
    <p>Backend: Node.js + Socket.IO + TypeScript</p>
    <p>Frontend: Svelte 5 + Socket.IO Client</p>
  </div>
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
