<script lang="ts">
  import type { HiddenTrack } from "../../types";

  interface Props {
    preparedTrack: HiddenTrack | null;
    currentTrack: HiddenTrack | null;
    isMuted: boolean;
    volume: number;
  }

  let {
    preparedTrack,
    currentTrack,
    isMuted,
    volume = $bindable(),
  }: Props = $props();
</script>

{#if preparedTrack || currentTrack}
  <!-- YouTube 플레이어 (화면 숨김) -->
  <div class="youtube-player-hidden">
    <div id="youtube-player"></div>
  </div>

  {#if !isMuted}
    <!-- 음량 조절 슬라이더 -->
    <div class="volume-control">
      <label for="volume-slider"> 🔊 음량: {volume}% </label>
      <input
        id="volume-slider"
        type="range"
        min="0"
        max="100"
        bind:value={volume}
        class="volume-slider"
      />
    </div>
  {/if}
{/if}

<style>
  /* YouTube 플레이어 숨김 */
  .youtube-player-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    opacity: 0;
    pointer-events: none;
  }

  /* 음량 조절 */
  .volume-control {
    margin: 1.5rem 0;
    padding: 1rem;
    background-color: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    text-align: center;
  }

  .volume-control label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 1rem;
  }

  .volume-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, var(--border) 0%, var(--accent) 100%);
    outline: none;
    -webkit-appearance: none;
    appearance: none;
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 2px 4px color-mix(in srgb, var(--text-primary) 25%, transparent);
    transition: all 0.2s;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px color-mix(in srgb, var(--accent) 45%, transparent);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px color-mix(in srgb, var(--text-primary) 25%, transparent);
    transition: all 0.2s;
  }

  .volume-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px color-mix(in srgb, var(--accent) 45%, transparent);
  }
</style>
