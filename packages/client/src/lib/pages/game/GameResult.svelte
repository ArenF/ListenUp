<script lang="ts">
  import { onMount } from 'svelte';
  import { spring } from 'svelte/motion';
  import { slide } from 'svelte/transition';
  import confetti from 'canvas-confetti';

  interface GameResult {
    roomCode: string;
    totalRounds: number;
    finalScores: Array<{
      playerId: string;
      nickname: string;
      score: number;
      correctAnswers: number;
      maxStreak: number;
    }>;
    winner: {
      playerId: string;
      nickname: string;
      score: number;
    } | null;
    playedAt: number;
  }

  interface PlayerStats {
    nickname: string;
    rank: number;
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    accuracy: number;
    maxStreak: number;
    medal: '🥇' | '🥈' | '🥉' | null;
  }

  interface GameHighlights {
    mostCorrectPlayer: string;
    bestStreakPlayer: string;
    perfectPlayer: string | null;
  }

  interface Props {
    gameResult: GameResult;
  }

  let { gameResult }: Props = $props();

  // 상태
  let showHighlights = $state(false);
  let displayedScore = $state(0);
  let stats = $state<PlayerStats[]>([]);
  let highlights = $state<GameHighlights | null>(null);

  // Svelte Motion - 점수 애니메이션용
  const scoreSpring = spring(0, {
    stiffness: 0.1,
    damping: 0.3
  });

  // 통계 계산
  function calculateStats(result: GameResult): PlayerStats[] {
    return result.finalScores.map((player, index) => {
      const wrongAnswers = result.totalRounds - player.correctAnswers;
      const accuracy = Math.round((player.correctAnswers / result.totalRounds) * 100);

      let medal: '🥇' | '🥈' | '🥉' | null = null;
      if (index === 0) medal = '🥇';
      else if (index === 1) medal = '🥈';
      else if (index === 2) medal = '🥉';

      return {
        nickname: player.nickname,
        rank: index + 1,
        score: player.score,
        correctAnswers: player.correctAnswers,
        wrongAnswers,
        accuracy,
        maxStreak: player.maxStreak,
        medal
      };
    });
  }

  // 하이라이트 계산
  function calculateHighlights(playerStats: PlayerStats[]): GameHighlights {
    const mostCorrect = playerStats.reduce((prev, curr) =>
      curr.correctAnswers > prev.correctAnswers ? curr : prev
    );

    const bestStreak = playerStats.reduce((prev, curr) =>
      curr.maxStreak > prev.maxStreak ? curr : prev
    );

    const perfect = playerStats.find(p => p.accuracy === 100) || null;

    return {
      mostCorrectPlayer: mostCorrect.nickname,
      bestStreakPlayer: bestStreak.nickname,
      perfectPlayer: perfect?.nickname || null
    };
  }

  // 컴포넌트 마운트 시 실행
  onMount(() => {
    // 통계 계산
    stats = calculateStats(gameResult);
    highlights = calculateHighlights(stats);

    // 불꽃놀이 효과 (우승자가 있을 때만)
    if (gameResult.winner) {
      // 첫 번째 불꽃놀이
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);

      // 두 번째 불꽃놀이 (더 화려하게)
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#ff3e00', '#4caf50', '#2196f3']
        });
      }, 1500);

      // 점수 카운트업 애니메이션
      scoreSpring.set(gameResult.winner.score);
    }
  });

  // 점수 애니메이션 구독
  $effect(() => {
    displayedScore = Math.floor($scoreSpring);
  });

  function toggleHighlights() {
    showHighlights = !showHighlights;
  }
</script>

