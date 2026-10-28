<script lang="ts">
  import { waterColor, type MeasureResult } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';
  import { lerp } from '$shared/lib/math';

  interface Props {
    result: MeasureResult;
    /** 페어 이미지 (data URL) */
    image?: string | null;
    /** 캡처 대상 노드 */
    node?: HTMLElement;
  }
  let { result, image = null, node = $bindable() }: Props = $props();

  /**
   * 깊이 → 분위기. 얕을수록 밝고 둥글고 굵게(가볍고 귀엽게),
   * 깊을수록 어둡고 각지고 가늘게(무겁고 진중하게).
   */
  type Tier = 'light' | 'soft' | 'deep' | 'abyss' | 'void';
  const TIER: Record<string, Tier> = {
    float: 'light', sunlight: 'light', twilight: 'soft', midnight: 'deep', abyss: 'abyss', hadal: 'abyss', void: 'void',
  };
  const tier = $derived(TIER[result.zone.id]);
  // 로그 스케일 수심 진행도 0~1
  const r = $derived(Math.min(1, Math.log1p(result.depth) / Math.log1p(10935)));
  const numWeight = $derived(Math.round(lerp(860, 200, r ** 1.4)));
  const radius = $derived(Math.round(lerp(32, 10, r)));

  const rgb = (c: number[]) => `rgb(${c.join(',')})`;
  const waterTop = $derived(rgb(waterColor(result.depth * 0.3)));
  const waterBottom = $derived(rgb(waterColor(result.depth)));
  const hot = $derived(result.temperature.id === 'hot');

  const BUBBLES: Record<Tier, readonly (readonly [number, number, number])[]> = {
    light: [[10, 70, 14], [19, 50, 8], [7, 32, 6], [64, 22, 10], [76, 44, 6], [56, 64, 7], [86, 18, 5]],
    soft: [[12, 66, 9], [70, 26, 7], [80, 52, 5], [22, 40, 5]],
    deep: [[16, 60, 5], [72, 30, 4]],
    abyss: [],
    void: [],
  };
  // 심해의 발광 점
  const GLINTS = [[14, 30], [28, 66], [62, 18], [74, 58], [86, 36], [44, 74]] as const;

  // 이미지 저장 시 height 는 복사되지 않으므로, 이 카드는 높이를 inset·aspect-ratio·padding 으로만 잡는다
</script>

<article
  class="card {tier}"
  class:hot
  style:--nw={numWeight}
  style:--rad="{radius}px"
  style:--top={waterTop}
  style:--bottom={waterBottom}
  bind:this={node}
  aria-label="측정 결과"
