<script lang="ts">
  interface Track {
    id: string;
    name: string;
    artist: string;
    duration: number;
    startSeconds: number;
    endSeconds: number;
  }

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

  interface Props {
    tracks: Track[];
    playlistTracks: PlaylistTrack[];
    editingTrackId: string | null;
    editAnswers: string[];
    editHints: Hint[];
    editStartSeconds?: number;
    editEndSeconds?: number;
    onStartEdit: (videoId: string) => void;
    onCancelEdit: () => void;
    onUpdateTrack: (videoId: string) => void;
    onRemoveTrack: (videoId: string) => void;
    onAddEditAnswer: () => void;
    onRemoveEditAnswer: (index: number) => void;
    onUpdateEditAnswer: (index: number, value: string) => void;
    onAddEditHint: () => void;
    onRemoveEditHint: (index: number) => void;
    onUpdateEditHintTime: (index: number, value: number) => void;
    onUpdateEditHintText: (index: number, value: string) => void;
    onUpdateEditStartSeconds: (value: number | undefined) => void;
    onUpdateEditEndSeconds: (value: number | undefined) => void;
  }

  let {
    tracks,
    playlistTracks,
    editingTrackId,
    editAnswers,
    editHints,
    editStartSeconds,
    editEndSeconds,
    onStartEdit,
    onCancelEdit,
    onUpdateTrack,
    onRemoveTrack,
    onAddEditAnswer,
    onRemoveEditAnswer,
    onUpdateEditAnswer,
    onAddEditHint,
    onRemoveEditHint,
    onUpdateEditHintTime,
    onUpdateEditHintText,
    onUpdateEditStartSeconds,
    onUpdateEditEndSeconds,
  }: Props = $props();

  function getTrackAnswers(videoId: string): string[] {
    return playlistTracks.find((t) => t.videoId === videoId)?.answers || [];
  }

  function getTrackHints(videoId: string): Hint[] {
    return playlistTracks.find((t) => t.videoId === videoId)?.hints || [];
  }
</script>

