<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { authStore } from "../login/authStore.svelte";
  import { joinRoom } from "./gameActions";

  interface Props {
    /** "방 생성" 페이지로 이동 */
    onCreate: () => void;
    /** "방 참가" 모달 열기 (코드 입력) */
    onJoinByCode: () => void;
  }

  let { onCreate, onJoinByCode }: Props = $props();

  const isLoggedIn = $derived(authStore.isLoggedIn);
  // 참가하려면 연결 + 닉네임이 있어야 한다 (로그인 계정은 닉네임이 이미 채워짐)
  const canJoin = $derived(
    gameStore.connected && gameStore.nickname.trim().length > 0
  );

  /** 플레이리스트 ID를 사람이 읽는 이름으로 바꾼다 */
  function playlistName(id: string): string {
    return gameStore.playlists.find((p) => p.id === id)?.name ?? id;
  }

  function enter(code: string) {
    if (!canJoin) return;
    joinRoom(code);
  }
</script>

<div class="lobby">
  <div class="toolbar">
    <h2>공개 방</h2>
    <div class="actions">
      <button class="ghost" onclick={onJoinByCode}>🔑 코드로 참가</button>
      <button class="primary" onclick={onCreate}>➕ 방 만들기</button>
    </div>
  </div>

  {#if !isLoggedIn}
    <div class="guest-nickname">
      <label for="lobby-nickname">닉네임</label>
      <input
        id="lobby-nickname"
        type="text"
        bind:value={gameStore.nickname}
        placeholder="닉네임을 입력하면 방에 참가할 수 있어요"
        maxlength="12"
      />
    </div>
  {/if}

  {#if gameStore.publicRooms.length === 0}
    <div class="empty">
      <p>🕳️ 지금 열려 있는 공개 방이 없어요.</p>
      <button class="primary" onclick={onCreate}>첫 방 만들기</button>
    </div>
  {:else}
    <div class="grid">
      {#each gameStore.publicRooms as room (room.code)}
        <button
          class="room-card"
          onclick={() => enter(room.code)}
          disabled={!canJoin || room.playerCount >= room.maxPlayers}
          title={!canJoin ? "닉네임을 먼저 입력하세요" : "방 참가"}
        >
          <div class="room-title">{room.title}</div>
          <div class="room-host">👑 {room.hostNickname}</div>
          <div class="room-meta">
            <span class="pill">🎵 {playlistName(room.playlistId)}</span>
            <span class="pill" class:full={room.playerCount >= room.maxPlayers}>
              👥 {room.playerCount}/{room.maxPlayers}
            </span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .lobby {
    max-width: 760px;
    margin: 0 auto;
    text-align: left;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .toolbar h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #3a2c22;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .primary,
  .ghost {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
    font-weight: 700;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary {
    background: #ff3e00;
    color: white;
    border: 2px solid #ff3e00;
  }

  .primary:hover {
    background: #e63600;
    border-color: #e63600;
  }

  .ghost {
    background: white;
    color: #ff3e00;
    border: 2px solid #ffc9a3;
  }

  .ghost:hover {
    border-color: #ff3e00;
  }

  /* 게스트 닉네임 */
  .guest-nickname {
    margin-bottom: 1.25rem;
  }

  .guest-nickname label {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: 600;
    font-size: 0.85rem;
    color: #7a5a44;
  }

  .guest-nickname input {
    width: 100%;
    padding: 0.7rem;
    font-size: 1rem;
    border: 2px solid #ffd6b0;
    border-radius: 8px;
    box-sizing: border-box;
    background: white;
  }

  .guest-nickname input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  /* 방 목록 2단 그리드 (고정 높이 스크롤 + 하단 페이드아웃) */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    max-height: 62vh;
    overflow-y: auto;
    /* 하단 페이드 안으로 마지막 카드가 충분히 들어오도록 넉넉한 아래 여백 */
    padding: 2px 6px 130px 2px;
    scroll-behavior: smooth;
    /* 아래 40% 구간이 서서히 투명해지며 사라진다 (배경이 비침) */
    -webkit-mask-image: linear-gradient(
      to bottom,
      #000 60%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      #000 60%,
      transparent 100%
    );
  }

  /* 얇은 주황 스크롤바 */
  .grid::-webkit-scrollbar {
    width: 8px;
  }
  .grid::-webkit-scrollbar-thumb {
    background: #ffcaa6;
    border-radius: 999px;
  }
  .grid::-webkit-scrollbar-thumb:hover {
    background: #ff9e6f;
  }

  .room-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.1rem 1.2rem;
    text-align: left;
    background: white;
    border: 1px solid #ffe1c9;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(255, 62, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s;
  }

  .room-card:hover:not(:disabled) {
    border-color: #ff3e00;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 62, 0, 0.14);
  }

  .room-card:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .room-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #3a2c22;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .room-host {
    font-size: 0.85rem;
    color: #9a7b5f;
  }

  .room-meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.15rem;
  }

  .pill {
    font-size: 0.75rem;
    font-weight: 600;
    color: #7a5a44;
    background: #fff2e6;
    border: 1px solid #ffd6b0;
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill.full {
    color: #c0392b;
    background: #fdecea;
    border-color: #f5c6c0;
  }

  /* 빈 상태 */
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    background: white;
    border: 1px dashed #ffd6b0;
    border-radius: 16px;
  }

  .empty p {
    margin: 0 0 1rem;
    color: #9a7b5f;
  }

  /* 모바일: 1단 */
  @media (max-width: 560px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
  }
</style>
