<script lang="ts">
  import MainScreen from "./components/MainScreen.svelte";
  import { gameState } from "./stores/gameStore";

  $: currentScreen = $gameState.currentScreen;
</script>

{#if currentScreen === 'main'}
  <MainScreen/>
{/if}

<style lang="css">

</style>