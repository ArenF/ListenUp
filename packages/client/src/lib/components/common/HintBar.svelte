<script lang="ts">
  import type { HintItem } from '../../stores/gameStore';

  interface Props {
    hint: HintItem;
  }

  let { hint }: Props = $props();

  // 숫자 이모지 매핑
  const numberEmojis = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
</script>

<div
  class="hint-bar"
  class:is-new={hint.isNew}
>
  <span class="hint-number">{numberEmojis[hint.index - 1] || hint.index}</span>
  <span class="hint-text">{hint.text}</span>
</div>

<style>
  .hint-bar {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-left: 3px solid #9c27b0;
    border-radius: 6px;
    transition: all 0.3s ease;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .hint-bar.is-new {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    animation: pulse-glow 0.6s ease;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  }

  @keyframes pulse-glow {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
  }

  .hint-number {
    font-size: 1.2rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .hint-bar.is-new .hint-number {
    animation: bounce-number 0.6s ease;
  }

  @keyframes bounce-number {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.3);
    }
  }

  .hint-text {
    flex: 1;
    font-weight: 500;
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .hint-bar {
      padding: 0.6rem 0.8rem;
      font-size: 0.85rem;
    }

    .hint-number {
      font-size: 1rem;
    }
  }
</style>
