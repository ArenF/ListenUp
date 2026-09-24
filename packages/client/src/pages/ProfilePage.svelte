<script lang="ts">
  import { authStore } from "../stores/auth.svelte";
  import { DEFAULT_AVATARS } from "../utils/avatars";

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

  // 회원증 번호처럼 회원 ID 앞부분을 대문자 영숫자로 정리한다
  const memberNo = $derived(
    user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase() || "0000000000"
  );

  // 4자리씩 끊어 신분증 번호처럼 보이게 한다 (예: LU-1A2B-3C4D-5E)
  const memberNoDisplay = $derived("LU-" + (memberNo.match(/.{1,4}/g)?.join("-") ?? memberNo));

  // ==========================================================================
  // ⚠️ MOCK 스탯 — 아직 서버에 게임 통계 저장 파이프라인이 없다.
  // 카드 디자인을 눈으로 확인하기 위한 임시 값이다.
  // 추후 GET /api/users/:id/stats 로 교체한다. (user_stats 테이블 필요)
  // ==========================================================================
  const stats = {
    level: 42,
    bestStreak: 27, // 대표 스탯
    gamesPlayed: 128,
    winRate: 63, // %
    accuracy: 71, // %
    fastest: 1.4, // 초
    favoriteGenre: "K-POP",
    title: "장르 마스터",
  };

  /** 레벨을 4단계 티어로 환산한다 (mock: level 기준) */
  const tier = $derived.by(() => {
    const lv = stats.level;
    if (lv >= 40) return { key: "master", label: "MASTER", star: "★★★★" };
    if (lv >= 25) return { key: "gold", label: "GOLD", star: "★★★" };
    if (lv >= 10) return { key: "silver", label: "SILVER", star: "★★" };
    return { key: "bronze", label: "BRONZE", star: "★" };
  });

  // 마우스 위치에 따라 카드를 살짝 기울인다 (수집형 카드 느낌)
  let tiltX = $state(0);
  let tiltY = $state(0);

  function onCardMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width; // 0~1
    const py = (event.clientY - rect.top) / rect.height; // 0~1
    tiltY = (px - 0.5) * 16; // 좌우 회전
    tiltX = (0.5 - py) * 16; // 상하 회전
  }

  function onCardLeave() {
    tiltX = 0;
    tiltY = 0;
  }

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
  <!-- 수집형 플레이어 카드 (티어별 프레임 + hover tilt) -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <article
    class="player-card {tier.key}"
    style="transform: perspective(900px) rotateX({tiltX}deg) rotateY({tiltY}deg);"
    onmousemove={onCardMove}
    onmouseleave={onCardLeave}
  >
    <!-- 티어 광택 오버레이 -->
    <span class="shine" aria-hidden="true"></span>

    <!-- 상단: 등급 + 레벨 -->
    <header class="card-top">
      <span class="tier-badge">{tier.star} {tier.label}</span>
      <span class="level">Lv.{stats.level}</span>
    </header>

    <!-- 히어로: 아바타 + 이름 + 칭호 -->
    <div class="hero">
      <div class="photo">
        {#if user.avatar}
          <img src={user.avatar} alt={user.nickname} />
        {:else}
          <span class="initial">{initial}</span>
        {/if}
      </div>
      <div class="who">
        <span class="name">{user.nickname}</span>
        <span class="title">“{stats.title}”</span>
        <span class="email">{user.email}</span>
      </div>
    </div>

    <!-- 대표 스탯 -->
    <div class="signature">
      <span class="big">🔥 {stats.bestStreak}</span>
      <span class="cap">BEST STREAK · 최고 연속 정답</span>
    </div>

    <!-- 보조 스탯 그리드 -->
    <ul class="stat-grid">
      <li><span class="num">{stats.gamesPlayed}</span><span class="lbl">게임</span></li>
      <li><span class="num">{stats.winRate}%</span><span class="lbl">승률</span></li>
      <li><span class="num">{stats.accuracy}%</span><span class="lbl">정답률</span></li>
      <li><span class="num">{stats.fastest}s</span><span class="lbl">최속</span></li>
    </ul>

    <!-- 하단: 바코드 + 최애 장르 + 회원번호 -->
    <footer class="strip">
      <span class="bars" aria-hidden="true"></span>
      <span class="fav">🎵 {stats.favoriteGenre}</span>
      <span class="member-no">{memberNoDisplay} · {joinedAt}</span>
    </footer>

    <!-- 아직 실제 통계가 없다는 표시 (교체 예정) -->
    <span class="mock-flag">MOCK</span>
  </article>

  <!-- 아바타 변경 -->
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

  <button class="logout" onclick={() => authStore.logout()}>로그아웃</button>
</div>

<style>
  .profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-12) var(--space-4);
  }

  /* ======================== 수집형 플레이어 카드 ======================== */
  .player-card {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 1.1rem var(--space-5) 0;
    border-radius: 20px;
    overflow: hidden;
    color: var(--card-ink);
    /* 티어별로 배경/테두리를 덮어쓴다 (아래 .bronze/.silver/... 참고) */
    background: var(--card-bg);
    border: 2px solid var(--card-border);
    box-shadow: var(--card-shadow);
    transition: box-shadow 0.2s, transform 0.12s ease-out;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .player-card:hover {
    box-shadow: var(--card-shadow-hover);
  }

  /* 티어별 프레임 -------------------------------------------------- */
  .player-card.bronze {
    background: var(--tier-bronze-bg);
    border-color: var(--tier-bronze-border);
  }
  .player-card.silver {
    background: var(--tier-silver-bg);
    border-color: var(--tier-silver-border);
  }
  .player-card.gold {
    background: var(--tier-gold-bg);
    border-color: var(--tier-gold-border);
  }
  .player-card.master {
    background: var(--tier-master-bg);
    border-color: var(--tier-master-border);
  }

  /* 광택 스윕: 마스터 티어에서만 은은히 흐른다 */
  .shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      115deg,
      transparent 30%,
      var(--card-shine) 45%,
      transparent 60%
    );
    background-size: 250% 250%;
    opacity: 0;
    transition: opacity 0.3s;
  }
  .player-card.gold .shine,
  .player-card.master .shine {
    opacity: 1;
    animation: sweep 4.5s linear infinite;
  }
  @keyframes sweep {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -50% 0;
    }
  }

  /* 상단: 등급 + 레벨 */
  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }

  .tier-badge {
    font-family: "Courier New", monospace;
    font-weight: 800;
    font-size: 0.72rem;
    letter-spacing: 1px;
    padding: var(--space-1) 0.6rem;
    border-radius: var(--radius-full);
    color: var(--card-on-highlight);
    background: var(--tier-bronze-badge);
  }
  .silver .tier-badge {
    background: var(--tier-silver-badge);
  }
  .gold .tier-badge {
    background: var(--tier-gold-badge);
    color: var(--tier-gold-badge-text);
  }
  .master .tier-badge {
    background: var(--tier-master-badge);
  }

  .level {
    font-family: "Courier New", monospace;
    font-weight: 800;
    font-size: 0.95rem;
    color: var(--card-highlight);
  }

  /* 히어로 */
  .hero {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) 0 1.1rem;
    position: relative;
    z-index: 1;
  }

  .photo {
    position: relative;
    width: 92px;
    height: 92px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    background: var(--card-avatar-bg);
    border: 3px solid var(--card-on-highlight);
    outline: 2px solid var(--card-line);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--card-avatar-shadow);
  }

  .photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .initial {
    color: white;
    font-size: 2.4rem;
    font-weight: 800;
  }

  .who {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .who .name {
    font-weight: 800;
    font-size: 1.4rem;
    color: var(--card-ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .who .title {
    font-size: var(--font-size-xs);
    font-weight: 700;
    color: var(--card-highlight);
  }

  .who .email {
    font-size: var(--font-size-2xs);
    color: var(--card-ink-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 대표 스탯 */
  .signature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    padding: 0.9rem 0;
    border-top: 1px dashed var(--card-divider);
    border-bottom: 1px dashed var(--card-divider);
    position: relative;
    z-index: 1;
  }

  .signature .big {
    font-size: 2.6rem;
    font-weight: 900;
    line-height: 1;
    color: var(--card-highlight);
  }

  .signature .cap {
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    letter-spacing: 1px;
    color: var(--card-ink-warm);
    text-transform: uppercase;
  }

  /* 보조 스탯 그리드 */
  .stat-grid {
    list-style: none;
    margin: 0;
    padding: var(--space-4) 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
    position: relative;
    z-index: 1;
  }

  .stat-grid li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
  }

  .stat-grid .num {
    font-weight: 800;
    font-size: 1.15rem;
    color: var(--card-ink);
  }

  .stat-grid .lbl {
    font-size: 0.68rem;
    color: var(--card-ink-muted);
  }

  /* 하단 바코드 스트립 */
  .strip {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin: 0 calc(var(--space-5) * -1);
    padding: 0.6rem var(--space-5) var(--space-3);
    border-top: 1px dashed var(--card-line);
    background: var(--card-footer-bg);
    position: relative;
    z-index: 1;
  }

  .bars {
    flex: 1;
    height: 22px;
    background-image: repeating-linear-gradient(
      90deg,
      var(--card-ink) 0,
      var(--card-ink) 2px,
      transparent 2px,
      transparent 4px,
      var(--card-ink) 4px,
      var(--card-ink) 7px,
      transparent 7px,
      transparent 9px,
      var(--card-ink) 9px,
      var(--card-ink) 10px,
      transparent 10px,
      transparent 14px
    );
    opacity: 0.8;
    border-radius: 2px;
  }

  .fav {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--card-ink-soft);
    white-space: nowrap;
  }

  .member-no {
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--card-highlight);
    white-space: nowrap;
  }

  /* MOCK 표시 (실제 통계 연동 시 제거) */
  .mock-flag {
    position: absolute;
    top: 0.6rem;
    right: -2.1rem;
    transform: rotate(45deg);
    background: var(--card-ribbon-bg);
    color: var(--card-on-highlight);
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 0.15rem var(--space-8);
    z-index: 2;
  }

  /* ======================== 아바타 변경 ======================== */
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

  @media (max-width: 420px) {
    .hero {
      flex-direction: column;
      text-align: center;
    }
    .who .name,
    .who .email {
      white-space: normal;
    }
    .stat-grid .num {
      font-size: var(--font-size-base);
    }
  }
</style>
