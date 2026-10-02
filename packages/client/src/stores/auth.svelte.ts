import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import * as authApi from "../api/auth";
import { toErrorMessage } from "../utils/error";
import type { PublicUser } from "../types/index";

/**
 * 로그인 세션 상태 (Svelte 5 룬 기반)
 *
 * 세션 유지·토큰 갱신은 Firebase Auth SDK가 맡고,
 * 이 스토어는 로그인한 사용자의 공개 프로필만 보관한다.
 * 실패하면 `error`에 메시지를 남긴 뒤 그대로 다시 던지므로,
 * 화면은 스스로 배너/alert 중 무엇으로 보여줄지 정할 수 있다.
 */
class AuthStore {
  user = $state<PublicUser | null>(null);
  loading = $state(false);
  error = $state("");

  readonly isLoggedIn = $derived(this.user !== null);

  // 회원가입 중에는 가입 폼의 닉네임으로 프로필을 만들어야 하므로
  // 로그인 감지 쪽에서 먼저 프로필을 만들지 않게 막는다
  private signingUp = false;

  /** 앱 시작 시 로그인 상태 감시를 시작한다 (새로고침 후 세션 복원 포함) */
  restore() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        this.user = null;
        return;
      }
      if (this.signingUp) return;

      try {
        this.user = await authApi.ensureProfile();
      } catch (err) {
        this.error = toErrorMessage(err);
        this.user = null;
      }
    });
  }

  async login(email: string, password: string) {
    await this.run(() => authApi.login(email, password));
  }

  async loginWithGoogle() {
    await this.run(() => authApi.loginWithGoogle());
  }

  async signup(input: { email: string; password: string; nickname?: string }) {
    this.signingUp = true;
    try {
      this.user = await this.run(async () => {
        await authApi.signup(input.email, input.password);
        return authApi.ensureProfile(input.nickname);
      });
    } finally {
      this.signingUp = false;
    }
  }

  async sendPasswordReset(email: string) {
    await this.run(() => authApi.sendPasswordReset(email));
  }

  /** 기본 아바타 선택 등 프로필 수정 */
  async updateProfile(updates: { nickname?: string; avatar?: string }) {
    const user = this.user;
    if (!user) return;
    await this.run(() => authApi.updateProfile(user.id, updates));
    this.user = { ...user, ...updates };
  }

  async logout() {
    await authApi.logout();
  }

  /** loading/error 상태를 관리하며 작업을 실행한다 */
  private async run<T>(task: () => Promise<T>): Promise<T> {
    try {
      this.loading = true;
      this.error = "";
      return await task();
    } catch (err) {
      this.error = toErrorMessage(err);
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const authStore = new AuthStore();
