<script lang="ts">
  import { onMount } from "svelte";
  import PlaylistForm from "./PlaylistForm.svelte";
  import TrackForm from "./TrackForm.svelte";
  import TrackList from "./TrackList.svelte";
  import { logger } from "../../utils/logger";

  // 타입 정의
  interface Hint {
    showAtSeconds: number;
    text: string;
  }

  interface PlaylistTrack {
    videoId: string;
    answers: string[];
    hints?: Hint[];
    startSeconds?: number;
    endSeconds?: number;
  }

  interface Playlist {
    id: string;
    name: string;
    description: string;
    tracks: PlaylistTrack[];
    roundCount: number;
  }

  interface Track {
    id: string;
    name: string;
    artist: string;
    duration: number;
    startSeconds: number;
    endSeconds: number;
  }

  // 상태 관리
  let playlists = $state<Playlist[]>([]);
  let selectedPlaylist = $state<Playlist | null>(null);
  let tracks = $state<Track[]>([]);
  let loading = $state(false);
  let error = $state("");

  // 플레이리스트 생성/수정 폼
  let showPlaylistForm = $state(false);
  let formMode = $state<"create" | "edit">("create");
  let formName = $state("");
  let formDescription = $state("");

  // 트랙 추가 폼
  let showTrackForm = $state(false);
  let youtubeUrl = $state("");
  let videoId = $state("");
  let trackInfo = $state<Track | null>(null);
  let loadingTrack = $state(false);
  let answers = $state<string[]>([""]); // 정답 목록
  let hints = $state<Hint[]>([]); // 힌트 목록
  let startSeconds = $state<number | undefined>(undefined); // 시작 시간 (초)
  let endSeconds = $state<number | undefined>(undefined); // 종료 시간 (초)

  // 트랙 수정 폼
  let editingTrackId = $state<string | null>(null);
  let editAnswers = $state<string[]>([]);
  let editHints = $state<Hint[]>([]);
  let editStartSeconds = $state<number | undefined>(undefined); // 수정용 시작 시간
  let editEndSeconds = $state<number | undefined>(undefined); // 수정용 종료 시간

  onMount(() => {
    loadPlaylists();
  });

  // 플레이리스트 목록 로드
  async function loadPlaylists() {
    try {
      loading = true;
      error = "";
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
      playlists = await response.json();
    } catch (err: any) {
      error = err.message;
      console.error("Error loading playlists:", err);
    } finally {
      loading = false;
    }
  }

  // 플레이리스트 선택
  async function selectPlaylist(playlist: Playlist) {
    selectedPlaylist = playlist;
    tracks = [];

    if (playlist.tracks.length > 0) {
      try {
        const trackPromises = playlist.tracks.map((t) =>
          fetch(`/api/youtube/track/${t.videoId}`).then((res) =>
            res.ok ? res.json() : null
          )
        );
        const trackResults = await Promise.all(trackPromises);
        tracks = trackResults.filter((t) => t !== null);
      } catch (err) {
        console.error("Error loading tracks:", err);
      }
    }
  }

  // 플레이리스트 생성 폼 열기
  function openCreateForm() {
    formMode = "create";
    formName = "";
    formDescription = "";
    showPlaylistForm = true;
  }

  // 플레이리스트 수정 폼 열기
  function openEditForm() {
    if (!selectedPlaylist) return;
    formMode = "edit";
    formName = selectedPlaylist.name;
    formDescription = selectedPlaylist.description;
    showPlaylistForm = true;
  }

  // 플레이리스트 생성/수정
  async function savePlaylist() {
    try {
      if (!formName.trim()) {
        logger.warn('PLAYLIST', 'NAME_REQUIRED');
        return;
      }

      loading = true;
      error = "";

      if (formMode === "create") {
        const response = await fetch("/api/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            tracks: [],
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create playlist");
        }

        const newPlaylist = await response.json();
        playlists = [...playlists, newPlaylist];
        selectedPlaylist = newPlaylist;
      } else {
        if (!selectedPlaylist) return;

        const response = await fetch(`/api/playlists/${selectedPlaylist.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update playlist");
        }

        const updatedPlaylist = await response.json();
        playlists = playlists.map((p) =>
          p.id === updatedPlaylist.id ? updatedPlaylist : p
        );
        selectedPlaylist = updatedPlaylist;
      }

      showPlaylistForm = false;
      formName = "";
      formDescription = "";
    } catch (err: any) {
      error = err.message;
      logger.error('PLAYLIST', 'SAVE_FAILED', { details: err });
    } finally {
      loading = false;
    }
  }

  // 플레이리스트 삭제
  async function deletePlaylist() {
    if (!selectedPlaylist) return;
    if (!confirm(`"${selectedPlaylist.name}" 플레이리스트를 삭제하시겠습니까?`))
      return;

    try {
      loading = true;
      error = "";

      const response = await fetch(`/api/playlists/${selectedPlaylist.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete playlist");
      }

      playlists = playlists.filter((p) => p.id !== selectedPlaylist!.id);
      selectedPlaylist = null;
      tracks = [];
    } catch (err: any) {
      error = err.message;
      logger.error('PLAYLIST', 'DELETE_FAILED', { details: err });
    } finally {
      loading = false;
    }
  }

  // YouTube URL에서 비디오 ID 추출
  function extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) return match[1];
    }

    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }

    return null;
  }

  // URL 입력 시 자동으로 비디오 ID 추출 및 트랙 검색
  async function handleUrlInput() {
    const extractedId = extractVideoId(youtubeUrl);

    if (!extractedId) {
      logger.warn('PLAYLIST', 'INVALID_URL');
      return;
    }

    videoId = extractedId;
    await searchTrack();
  }

  // YouTube 트랙 정보 조회
  async function searchTrack() {
    if (!videoId.trim()) {
      logger.warn('PLAYLIST', 'VIDEO_ID_REQUIRED');
      return;
    }

    try {
      loadingTrack = true;
      const response = await fetch(`/api/youtube/track/${videoId.trim()}`);

      if (!response.ok) {
        throw new Error("트랙을 찾을 수 없습니다");
      }

      trackInfo = await response.json();
    } catch (err: any) {
      logger.error('PLAYLIST', 'TRACK_FETCH_FAILED', { details: err });
      trackInfo = null;
    } finally {
      loadingTrack = false;
    }
  }

  // 정답 추가
  function addAnswer() {
    answers = [...answers, ""];
  }

  // 정답 제거
  function removeAnswer(index: number) {
    if (answers.length === 1) {
      answers = [""];
    } else {
      answers = answers.filter((_, i) => i !== index);
    }
  }

  // 정답 업데이트
  function updateAnswer(index: number, value: string) {
    answers[index] = value;
  }

  // 힌트 추가
  function addHint() {
    hints = [...hints, { showAtSeconds: 8, text: "" }];
  }

  // 힌트 제거
  function removeHint(index: number) {
    hints = hints.filter((_, i) => i !== index);
  }

  // 힌트 시간 업데이트
  function updateHintTime(index: number, value: number) {
    hints[index] = { ...hints[index], showAtSeconds: value };
  }

  // 힌트 텍스트 업데이트
  function updateHintText(index: number, value: string) {
    hints[index] = { ...hints[index], text: value };
  }

  // 수정용 정답 추가
  function addEditAnswer() {
    editAnswers = [...editAnswers, ""];
  }

  // 수정용 정답 제거
  function removeEditAnswer(index: number) {
    if (editAnswers.length === 1) {
      editAnswers = [""];
    } else {
      editAnswers = editAnswers.filter((_, i) => i !== index);
    }
  }

  // 수정용 정답 업데이트
  function updateEditAnswer(index: number, value: string) {
    editAnswers[index] = value;
  }

  // 수정용 힌트 추가
  function addEditHint() {
    editHints = [...editHints, { showAtSeconds: 8, text: "" }];
  }

  // 수정용 힌트 제거
  function removeEditHint(index: number) {
    editHints = editHints.filter((_, i) => i !== index);
  }

  // 수정용 힌트 업데이트 (시간)
  function updateEditHintTime(index: number, value: number) {
    editHints[index] = { ...editHints[index], showAtSeconds: value };
  }

  // 수정용 힌트 업데이트 (텍스트)
  function updateEditHintText(index: number, value: string) {
    editHints[index] = { ...editHints[index], text: value };
  }

  // 트랙 추가
  async function addTrack() {
    if (!selectedPlaylist || !trackInfo) return;

    const filteredAnswers = answers.filter((a) => a.trim() !== "");
    const filteredHints = hints.filter((h) => h.text.trim() !== "");

    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}/tracks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: trackInfo.id,
            answers: filteredAnswers,
            hints: filteredHints.length > 0 ? filteredHints : undefined,
            startSeconds,
            endSeconds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add track");
      }

      const updatedPlaylist = await response.json();
      playlists = playlists.map((p) =>
        p.id === updatedPlaylist.id ? updatedPlaylist : p
      );
      selectedPlaylist = updatedPlaylist;
      tracks = [...tracks, trackInfo];

      // 폼 초기화
      showTrackForm = false;
      youtubeUrl = "";
      videoId = "";
      trackInfo = null;
      answers = [""];
      hints = [];
      startSeconds = undefined;
      endSeconds = undefined;
    } catch (err: any) {
      error = err.message;
      logger.error('PLAYLIST', 'TRACK_ADD_FAILED', { details: err });
    } finally {
      loading = false;
    }
  }

  // 트랙 제거
  async function removeTrack(videoId: string) {
    if (!selectedPlaylist) return;
    const track = tracks.find((t) => t.id === videoId);
    if (!track || !confirm(`"${track.name}"을(를) 제거하시겠습니까?`)) return;

    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}/tracks/${videoId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove track");
      }

      const updatedPlaylist = await response.json();
      playlists = playlists.map((p) =>
        p.id === updatedPlaylist.id ? updatedPlaylist : p
      );
      selectedPlaylist = updatedPlaylist;
      tracks = tracks.filter((t) => t.id !== videoId);
    } catch (err: any) {
      error = err.message;
      logger.error('PLAYLIST', 'TRACK_REMOVE_FAILED', { details: err });
    } finally {
      loading = false;
    }
  }

  // 트랙 수정 시작
  function startEditTrack(videoId: string) {
    if (!selectedPlaylist) return;

    const track = selectedPlaylist.tracks.find((t) => t.videoId === videoId);
    if (!track) return;

    editingTrackId = videoId;
    editAnswers = track.answers.length > 0 ? [...track.answers] : [""];
    editHints = track.hints && track.hints.length > 0 ? [...track.hints] : [];
    editStartSeconds = track.startSeconds;
    editEndSeconds = track.endSeconds;
  }

  // 트랙 수정 취소
  function cancelEditTrack() {
    editingTrackId = null;
    editAnswers = [];
    editHints = [];
    editStartSeconds = undefined;
    editEndSeconds = undefined;
  }

  // 트랙 정답 및 힌트 업데이트
  async function updateTrack(videoId: string) {
    if (!selectedPlaylist) return;

    const filteredAnswers = editAnswers.filter((a) => a.trim() !== "");
    const filteredHints = editHints.filter((h) => h.text.trim() !== "");

    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}/tracks/${videoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: filteredAnswers,
            hints: filteredHints.length > 0 ? filteredHints : undefined,
            startSeconds: editStartSeconds,
            endSeconds: editEndSeconds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update track");
      }

      const updatedPlaylist = await response.json();
      playlists = playlists.map((p) =>
        p.id === updatedPlaylist.id ? updatedPlaylist : p
      );
      selectedPlaylist = updatedPlaylist;

      cancelEditTrack();
      logger.success('SUCCESS', 'PLAYLIST_SAVED');
    } catch (err: any) {
      error = err.message;
      logger.error('PLAYLIST', 'SAVE_FAILED', { details: err });
    } finally {
      loading = false;
    }
  }