>
  <!-- ───── 물속 창 ───── -->
  <div class="window">
    {#if result.kind === 'float'}
      <svg class="wave" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 10 Q25 2 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V24 H0Z" />
      </svg>
    {:else if tier !== 'void'}
      {#each BUBBLES[tier] as [x, y, s], i (i)}
        <span class="bubble" style:left="{x}%" style:top="{y}%" style:width="{s}px" aria-hidden="true"></span>
      {/each}
      {#if tier === 'abyss'}
        {#each GLINTS as [x, y], i (i)}
          <span class="glint" style:left="{x}%" style:top="{y}%" aria-hidden="true"></span>
        {/each}
      {/if}
      <svg class="bed" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 24C60 10 110 28 180 20S300 6 400 22V44H0z" />
      </svg>
    {/if}
    {#if hot && tier !== 'void' && result.kind !== 'float'}<span class="vent" aria-hidden="true"></span>{/if}

    <p class="logo">LOVE DIVE</p>

    {#if result.kind === 'void'}
      <p class="depth glitch">측정 불가</p>
    {:else}
      <p class="depth">{formatDepth(result.depth)}<span class="unit">m</span></p>
    {/if}
  </div>

  <!-- ───── 본문 ───── -->
  <div class="body">
    {#if image || result.pair}
      <div class="pair">
        {#if image}<img src={image} alt={result.pair ? `${result.pair} 이미지` : '페어 이미지'} />{/if}
        {#if result.pair}<span>{result.pair}</span>{/if}
      </div>
    {/if}

    <div class="head">
      <h2 class="title">{result.title}</h2>
      <p class="quote">{result.titleLine}</p>
    </div>

    {#if result.tags.length}
      <ul class="tags" aria-label="두드러진 축">
        {#each result.tags as tag (tag)}<li>#{tag}</li>{/each}
      </ul>
    {/if}

    <p class="desc">{result.description}</p>

    <dl class="stats">
      <div>
        <dt>구간</dt>
        <dd>{result.zone.name}</dd>
      </div>
      <div>
        <dt>수압</dt>
        <dd>{result.kind === 'void' ? '측정 불가' : `${formatAtm(result.depth)} atm`}</dd>
      </div>
      <div>
        <dt>온도</dt>
        <dd class="temp">{result.temperature.label}</dd>
      </div>
    </dl>

    <div class="notes">
      {#each result.lines.slice(1) as line, i (i)}<p>{line}</p>{/each}
    </div>
  </div>
</article>

<style lang="scss">
  // ───── 깊이별 테마 ─────
  .card {
    --bg: #fffaf6;
    --ink: #1f2a44;
    --ink-2: #4f5a73;
    --ink-3: #8e97aa;
    --rule: #efe6dc;
    --chip: #ffe8ee;
    --accent: #ff5c7a;
    --title-w: 800;
    --title-ls: -0.02em;
    --stat-bg: #fff;

    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: var(--rad);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-sans);
    box-shadow: 0 30px 70px -24px rgba(0, 0, 0, 0.6);
  }

  // 표층·부유: 밝고 동글동글
  .light .window {
    background: linear-gradient(to bottom, #c9f3f4, var(--bottom));
  }

  // 박광층: 맑은 푸른빛, 장식은 줄이고
  .soft {
    --bg: #f4f8fc;
    --rule: #dfe8f1;
    --chip: #e3eefa;
    --accent: #2f78c9;
    --stat-bg: #fff;
    --title-w: 700;
  }

  // 점심해: 어두운 남색, 차분하게
  .deep {
    --bg: #0c1530;
    --ink: #e9eef9;
    --ink-2: #aab6cf;
    --ink-3: #6e7a96;
    --rule: rgba(233, 238, 249, 0.12);
    --chip: rgba(143, 180, 255, 0.12);
    --accent: #8fb4ff;
    --title-w: 600;
    --title-ls: -0.01em;
    --stat-bg: rgba(255, 255, 255, 0.04);
  }

  // 심해저·초심해: 거의 검정, 가늘고 넓게, 장식 최소
  .abyss {
    --bg: #07080d;
    --ink: #e7e8ee;
    --ink-2: #a3a7b6;
    --ink-3: #5f6475;
    --rule: rgba(231, 232, 238, 0.1);
    --chip: transparent;
    --accent: #c8cfdf;
    --title-w: 500;
    --title-ls: 0.04em;
    --stat-bg: transparent;
  }

  .void {
    --bg: #050407;
    --ink: #f1eef0;
    --ink-2: #b4a9ae;
    --ink-3: #6f646a;
    --rule: rgba(255, 77, 109, 0.18);
    --chip: rgba(255, 77, 109, 0.12);
    --accent: #ff4d6d;
    --title-w: 600;
    --stat-bg: transparent;
  }

  .hot {
    --accent-temp: #ff6a4d;
  }

  // ───── 물속 창 ─────
  .window {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    padding: 18px 22px 74px;
    background: linear-gradient(to bottom, var(--top), var(--bottom));
    color: #fff;
  }

  .light .window {
    color: var(--ink);
  }
  .card:not(.light):not(.soft) .window {
    // 어두운 테마는 창과 본문 사이 경계를 흐리게
    background: linear-gradient(to bottom, var(--top), var(--bottom) 70%, var(--bg));
  }
  .void .window {
    background:
      repeating-linear-gradient(to bottom, rgba(255, 77, 109, 0.08) 0 1px, transparent 1px 3px),
      #050407;
    color: #fff;
  }
  .card:has(.wave) .window {
    background: linear-gradient(to bottom, #ffd9e3 0%, #ffe9dc 45%, #d4f1fb 66%, #63d0db 67%, #3fb7c9 100%);
  }

  .logo {
    margin: 0;
    font-family: var(--font-logo);
    font-weight: 600;
    font-size: 13px;
    letter-spacing: 0.06em;
    opacity: 0.75;
  }
  .abyss .logo,
  .deep .logo {
    font-weight: 600;
    letter-spacing: 0.24em;
    font-size: 11px;
    opacity: 0.55;
  }

  .depth {
    margin: 18px 0 0;
    font-size: clamp(58px, 19vw, 78px);
    font-weight: var(--nw);
    font-variant-numeric: tabular-nums;
    line-height: 1;
    letter-spacing: -0.03em;

    .unit {
      margin-left: 4px;
      font-size: 0.38em;
      font-weight: 500;
      opacity: 0.8;
    }
  }
  .abyss .depth {
    letter-spacing: -0.01em;
    font-size: clamp(62px, 20vw, 84px);
  }
  .glitch {
    font-weight: 800;
    font-size: clamp(44px, 13vw, 54px);
    letter-spacing: -0.02em;
    text-shadow:
      -3px 0 rgba(255, 42, 85, 0.9),
      3px 0 rgba(42, 255, 234, 0.7);
  }

  .bubble {
    position: absolute;
    z-index: -1;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.75);
    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.1) 60%);
  }
  .deep .bubble {
    border-color: rgba(255, 255, 255, 0.25);
    background: none;
  }

  .glint {
    position: absolute;
    z-index: -1;
    width: 3px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: #7ff6e4;
    box-shadow: 0 0 8px 2px rgba(127, 246, 228, 0.55);
    opacity: 0.7;
  }

  .bed {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    aspect-ratio: 400 / 44;
    fill: rgba(255, 255, 255, 0.35);
  }
  .soft .bed {
    fill: rgba(255, 255, 255, 0.14);
  }
  .deep .bed,
  .abyss .bed {
    fill: var(--bg);
  }

  .wave {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 70%;
    width: 100%;
    aspect-ratio: 400 / 24;
    fill: #63d0db;
  }

  .vent {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 35%;
    bottom: 0;
    background: radial-gradient(ellipse 70% 60% at 72% 110%, rgba(255, 95, 60, 0.7), transparent 70%);
  }



  // ───── 본문 ─────
  .body {
    display: grid;
    gap: 16px;
    padding: 20px 22px 22px;
  }

  .pair {
    display: flex;
    align-items: center;
    gap: 10px;

    img {
      flex: none;
      width: 48px;
      aspect-ratio: 1;
      border-radius: calc(var(--rad) * 0.5);
      object-fit: cover;
      border: 2px solid var(--bg);
      box-shadow: 0 0 0 1.5px var(--rule);
    }
    span {
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--ink-2);
    }
  }

  .head {
    display: grid;
    gap: 6px;
  }

  .title {
    margin: 0;
    font-size: 30px;
    font-weight: var(--title-w);
    line-height: 1.2;
    letter-spacing: var(--title-ls);
  }

  .quote {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.6;
    color: var(--accent);
    text-wrap: balance;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: -4px 0 0;
    padding: 0;
    list-style: none;

    li {
      padding: 5px 11px;
      border-radius: 999px;
      background: var(--chip);
      color: var(--accent);
      font-size: 13px;
      font-weight: 600;
      line-height: 1.2;
    }
  }
  .abyss .tags li {
    padding: 4px 10px;
    border: 1px solid var(--rule);
    border-radius: 4px;
    font-weight: 500;
    letter-spacing: 0.04em;
  }

  .desc {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.75;
    color: var(--ink-2);
    text-wrap: pretty;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 0;
    border: 1px solid var(--rule);
    border-radius: calc(var(--rad) * 0.5);
    background: var(--stat-bg);

    div {
      display: grid;
      gap: 2px;
      padding: 10px 12px;
      min-width: 0;
      & + div {
        border-left: 1px solid var(--rule);
      }
    }
    dt {
      font-size: 11px;
      font-weight: 500;
      color: var(--ink-3);
    }
    dd {
      margin: 0;
      font-size: 13.5px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .temp {
      color: var(--accent-temp, var(--ink));
    }
  }

  .notes {
    display: grid;
    gap: 4px;
    padding-top: 14px;
    border-top: 1px dashed var(--rule);

    p {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.7;
      color: var(--ink-2);
      text-wrap: balance;
    }
  }
</style>
