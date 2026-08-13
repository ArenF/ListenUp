import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { config } from "../config/env.js";

/**
 * SQLite 데이터베이스 연결 (better-sqlite3)
 *
 * - 단일 파일 기반 DB로 별도 서버 구동이 필요 없음
 * - 동기 API를 사용하므로 콜백/Promise 없이 즉시 결과를 반환
 */

// DB 파일이 위치할 디렉터리가 없으면 생성
const dbDir = path.dirname(config.db.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(config.db.path);

// 동시 접근 성능 및 무결성 향상
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * 스키마 초기화 (테이블이 없으면 생성)
 */
export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT    PRIMARY KEY,
      email         TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      nickname      TEXT    NOT NULL,
      avatar        TEXT    NOT NULL DEFAULT '',
      created_at    INTEGER NOT NULL,
      updated_at    INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log(`✅ Database initialized at ${config.db.path}`);
}
