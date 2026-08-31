<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { authStore } from "../login/authStore.svelte";
  import { createRoom } from "./gameActions";

  interface Props {
    /** 취소하고 로비로 돌아가기 */
    onCancel: () => void;
  }

  let { onCancel }: Props = $props();

  const isLoggedIn = $derived(authStore.isLoggedIn);
  const canCreate = $derived(
    gameStore.connected && gameStore.nickname.trim().length > 0
  );
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
          <span>{gameStore.nickname}</span>
          <span class="badge">로그인 계정</span>
        </div>
      {:else}
        <input
          id="nickname"
          type="text"
          bind:value={gameStore.nickname}
          placeholder="닉네임 입력"
          maxlength="12"
          disabled={!gameStore.connected}
        />
      {/if}
    </div>

    <!-- 방 제목 -->
    <div class="field">
      <label for="title">방 제목</label>
      <input
        id="title"
        type="text"
        bind:value={gameStore.roomTitle}
        placeholder="비워두면 '{gameStore.nickname || '나'}님의 방'"
        maxlength="24"
        disabled={!gameStore.connected}
      />
    </div>

    <!-- 플레이리스트 -->
    <div class="field">
      <label for="playlist">플레이리스트</label>
      <select
        id="playlist"
        bind:value={gameStore.selectedPlaylistId}
        disabled={!gameStore.connected}
      >
        {#each gameStore.playlists as playlist}
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
          class:active={gameStore.roomIsPublic}
          onclick={() => (gameStore.roomIsPublic = true)}
        >
          🌐 공개
          <small>로비 목록에 표시</small>
        </button>
        <button
          type="button"
          class="toggle"
          class:active={!gameStore.roomIsPublic}
          onclick={() => (gameStore.roomIsPublic = false)}
        >
          🔒 비공개
          <small>코드로만 참가</small>
        </button>
      </div>
    </div>

    <button class="submit" onclick={createRoom} disabled={!canCreate}>
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
    margin-bottom: 1.25rem;
  }

  .header h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #3a2c22;
  }

  .back {
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 700;
    color: #7a5a44;
    background: white;
    border: 2px solid #ffd6b0;
    border-radius: 8px;
    cursor: pointer;
  }

  .back:hover {
    border-color: #ff3e00;
    color: #ff3e00;
  }

  .card {
    padding: 1.75rem 1.5rem;
    background: white;
    border: 1px solid #ffe1c9;
    border-radius: 16px;
    box-shadow: 0 6px 18px rgba(255, 62, 0, 0.06);
  }

  .field {
    margin-bottom: 1.25rem;
  }

  label,
  .label-text {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;
    color: #7a5a44;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ffd6b0;
    border-radius: 8px;
    box-sizing: border-box;
    background: white;
    transition: border-color 0.2s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #ff3e00;
  }

  input:disabled,
  select:disabled {
    background: #f7f2ea;
    cursor: not-allowed;
  }

  .locked {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border: 2px solid #ffe1c9;
    border-radius: 8px;
    background: #fff6ee;
    font-weight: 600;
    color: #3a2c22;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: white;
    background: #ff3e00;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
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
    font-size: 0.9rem;
    font-weight: 700;
    color: #7a5a44;
    background: #fff6ee;
    border: 2px solid #ffd6b0;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle small {
    font-weight: 500;
    font-size: 0.7rem;
    color: #b3987c;
  }

  .toggle.active {
    color: #ff3e00;
    border-color: #ff3e00;
    background: #fff1e8;
  }

  .toggle.active small {
    color: #d9744f;
  }

  .submit {
    width: 100%;
    padding: 0.95rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: white;
    background: #ff3e00;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .submit:hover:not(:disabled) {
    background: #e63600;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
  }

  .submit:disabled {
    background: #e6c9b6;
    cursor: not-allowed;
  }
</style>
