/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL?: string;
  // 필요한 다른 환경변수를 여기에 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
