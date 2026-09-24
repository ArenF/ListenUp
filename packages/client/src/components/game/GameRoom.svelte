<script lang="ts">
  import GamePlayer from "./GamePlayer.svelte";
  import GameResult from "./GameResult.svelte";
  import type {
    GameResult as GameResultData,
    HiddenTrack,
    Player,
    Room,
  } from "../../types/index";

  interface Props {
    currentRoom: Room;
    players: Player[];
    gameStarted: boolean;
    gameResult: GameResultData | null;
    isHost: boolean;
    currentRound: number;
    totalRounds: number;
    isLoadingTrack: boolean;
    readyPlayers: number;
    preparedTrack: HiddenTrack | null;
    currentTrack: HiddenTrack | null;
    isMuted: boolean;
    volume: number;
    roundEnded: boolean;
    answer: string;
    onStartGame: () => void;
    onLeaveRoom: () => void;
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
    volume = $bindable(),
    roundEnded,
    answer = $bindable(),
    onStartGame,
    onLeaveRoom,
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
    {currentRoom.players.find((p) => p.isHost)?.nickname}
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
      <div class="player-card">
        <span class="avatar">{player.avatar}</span>
        <span class="player-name">
          {player.nickname}
          {#if player.isHost}
            <span class="host-badge">👑</span>
          {/if}
          {#if player.score !== undefined}
            <span class="score">({player.score}점)</span>
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

      <GamePlayer {preparedTrack} {currentTrack} {isMuted} bind:volume />

      {#if currentTrack && !roundEnded}
        <!-- 정답 입력 -->
        <div class="answer-input">
          <input
            type="text"
            bind:value={answer}
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
    background-color: var(--bg-surface);
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text-primary) 15%, transparent);
    text-align: left;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }

  h3 {
    font-size: 1.2rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--text-secondary);
  }

  .info-item {
    margin: 0.75rem 0;
    font-size: 1.1rem;
  }

  .room-code {
    font-family: "Courier New", monospace;
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--accent);
    background-color: var(--bg-surface);
    padding: 0.25rem 0.75rem;
    border-radius: 6px;
    border: 2px solid var(--accent);
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
    background-color: var(--bg-surface);
    border-radius: 8px;
    box-shadow: 0 1px 4px color-mix(in srgb, var(--text-primary) 15%, transparent);
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
    color: var(--accent);
    font-weight: 600;
    margin-left: 0.5rem;
  }

  /* 버튼 스타일 */
  button {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-on-accent);
    background-color: var(--accent);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--accent) 85%, black);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    background-color: color-mix(in srgb, var(--text-secondary) 40%, var(--bg-surface));
    cursor: not-allowed;
    transform: none;
  }

  .game-button {
    margin-top: 1.5rem;
    background-color: var(--color-success);
  }

  .game-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-success) 85%, black);
  }

  .leave-button {
    margin-top: 2rem;
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
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-radius: 8px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .loading-status {
    margin: 1rem 0;
    padding: 1rem;
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-radius: 8px;
    color: var(--accent);
    font-weight: 500;
  }

  .game-controls {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text-primary) 15%, transparent);
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
    border: 2px solid var(--border);
    border-radius: 8px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  .answer-input input:focus {
    outline: none;
    border-color: var(--accent);
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
    background-color: var(--color-danger);
  }

  .end-button:hover:not(:disabled) {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }
</style>
