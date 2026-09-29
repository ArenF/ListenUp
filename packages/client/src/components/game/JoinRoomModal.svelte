<script lang="ts">
  import { connection } from "../../stores/socket.svelte";
  import { authStore } from "../../stores/auth.svelte";
  import { joinRoom, roomStore } from "../../stores/room.svelte";
  import Modal from "../common/Modal.svelte";

  interface Props {
    onClose: () => void;
  }

  let { onClose }: Props = $props();

  const isLoggedIn = $derived(authStore.isLoggedIn);
  let code = $state("");
  const canJoin = $derived(
    connection.connected &&
      roomStore.nickname.trim().length > 0 &&
      code.trim().length > 0
  );

  function submit() {
    if (!canJoin) return;
    joinRoom(code);
    // 성공하면 currentRoom이 채워지며 상위에서 모달을 닫는다.
    // 실패 시에는 statusMessage에 사유가 남고 모달은 유지된다.
  }

  // Esc는 Modal이 처리한다
  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Enter") submit();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<Modal label="방 참가" maxWidth="360px" {onClose}>
  <div class="join">
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
          bind:value={roomStore.nickname}
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
        bind:value={code}
        placeholder="6자리 방 코드"
        maxlength="6"
        autocomplete="off"
      />
    </div>

    <button class="submit" onclick={submit} disabled={!canJoin}>
      🚪 참가하기
    </button>
  </div>
</Modal>

<style>
  .join {
    text-align: left;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-5);
  }

  .modal-header h3 {
    margin: 0;
    font-size: var(--font-size-xl);
    color: var(--text-primary);
  }

  .close {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--space-1);
  }

  .close:hover {
    color: var(--accent);
  }

  .field {
    margin-bottom: var(--space-4);
  }

  label {
    display: block;
    margin-bottom: 0.4rem;
    font-weight: 600;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  input {
    width: 100%;
    padding: var(--space-3);
    font-size: var(--font-size-base);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    box-sizing: border-box;
    background: var(--bg-surface);
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
  }

  #join-code {
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 700;
  }

  .submit {
    width: 100%;
    padding: 0.9rem;
    font-size: var(--font-size-base);
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
  }

  .submit:disabled {
    background: color-mix(in srgb, var(--accent) 25%, var(--bg-surface));
    cursor: not-allowed;
  }
</style>
