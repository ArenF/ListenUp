<script lang="ts">
  import HintsContainer from '../../components/common/HintsContainer.svelte';
  import type { HintItem } from '../../stores/gameStore';

  interface Props {
    preparedTrack: any;
    currentTrack: any;
    isMuted: boolean;
    volume: number;
    hints: HintItem[];
    onVolumeChange: (e: Event) => void;
  }

  let { preparedTrack, currentTrack, isMuted, volume, hints, onVolumeChange }: Props =
    $props();
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
        value={volume}
        oninput={onVolumeChange}
        class="volume-slider"
      />
    </div>
  {/if}

  <!-- 힌트 박스 (음량 슬라이더 아래) -->
  <HintsContainer {hints} />
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
    background-color: #f5f5f5;
    border-radius: 8px;
    text-align: center;
  }

  .volume-control label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #555;
    font-size: 1rem;
  }

  .volume-slider {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(to right, #ddd 0%, #ff3e00 100%);
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
    background: #ff3e00;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }

  .volume-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px rgba(255, 62, 0, 0.4);
  }

  .volume-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ff3e00;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
  }

  .volume-slider::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 3px 6px rgba(255, 62, 0, 0.4);
  }
</style>
