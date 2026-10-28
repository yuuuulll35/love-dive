<script lang="ts">
  import { router } from '$app/router.svelte';
  import { decodeInput } from '$features/decode-code/decode';
  import { diveHash } from '$features/share-result/token';
  import PromptPanel from '$features/ooc-prompt/PromptPanel.svelte';
  import Plummet from '$widgets/dive-scene/Plummet.svelte';
  import WaterSurface from '$widgets/dive-scene/WaterSurface.svelte';
  import Button from '$shared/ui/Button.svelte';
  import TextField from '$shared/ui/TextField.svelte';
  import { ZONES } from '$entities/abyss';

  let code = $state('');
  let pair = $state('');
  let error = $state<{ kind: string; message: string } | null>(null);
  let shake = $state(0);

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

  const axisGroups = [
    { name: '무게', desc: '수심을 끌어내린다', axes: ['집착', '의존', '폐쇄성', '파멸성', '비가역성', '농도', '결핍', '희생'] },
    { name: '보정', desc: '다른 축을 증폭한다', axes: ['일방성', '금기'] },
    { name: '부력', desc: '수심을 끌어올린다', axes: ['신뢰'] },
    { name: '성향', desc: '바다의 온도를 정한다', axes: ['온도'] },
  ];

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
        롤플레이 속 두 사람의 관계를 <strong>12개의 축</strong>으로 재고,<br />
        그 무게만큼 바다에 가라앉힙니다.
      </p>
      <div class="cta">
        <a class="jump" href="#measure" onclick={(e) => { e.preventDefault(); document.getElementById('measure')?.scrollIntoView({ behavior: 'smooth' }); }}>
          코드가 있다면 바로 측정
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v10M3 8l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </a>
      </div>
    </div>
  </section>

  <!-- ───────── 물속: 사용 단계 ───────── -->
  <div class="sea">
    <div class="ruler mono" aria-hidden="true">
      <span style:top="2%">10m</span>
      <span style:top="24%">200m</span>
      <span style:top="50%">1,000m</span>
      <span style:top="76%">4,000m</span>
    </div>

    <div class="col">
      <div class="glass">
        <PromptPanel />
      </div>

      <div class="glass step2">
        <header>
          <span class="step mono">02</span>
          <div>
            <h2>롤플레이 채팅에 붙여넣기</h2>
            <p>대화가 충분히 쌓인 시점에 보내 주세요. AI가 아래처럼 코드 한 줄만 답합니다.</p>
          </div>
        </header>
        <div class="sample mono" aria-label="코드 예시">
          <span class="h">ABYSS</span>-<span>????</span>-<span>????</span>-<span>????</span>-<span class="n">??</span>
        </div>
        <ul class="tips">
          <li>답이 코드가 아니라면 한 번 더 보내거나 재생성하세요.</li>
          <li>같은 페어라도 대화가 깊어질수록 결과가 달라집니다.</li>
        </ul>
      </div>

      <form class="glass form" id="measure" onsubmit={submit} novalidate>
        <header>
          <span class="step mono">03</span>
          <div>
            <h2>측정하기</h2>
            <p>받은 코드를 넣으면 측심추를 바다에 떨어뜨립니다.</p>
          </div>
        </header>

        {#key shake}
          <div class="shake" class:on={shake > 0 && !!error}>
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

        <TextField
          label="페어 이름 (선택)"
          bind:value={pair}
          placeholder="예: 하루 × 유키"
          maxlength={40}
          hint="입력하면 결과 카드에 함께 새겨집니다. 순서는 상관없어요."
        />

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

      <!-- 측정 원리 -->
      <section class="about" aria-labelledby="axes-title">
        <h2 id="axes-title" class="serif">무엇을 재나요</h2>
        <p class="sub">AI가 대화만을 근거로 열두 개의 축을 0부터 9까지 판정합니다. 축들은 서로 얽혀 있어서, 둘 다 높을 때만 크게 튀는 조합도 있습니다.</p>
        <div class="axes">
          {#each axisGroups as g (g.name)}
            <div class="axis-group">
              <p class="g-name">{g.name}<span>{g.desc}</span></p>
              <ul>
                {#each g.axes as a (a)}<li>{a}</li>{/each}
              </ul>
            </div>
          {/each}
        </div>
      </section>

      <section class="about" aria-labelledby="zones-title">
        <h2 id="zones-title" class="serif">바다의 층</h2>
        <ol class="zones">
          {#each zoneLegend as z (z.id)}
            <li class={z.id}>
              <span class="swatch" aria-hidden="true"></span>
              <span class="z-name">{z.name}</span>
              <span class="z-range mono">{z.range}</span>
            </li>
          {/each}
          <li class="hidden-zone">
            <span class="swatch" aria-hidden="true"></span>
            <span class="z-name">???</span>
            <span class="z-range mono">— m</span>
          </li>
        </ol>
      </section>

      <footer class="foot">
        <p class="mono">LOVE DIVE · ABYSS SOUNDER</p>
        <p>측정 결과는 재미를 위한 것이며, 입력한 코드와 이름은 서버로 전송되지 않습니다.</p>
      </footer>
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
    min-height: max(600px, 100svh);
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
    padding: 8px var(--gutter) calc(48px + env(safe-area-inset-bottom));
    background: linear-gradient(
      to bottom,
      var(--sea-shallow) 0%,
      var(--sea-twilight) 22%,
      #0a2a5c 45%,
      var(--sea-deep) 70%,
      var(--sea-abyss) 100%
    );
  }

  .ruler {
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 1px;
    pointer-events: none;

    span {
      position: absolute;
      left: 0;
      font-size: 9px;
      color: var(--ink-faint);
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      letter-spacing: 0.1em;
    }
    @media (max-width: 420px) {
      display: none;
    }
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
    gap: 14px;
    padding: 20px 18px;
    border-radius: 20px;
    background: var(--glass);
    border: 1px solid var(--line);
    backdrop-filter: blur(14px) saturate(1.2);
    -webkit-backdrop-filter: blur(14px) saturate(1.2);
    box-shadow: 0 20px 60px -30px rgba(0, 0, 0, 0.6);

    header {
      display: flex;
      gap: 14px;
      align-items: flex-start;

      h2 {
        margin: 0 0 2px;
        font-family: var(--font-serif);
        font-size: 19px;
        font-weight: 700;
      }
      p {
        margin: 0;
        color: var(--ink-dim);
        font-size: 13.5px;
      }
    }
  }

  .step {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    font-size: 12px;
    color: var(--biolume);
  }

  .sample {
    padding: 14px;
    border-radius: var(--radius-sm);
    background: rgba(1, 6, 16, 0.55);
    border: 1px dashed var(--line-strong);
    text-align: center;
    font-size: clamp(14px, 4.4vw, 17px);
    letter-spacing: 0.1em;
    color: var(--ink-faint);

    span {
      color: var(--ink);
    }
    .h {
      color: var(--thread);
    }
    .n {
      color: var(--ink-faint);
    }
  }

  .tips {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    color: var(--ink-dim);
    display: grid;
    gap: 4px;
  }

  .form {
    scroll-margin-top: 24px;
    border-color: rgba(255, 77, 109, 0.28);
    box-shadow:
      0 20px 60px -30px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 77, 109, 0.06),
      0 0 60px -20px rgba(255, 77, 109, 0.35);
  }

  .shake.on {
    animation: shake 0.4s;
  }

  .msg {
    min-height: 0;

    p {
      margin: 0;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      background: rgba(255, 138, 138, 0.1);
      border: 1px solid rgba(255, 138, 138, 0.3);
      color: #ffc2c2;
      font-size: 13.5px;
    }
    .example {
      background: rgba(127, 246, 228, 0.08);
      border-color: rgba(127, 246, 228, 0.3);
      color: var(--biolume);
    }
  }

  .about {
    padding: 28px 4px 4px;

    h2 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 700;
    }
    .sub {
      margin: 0 0 16px;
      font-size: 13.5px;
      color: var(--ink-dim);
    }
  }

  .axes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .axis-group {
    padding: 14px;
    border-radius: var(--radius);
    border: 1px solid var(--line);
    background: rgba(2, 10, 24, 0.3);

    &:first-child {
      grid-column: 1 / -1;
    }

    .g-name {
      margin: 0 0 8px;
      font-weight: 600;
      font-size: 14px;

      span {
        display: block;
        font-weight: 400;
        font-size: 11.5px;
        line-height: 1.4;
        color: var(--ink-faint);
      }
    }
    ul {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      font-size: 12.5px;
    }
  }

  .zones {
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 2px;

    li {
      display: grid;
      grid-template-columns: 14px 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 12px 4px;
      border-bottom: 1px solid var(--line);
      font-size: 14px;
    }
    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .z-range {
      font-size: 11.5px;
      color: var(--ink-faint);
    }
    .sunlight .swatch { background: #40c4ce; }
    .twilight .swatch { background: #0a5884; }
    .midnight .swatch { background: #081a42; }
    .abyss .swatch { background: #030610; }
    .hadal .swatch { background: #000; }
    .hidden-zone {
      color: var(--ink-faint);
      .swatch {
        background: repeating-linear-gradient(45deg, #ff4d6d 0 2px, #000 2px 4px);
      }
    }
  }

  .foot {
    padding: 36px 4px 0;
    text-align: center;
    color: var(--ink-faint);
    font-size: 12px;

    p {
      margin: 0 0 6px;
    }
    .mono {
      letter-spacing: 0.2em;
      font-size: 10px;
      color: var(--thread);
      opacity: 0.8;
    }
  }

  @keyframes pendulum {
    from {
      transform: rotate(-0.6deg);
    }
    to {
      transform: rotate(0.6deg);
    }
  }
  @keyframes bob {
    50% {
      transform: translateY(3px);
    }
  }
  @keyframes shake {
    20%,
    60% {
      transform: translateX(-6px);
    }
    40%,
    80% {
      transform: translateX(6px);
    }
  }
</style>
