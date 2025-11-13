<script lang="ts">
  import Game from "./lib/pages/game/Game.svelte";
  import Playlist from "./lib/pages/playlist/Playlist.svelte";

  // 페이지 라우팅
  let currentPage = $state<"game" | "playlist">("game");
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
    </div>
  </nav>

  <!-- 페이지 컨텐츠 -->
  {#if currentPage === "playlist"}
    <Playlist />
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
</style>
