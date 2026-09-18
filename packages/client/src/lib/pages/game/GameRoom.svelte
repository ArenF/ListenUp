<script lang="ts">
  import GamePlayer from "./GamePlayer.svelte";
  import GameScreen from "./GameScreen.svelte";
  import GameResult from "./GameResult.svelte";
  import PlayerMiniCard from "./PlayerMiniCard.svelte";
  import type {
    GameResult as GameResultData,
    HiddenTrack,
    Player,
    Room,
  } from "../../types";

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

  /**
   * 라운드 종료 후 정답 공개 화면용 트랙 정보.
   * 서버의 round-ended 결과에 트랙 이름/아티스트가 담겨 있지만
   * GameRoom은 HiddenTrack(정답 미포함)만 받으므로, 종료 시 안내 문구만 표시한다.
   */
  const screenTitle = $derived(
    roundEnded ? "정답 공개!" : currentTrack ? "🎧 듣는 중" : "준비 중"
  );
  const screenArtist = $derived(
    roundEnded ? "방장이 다음 라운드를 시작할 거예요" : "노래 제목을 맞춰보세요"
  );

  /** 플레이어 상태 판단 (answer-submitted 이벤트는 서버가 브로드캐스트만 하므로
   *  정답 여부는 roundEnded 시점에만 확정적으로 표시) */
  function playerStatus(_p: Player): "typing" | "correct" | "wrong" | "listening" {
    if (roundEnded) return "listening";
    return "typing";
  }
</script>

