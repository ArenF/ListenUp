<script lang="ts">
  import { onMount } from 'svelte';
  import { io, type Socket } from 'socket.io-client';
  
  let socket: Socket;
  let connected = false;
  let message = '';
  let messages: string[] = [];
  
  onMount(() => {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
      connected = true;
      console.log('서버에 연결되었습니다.');
    });
    
    socket.on('disconnect', () => {
      connected = false;
      console.log('서버 연결이 끊어졌습니다.');
    });
    
    socket.on('message', (data: string) => {
      messages = [...messages, data];
    });
  });
  
  function sendMessage() {
    if (message.trim() && socket) {
      socket.emit('message', message);
      messages = [...messages, `나: ${message}`];
      message = '';
    }
  }
</script>

<main>
  <h1>실시간 채팅</h1>
  
  <div class="status">
    상태: {connected ? '연결됨' : '연결 끊어짐'}
  </div>
  
  <div class="chat-container">
    <div class="messages">
      {#each messages as msg}
        <div class="message">{msg}</div>
      {/each}
    </div>
    
    <div class="input-container">
      <input 
        bind:value={message}
        on:keydown={(e) => e.key === 'Enter' && sendMessage()}
        placeholder="메시지를 입력하세요..."
      />
      <button on:click={sendMessage}>전송</button>
    </div>
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .status {
    margin-bottom: 20px;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  .chat-container {
    border: 1px solid #ddd;
    border-radius: 8px;
    height: 400px;
    display: flex;
    flex-direction: column;
  }
  
  .messages {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    background: #f9f9f9;
  }
  
  .message {
    margin-bottom: 10px;
    padding: 8px;
    background: white;
    border-radius: 4px;
  }
  
  .input-container {
    display: flex;
    padding: 10px;
    border-top: 1px solid #ddd;
  }
  
  input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  button {
    padding: 10px 20px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>