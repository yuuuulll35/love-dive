<script lang="ts">
  import { router } from '$app/router.svelte';
  import { decodeInput } from '$features/decode-code/decode';
  import { decodeToken } from '$features/share-result/token';
  import ShareActions from '$features/share-result/ShareActions.svelte';
  import DiveScene from '$widgets/dive-scene/DiveScene.svelte';
  import ResultCard from '$widgets/result-card/ResultCard.svelte';
  import ResultAnalysis from '$widgets/result-card/ResultAnalysis.svelte';
  import Button from '$shared/ui/Button.svelte';
  import Corners from '$shared/ui/Corners.svelte';
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
  // 처음 재생할 때만 소리를 켤지 묻는다 (연출 다시 보기·reduced-motion 은 묻지 않음)
  let asking = $state(!reduced);

  function begin(withSound: boolean) {
    sound.set(withSound);
    asking = false;
  }
  let card = $state<HTMLElement>();
  let scene = $state<{ skip: () => void }>();

  function replay() {
    showResult = false;
    instant = false;
    replayKey++;
  }

  // 다시 측정은 처음부터: 입력 칸(코드·페어 이름)은 입력 화면이 새로 그려지며 비워지고, 메모리에 남는 페어 이미지도 비운다
  function retry() {
    router.go('#');
    pairImage.clear();
  }
</script>

{#if outcome?.ok}
  {@const r = outcome.result}
  {#key replayKey}
    <DiveScene bind:this={scene} result={r} image={pairImage.for(token)} {instant} paused={asking} ondone={() => (showResult = true)} />
  {/key}

  {#if asking}
    <div class="ask" role="dialog" aria-modal="true" aria-labelledby="ask-title">
      <div class="ask-card paper">
        <Corners />
        <svg class="ask-icon" width="28" height="28" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7h3l4-3v10l-4-3H3z" fill="currentColor" /><path d="M12.5 6.5a3.5 3.5 0 010 5M14.5 4.5a6.4 6.4 0 010 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>
        <p class="ask-title" id="ask-title">소리를 켤까요?</p>
        <p class="ask-sub">물에 빠지는 소리, 고래 울음, 깊은 바다의 웅웅거림이 들려요.</p>
        <div class="ask-actions">
          <Button variant="primary" block onclick={() => begin(true)}>소리 켜고 시작</Button>
          <button type="button" class="ask-mute" onclick={() => begin(false)}>소리 없이 시작</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="controls" class:hidden={showResult || asking}>
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
        <ResultCard result={r} image={pairImage.for(token)} bind:node={card} />
        <ResultAnalysis result={r} />
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
    <div class="err-card paper">
      <Corners />
      <p class="mono code">NO SIGNAL</p>
      <h1>{outcome && !outcome.ok ? outcome.message : ERROR_COPY.signal}</h1>
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

  // 시작 전 소리 묻기: 하늘 위에 뜨는 카드
  .ask {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: var(--gutter);
    background: rgba(43, 53, 102, 0.12);
    animation: reveal 0.4s var(--ease-out) both;
  }

  .ask-card {
    display: grid;
    justify-items: center;
    gap: 6px;
    width: 100%;
    max-width: 320px;
    padding: 28px 22px 18px;
    text-align: center;
  }

  .ask-icon {
    color: #ff5c7a;
    margin-bottom: 4px;
  }

  .ask-title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
  }

  .ask-sub {
    margin: 0 0 14px;
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--ink-dim);
    text-wrap: balance;
  }

  .ask-actions {
    display: grid;
    gap: 4px;
    width: 100%;
  }

  .ask-mute {
    min-height: 44px;
    border: 0;
    background: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--ink-dim);
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
    padding: 30px 22px 24px;
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
