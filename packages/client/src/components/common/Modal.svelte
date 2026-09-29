<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    /** 스크린리더에 읽힐 대화상자 이름 */
    label: string;
    /** 패널 최대 너비 (CSS 길이) */
    maxWidth?: string;
    /** 배경 클릭·Esc로 닫을 때 호출된다 */
    onClose: () => void;
    children: Snippet;
  }

  let { label, maxWidth = "500px", onClose, children }: Props = $props();

  function onKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- 배경 클릭으로 닫기 (키보드는 Esc로 닫는다) -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="backdrop" onclick={onClose}>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    style:max-width={maxWidth}
    onclick={(e) => e.stopPropagation()}
  >
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    background-color: color-mix(in srgb, var(--bg-primary) 80%, transparent);
  }

  .modal {
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    padding: var(--space-8);
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-modal);
  }
</style>
