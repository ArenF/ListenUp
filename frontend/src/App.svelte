<script lang="ts">

</script>

<svelte:head>
  <title>ListenUp - 음악 퀴즈 게임</title>
</svelte:head>

<div class="background-grid"></div>

<div class="container">
  <h1 class="logo">LISTEN UP</h1>
  <p class="subtitle">🎵 음악을 듣고 제목을 맞춰보세요! 🎵</p>
</div>

<div class="game-buttons">
  <button class="game-btn">방 만들기</button>
  <button class="game-btn join-btn">방 참여하기</button>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Audiowide:wght@400&family=Bungee:wght@400&display=swap');

  :global(body) {
    font-family: 'Audiowide', 'Bungee', 'Orbitron', monospace;
    background: linear-gradient(
      -45deg,
      #0a0a0a 0%,
      #1a0a2e 15%,
      #2d1b69 25%,
      #1e3a8a 40%,
      #312e81 55%,
      #4a2c7a 70%,
      #1a0a2e 85%,
      #0a0a0a 100%
    );
    background-size: 400% 400%;
    animation: diagonalGradient 18s ease-in-out infinite;
    min-height: 100vh;
    overflow-x: hidden;
    color: #fff;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @keyframes diagonalGradient {
    0% { background-position: 0% 0%;}
    25% { background-position: 100% 0%;}
    50% { background-position: 100% 100%; }
    75% { background-position: 0% 100%; }
    100% { background-position: 0% 0%; }
  }

  .background-grid {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background:
      linear-gradient(rgba(0,255,255,0.4) 2px, transparent 2px),
      linear-gradient(90deg, rgba(255,0,110,0.3) 2px, transparent 2px),
      linear-gradient(rgba(131,56,236,0.2) 1px, transparent 1px),
      linear-gradient(90deg, rgba(131, 56, 236, 0.2) 1px, transparent 1px);
    background-size: 80px 80px, 80px 80px, 20px 20px, 20px 20px;
    z-index: -1;
    opacity: 0.7;
  }

  /* 화면 전체 구성 박스 */
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
  }

  .logo {
    font-family: 'Bungee', 'Audiowide', cursive;
    font-size: 5.5rem;
    font-weight: 400; 
    text-align: center;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #ff006e, #00f5ff, #8338ec, #ff006e);
    background-size: 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: neonGlow 3s ease-in-out infinite alternate;
    text-shadow: 0 0 30px rgba(255, 0, 110, 0.8);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  @keyframes neonGlow {
    0% {
      background-position: 0% 50%;
      text-shadow: 0 0 30px rgba(255, 0, 110, 0.8), 0 0 60px rgba(255, 0, 110, 0.4)'
    }
    100% {
      background-position: 100% 50%;
      text-shadow: 0 0 40px rgba(0, 245, 255, 1), 0 0 80px rgba(0, 245, 255, 0.6);
    }
  }
</style>