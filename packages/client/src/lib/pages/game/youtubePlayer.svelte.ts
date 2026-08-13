import { untrack } from "svelte";
import { gameStore } from "./gameStore.svelte";
import { notifyPlayerReady } from "./gameActions";

/**
 * YouTube IFrame 플레이어 생명주기
 *
 * 라운드마다 서버가 내려준 트랙으로 플레이어를 다시 만든다.
 * 자동재생 정책 때문에 처음에는 음소거 상태로 만든 뒤,
 * 라운드가 실제로 시작될 때 음소거를 해제한다.
 */

const PLAYER_ELEMENT_ID = "youtube-player";

const PLAYER_STATE_NAMES: Record<number, string> = {
  "-1": "UNSTARTED",
  "0": "ENDED",
  "1": "PLAYING",
  "2": "PAUSED",
  "3": "BUFFERING",
  "5": "CUED",
};

/** IFrame API 스크립트를 삽입하고 로드가 끝나면 playerReady를 올린다 */
export function loadIframeApi() {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";

  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    console.log("✅ YouTube Player API 로드 완료!");
    gameStore.playerReady = true;
  };
}

/** 디버깅용 플레이어 상태 덤프 */
export function logPlayerState(label: string, player: YT.Player) {
  const state = player.getPlayerState();
  console.log(`🔍 [${label}] 플레이어 상태:`);
  console.log("  - isMuted:", player.isMuted());
  console.log("  - Volume:", player.getVolume());
  console.log("  - PlayerState:", state, PLAYER_STATE_NAMES[state] ?? "UNKNOWN");
}

/**
 * 플레이어 생성과 음량 동기화 이펙트를 등록한다.
 *
 * 룬 이펙트를 사용하므로 컴포넌트 초기화 중에 호출해야 한다.
 */
export function setupYouTubePlayer() {
  // 같은 트랙으로 플레이어를 다시 만들지 않도록 마지막 로드 트랙을 기억한다
  let lastLoadedTrackId: string | null = null;

  $effect(() => {
    const { playerReady, preparedTrack, currentRoom } = gameStore;
    if (!playerReady || !preparedTrack || !currentRoom) return;

    if (lastLoadedTrackId === preparedTrack.id) return;

    const YT = window.YT;
    if (!YT?.Player) {
      console.error("❌ YouTube Player API가 로드되지 않았습니다");
      return;
    }

    destroyPlayer();

    console.log("🎬 YouTube Player 생성 중...", preparedTrack.id);
    lastLoadedTrackId = preparedTrack.id;

    gameStore.player = new YT.Player(PLAYER_ELEMENT_ID, {
      height: "300",
      width: "100%",
      videoId: preparedTrack.id,
      playerVars: {
        autoplay: 1,
        start: preparedTrack.startSeconds,
        end: preparedTrack.endSeconds,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        disablekb: 1,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          console.log("✅ YouTube Player 준비 완료!");
          event.target.mute();
          gameStore.isMuted = true;

          // 준비 직후 재생되지 않도록 잠시 뒤 정지시키고 서버에 알린다
          setTimeout(() => {
            event.target.pauseVideo();
            notifyPlayerReady();
          }, 500);
        },
        onError: (event: YT.OnErrorEvent) => {
          console.error("❌ YouTube Player 에러:", event.data);
          gameStore.statusMessage = "❌ 영상 재생 오류";
          gameStore.isLoadingTrack = false;
        },
      },
    });
  });

  // 슬라이더로 바꾼 음량을 플레이어에 반영한다
  $effect(() => {
    const volume = gameStore.volume;
    const player = untrack(() => gameStore.player);

    if (typeof player?.setVolume === "function") {
      player.setVolume(volume);
      console.log(`🔊 음량 변경: ${volume}%`);
    }
  });
}

/**
 * 현재 플레이어를 파괴한다.
 *
 * gameStore.player를 untrack으로 읽어, 플레이어 교체가 호출한 쪽의
 * 이펙트를 다시 트리거하지 않도록 한다.
 */
export function destroyPlayer() {
  const player = untrack(() => gameStore.player);
  if (typeof player?.destroy !== "function") return;

  console.log("🗑️ 기존 플레이어 파괴");
  try {
    player.destroy();
  } catch (error) {
    console.warn("플레이어 파괴 중 에러 (무시):", error);
  }
}
