<script lang="ts">
  import { authStore } from "../../stores/auth.svelte";

  // 로그인 ↔ 회원가입 전환
  let mode = $state<"login" | "signup">("login");

  let email = $state("");
  let password = $state("");
  let nickname = $state("");
  // 비밀번호 재설정 메일을 보낸 뒤 안내 문구
  let notice = $state("");

  const isSignup = $derived(mode === "signup");

  // Firebase 기본 정책(6자)보다 엄격하게, 기존 가입 규칙대로 8자 이상을 요구한다
  const MIN_PASSWORD_LENGTH = 8;
  // firestore.rules의 닉네임 길이 제한과 같다
  const MAX_NICKNAME_LENGTH = 20;

  function toggleMode() {
    mode = isSignup ? "login" : "signup";
    authStore.error = "";
    notice = "";
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    notice = "";

    if (isSignup && password.length < MIN_PASSWORD_LENGTH) {
      authStore.error = `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다`;
      return;
    }

    try {
      if (isSignup) {
        await authStore.signup({
          email,
          password,
          nickname: nickname || undefined,
        });
      } else {
        await authStore.login(email, password);
      }
      // 성공하면 AccountPage가 프로필 카드로 전환한다. 폼만 비워 둔다.
      password = "";
    } catch {
      // 에러 메시지는 authStore.error로 배너에 표시된다
    }
  }

  async function handleGoogle() {
    notice = "";
    try {
      await authStore.loginWithGoogle();
    } catch {
      // 에러 메시지는 authStore.error로 배너에 표시된다
    }
  }

  async function handlePasswordReset() {
    notice = "";
    if (!email) {
      authStore.error = "재설정 메일을 받을 이메일을 입력해주세요";
      return;
    }
    try {
      await authStore.sendPasswordReset(email);
      notice = "비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해주세요";
    } catch {
      // 에러 메시지는 authStore.error로 배너에 표시된다
    }
  }
</script>

<div class="auth">
  <form class="auth-card" onsubmit={handleSubmit}>
    <h2>{isSignup ? "회원가입" : "로그인"}</h2>
    <p class="subtitle">
      {isSignup
        ? "ListenUp! 계정을 만들어보세요"
        : "다시 오신 걸 환영합니다 🎵"}
    </p>

    {#if authStore.error}
      <div class="error" role="alert">{authStore.error}</div>
    {:else if notice}
      <div class="notice" role="status">{notice}</div>
    {/if}

    <label>
      이메일
      <input
        type="email"
        bind:value={email}
        placeholder="you@example.com"
        autocomplete="email"
        required
      />
    </label>

    {#if isSignup}
      <label>
        닉네임 <span class="optional">(선택)</span>
        <input
          type="text"
          bind:value={nickname}
          placeholder="비우면 이메일 앞부분이 사용됩니다"
          maxlength={MAX_NICKNAME_LENGTH}
        />
      </label>
    {/if}

    <label>
      비밀번호
      <input
        type="password"
        bind:value={password}
        placeholder={isSignup ? "최소 8자" : "비밀번호"}
        autocomplete={isSignup ? "new-password" : "current-password"}
        required
      />
    </label>

    <button type="submit" class="submit" disabled={authStore.loading}>
      {#if authStore.loading}
        처리 중...
      {:else}
        {isSignup ? "가입하기" : "로그인"}
      {/if}
    </button>

    {#if !isSignup}
      <button
        type="button"
        class="link"
        onclick={handlePasswordReset}
        disabled={authStore.loading}
      >
        비밀번호를 잊으셨나요?
      </button>
    {/if}

    <div class="divider"><span>또는</span></div>

    <button
      type="button"
      class="google"
      onclick={handleGoogle}
      disabled={authStore.loading}
    >
      Google로 계속하기
    </button>

    <button type="button" class="toggle" onclick={toggleMode}>
      {isSignup
        ? "이미 계정이 있으신가요? 로그인"
        : "계정이 없으신가요? 회원가입"}
    </button>
  </form>
</div>

<style>
  .auth {
    display: flex;
    justify-content: center;
    padding: var(--space-12) var(--space-4);
  }

  .auth-card {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-8);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  h2 {
    margin: 0;
    color: var(--accent);
  }

  .subtitle {
    margin: calc(var(--space-2) * -1) 0 var(--space-2);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--text-primary);
  }

  .optional {
    color: var(--text-secondary);
    font-weight: 400;
  }

  input {
    padding: 0.7rem 0.85rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .error {
    padding: 0.7rem 0.85rem;
    background: color-mix(in srgb, var(--color-danger) 10%, var(--bg-surface));
    color: var(--color-danger);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
  }

  .notice {
    padding: 0.7rem 0.85rem;
    background: color-mix(in srgb, var(--accent) 10%, var(--bg-surface));
    color: var(--accent);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
  }

  .submit {
    margin-top: var(--space-2);
    padding: 0.8rem;
    background: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 85%, black);
  }

  .submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .divider {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
  }

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    border-top: 1px solid var(--border);
  }

  .google {
    padding: 0.8rem;
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 700;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .google:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .google:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .link {
    align-self: flex-end;
    margin-top: calc(var(--space-2) * -1);
    background: none;
    border: none;
    padding: 0;
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    cursor: pointer;
  }

  .link:hover:not(:disabled) {
    color: var(--accent);
    text-decoration: underline;
  }

  .toggle {
    background: none;
    border: none;
    color: var(--accent);
    font-size: var(--font-size-xs);
    cursor: pointer;
  }

  .toggle:hover {
    text-decoration: underline;
  }
</style>
