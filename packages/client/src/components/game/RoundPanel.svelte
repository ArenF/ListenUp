<script lang="ts">
  import GamePlayer from "./GamePlayer.svelte";
  import { roomStore } from "../../stores/room.svelte";
  import {
    endGame,
    gameStore,
    nextRound,
    submitAnswer,
  } from "../../stores/game.svelte";
  import { playerStore } from "../../stores/player.svelte";
</script>

<!-- 게임 진행 중: 트랙 로딩 → 정답 입력 → 라운드 종료 -->
<div class="game-controls">
  <h3>🎮 게임 진행 중 (Round {gameStore.currentRound}/{gameStore.totalRounds})</h3>

  {#if gameStore.isLoadingTrack}
    <div class="loading-status">
      ⏳ 트랙 로딩 중... ({gameStore.readyPlayers}/{roomStore.players.length} 플레이어 준비 완료)
    </div>
  {/if}

  <GamePlayer
    preparedTrack={gameStore.preparedTrack}
    currentTrack={gameStore.currentTrack}
    isMuted={playerStore.isMuted}
    bind:volume={playerStore.volume}
  />

  {#if gameStore.currentTrack && !gameStore.roundEnded}
    <!-- 정답 입력 -->
    <div class="answer-input">
      <input
        type="text"
        bind:value={gameStore.answer}
        placeholder="정답을 입력하세요..."
        onkeydown={(e) => e.key === "Enter" && submitAnswer()}
      />
      <button onclick={submitAnswer} disabled={!gameStore.answer.trim()}>
        ✅ 제출
      </button>
    </div>
  {/if}

  {#if roomStore.isHost && gameStore.roundEnded}
    <div class="host-controls">
      <button onclick={nextRound}> ⏭️ 다음 라운드 </button>
      <button class="end-button" onclick={endGame}> 🛑 게임 종료 </button>
    </div>
  {:else if gameStore.roundEnded}
    <div class="waiting-message">
      ⏳ 방장이 다음 라운드를 시작하기를 기다리는 중...
    </div>
  {/if}
</div>

<style>
  .game-controls {
    margin-top: var(--space-6);
    padding: var(--space-6);
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
  }

  h3 {
    font-size: var(--font-size-xl);
    margin-top: var(--space-6);
    margin-bottom: var(--space-2);
    color: var(--text-secondary);
  }

  .loading-status {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-radius: var(--radius-md);
    color: var(--accent);
    font-weight: 500;
  }

  .waiting-message {
    margin-top: var(--space-6);
    padding: var(--space-4);
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    font-weight: 500;
  }

  /* 버튼 스타일 (GameRoom과 같은 모양) */
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

  button:disabled {
    background-color: color-mix(in srgb, var(--text-secondary) 40%, var(--bg-surface));
    cursor: not-allowed;
    transform: none;
  }

  .answer-input {
    display: flex;
    gap: var(--space-2);
    margin: var(--space-4) 0;
  }

  .answer-input input {
    flex: 1;
    padding: var(--space-3);
    font-size: var(--font-size-base);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  .answer-input input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .answer-input button {
    width: auto;
    padding: var(--space-3) var(--space-6);
  }

  .host-controls {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .host-controls button {
    flex: 1;
  }

  .end-button {
    background-color: var(--color-danger);
  }

  .end-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }
</style>
