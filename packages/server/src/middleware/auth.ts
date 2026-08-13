import type { Request, Response, NextFunction, CookieOptions } from "express";
import { authService } from "../services/auth.js";
import { config } from "../config/env.js";
import type { AuthTokenPayload } from "../types/index.js";

/**
 * 인증 미들웨어
 *
 * JWT를 httpOnly 쿠키(우선) 또는 Authorization: Bearer 헤더에서 읽어 검증하고,
 * 검증에 성공하면 req.auth에 페이로드를 주입한다.
 */

// Express Request에 auth 필드 추가
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

/** 인증 토큰을 담는 쿠키 이름 */
export const AUTH_COOKIE_NAME = "access_token";

/** 쿠키 공통 옵션 (httpOnly로 JS 접근 차단, 운영에서는 secure) */
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: config.server.nodeEnv === "production",
    path: "/",
  };
}

/** 로그인 성공 시 인증 쿠키를 발급한다 */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: config.auth.cookieMaxAgeMs,
  });
}

/** 로그아웃 시 인증 쿠키를 제거한다 (maxAge는 clearCookie가 무시) */
export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}

// 쿠키(우선) 또는 Authorization 헤더에서 토큰 추출
function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

/**
 * 인증 필수 미들웨어 — 토큰이 없거나 유효하지 않으면 401 반환
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "인증 토큰이 필요합니다" });
    return;
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "유효하지 않거나 만료된 토큰입니다" });
    return;
  }

  req.auth = payload;
  next();
}

/**
 * 선택적 인증 미들웨어 — 토큰이 있으면 주입하고, 없어도 통과
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (token) {
    const payload = authService.verifyToken(token);
    if (payload) {
      req.auth = payload;
    }
  }
  next();
}
