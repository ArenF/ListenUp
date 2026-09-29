<script lang="ts" module>
  /** 상단 네비게이션으로 오가는 페이지 */
  export type Page = "lobby" | "create" | "playlist" | "account";
</script>

<script lang="ts">
  import { authStore } from "../../stores/auth.svelte";
  import { themeStore } from "../../stores/theme.svelte";

  interface Props {
    currentPage: Page;
    onNavigate: (page: Page) => void;
  }

  let { currentPage, onNavigate }: Props = $props();
</script>

<nav class="navbar">
  <h1>🎵 ListenUp!</h1>
  <div class="nav-buttons">
    <button
      class="nav-button"
      class:active={currentPage === "lobby" || currentPage === "create"}
      onclick={() => onNavigate("lobby")}
    >
      🏠 로비
    </button>
    <button
      class="nav-button"
      class:active={currentPage === "playlist"}
      onclick={() => onNavigate("playlist")}
    >
      🎵 플레이리스트
    </button>
    <button
      class="nav-button account"
      class:active={currentPage === "account"}
      onclick={() => onNavigate("account")}
    >
      {#if authStore.isLoggedIn}
        👤 {authStore.user?.nickname}
      {:else}
        🔑 로그인
      {/if}
    </button>
    <button
      class="nav-button theme-toggle"
      onclick={() => themeStore.cycle()}
      title="테마 전환 (다크 · 라이트 · 아케이드)"
      aria-label="테마 전환"
    >
      {themeStore.icon}
    </button>
  </div>
</nav>

<style>
  .navbar {
    background-color: var(--bg-surface);
    color: var(--text-primary);
    padding: var(--space-4) var(--space-8);
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  /* 로고에만 액센트 사용 (아케이드 테마에서 헤더가 물들지 않도록) */
  .navbar h1 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--accent);
  }

  .nav-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .nav-button {
    padding: var(--space-3) var(--space-5);
    background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--text-primary);
    border: 2px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .nav-button:hover {
    background-color: color-mix(in srgb, var(--accent) 22%, transparent);
  }

  .nav-button.active {
    background-color: var(--accent);
    color: var(--text-on-accent);
    border-color: var(--accent);
  }

  /* 테마 토글 (현재 테마 아이콘 표시) */
  .theme-toggle {
    font-size: var(--font-size-lg);
    line-height: 1;
    padding: var(--space-3) 0.9rem;
  }
</style>
