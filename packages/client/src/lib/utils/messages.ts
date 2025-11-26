/**
 * 애플리케이션 전체에서 사용되는 메시지 정의
 * 카테고리별로 구분하여 관리
 */

export const MESSAGES = {
  // Socket 관련
  SOCKET: {
    CONNECTION_FAILED: '서버 연결에 실패했습니다. 다시 시도해주세요.',
    DISCONNECTED: '서버와의 연결이 끊어졌습니다.',
    RECONNECTING: '서버에 재연결 중입니다...',
    RECONNECTED: '서버에 다시 연결되었습니다.',
    ROOM_NOT_FOUND: '방을 찾을 수 없습니다.',
    ROOM_FULL: '방이 가득 찼습니다.',
    INVALID_ROOM_CODE: '잘못된 방 코드입니다.',
    NICKNAME_REQUIRED: '닉네임을 입력해주세요.',
    ALREADY_IN_ROOM: '이미 방에 참가하고 있습니다.',
  },

  // YouTube Player 관련
  YOUTUBE: {
    PLAYBACK_ERROR: '영상을 재생할 수 없습니다.',
    EMBED_BLOCKED: '이 영상은 재생할 수 없습니다. 다음 곡으로 넘어갑니다.',
    INVALID_PARAMETER: '잘못된 영상 매개변수입니다.',
    HTML5_ERROR: 'HTML5 플레이어 오류가 발생했습니다.',
    VIDEO_NOT_FOUND: '영상을 찾을 수 없습니다.',
    INVALID_VIDEO: '잘못된 영상 ID입니다.',
    API_ERROR: 'YouTube API 오류가 발생했습니다.',
    LOAD_ERROR: '영상 로드 중 오류가 발생했습니다.',
  },

  // Playlist 관련
  PLAYLIST: {
    LOAD_FAILED: '플레이리스트를 불러올 수 없습니다.',
    SAVE_FAILED: '플레이리스트 저장에 실패했습니다.',
    DELETE_FAILED: '플레이리스트 삭제에 실패했습니다.',
    EMPTY: '플레이리스트가 비어있습니다.',
    TRACK_ADD_FAILED: '트랙 추가에 실패했습니다.',
    TRACK_REMOVE_FAILED: '트랙 제거에 실패했습니다.',
    TRACK_FETCH_FAILED: '트랙 정보를 가져올 수 없습니다.',
    INVALID_URL: '유효하지 않은 YouTube URL입니다.',
    NAME_REQUIRED: '플레이리스트 이름을 입력해주세요.',
    VIDEO_ID_REQUIRED: '비디오 ID를 입력해주세요.',
    ANSWER_REQUIRED: '최소 하나의 정답을 입력해주세요.',
    SELECT_PLAYLIST: '플레이리스트를 선택해주세요.',
  },

  // Game 관련
  GAME: {
    START_FAILED: '게임 시작에 실패했습니다.',
    NOT_HOST: '방장만 게임을 시작할 수 있습니다.',
    INSUFFICIENT_PLAYERS: '최소 2명 이상의 플레이어가 필요합니다.',
    ANSWER_SUBMIT_FAILED: '답안 제출에 실패했습니다.',
    ROUND_START_FAILED: '라운드 시작에 실패했습니다.',
    ALREADY_STARTED: '게임이 이미 시작되었습니다.',
    NOT_IN_GAME: '게임에 참가하지 않았습니다.',
  },

  // Success 메시지
  SUCCESS: {
    PLAYLIST_SAVED: '플레이리스트가 저장되었습니다.',
    PLAYLIST_DELETED: '플레이리스트가 삭제되었습니다.',
    TRACK_ADDED: '트랙이 추가되었습니다.',
    TRACK_REMOVED: '트랙이 제거되었습니다.',
    ROOM_CREATED: '방이 생성되었습니다.',
    ROOM_JOINED: '방에 참가했습니다.',
    GAME_STARTED: '게임이 시작되었습니다!',
    ANSWER_CORRECT: '정답입니다!',
  },

  // Info 메시지
  INFO: {
    PLAYER_JOINED: '님이 입장했습니다.',
    PLAYER_LEFT: '님이 퇴장했습니다.',
    ROUND_START: '라운드 시작!',
    ROUND_END: '라운드 종료!',
    GAME_END: '게임 종료!',
    PREPARING_NEXT_ROUND: '다음 라운드 준비 중...',
    SKIPPING_TRACK: '트랙을 건너뜁니다...',
  },
} as const;

// 타입 추론을 위한 헬퍼
export type MessageCategory = keyof typeof MESSAGES;
export type MessageKey<T extends MessageCategory> = keyof (typeof MESSAGES)[T];

/**
 * 특정 카테고리의 메시지 키를 가져오는 헬퍼 타입
 */
export type SocketMessageKey = MessageKey<'SOCKET'>;
export type YouTubeMessageKey = MessageKey<'YOUTUBE'>;
export type PlaylistMessageKey = MessageKey<'PLAYLIST'>;
export type GameMessageKey = MessageKey<'GAME'>;
export type SuccessMessageKey = MessageKey<'SUCCESS'>;
export type InfoMessageKey = MessageKey<'INFO'>;
