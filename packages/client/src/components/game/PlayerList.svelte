<script lang="ts">
  import type { Player } from "../../types/index";

  interface Props {
    players: Player[];
  }

  let { players }: Props = $props();
</script>

<h3>👥 참가자 목록</h3>
<div class="players-list">
  {#each players as player}
    <div class="player-card">
      <span class="avatar">{player.avatar}</span>
      <span class="player-name">
        {player.nickname}
        {#if player.isHost}
          <span class="host-badge">👑</span>
        {/if}
        {#if player.score !== undefined}
          <span class="score">({player.score}점)</span>
        {/if}
      </span>
    </div>
  {/each}
</div>

<style>
  h3 {
    font-size: var(--font-size-xl);
    margin-top: var(--space-6);
    margin-bottom: var(--space-2);
    color: var(--text-secondary);
  }

  .players-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .player-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    background-color: var(--bg-surface);
    border-radius: var(--radius-md);
    box-shadow: 0 1px 4px color-mix(in srgb, var(--text-primary) 15%, transparent);
  }

  .avatar {
    font-size: 2rem;
  }

  .player-name {
    font-size: var(--font-size-lg);
    font-weight: 500;
    flex: 1;
    text-align: left;
  }

  .host-badge {
    margin-left: var(--space-2);
  }

  .score {
    color: var(--accent);
    font-weight: 600;
    margin-left: var(--space-2);
  }
</style>
