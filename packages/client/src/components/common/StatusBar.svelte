<script lang="ts">
  import { connection } from "../../stores/socket.svelte";
</script>

<!-- 서버 연결 상태와 최근 게임 메시지 -->
<div class="status-bar" class:connected={connection.connected}>
  <div class="status-indicator"></div>
  <span>{connection.statusMessage}</span>
</div>

<style>
  .status-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background-color: color-mix(in srgb, var(--color-danger) 12%, var(--bg-surface));
    border-radius: var(--radius-md);
    margin-bottom: var(--space-6);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    transition: background-color 0.3s;
  }

  .status-bar.connected {
    background-color: color-mix(in srgb, var(--color-success) 12%, var(--bg-surface));
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--color-danger);
    animation: pulse 2s infinite;
    flex-shrink: 0;
  }

  .status-bar.connected .status-indicator {
    background-color: var(--color-success);
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