<div class="game-result">
  <!-- 우승자 발표 -->
  {#if gameResult.winner}
    <div class="winner-announcement">
      <h2 class="game-over-title">🎊 게임 종료! 🎊</h2>

      <div class="winner-card">
        <div class="trophy-icon">🏆</div>
        <h3 class="winner-label">우승자</h3>
        <p class="winner-name">{gameResult.winner.nickname}</p>
        <p class="winner-score">{displayedScore.toLocaleString()}점</p>
        <div class="sparkle-effect">✨</div>
      </div>
    </div>
  {/if}

  <!-- 최종 순위 -->
  <div class="rankings-section">
    <h3 class="section-title">📊 최종 순위</h3>

    <div class="rankings-list">
      {#each stats as stat, index}
        <div
          class="rank-item"
          class:rank-1={index === 0}
          class:rank-2={index === 1}
          class:rank-3={index === 2}
          style="animation-delay: {index * 0.2}s"
        >
          <div class="rank-icon">
            {#if stat.medal}
              <span class="medal">{stat.medal}</span>
            {:else}
              <span class="rank-number">{stat.rank}위</span>
            {/if}
          </div>

          <div class="rank-info">
            <div class="rank-header">
              <span class="player-name">{stat.nickname}</span>
              <span class="player-score">{stat.score.toLocaleString()}점</span>
            </div>
            <div class="rank-stats">
              <span class="stat-item">
                ✅ 정답률: <strong>{stat.accuracy}%</strong>
              </span>
              <span class="stat-divider">|</span>
              <span class="stat-item">
                🔥 스트릭: <strong>{stat.maxStreak}연속</strong>
              </span>
              <span class="stat-divider">|</span>
              <span class="stat-item">
                📝 정답: <strong>{stat.correctAnswers}/{gameResult.totalRounds}</strong>
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 게임 하이라이트 -->
  {#if highlights}
    <div class="highlights-section">
      <button class="highlights-toggle" onclick={toggleHighlights}>
        <span class="toggle-icon">⭐</span>
        <span class="toggle-text">게임 하이라이트</span>
        <span class="toggle-arrow">{showHighlights ? '▲' : '▼'}</span>
      </button>

      {#if showHighlights}
        <div class="highlights-content" transition:slide>
          <!-- 최다 정답 -->
          <div class="highlight-card">
            <div class="highlight-icon">🎯</div>
            <div class="highlight-info">
              <h4 class="highlight-title">최다 정답</h4>
              <p class="highlight-value">{highlights.mostCorrectPlayer}</p>
            </div>
          </div>

          <!-- 최고 연속 정답 -->
          {#if highlights.bestStreakPlayer}
            <div class="highlight-card">
              <div class="highlight-icon">🔥</div>
              <div class="highlight-info">
                <h4 class="highlight-title">최고 연속 정답</h4>
                <p class="highlight-value">{highlights.bestStreakPlayer}</p>
              </div>
            </div>
          {/if}

          <!-- 완벽한 플레이어 -->
          {#if highlights.perfectPlayer}
            <div class="highlight-card perfect">
              <div class="highlight-icon">💯</div>
              <div class="highlight-info">
                <h4 class="highlight-title">완벽한 플레이어</h4>
                <p class="highlight-value">{highlights.perfectPlayer}</p>
                <p class="highlight-subtitle">100% 정답률!</p>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .game-result {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* 우승자 발표 */
  .winner-announcement {
    text-align: center;
    margin-bottom: 3rem;
  }

  .game-over-title {
    font-size: 2rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 2rem;
    animation: bounce-in 0.6s ease-out;
  }

  .winner-card {
    position: relative;
    background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
    border-radius: 16px;
    padding: 2.5rem 2rem;
    box-shadow: 0 8px 24px rgba(255, 215, 0, 0.4);
    animation: winner-appear 1s ease-out;
    overflow: hidden;
  }

  .trophy-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: trophy-bounce 1s ease-in-out infinite;
  }

  .winner-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: #d97706;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .winner-name {
    font-size: 2.5rem;
    font-weight: 800;
    color: #92400e;
    margin: 0 0 1rem 0;
  }

  .winner-score {
    font-size: 3rem;
    font-weight: 900;
    color: #78350f;
    margin: 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .sparkle-effect {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 2rem;
    animation: sparkle 1.5s ease-in-out infinite;
  }

  /* 순위 섹션 */
  .rankings-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .rankings-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .rank-item {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    animation: slide-in 0.5s ease-out forwards;
    opacity: 0;
  }

  .rank-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .rank-item.rank-1 {
    background: linear-gradient(135deg, #fff8e1 0%, #fff 100%);
    border: 2px solid #ffd700;
  }

  .rank-item.rank-2 {
    background: linear-gradient(135deg, #f5f5f5 0%, #fff 100%);
    border: 2px solid #c0c0c0;
  }

  .rank-item.rank-3 {
    background: linear-gradient(135deg, #ffe0b2 0%, #fff 100%);
    border: 2px solid #cd7f32;
  }

  .rank-icon {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: #f9f9f9;
  }

  .medal {
    font-size: 2.5rem;
    animation: medal-sparkle 2s ease-in-out infinite;
  }

  .rank-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ff3e00;
  }

  .rank-info {
    flex: 1;
    min-width: 0;
  }

  .rank-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .player-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
  }

  .player-score {
    font-size: 1.5rem;
    font-weight: 800;
    color: #4caf50;
  }

  .rank-stats {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.9rem;
    color: #666;
  }

  .stat-item strong {
    color: #333;
  }

  .stat-divider {
    color: #ccc;
  }

  /* 하이라이트 섹션 */
  .highlights-section {
    margin-top: 2rem;
    background-color: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .highlights-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%);
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1976d2;
    transition: background-color 0.2s ease;
  }

  .highlights-toggle:hover {
    background: linear-gradient(135deg, #bbdefb 0%, #fff 100%);
  }

  .toggle-icon {
    font-size: 1.5rem;
  }

  .toggle-text {
    flex: 1;
    text-align: left;
    margin-left: 0.5rem;
  }

  .toggle-arrow {
    font-size: 1rem;
    transition: transform 0.3s ease;
  }

  .highlights-content {
    padding: 1.5rem;
    background-color: #fafafa;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .highlight-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background-color: #fff;
    border-radius: 8px;
    border-left: 4px solid #2196f3;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .highlight-card.perfect {
    border-left-color: #ff9800;
    background: linear-gradient(135deg, #fff8e1 0%, #fff 100%);
  }

  .highlight-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .highlight-info {
    flex: 1;
  }

  .highlight-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #666;
    margin: 0 0 0.25rem 0;
  }

  .highlight-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: #333;
    margin: 0;
  }

  .highlight-subtitle {
    font-size: 0.85rem;
    color: #f57c00;
    margin: 0.25rem 0 0 0;
    font-weight: 600;
  }

  /* 애니메이션 */
  @keyframes bounce-in {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(-50px);
    }
    50% {
      opacity: 1;
      transform: scale(1.05) translateY(0);
    }
    70% {
      transform: scale(0.95);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes winner-appear {
    0% {
      opacity: 0;
      transform: scale(0.8) rotateY(-20deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotateY(0);
    }
  }

  @keyframes trophy-bounce {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    25% {
      transform: translateY(-10px) rotate(-5deg);
    }
    75% {
      transform: translateY(-5px) rotate(5deg);
    }
  }

  @keyframes sparkle {
    0%, 100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.3) rotate(180deg);
    }
  }

  @keyframes slide-in {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes medal-sparkle {
    0%, 100% {
      transform: scale(1) rotate(0deg);
    }
    50% {
      transform: scale(1.15) rotate(10deg);
    }
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .game-result {
      padding: 1rem;
    }

    .game-over-title {
      font-size: 1.5rem;
    }

    .winner-card {
      padding: 2rem 1.5rem;
    }

    .winner-name {
      font-size: 2rem;
    }

    .winner-score {
      font-size: 2.5rem;
    }

    .rank-item {
      padding: 1rem;
      gap: 1rem;
    }

    .rank-icon {
      width: 50px;
      height: 50px;
    }

    .medal {
      font-size: 2rem;
    }

    .player-name {
      font-size: 1.1rem;
    }

    .player-score {
      font-size: 1.3rem;
    }

    .rank-stats {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .stat-divider {
      display: none;
    }
  }
</style>
