import { Router } from "express";
import { authService } from "../services/auth.js";
import {
  requireAuth,
  setAuthCookie,
  clearAuthCookie,
} from "../middleware/auth.js";

/**
 * 인증 관련 REST API 라우터
 *
 * 토큰은 httpOnly 쿠키로 발급/제거하므로 응답 본문에는 사용자 정보만 담는다.
 *
 * POST /api/auth/signup  회원가입
 * POST /api/auth/login   로그인
 * POST /api/auth/logout  로그아웃 (쿠키 제거)
 * GET  /api/auth/me      내 정보 조회 (인증 필요)
 */
export const authRouter = Router();

// 회원가입
authRouter.post("/signup", async (req, res) => {
  try {
    const { email, password, nickname, avatar } = req.body ?? {};

    const result = await authService.signup({
      email,
      password,
      nickname,
      avatar,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    setAuthCookie(res, result.token!);
    return res.status(201).json({ user: result.user });
  } catch (error: any) {
    console.error("Error during signup:", error);
    return res.status(500).json({ error: "회원가입 처리 중 오류가 발생했습니다" });
  }
});

// 로그인
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    const result = await authService.login({ email, password });

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    setAuthCookie(res, result.token!);
    return res.json({ user: result.user });
  } catch (error: any) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다" });
  }
});

// 로그아웃 (인증 쿠키 제거)
authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ success: true });
});

// 내 정보 조회
authRouter.get("/me", requireAuth, (req, res) => {
  const user = authService.getPublicUser(req.auth!.sub);

  if (!user) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
  }

  return res.json({ user });
});
