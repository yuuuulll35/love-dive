<script lang="ts">
  import { router } from '$app/router.svelte';
  import { decodeInput } from '$features/decode-code/decode';
  import { decodeToken } from '$features/share-result/token';
  import ShareActions from '$features/share-result/ShareActions.svelte';
  import DiveScene from '$widgets/dive-scene/DiveScene.svelte';
  import ResultCard from '$widgets/result-card/ResultCard.svelte';
  import Button from '$shared/ui/Button.svelte';
  import { sound } from '$shared/lib/sound.svelte';
  import { pairImage } from '$features/pair-image/store.svelte';
  import { ERROR_COPY } from '$shared/config/copy';

  interface Props {
    token: string;
  }
  let { token }: Props = $props();

  const outcome = $derived.by(() => {
    const t = decodeToken(token);
    return t ? decodeInput(t.code, t.pair) : null;
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let showResult = $state(false);
  let replayKey = $state(0);
  let instant = $state(reduced);
  let card = $state<HTMLElement>();
  let scene = $state<{ skip: () => void }>();

  function replay() {
    showResult = false;
    instant = false;
    replayKey++;
  }

  function retry() {
    router.go('#/');
  }
</script>

{#if outcome?.ok}
  {@const r = outcome.result}
  {#key replayKey}
    <DiveScene bind:this={scene} result={r} {instant} ondone={() => (showResult = true)} />
  {/key}

  <div class="controls" class:hidden={showResult}>
    <button class="ctl mono" type="button" onclick={() => sound.toggle()} aria-pressed={sound.enabled} aria-label="효과음">
      {#if sound.enabled}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7h3l4-3v10l-4-3H3z" fill="currentColor" /><path d="M12.5 6.5a3.5 3.5 0 010 5M14.5 4.5a6.4 6.4 0 010 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
      {:else}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7h3l4-3v10l-4-3H3z" fill="currentColor" /><path d="M12.5 7l4 4M16.5 7l-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
      {/if}
    </button>
    <button class="ctl skip" type="button" onclick={() => scene?.skip()}>
      건너뛰기
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l5 4-5 4zM9 3v8" fill="currentColor" stroke="currentColor" stroke-width="1.2" /></svg>
    </button>
  </div>

  {#if showResult}
    <main class="result" aria-live="polite">
      <div class="stack">
        <ResultCard result={r} image={pairImage.url} bind:node={card} />
        <ShareActions
          {card}
          filename="love-dive-{r.kind === 'void' ? 'abyss' : Math.round(r.depth) + 'm'}.png"
          onretry={retry}
          onreplay={replay}
        />
      </div>
    </main>
  {/if}
{:else}
  <main class="error">
    <div class="err-card">
      <p class="mono code">NO SIGNAL</p>
      <h1 class="serif">{outcome && !outcome.ok ? outcome.message : ERROR_COPY.signal}</h1>
      <p>링크가 손상되었거나 측정 코드가 올바르지 않습니다.</p>
      <Button variant="primary" block onclick={retry}>다시 측정하기</Button>
    </div>
  </main>
{/if}

<style lang="scss">
  .controls {
    position: fixed;
    top: max(14px, env(safe-area-inset-top));
    left: 0;
    right: 0;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    padding: 0 var(--gutter);
    pointer-events: none;
    transition: opacity 0.4s;

    &.hidden {
      opacity: 0;
      visibility: hidden;
    }
  }

  .ctl {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    min-width: 40px;
    justify-content: center;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: rgba(4, 16, 34, 0.35);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #fff;
    font-size: 13px;
  }

  .skip {
    font-family: var(--font-sans);
    font-weight: 500;
  }

  .result {
    position: fixed;
    inset: 0;
    z-index: 20;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: linear-gradient(to bottom, rgba(0, 4, 12, 0.25), rgba(0, 4, 12, 0.6));
    animation: reveal 0.9s var(--ease-out) both;
  }

  .stack {
    display: grid;
    gap: 22px;
    padding: max(28px, env(safe-area-inset-top)) var(--gutter) calc(32px + env(safe-area-inset-bottom));
    min-height: 100%;
    align-content: center;
  }

  .error {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: var(--gutter);
    background: radial-gradient(ellipse at 50% 0%, #0b2346, #02050c 70%);
  }

  .err-card {
    width: 100%;
    max-width: 380px;
    display: grid;
    gap: 14px;
    text-align: center;

    .code {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.3em;
      color: var(--thread);
    }
    h1 {
      margin: 0;
      font-size: 21px;
      line-height: 1.5;
    }
    p {
      margin: 0 0 8px;
      color: var(--ink-dim);
      font-size: 14px;
    }
  }

  @keyframes reveal {
    from {
      opacity: 0;
      backdrop-filter: blur(0);
    }
    to {
      opacity: 1;
    }
  }
</style>
