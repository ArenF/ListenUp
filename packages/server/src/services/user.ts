import { firestore } from "../config/firebase.js";
import type { PublicUser } from "../types/index.js";

/**
 * 사용자 프로필 서비스 (Firestore `users/{uid}`)
 *
 * 계정(이메일·비밀번호·소셜 로그인)은 Firebase Auth가 맡고,
 * 여기서는 게임에서 보여줄 공개 프로필만 다룬다.
 * 프로필 문서는 누구나 읽을 수 있으므로 이메일은 저장하지 않는다.
 */

/**
 * 기본 제공 아바타 목록 (클라이언트 public/avatars/ 에 실제 파일 존재)
 * 클라이언트 `src/utils/avatars.ts`, `firestore.rules`(validAvatar)와 동일하게 유지한다.
 */
export const DEFAULT_AVATARS = [
  "/avatars/avatar-1.webp",
  "/avatars/avatar-2.webp",
  "/avatars/avatar-3.webp",
];

/** firestore.rules의 validNickname과 같은 길이 제한 */
const MAX_NICKNAME_LENGTH = 20;

/** Firestore `users/{uid}` 문서 형태 */
interface UserDoc {
  nickname: string;
  avatar: string;
  equippedTitle: string | null;
  createdAt: number;
  updatedAt: number;
}

const users = firestore.collection("users");

function randomDefaultAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

function toPublicUser(uid: string, email: string, doc: UserDoc): PublicUser {
  return {
    id: uid,
    email,
    nickname: doc.nickname,
    avatar: doc.avatar,
    createdAt: doc.createdAt,
  };
}

export const userService = {
  /**
   * 프로필을 조회하고, 없으면 만든다 (로그인 직후 호출)
   *
   * 닉네임은 가입 폼 입력 → 소셜 계정 이름 → 이메일 앞부분 순으로 정한다.
   * 이미 프로필이 있으면 입력값은 무시하고 기존 프로필을 돌려준다.
   */
  async ensureProfile(input: {
    uid: string;
    email: string;
    nickname?: string;
    displayName?: string;
  }): Promise<PublicUser> {
    const ref = users.doc(input.uid);

    const doc = await firestore.runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (snapshot.exists) {
        return snapshot.data() as UserDoc;
      }

      const nickname = (
        input.nickname?.trim() ||
        input.displayName?.trim() ||
        input.email.split("@")[0] ||
        "플레이어"
      ).slice(0, MAX_NICKNAME_LENGTH);

      const now = Date.now();
      const created: UserDoc = {
        nickname,
        avatar: randomDefaultAvatar(),
        equippedTitle: null,
        createdAt: now,
        updatedAt: now,
      };
      tx.create(ref, created);
      console.log(`✅ New profile created: ${input.uid}`);
      return created;
    });

    return toPublicUser(input.uid, input.email, doc);
  },

  /** 닉네임 조회 (플레이리스트 작성자 표시용) — 프로필이 없으면 null */
  async getNickname(uid: string): Promise<string | null> {
    const snapshot = await users.doc(uid).get();
    return snapshot.exists ? (snapshot.data() as UserDoc).nickname : null;
  },
};
