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
</style>
