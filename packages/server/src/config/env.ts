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
  auth: {
    // JWT 서명 비밀키 (운영 환경에서는 반드시 환경 변수로 설정)
    jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
    // 토큰 만료 기간
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
    // bcrypt 해싱 라운드 수
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "10"),
    // 인증 쿠키 유효 기간(ms) — JWT_EXPIRES_IN과 맞춰 둔다 (기본 7일)
    cookieMaxAgeMs:
      parseInt(process.env.AUTH_COOKIE_MAX_AGE_DAYS || "7") * 24 * 60 * 60 * 1000,
  },
  db: {
    // SQLite 데이터베이스 파일 경로
    path: process.env.DB_PATH || path.resolve(__dirname, "../data/listenup.db"),
  },
  uploads: {
    // 사용자 업로드 파일 저장 디렉터리 (/api/uploads로 정적 서빙)
    dir: process.env.UPLOADS_DIR || path.resolve(__dirname, "../../uploads"),
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

export function validateEnvAuth() {
  if (
    config.server.nodeEnv === "production" &&
    config.auth.jwtSecret === "dev-insecure-secret-change-me"
  ) {
    console.warn(
      "⚠️  WARNING: JWT_SECRET is not set. Using an insecure default in production!"
    );
    console.warn(
      "   Set a strong random JWT_SECRET in your environment before deploying."
    );
  }
}
