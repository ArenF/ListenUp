<script lang="ts">
  import { authStore } from "./authStore.svelte";
  import { DEFAULT_AVATARS } from "../../avatars";

  // 로그인 상태에서만 렌더링되므로 user는 존재한다
  const user = $derived(authStore.user!);

  // 아바타 URL이 없으면 닉네임 첫 글자로 대체한다
  const initial = $derived((user.nickname || user.email).charAt(0).toUpperCase());

  const joinedAt = $derived(
    new Date(user.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  );

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

<div class="profile">
  <div class="card">
    <div class="avatar">
      {#if user.avatar}
        <img src={user.avatar} alt={user.nickname} />
      {:else}
        <span class="initial">{initial}</span>
      {/if}
    </div>

    <h2 class="nickname">{user.nickname}</h2>
    <p class="email-sub">{user.email}</p>

    <dl class="details">
      <div class="row">
        <dt>가입일</dt>
        <dd>{joinedAt}</dd>
      </div>
    </dl>

    <!-- 아바타 변경 -->
    <div class="avatar-edit">
      <h3>아바타 변경</h3>

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
    </div>

    <button class="logout" onclick={() => authStore.logout()}>로그아웃</button>
  </div>
</div>

<style>
  .profile {
    display: flex;
    justify-content: center;
    padding: 3rem 1rem;
  }

  .card {
    width: 100%;
    max-width: 380px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ff3e00;
    margin-bottom: 0.5rem;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .initial {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
  }

  .nickname {
    margin: 0;
    color: #333;
  }

  .email-sub {
    margin: 0;
    color: #999;
    font-size: 0.9rem;
  }

  .details {
    width: 100%;
    margin: 1.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
  }

  dt {
    color: #999;
    font-weight: 600;
  }

  dd {
    margin: 0;
    color: #333;
  }

  /* 아바타 변경 */
  .avatar-edit {
    width: 100%;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #f0f0f0;
  }

  .avatar-edit h3 {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: #555;
  }

  .error {
    padding: 0.6rem 0.75rem;
    margin-bottom: 0.75rem;
    background: #fdecea;
    color: #c0392b;
    border-radius: 8px;
    font-size: 0.8rem;
  }

  .presets {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .preset {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 3px solid transparent;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    background: #f0f0f0;
    transition: border-color 0.2s;
  }

  .preset img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .preset.selected {
    border-color: #ff3e00;
  }

  .preset:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .upload {
    display: block;
    padding: 0.7rem;
    text-align: center;
    background: #f5f5f5;
    border: 2px dashed #ccc;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #555;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload:hover {
    border-color: #ff3e00;
    color: #ff3e00;
  }

  .upload.disabled {
    opacity: 0.6;
    cursor: default;
  }

  .upload input {
    display: none;
  }

  .upload-hint {
    margin: 0.5rem 0 0;
    font-size: 0.75rem;
    color: #aaa;
    text-align: center;
  }

  .logout {
    width: 100%;
    margin-top: 1.5rem;
    padding: 0.8rem;
    background: white;
    color: #ff3e00;
    border: 2px solid #ff3e00;
    border-radius: 8px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout:hover {
    background: #ff3e00;
    color: white;
  }
</style>
