<script lang="ts">
  interface Track {
    id: string;
    name: string;
    artist: string;
    duration: number;
    startSeconds: number;
    endSeconds: number;
  }

  interface Props {
    show: boolean;
    youtubeUrl: string;
    videoId: string;
    trackInfo: Track | null;
    loadingTrack: boolean;
    answers: string[];
    onClose: () => void;
    onUrlInput: () => void;
    onYoutubeUrlChange: (value: string) => void;
    onAddTrack: () => void;
    onAddAnswer: () => void;
    onRemoveAnswer: (index: number) => void;
    onUpdateAnswer: (index: number, value: string) => void;
  }

  let {
    show,
    youtubeUrl,
    videoId,
    trackInfo,
    loadingTrack,
    answers,
    onClose,
    onUrlInput,
    onYoutubeUrlChange,
    onAddTrack,
    onAddAnswer,
    onRemoveAnswer,
    onUpdateAnswer,
  }: Props = $props();
</script>

{#if show}
  <div class="modal-backdrop" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h3>트랙 추가</h3>

      <div class="form-group">
        <label>YouTube 링크 또는 비디오 ID</label>
        <div class="url-input-group">
          <input
            type="text"
            value={youtubeUrl}
            oninput={(e) => onYoutubeUrlChange(e.currentTarget.value)}
            placeholder="YouTube URL 또는 비디오 ID"
            onkeydown={(e) => e.key === "Enter" && onUrlInput()}
          />
          <button class="btn-search" onclick={onUrlInput}>🔍 검색</button>
        </div>
        {#if videoId}
          <div class="video-id-display">비디오 ID: {videoId}</div>
        {/if}
      </div>

      {#if loadingTrack}
        <div class="loading">트랙 정보 로딩 중...</div>
      {/if}

      {#if trackInfo}
        <div class="track-info">
          <h4>트랙 정보</h4>
          <p><strong>제목:</strong> {trackInfo.name}</p>
          <p><strong>아티스트:</strong> {trackInfo.artist}</p>
          <p>
            <strong>재생 구간:</strong>
            {trackInfo.startSeconds}초 ~ {trackInfo.endSeconds}초
          </p>

          <div class="answers-section">
            <h4>정답 입력</h4>
            <p class="hint">
              게임에서 인정할 정답을 입력하세요. 비워두면 YouTube 제목으로
              체크합니다.
            </p>
            <div class="answers-list">
              {#each answers as answer, index}
                <div class="answer-input-row">
                  <input
                    type="text"
                    value={answer}
                    oninput={(e) => onUpdateAnswer(index, e.currentTarget.value)}
                    placeholder="정답 {index + 1}"
                    onkeydown={(e) => e.key === "Enter" && onAddAnswer()}
                  />
                  <button
                    class="btn-remove"
                    onclick={() => onRemoveAnswer(index)}
                    title="정답 제거"
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
            <button class="btn-add-answer" onclick={onAddAnswer}>
              ➕ 정답 추가
            </button>
          </div>

          <div class="track-form-actions">
            <button class="btn-primary" onclick={onAddTrack}>
              플레이리스트에 추가
            </button>
            <button class="btn-secondary" onclick={onClose}>취소</button>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    overflow-y: auto;
  }

  .modal {
    background-color: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
  }

  h4 {
    margin-top: 1rem;
    margin-bottom: 0.75rem;
    color: #555;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #555;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #ff3e00;
  }

  .url-input-group {
    display: flex;
    gap: 0.5rem;
  }

  .url-input-group input {
    flex: 1;
  }

  .btn-search {
    padding: 0.75rem 1.5rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-search:hover {
    background-color: #1976d2;
  }

  .video-id-display {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f0f0f0;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #666;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
  }

  .track-info {
    margin-top: 1rem;
  }

  .track-info p {
    margin: 0.5rem 0;
  }

  .answers-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    border-top: 3px solid #ff3e00;
  }

  .hint {
    font-size: 0.9rem;
    color: #666;
    font-style: italic;
  }

  .answers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .answer-input-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .answer-input-row input {
    flex: 1;
  }

  .btn-remove {
    padding: 0.75rem 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
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
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-add-answer:hover {
    background-color: #45a049;
  }

  .track-form-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
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
    background-color: #e0e0e0;
    color: #333;
  }

  .btn-secondary:hover {
    background-color: #d0d0d0;
  }
</style>
