<script lang="ts">
  import type { AnswerList } from "../../stores/answerList.svelte";
  import type { TrackSearch } from "../../stores/trackSearch.svelte";

  interface Props {
    show: boolean;
    /** YouTube 검색 상태 (입력 URL·조회 결과) */
    search: TrackSearch;
    /** 등록할 정답 목록 */
    answers: AnswerList;
    onClose: () => void;
    onSearch: () => void;
    onAdd: () => void;
  }

  let { show, search, answers, onClose, onSearch, onAdd }: Props = $props();
</script>

{#if show}
  <div class="modal-backdrop" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h3>트랙 추가</h3>

      <div class="form-group">
        <label for="youtube-url">YouTube 링크 또는 비디오 ID</label>
        <div class="url-input-group">
          <input
            id="youtube-url"
            type="text"
            bind:value={search.url}
            placeholder="YouTube URL 또는 비디오 ID"
            onkeydown={(e) => e.key === "Enter" && onSearch()}
          />
          <button class="btn-search" onclick={onSearch}>🔍 검색</button>
        </div>
        {#if search.videoId}
          <div class="video-id-display">비디오 ID: {search.videoId}</div>
        {/if}
      </div>

      {#if search.loading}
        <div class="loading">트랙 정보 로딩 중...</div>
      {/if}

      {#if search.track}
        <div class="track-info">
          <h4>트랙 정보</h4>
          <p><strong>제목:</strong> {search.track.name}</p>
          <p><strong>아티스트:</strong> {search.track.artist}</p>
          <p>
            <strong>재생 구간:</strong>
            {search.track.startSeconds}초 ~ {search.track.endSeconds}초
          </p>

          <div class="answers-section">
            <h4>정답 입력</h4>
            <p class="hint">
              게임에서 인정할 정답을 입력하세요. 비워두면 YouTube 제목으로
              체크합니다.
            </p>
            <div class="answers-list">
              {#each answers.items as _, index}
                <div class="answer-input-row">
                  <input
                    type="text"
                    bind:value={answers.items[index]}
                    placeholder="정답 {index + 1}"
                    onkeydown={(e) => e.key === "Enter" && answers.add()}
                  />
                  <button
                    class="btn-remove"
                    onclick={() => answers.remove(index)}
                    title="정답 제거"
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
            <button class="btn-add-answer" onclick={() => answers.add()}>
              ➕ 정답 추가
            </button>
          </div>

          <div class="track-form-actions">
            <button class="btn-primary" onclick={onAdd}>
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
    background-color: color-mix(in srgb, var(--bg-primary) 80%, transparent);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    overflow-y: auto;
  }

  .modal {
    background-color: var(--bg-surface);
    padding: var(--space-8);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-modal);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  h3 {
    margin-top: 0;
    margin-bottom: var(--space-6);
    color: var(--text-primary);
  }

  h4 {
    margin-top: var(--space-4);
    margin-bottom: var(--space-3);
    color: var(--text-secondary);
  }

  .form-group {
    margin-bottom: var(--space-6);
  }

  label {
    display: block;
    margin-bottom: var(--space-2);
    font-weight: 600;
    color: var(--text-secondary);
  }

  input {
    width: 100%;
    padding: var(--space-3);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    box-sizing: border-box;
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .url-input-group {
    display: flex;
    gap: var(--space-2);
  }

  .url-input-group input {
    flex: 1;
  }

  .btn-search {
    padding: var(--space-3) var(--space-6);
    background-color: var(--bg-surface);
    color: var(--accent);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .btn-search:hover {
    border-color: var(--accent);
  }

  .video-id-display {
    margin-top: var(--space-2);
    padding: var(--space-2);
    background-color: color-mix(in srgb, var(--text-secondary) 12%, var(--bg-surface));
    border-radius: var(--radius-sm);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .loading {
    text-align: center;
    padding: var(--space-8);
    color: var(--text-secondary);
  }

  .track-info {
    margin-top: var(--space-4);
  }

  .track-info p {
    margin: var(--space-2) 0;
  }

  .answers-section {
    margin-top: var(--space-6);
    padding: var(--space-4);
    background-color: var(--bg-surface);
    border-radius: var(--radius-md);
    border-top: 3px solid var(--accent);
  }

  .hint {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-style: italic;
  }

  .answers-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: var(--space-4) 0;
  }

  .answer-input-row {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .answer-input-row input {
    flex: 1;
  }

  .btn-remove {
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-danger);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-xl);
    font-weight: bold;
  }

  .btn-remove:hover {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }

  .btn-add-answer {
    width: 100%;
    padding: var(--space-3);
    background-color: var(--color-success);
    color: var(--text-on-accent);
    border: none;
    border-radius: var(--radius-md);
    font-weight: 600;
    cursor: pointer;
  }

  .btn-add-answer:hover {
    background-color: color-mix(in srgb, var(--color-success) 85%, black);
  }

  .track-form-actions {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
    margin-top: var(--space-6);
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
    background-color: color-mix(in srgb, var(--text-secondary) 15%, var(--bg-surface));
    color: var(--text-primary);
  }

  .btn-secondary:hover {
    background-color: color-mix(in srgb, var(--text-secondary) 25%, var(--bg-surface));
  }
</style>