<div class="track-list">
  <h3>트랙 목록 ({tracks.length})</h3>

  {#if tracks.length === 0}
    <div class="empty-message">
      아직 트랙이 없습니다. "➕ 트랙 추가" 버튼을 눌러 추가해보세요!
    </div>
  {:else}
    {#each tracks as track}
      {@const answers = getTrackAnswers(track.id)}
      {@const hints = getTrackHints(track.id)}
      <div class="track-item-container">
        <div class="track-item">
          <div class="track-info">
            <div class="track-name">{track.name}</div>
            <div class="track-artist">{track.artist}</div>
            <div class="track-details">
              {track.startSeconds}초 ~ {track.endSeconds}초 (총 {track.duration}초)
            </div>
            <div class="track-answers">
              <strong>정답:</strong>
              {#if answers.length > 0 && answers.some((a) => a.trim())}
                {answers.filter((a) => a.trim()).join(", ")}
              {:else}
                <span class="no-answers">(YouTube 제목)</span>
              {/if}
            </div>
            {#if hints.length > 0}
              <div class="track-hints">
                <strong>힌트:</strong>
                {hints.map((h) => `${h.showAtSeconds}초 - ${h.text}`).join(" | ")}
              </div>
            {/if}
          </div>
          <div class="track-actions">
            <button
              class="btn-edit"
              onclick={() => onStartEdit(track.id)}
              title="정답 수정"
            >
              ✏️ 수정
            </button>
            <button
              class="btn-delete"
              onclick={() => onRemoveTrack(track.id)}
              title="트랙 제거"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>

        {#if editingTrackId === track.id}
          <div class="track-edit-form">
            <!-- 정답 섹션 -->
            <div class="edit-section">
              <h4>정답 수정</h4>
              <div class="answers-list">
                {#each editAnswers as answer, index}
                  <div class="answer-input-row">
                    <input
                      type="text"
                      value={answer}
                      oninput={(e) =>
                        onUpdateEditAnswer(index, e.currentTarget.value)}
                      placeholder="정답 {index + 1}"
                    />
                    <button
                      class="btn-remove"
                      onclick={() => onRemoveEditAnswer(index)}
                      title="정답 제거"
                    >
                      ✕
                    </button>
                  </div>
                {/each}
              </div>
              <button class="btn-add-answer" onclick={onAddEditAnswer}>
                ➕ 정답 추가
              </button>
            </div>

            <!-- 힌트 섹션 -->
            <div class="edit-section">
              <h4>힌트 수정</h4>
              <div class="hints-list">
                {#each editHints as hint, index}
                  <div class="hint-input-row">
                    <input
                      type="number"
                      value={hint.showAtSeconds}
                      oninput={(e) =>
                        onUpdateEditHintTime(index, parseInt(e.currentTarget.value) || 0)}
                      placeholder="시간(초)"
                      min="0"
                      class="hint-time-input"
                    />
                    <input
                      type="text"
                      value={hint.text}
                      oninput={(e) =>
                        onUpdateEditHintText(index, e.currentTarget.value)}
                      placeholder="힌트 내용"
                      class="hint-text-input"
                    />
                    <button
                      class="btn-remove"
                      onclick={() => onRemoveEditHint(index)}
                      title="힌트 제거"
                    >
                      ✕
                    </button>
                  </div>
                {/each}
              </div>
              <button class="btn-add-hint" onclick={onAddEditHint}>
                ➕ 힌트 추가
              </button>
            </div>

            <!-- 재생 구간 섹션 -->
            <div class="edit-section playback-section">
              <h4>재생 구간 설정 (선택사항)</h4>
              <p class="hint-text">
                게임에서 재생할 구간을 초 단위로 지정하세요. 비워두면 자동으로 중간 30초 구간이 선택됩니다.
              </p>
              <div class="playback-inputs">
                <div class="playback-input-group">
                  <label>시작 시간 (초)</label>
                  <input
                    type="number"
                    value={editStartSeconds ?? ""}
                    oninput={(e) => {
                      const val = e.currentTarget.value;
                      onUpdateEditStartSeconds(val ? parseInt(val) : undefined);
                    }}
                    placeholder={`자동: ${track.startSeconds}`}
                    min="0"
                    max={track.duration}
                  />
                </div>
                <div class="playback-input-group">
                  <label>종료 시간 (초)</label>
                  <input
                    type="number"
                    value={editEndSeconds ?? ""}
                    oninput={(e) => {
                      const val = e.currentTarget.value;
                      onUpdateEditEndSeconds(val ? parseInt(val) : undefined);
                    }}
                    placeholder={`자동: ${track.endSeconds}`}
                    min="0"
                    max={track.duration}
                  />
                </div>
              </div>
            </div>

            <div class="track-edit-actions">
              <button
                class="btn-save"
                onclick={() => onUpdateTrack(track.id)}
              >
                ✅ 저장
              </button>
              <button class="btn-cancel" onclick={onCancelEdit}>
                ❌ 취소
              </button>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>

<style>
  .track-list {
    margin-top: 2rem;
  }

  h3 {
    margin-bottom: 1rem;
    color: #333;
  }

  h4 {
    margin-bottom: 1rem;
    color: #555;
  }

  .empty-message {
    padding: 3rem;
    text-align: center;
    color: #999;
    background-color: #f9f9f9;
    border-radius: 8px;
    border: 2px dashed #ddd;
  }

  .track-item-container {
    margin-bottom: 1rem;
  }

  .track-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background-color: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .track-item:hover {
    border-color: #ff3e00;
    box-shadow: 0 2px 8px rgba(255, 62, 0, 0.1);
  }

  .track-info {
    flex: 1;
  }

  .track-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
  }

  .track-artist {
    font-size: 0.95rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .track-details {
    font-size: 0.85rem;
    color: #999;
    margin-bottom: 0.5rem;
  }

  .track-answers {
    font-size: 0.9rem;
    color: #555;
    margin-bottom: 0.25rem;
  }

  .track-hints {
    font-size: 0.85rem;
    color: #666;
  }

  .no-answers {
    color: #999;
    font-style: italic;
  }

  .track-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-edit {
    background-color: #2196f3;
    color: white;
  }

  .btn-edit:hover {
    background-color: #1976d2;
  }

  .btn-delete {
    background-color: #f44336;
    color: white;
  }

  .btn-delete:hover {
    background-color: #d32f2f;
  }

  .track-edit-form {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f0f7ff;
    border-radius: 8px;
    border: 2px solid #2196f3;
  }

  .edit-section {
    padding: 1rem;
    background-color: white;
    border-radius: 8px;
    border: 2px solid #e0e0e0;
    margin-bottom: 1rem;
  }

  .edit-section h4 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #333;
  }

  .answers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .answer-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .answer-input-row input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .answer-input-row input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .btn-remove {
    padding: 0.75rem 1rem;
    background-color: #f44336;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .btn-remove:hover {
    background-color: #d32f2f;
  }

  .btn-add-answer {
    width: 100%;
    padding: 0.75rem;
    background-color: #4caf50;
    color: white;
  }

  .btn-add-answer:hover {
    background-color: #45a049;
  }

  .hints-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .hint-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .hint-time-input {
    width: 100px;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .hint-text-input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }

  .hint-time-input:focus,
  .hint-text-input:focus {
    outline: none;
    border-color: #2196f3;
  }

  .btn-add-hint {
    width: 100%;
    padding: 0.75rem;
    background-color: #9c27b0;
    color: white;
  }

  .btn-add-hint:hover {
    background-color: #7b1fa2;
  }

  .track-edit-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .track-edit-actions button {
    flex: 1;
  }

  .btn-save {
    background-color: #4caf50;
    color: white;
  }

  .btn-save:hover {
    background-color: #45a049;
  }

  .btn-cancel {
    background-color: #e0e0e0;
    color: #333;
  }

  .btn-cancel:hover {
    background-color: #d0d0d0;
  }

  .hint-text {
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
    margin-bottom: 1rem;
  }

  .playback-inputs {
    display: flex;
    gap: 1rem;
  }

  .playback-input-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .playback-input-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #333;
  }

  .playback-input-group input {
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .playback-input-group input:focus {
    outline: none;
    border-color: #ff9800;
  }
</style>
