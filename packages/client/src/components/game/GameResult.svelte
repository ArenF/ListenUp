<script lang="ts">
  import type { GameResult } from "../../types/index";

  interface Props {
    gameResult: GameResult;
  }

  let { gameResult }: Props = $props();
</script>

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

<style>
  .game-result {
    margin-top: var(--space-6);
    padding: var(--space-6);
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    text-align: center;
  }

  h3 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space-4);
    color: var(--text-primary);
  }

  h4 {
    font-size: var(--font-size-xl);
    margin-top: var(--space-6);
    margin-bottom: var(--space-4);
    color: var(--text-secondary);
  }

  .winner {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    background-color: color-mix(in srgb, var(--accent) 14%, var(--bg-surface));
    border-radius: var(--radius-md);
    border: 2px solid color-mix(in srgb, var(--accent) 60%, var(--bg-surface));
  }

  .winner p {
    margin: var(--space-2) 0;
    font-size: var(--font-size-xl);
  }

  .winner strong {
    color: var(--accent);
  }

  .final-scores {
    margin-top: var(--space-4);
    text-align: left;
  }

  .score-item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3);
    margin-bottom: var(--space-2);
    background-color: color-mix(in srgb, var(--bg-primary) 6%, var(--bg-surface));
    border-radius: var(--radius-md);
  }

  .score-item .rank {
    font-weight: 700;
    color: var(--accent);
    min-width: 40px;
  }

  .score-item .player {
    flex: 1;
    font-weight: 500;
  }

  .score-item .score {
    font-weight: 600;
    color: var(--color-success);
    margin: 0;
  }
</style>
