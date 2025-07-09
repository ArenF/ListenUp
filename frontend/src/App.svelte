<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import type { Socket } from 'socket.io-client';
  
  interface Message {
    id: string;
    text: string;
    timestamp: string;
    socketId: string;
  }

  interface User {
    id: number;
    name: string;
    email: string;
  }

  let socket: Socket;
  let messages: Message[] = [];
  let currentMessage = '';
  let isConnected = false;
  let socketId = '';
  let users: User[] = [];
  let isLoading = false;

  // 백엔드 API 호출
  async function fetchUsers() {
    isLoading = true;
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        users = await response.json();
      }
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error);
    } finally {
      isLoading = false;
    }
  }

  // 메시지 전송
  function sendMessage() {
    if (currentMessage.trim() && socket) {
      socket.emit('message', {
        id: Date.now().toString(),
        text: currentMessage.trim()
      });
      currentMessage = '';
    }
  }

  // Enter 키로 메시지 전송
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  onMount(() => {
    // Socket.IO 연결 (개발환경과 프로덕션 환경 모두 지원)
    const socketUrl = import.meta.env.DEV 
      ? 'http://localhost:3000'
      : window.location.origin;
    
    socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    // 연결 이벤트
    socket.on('connect', () => {
      isConnected = true;
      socketId = socket.id;
      console.log('Socket.IO 연결됨:', socketId);
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      isConnected = false;
      console.log('Socket.IO 연결 해제됨');
    });

    // 환영 메시지
    socket.on('welcome', (data) => {
      console.log('환영 메시지:', data);
    });

    // 메시지 수신
    socket.on('message', (data: Message) => {
      messages = [...messages, data];
    });

    // 초기 사용자 목록 로드
    fetchUsers();
  });

  onDestroy(() => {
    if (socket) {
      socket.disconnect();
    }
  });
</script>

<main>
  <div class="container">
    <header>
      <h1>🚀 Svelte + Express + Socket.IO</h1>
      <div class="status">
        <span class="status-indicator" class:connected={isConnected}></span>
        <span>연결 상태: {isConnected ? '연결됨' : '연결 해제됨'}</span>
        {#if socketId}
          <span class="socket-id">Socket ID: {socketId}</span>
        {/if}
      </div>
    </header>

    <div class="content">
      <!-- 사용자 목록 섹션 -->
      <section class="users-section">
        <h2>👥 사용자 목록</h2>
        {#if isLoading}
          <p>로딩 중...</p>
        {:else if users.length > 0}
          <div class="users-grid">
            {#each users as user}
              <div class="user-card">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
            {/each}
          </div>
        {:else}
          <p>사용자를 불러올 수 없습니다.</p>
        {/if}
        <button on:click={fetchUsers} disabled={isLoading}>
          새로고침
        </button>
      </section>

      <!-- 실시간 채팅 섹션 -->
      <section class="chat-section">
        <h2>💬 실시간 채팅</h2>
        
        <div class="messages-container">
          {#each messages as message}
            <div class="message" class:own={message.socketId === socketId}>
              <div class="message-content">
                <p>{message.text}</p>
                <small>
                  {new Date(message.timestamp).toLocaleTimeString()}
                  {#if message.socketId !== socketId}
                    - {message.socketId}
                  {/if}
                </small>
              </div>
            </div>
          {/each}
        </div>

        <div class="message-input">
          <input
            bind:value={currentMessage}
            on:keypress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            disabled={!isConnected}
          />
          <button on:click={sendMessage} disabled={!isConnected || !currentMessage.trim()}>
            전송
          </button>
        </div>
      </section>
    </div>
  </div>
</main>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  header {
    text-align: center;
    margin-bottom: 30px;
  }

  h1 {
    color: #333;
    margin-bottom: 10px;
  }

  .status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
    color: #666;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #dc3545;
  }

  .status-indicator.connected {
    background-color: #28a745;
  }

  .socket-id {
    font-family: monospace;
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }

  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }
  }

  section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  h2 {
    margin-top: 0;
    color: #333;
  }

  .users-grid {
    display: grid;
    gap: 10px;
    margin-bottom: 15px;
  }

  .user-card {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-card strong {
    color: #333;
  }

  .user-card span {
    color: #666;
    font-size: 14px;
  }

  .messages-container {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 15px;
    background: #f8f9fa;
  }

  .message {
    margin-bottom: 10px;
    display: flex;
    justify-content: flex-start;
  }

  .message.own {
    justify-content: flex-end;
  }

  .message-content {
    max-width: 70%;
    padding: 8px 12px;
    border-radius: 12px;
    background: #e9ecef;
  }

  .message.own .message-content {
    background: #007bff;
    color: white;
  }

  .message-content p {
    margin: 0 0 4px 0;
    word-wrap: break-word;
  }

  .message-content small {
    opacity: 0.7;
    font-size: 12px;
  }

  .message-input {
    display: flex;
    gap: 10px;
  }

  .message-input input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 14px;
  }

  .message-input input:focus {
    outline: none;
    border-color: #007bff;
  }

  button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  button:hover:not(:disabled) {
    background: #0056b3;
  }

  button:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
</style>