<div class="stage">
  <div class="screen-row">
    <!-- ══ 좌: EDM 스크린 + 입력부 + 진행바 ══ -->
    <div class="screen-col">
      <GameScreen trackTitle={screenTitle} trackArtist={screenArtist}>
        <GamePlayer {preparedTrack} {currentTrack} {isMuted} bind:volume />
      </GameScreen>

      {#if isLoadingTrack && !roundEnded}
        <div class="loading-pill">
          ⏳ 트랙 로딩 중… ({readyPlayers}/{players.length} 준비 완료)
        </div>
      {/if}

      {#if currentTrack && !roundEnded}
        <div class="input-row">
          <div class="answer-wrap">
            <span class="mic">🎤</span>
            <input
              class="answer"
              type="text"
              bind:value={answer}
              placeholder="노래 제목을 입력하세요…"
              autocomplete="off"
              onkeydown={(e) => e.key === "Enter" && onSubmitAnswer()}
            />
          </div>
          <button class="submit" onclick={onSubmitAnswer} disabled={!answer.trim()}>
            제출
          </button>
        </div>
      {/if}

      {#if gameStarted && !gameResult}
        <div class="round-progress">
          <div class="rp-bar">
            {#each Array(totalRounds) as _, i (i)}
              <div
                class="rp-seg"
                class:done={i + 1 < currentRound}
                class:cur={i + 1 === currentRound && !roundEnded}
              ></div>
            {/each}
          </div>
          <span class="rp-label">{currentRound} / {totalRounds}</span>
        </div>
      {/if}

      {#if !gameStarted && !gameResult}
        {#if isHost}
          <button class="host-start" onclick={onStartGame}>🎮 게임 시작</button>
        {:else}
          <div class="waiting-pill">⏳ 방장이 게임을 시작하기를 기다리는 중…</div>
        {/if}
      {/if}

      {#if roundEnded}
        {#if isHost}
          <div class="host-controls">
            <button class="ctrl next" onclick={onNextRound}>⏭️ 다음 라운드</button>
            <button class="ctrl end" onclick={onEndGame}>🛑 게임 종료</button>
          </div>
        {:else}
          <div class="waiting-pill">⏳ 방장이 다음 라운드를 준비하는 중…</div>
        {/if}
      {/if}
    </div>

    <!-- ══ 우: 유저 미니 카드 ══ -->
    <div class="players-col">
      <div class="players-head">
        <span class="t">PLAYERS</span>
        <span class="n mono">{players.length}/{currentRoom.settings.maxPlayers}</span>
      </div>
      <div class="players-stack">
        {#each players as player (player.id)}
          <PlayerMiniCard {player} status={playerStatus(player)} />
        {/each}
      </div>
    </div>
  </div>

  {#if gameResult}
    <GameResult {gameResult} />
  {/if}

  <button class="leave" onclick={onLeaveRoom}>🚪 방 나가기</button>
</div>

<style>
  .stage {
    max-width: 1240px;
    margin: 0 auto;
    padding: 8px 8px 40px;
  }
  .screen-row {
    display: grid;
    grid-template-columns: 1fr 262px;
    gap: 18px;
    align-items: stretch;
  }
  .screen-col {
    min-width: 0;
  }
  .mono {
    font-family: var(--font-mono);
  }

  /* ── 로딩/대기 pill ── */
  .loading-pill,
  .waiting-pill {
    margin-top: 12px;
    font-size: 12.5px;
    color: var(--text-secondary);
    background: var(--screen-glass, rgba(12, 16, 32, 0.72));
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 10px 16px;
    backdrop-filter: blur(10px);
  }

  /* ── 정답 입력부 ── */
  .input-row {
    margin-top: 16px;
    display: flex;
    gap: 12px;
  }
  .answer-wrap {
    flex: 1;
    position: relative;
  }
  .mic {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 17px;
    opacity: 0.75;
  }
  .answer {
    width: 100%;
    background: var(--screen-glass, rgba(12, 16, 32, 0.72));
    backdrop-filter: blur(14px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 17px 20px 17px 52px;
    font-size: 16px;
    color: var(--text-primary);
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .answer:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(124, 156, 255, 0.14);
  }
  .answer::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }
  .submit {
    background: linear-gradient(135deg, var(--accent), #5b7ef0);
    border: none;
    color: var(--text-on-accent);
    border-radius: 14px;
    padding: 0 34px;
    font-size: 15.5px;
    font-weight: 800;
    cursor: pointer;
    letter-spacing: 0.4px;
    box-shadow: 0 8px 26px rgba(124, 156, 255, 0.4);
    transition: transform 0.1s;
  }
  .submit:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .submit:not(:disabled):active {
    transform: translateY(2px);
  }

  /* ── 라운드 진행바 ── */
  .round-progress {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;
  }
  .rp-bar {
    flex: 1;
    display: flex;
    gap: 5px;
  }
  .rp-seg {
    height: 5px;
    flex: 1;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
  }
  .rp-seg.done::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, var(--viz-c1), var(--viz-c3));
    opacity: 0.55;
  }
  .rp-seg.cur::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, var(--viz-c1), var(--viz-c3));
    animation: rp-flow 1.6s ease-in-out infinite;
  }
  @keyframes rp-flow {
    0%,
    100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }
  .rp-label {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  /* ── 호스트 시작/컨트롤 버튼 ── */
  .host-start {
    margin-top: 14px;
    width: 100%;
    background: linear-gradient(135deg, var(--accent), var(--accent-alt));
    border: none;
    color: var(--text-on-accent);
    border-radius: 16px;
    padding: 16px;
    font-size: 16px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(168, 144, 232, 0.35);
  }
  .host-controls {
    margin-top: 14px;
    display: flex;
    gap: 10px;
  }
  .ctrl {
    flex: 1;
    border: none;
    border-radius: 14px;
    padding: 14px;
    font-size: 14.5px;
    font-weight: 800;
    cursor: pointer;
  }
  .ctrl.next {
    background: linear-gradient(135deg, var(--accent), #5b7ef0);
    color: var(--text-on-accent);
  }
  .ctrl.end {
    background: rgba(255, 90, 110, 0.12);
    color: var(--color-danger);
    border: 1px solid rgba(255, 90, 110, 0.3);
  }

  /* ── 플레이어 열 ── */
  .players-col {
    min-width: 0;
  }
  .players-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding: 0 4px;
  }
  .players-head .t {
    font-size: 11px;
    letter-spacing: 1.6px;
    color: var(--text-secondary);
    font-weight: 700;
  }
  .players-head .n {
    font-size: 11px;
    color: var(--accent);
  }
  .players-stack {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  /* ── 방 나가기 ── */
  .leave {
    margin-top: 22px;
    width: 100%;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-secondary);
    border-radius: 12px;
    padding: 11px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.15s;
  }
  .leave:hover {
    border-color: var(--color-danger);
    color: var(--color-danger);
  }

  /* ── 게임 결과 ── */
  :global(.game-result-panel) {
    margin-top: 20px;
  }

  @media (max-width: 900px) {
    .screen-row {
      grid-template-columns: 1fr;
    }
    .players-stack {
      flex-direction: row;
      flex-wrap: wrap;
    }
    .players-stack > :global(.pcard) {
      min-width: 170px;
    }
  }
</style>