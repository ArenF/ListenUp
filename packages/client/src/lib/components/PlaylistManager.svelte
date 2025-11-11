<script lang="ts">
  import { onMount } from "svelte";

  // 타입 정의
  interface PlaylistTrack {
    videoId: string;
    answers: string[];
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

  // 트랙 수정 폼
  let editingTrackId = $state<string | null>(null);
  let editAnswers = $state<string[]>([]);

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

    // 트랙 정보 로드
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
        alert("플레이리스트 이름을 입력해주세요");
        return;
      }

      loading = true;
      error = "";

      if (formMode === "create") {
        // 생성
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
        // 수정
        if (!selectedPlaylist) return;

        const response = await fetch(
          `/api/playlists/${selectedPlaylist.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formName.trim(),
              description: formDescription.trim(),
            }),
          }
        );

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
      alert(err.message);
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

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete playlist");
      }

      playlists = playlists.filter((p) => p.id !== selectedPlaylist!.id);
      selectedPlaylist = null;
      tracks = [];
    } catch (err: any) {
      error = err.message;
      alert(err.message);
    } finally {
      loading = false;
    }
  }

  // YouTube URL에서 비디오 ID 추출
  function extractVideoId(url: string): string | null {
    // YouTube URL 패턴들
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // URL이 아니고 11자리 ID인 경우
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
      return url.trim();
    }

    return null;
  }

  // URL 입력 시 자동으로 비디오 ID 추출 및 트랙 검색
  async function handleUrlInput() {
    const extractedId = extractVideoId(youtubeUrl);

    if (!extractedId) {
      alert("유효한 YouTube URL 또는 비디오 ID를 입력해주세요");
      return;
    }

    videoId = extractedId;
    await searchTrack();
  }

  // YouTube 트랙 정보 조회
  async function searchTrack() {
    if (!videoId.trim()) {
      alert("YouTube 비디오 ID를 입력해주세요");
      return;
    }

    try {
      loadingTrack = true;
      const response = await fetch(
        `/api/youtube/track/${videoId.trim()}`
      );

      if (!response.ok) {
        throw new Error("트랙을 찾을 수 없습니다");
      }

      trackInfo = await response.json();
    } catch (err: any) {
      alert(err.message);
      trackInfo = null;
    } finally {
      loadingTrack = false;
    }
  }

  // 정답 추가
  function addAnswer() {
    answers = [...answers, ""];
  }

  // 정답 제거 (최소 1개 유지, 마지막 하나면 빈 문자열로)
  function removeAnswer(index: number) {
    if (answers.length === 1) {
      answers = [""]; // 마지막 하나면 빈 문자열로
    } else {
      answers = answers.filter((_, i) => i !== index);
    }
  }

  // 정답 업데이트
  function updateAnswer(index: number, value: string) {
    answers[index] = value;
  }

  // 수정용 정답 추가
  function addEditAnswer() {
    editAnswers = [...editAnswers, ""];
  }

  // 수정용 정답 제거
  function removeEditAnswer(index: number) {
    if (editAnswers.length === 1) {
      editAnswers = [""]; // 마지막 하나면 빈 문자열로
    } else {
      editAnswers = editAnswers.filter((_, i) => i !== index);
    }
  }

  // 수정용 정답 업데이트
  function updateEditAnswer(index: number, value: string) {
    editAnswers[index] = value;
  }

  // 트랙 추가
  async function addTrack() {
    if (!selectedPlaylist || !trackInfo) return;

    // 정답 필터링 (빈 문자열 제거)
    const filteredAnswers = answers.filter(a => a.trim() !== "");

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
            answers: filteredAnswers
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
      answers = [""]; // 정답 초기화
    } catch (err: any) {
      error = err.message;
      alert(err.message);
    } finally {
      loading = false;
    }
  }

  // 트랙 제거
  async function removeTrack(track: Track) {
    if (!selectedPlaylist) return;
    if (!confirm(`"${track.name}"을(를) 제거하시겠습니까?`)) return;

    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}/tracks/${track.id}`,
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
      tracks = tracks.filter((t) => t.id !== track.id);
    } catch (err: any) {
      error = err.message;
      alert(err.message);
    } finally {
      loading = false;
    }
  }

  // 트랙 수정 시작
  function startEditTrack(videoId: string) {
    if (!selectedPlaylist) return;

    // 해당 트랙의 정답 가져오기
    const track = selectedPlaylist.tracks.find((t) => t.videoId === videoId);
    if (!track) return;

    editingTrackId = videoId;
    editAnswers = track.answers.length > 0 ? [...track.answers] : [""];
  }

  // 트랙 수정 취소
  function cancelEditTrack() {
    editingTrackId = null;
    editAnswers = [];
  }

  // 트랙 정답 업데이트
  async function updateTrackAnswers(videoId: string) {
    if (!selectedPlaylist) return;

    // 정답 필터링 (빈 문자열 제거)
    const filteredAnswers = editAnswers.filter((a) => a.trim() !== "");

    try {
      loading = true;
      error = "";

      const response = await fetch(
        `/api/playlists/${selectedPlaylist.id}/tracks/${videoId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: filteredAnswers }),
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

      // 수정 모드 종료
      cancelEditTrack();

      alert("정답이 업데이트되었습니다!");
    } catch (err: any) {
      error = err.message;
      alert(err.message);
    } finally {
      loading = false;
    }
  }
</script>

<div class="playlist-manager">
  <h1>🎵 플레이리스트 관리</h1>

  {#if error}
    <div class="error-message">⚠️ {error}</div>
  {/if}

  <div class="content">
    <!-- 플레이리스트 목록 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>플레이리스트</h2>
        <button class="btn-primary" onclick={openCreateForm}>
          ➕ 새 플레이리스트
        </button>
      </div>

      {#if loading && playlists.length === 0}
        <div class="loading">로딩 중...</div>
      {:else if playlists.length === 0}
        <div class="empty">플레이리스트가 없습니다</div>
      {:else}
        <div class="playlist-list">
          {#each playlists as playlist}
            <div
              class="playlist-item"
              class:active={selectedPlaylist?.id === playlist.id}
              onclick={() => selectPlaylist(playlist)}
            >
              <div class="playlist-name">{playlist.name}</div>
              <div class="playlist-info">
                {playlist.tracks.length} 트랙
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- 플레이리스트 상세 -->
    <div class="main">
      {#if selectedPlaylist}
        <div class="playlist-detail">
          <div class="detail-header">
            <div>
              <h2>{selectedPlaylist.name}</h2>
              <p class="description">{selectedPlaylist.description}</p>
              <p class="track-count">{selectedPlaylist.tracks.length} 트랙</p>
            </div>
            <div class="actions">
              <button class="btn-secondary" onclick={openEditForm}>
                ✏️ 수정
              </button>
              <button class="btn-danger" onclick={deletePlaylist}>
                🗑️ 삭제
              </button>
            </div>
          </div>

          <div class="tracks-section">
            <div class="tracks-header">
              <h3>트랙 목록</h3>
              <button
                class="btn-primary"
                onclick={() => (showTrackForm = !showTrackForm)}
              >
                ➕ 트랙 추가
              </button>
            </div>

            {#if showTrackForm}
              <div class="track-form">
                <h4>YouTube 트랙 추가</h4>

                <!-- YouTube 링크 입력 -->
                <div class="form-group">
                  <label>YouTube 링크 또는 비디오 ID</label>
                  <div class="url-input-group">
                    <input
                      type="text"
                      bind:value={youtubeUrl}
                      placeholder="예: https://youtube.com/watch?v=dQw4w9WgXcQ 또는 dQw4w9WgXcQ"
                      onkeydown={(e) => e.key === 'Enter' && handleUrlInput()}
                    />
                    <button
                      class="btn-secondary"
                      onclick={handleUrlInput}
                      disabled={loadingTrack}
                    >
                      {loadingTrack ? "검색 중..." : "🔍 검색"}
                    </button>
                  </div>
                  {#if videoId}
                    <p class="video-id-display">비디오 ID: <code>{videoId}</code></p>
                  {/if}
                </div>

                {#if trackInfo}
                  <div class="track-preview">
                    <h5>트랙 미리보기</h5>
                    <p><strong>제목:</strong> {trackInfo.name}</p>
                    <p><strong>아티스트:</strong> {trackInfo.artist}</p>
                    <p>
                      <strong>재생 구간:</strong> {trackInfo.startSeconds}s - {trackInfo.endSeconds}s
                    </p>

                    <!-- 정답 입력 섹션 -->
                    <div class="answers-section">
                      <h5>정답 설정</h5>
                      <p class="hint">게임에서 인정할 정답을 입력하세요. 비워두면 YouTube 제목으로 체크합니다.</p>

                      <div class="answers-list">
                        {#each answers as answer, index}
                          <div class="answer-input-row">
                            <input
                              type="text"
                              bind:value={answers[index]}
                              placeholder={`정답 ${index + 1}`}
                              onkeydown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addAnswer();
                                }
                              }}
                            />
                            <button
                              class="btn-remove"
                              onclick={() => removeAnswer(index)}
                              title="정답 제거"
                            >
                              ✕
                            </button>
                          </div>
                        {/each}

                        <button class="btn-add-answer" onclick={addAnswer}>
                          ➕ 정답 추가
                        </button>
                      </div>
                    </div>

                    <div class="track-form-actions">
                      <button class="btn-primary" onclick={addTrack}>
                        ✅ 플레이리스트에 추가
                      </button>
                      <button
                        class="btn-secondary"
                        onclick={() => {
                          trackInfo = null;
                          youtubeUrl = "";
                          videoId = "";
                          answers = [""];
                        }}
                      >
                        ❌ 취소
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}

            <div class="tracks-list">
              {#if tracks.length === 0}
                <div class="empty">트랙이 없습니다</div>
              {:else}
                {#each tracks as track, index}
                  <div class="track-item-container">
                    <div class="track-item">
                      <div class="track-number">{index + 1}</div>
                      <div class="track-info">
                        <div class="track-name">{track.name}</div>
                        <div class="track-artist">{track.artist}</div>
                      </div>
                      <div class="track-duration">
                        {Math.floor(track.duration / 60)}:{String(
                          track.duration % 60
                        ).padStart(2, "0")}
                      </div>
                      <button
                        class="btn-edit"
                        onclick={() => startEditTrack(track.id)}
                        title="정답 수정"
                      >
                        ✏️
                      </button>
                      <button
                        class="btn-remove"
                        onclick={() => removeTrack(track)}
                        title="트랙 삭제"
                      >
                        🗑️
                      </button>
                    </div>

                    <!-- 수정 모드 -->
                    {#if editingTrackId === track.id}
                      <div class="track-edit-form">
                        <h5>정답 수정</h5>
                        <div class="answers-list">
                          {#each editAnswers as answer, ansIndex}
                            <div class="answer-input-row">
                              <input
                                type="text"
                                bind:value={editAnswers[ansIndex]}
                                placeholder={`정답 ${ansIndex + 1}`}
                                onkeydown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addEditAnswer();
                                  }
                                }}
                              />
                              <button
                                class="btn-remove"
                                onclick={() => removeEditAnswer(ansIndex)}
                                title="정답 제거"
                              >
                                ✕
                              </button>
                            </div>
                          {/each}

                          <button class="btn-add-answer" onclick={addEditAnswer}>
                            ➕ 정답 추가
                          </button>
                        </div>

                        <div class="track-edit-actions">
                          <button
                            class="btn-primary"
                            onclick={() => updateTrackAnswers(track.id)}
                          >
                            ✅ 저장
                          </button>
                          <button
                            class="btn-secondary"
                            onclick={cancelEditTrack}
                          >
                            ❌ 취소
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="empty-state">
          <p>플레이리스트를 선택하거나 새로 만들어보세요</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- 플레이리스트 생성/수정 모달 -->
  {#if showPlaylistForm}
    <div class="modal-backdrop" onclick={() => (showPlaylistForm = false)}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h3>
          {formMode === "create" ? "새 플레이리스트 만들기" : "플레이리스트 수정"}
        </h3>
        <div class="form-group">
          <label>플레이리스트 이름</label>
          <input type="text" bind:value={formName} placeholder="플레이리스트 이름" />
        </div>
        <div class="form-group">
          <label>설명</label>
          <textarea
            bind:value={formDescription}
            placeholder="플레이리스트 설명"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" onclick={savePlaylist} disabled={loading}>
            {formMode === "create" ? "생성" : "수정"}
          </button>
          <button
            class="btn-secondary"
            onclick={() => (showPlaylistForm = false)}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .playlist-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  h1 {
    color: #ff3e00;
    margin-bottom: 2rem;
  }

  .error-message {
    background-color: #ffebee;
    color: #c62828;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .content {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    min-height: 500px;
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
    margin-bottom: 1rem;
  }

  .sidebar-header h2 {
    font-size: 1.2rem;
    margin: 0;
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
  }

  .playlist-item:hover {
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .playlist-item.active {
    background-color: #ff3e00;
    color: white;
  }

  .playlist-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .playlist-info {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* 메인 영역 */
  .main {
    background-color: #f9f9f9;
    border-radius: 12px;
    padding: 2rem;
  }

  .playlist-detail {
    height: 100%;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #ddd;
  }

  .detail-header h2 {
    margin: 0 0 0.5rem 0;
  }

  .description {
    color: #666;
    margin: 0.5rem 0;
  }

  .track-count {
    color: #ff3e00;
    font-weight: 600;
    margin: 0.5rem 0 0 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  /* 트랙 섹션 */
  .tracks-section {
    margin-top: 1.5rem;
  }

  .tracks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .tracks-header h3 {
    margin: 0;
  }

  .track-form {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }

  .track-form h4 {
    margin-top: 0;
  }

  /* URL 입력 그룹 */
  .url-input-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .url-input-group input {
    flex: 1;
  }

  .video-id-display {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }

  .video-id-display code {
    background-color: #f0f0f0;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-family: monospace;
    color: #ff3e00;
  }

  .track-preview {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f0f0f0;
    border-radius: 8px;
  }

  .track-preview h5 {
    margin-top: 0;
  }

  /* 정답 입력 섹션 */
  .answers-section {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #ddd;
  }

  .answers-section h5 {
    margin-top: 0;
    margin-bottom: 0.5rem;
  }

  .hint {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 1rem;
  }

  .answers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .answer-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .answer-input-row input {
    flex: 1;
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.95rem;
  }

  .answer-input-row input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  .btn-remove {
    padding: 0.5rem 0.8rem;
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    transition: background-color 0.2s;
    min-width: 36px;
  }

  .btn-remove:hover {
    background-color: #cc0000;
  }

  .btn-add-answer {
    margin-top: 0.5rem;
    padding: 0.6rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
    align-self: flex-start;
  }

  .btn-add-answer:hover {
    background-color: #45a049;
  }

  /* 트랙 폼 액션 버튼 */
  .track-form-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  .track-form-actions button {
    flex: 1;
  }

  .tracks-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .track-item-container {
    background-color: white;
    border-radius: 8px;
    overflow: hidden;
  }

  .track-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  .btn-edit {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.5rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .btn-edit:hover {
    opacity: 1;
  }

  .track-edit-form {
    padding: 1rem;
    background-color: #f8f8f8;
    border-top: 1px solid #ddd;
  }

  .track-edit-form h5 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .track-edit-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
  }

  .track-edit-actions button {
    flex: 1;
  }

  .track-number {
    font-weight: 600;
    color: #ff3e00;
    min-width: 30px;
  }

  .track-info {
    flex: 1;
  }

  .track-name {
    font-weight: 500;
  }

  .track-artist {
    font-size: 0.9rem;
    color: #666;
  }

  .track-duration {
    color: #999;
    font-size: 0.9rem;
  }

  .btn-remove {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.5rem;
    opacity: 0.6;
    transition: opacity 0.2s;
  }

  .btn-remove:hover {
    opacity: 1;
  }

  /* 빈 상태 */
  .empty-state,
  .empty,
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #999;
    font-size: 1.1rem;
  }

  /* 폼 */
  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #ff3e00;
  }

  /* 버튼 */
  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background-color: #ff3e00;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #e63900;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
  }

  .btn-secondary {
    background-color: #757575;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #616161;
  }

  .btn-danger {
    background-color: #f44336;
    color: white;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #d32f2f;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 모달 */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background-color: white;
    padding: 2rem;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  .modal h3 {
    margin-top: 0;
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }
</style>
