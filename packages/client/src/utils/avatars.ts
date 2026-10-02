/**
 * 기본 제공 아바타 목록
 *
 * 이미지 파일은 `packages/client/public/avatars/`에 두면 `/avatars/...`로 서빙된다.
 * 서버(`packages/server/src/services/auth.ts`)와 `firestore.rules`(validAvatar)에도 동일한 목록이 있으니 함께 관리한다.
 */
export const DEFAULT_AVATARS = [
  "/avatars/avatar-1.webp",
  "/avatars/avatar-2.webp",
  "/avatars/avatar-3.webp",
];
