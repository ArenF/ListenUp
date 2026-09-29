<script lang="ts">
  import ProfileCard from "../components/account/ProfileCard.svelte";
  import AvatarPicker from "../components/account/AvatarPicker.svelte";
  import LoginForm from "../components/account/LoginForm.svelte";
  import { authStore } from "../stores/auth.svelte";
  import type { PlayerStats } from "../utils/profile";

  // ==========================================================================
  // ⚠️ MOCK 스탯 — 아직 서버에 게임 통계 저장 파이프라인이 없다.
  // 카드 디자인을 눈으로 확인하기 위한 임시 값이다.
  // 추후 GET /api/users/:id/stats 로 교체한다. (user_stats 테이블 필요)
  // ==========================================================================
  const stats: PlayerStats = {
    level: 42,
    bestStreak: 27,
    gamesPlayed: 128,
    winRate: 63,
    accuracy: 71,
    fastest: 1.4,
    favoriteGenre: "K-POP",
    title: "장르 마스터",
  };
</script>

<!-- 로그인 전에는 로그인·회원가입 폼, 로그인하면 프로필 -->
{#if authStore.user}
  <div class="profile">
    <ProfileCard user={authStore.user} {stats} mock />

    <AvatarPicker />

    <button class="logout" onclick={() => authStore.logout()}>로그아웃</button>
  </div>
{:else}
  <LoginForm />
{/if}

<style>
  .profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-12) var(--space-4);
  }

  /* 로그아웃 */
  .logout {
    width: 100%;
    max-width: 520px;
    padding: 0.8rem;
    background: var(--bg-surface);
    color: var(--color-danger);
    border: 2px solid var(--color-danger);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout:hover {
    background: var(--color-danger);
    color: var(--text-on-accent);
  }

  /* 모바일 */
  @media (max-width: 480px) {
    .profile {
      padding: var(--space-8) var(--space-2);
    }
  }
</style>
