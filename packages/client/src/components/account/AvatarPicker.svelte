<script lang="ts">
  import { authStore } from "../../stores/auth.svelte";
  import { DEFAULT_AVATARS } from "../../utils/avatars";

  // 로그인 상태에서만 렌더링되므로 user는 존재한다
  const user = $derived(authStore.user!);

  /** 기본 아바타 선택 */
  async function selectPreset(url: string) {
    if (user.avatar === url) return;
    try {
      await authStore.updateProfile({ avatar: url });
    } catch {
      // 에러는 authStore.error로 표시된다
    }
  }
</script>

<!-- 아바타 변경 (기본 아바타 중에서 선택) -->
<section class="avatar-edit">
  <h3>사진 변경</h3>

  {#if authStore.error}
    <div class="error" role="alert">{authStore.error}</div>
  {/if}

  <div class="presets">
    {#each DEFAULT_AVATARS as preset}
      <button
        type="button"
        class="preset"
        class:selected={user.avatar === preset}
        onclick={() => selectPreset(preset)}
        disabled={authStore.loading}
        title="기본 아바타 선택"
      >
        <img src={preset} alt="기본 아바타" />
      </button>
    {/each}
  </div>
</section>

<style>
  .avatar-edit {
    width: 100%;
    max-width: 520px;
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-accent-soft);
  }

  .avatar-edit h3 {
    margin: 0 0 0.9rem;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .error {
    padding: 0.6rem var(--space-3);
    margin-bottom: var(--space-3);
    background: color-mix(in srgb, var(--color-danger) 10%, var(--bg-surface));
    color: var(--color-danger);
    border-radius: var(--radius-md);
    font-size: 0.8rem;
  }

  .presets {
    display: flex;
    gap: var(--space-3);
  }

  .preset {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 3px solid transparent;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    background: color-mix(in srgb, var(--accent) 8%, var(--bg-surface));
    transition: border-color 0.2s;
  }

  .preset img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .preset.selected {
    border-color: var(--accent);
  }

  .preset:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
