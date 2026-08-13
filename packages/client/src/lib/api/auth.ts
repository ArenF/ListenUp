import { apiFetch } from "./client";
import type { PublicUser } from "../types";

/**
 * 인증 REST API
 *
 * 서버 라우터(`/api/auth`)와 1:1로 대응한다.
 * 토큰은 서버가 httpOnly 쿠키로 발급/제거하므로 JS는 사용자 정보만 다룬다.
 */

export async function signup(input: {
  email: string;
  password: string;
  nickname?: string;
  avatar?: string;
}): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/signup", {
    method: "POST",
    body: input,
  });
  return user;
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: input,
  });
  return user;
}

/** 인증 쿠키로 내 정보 조회 (쿠키가 없거나 무효하면 401) */
export async function fetchMe(): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/me");
  return user;
}

/** 로그아웃 — 서버가 인증 쿠키를 제거한다 */
export function logout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

/** 프로필 수정 (닉네임 / 기본 아바타 선택) */
export async function updateProfile(input: {
  nickname?: string;
  avatar?: string;
}): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/me", {
    method: "PATCH",
    body: input,
  });
  return user;
}

/**
 * 아바타 이미지 업로드 (multipart)
 *
 * 파일 업로드라 JSON 래퍼(apiFetch)를 쓰지 않고 FormData로 직접 보낸다.
 */
export async function uploadAvatar(file: File): Promise<PublicUser> {
  const form = new FormData();
  form.append("avatar", file);

  const response = await fetch("/api/auth/avatar", {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? `업로드에 실패했습니다 (${response.status})`);
  }

  const { user } = (await response.json()) as { user: PublicUser };
  return user;
}
