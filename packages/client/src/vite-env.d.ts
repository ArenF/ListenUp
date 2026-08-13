/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  // 필요한 다른 환경변수를 여기에 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * YouTube IFrame API가 로드되면 전역에 심는 값들
 *
 * `YT` 네임스페이스 타입은 @types/youtube가 전역으로 제공한다.
 */
interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
