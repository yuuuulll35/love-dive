<script lang="ts">
  import { tick } from 'svelte';
  import { router } from '$app/router.svelte';
  import { decodeInput } from '$features/decode-code/decode';
  import { diveHash, encodeToken } from '$features/share-result/token';
  import { pairImage } from '$features/pair-image/store.svelte';
  import PromptPanel from '$features/ooc-prompt/PromptPanel.svelte';
  import SelfTest from '$features/self-test/SelfTest.svelte';
  import ImagePicker from '$features/pair-image/ImagePicker.svelte';
  import Plummet from '$widgets/dive-scene/Plummet.svelte';
  import WaterSurface from '$widgets/dive-scene/WaterSurface.svelte';
  import Button from '$shared/ui/Button.svelte';
  import TextField from '$shared/ui/TextField.svelte';
  import InfoTip from '$shared/ui/InfoTip.svelte';
  import Corners from '$shared/ui/Corners.svelte';
  import { ZONES } from '$entities/abyss';

  type Mode = 'ai' | 'test';
  let mode = $state<Mode>('ai');
  let code = $state('');
  let pair = $state('');
  let error = $state<{ kind: string; message: string } | null>(null);
  let shake = $state(0);
  /** 코드 칸 위 안내 (프롬프트 복사·테스트 완료 직후) */
  let notice = $state<{ kind: 'ai' | 'test'; text: string } | null>(null);
  let glow = $state(0);

  function submit(e: SubmitEvent) {
    e.preventDefault();
    const r = decodeInput(code, pair);
    if (!r.ok) {
      error = r;
      shake++;
      return;
    }
    error = null;
    pairImage.attach(encodeToken(r.code, r.pair));
    router.go(diveHash(r.code, r.pair));
  }

  async function handOff(next: typeof notice) {
    notice = next;
    error = null;
    glow++;
    await tick();
    document.getElementById('measure')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onCopied() {
    handOff({ kind: 'ai', text: 'OOC로 받은 결과값을 여기에 붙여넣어 주세요.' });
  }

  function onTested(generated: string) {
    code = generated;
    handOff({ kind: 'test', text: '테스트 결과값이 들어갔어요.' });
  }

  // 하늘에 흩어진 반짝이 [x%, y%, 크기px, 색]
  const STAR = 'M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z';
  const SPARKS = [
    [16, 30, 14, 'ink'], [22, 62, 9, 'pink'], [80, 24, 11, 'pink'], [86, 54, 15, 'ink'],
    [10, 76, 8, 'white'], [70, 12, 8, 'white'], [92, 80, 9, 'white'],
  ] as const;

  const zoneLegend = ZONES.slice(1).map((z) => ({
    ...z,
    range: `${z.from.toLocaleString()} – ${Number.isFinite(z.to) ? z.to.toLocaleString() : '10,935'}m`,
  }));
</script>

<main class="page">
  <!-- ───────── 하늘 · 수면 ───────── -->
  <section class="hero" aria-labelledby="site-title">
    <div class="sky">
      {#each SPARKS as [x, y, sz, c], i (i)}
        <svg class="spark {c}" style:left="{x}%" style:top="{y}%" style:width="{sz}px" style:--d="{i * 0.6}s" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
      {/each}
      <span class="cloud c1" aria-hidden="true"></span>
      <span class="cloud c2" aria-hidden="true"></span>
      <span class="cloud c3" aria-hidden="true"></span>

      <h1 id="site-title" class="logo" aria-label="LOVE DIVE">
        <span aria-hidden="true"
          >L<svg class="o" viewBox="0 0 44 40"
            ><path d="M22 38C11 31 3 24 3 15.5 3 9.6 7.7 5 13.4 5c3.6 0 6.8 1.8 8.6 4.6C23.8 6.8 27 5 30.6 5 36.3 5 41 9.6 41 15.5 41 24 33 31 22 38z" /><ellipse
              cx="13.5"
              cy="13"
              rx="4"
              ry="3"
              fill="#fff"
              opacity="0.6"
            /></svg
          >VE</span
        >
        <span aria-hidden="true">DIVE</span>
      </h1>
      <p class="tagline">우리 사랑은 얼마나 무거울까?</p>
      <a
        class="jump"
        href="#get-code"
        onclick={(e) => {
          e.preventDefault();
          document.getElementById('get-code')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        측정하러 가기
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>

      <div class="hang" aria-hidden="true">
        <Plummet size={34} thread={900} />
      </div>
    </div>

    <div class="horizon">
      <WaterSurface />
    </div>

    <div class="shallow">
      <span class="rise r1" aria-hidden="true"></span>
      <span class="rise r2" aria-hidden="true"></span>
      <span class="rise r3" aria-hidden="true"></span>
    </div>
  </section>

  <!-- ───────── 물속 ───────── -->
  <div class="sea">
    <div class="col">
      <section class="glass paper" id="get-code" aria-labelledby="get-code-title">
        <Corners />
        <header>
          <span class="step">I</span>
          <h2 id="get-code-title">측정 코드 테스트</h2>
        </header>

        <div class="tabs" role="tablist" aria-label="측정 방식">
          <button
            type="button"
            role="tab"
            id="tab-ai"
            aria-selected={mode === 'ai'}
            aria-controls="panel-ai"
            class:on={mode === 'ai'}
            onclick={() => (mode = 'ai')}
          >
            <span>OOC로 결과보기</span>
            <small>롤플레이 대화로 판정</small>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-test"
            aria-selected={mode === 'test'}
            aria-controls="panel-test"
            class:on={mode === 'test'}
            onclick={() => (mode = 'test')}
          >
            <span>직접 테스트하기</span>
            <small>24문항 · 약 3분</small>
          </button>
        </div>

        <div id="panel-ai" role="tabpanel" aria-labelledby="tab-ai" hidden={mode !== 'ai'}>
          <PromptPanel oncopied={onCopied} />
        </div>
        <div id="panel-test" role="tabpanel" aria-labelledby="tab-test" hidden={mode !== 'test'}>
          <SelfTest oncomplete={onTested} />
        </div>
      </section>

      <form class="glass paper form" id="measure" onsubmit={submit} novalidate aria-labelledby="measure-title">
        <Corners />
        <header>
          <span class="step">II</span>
          <h2 id="measure-title">결과값 넣기</h2>
          <InfoTip label="바다의 층 보기">
            <p class="tip-title">바다의 층</p>
            <ol class="zones">
              {#each zoneLegend as z (z.id)}
                <li class={z.id}>
                  <span class="swatch" aria-hidden="true"></span>
                  <span>{z.name}</span>
                  <span class="mono">{z.range}</span>
                </li>
              {/each}
              <li class="hidden-zone">
                <span class="swatch" aria-hidden="true"></span>
                <span>???</span>
                <span class="mono">— m</span>
              </li>
            </ol>
            <p class="tip-note">5m보다 얕으면 가라앉지 않고 떠오릅니다.</p>
          </InfoTip>
        </header>

        {#if notice}
          {#key glow}
            <p class="notice" class:test={notice.kind === 'test'}>{notice.text}</p>
          {/key}
        {/if}

        {#key shake}
          <div class="shake" class:on={shake > 0 && !!error}>
            {#key glow}
              <div class="code-field" class:glow={glow > 0}>
                <TextField
                  label="측정 코드"
                  bind:value={code}
                  mono
                  placeholder="ABYSS-XXXX-XXXX-XXXX-XX"
                  autocomplete="off"
                  autocapitalize="characters"
                  spellcheck={false}
                  invalid={!!error && error.kind !== 'example'}
                  oninput={() => (error = null)}
                />
              </div>
            {/key}
          </div>
        {/key}

        <TextField label="페어 이름 (선택)" bind:value={pair} placeholder="예: 하루 × 유키" maxlength={40} />

        <ImagePicker />

        <div class="msg" role="alert" aria-live="assertive">
          {#if error}
            <p class:example={error.kind === 'example'}>{error.message}</p>
          {/if}
        </div>

        <Button variant="primary" block type="submit">
          측정하기
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M4 9l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </Button>
      </form>
    </div>
  </div>
</main>

<style lang="scss">
  .page {
    min-height: 100dvh;
    background: var(--sea-deep);
  }

  // ───────── 히어로 ─────────
  .hero {
    position: relative;
    display: grid;
    overflow: hidden;
  }

  .sky {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 14px;
    padding: 96px var(--gutter) 84px;
    background: linear-gradient(to bottom, #ffd3df 0%, #ffe6da 48%, #d6f0fb 100%);
    color: #2b3566;
    text-align: center;
  }

  // 하늘 위 종이 결
  .sky::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: var(--grain);
    opacity: 0.16;
    mix-blend-mode: multiply;
  }

  .spark {
    position: absolute;
    fill: #2b3566;
    opacity: 0.75;
    translate: -50% -50%;
    animation: twinkle 3.4s ease-in-out var(--d) infinite alternate;

    &.pink {
      fill: #ff7d96;
    }
    &.white {
      fill: #fff;
      opacity: 0.95;
    }
  }
  @keyframes twinkle {
    to {
      opacity: 0.25;
      scale: 0.8;
    }
  }

  // 뭉게구름: 원 세 개를 겹친 덩어리
  .cloud {
    position: absolute;
    width: 92px;
    height: 30px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.85);
    animation: drift 18s ease-in-out infinite alternate;

    &::before,
    &::after {
      content: '';
      position: absolute;
      bottom: 8px;
      border-radius: 50%;
      background: inherit;
    }
    &::before {
      left: 14px;
      width: 38px;
      height: 38px;
    }
    &::after {
      left: 40px;
      width: 30px;
      height: 30px;
    }
  }
  .c1 {
    top: 46px;
    left: 8%;
  }
  .c2 {
    top: 120px;
    right: 6%;
    transform: scale(0.75);
    animation-duration: 22s;
    animation-direction: alternate-reverse;
  }
  .c3 {
    bottom: 26px;
    left: 4%;
    transform: scale(0.55);
    opacity: 0.8;
    animation-duration: 26s;
  }

  .logo {
    position: relative;
    margin: 0;
    display: grid;
    font-family: var(--font-logo);
    font-weight: 700;
    font-size: clamp(64px, 21vw, 112px);
    line-height: 0.88;
    letter-spacing: -0.01em;
    color: #2b3566;
    // 스티커처럼 살짝 밀린 분홍 그림자
    text-shadow: 4px 4px 0 #ffb3c6;

    .o {
      display: inline-block;
      width: 0.88em;
      aspect-ratio: 44 / 40;
      // 하트를 키우고 L·V 쪽으로 바짝 당긴다 (V 의 왼쪽 사선 여백까지 감안)
      margin: 0 -0.11em 0 -0.09em;
      vertical-align: -0.1em;
      fill: #ff5c7a;
      filter: drop-shadow(4px 4px 0 #ffb3c6);
    }
  }

  .tagline {
    position: relative;
    margin: 6px 0 0;
    font-family: var(--font-sans);
    font-weight: 600;
    font-size: clamp(15px, 4.3vw, 18px);
    letter-spacing: -0.01em;
    color: #2b3566;
  }

  .hang {
    position: absolute;
    right: max(22px, calc(50% - 230px));
    bottom: 30px;
    transform-origin: 50% -900px;
    animation: pendulum 5.5s ease-in-out infinite alternate;
  }

  .horizon {
    position: relative;
    z-index: 1;
    margin-top: -38px;
    background: linear-gradient(to bottom, transparent 38px, var(--sea-surface) 38px);
  }

  .shallow {
    position: relative;
    display: grid;
    justify-items: center;
    min-height: 56px;
    padding: 0 var(--gutter);
    background: linear-gradient(to bottom, var(--sea-surface), var(--sea-shallow));
    text-align: center;
    color: #fff;
    overflow: hidden;
  }

  .jump {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px 11px;
    border-radius: 999px;
    position: relative;
    margin-top: 10px;
    background: #2b3566;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 4px 0 #ffb3c6;
    transition: transform 0.15s var(--ease-out);

    &:active {
      transform: translateY(2px);
      box-shadow: 0 2px 0 #ffb3c6;
    }
    svg {
      animation: bob 1.8s ease-in-out infinite;
    }
  }

  // 올라가는 기포
  .rise {
    position: absolute;
    bottom: -20px;
    width: 10px;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.7);
    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.7), transparent 60%);
    animation: rise 7s linear infinite;
  }
  .r1 {
    left: 12%;
  }
  .r2 {
    left: 82%;
    width: 7px;
    animation-delay: -2.5s;
    animation-duration: 6s;
  }
  .r3 {
    left: 68%;
    width: 13px;
    animation-delay: -4.5s;
    animation-duration: 8s;
  }

  // ───────── 물속 ─────────
  .sea {
    position: relative;
    padding: 8px var(--gutter) calc(64px + env(safe-area-inset-bottom));
    background: linear-gradient(to bottom, var(--sea-shallow) 0%, var(--sea-twilight) 30%, #0a2a5c 65%, var(--sea-deep) 100%);
  }

  .col {
    position: relative;
    display: grid;
    gap: 16px;
    max-width: var(--maxw);
    margin: 0 auto;
  }

  // 종이 카드 (.paper 는 global.scss)
  .glass {
    display: grid;
    gap: 16px;
    padding: 26px 22px 24px;
    scroll-margin-top: 24px;

    header {
      display: flex;
      gap: 12px;
      align-items: center;

      h2 {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
    }
  }

  // 타로 카드 번호
  .step {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid var(--frame-ink);
    box-shadow: inset 0 0 0 2px var(--paper-bg), inset 0 0 0 3px rgba(49, 80, 138, 0.3);
    font-family: var(--font-serif);
    font-size: 16px;
    font-weight: 600;
    font-variant-numeric: lining-nums;
    line-height: 1;
    color: var(--frame-ink);
  }

  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 4px;
    border-radius: 12px;
    background: var(--well);
    border: 1px solid var(--line);

    button {
      display: grid;
      gap: 1px;
      padding: 10px 6px;
      border: 0;
      border-radius: 9px;
      background: transparent;
      color: var(--ink-dim);
      text-align: center;
      transition:
        background 0.2s,
        color 0.2s;

      span {
        font-size: 14.5px;
        font-weight: 600;
      }
      small {
        font-size: 11.5px;
        opacity: 0.75;
      }
      &.on {
        background: #fff;
        color: var(--ink);
        box-shadow: 0 0 0 1px var(--line-strong), 0 2px 6px -2px rgba(49, 80, 138, 0.3);
      }
    }
  }



  .notice {
    margin: -4px 0 -6px;
    font-size: 13.5px;
    color: var(--ink);
    animation: fade-in 0.5s var(--ease-out);

    &::before {
      content: '↓ ';
      color: var(--thread);
    }
    &.test::before {
      content: '✓ ';
      color: var(--biolume);
    }
  }

  .code-field.glow :global(input) {
    animation: glow 1.6s var(--ease-out);
  }

  .shake.on {
    animation: shake 0.4s;
  }

  .msg p {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: rgba(214, 69, 93, 0.07);
    border: 1px solid rgba(214, 69, 93, 0.3);
    color: var(--danger);
    font-size: 13.5px;
  }
  .msg .example {
    background: rgba(31, 138, 150, 0.07);
    border-color: rgba(31, 138, 150, 0.3);
    color: var(--biolume);
  }

  // 툴팁 내용
  .tip-title {
    margin: 0 0 8px;
    font-weight: 700;
    font-size: 15px;
  }
  .tip-note {
    margin: 10px 0 0;
    font-size: 12px;
    color: var(--ink-faint);
  }
  .zones {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 12px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 7px 0;
      border-bottom: 1px solid var(--line);
      font-size: 13.5px;

      .mono {
        font-size: 11px;
        color: var(--ink-faint);
      }
    }
    .swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      border: 1px solid var(--line-strong);
    }
    .sunlight .swatch { background: #40c4ce; }
    .twilight .swatch { background: #0a5884; }
    .midnight .swatch { background: #081a42; }
    .abyss .swatch { background: #030610; }
    .hadal .swatch { background: #000; }
    .hidden-zone {
      color: var(--ink-faint);
      border-bottom: 0 !important;
      .swatch {
        background: repeating-linear-gradient(45deg, #ff4d6d 0 2px, #000 2px 4px);
      }
    }
  }

  @keyframes drift {
    to {
      translate: 18px 0;
    }
  }
  @keyframes rise {
    to {
      transform: translateY(-260px);
      opacity: 0;
    }
  }
  @keyframes pendulum {
    from { transform: rotate(-0.6deg); }
    to { transform: rotate(0.6deg); }
  }
  @keyframes bob {
    50% { transform: translateY(3px); }
  }
  @keyframes shake {
    20%, 60% { transform: translateX(-6px); }
    40%, 80% { transform: translateX(6px); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
  }
  @keyframes glow {
    0%, 40% {
      border-color: var(--biolume);
      box-shadow: 0 0 0 4px rgba(127, 246, 228, 0.18), 0 0 24px rgba(127, 246, 228, 0.35);
    }
  }
</style>
