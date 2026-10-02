import type { Request, Response, NextFunction } from "express";
import { adminAuth } from "../config/firebase.js";
import type { AuthContext } from "../types/index.js";

/**
 * 인증 미들웨어
 *
 * 클라이언트가 Authorization: Bearer 헤더로 보낸 Firebase ID 토큰을 검증하고,
 * 검증에 성공하면 req.auth에 사용자 정보를 주입한다.
 */

// Express Request에 auth 필드 추가
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

/** ID 토큰 검증 → 인증 정보 반환 (실패 시 null) */
async function verify(token: string): Promise<AuthContext | null> {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      displayName: decoded.name,
    };
  } catch {
    return null;
  }
}

/**
 * 인증 필수 미들웨어 — 토큰이 없거나 유효하지 않으면 401 반환
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "인증 토큰이 필요합니다" });
    return;
  }

  const auth = await verify(token);
  if (!auth) {
    res.status(401).json({ error: "유효하지 않거나 만료된 토큰입니다" });
    return;
  }

  req.auth = auth;
  next();
}
