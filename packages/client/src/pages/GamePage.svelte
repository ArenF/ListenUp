<script lang="ts">
  import { gameStore } from "../stores/gameStore.svelte";
  import { startGameSession } from "../stores/gameSession.svelte";
  import {
    endGame,
    leaveRoom,
    nextRound,
    startGame,
    submitAnswer,
  } from "../stores/gameActions";
  import { authStore } from "../stores/authStore.svelte";
  import Lobby from "../components/game/Lobby.svelte";
  import CreateRoom from "../components/game/CreateRoom.svelte";
  import JoinRoomModal from "../components/game/JoinRoomModal.svelte";
  import GameRoom from "../components/game/GameRoom.svelte";

  interface Props {
    /** 방에 들어가 있지 않을 때 보여줄 화면 */
    view: "lobby" | "create";
    /** 방 참가 모달 표시 여부 (App의 네비 "방 참가"가 토글) */
    showJoinModal: boolean;
    /** 로비 ↔ 방 생성 페이지 전환 요청 (App의 네비 상태를 바꾼다) */
    onNavigate: (view: "lobby" | "create") => void;
  }

  let {
    view,
    showJoinModal = $bindable(),
    onNavigate,
  }: Props = $props();

  startGameSession();

  // 로그인 상태면 게임 닉네임을 계정 닉네임으로 고정한다
  $effect(() => {
    if (authStore.user) {
      gameStore.nickname = authStore.user.nickname;
    }
  });

  // 방에 입장하면(생성·참가 성공) 참가 모달은 닫는다
  $effect(() => {
    if (gameStore.currentRoom) {
      showJoinModal = false;
    }
  });
</script>

<div class="game-container">
  <!-- 연결 상태 -->
  <div class="status-bar" class:connected={gameStore.connected}>
    <div class="status-indicator"></div>
    <span>{gameStore.statusMessage}</span>
  </div>

  {#if gameStore.currentRoom}
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
  {:else if view === "create"}
    <CreateRoom onCancel={() => onNavigate("lobby")} />
  {:else}
    <Lobby
      onCreate={() => onNavigate("create")}
      onJoinByCode={() => (showJoinModal = true)}
    />
  {/if}
</div>

{#if showJoinModal && !gameStore.currentRoom}
  <JoinRoomModal onClose={() => (showJoinModal = false)} />
{/if}

<style>
  .game-container {
    padding: 2rem;
    max-width: 820px;
    margin: 0 auto;
  }

  /* 상태바 */
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: color-mix(in srgb, var(--color-danger) 12%, var(--bg-surface));
    border-radius: 8px;
    margin-bottom: 1.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    transition: background-color 0.3s;
  }

  .status-bar.connected {
    background-color: color-mix(in srgb, var(--color-success) 12%, var(--bg-surface));
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--color-danger);
    animation: pulse 2s infinite;
    flex-shrink: 0;
  }

  .status-bar.connected .status-indicator {
    background-color: var(--color-success);
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
</style>
