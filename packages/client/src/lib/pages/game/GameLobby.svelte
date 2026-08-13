<script lang="ts">
  import type { Playlist } from "../../types";

  interface Props {
    connected: boolean;
    nickname: string;
    roomCode: string;
    selectedPlaylistId: string;
    playlists: Playlist[];
    onCreateRoom: () => void;
    onJoinRoom: () => void;
  }

  let {
    connected,
    nickname = $bindable(),
    roomCode = $bindable(),
    selectedPlaylistId = $bindable(),
    playlists,
    onCreateRoom,
    onJoinRoom,
  }: Props = $props();
</script>

<div class="form-container">
  <div class="input-group">
    <label for="nickname">닉네임</label>
    <input
      id="nickname"
      type="text"
      bind:value={nickname}
      placeholder="닉네임 입력"
      disabled={!connected}
    />
  </div>

  <div class="section">
    <h2>방 생성</h2>
    <div class="input-group">
      <label for="playlist">플레이리스트 선택</label>
      <select
        id="playlist"
        bind:value={selectedPlaylistId}
        disabled={!connected}
      >
        {#each playlists as playlist}
          <option value={playlist.id}>
            {playlist.name} ({playlist.tracks?.length || 0} 트랙)
          </option>
        {/each}
      </select>
    </div>
    <button onclick={onCreateRoom} disabled={!connected || !nickname.trim()}>
      🏠 새 방 만들기
    </button>
  </div>

  <div class="divider">또는</div>

  <div class="section">
    <h2>방 참가</h2>
    <div class="input-group">
      <label for="roomcode">방 코드</label>
      <input
        id="roomcode"
        type="text"
        bind:value={roomCode}
        placeholder="6자리 방 코드"
        maxlength="6"
        disabled={!connected}
      />
    </div>
    <button
      onclick={onJoinRoom}
      disabled={!connected || !nickname.trim() || !roomCode.trim()}
    >
      🚪 방 참가하기
    </button>
  </div>
</div>

<style>
  .form-container {
    background-color: #f9f9f9;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .section {
    margin: 1.5rem 0;
  }

  .input-group {
    margin-bottom: 1rem;
    text-align: left;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #333;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  input,
  select {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
    transition: border-color 0.3s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: #ff3e00;
  }

  input:disabled,
  select:disabled {
    background-color: #f0f0f0;
    cursor: not-allowed;
  }

  select {
    cursor: pointer;
  }

  button {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    background-color: #ff3e00;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
  }

  button:hover:not(:disabled) {
    background-color: #e63900;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
  }

  button:active:not(:disabled) {
    transform: translateY(0);
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }

  .divider {
    margin: 1.5rem 0;
    color: #999;
    font-weight: 500;
  }
</style>
