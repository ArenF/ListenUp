<script lang="ts">
  import { onMount } from "svelte";
  import Game from "./lib/pages/game/Game.svelte";
  import Playlist from "./lib/pages/playlist/Playlist.svelte";
  import Login from "./lib/pages/login/Login.svelte";
  import Profile from "./lib/pages/login/Profile.svelte";
  import { authStore } from "./lib/pages/login/authStore.svelte";

  // 페이지 라우팅
  type Page = "lobby" | "create" | "playlist" | "account";
  let currentPage = $state<Page>("lobby");

  // 방 참가 모달 (로비 툴바에서 연다)
  let showJoinModal = $state(false);

  // 테마: 다크(퍼플 네온) → 라이트(피치) → 아케이드(아크 네온) 순환. 기본 다크.
  type Theme = "dark" | "light" | "arcade";
  const THEME_KEY = "listenup-theme";
  const THEMES: Theme[] = ["dark", "light", "arcade"];
  const THEME_ICONS: Record<Theme, string> = {
    dark: "🌙",
    light: "☀️",
    arcade: "🎮",
  };

  function loadTheme(): Theme {
    if (typeof localStorage === "undefined") return "dark";
    const saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "arcade" ? saved : "dark";
  }

  let theme = $state<Theme>(loadTheme());

  function cycleTheme() {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  }

  // 테마 변경 시 <html data-theme> 반영 + localStorage 저장
  $effect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  });

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
        onclick={cycleTheme}
        title="테마 전환 (다크 · 라이트 · 아케이드)"
        aria-label="테마 전환"
      >
        {THEME_ICONS[theme]}
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
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--text-primary) 15%, transparent);
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  /* 로고에만 액센트 사용 (아케이드 테마에서 헤더가 물들지 않도록) */
  .navbar h1 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--accent);
  }

  .nav-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .nav-button {
    padding: 0.75rem 1.25rem;
    background-color: color-mix(in srgb, var(--accent) 12%, transparent);
    color: var(--text-primary);
    border: 2px solid transparent;
    border-radius: 8px;
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
    font-size: 1.1rem;
    line-height: 1;
    padding: 0.75rem 0.9rem;
  }

  /* 로그인 필요 안내 */
  .login-required {
    max-width: 400px;
    margin: 4rem auto;
    padding: 2.5rem 2rem;
    text-align: center;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 8px 24px color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .login-required p {
    margin: 0 0 1.5rem;
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .login-cta {
    padding: 0.8rem 1.5rem;
    background: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .login-cta:hover {
    background: color-mix(in srgb, var(--accent) 85%, black);
  }
</style>
