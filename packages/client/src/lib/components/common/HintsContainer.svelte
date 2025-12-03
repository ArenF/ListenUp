<script lang="ts">
  import { onMount } from 'svelte';
  import HintBar from './HintBar.svelte';
  import type { HintItem } from '../../stores/gameStore';

  interface Props {
    hints: HintItem[];
  }

  let { hints }: Props = $props();
  let containerElement: HTMLDivElement | null = $state(null);

  // 새 힌트가 추가되면 스크롤을 아래로 (최신 힌트가 보이도록)
  $effect(() => {
    if (hints.length > 0 && containerElement) {
      // 약간의 딜레이 후 스크롤 (애니메이션 완료 후)
      setTimeout(() => {
        if (containerElement) {
          containerElement.scrollTop = containerElement.scrollHeight;
        }
      }, 100);
    }
  });
</script>

<div class="hints-wrapper">
  <div class="hints-header">
    <span class="icon">💡</span>
    <span class="title">힌트</span>
    {#if hints.length > 0}
      <span class="badge">{hints.length}</span>
    {/if}
  </div>

  <div class="hints-body" bind:this={containerElement}>
    {#if hints.length > 0}
      <div class="hints-list">
        {#each hints as hint (hint.id)}
          <HintBar {hint} />
        {/each}
      </div>
    {:else}
      <div class="hints-empty">
        <span class="empty-icon">🔍</span>
        <span class="empty-text">힌트가 곧 나타날 거예요!</span>
      </div>
    {/if}
  </div>
</div>

<style>
  .hints-wrapper {
    margin: 1.5rem 0;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .hints-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }

  .icon {
    font-size: 1.2rem;
  }

  .title {
    flex: 1;
  }

  .badge {
    padding: 0.2rem 0.6rem;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .hints-body {
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    background: #f9f9f9;
  }

  .hints-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  /* 스크롤바 스타일링 */
  .hints-body::-webkit-scrollbar {
    width: 6px;
  }

  .hints-body::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
  }

  .hints-body::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 3px;
  }

  .hints-body::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
  }

  /* 빈 상태 */
  .hints-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    color: #999;
    text-align: center;
    gap: 0.5rem;
  }

  .empty-icon {
    font-size: 2rem;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 0.9rem;
    font-weight: 500;
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .hints-wrapper {
      margin: 1rem 0;
    }

    .hints-body {
      max-height: 150px;
    }

    .hints-header {
      padding: 0.6rem 0.8rem;
      font-size: 0.9rem;
    }

    .icon {
      font-size: 1rem;
    }
  }
</style>
