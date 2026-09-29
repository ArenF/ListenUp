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

  /** 파일 선택 → 업로드 */
  async function onFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await authStore.uploadAvatar(file);
    } catch {
      // 에러는 authStore.error로 표시된다
    }
    // 같은 파일을 다시 선택해도 change가 발생하도록 초기화
    input.value = "";
  }
</script>

<!-- 아바타 변경 (기본 아바타 선택 또는 업로드) -->
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

  <label class="upload" class:disabled={authStore.loading}>
    {authStore.loading ? "처리 중..." : "📷 이미지 업로드"}
    <input
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      onchange={onFileChange}
      disabled={authStore.loading}
    />
  </label>
  <p class="upload-hint">PNG · JPG · WebP · GIF / 최대 5MB</p>
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
    margin-bottom: var(--space-4);
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

  .upload {
    display: block;
    padding: 0.7rem;
    text-align: center;
    background: color-mix(in srgb, var(--accent) 6%, var(--bg-surface));
    border: 2px dashed color-mix(in srgb, var(--accent) 40%, var(--bg-surface));
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .upload.disabled {
    opacity: 0.6;
    cursor: default;
  }

  .upload input {
    display: none;
  }

  .upload-hint {
    margin: var(--space-2) 0 0;
    font-size: var(--font-size-2xs);
    color: var(--text-secondary);
    text-align: center;
  }
</style>
