import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { apiFetch } from "./client";
import type { PublicUser } from "../types/index";

/**
 * 인증 API
 *
 * 로그인·회원가입·로그아웃은 Firebase Auth를 직접 호출한다.
 * 서버(`/api/auth`)는 로그인 직후 공개 프로필을 준비해 주는 일만 한다.
 * 프로필 수정은 Firestore `users/{uid}`에 직접 쓰고, 검증은 firestore.rules가 맡는다.
 */

export async function signup(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function login(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}

export async function sendPasswordReset(email: string): Promise<void> {
  auth.languageCode = "ko";
  await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * 내 프로필 조회, 없으면 생성 (로그인 직후 호출)
 *
 * nickname은 처음 만들 때만 쓰인다. 비우면 서버가 소셜 계정 이름이나 이메일 앞부분을 쓴다.
 */
export async function ensureProfile(nickname?: string): Promise<PublicUser> {
  const { user } = await apiFetch<{ user: PublicUser }>("/api/auth/me", {
    method: "POST",
    body: { nickname },
  });
  return user;
}

/** 프로필 수정 (닉네임 / 기본 아바타 선택) */
export async function updateProfile(
  uid: string,
  updates: { nickname?: string; avatar?: string }
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { ...updates, updatedAt: Date.now() });
}
