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
    gap: 1.25rem;
    padding: 3rem 1rem;
  }

  /* ======================== 수집형 플레이어 카드 ======================== */
  .player-card {
    position: relative;
    width: 100%;
    max-width: 400px;
    padding: 1.1rem 1.25rem 0;
    border-radius: 20px;
    overflow: hidden;
    color: #3a2c22;
    /* 티어별로 배경/테두리를 덮어쓴다 (아래 .bronze/.silver/... 참고) */
    background: linear-gradient(160deg, #fffaf3, #ffe9d2);
    border: 2px solid #ffd6b0;
    box-shadow: 0 18px 40px rgba(255, 62, 0, 0.18);
    transition: box-shadow 0.2s, transform 0.12s ease-out;
    transform-style: preserve-3d;
    will-change: transform;
  }

  .player-card:hover {
    box-shadow: 0 26px 60px rgba(255, 62, 0, 0.28);
  }

  /* 티어별 프레임 -------------------------------------------------- */
  .player-card.bronze {
    background: linear-gradient(160deg, #fdf1e6, #eccdb2);
    border-color: #d9a978;
  }
  .player-card.silver {
    background: linear-gradient(160deg, #fbfcfe, #d7dde6);
    border-color: #b8c2d0;
  }
  .player-card.gold {
    background: linear-gradient(160deg, #fff8e0, #ffe08a);
    border-color: #e6b422;
  }
  .player-card.master {
    background: linear-gradient(135deg, #fff2e6 0%, #ffd1e8 35%, #d9e4ff 70%, #d6fff2 100%);
    border-color: #ff6b3d;
  }

  /* 광택 스윕: 마스터 티어에서만 은은히 흐른다 */
  .shine {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      115deg,
      transparent 30%,
      rgba(255, 255, 255, 0.55) 45%,
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
    padding: 0.25rem 0.6rem;
    border-radius: 999px;
    color: #fff;
    background: linear-gradient(135deg, #ff6b3d, #ff3e00);
  }
  .silver .tier-badge {
    background: linear-gradient(135deg, #9aa6b5, #6f7c8d);
  }
  .gold .tier-badge {
    background: linear-gradient(135deg, #f6c454, #e6a017);
    color: #4a3b30;
  }
  .master .tier-badge {
    background: linear-gradient(135deg, #ff6b3d, #d94ea8, #6d7cff);
  }

  .level {
    font-family: "Courier New", monospace;
    font-weight: 800;
    font-size: 0.95rem;
    color: #ff3e00;
  }

  /* 히어로 */
  .hero {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0 1.1rem;
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
    background: linear-gradient(160deg, #ffb183, #ff8a5b);
    border: 3px solid #fff;
    outline: 2px solid #ffcaa6;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.18);
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
    color: #3a2c22;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .who .title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #ff3e00;
  }

  .who .email {
    font-size: 0.75rem;
    color: #9a7b5f;
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
    border-top: 1px dashed rgba(255, 122, 60, 0.4);
    border-bottom: 1px dashed rgba(255, 122, 60, 0.4);
    position: relative;
    z-index: 1;
  }

  .signature .big {
    font-size: 2.6rem;
    font-weight: 900;
    line-height: 1;
    color: #ff3e00;
  }

  .signature .cap {
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    letter-spacing: 1px;
    color: #c07a4a;
    text-transform: uppercase;
  }

  /* 보조 스탯 그리드 */
  .stat-grid {
    list-style: none;
    margin: 0;
    padding: 1rem 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
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
    color: #3a2c22;
  }

  .stat-grid .lbl {
    font-size: 0.68rem;
    color: #9a7b5f;
  }

  /* 하단 바코드 스트립 */
  .strip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 -1.25rem;
    padding: 0.6rem 1.25rem 0.75rem;
    border-top: 1px dashed #ffcaa6;
    background: rgba(255, 255, 255, 0.4);
    position: relative;
    z-index: 1;
  }

  .bars {
    flex: 1;
    height: 22px;
    background-image: repeating-linear-gradient(
      90deg,
      #3a2c22 0,
      #3a2c22 2px,
      transparent 2px,
      transparent 4px,
      #3a2c22 4px,
      #3a2c22 7px,
      transparent 7px,
      transparent 9px,
      #3a2c22 9px,
      #3a2c22 10px,
      transparent 10px,
      transparent 14px
    );
    opacity: 0.8;
    border-radius: 2px;
  }

  .fav {
    font-size: 0.72rem;
    font-weight: 700;
    color: #7a5a44;
    white-space: nowrap;
  }

  .member-no {
    font-family: "Courier New", monospace;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: #ff3e00;
    white-space: nowrap;
  }

  /* MOCK 표시 (실제 통계 연동 시 제거) */
  .mock-flag {
    position: absolute;
    top: 0.6rem;
    right: -2.1rem;
    transform: rotate(45deg);
    background: rgba(58, 44, 34, 0.75);
    color: #fff;
    font-size: 0.55rem;
    font-weight: 800;
    letter-spacing: 2px;
    padding: 0.15rem 2rem;
    z-index: 2;
  }

  /* ======================== 아바타 변경 ======================== */
  .avatar-edit {
    width: 100%;
    max-width: 520px;
    padding: 1.5rem;
    background: white;
    border: 1px solid #ffe1c9;
    border-radius: 16px;
    box-shadow: 0 6px 18px rgba(255, 62, 0, 0.06);
  }

  .avatar-edit h3 {
    margin: 0 0 0.9rem;
    font-size: 0.9rem;
    color: #7a5a44;
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
    background: #fbeee2;
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
    background: #fff6ee;
    border: 2px dashed #ffc9a3;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #7a5a44;
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
    color: #c3a88f;
    text-align: center;
  }

  /* 로그아웃 */
  .logout {
    width: 100%;
    max-width: 520px;
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

  /* 모바일 */
  @media (max-width: 480px) {
    .profile {
      padding: 2rem 0.5rem;
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
      font-size: 1rem;
    }
  }
</style>
