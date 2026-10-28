<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { copyText } from '$features/share-result/clipboard';

  interface Props {
    oncopied?: () => void;
  }
  let { oncopied }: Props = $props();

  let source = $state('');
  let failed = $state(false);
  let copied = $state(false);

  $effect(() => {
    fetch(`${import.meta.env.BASE_URL}ooc-prompt.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => (source = t.trim()))
      .catch(() => (failed = true));
  });

  async function copy() {
    if (!source) return;
    copied = await copyText(source);
    if (copied) oncopied?.();
  }
</script>

<div class="prompt">
  <Button variant="ghost" block onclick={copy} disabled={!source}>
    {#if copied}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
      복사했어요 · 다시 복사
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10h.3" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
      OOC 복사하기
    {/if}
  </Button>
  {#if failed}<p class="err">프롬프트를 불러오지 못했습니다. 새로고침해 주세요.</p>{/if}
  <p class="sr-only" aria-live="polite">{copied ? 'OOC를 복사했습니다' : ''}</p>
</div>

<style lang="scss">
  .prompt {
    display: grid;
    gap: 12px;

    p {
      margin: 0;
      font-size: 14px;
      color: var(--ink-dim);
    }
    .err {
      color: var(--danger);
      font-size: 13px;
    }
  }
</style>
