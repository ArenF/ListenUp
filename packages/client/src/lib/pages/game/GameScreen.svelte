<script lang="ts">
  import Visualizer from "./Visualizer.svelte";
  import { gameStore } from "./gameStore.svelte";

  interface Props {
    /** 현재 트랙 제목 (미공개 시 "???") */
    trackTitle?: string;
    /** 아티스트 (미공개 시 안내문) */
    trackArtist?: string;
    /** GamePlayer(YT IFrame) 등 중앙에 렌더링할 슬롯 */
    children?: import("svelte").Snippet;
  }
  let { trackTitle = "", trackArtist = "", children }: Props = $props();

  // 개인 배경 이미지 (없으면 기본 그라데이션) — authStore(bgImage) 우선, 로그인 전엔 localStorage
  import { authStore } from "../login/authStore.svelte";

  let bgImage = $state<string | null>(null);
  // 배경 소스: 로그인 유저의 서버 저장 배경 우선 → 없으면 localStorage(초기화 시 제거됨)
  $effect(() => {
    const userBg = authStore.user?.bgImage;
    if (userBg) {
      bgImage = userBg;
      try {
        localStorage.setItem("listenup:bgImage", userBg);
      } catch {
        /* private mode 등 */
      }
      return;
    }
    try {
      bgImage = localStorage.getItem("listenup:bgImage");
    } catch {
      /* private mode 등 */
    }
  });
</script>

<div class="screen">
  <div class="bg" style={bgImage ? `background:url('${bgImage}') center 60%/cover` : ""}></div>
  {#if !bgImage}
    <div class="city-fallback"></div>
  {/if}
  <div class="vignette"></div>

  <div class="viz-wrap">
    <Visualizer playing={gameStore.gameStarted && !gameStore.roundEnded} />
    <div class="center-ui">
      <div class="now">now playing</div>
      {#if trackTitle}
        <div class="track">{trackTitle}</div>
        {#if trackArtist}<div class="artist">{trackArtist}</div>{/if}
      {/if}
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  .screen {
    position: relative;
    border-radius: 22px;
    overflow: hidden;
    min-height: 560px;
    border: 1px solid var(--screen-bd, var(--border));
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  }
  /* 배경: 기본 그라데이션 (bgImage가 있으면 inline style로 대체) */
  .bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(ellipse 60% 40% at 70% 20%, rgba(167, 139, 250, 0.28), transparent 60%),
      radial-gradient(ellipse 50% 35% at 20% 30%, rgba(56, 189, 248, 0.2), transparent 60%),
      linear-gradient(180deg, #0a0f26 0%, #0d1230 40%, #131a3d 70%, #050818 100%);
  }
  /* 이미지/그라데이션 위 어둡게 처리 — 비주얼라이저 가독성 */
  .bg::after,
  .city-fallback::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(6, 9, 22, 0.4),
      rgba(6, 9, 22, 0.58) 70%,
      rgba(5, 8, 20, 0.8)
    );
  }
  /* 이미지 배경이 없을 때의 CSS 빌딩 실루엣 */
  .city-fallback {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 34%;
    z-index: 1;
  }
  .vignette {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: radial-gradient(
      ellipse 90% 90% at 50% 45%,
      transparent 55%,
      rgba(0, 0, 0, 0.55) 100%
    );
  }
  .viz-wrap {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .center-ui {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 4;
  }
  .now {
    font-size: 10.5px;
    letter-spacing: 2.6px;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 9px;
  }
  .track {
    font-size: 18px;
    font-weight: 800;
    text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
  }
  .artist {
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 3px;
  }
</style>