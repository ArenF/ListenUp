import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 파일은 프로젝트 루트에 있음
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

export const config = {
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY || "",
  },
  server: {
    port: parseInt(process.env.PORT || "3000"),
    nodeEnv: process.env.NODE_ENV || "development",
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  },
  game: {
    // 기본 플레이리스트 ID (환경 변수로 설정 가능)
    defaultPlaylistId: process.env.DEFAULT_PLAYLIST_ID || "test-playlist",
  },
};

export function validateEnvYouTube() {
  if (!config.youtube.apiKey) {
    console.warn(
      "⚠️  WARNING: YOUTUBE_API_KEY is not set. YouTube features will not work."
    );
    console.warn(
      "   Get your API key from: https://console.cloud.google.com/apis/credentials"
    );
  }
}
