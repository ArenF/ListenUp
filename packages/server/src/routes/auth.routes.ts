import { Router } from "express";
import { userService } from "../services/user.js";
import { requireAuth } from "../middleware/auth.js";

/**
 * 인증 관련 REST API 라우터
 *
 * 로그인·회원가입·로그아웃은 클라이언트가 Firebase Auth로 직접 처리한다.
 * 서버는 로그인 직후 공개 프로필(Firestore)을 준비해 주는 일만 한다.
 * 닉네임·아바타 수정도 클라이언트가 Firestore에 직접 쓴다 (firestore.rules가 검증).
 *
 * POST /api/auth/me  내 프로필 조회, 없으면 생성 (인증 필요)
 */
export const authRouter = Router();

authRouter.post("/me", requireAuth, async (req, res) => {
  try {
    const { nickname } = req.body ?? {};
    const { uid, email, displayName } = req.auth!;

    const user = await userService.ensureProfile({
      uid,
      email,
      nickname: typeof nickname === "string" ? nickname : undefined,
      displayName,
    });

    return res.json({ user });
  } catch (error) {
    console.error("Error ensuring profile:", error);
    return res.status(500).json({ error: "프로필을 불러오지 못했습니다" });
  }
});
