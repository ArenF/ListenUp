import { db } from "./index.js";
import type { UserRecord } from "../types/index.js";

/**
 * users 테이블 접근 레포지토리
 *
 * DB의 snake_case 컬럼과 애플리케이션의 camelCase 필드 간 매핑을 담당한다.
 */

// DB row(snake_case) → UserRecord(camelCase) 변환
interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  nickname: string;
  avatar: string;
  created_at: number;
  updated_at: number;
}

function rowToUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    nickname: row.nickname,
    avatar: row.avatar,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepository = {
  /**
   * 사용자 생성
   */
  create(user: UserRecord): void {
    db.prepare(
      `INSERT INTO users
        (id, email, password_hash, nickname, avatar, created_at, updated_at)
       VALUES
        (@id, @email, @passwordHash, @nickname, @avatar, @createdAt, @updatedAt)`
    ).run(user);
  },

  /**
   * 프로필 갱신 (닉네임/아바타 등 가변 필드)
   */
  update(user: UserRecord): void {
    db.prepare(
      `UPDATE users SET
         email = @email,
         password_hash = @passwordHash,
         nickname = @nickname,
         avatar = @avatar,
         updated_at = @updatedAt
       WHERE id = @id`
    ).run(user);
  },

  /**
   * ID로 조회
   */
  findById(id: string): UserRecord | undefined {
    const row = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  },

  /**
   * email로 조회 (로그인 / 중복 체크용)
   */
  findByEmail(email: string): UserRecord | undefined {
    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  },
};
