<script lang="ts">
  import { tick } from 'svelte';
  import { router } from '$app/router.svelte';
  import { decodeInput } from '$features/decode-code/decode';
  import { diveHash } from '$features/share-result/token';
  import PromptPanel from '$features/ooc-prompt/PromptPanel.svelte';
  import SelfTest from '$features/self-test/SelfTest.svelte';
  import ImagePicker from '$features/pair-image/ImagePicker.svelte';
  import Plummet from '$widgets/dive-scene/Plummet.svelte';
  import WaterSurface from '$widgets/dive-scene/WaterSurface.svelte';
  import Button from '$shared/ui/Button.svelte';
  import TextField from '$shared/ui/TextField.svelte';
  import InfoTip from '$shared/ui/InfoTip.svelte';
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

  const zoneLegend = ZONES.slice(1).map((z) => ({
    ...z,
    range: `${z.from.toLocaleString()} – ${Number.isFinite(z.to) ? z.to.toLocaleString() : '10,935'}m`,
  }));
</script>

<main class="page">
  <!-- ───────── 하늘 · 수면 ───────── -->
  <section class="hero" aria-labelledby="site-title">
    <div class="sky">
      <div class="sun" aria-hidden="true"></div>
      <div class="brand">
        <p class="eyebrow mono">PAIR WEIGHT · DEPTH SOUNDER</p>
        <h1 id="site-title">
          <span class="en">LOVE DIVE</span>
          <span class="ko">러브 다이브</span>
        </h1>
        <p class="tagline serif">둘의 관계는, 몇 미터까지 가라앉을까.</p>
      </div>
      <div class="hang" aria-hidden="true">
        <Plummet size={38} thread={900} />
      </div>
    </div>

    <div class="horizon">
      <WaterSurface />
    </div>

    <div class="shallow">
      <p class="lede">
        두 사람의 관계를 <strong>12개의 축</strong>으로 재고,<br />
        그 무게만큼 바다에 가라앉힙니다.
      </p>
      <a
        class="jump"
        href="#get-code"
        onclick={(e) => {
          e.preventDefault();
          document.getElementById('get-code')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        측정하러 내려가기
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </a>
    </div>
  </section>

  <!-- ───────── 물속 ───────── -->
  <div class="sea">
    <div class="col">
      <section class="glass" id="get-code" aria-labelledby="get-code-title">
        <header>
          <span class="step mono">01</span>
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

      <form class="glass form" id="measure" onsubmit={submit} novalidate aria-labelledby="measure-title">
        <header>
          <span class="step mono">02</span>
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
    min-height: max(560px, 100svh);
    display: grid;
    grid-template-rows: 1fr auto auto;
    overflow: hidden;
  }

  .sky {
    position: relative;
    display: grid;
    align-content: center;
    justify-items: center;
    padding: 72px var(--gutter) 56px;
    background: linear-gradient(to bottom, var(--sky-top), var(--sky-mid) 55%, var(--sky-bottom));
    color: var(--sky-ink);
    text-align: center;
  }

  .sun {
    position: absolute;
    left: 50%;
    bottom: -60px;
    width: 260px;
    height: 260px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 245, 230, 0.95), rgba(255, 214, 196, 0.35) 45%, transparent 70%);
    pointer-events: none;
  }

  .brand {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    margin: 0 0 12px;
    font-size: 10.5px;
    letter-spacing: 0.24em;
    color: var(--sky-ink-dim);
  }

  h1 {
    margin: 0;
    display: grid;
    gap: 4px;

    .en {
      font-family: var(--font-serif);
      font-weight: 700;
      font-size: clamp(46px, 15vw, 84px);
      line-height: 0.95;
      letter-spacing: 0.02em;
    }
    .ko {
      font-family: var(--font-sans);
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.5em;
      margin-right: -0.5em;
      color: var(--sky-ink-dim);
    }
  }

  .tagline {
    margin: 18px 0 0;
    font-size: 16px;
    color: var(--sky-ink);
  }

  .hang {
    position: absolute;
    right: max(22px, calc(50% - 230px));
    bottom: 34px;
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
    display: grid;
    align-content: start;
    justify-items: center;
    gap: 22px;
    padding: 22px var(--gutter) 44px;
    background: linear-gradient(to bottom, var(--sea-surface), var(--sea-shallow));
    text-align: center;
    color: #fff;
  }

  .lede {
    margin: 0;
    font-size: 15px;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 1px 10px rgba(0, 60, 80, 0.3);

    strong {
      font-weight: 600;
    }
  }

  .jump {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);

    svg {
      animation: bob 1.8s ease-in-out infinite;
    }
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

  .glass {
    display: grid;
    gap: 16px;
    padding: 20px 18px;
    border-radius: 20px;
    background: var(--glass);
    border: 1px solid var(--line);
    backdrop-filter: blur(14px) saturate(1.2);
    -webkit-backdrop-filter: blur(14px) saturate(1.2);
    box-shadow: 0 20px 60px -30px rgba(0, 0, 0, 0.6);
    scroll-margin-top: 24px;

    header {
      display: flex;
      gap: 12px;
      align-items: center;

      h2 {
        flex: 1;
        margin: 0;
        font-family: var(--font-serif);
        font-size: 19px;
        font-weight: 700;
      }
    }
  }

  .step {
    flex: none;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    font-size: 11px;
    color: var(--biolume);
  }

  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(2, 10, 24, 0.35);
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
        background: rgba(255, 255, 255, 0.12);
        color: var(--ink);
      }
    }
  }

  .form {
    border-color: rgba(255, 77, 109, 0.28);
    box-shadow:
      0 20px 60px -30px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 77, 109, 0.06),
      0 0 60px -20px rgba(255, 77, 109, 0.35);
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
    background: rgba(255, 138, 138, 0.1);
    border: 1px solid rgba(255, 138, 138, 0.3);
    color: #ffc2c2;
    font-size: 13.5px;
  }
  .msg .example {
    background: rgba(127, 246, 228, 0.08);
    border-color: rgba(127, 246, 228, 0.3);
    color: var(--biolume);
  }

  // 툴팁 내용
  .tip-title {
    margin: 0 0 8px;
    font-family: var(--font-serif);
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
      border: 1px solid rgba(255, 255, 255, 0.25);
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
