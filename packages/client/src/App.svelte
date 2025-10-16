<script lang="ts">
  let message = "ListenUp! Client is running 🎵";
</script>

<main>
  <h1>{message}</h1>
  <p>Welcome to ListenUp!</p>
  <p class="info">Frontend: Svelte + Typescript + Socket.IO</p>
</main>

<style>
  main {
    text-align: center;
    padding: 2rem;
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.2rem;
    color: #333;
  }

  .info {
    margin-top: 2rem;
    padding: 1rem;
    background-color: #f0f0f0;
    border-radius: 8px;
    font-size: 1rem;
  }
</style>