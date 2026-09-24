<script lang="ts">
  import { connection } from "../../stores/socket.svelte";
  import { authStore } from "../../stores/auth.svelte";
  import { createRoom, roomStore } from "../../stores/room.svelte";

  interface Props {
    /** 취소하고 로비로 돌아가기 */
    onCancel: () => void;
  }

  let { onCancel }: Props = $props();

  const isLoggedIn = $derived(authStore.isLoggedIn);
  const canCreate = $derived(
    connection.connected && roomStore.nickname.trim().length > 0
  );

  // 방 생성 폼 입력값 (화면을 벗어나면 초기화된다)
  let title = $state("");
  let playlistId = $state("test-playlist");
  let isPublic = $state(true);
</script>

<div class="create">
  <div class="header">
    <h2>방 만들기</h2>
    <button class="back" onclick={onCancel}>← 로비</button>
  </div>

  <div class="card">
    <!-- 닉네임 -->
    <div class="field">
      <label for="nickname">닉네임</label>
      {#if isLoggedIn}
        <div class="locked">
          <span>{roomStore.nickname}</span>
          <span class="badge">로그인 계정</span>
        </div>
      {:else}
        <input
          id="nickname"
          type="text"
          bind:value={roomStore.nickname}
          placeholder="닉네임 입력"
          maxlength="12"
          disabled={!connection.connected}
        />
      {/if}
    </div>

    <!-- 방 제목 -->
    <div class="field">
      <label for="title">방 제목</label>
      <input
        id="title"
        type="text"
        bind:value={title}
        placeholder="비워두면 '{roomStore.nickname || '나'}님의 방'"
        maxlength="24"
        disabled={!connection.connected}
      />
    </div>

    <!-- 플레이리스트 -->
    <div class="field">
      <label for="playlist">플레이리스트</label>
      <select
        id="playlist"
        bind:value={playlistId}
        disabled={!connection.connected}
      >
        {#each roomStore.playlists as playlist}
          <option value={playlist.id}>
            {playlist.name} ({playlist.tracks?.length || 0} 트랙)
          </option>
        {/each}
      </select>
    </div>

    <!-- 공개/비공개 -->
    <div class="field">
      <span class="label-text">공개 설정</span>
      <div class="toggle-row">
        <button
          type="button"
          class="toggle"
          class:active={isPublic}
          onclick={() => (isPublic = true)}
        >
          🌐 공개
          <small>로비 목록에 표시</small>
        </button>
        <button
          type="button"
          class="toggle"
          class:active={!isPublic}
          onclick={() => (isPublic = false)}
        >
          🔒 비공개
          <small>코드로만 참가</small>
        </button>
      </div>
    </div>

    <button class="submit" onclick={() => createRoom({ title, playlistId, isPublic })} disabled={!canCreate}>
      🏠 방 만들기
    </button>
  </div>
</div>

<style>
  .create {
    max-width: 480px;
    margin: 0 auto;
    text-align: left;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }

  .header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: var(--text-primary);
  }

  .back {
    padding: var(--space-2) 0.9rem;
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .back:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .card {
    padding: 1.75rem var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-accent-soft);
  }

  .field {
    margin-bottom: var(--space-5);
  }

  label,
  .label-text {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  input,
  select {
    width: 100%;
    padding: var(--space-3);
    font-size: var(--font-size-base);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    box-sizing: border-box;
    background: var(--bg-surface);
    transition: border-color 0.2s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--accent);
  }

  input:disabled,
  select:disabled {
    background: color-mix(in srgb, var(--text-secondary) 10%, var(--bg-surface));
    cursor: not-allowed;
  }

  .locked {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 6%, var(--bg-surface));
    font-weight: 600;
    color: var(--text-primary);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-on-accent);
    background: var(--accent);
    padding: 0.2rem 0.55rem;
    border-radius: var(--radius-full);
  }

  /* 공개/비공개 토글 */
  .toggle-row {
    display: flex;
    gap: 0.6rem;
  }

  .toggle {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.7rem;
    font-size: var(--font-size-sm);
    font-weight: 700;
    color: var(--text-secondary);
    background: color-mix(in srgb, var(--accent) 6%, var(--bg-surface));
    border: 2px solid var(--border);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle small {
    font-weight: 500;
    font-size: 0.7rem;
    color: var(--text-secondary);
  }

  .toggle.active {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
  }

  .toggle.active small {
    color: color-mix(in srgb, var(--accent) 70%, var(--text-primary));
  }

  .submit {
    width: 100%;
    padding: 0.95rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--text-on-accent);
    background: var(--accent);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 85%, black);
    transform: translateY(-2px);
    box-shadow: var(--shadow-accent);
  }

  .submit:disabled {
    background: color-mix(in srgb, var(--accent) 25%, var(--bg-surface));
    cursor: not-allowed;
  }
</style>
