<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Props {
    text: string;
    index: number;
    total: number;
    onDismiss?: () => void;
  }

  let { text, index, total, onDismiss }: Props = $props();
</script>

<!-- 힌트 오버레이 -->
<div class="hint-overlay" transition:fade={{ duration: 300 }}>
  <div
    class="hint-card"
    transition:scale={{ duration: 400, easing: quintOut, start: 0.8 }}
    role="alert"
    aria-live="polite"
  >
    <!-- 힌트 헤더 -->
    <div class="hint-header">
      <span class="hint-icon">💡</span>
      <span class="hint-badge">힌트 {index}/{total}</span>
    </div>

    <!-- 힌트 내용 -->
    <div class="hint-content">
      {text}
    </div>

    <!-- 닫기 버튼 -->
    {#if onDismiss}
      <button
        class="hint-close"
        onclick={onDismiss}
        aria-label="힌트 닫기"
      >
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .hint-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 8888;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    pointer-events: auto;
  }

  .hint-card {
    position: relative;
    width: 90%;
    max-width: 600px;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    color: white;
  }

  .hint-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .hint-icon {
    font-size: 2.5rem;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .hint-badge {
    padding: 0.5rem 1rem;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .hint-content {
    font-size: 1.5rem;
    line-height: 1.6;
    font-weight: 500;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .hint-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    cursor: pointer;
    color: white;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hint-close:hover {
    background-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .hint-close svg {
    width: 18px;
    height: 18px;
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .hint-card {
      width: 95%;
      padding: 1.5rem;
    }

    .hint-icon {
      font-size: 2rem;
    }

    .hint-content {
      font-size: 1.2rem;
    }
  }
</style>
