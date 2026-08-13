<script lang="ts">
  import { authStore } from "./authStore.svelte";

  // 로그인 ↔ 회원가입 전환
  let mode = $state<"login" | "signup">("login");

  let email = $state("");
  let password = $state("");
  let nickname = $state("");

  const isSignup = $derived(mode === "signup");

  function toggleMode() {
    mode = isSignup ? "login" : "signup";
    authStore.error = "";
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

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
      // 성공하면 상위 화면이 프로필 카드로 전환한다. 폼만 비워 둔다.
      password = "";
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
    padding: 3rem 1rem;
  }

  .auth-card {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  h2 {
    margin: 0;
    color: #ff3e00;
  }

  .subtitle {
    margin: -0.5rem 0 0.5rem;
    color: #666;
    font-size: 0.9rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
  }

  .optional {
    color: #999;
    font-weight: 400;
  }

  input {
    padding: 0.7rem 0.85rem;
    border: 2px solid #eee;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  .error {
    padding: 0.7rem 0.85rem;
    background: #fdecea;
    color: #c0392b;
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .submit {
    margin-top: 0.5rem;
    padding: 0.8rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .submit:hover:not(:disabled) {
    background: #e63600;
  }

  .submit:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .toggle {
    background: none;
    border: none;
    color: #ff3e00;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .toggle:hover {
    text-decoration: underline;
  }
</style>
