<script lang="ts">
  import { authStore } from "./authStore.svelte";

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
