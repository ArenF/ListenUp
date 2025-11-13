<script lang="ts">
  interface Props {
    gameResult: any;
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
    background-color: #fff;
    border-radius: 8px;
    text-align: center;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  h4 {
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: #555;
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
</style>
