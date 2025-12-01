<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    track: {
      id: string;
      name: string;
      artist: string;
      startSeconds: number;
      endSeconds: number;
    };
  }

  let { track }: Props = $props();

  let player: any = null;
  let playerReady = $state(false);

  onMount(() => {
    // YouTube Player API가 이미 로드되어 있는지 확인
    const YT = (window as any).YT;
    if (!YT || !YT.Player) {
      console.error("❌ YouTube Player API가 로드되지 않았습니다");
      return;
    }

    // DOM 요소 확인
    const playerElement = document.getElementById("answer-player");
    if (!playerElement) {
      console.error("❌ Answer Player DOM 요소를 찾을 수 없습니다");
      return;
    }

    console.log("🎬 정답 영상 플레이어 생성 중...", track.id);

    // 정답 영상 플레이어 생성
    player = new YT.Player("answer-player", {
      height: "315",
      width: "100%",
      videoId: track.id,
      playerVars: {
        autoplay: 1,
        start: track.startSeconds,
        end: track.endSeconds,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event: any) => {
          console.log("✅ 정답 영상 플레이어 준비 완료!");
          playerReady = true;

          // 음소거 해제 후 재생
          event.target.unMute();
          event.target.setVolume(70); // 기본 음량 70%
          event.target.playVideo();

          console.log("🔊 정답 영상 재생 시작 (음소거 해제)");
        },
        onError: (event: any) => {
          const errorCode = event.data;
          console.error("❌ 정답 영상 플레이어 에러:", errorCode);

          let errorMessage = "❌ 정답 영상 재생 오류";
          switch (errorCode) {
            case 2:
              errorMessage = "❌ 잘못된 비디오 설정";
              break;
            case 5:
              errorMessage = "❌ 비디오 재생 불가 (HTML5 오류)";
              break;
            case 100:
              errorMessage = "❌ 비디오를 찾을 수 없음";
              break;
            case 101:
            case 150:
              errorMessage = "❌ 이 비디오는 임베드 재생이 제한되어 있습니다";
              break;
            default:
              errorMessage = `❌ 영상 재생 오류 (코드: ${errorCode})`;
          }

          console.error(errorMessage);
        },
        onStateChange: (event: any) => {
          // 영상 상태 변경 로그
          const states: Record<number, string> = {
            "-1": "UNSTARTED",
            "0": "ENDED",
            "1": "PLAYING",
            "2": "PAUSED",
            "3": "BUFFERING",
            "5": "CUED",
          };
          console.log(`🎬 정답 영상 상태: ${states[event.data] || "UNKNOWN"}`);
        },
      },
    });
  });

  onDestroy(() => {
    // 컴포넌트 파괴 시 플레이어 정리
    if (player && typeof player.destroy === "function") {
      console.log("🗑️ 정답 영상 플레이어 파괴");
      try {
        player.destroy();
      } catch (e) {
        console.warn("플레이어 파괴 중 에러 (무시):", e);
      }
    }
  });
</script>

<div class="answer-player-container">
  <div class="video-wrapper">
    <div id="answer-player"></div>
  </div>

  {#if !playerReady}
    <div class="loading-overlay">
      <p>⏳ 정답 영상 로딩 중...</p>
    </div>
  {/if}
</div>

<style>
  .answer-player-container {
    position: relative;
    width: 100%;
    margin: 1.5rem 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    background-color: #000;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
  }

  .video-wrapper :global(#answer-player) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .loading-overlay p {
    margin: 0;
  }
</style>
