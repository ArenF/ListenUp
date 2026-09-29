<script lang="ts">
  import { onMount } from "svelte";
  import NavBar, { type Page } from "./components/common/NavBar.svelte";
  import GamePage from "./pages/GamePage.svelte";
  import PlaylistPage from "./pages/PlaylistPage.svelte";
  import AccountPage from "./pages/AccountPage.svelte";
  import { authStore } from "./stores/auth.svelte";

  // 페이지 라우팅
  let currentPage = $state<Page>("lobby");

  function navigate(page: Page) {
    currentPage = page;
  }

  // 새로고침 후에도 로그인 세션을 이어간다
  onMount(() => {
    authStore.restore();
  });
</script>

<main>
  <NavBar {currentPage} onNavigate={navigate} />

  {#if currentPage === "lobby" || currentPage === "create"}
    <GamePage view={currentPage} onNavigate={navigate} />
  {:else if currentPage === "playlist"}
    <PlaylistPage onLogin={() => navigate("account")} />
  {:else}
    <AccountPage />
  {/if}
</main>

<style>
  main {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
  }
</style>
