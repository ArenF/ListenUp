<script lang="ts">
  import { onMount } from "svelte";
  import PlaylistForm from "./PlaylistForm.svelte";
  import TrackForm from "./TrackForm.svelte";
  import TrackList from "./TrackList.svelte";
  import { playlistStore } from "./playlistStore.svelte";
  import { AnswerList } from "./answerList.svelte";
  import { TrackSearch } from "./trackSearch.svelte";
  import { toErrorMessage } from "../../utils/error";
  import { authStore } from "../login/authStore.svelte";

  // 선택된 플레이리스트를 현재 사용자가 수정할 수 있는지 (작성자 본인만)
  const canEditSelected = $derived(
    !!playlistStore.selected?.ownerId &&
      playlistStore.selected?.ownerId === authStore.user?.id
  );

  // 플레이리스트 생성/수정 모달
  let showPlaylistForm = $state(false);
  let formMode = $state<"create" | "edit">("create");
  let formName = $state("");
  let formDescription = $state("");

  // 트랙 추가 모달
  let showTrackForm = $state(false);
  const trackSearch = new TrackSearch();
  const newAnswers = new AnswerList();

  // 트랙 정답 수정 (목록 안에서 인라인으로 열린다)
  let editingTrackId = $state<string | null>(null);
  const editAnswers = new AnswerList();

  onMount(() => {
    playlistStore.load();
  });

  function openCreateForm() {
    formMode = "create";
    formName = "";
    formDescription = "";
    showPlaylistForm = true;
  }

  function openEditForm() {
    const selected = playlistStore.selected;
    if (!selected) return;

    formMode = "edit";
    formName = selected.name;
    formDescription = selected.description;
    showPlaylistForm = true;
  }

  async function savePlaylist() {
    const name = formName.trim();
    if (!name) {
      alert("플레이리스트 이름을 입력해주세요");
      return;
    }

    const description = formDescription.trim();

    try {
      if (formMode === "create") {
        await playlistStore.create(name, description);
      } else {
        await playlistStore.update(name, description);
      }
      showPlaylistForm = false;
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }

  async function deletePlaylist() {
    const selected = playlistStore.selected;
    if (!selected) return;
    if (!confirm(`"${selected.name}" 플레이리스트를 삭제하시겠습니까?`)) return;

    try {
      await playlistStore.remove();
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }

  async function searchTrack() {
    try {
      await trackSearch.search();
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }

  function closeTrackForm() {
    showTrackForm = false;
    trackSearch.reset();
    newAnswers.reset();
  }

  async function addTrack() {
    if (!trackSearch.track) return;

    try {
      await playlistStore.addTrack(trackSearch.track, newAnswers.filled);
      closeTrackForm();
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }

  async function removeTrack(videoId: string) {
    const track = playlistStore.tracks.find((t) => t.id === videoId);
    if (!track || !confirm(`"${track.name}"을(를) 제거하시겠습니까?`)) return;

    try {
      await playlistStore.removeTrack(videoId);
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }

  function startEditTrack(videoId: string) {
    editingTrackId = videoId;
    editAnswers.reset(playlistStore.answersOf(videoId));
  }

  function cancelEditTrack() {
    editingTrackId = null;
    editAnswers.reset();
  }

  async function saveTrackAnswers(videoId: string) {
    try {
      await playlistStore.updateTrackAnswers(videoId, editAnswers.filled);
      cancelEditTrack();
      alert("정답이 업데이트되었습니다!");
    } catch (err) {
      alert(toErrorMessage(err));
    }
  }
</script>

<div class="playlist-manager">
  <h1>🎵 플레이리스트 관리</h1>

  {#if playlistStore.error}
    <div class="error-message">{playlistStore.error}</div>
  {/if}

  <div class="content">
    <!-- 플레이리스트 목록 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>플레이리스트</h2>
        <button class="btn-create" onclick={openCreateForm}>
          ➕ 새로 만들기
        </button>
      </div>

      {#if playlistStore.loading && playlistStore.playlists.length === 0}
        <div class="loading">로딩 중...</div>
      {:else if playlistStore.playlists.length === 0}
        <div class="empty-message">
          플레이리스트가 없습니다.
          <br />
          새로 만들어보세요!
        </div>
      {:else}
        <div class="playlist-list">
          {#each playlistStore.playlists as playlist}
            <div
              class="playlist-item"
              class:active={playlistStore.selected?.id === playlist.id}
              onclick={() => playlistStore.select(playlist)}
            >
              <div class="playlist-name">{playlist.name}</div>
              <div class="playlist-count">
                {playlist.tracks?.length || 0} 트랙
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 플레이리스트 상세 -->
    <div class="main-content">
      {#if playlistStore.selected}
        <div class="playlist-header">
          <div class="playlist-info">
            <h2>{playlistStore.selected.name}</h2>
            <p>{playlistStore.selected.description || "설명 없음"}</p>
            <span class="owner-label">
              {#if !playlistStore.selected.ownerId}
                🎵 기본 제공
              {:else if canEditSelected}
                👤 내 플레이리스트
              {:else}
                👤 by {playlistStore.selected.ownerNickname ?? "다른 사용자"}
              {/if}
            </span>
          </div>
          {#if canEditSelected}
            <div class="playlist-actions">
              <button class="btn-secondary" onclick={openEditForm}>
                ✏️ 수정
              </button>
              <button class="btn-danger" onclick={deletePlaylist}>
                🗑️ 삭제
              </button>
              <button class="btn-primary" onclick={() => (showTrackForm = true)}>
                ➕ 트랙 추가
              </button>
            </div>
          {/if}
        </div>

        <TrackList
          tracks={playlistStore.tracks}
          playlistTracks={playlistStore.selected.tracks}
          {editingTrackId}
          {editAnswers}
          canEdit={canEditSelected}
          onStartEdit={startEditTrack}
          onCancelEdit={cancelEditTrack}
          onSave={saveTrackAnswers}
          onRemove={removeTrack}
        />
      {:else}
        <div class="empty-state">
          <h2>플레이리스트를 선택하세요</h2>
          <p>왼쪽에서 플레이리스트를 선택하거나 새로 만들어보세요!</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- 모달들 -->
<PlaylistForm
  show={showPlaylistForm}
  mode={formMode}
  bind:name={formName}
  bind:description={formDescription}
  onClose={() => (showPlaylistForm = false)}
  onSave={savePlaylist}
/>

<TrackForm
  show={showTrackForm}
  search={trackSearch}
  answers={newAnswers}
  onClose={closeTrackForm}
  onSearch={searchTrack}
  onAdd={addTrack}
/>

<style>
  .playlist-manager {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: 2rem;
    color: #333;
  }

  .error-message {
    padding: 1rem;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    min-height: 600px;
  }

  /* 사이드바 */
  .sidebar {
    background-color: #f9f9f9;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.3rem;
    color: #333;
  }

  .btn-create {
    padding: 0.5rem 1rem;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .btn-create:hover {
    background-color: #e63900;
  }

  .loading,
  .empty-message {
    text-align: center;
    padding: 2rem;
    color: #999;
  }

  .playlist-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .playlist-item {
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .playlist-item:hover {
    border-color: #ff3e00;
    transform: translateX(4px);
  }

  .playlist-item.active {
    background-color: #fff3e0;
    border-color: #ff3e00;
  }

  .playlist-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .playlist-count {
    font-size: 0.85rem;
    color: #666;
  }

  /* 메인 컨텐츠 */
  .main-content {
    background-color: #f9f9f9;
    border-radius: 12px;
    padding: 2rem;
  }

  .playlist-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #e0e0e0;
  }

  .playlist-info h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
  }

  .playlist-info p {
    margin: 0;
    color: #666;
  }

  .owner-label {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    font-weight: 600;
    color: #888;
  }

  .playlist-actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #ff3e00;
    color: white;
  }

  .btn-primary:hover {
    background-color: #e63900;
  }

  .btn-secondary {
    background-color: #2196f3;
    color: white;
  }

  .btn-secondary:hover {
    background-color: #1976d2;
  }

  .btn-danger {
    background-color: #f44336;
    color: white;
  }

  .btn-danger:hover {
    background-color: #d32f2f;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #999;
  }

  .empty-state h2 {
    margin-bottom: 1rem;
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }

    .sidebar {
      margin-bottom: 2rem;
    }
  }
</style>
