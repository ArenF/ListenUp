import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "./env.js";

/**
 * Firebase Admin SDK 초기화
 *
 * 자격 증명은 다음 순서로 찾는다.
 * 1. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY — 서비스 계정 키 JSON의 두 값 (PaaS 환경 변수용)
 * 2. GOOGLE_APPLICATION_CREDENTIALS — 키 파일 경로 (applicationDefault가 읽음)
 *
 * FIREBASE_AUTH_EMULATOR_HOST / FIRESTORE_EMULATOR_HOST가 설정돼 있으면
 * Admin SDK가 알아서 에뮬레이터로 붙으므로 여기서 따로 처리하지 않는다.
 */
const { projectId, clientEmail, privateKey } = config.firebase;

export const firebaseApp = initializeApp({
  credential:
    clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault(),
  projectId: projectId || undefined,
});

export const adminAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
