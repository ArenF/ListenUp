<script lang="ts">
  import type { AnswerList } from "./answerList.svelte";
  import type { PlaylistTrack, Track } from "../../types";

  interface Props {
    /** YouTube에서 조회한 트랙 메타데이터 */
    tracks: Track[];
    /** 플레이리스트에 등록된 정답 정보 */
    playlistTracks: PlaylistTrack[];
    /** 정답 수정 폼이 열려 있는 트랙 */
    editingTrackId: string | null;
    editAnswers: AnswerList;
    /** 트랙 편집(수정/삭제) 가능 여부 — 작성자 본인만 true */
    canEdit: boolean;
    onStartEdit: (videoId: string) => void;
    onCancelEdit: () => void;
    onSave: (videoId: string) => void;
    onRemove: (videoId: string) => void;
  }

  let {
    tracks,
    playlistTracks,
    editingTrackId,
    editAnswers,
    canEdit,
    onStartEdit,
    onCancelEdit,
    onSave,
    onRemove,
  }: Props = $props();

  function getTrackAnswers(videoId: string): string[] {
    return playlistTracks.find((t) => t.videoId === videoId)?.answers || [];
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
          </div>
          {#if canEdit}
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
                onclick={() => onRemove(track.id)}
                title="트랙 제거"
              >
                🗑️ 삭제
              </button>
            </div>
          {/if}
        </div>

        {#if canEdit && editingTrackId === track.id}
          <div class="track-edit-form">
            <h4>정답 수정</h4>
            <div class="answers-list">
              {#each editAnswers.items as _, index}
                <div class="answer-input-row">
                  <input
                    type="text"
                    bind:value={editAnswers.items[index]}
                    placeholder="정답 {index + 1}"
                  />
                  <button
                    class="btn-remove"
                    onclick={() => editAnswers.remove(index)}
                    title="정답 제거"
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
            <button class="btn-add-answer" onclick={() => editAnswers.add()}>
              ➕ 정답 추가
            </button>
            <div class="track-edit-actions">
              <button class="btn-save" onclick={() => onSave(track.id)}>
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
    color: var(--text-primary);
  }

  h4 {
    margin-bottom: 1rem;
    color: var(--text-secondary);
  }

  .empty-message {
    padding: 3rem;
    text-align: center;
    color: var(--text-secondary);
    background-color: var(--bg-surface);
    border-radius: 8px;
    border: 2px dashed var(--border);
  }

  .track-item-container {
    margin-bottom: 1rem;
  }

  .track-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    background-color: var(--bg-surface);
    border: 2px solid var(--border);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .track-item:hover {
    border-color: var(--accent);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 15%, transparent);
  }

  .track-info {
    flex: 1;
  }

  .track-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .track-artist {
    font-size: 0.95rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .track-details {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
  }

  .track-answers {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }

  .no-answers {
    color: var(--text-secondary);
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
    background-color: var(--bg-surface);
    color: var(--accent);
    border: 2px solid var(--border);
  }

  .btn-edit:hover {
    border-color: var(--accent);
  }

  .btn-delete {
    background-color: var(--color-danger);
    color: var(--text-on-accent);
  }

  .btn-delete:hover {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }

  .track-edit-form {
    margin-top: 1rem;
    padding: 1rem;
    background-color: color-mix(in srgb, var(--accent) 8%, var(--bg-surface));
    border-radius: 8px;
    border: 2px solid var(--accent);
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
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  .answer-input-row input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .btn-remove {
    padding: 0.75rem 1rem;
    background-color: var(--color-danger);
    color: var(--text-on-accent);
    font-size: 1.2rem;
    font-weight: bold;
  }

  .btn-remove:hover {
    background-color: color-mix(in srgb, var(--color-danger) 85%, black);
  }

  .btn-add-answer {
    width: 100%;
    padding: 0.75rem;
    background-color: var(--color-success);
    color: var(--text-on-accent);
  }

  .btn-add-answer:hover {
    background-color: color-mix(in srgb, var(--color-success) 85%, black);
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
    background-color: var(--color-success);
    color: var(--text-on-accent);
  }

  .btn-save:hover {
    background-color: color-mix(in srgb, var(--color-success) 85%, black);
  }

  .btn-cancel {
    background-color: color-mix(in srgb, var(--text-secondary) 15%, var(--bg-surface));
    color: var(--text-primary);
  }

  .btn-cancel:hover {
    background-color: color-mix(in srgb, var(--text-secondary) 25%, var(--bg-surface));
  }
</style>
