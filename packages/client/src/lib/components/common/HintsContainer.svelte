<script lang="ts">
  import { slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import HintBar from './HintBar.svelte';
  import type { HintItem } from '../../stores/gameStore';

  interface Props {
    hints: HintItem[];
    minimized: boolean;
    onToggleMinimize?: () => void;
  }

  let { hints, minimized, onToggleMinimize }: Props = $props();
</script>

{#if hints.length > 0}
  <div class="hints-container" class:minimized>
    <!-- 헤더 -->
    <div class="hints-header" onclick={onToggleMinimize}>
      <div class="hints-title">
        <span class="icon">💡</span>
        <span class="title-text">힌트</span>
        {#if hints.length > 0}
          <span class="badge">{hints.length}</span>
        {/if}
      </div>
      <button
        class="toggle-btn"
        aria-label={minimized ? "힌트 펼치기" : "힌트 접기"}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          style="transform: rotate({minimized ? 180 : 0}deg); transition: transform 0.3s;"
        >
          <path
            fill-rule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- 힌트 리스트 -->
    {#if !minimized}
      <div class="hints-body" transition:slide={{ duration: 300, easing: quintOut }}>
        {#each hints as hint (hint.id)}
          <HintBar {hint} />
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .hints-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-height: 500px;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .hints-container:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  }

  .hints-container.minimized {
    max-height: 60px;
  }

  .hints-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    cursor: pointer;
    user-select: none;
    transition: background 0.3s;
  }

  .hints-header:hover {
    background: linear-gradient(135deg, #7c8ff0 0%, #8759b0 100%);
  }

  .hints-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 1rem;
  }

  .icon {
    font-size: 1.5rem;
    animation: glow 2s ease-in-out infinite;
  }

  @keyframes glow {
    0%, 100% {
      filter: brightness(1) drop-shadow(0 0 2px rgba(255, 255, 255, 0.3));
    }
    50% {
      filter: brightness(1.3) drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
    }
  }

  .badge {
    padding: 0.2rem 0.6rem;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .toggle-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .toggle-btn svg {
    width: 20px;
    height: 20px;
  }

  .hints-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 420px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* 스크롤바 스타일링 */
  .hints-body::-webkit-scrollbar {
    width: 8px;
  }

  .hints-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }

  .hints-body::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
  }

  .hints-body::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .hints-container {
      bottom: 10px;
      right: 10px;
      left: 10px;
      width: auto;
      max-width: none;
    }

    .hints-header {
      padding: 0.8rem 1rem;
    }

    .hints-title {
      font-size: 0.9rem;
    }

    .icon {
      font-size: 1.3rem;
    }

    .hints-body {
      padding: 0.75rem;
      max-height: 300px;
    }
  }

  /* 태블릿 */
  @media (min-width: 769px) and (max-width: 1024px) {
    .hints-container {
      width: 340px;
      max-height: 400px;
    }

    .hints-body {
      max-height: 320px;
    }
  }
</style>
