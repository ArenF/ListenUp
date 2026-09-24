<script lang="ts">
  import { onMount } from "svelte";
  import Game from "./pages/GamePage.svelte";
  import Playlist from "./pages/PlaylistPage.svelte";
  import Login from "./pages/LoginPage.svelte";
  import Profile from "./pages/ProfilePage.svelte";
  import { authStore } from "./stores/auth.svelte";
  import { themeStore } from "./stores/theme.svelte";

  // 페이지 라우팅
  type Page = "lobby" | "create" | "playlist" | "account";
  let currentPage = $state<Page>("lobby");

  // 방 참가 모달 (로비 툴바에서 연다)
  let showJoinModal = $state(false);

  // 새로고침 후에도 로그인 세션을 이어간다
  onMount(() => {
    authStore.restore();
  });
</script>

<main>
  <!-- 네비게이션 -->
  <nav class="navbar">
    <h1>🎵 ListenUp!</h1>
    <div class="nav-buttons">
      <button
        class="nav-button"
        class:active={currentPage === "lobby" || currentPage === "create"}
        onclick={() => (currentPage = "lobby")}
      >
        🏠 로비
      </button>
      <button
        class="nav-button"
        class:active={currentPage === "playlist"}
        onclick={() => (currentPage = "playlist")}
      >
        🎵 플레이리스트
      </button>
      <button
        class="nav-button account"
        class:active={currentPage === "account"}
        onclick={() => (currentPage = "account")}
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

  <!-- 페이지 컨텐츠 -->
  {#if currentPage === "lobby" || currentPage === "create"}
    <Game
      view={currentPage}
      bind:showJoinModal
      onNavigate={(v) => (currentPage = v)}
    />
  {:else if currentPage === "playlist"}
    {#if authStore.isLoggedIn}
      <Playlist />
    {:else}
      <div class="login-required">
        <p>🔒 플레이리스트 관리는 로그인이 필요합니다.</p>
        <button class="login-cta" onclick={() => (currentPage = "account")}>
          로그인하러 가기
        </button>
      </div>
    {/if}
  {:else}
    {#if authStore.isLoggedIn}
      <Profile />
    {:else}
      <Login />
    {/if}
  {/if}
</main>

<style>
  main {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
  }

  /* 네비게이션 */
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

  /* 로그인 필요 안내 */
  .login-required {
    max-width: 400px;
    margin: var(--space-16) auto;
    padding: 2.5rem var(--space-8);
    text-align: center;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  .login-required p {
    margin: 0 0 var(--space-6);
    color: var(--text-secondary);
    font-size: var(--font-size-base);
  }

  .login-cta {
    padding: 0.8rem var(--space-6);
    background: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .login-cta:hover {
    background: color-mix(in srgb, var(--accent) 85%, black);
  }
</style>
