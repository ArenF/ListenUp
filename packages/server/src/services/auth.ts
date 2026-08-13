import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { userRepository } from "../db/users.js";
import { config } from "../config/env.js";
import type {
  AuthResult,
  AuthTokenPayload,
  PublicUser,
  UserRecord,
} from "../types/index.js";

/**
 * 인증 서비스
 *
 * 주요 기능:
 * - 회원가입 (비밀번호 bcrypt 해싱)
 * - 로그인 (비밀번호 검증 후 JWT 발급)
 * - 토큰 검증 및 사용자 조회
 */
/**
 * 기본 제공 아바타 목록 (클라이언트 public/avatars/ 에 실제 파일 존재)
 * 클라이언트 `src/lib/avatars.ts`와 동일하게 유지한다.
 */
export const DEFAULT_AVATARS = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
];

export class AuthService {
  // 입력 검증 규칙
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private static readonly MIN_PASSWORD_LENGTH = 8;

  /** 회원가입 시 기본 아바타를 무작위로 하나 배정한다 */
  private static randomDefaultAvatar(): string {
    return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  }

  /**
   * DB 레코드를 클라이언트에 노출 가능한 형태로 변환 (비밀번호 해시 제거)
   */
  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt,
    };
  }

  /**
   * JWT 발급
   */
  private issueToken(user: UserRecord): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"],
    });
  }

  /**
   * 회원가입
   */
  async signup(input: {
    email: string;
    password: string;
    nickname?: string;
    avatar?: string;
  }): Promise<AuthResult> {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;
    // 닉네임을 비우면 이메일 앞부분(로컬 파트)을 기본값으로 쓴다
    const nickname = input.nickname?.trim() || email?.split("@")[0];

    // 입력 검증
    if (!email || !password) {
      return {
        success: false,
        error: "이메일과 비밀번호는 필수 항목입니다",
      };
    }

    if (!AuthService.EMAIL_REGEX.test(email)) {
      return { success: false, error: "올바른 이메일 형식이 아닙니다" };
    }

    if (password.length < AuthService.MIN_PASSWORD_LENGTH) {
      return {
        success: false,
        error: `비밀번호는 최소 ${AuthService.MIN_PASSWORD_LENGTH}자 이상이어야 합니다`,
      };
    }

    // 중복 체크
    if (userRepository.findByEmail(email)) {
      return { success: false, error: "이미 사용 중인 이메일입니다" };
    }

    // 비밀번호 해싱
    const passwordHash = await bcrypt.hash(password, config.auth.bcryptRounds);

    const now = Date.now();
    const user: UserRecord = {
      id: `user-${nanoid(12)}`,
      email,
      passwordHash,
      nickname,
      avatar: input.avatar?.trim() || AuthService.randomDefaultAvatar(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      userRepository.create(user);
    } catch (error) {
      console.error("❌ Failed to create user:", error);
      return { success: false, error: "회원가입에 실패했습니다" };
    }

    console.log(`✅ New user registered: ${email} (${user.id})`);

    return {
      success: true,
      user: this.toPublicUser(user),
      token: this.issueToken(user),
    };
  }

  /**
   * 로그인 (이메일 + 비밀번호)
   */
  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthResult> {
    const email = input.email?.trim().toLowerCase();
    const password = input.password;

    if (!email || !password) {
      return { success: false, error: "이메일과 비밀번호를 입력해주세요" };
    }

    const user = userRepository.findByEmail(email);

    // 이메일 존재 여부를 노출하지 않기 위해 동일한 메시지 사용
    if (!user) {
      return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다" };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다" };
    }

    console.log(`✅ User logged in: ${email} (${user.id})`);

    return {
      success: true,
      user: this.toPublicUser(user),
      token: this.issueToken(user),
    };
  }

  /**
   * JWT 검증 → 페이로드 반환 (실패 시 null)
   */
  verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as AuthTokenPayload;
    } catch {
      return null;
    }
  }

  /**
   * ID로 공개 사용자 정보 조회
   */
  getPublicUser(id: string): PublicUser | null {
    const user = userRepository.findById(id);
    return user ? this.toPublicUser(user) : null;
  }

  /**
   * 프로필(닉네임/아바타) 갱신
   *
   * 값 검증은 라우트에서 끝냈다고 보고, 여기서는 존재하는 필드만 반영한다.
   */
  updateProfile(
    userId: string,
    updates: { nickname?: string; avatar?: string }
  ): AuthResult {
    const user = userRepository.findById(userId);
    if (!user) {
      return { success: false, error: "사용자를 찾을 수 없습니다" };
    }

    const updated: UserRecord = {
      ...user,
      nickname: updates.nickname?.trim() || user.nickname,
      avatar: updates.avatar ?? user.avatar,
      updatedAt: Date.now(),
    };

    try {
      userRepository.update(updated);
    } catch (error) {
      console.error("❌ Failed to update profile:", error);
      return { success: false, error: "프로필 수정에 실패했습니다" };
    }

    return { success: true, user: this.toPublicUser(updated) };
  }
}

// 싱글톤 인스턴스 생성
export const authService = new AuthService();
