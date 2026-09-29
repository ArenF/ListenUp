<script lang="ts">
  import { playlistStore } from "../../stores/playlist.svelte";

  interface Props {
    /** "새로 만들기" 모달 열기 */
    onCreate: () => void;
  }

  let { onCreate }: Props = $props();
</script>

<!-- 플레이리스트 목록 -->
<div class="sidebar">
  <div class="sidebar-header">
    <h2>플레이리스트</h2>
    <button class="btn-create" onclick={onCreate}>
      ➕ 새로 만들기
    </button>
  </div>

  {#if playlistStore.loading && playlistStore.playlists.length === 0}
    <div class="loading">로딩 중...</div>
  {:else if playlistStore.playlists.length === 0}
    <div class="empty-message">
      플레이리스트가 없습니다.
      <br />
      새로 만들어보세요!
    </div>
  {:else}
    <div class="playlist-list">
      {#each playlistStore.playlists as playlist}
        <div
          class="playlist-item"
          class:active={playlistStore.selected?.id === playlist.id}
          onclick={() => playlistStore.select(playlist)}
        >
          <div class="playlist-name">{playlist.name}</div>
          <div class="playlist-count">
            {playlist.tracks?.length || 0} 트랙
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sidebar {
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: var(--text-primary);
  }

  .btn-create {
    padding: var(--space-2) var(--space-4);
    background-color: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: all 0.2s;
  }

  .btn-create:hover {
    background-color: color-mix(in srgb, var(--accent) 85%, black);
  }

  .loading,
  .empty-message {
    text-align: center;
    padding: var(--space-8);
    color: var(--text-secondary);
  }

  .playlist-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .playlist-item {
    padding: var(--space-4);
    background-color: var(--bg-surface);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .playlist-item:hover {
    border-color: var(--accent);
    transform: translateX(4px);
  }

  .playlist-item.active {
    background-color: color-mix(in srgb, var(--accent) 12%, var(--bg-surface));
    border-color: var(--accent);
  }

  .playlist-name {
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-1);
  }

  .playlist-count {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .sidebar {
      margin-bottom: var(--space-8);
    }
  }
</style>
