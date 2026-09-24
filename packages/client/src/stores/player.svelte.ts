import { tick } from "svelte";
import type { HiddenTrack } from "../types/index";

/**
 * YouTube IFrame 플레이어
 *
 * 서버와는 직접 통신하지 않는다. 준비 완료·에러는 load()에 넘긴 콜백으로 알리고,
 * 언제 재생·정지할지는 `game` store가 정한다.
 *
 * 자동재생 정책 때문에 처음에는 음소거 상태로 만든 뒤,
 * 라운드가 실제로 시작될 때 play()로 음소거를 해제한다.
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

interface LoadCallbacks {
  /** 플레이어가 준비되고 일시정지된 직후 */
  onReady: () => void;
  onError: () => void;
}

class PlayerStore {
  isMuted = $state(true);
  #volume = $state(50);

  /** 반응형일 필요가 없어 일반 필드로 둔다 (이펙트가 이 값을 추적하지 않게) */
  #player: YT.Player | null = null;
  #apiRequested = false;
  #apiReady = false;
  /** load()마다 올라간다. DOM 반영을 기다리는 사이 destroy()됐거나 새 load()가 오면 만들지 않는다 */
  #loadId = 0;
  /** API 로드 전에 요청된 트랙. 로드가 끝나면 이어서 만든다 */
  #pending: { track: HiddenTrack; callbacks: LoadCallbacks } | null = null;

  /** 슬라이더로 바꾼 음량을 바로 플레이어에 반영한다 */
  get volume() {
    return this.#volume;
  }

  set volume(value: number) {
    this.#volume = value;
    if (typeof this.#player?.setVolume === "function") {
      this.#player.setVolume(value);
      console.log(`🔊 음량 변경: ${value}%`);
    }
  }

  /** IFrame API 스크립트를 삽입한다 (한 번만) */
  loadApi() {
    if (this.#apiRequested) return;
    this.#apiRequested = true;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";

    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log("✅ YouTube Player API 로드 완료!");
      this.#apiReady = true;

      if (this.#pending) {
        const { track, callbacks } = this.#pending;
        this.#pending = null;
        this.load(track, callbacks);
      }
    };
  }

  /** 트랙으로 플레이어를 새로 만든다 (라운드마다 호출) */
  async load(track: HiddenTrack, callbacks: LoadCallbacks) {
    if (!this.#apiReady) {
      this.#pending = { track, callbacks };
      return;
    }

    const YT = window.YT;
    if (!YT?.Player) {
      console.error("❌ YouTube Player API가 로드되지 않았습니다");
      return;
    }

    this.destroy();
    const loadId = this.#loadId;

    // 플레이어가 들어갈 요소는 트랙이 정해진 뒤에 그려지므로 DOM 반영을 기다린다
    await tick();
    if (loadId !== this.#loadId) return;

    console.log("🎬 YouTube Player 생성 중...", track.id);
    this.#player = new YT.Player(PLAYER_ELEMENT_ID, {
      height: "300",
      width: "100%",
      videoId: track.id,
      playerVars: {
        autoplay: 1,
        start: track.startSeconds,
        end: track.endSeconds,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        disablekb: 1,
      },
      events: {
        onReady: (event: YT.PlayerEvent) => {
          console.log("✅ YouTube Player 준비 완료!");
          event.target.mute();
          this.isMuted = true;

          // 준비 직후 재생되지 않도록 잠시 뒤 정지시키고 알린다
          setTimeout(() => {
            event.target.pauseVideo();
            callbacks.onReady();
          }, 500);
        },
        onError: (event: YT.OnErrorEvent) => {
          console.error("❌ YouTube Player 에러:", event.data);
          callbacks.onError();
        },
      },
    });
  }

  /** 음소거를 풀고 재생을 시작한다 */
  play() {
    const player = this.#player;
    if (!player) return;

    logPlayerState("BEFORE", player);
    console.log("🎬 [ACTION] 음소거 해제 & 재생 시작...");

    player.unMute();
    this.isMuted = false;
    player.setVolume(this.#volume);
    player.playVideo();

    setTimeout(() => logPlayerState("AFTER", player), 200);
  }

  pause() {
    this.#player?.pauseVideo();
  }

  /** 현재 플레이어를 파괴하고, 로드 대기 중인 트랙도 버린다 */
  destroy() {
    this.#loadId++;
    this.#pending = null;

    const player = this.#player;
    this.#player = null;
    if (typeof player?.destroy !== "function") return;

    console.log("🗑️ 기존 플레이어 파괴");
    try {
      player.destroy();
    } catch (error) {
      console.warn("플레이어 파괴 중 에러 (무시):", error);
    }
  }
}

/** 디버깅용 플레이어 상태 덤프 */
function logPlayerState(label: string, player: YT.Player) {
  const state = player.getPlayerState();
  console.log(`🔍 [${label}] 플레이어 상태:`);
  console.log("  - isMuted:", player.isMuted());
  console.log("  - Volume:", player.getVolume());
  console.log("  - PlayerState:", state, PLAYER_STATE_NAMES[state] ?? "UNKNOWN");
}

export const playerStore = new PlayerStore();
