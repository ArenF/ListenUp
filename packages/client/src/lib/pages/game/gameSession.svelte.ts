import { onMount } from "svelte";
import type { Socket } from "socket.io-client";
import { initSocket } from "../../socket";
import { loadPlaylists } from "./gameActions";
import { registerGameSocketHandlers } from "./gameSocketHandlers";
import { destroyPlayer, loadIframeApi, setupYouTubePlayer } from "./youtubePlayer.svelte";

/**
 * 게임 화면의 수명주기를 조립한다.
 *
 * 소켓 연결, 이벤트 구독, YouTube 플레이어 준비를 한 번에 시작하고
 * 화면을 벗어날 때 정리까지 책임진다.
 * 컴포넌트 초기화 중에 호출해야 한다.
 */
export function startGameSession() {
  setupYouTubePlayer();

  onMount(() => {
    loadPlaylists();

    const socket = initSocket();
    registerGameSocketHandlers(socket);
    socket.connect();

    // 개발 중 콘솔에서 소켓을 직접 만져볼 수 있게 열어둔다
    if (import.meta.env.DEV) {
      (window as Window & { socket?: Socket }).socket = socket;
    }

    loadIframeApi();

    return () => {
      socket.disconnect();
      destroyPlayer();
    };
  });
}
