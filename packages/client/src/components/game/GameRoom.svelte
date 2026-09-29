<script lang="ts">
  import RoomInfo from "./RoomInfo.svelte";
  import PlayerList from "./PlayerList.svelte";
  import RoundPanel from "./RoundPanel.svelte";
  import GameResult from "./GameResult.svelte";
  import { leaveRoom, roomStore } from "../../stores/room.svelte";
  import { gameStore, startGame } from "../../stores/game.svelte";

  // 방에 들어가 있을 때만 렌더링되므로 current는 존재한다
  const room = $derived(roomStore.current!);
</script>

<div class="room">
  <RoomInfo {room} playerCount={roomStore.players.length} />

  <PlayerList players={roomStore.players} />

  {#if !gameStore.started && !gameStore.result}
    <!-- 게임 시작 전 -->
    {#if roomStore.isHost}
      <button class="game-button" onclick={startGame}> 🎮 게임 시작 </button>
    {:else}
      <div class="waiting-message">
        ⏳ 방장이 게임을 시작하기를 기다리는 중...
      </div>
    {/if}
  {:else if gameStore.started}
    <RoundPanel />
  {:else if gameStore.result}
    <GameResult gameResult={gameStore.result} />
  {/if}

  <button class="leave-button" onclick={() => leaveRoom(() => gameStore.reset())}>
    🚪 방 나가기
  </button>
</div>

<style>
  .room {
    background-color: var(--bg-surface);
    padding: var(--space-8);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    text-align: left;
  }

  /* 버튼 스타일 */
  button {
    width: 100%;
    padding: var(--space-4);
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-on-accent);
    background-color: var(--accent);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--accent) 85%, black);
    transform: translateY(-2px);
    box-shadow: var(--shadow-accent);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  .game-button {
    margin-top: var(--space-6);
    background-color: var(--color-success);
  }

  .game-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-success) 85%, black);
  }

  .leave-button {
    margin-top: var(--space-8);
    background-color: var(--bg-surface);
    color: var(--text-secondary);
    border: 2px solid var(--border);
  }

  .leave-button:hover:not(:disabled) {
    color: var(--accent);
    border-color: var(--accent);
    background-color: var(--bg-surface);
  }

  .waiting-message {
    margin-top: var(--space-6);
    padding: var(--space-4);
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-weight: 500;
  }
</style>
