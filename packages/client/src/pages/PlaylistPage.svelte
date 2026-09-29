<script lang="ts">
  import { onMount } from "svelte";
  import PlaylistForm from "../components/playlist/PlaylistForm.svelte";
  import PlaylistSidebar from "../components/playlist/PlaylistSidebar.svelte";
  import TrackForm from "../components/playlist/TrackForm.svelte";
  import TrackList from "../components/playlist/TrackList.svelte";
  import { playlistStore } from "../stores/playlist.svelte";
  import { AnswerList } from "../stores/answerList.svelte";
  import { TrackSearch } from "../stores/trackSearch.svelte";
  import { toErrorMessage } from "../utils/error";
  import { authStore } from "../stores/auth.svelte";

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
    <PlaylistSidebar onCreate={openCreateForm} />

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
    padding: var(--space-8);
    max-width: 1400px;
    margin: 0 auto;
  }

  h1 {
    margin-bottom: var(--space-8);
    color: var(--text-primary);
  }

  .error-message {
    padding: var(--space-4);
    background-color: color-mix(in srgb, var(--color-danger) 12%, var(--bg-surface));
    color: var(--color-danger);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
  }

  .content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--space-8);
    min-height: 600px;
  }

  /* 메인 컨텐츠 */
  .main-content {
    background-color: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-8);
  }

  .playlist-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-8);
    padding-bottom: var(--space-4);
    border-bottom: 2px solid var(--border);
  }

  .playlist-info h2 {
    margin: 0 0 var(--space-2) 0;
    color: var(--text-primary);
  }

  .playlist-info p {
    margin: 0;
    color: var(--text-secondary);
  }

  .owner-label {
    display: inline-block;
    margin-top: var(--space-2);
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .playlist-actions {
    display: flex;
    gap: var(--space-2);
  }

  button {
    padding: var(--space-3) var(--space-6);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: var(--accent);
    color: var(--text-on-accent);
  }

  .btn-primary:hover {
    background-color: color-mix(in srgb, var(--accent) 85%, black);
  }

  .btn-secondary {
    background-color: var(--bg-surface);
    color: var(--accent);
    border: 2px solid var(--border);
  }

  .btn-secondary:hover {
    border-color: var(--accent);
  }

  .btn-danger {
    background-color: var(--color-danger);
    color: var(--text-on-accent);
  }

  .btn-danger:hover {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }

  .empty-state {
    text-align: center;
    padding: var(--space-16) var(--space-8);
    color: var(--text-secondary);
  }

  .empty-state h2 {
    margin-bottom: var(--space-4);
  }

  /* 반응형 */
  @media (max-width: 768px) {
    .content {
      grid-template-columns: 1fr;
    }
  }
</style>
