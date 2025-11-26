<script lang="ts">
  import { toastStore } from '../../stores/toastStore';
  import { fly } from 'svelte/transition';

  // Toast store 구독
  const toasts = $derived($toastStore);
</script>

<!-- Toast 컨테이너 -->
<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      transition:fly={{ x: 300, duration: 300 }}
      role="alert"
      aria-live="polite"
    >
      <!-- 아이콘 -->
      <div class="toast-icon">
        {#if toast.type === 'success'}
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        {:else if toast.type === 'error'}
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        {:else if toast.type === 'warn'}
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
        {:else}
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clip-rule="evenodd"
            />
          </svg>
        {/if}
      </div>

      <!-- 메시지 -->
      <div class="toast-message">
        {toast.message}
      </div>

      <!-- 닫기 버튼 -->
      <button
        class="toast-close"
        onclick={() => toastStore.remove(toast.id)}
        aria-label="닫기"
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 300px;
    max-width: 500px;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    background-color: white;
    border-left: 4px solid;
  }

  /* Toast 타입별 색상 */
  .toast-success {
    border-left-color: #4caf50;
  }

  .toast-success .toast-icon {
    color: #4caf50;
  }

  .toast-error {
    border-left-color: #f44336;
  }

  .toast-error .toast-icon {
    color: #f44336;
  }

  .toast-warn {
    border-left-color: #ff9800;
  }

  .toast-warn .toast-icon {
    color: #ff9800;
  }

  .toast-info {
    border-left-color: #2196f3;
  }

  .toast-info .toast-icon {
    color: #2196f3;
  }

  /* 아이콘 */
  .toast-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  .toast-icon svg {
    width: 100%;
    height: 100%;
  }

  /* 메시지 */
  .toast-message {
    flex: 1;
    font-size: 0.9rem;
    line-height: 1.4;
    color: #333;
    word-break: keep-all;
  }

  /* 닫기 버튼 */
  .toast-close {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    color: #999;
    transition: color 0.2s;
  }

  .toast-close:hover {
    color: #333;
  }

  .toast-close svg {
    width: 100%;
    height: 100%;
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .toast-container {
      top: 0.5rem;
      right: 0.5rem;
      left: 0.5rem;
    }

    .toast {
      min-width: unset;
      max-width: unset;
    }
  }
</style>
