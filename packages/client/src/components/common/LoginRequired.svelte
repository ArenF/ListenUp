<script lang="ts">
  interface Props {
    /** 무엇 때문에 로그인이 필요한지 */
    message: string;
    /** "로그인하러 가기" (계정 페이지로 이동) */
    onLogin: () => void;
  }

  let { message, onLogin }: Props = $props();
</script>

<div class="login-required">
  <p>🔒 {message}</p>
  <button class="login-cta" onclick={onLogin}>로그인하러 가기</button>
</div>

<style>
  .login-required {
    max-width: 400px;
    margin: var(--space-16) auto;
    padding: 2.5rem var(--space-8);
    text-align: center;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
  }

  .login-required p {
    margin: 0 0 var(--space-6);
    color: var(--text-secondary);
    font-size: var(--font-size-base);
  }

  .login-cta {
    padding: 0.8rem var(--space-6);
    background: var(--accent);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s;
  }

  .login-cta:hover {
    background: color-mix(in srgb, var(--accent) 85%, black);
  }
</style>
