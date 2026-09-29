<script lang="ts">
  import { onMount } from "svelte";
  import NavBar, { type Page } from "./components/common/NavBar.svelte";
  import Game from "./pages/GamePage.svelte";
  import Playlist from "./pages/PlaylistPage.svelte";
  import Login from "./pages/LoginPage.svelte";
  import Profile from "./pages/ProfilePage.svelte";
  import { authStore } from "./stores/auth.svelte";

  // 페이지 라우팅
  let currentPage = $state<Page>("lobby");

  // 방 참가 모달 (로비 툴바에서 연다)
  let showJoinModal = $state(false);

  // 새로고침 후에도 로그인 세션을 이어간다
  onMount(() => {
    authStore.restore();
  });
</script>

<main>
  <NavBar {currentPage} onNavigate={(page) => (currentPage = page)} />

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
