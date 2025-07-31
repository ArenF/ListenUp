<script lang='ts'>

</script>

<body>
  <h1 class="title">Listen Up</h1>
  <div class="subtitle-container">
    <p class="subtitle">실시간 음악 퀴즈 게임</p>
    <p class="content">
      친구들과 함께 음악을 듣고 제목을 맞춰보세요!
    </p>
    <p class="content">
      최대 8명이 실시간으로 경쟁하는 스피드 음악 퀴즈 게임
    </p>
  </div>

  <div class="buttons-container">
    <button class="create-button">새 방 만들기</button>
    <button class="join-button">방 참여하기</button>
  </div>

  <div class="iconcard-container">
    <div class="iconcard">
      <img src="" alt="">
      <p class="content len-sm">Spotify 기반 최신 음악</p>
    </div>
    <div class="iconcard">
      <img src="" alt="">
      <p class="content len-sm">실시간 경쟁</p>
    </div>
    <div class="iconcard">
      <img src="" alt="">
      <p class="content len-sm">채팅과 정답을 동시에!</p>
    </div>
    <div class="iconcard">
      <img src="" alt="">
      <p class="content len-sm">어디에서나 모든 기기로 플레이!</p>
    </div>
  </div>

  <div class="modal-container">
    <div class="create-modal" style="visibility: hidden;"></div>
  </div>

  <div class="modal-container">
    <div class="join-modal" style="visibility: hidden;"></div>
  </div>
</body>

<style>
  /**

  배경 그라데이션 애니메이션 제작 코드

  */

  :root {
    --bg-color-gradient-1: #0d1421;
    --bg-color-gradient-2: #1e2a3a;
    --bg-color-gradient-3: #0a0e1a;
    --bg-color-gradient-4: #1a1d29;

    --theme-main-primary: #8A2BE2;
    --theme-main-secondary: #9D4EDD;
    --theme-sub-primary: #FFFF00;
    --theme-sub-secondary: #F1C40F;
  }

  body {
    position: absolute;
    left: 0;
    top: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    box-sizing: border-box;

    background: linear-gradient(
      -45deg,
      var(--bg-color-gradient-1),
      var(--bg-color-gradient-2),
      var(--bg-color-gradient-3),
      var(--bg-color-gradient-4)
    );
    background-size: 400% 400%;
    animation: diagonalAnim 18s ease-in-out infinite;
  }

  @keyframes diagonalAnim {
    0% { background-position: 0% 0%; }
    25% { background-position: 100%, 0%; }
    50% { background-position: 100% 100%; }
    75% { background-position: 0 100%; }
    100% { background-position: 100% 100%; }
  }

  /* 타이틀 및 글자 요소 */

  .title {
    font-size: 4rem;
    color: var(--theme-main-primary);
    text-shadow: 2px 2px 10px var(--theme-main-secondary); 
  }

  .subtitle-container {
    padding: 1.5em;
    background-color: darkgray;
    opacity: 0.5;
  }

  .subtitle {
    font-size: 1.5em;
  }

  .subtitle-container > .content {
    margin: 0;
    max-width: 35em;
  }

  .content {  
    font-family: "Orbitron", monospace;
    font-size: 1.2em;
  }

  /* 
    모달 관련 CSS
  */

  .modal-container {

  }

  .create-modal {

  }

  .join-modal {

  }
</style>