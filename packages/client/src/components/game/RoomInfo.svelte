<script lang="ts">
  import type { Room } from "../../types/index";

  interface Props {
    room: Room;
    playerCount: number;
  }

  let { room, playerCount }: Props = $props();
</script>

<h2>🏠 방 정보</h2>
<div class="info-item">
  <strong>방 코드:</strong>
  <span class="room-code">{room.code}</span>
</div>
<div class="info-item">
  <strong>방장:</strong>
  {room.players.find((p) => p.isHost)?.nickname}
</div>
<div class="info-item">
  <strong>플레이어:</strong>
  {playerCount} / {room.settings.maxPlayers}명
</div>
<div class="info-item">
  <strong>라운드 시간:</strong>
  {room.settings.roundInterval}초
</div>

<style>
  h2 {
    font-size: var(--font-size-2xl);
    margin-bottom: var(--space-4);
    color: var(--text-primary);
  }

  .info-item {
    margin: var(--space-3) 0;
    font-size: var(--font-size-lg);
  }

  .room-code {
    font-family: "Courier New", monospace;
    font-size: var(--font-size-2xl);
    font-weight: bold;
    color: var(--accent);
    background-color: var(--bg-surface);
    padding: var(--space-1) var(--space-3);
    border-radius: 6px;
    border: 2px solid var(--accent);
  }
</style>
