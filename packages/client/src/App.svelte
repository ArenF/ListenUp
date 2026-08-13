<script lang="ts">
  import { onMount } from "svelte";
  import Game from "./lib/pages/game/Game.svelte";
  import Playlist from "./lib/pages/playlist/Playlist.svelte";
  import Login from "./lib/pages/login/Login.svelte";
  import Profile from "./lib/pages/login/Profile.svelte";
  import { authStore } from "./lib/pages/login/authStore.svelte";

  // 페이지 라우팅
  let currentPage = $state<"game" | "playlist" | "account">("game");

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
        class:active={currentPage === "game"}
        onclick={() => (currentPage = "game")}
      >
        🎮 게임
      </button>
      <button
        class="nav-button"
        class:active={currentPage === "playlist"}
        onclick={() => (currentPage = "playlist")}
      >
        🎵 플레이리스트 관리
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
    </div>
  </nav>

  <!-- 페이지 컨텐츠 -->
  {#if currentPage === "playlist"}
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
  {:else if currentPage === "account"}
    {#if authStore.isLoggedIn}
      <Profile />
    {:else}
      <Login />
    {/if}
  {:else}
    <Game />
  {/if}
</main>

<style>
  main {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
  }

  /* 네비게이션 */
  .navbar {
    background-color: #ff3e00;
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .navbar h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .nav-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .nav-button:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }

  .nav-button.active {
    background-color: white;
    color: #ff3e00;
    border-color: white;
  }

  /* 로그인 필요 안내 */
  .login-required {
    max-width: 400px;
    margin: 4rem auto;
    padding: 2.5rem 2rem;
    text-align: center;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .login-required p {
    margin: 0 0 1.5rem;
    color: #555;
    font-size: 1rem;
  }

  .login-cta {
    padding: 0.8rem 1.5rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .login-cta:hover {
    background: #e63600;
  }
</style>
