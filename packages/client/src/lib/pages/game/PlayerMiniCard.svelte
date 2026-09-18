<script lang="ts">
  import type { Player } from "../../types";

  interface Props {
    player: Player;
    /** 플레이어 현재 상태 */
    status: "typing" | "correct" | "wrong" | "listening";
  }
  let { player, status }: Props = $props();

  const STATUS_LABEL: Record<Props["status"], string> = {
    typing: "✏️ 작성 중…",
    correct: "✅ 정답!",
    wrong: "❌ 오답 시도",
    listening: "🎧 듣는 중",
  };
</script>

<div
  class="pcard"
  class:host={player.isHost}
  class:correct={status === "correct"}
>
  {#if player.isHost}
    <span class="crown">👑</span>
  {/if}
  <div class="av">{player.avatar}</div>
  <div class="info">
    <div class="nm">{player.nickname}</div>
    <div class="st">{STATUS_LABEL[status]}</div>
  </div>
  {#if player.score !== undefined}
    <span class="sc">{player.score.toLocaleString()}</span>
  {/if}
</div>

<style>
  .pcard {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--screen-glass, rgba(12, 16, 32, 0.72));
    backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 10px 12px;
    position: relative;
    transition: border-color 0.18s;
  }
  .pcard.host {
    border-color: rgba(167, 139, 250, 0.5);
    background: linear-gradient(135deg, rgba(167, 139, 250, 0.14), var(--screen-glass));
  }
  .pcard.correct {
    border-color: rgba(74, 222, 128, 0.45);
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.1), var(--screen-glass));
  }
  .av {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #5b4a9e, #3d3168);
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .nm {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .st {
    font-size: 10.5px;
    color: var(--text-secondary);
    margin-top: 1px;
  }
  .sc {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-success);
  }
  .crown {
    position: absolute;
    top: -7px;
    left: 12px;
    font-size: 13px;
  }
</style>