</script>

<div class="playlist-manager">
  <h1>🎵 플레이리스트 관리</h1>

  {#if error}
    <div class="error-message">{error}</div>
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

      {#if loading && playlists.length === 0}
        <div class="loading">로딩 중...</div>
      {:else if playlists.length === 0}
        <div class="empty-message">
          플레이리스트가 없습니다.
          <br />
          새로 만들어보세요!
        </div>
      {:else}
        <div class="playlist-list">
          {#each playlists as playlist}
            <button
              type="button"
              class="playlist-item"
              class:active={selectedPlaylist?.id === playlist.id}
              onclick={() => selectPlaylist(playlist)}
              aria-label="플레이리스트 선택: {playlist.name}"
            >
              <div class="playlist-name">{playlist.name}</div>
              <div class="playlist-count">
                {playlist.tracks?.length || 0} 트랙
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 플레이리스트 상세 -->
    <div class="main-content">
      {#if selectedPlaylist}
        <div class="playlist-header">
          <div class="playlist-info">
            <h2>{selectedPlaylist.name}</h2>
            <p>{selectedPlaylist.description || "설명 없음"}</p>
          </div>
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
        </div>

        <TrackList
          {tracks}
          playlistTracks={selectedPlaylist.tracks}
          {editingTrackId}
          {editAnswers}
          {editHints}
          {editStartSeconds}
          {editEndSeconds}
          onStartEdit={startEditTrack}
          onCancelEdit={cancelEditTrack}
          onUpdateTrack={updateTrack}
          onRemoveTrack={removeTrack}
          onAddEditAnswer={addEditAnswer}
          onRemoveEditAnswer={removeEditAnswer}
          onUpdateEditAnswer={updateEditAnswer}
          onAddEditHint={addEditHint}
          onRemoveEditHint={removeEditHint}
          onUpdateEditHintTime={updateEditHintTime}
          onUpdateEditHintText={updateEditHintText}
          onUpdateEditStartSeconds={(value) => (editStartSeconds = value)}
          onUpdateEditEndSeconds={(value) => (editEndSeconds = value)}
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
  name={formName}
  description={formDescription}
  onClose={() => (showPlaylistForm = false)}
  onSave={savePlaylist}
  onNameChange={(value) => (formName = value)}
  onDescriptionChange={(value) => (formDescription = value)}
/>

<TrackForm
  show={showTrackForm}
  {youtubeUrl}
  {videoId}
  {trackInfo}
  {loadingTrack}
  {answers}
  {hints}
  {startSeconds}
  {endSeconds}
  onClose={() => {
    showTrackForm = false;
    youtubeUrl = "";
    videoId = "";
    trackInfo = null;
    answers = [""];
    hints = [];
    startSeconds = undefined;
    endSeconds = undefined;
  }}
  onUrlInput={handleUrlInput}
  onYoutubeUrlChange={(value) => (youtubeUrl = value)}
  onAddTrack={addTrack}
  onAddAnswer={addAnswer}
  onRemoveAnswer={removeAnswer}
  onUpdateAnswer={updateAnswer}
  onAddHint={addHint}
  onRemoveHint={removeHint}
  onUpdateHintTime={updateHintTime}
  onUpdateHintText={updateHintText}
  onUpdateStartSeconds={(value) => (startSeconds = value)}
  onUpdateEndSeconds={(value) => (endSeconds = value)}
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
    /* Button reset */
    width: 100%;
    text-align: left;
    font: inherit;

    /* Original styles */
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
