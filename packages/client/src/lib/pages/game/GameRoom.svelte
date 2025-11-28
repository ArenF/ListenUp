<script lang="ts">
  import GamePlayer from "./GamePlayer.svelte";
  import GameResult from "./GameResult.svelte";

  import type { AnimationType } from "../../stores/gameStore";

  interface Props {
    currentRoom: any;
    players: any[];
    gameStarted: boolean;
    gameResult: any | null;
    isHost: boolean;
    currentRound: number;
    totalRounds: number;
    isLoadingTrack: boolean;
    readyPlayers: number;
    preparedTrack: any;
    currentTrack: any;
    isMuted: boolean;
    volume: number;
    roundEnded: boolean;
    answer: string;
    playerAnimations: Record<string, AnimationType>;
    previousScores: Record<string, number>;
    answeredCorrectly: Set<string>;
    answeredWrong: Set<string>;
    onStartGame: () => void;
    onLeaveRoom: () => void;
    onVolumeChange: (e: Event) => void;
    onAnswerChange: (e: Event) => void;
    onSubmitAnswer: () => void;
    onNextRound: () => void;
    onEndGame: () => void;
  }

  let {
    currentRoom,
    players,
    gameStarted,
    gameResult,
    isHost,
    currentRound,
    totalRounds,
    isLoadingTrack,
    readyPlayers,
    preparedTrack,
    currentTrack,
    isMuted,
    volume,
    roundEnded,
    answer,
    playerAnimations,
    previousScores,
    answeredCorrectly,
    answeredWrong,
    onStartGame,
    onLeaveRoom,
    onVolumeChange,
    onAnswerChange,
    onSubmitAnswer,
    onNextRound,
    onEndGame,
  }: Props = $props();
</script>

