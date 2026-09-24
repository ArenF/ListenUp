<script lang="ts">
  import { connection } from "../../stores/socket.svelte";
  import { authStore } from "../../stores/auth.svelte";
  import { joinRoom, roomStore } from "../../stores/room.svelte";

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
    connection.connected && roomStore.nickname.trim().length > 0
  );

  /** 플레이리스트 ID를 사람이 읽는 이름으로 바꾼다 */
  function playlistName(id: string): string {
    return roomStore.playlists.find((p) => p.id === id)?.name ?? id;
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
        bind:value={roomStore.nickname}
        placeholder="닉네임을 입력하면 방에 참가할 수 있어요"
        maxlength="12"
      />
    </div>
  {/if}

  {#if roomStore.publicRooms.length === 0}
    <div class="empty">
      <p>🕳️ 지금 열려 있는 공개 방이 없어요.</p>
      <button class="primary" onclick={onCreate}>첫 방 만들기</button>
    </div>
  {:else}
    <div class="grid">
      {#each roomStore.publicRooms as room (room.code)}
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
    margin-bottom: var(--space-5);
  }

  .toolbar h2 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-primary);
  }

  .actions {
    display: flex;
    gap: var(--space-2);
  }

  .primary,
  .ghost {
    padding: 0.6rem var(--space-4);
    font-size: var(--font-size-sm);
    font-weight: 700;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary {
    background: var(--accent);
    color: var(--text-on-accent);
    border: 2px solid var(--accent);
  }

  .primary:hover {
    background: color-mix(in srgb, var(--accent) 85%, black);
    border-color: color-mix(in srgb, var(--accent) 85%, black);
  }

  .ghost {
    background: var(--bg-surface);
    color: var(--accent);
    border: 2px solid var(--border);
  }

  .ghost:hover {
    border-color: var(--accent);
  }

  /* 게스트 닉네임 */
  .guest-nickname {
    margin-bottom: var(--space-5);
  }

  .guest-nickname label {
    display: block;
    margin-bottom: 0.35rem;
    font-weight: 600;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .guest-nickname input {
    width: 100%;
    padding: 0.7rem;
    font-size: var(--font-size-base);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    box-sizing: border-box;
    background: var(--bg-surface);
  }

  .guest-nickname input:focus {
    outline: none;
    border-color: var(--accent);
  }

  /* 방 목록 2단 그리드 (고정 높이 스크롤 + 하단 페이드아웃) */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
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

  /* 얇은 액센트 스크롤바 */
  .grid::-webkit-scrollbar {
    width: 8px;
  }
  .grid::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--accent) 40%, transparent);
    border-radius: var(--radius-full);
  }
  .grid::-webkit-scrollbar-thumb:hover {
    background: color-mix(in srgb, var(--accent) 65%, transparent);
  }

  .room-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: 1.1rem 1.2rem;
    text-align: left;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 4px 14px color-mix(in srgb, var(--accent) 15%, transparent);
    cursor: pointer;
    transition: all 0.2s;
  }

  .room-card:hover:not(:disabled) {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  .room-card:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .room-title {
    font-size: var(--font-size-lg);
    font-weight: 800;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .room-host {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  .room-meta {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.15rem;
  }

  .pill {
    font-size: var(--font-size-2xs);
    font-weight: 600;
    color: var(--text-secondary);
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-surface));
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    padding: 0.2rem 0.6rem;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pill.full {
    color: var(--color-danger);
    background: color-mix(in srgb, var(--color-danger) 10%, var(--bg-surface));
    border-color: color-mix(in srgb, var(--color-danger) 30%, var(--bg-surface));
  }

  /* 빈 상태 */
  .empty {
    text-align: center;
    padding: var(--space-12) var(--space-4);
    background: var(--bg-surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius-xl);
  }

  .empty p {
    margin: 0 0 var(--space-4);
    color: var(--text-secondary);
  }

  /* 모바일: 1단 */
  @media (max-width: 560px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .toolbar {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-3);
    }
  }
</style>
