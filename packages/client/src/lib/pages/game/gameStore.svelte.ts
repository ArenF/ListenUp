import type {
  GameResult,
  HiddenTrack,
  Player,
  Playlist,
  Room,
} from "../../types";

/**
 * 게임 화면의 상태 (Svelte 5 룬 기반)
 *
 * 상태만 담는다. 서버로 보내는 요청은 `gameActions`,
 * 서버에서 오는 이벤트 처리는 `gameSocketHandlers`가 담당한다.
 */
class GameStore {
  // 연결 상태
  socketId = $state("");
  connected = $state(false);
  statusMessage = $state("서버에 연결되지 않음");

  // 방 상태
  roomCode = $state("");
  nickname = $state("");
  currentRoom = $state<Room | null>(null);
  players = $state<Player[]>([]);

  // 플레이리스트
  playlists = $state<Playlist[]>([]);
  selectedPlaylistId = $state("test-playlist");

  // 게임 상태
  gameStarted = $state(false);
  currentRound = $state(0);
  totalRounds = $state(0);
  /** 재생 중인 트랙 (라운드 시작 후) */
  currentTrack = $state<HiddenTrack | null>(null);
  /** 미리 받아둔 다음 트랙 (플레이어 로딩용) */
  preparedTrack = $state<HiddenTrack | null>(null);
  answer = $state("");
  gameResult = $state<GameResult | null>(null);
  roundEnded = $state(false);

  // YouTube Player
  player = $state<YT.Player | null>(null);
  playerReady = $state(false);
  isMuted = $state(true);
  isLoadingTrack = $state(false);
  readyPlayers = $state(0);
  volume = $state(50);

  /**
   * 현재 사용자가 방장인지 여부
   *
   * socket 객체 자체는 반응형이 아니므로 연결 시점에 저장해 둔 socketId를 쓴다.
   */
  readonly isHost = $derived(
    this.currentRoom?.players.some(
      (p) => p.id === this.socketId && p.isHost
    ) ?? false
  );

  /** 방/게임 관련 상태만 초기화 (연결 상태와 플레이리스트 목록은 유지) */
  resetRoom() {
    this.roomCode = "";
    this.currentRoom = null;
    this.players = [];

    this.gameStarted = false;
    this.currentRound = 0;
    this.totalRounds = 0;
    this.currentTrack = null;
    this.preparedTrack = null;
    this.answer = "";
    this.gameResult = null;
    this.roundEnded = false;

    this.isLoadingTrack = false;
    this.readyPlayers = 0;
  }
}

export const gameStore = new GameStore();
