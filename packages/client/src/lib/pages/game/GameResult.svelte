<script lang="ts">
  import type { GameResult } from "../../types";

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
    margin-top: 1.5rem;
    padding: 1.5rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-align: center;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  h4 {
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }

  .winner {
    margin: 1rem 0;
    padding: 1rem;
    background-color: color-mix(in srgb, var(--accent) 14%, var(--bg-surface));
    border-radius: 8px;
    border: 2px solid color-mix(in srgb, var(--accent) 60%, var(--bg-surface));
  }

  .winner p {
    margin: 0.5rem 0;
    font-size: 1.2rem;
  }

  .winner strong {
    color: var(--accent);
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
    background-color: color-mix(in srgb, var(--bg-primary) 6%, var(--bg-surface));
    border-radius: 8px;
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
