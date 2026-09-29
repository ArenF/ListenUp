<script lang="ts">
  import { onMount } from "svelte";
  import { connect, disconnect } from "../stores/socket.svelte";
  import { loadPlaylists, roomStore } from "../stores/room.svelte";
  import { playerStore } from "../stores/player.svelte";
  import { authStore } from "../stores/auth.svelte";
  import StatusBar from "../components/common/StatusBar.svelte";
  import Lobby from "../components/game/Lobby.svelte";
  import CreateRoom from "../components/game/CreateRoom.svelte";
  import JoinRoomModal from "../components/game/JoinRoomModal.svelte";
  import GameRoom from "../components/game/GameRoom.svelte";

  interface Props {
    /** 방에 들어가 있지 않을 때 보여줄 화면 */
    view: "lobby" | "create";
    /** 방 참가 모달 표시 여부 (App의 네비 "방 참가"가 토글) */
    showJoinModal: boolean;
    /** 로비 ↔ 방 생성 페이지 전환 요청 (App의 네비 상태를 바꾼다) */
    onNavigate: (view: "lobby" | "create") => void;
  }

  let {
    view,
    showJoinModal = $bindable(),
    onNavigate,
  }: Props = $props();

  // 게임 화면에 있는 동안만 서버에 연결한다
  onMount(() => {
    loadPlaylists();
    connect();
    playerStore.loadApi();

    return () => {
      disconnect();
      playerStore.destroy();
    };
  });

  // 로그인 상태면 게임 닉네임을 계정 닉네임으로 고정한다
  $effect(() => {
    if (authStore.user) {
      roomStore.nickname = authStore.user.nickname;
    }
  });

  // 방에 입장하면(생성·참가 성공) 참가 모달은 닫는다
  $effect(() => {
    if (roomStore.current) {
      showJoinModal = false;
    }
  });
</script>

<div class="game-container">
  <StatusBar />

  {#if roomStore.current}
    <GameRoom />
  {:else if view === "create"}
    <CreateRoom onCancel={() => onNavigate("lobby")} />
  {:else}
    <Lobby
      onCreate={() => onNavigate("create")}
      onJoinByCode={() => (showJoinModal = true)}
    />
  {/if}
</div>

{#if showJoinModal && !roomStore.current}
  <JoinRoomModal onClose={() => (showJoinModal = false)} />
{/if}

<style>
  .game-container {
    padding: var(--space-8);
    max-width: 820px;
    margin: 0 auto;
  }
</style>
