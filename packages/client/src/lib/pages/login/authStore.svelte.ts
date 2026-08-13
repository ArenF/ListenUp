import * as authApi from "../../api/auth";
import { toErrorMessage } from "../../utils/error";
import type { PublicUser } from "../../types";

/**
 * 로그인 세션 상태 (Svelte 5 룬 기반)
 *
 * 토큰은 서버가 httpOnly 쿠키로 관리하므로 여기서는 토큰을 다루지 않는다.
 * 세션 유지·복원은 쿠키가 알아서 하고, 이 스토어는 현재 사용자 정보만 보관한다.
 * 실패하면 `error`에 메시지를 남긴 뒤 그대로 다시 던지므로,
 * 화면은 스스로 배너/alert 중 무엇으로 보여줄지 정할 수 있다.
 */
class AuthStore {
  user = $state<PublicUser | null>(null);
  loading = $state(false);
  error = $state("");

  readonly isLoggedIn = $derived(this.user !== null);

  /** 앱 시작 시 쿠키로 세션을 복원한다 (쿠키가 없거나 무효하면 비로그인 상태) */
  async restore() {
    try {
      this.user = await authApi.fetchMe();
    } catch {
      this.user = null;
    }
  }

  async login(email: string, password: string) {
    this.user = await this.run(() => authApi.login({ email, password }));
  }

  async signup(input: {
    email: string;
    password: string;
    nickname?: string;
  }) {
    this.user = await this.run(() => authApi.signup(input));
  }

  /** UI는 즉시 비로그인으로 바꾸고, 서버 쿠키 제거는 뒤따르게 한다 */
  async logout() {
    this.user = null;
    try {
      await authApi.logout();
    } catch {
      // 쿠키는 만료되면 어차피 무효하므로 실패해도 조용히 넘어간다
    }
  }

  /** loading/error 상태를 관리하며 서버 작업을 실행한다 */
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
