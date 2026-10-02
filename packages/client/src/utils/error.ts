import { FirebaseError } from "firebase/app";

/** Firebase Auth 에러 코드 → 사용자에게 보여줄 메시지 */
const FIREBASE_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "올바른 이메일 형식이 아닙니다",
  "auth/email-already-in-use": "이미 사용 중인 이메일입니다",
  "auth/weak-password": "비밀번호가 너무 약합니다",
  // 이메일 존재 여부를 노출하지 않도록 같은 메시지를 쓴다
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다",
  "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않습니다",
  "auth/wrong-password": "이메일 또는 비밀번호가 올바르지 않습니다",
  "auth/too-many-requests": "시도가 너무 많습니다. 잠시 후 다시 시도해주세요",
  "auth/network-request-failed": "네트워크 연결을 확인해주세요",
  "auth/popup-blocked": "팝업이 차단됐습니다. 팝업을 허용해주세요",
  "auth/account-exists-with-different-credential":
    "같은 이메일로 다른 방식으로 가입한 계정이 있습니다",
  "permission-denied": "허용되지 않은 변경입니다",
};

/** catch로 잡은 값에서 사용자에게 보여줄 메시지를 뽑아낸다 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return FIREBASE_MESSAGES[error.code] ?? `요청에 실패했습니다 (${error.code})`;
  }
  return error instanceof Error ? error.message : String(error);
}
