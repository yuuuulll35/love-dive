<script lang="ts">
  import { loadImageFile, pairImage } from './store.svelte';

  let input: HTMLInputElement;
  let error = $state('');
  let dragging = $state(false);
  let busy = $state(false);

  async function take(file: File | undefined) {
    if (!file) return;
    error = '';
    busy = true;
    try {
      pairImage.set(await loadImageFile(file), file.name);
    } catch (e) {
      error = (e as Error).message === 'size' ? '15MB 이하 이미지만 넣을 수 있어요.' : '배경 없는 PNG 파일만 넣을 수 있어요.';
    } finally {
      busy = false;
      input.value = '';
    }
  }
</script>

<div class="field">
  <span class="label" id="pair-image-label">페어 이미지 (선택)</span>

  {#if pairImage.url}
    <div class="picked">
      <img src={pairImage.url} alt="선택한 페어 이미지" />
      <div class="info">
        <span class="name">{pairImage.name}</span>
        <span class="hint">하트 추 대신 이 이미지가 가라앉아요</span>
      </div>
      <button type="button" class="swap" onclick={() => input.click()}>바꾸기</button>
      <button type="button" class="remove" onclick={() => pairImage.clear()} aria-label="이미지 빼기">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
      </button>
    </div>
  {:else}
    <button
      type="button"
      class="drop"
      class:dragging
      aria-labelledby="pair-image-label"
      onclick={() => input.click()}
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => {
        e.preventDefault();
        dragging = false;
        take(e.dataTransfer?.files[0]);
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.4" /><circle cx="7.5" cy="8" r="1.6" fill="currentColor" /><path d="M3 15l4.5-4.5 3 3 2.5-2.5L17 15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" /></svg>
      <span>{busy ? '불러오는 중…' : '이미지 고르기'}</span>
      <small>배경 없는 PNG</small>
    </button>
  {/if}

  <input
    bind:this={input}
    id="pair-image"
    type="file"
    accept="image/png"
    hidden
    onchange={(e) => take(e.currentTarget.files?.[0])}
  />
  {#if error}<p class="err" role="alert">{error}</p>{/if}
</div>

<style lang="scss">
  .field {
    display: grid;
    gap: 6px;
  }

  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-dim);
    letter-spacing: 0.02em;
  }

  .drop {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 0 16px;
    border-radius: var(--radius-sm);
    border: 1px dashed var(--line-strong);
    background: var(--well, rgba(2, 10, 24, 0.25));
    color: var(--ink-dim);
    font-size: 15px;
    text-align: left;
    transition:
      border-color 0.2s,
      background 0.2s;

    small {
      margin-left: auto;
      font-size: 11.5px;
      color: var(--ink-faint);
    }
    &.dragging,
    &:hover {
      border-color: var(--biolume);
      background: rgba(127, 246, 228, 0.06);
    }
  }

  .picked {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line-strong);
    background: var(--well, rgba(2, 10, 24, 0.38));

    img {
      flex: none;
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: contain;
      background: repeating-conic-gradient(var(--tint, rgba(255, 255, 255, 0.08)) 0 25%, transparent 0 50%) 0 0 / 12px 12px;
    }
  }

  .info {
    display: grid;
    min-width: 0;
    flex: 1;

    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 14px;
    }
    .hint {
      font-size: 12px;
      color: var(--ink-faint);
    }
  }

  .swap,
  .remove {
    flex: none;
    display: grid;
    place-items: center;
    min-height: 36px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink-dim);
    font-size: 13px;
  }
  .remove {
    width: 36px;
    padding: 0;
  }

  .err {
    margin: 0;
    font-size: 12.5px;
    color: var(--danger);
  }
</style>
