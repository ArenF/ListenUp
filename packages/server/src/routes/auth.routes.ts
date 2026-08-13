import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { authService, DEFAULT_AVATARS } from "../services/auth.js";
import { config } from "../config/env.js";
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
 * POST  /api/auth/signup  회원가입
 * POST  /api/auth/login   로그인
 * POST  /api/auth/logout  로그아웃 (쿠키 제거)
 * GET   /api/auth/me      내 정보 조회 (인증 필요)
 * PATCH /api/auth/me      프로필(닉네임/기본 아바타) 수정 (인증 필요)
 * POST  /api/auth/avatar  아바타 이미지 업로드 (인증 필요)
 */
export const authRouter = Router();

// ----------------------------------------------------------------------------
// 아바타 업로드 (multer) 설정
// ----------------------------------------------------------------------------
const avatarDir = path.join(config.uploads.dir, "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

// 허용 이미지 MIME → 확장자
const MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
      const ext = MIME_EXT[file.mimetype] ?? ".png";
      cb(null, `${req.auth!.sub}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (MIME_EXT[file.mimetype]) cb(null, true);
    else cb(new Error("이미지 파일만 업로드할 수 있습니다 (png/jpg/webp/gif)"));
  },
});

// multer 에러(용량 초과·확장자 등)를 JSON으로 변환
function handleAvatarUpload(req: Request, res: Response, next: NextFunction) {
  avatarUpload.single("avatar")(req, res, (err: unknown) => {
    if (err) {
      let message = err instanceof Error ? err.message : "업로드에 실패했습니다";
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        message = "파일이 너무 큽니다 (최대 5MB)";
      }
      res.status(400).json({ error: message });
      return;
    }
    next();
  });
}

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

// 프로필 수정 (닉네임 / 기본 아바타 선택)
authRouter.patch("/me", requireAuth, (req, res) => {
  const { nickname, avatar } = req.body ?? {};

  // 아바타는 기본 제공 목록만 허용 (업로드 URL은 /avatar 엔드포인트가 직접 설정)
  if (avatar !== undefined && !DEFAULT_AVATARS.includes(avatar)) {
    return res.status(400).json({ error: "허용되지 않은 아바타입니다" });
  }

  if (
    nickname !== undefined &&
    (typeof nickname !== "string" || nickname.trim().length === 0)
  ) {
    return res.status(400).json({ error: "닉네임을 입력해주세요" });
  }

  const result = authService.updateProfile(req.auth!.sub, { nickname, avatar });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ user: result.user });
});

// 아바타 이미지 업로드 → 저장 후 avatar URL 갱신
authRouter.post("/avatar", requireAuth, handleAvatarUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "이미지 파일이 필요합니다" });
  }

  const avatarUrl = `/api/uploads/avatars/${req.file.filename}`;
  const result = authService.updateProfile(req.auth!.sub, { avatar: avatarUrl });
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ user: result.user });
});