<div class="room-info">
  <h2>🏠 방 정보</h2>
  <div class="info-item">
    <strong>방 코드:</strong>
    <span class="room-code">{currentRoom.code}</span>
  </div>
  <div class="info-item">
    <strong>방장:</strong>
    {currentRoom.players.find((p: any) => p.isHost)?.nickname}
  </div>
  <div class="info-item">
    <strong>플레이어:</strong>
    {players.length} / {currentRoom.settings.maxPlayers}명
  </div>
  <div class="info-item">
    <strong>라운드 시간:</strong>
    {currentRoom.settings.roundInterval}초
  </div>

  <h3>👥 참가자 목록</h3>
  <div class="players-list">
    {#each players as player}
      {@const animationType = playerAnimations[player.id]}
      {@const previousScore = previousScores[player.id] || 0}
      {@const scoreDiff = (player.score || 0) - previousScore}
      {@const hasAnsweredCorrect = answeredCorrectly.has(player.id)}
      {@const hasAnsweredWrong = answeredWrong.has(player.id)}
      <div
        class="player-card"
        class:anim-correct={animationType === 'correct'}
        class:anim-wrong={animationType === 'wrong'}
        class:anim-submitted={animationType === 'submitted'}
        class:anim-score-up={animationType === 'score-up'}
        class:answered-correct={hasAnsweredCorrect && !animationType}
        class:answered-wrong={hasAnsweredWrong && !animationType && !hasAnsweredCorrect}
      >
        <span class="avatar">{player.avatar}</span>
        <span class="player-name">
          {player.nickname}
          {#if player.isHost}
            <span class="host-badge">👑</span>
          {/if}
          {#if player.score !== undefined}
            <span class="score">({player.score}점)</span>
            {#if animationType === 'score-up' && scoreDiff > 0}
              <span class="score-popup">+{scoreDiff}</span>
            {/if}
          {/if}
        </span>
      </div>
    {/each}
  </div>

  {#if !gameStarted && !gameResult}
    <!-- 게임 시작 전 -->
    {#if isHost}
      <button class="game-button" onclick={onStartGame}> 🎮 게임 시작 </button>
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

      <GamePlayer
        {preparedTrack}
        {currentTrack}
        {isMuted}
        {volume}
        {onVolumeChange}
      />

      {#if currentTrack && !roundEnded}
        <!-- 정답 입력 -->
        <div class="answer-input">
          <input
            type="text"
            value={answer}
            oninput={onAnswerChange}
            placeholder="정답을 입력하세요..."
            onkeydown={(e) => e.key === "Enter" && onSubmitAnswer()}
          />
          <button onclick={onSubmitAnswer} disabled={!answer.trim()}>
            ✅ 제출
          </button>
        </div>
      {/if}

      {#if isHost && roundEnded}
        <div class="host-controls">
          <button onclick={onNextRound}> ⏭️ 다음 라운드 </button>
          <button class="end-button" onclick={onEndGame}> 🛑 게임 종료 </button>
        </div>
      {:else if roundEnded}
        <div class="waiting-message">
          ⏳ 방장이 다음 라운드를 시작하기를 기다리는 중...
        </div>
      {/if}
    </div>
  {:else if gameResult}
    <!-- 게임 결과 -->
    <GameResult {gameResult} />
  {/if}

  <button class="leave-button" onclick={onLeaveRoom}> 🚪 방 나가기 </button>
</div>

<style>
  .room-info {
    background-color: #f9f9f9;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: left;
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

  .info-item {
    margin: 0.75rem 0;
    font-size: 1.1rem;
  }

  .room-code {
    font-family: "Courier New", monospace;
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
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
  }

  /* 정답 애니메이션 - 초록색으로 물들기 */
  .player-card.anim-correct {
    background-color: #4caf50 !important;
    color: white;
    animation: correctPulse 1s ease;
  }

  @keyframes correctPulse {
    0%, 100% {
      transform: scale(1);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
    50% {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
    }
  }

  /* 오답 애니메이션 - 빨간색 + shake */
  .player-card.anim-wrong {
    background-color: #f44336 !important;
    color: white;
    animation: wrongShake 0.6s ease;
  }

  @keyframes wrongShake {
    0%, 100% {
      transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
      transform: translateX(-5px);
    }
    20%, 40%, 60%, 80% {
      transform: translateX(5px);
    }
  }

  /* 답안 제출 애니메이션 - bounce */
  .player-card.anim-submitted {
    animation: submitBounce 0.6s ease;
  }

  @keyframes submitBounce {
    0%, 100% {
      transform: translateY(0);
    }
    25% {
      transform: translateY(-10px);
    }
    50% {
      transform: translateY(-5px);
    }
    75% {
      transform: translateY(-2px);
    }
  }

  /* 점수 증가 애니메이션 - 강조 */
  .player-card.anim-score-up {
    animation: scoreHighlight 1.5s ease;
  }

  @keyframes scoreHighlight {
    0%, 100% {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
    50% {
      box-shadow: 0 0 20px rgba(255, 193, 7, 0.8);
    }
  }

  /* 점수 증가 팝업 */
  .score-popup {
    position: absolute;
    right: 1rem;
    top: -0.5rem;
    background-color: #ffc107;
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: bold;
    animation: scorePopup 1.5s ease forwards;
    pointer-events: none;
  }

  @keyframes scorePopup {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-10px) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translateY(-30px) scale(0.8);
    }
  }

  /* 정답 맞춘 상태 유지 (연한 초록색) */
  .player-card.answered-correct {
    background-color: #c8e6c9 !important;
    border-left: 4px solid #4caf50;
  }

  /* 오답 제출한 상태 유지 (연한 빨간색) */
  .player-card.answered-wrong {
    background-color: #ffcdd2 !important;
    border-left: 4px solid #f44336;
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

  .score {
    color: #ff3e00;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  /* 버튼 스타일 */
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

  .game-button {
    margin-top: 1.5rem;
    background-color: #4caf50;
  }

  .game-button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .leave-button {
    margin-top: 2rem;
    background-color: #757575;
  }

  .leave-button:hover:not(:disabled) {
    background-color: #616161;
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

  .answer-input {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .answer-input input {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  .answer-input input:focus {
    outline: none;
    border-color: #ff3e00;
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
</style>
