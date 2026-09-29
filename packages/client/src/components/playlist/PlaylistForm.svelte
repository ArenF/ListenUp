<script lang="ts">
  import Modal from "../common/Modal.svelte";

  interface Props {
    show: boolean;
    mode: "create" | "edit";
    name: string;
    description: string;
    onClose: () => void;
    onSave: () => void;
  }

  let {
    show,
    mode,
    name = $bindable(),
    description = $bindable(),
    onClose,
    onSave,
  }: Props = $props();

  const title = $derived(
    mode === "create" ? "새 플레이리스트 만들기" : "플레이리스트 수정"
  );
</script>

{#if show}
  <Modal label={title} {onClose}>
    <h3>{title}</h3>
    <div class="form-group">
      <label for="playlist-name">플레이리스트 이름</label>
      <input
        id="playlist-name"
        type="text"
        bind:value={name}
        placeholder="플레이리스트 이름"
      />
    </div>
    <div class="form-group">
      <label for="playlist-description">설명</label>
      <textarea
        id="playlist-description"
        bind:value={description}
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
  </Modal>
{/if}

<style>
  h3 {
    margin-top: 0;
    margin-bottom: var(--space-6);
    color: var(--text-primary);
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

  input,
  textarea {
    width: 100%;
    padding: var(--space-3);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    box-sizing: border-box;
    background: var(--bg-surface);
    color: var(--text-primary);
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }

  .button-group {
    display: flex;
    gap: var(--space-2);
    justify-content: flex-end;
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
