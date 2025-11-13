<script lang="ts">
  interface Props {
    show: boolean;
    mode: "create" | "edit";
    name: string;
    description: string;
    onClose: () => void;
    onSave: () => void;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
  }

  let {
    show,
    mode,
    name,
    description,
    onClose,
    onSave,
    onNameChange,
    onDescriptionChange,
  }: Props = $props();
</script>

{#if show}
  <div class="modal-backdrop" onclick={onClose}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h3>
        {mode === "create" ? "새 플레이리스트 만들기" : "플레이리스트 수정"}
      </h3>
      <div class="form-group">
        <label>플레이리스트 이름</label>
        <input
          type="text"
          value={name}
          oninput={(e) => onNameChange(e.currentTarget.value)}
          placeholder="플레이리스트 이름"
        />
      </div>
      <div class="form-group">
        <label>설명</label>
        <textarea
          value={description}
          oninput={(e) => onDescriptionChange(e.currentTarget.value)}
          placeholder="플레이리스트 설명"
          rows="4"
        ></textarea>
      </div>
      <div class="button-group">
        <button class="btn-primary" onclick={onSave}>
          {mode === "create" ? "생성" : "저장"}
        </button>
        <button class="btn-secondary" onclick={onClose}>취소</button>
      </div>
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
  }

  .modal {
    background-color: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 500px;
    width: 90%;
  }

  h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #333;
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

  input,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: #ff3e00;
  }

  .button-group {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
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
