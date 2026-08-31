<script lang="ts">
  import { gameStore } from "./gameStore.svelte";
  import { authStore } from "../login/authStore.svelte";
  import { joinRoom } from "./gameActions";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const isLoggedIn = $derived(authStore.isLoggedIn);
  const canJoin = $derived(
    gameStore.connected &&
      gameStore.nickname.trim().length > 0 &&
      gameStore.roomCode.trim().length > 0
  );

  function submit() {
    if (!canJoin) return;
    joinRoom();
    // 성공하면 currentRoom이 채워지며 상위에서 모달을 닫는다.
    // 실패 시에는 statusMessage에 사유가 남고 모달은 유지된다.
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
    if (event.key === "Enter") submit();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="backdrop"
  role="button"
  tabindex="-1"
  aria-label="닫기"
  onclick={onClose}
  onkeydown={(e) => e.key === "Enter" && onClose()}
>
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-label="방 참가"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="modal-header">
      <h3>방 코드로 참가</h3>
      <button class="close" onclick={onClose} aria-label="닫기">✕</button>
    </div>

    {#if !isLoggedIn}
      <div class="field">
        <label for="join-nickname">닉네임</label>
        <input
          id="join-nickname"
          type="text"
          bind:value={gameStore.nickname}
          placeholder="닉네임 입력"
          maxlength="12"
        />
      </div>
    {/if}

    <div class="field">
      <label for="join-code">방 코드</label>
      <input
        id="join-code"
        type="text"
        bind:value={gameStore.roomCode}
        placeholder="6자리 방 코드"
        maxlength="6"
        autocomplete="off"
      />
    </div>

    <button class="submit" onclick={submit} disabled={!canJoin}>
      🚪 참가하기
    </button>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(58, 44, 34, 0.45);
  }

  .modal {
    width: 100%;
    max-width: 360px;
    padding: 1.5rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
    text-align: left;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #3a2c22;
  }

  .close {
    font-size: 1rem;
    color: #9a7b5f;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
  }

  .close:hover {
    color: #ff3e00;
  }

  .field {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: 0.85rem;
    color: #7a5a44;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ffd6b0;
    border-radius: 8px;
    box-sizing: border-box;
    background: white;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  #join-code {
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 700;
  }

  .submit {
    width: 100%;
    padding: 0.9rem;
    font-size: 1rem;
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
  }

  .submit:disabled {
    background: #e6c9b6;
    cursor: not-allowed;
  }
</style>
