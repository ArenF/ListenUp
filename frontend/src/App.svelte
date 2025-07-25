<script lang="ts">
  import { onMount } from "svelte";

  // 방 생성 버튼 클릭시 모달 표시
  let showCreateModal = false;
  // 방 참가 버튼 클릭시 모달 표시
  let showJoinModal = false;

  let roomName = '';
  let hostName = '';
  let maxPlayers = 8;
  let roomCode = '';
  let playerName = '';

  // 효과음 재생 함수
  function playSound(frequency: number, duration: number): void {
    const audioContext = new (window.AudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // 방 생성 모달 열기
  function openCreateModal():void {
    playSound(800, 0.1);
    showCreateModal = true;
  }

  // 방 참가 모달 열기
  function openJoinModal():void {
    playSound(600, 0.1);
    showJoinModal = true;
  }

  // 모달 닫기 함수
  function closeModal(modalType: 'create' | 'join'):void {
    playSound(400, 0.1);
    if (modalType === 'create') {
      showCreateModal = false;
    } else if(modalType === 'join') {
      showJoinModal = false;
    }
  }

  function confirmCreateRoom(): void {
    if (!roomName || !hostName) {
      alert('방 이름과 호스트 닉네임을 모두 입력해주세요!');
      return;
    }

    playSound(1000, 0.2);

    const generatedRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    alert(`방이 생성되었습니다!\n방 코드: ${generatedRoomCode}\n방 이름: ${roomName}\n호스트: ${hostName}`);

    showCreateModal = false;

    // 실제로는 여기서 게임 룸 화면으로 이동
    // goto(generatedRoomCode);
  }

  function confirmJoinRoom(): void {
    if (!roomCode || !playerName) {
      alert('방 코드와 닉네임을 모두 입력해주세요!');
      return;
    }

    if (roomCode.length !== 6) {
      alert('방 코드는 6자리여야 합니다!');
      return;
    }

    playSound(1000, 0.2);

    alert(`방에 참여합니다!\n방 코드: ${roomCode}\n닉네임: ${playerName}`);

    showJoinModal = false;

    // 실제로 여기서 게임 룸 화면으로 이동
    // goto(roomCode);
  }


  // 키보드 이벤트 처리

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      showCreateModal = false;
      showJoinModal = false;
    }
  }

  function handleRoomCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    roomCode = target.value.toUpperCase();
  }

  function handleModalClick(event:MouseEvent, modalType: 'create' | 'join'): void {
    if (event.target === event.currentTarget) {
      closeModal(modalType);
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  })

</script>

<svelte:head>
  <title>ListenUp - 음악 퀴즈 게임</title>
</svelte:head>

<div class="background-grid"></div>

<div class="container">
  <h1 class="logo">LISTEN UP</h1>
  <p class="subtitle">🎵 음악을 듣고 제목을 맞춰보세요! 🎵</p>

  <div class="wave-container">
    {#each Array(10) as _, i}
      <div class="wave-bar" style="animation-delay: {i * 0.1}s;"></div>
    {/each}
  </div>

  <div class="game-buttons">
    <button class="game-btn">방 만들기</button>
    <button class="game-btn join-btn">방 참여하기</button>
  </div>

  {#if showCreateModal}
    <div class="modal" on:click={(e) => handleModalClick(e, 'create')}>
      <h2>새 게임 방 만들기</h2>
      <div class="input-group">
        <label for="roomName">방 이름</label>
        <input 
          type="text"
          id="roomName"
          bind:value={roomName}
          placeholder="예: 90년대 K-POP 퀴즈"
          maxlength="30"
        >
      </div>
      <div class="input-group">
        <label for="hostName">호스트 닉네임</label>
        <input 
          type="text"
          id="hostName"
          bind:value={hostName}
          placeholder="닉네임을 입력하세요"
          maxlength="15"
        />
      </div>
      <div class="input-group">
        <label for="maxPlayers">최대 플레이어 수</label>
        <input 
          type="text"
          id="maxPlayers"
          bind:value={maxPlayers}
          min="2"
          max="8"
        />
      </div>
      <div class="modal-buttons">
        <button class="modal-btn primary" on:click={confirmCreateRoom}>방 만들기</button>
        <button class="modal-btn secondary" on:click={() => closeModal('create')}>취소</button>
      </div>
    </div>
  {/if}

  {#if showJoinModal}
    <div class="modal" on:click={(e) => handleModalClick(e, 'join')}>
      <h2>방 참여하기</h2>
      <div class="input-group">
        <label for="roomCode">방 코드</label>
        <input
          type="text"
          id="roomCode"
          value={roomCode}
          on:input={handleRoomCodeInput}
          placeholder="6자리 코드 입력 (예: ABC123)"
          maxlength="6"
          style="text-transform: uppercase;"
        >
      </div>
      <div class="input-group">
        <input 
          type="text"
          id="playerName"
          bind:value={playerName}
          placeholder="닉네임을 입력하세요"
          maxlength="15"
        >
      </div>
      <div class="modal-buttons">
        <button class="modal-btn primary" on:click={confirmJoinRoom}>참여하기</button>
        <button class="modal-btn secondary" on:click={() => closeModal('join')}>취소</button>
      </div>
    </div>
  {/if}
</div>


<style lang="css">
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

  /* 제목 스타일 및 애니메이션 */
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
      text-shadow: 0 0 30px rgba(255, 0, 110, 0.8), 0 0 60px rgba(255, 0, 110, 0.4);
    }
    100% {
      background-position: 100% 50%;
      text-shadow: 0 0 40px rgba(0, 245, 255, 1), 0 0 80px rgba(0, 245, 255, 0.6);
    }
  }

  /* 부제목 폰트 스타일 */
  .subtitle {
    font-family: 'Audiowide', monospace;
    font-size: 1.4rem;
    font-weight: 400;
    color: #00f5ff;
    margin-bottom: 50px;
    text-align: center;
    opacity: 0.9;
    text-shadow: 0 0 20px rgba(0, 245, 255, 0.5);
    letter-spacing: 0.05em;
  }

  /* 웨이브 애니메이션 스타일 구현 */
  .wave-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 50px;
    height: 80px;
  }

  .wave-bar {
    width: 4px;
    background: linear-gradient(to top, #ff006e, #00f5ff);
    margin: 0 2px;
    border-radius: 2px;
    animation: waveAnimation 1.5s ease-in-out infinite;
  }

  @keyframes waveAnimation {
    0%, 100% { height: 20px; }
    50% { height: 60px; }
  }

  /* 버튼 스타일 */
  /* 버튼들을 담는 컨테이너 */
  .game-buttons {
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
  }

  .game-btn {
    font-family: 'Audiowide', 'Bungee', cursive;
    background: linear-gradient(45deg, #8338ec, #ff006e);
    border: none;
    color: white;
    padding: 18px 45px;
    font-size: 1.4rem;
    font-weight: 400;
    border-radius: 12px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 0 25px rgba(131, 56, 236, 0.5);
    min-width: 280px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  .game-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100;
    height: 100;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  .game-btn:hover::before {
    left: 100%;
  }

  .game-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 30px rgba(131, 56, 236, 0.6);
  }

  .game-btn:active {
    transform: translateY(0);
  }

  .join-btn {
    background: linear-gradient(45deg, #00f5ff, #0077ff);
    box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
  }

  .join-btn:hover {
    box-shadow: 0 5px 30px rgba(0, 245, 255, 0.6);
  }

</style>