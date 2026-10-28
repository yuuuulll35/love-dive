<script lang="ts">
  import { waterColor, type MeasureResult } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';
  import { depthMood, type Tier } from './mood';

  interface Props {
    result: MeasureResult;
    /** 페어 이미지 (data URL) */
    image?: string | null;
    /** 캡처 대상 노드 */
    node?: HTMLElement;
  }
  let { result, image = null, node = $bindable() }: Props = $props();

  const mood = $derived(depthMood(result));
  const tier = $derived(mood.tier);

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
  // 물빛에 번지는 큰 빛망울 [x%, y%, 지름px]
  const BOKEH: Record<Tier, readonly (readonly [number, number, number])[]> = {
    light: [[78, 30, 64], [24, 76, 42], [92, 70, 28]],
    soft: [[80, 34, 56], [30, 80, 34]],
    deep: [[76, 40, 48]],
    abyss: [],
    void: [],
  };
  // 마린 스노우: 깊은 바다에 천천히 떨어지는 입자
  const SNOW = [[8, 22], [18, 58], [27, 36], [35, 80], [46, 18], [53, 62], [61, 40], [69, 84], [78, 24], [84, 56], [91, 38], [40, 46], [12, 88], [96, 74]] as const;

  // 심해의 발광 점
  const GLINTS = [[14, 30], [28, 66], [62, 18], [74, 58], [86, 36], [44, 74]] as const;

  // 이미지 저장 시 height 는 복사되지 않으므로, 이 카드는 높이를 inset·aspect-ratio·padding 으로만 잡는다
</script>

<article
  class="card {tier}"
  class:hot
  data-tier={tier}
  style:--nw={mood.numWeight}
  style:--rad="{mood.radius}px"
  style:--top={waterTop}
  style:--bottom={waterBottom}
  bind:this={node}
  aria-label="측정 결과"
>
  <!-- ───── 물속 창 ───── -->
  <div class="window" class:with-img={!!image}>
    {#if result.kind === 'float'}
      <svg class="wave" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 10 Q25 2 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V24 H0Z" />
      </svg>
    {:else if tier !== 'void'}
      <span class="bloom" aria-hidden="true"></span>
      {#each BOKEH[tier] as [x, y, s], i (i)}
        <span class="bokeh" style:left="{x}%" style:top="{y}%" style:width="{s}px" aria-hidden="true"></span>
      {/each}
      {#if tier === 'deep' || tier === 'abyss'}
        {#each SNOW as [x, y], i (i)}
          <span class="snow" style:left="{x}%" style:top="{y}%" style:--d="{(i % 5) * 1.3}s" aria-hidden="true"></span>
        {/each}
      {/if}
      {#each BUBBLES[tier] as [x, y, s], i (i)}
        <span class="bubble" style:left="{x}%" style:top="{y}%" style:width="{s}px" style:--d="{i * 0.7}s" aria-hidden="true"></span>
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

    <!-- 페어 이미지(배경 없는 PNG)가 측심추 자리에 측심줄로 매달린다 -->
    {#if image && tier !== 'void'}
      <div class="hanger" class:floating={result.kind === 'float'} aria-hidden="true">
        <span class="thread"></span>
        <img class="charm" src={image} alt="" />
      </div>
    {/if}

    <p class="logo">LOVE DIVE</p>

    {#if result.kind === 'void'}
      <p class="depth glitch">측정 불가</p>
    {:else}
      <p class="depth">{formatDepth(result.depth)}<span class="unit">m</span></p>
    {/if}
  </div>

  <!-- ───── 본문 ───── -->
  <div class="body">
    {#if result.pair}
      <p class="pair">{result.pair}</p>
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
  // 깊이별 색·굵기 토큰은 src/app/styles/_tiers.scss ([data-tier])
  .card {
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
  .light .depth {
    text-shadow: 0 2px 22px rgba(255, 255, 255, 0.7);
  }
  .soft .depth {
    text-shadow: 0 0 26px rgba(190, 235, 255, 0.35);
  }
  .deep .depth {
    text-shadow: 0 0 30px rgba(143, 180, 255, 0.35);
  }
  .abyss .depth {
    text-shadow: 0 0 34px rgba(127, 246, 228, 0.16);
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

  // 필름 같은 미세한 입자감
  .window::after {
    content: '';
    position: absolute;
    z-index: 2;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.14;
    mix-blend-mode: soft-light;
  }

  // 수면에서 번져 내려오는 빛
  .bloom {
    position: absolute;
    z-index: -2;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 55% at 22% -8%, rgba(255, 255, 255, 0.55), transparent 70%),
      radial-gradient(ellipse 50% 45% at 100% 0%, rgba(255, 196, 214, 0.35), transparent 70%);
  }
  .soft .bloom {
    background: radial-gradient(ellipse 70% 55% at 22% -8%, rgba(190, 235, 255, 0.35), transparent 70%);
  }
  .deep .bloom {
    background: radial-gradient(ellipse 60% 50% at 25% 0%, rgba(110, 160, 255, 0.18), transparent 70%);
  }
  .abyss .bloom {
    background: radial-gradient(ellipse 55% 45% at 30% 20%, rgba(127, 246, 228, 0.07), transparent 70%);
  }

  .bokeh {
    position: absolute;
    z-index: -2;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0) 70%);
    transform: translate(-50%, -50%);
  }
  .deep .bokeh {
    background: radial-gradient(circle, rgba(143, 180, 255, 0.16), transparent 70%);
  }

  .snow {
    position: absolute;
    z-index: -1;
    width: 2px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: rgba(220, 232, 255, 0.45);
    animation: drift 7s ease-in-out var(--d) infinite alternate;
  }
  .abyss .snow {
    background: rgba(220, 232, 255, 0.28);
  }

  .bubble {
    animation: drift 5s ease-in-out var(--d) infinite alternate;
  }
  @keyframes drift {
    to {
      transform: translateY(-6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble,
    .snow {
      animation: none;
    }
  }

  .bubble {
    position: absolute;
    z-index: -1;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9) 0 12%, rgba(255, 255, 255, 0.18) 34%, rgba(255, 255, 255, 0.04) 70%);
    box-shadow: inset -1px -2px 3px rgba(255, 255, 255, 0.25), 0 0 6px rgba(255, 255, 255, 0.25);
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
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--ink-2);
  }

  // ───── 페어 이미지 측심추 ─────
  .window.with-img {
    padding-bottom: 128px;
  }
  .hanger {
    position: absolute;
    z-index: -1;
    top: 0;
    right: 22px;
    bottom: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 104px;

    &.floating {
      bottom: 26px;
    }
  }
  .thread {
    flex: 1;
    width: 2px;
    background: var(--rope);
    box-shadow: 0 0 0 0.5px var(--rope-edge);
  }
  .charm {
    display: block;
    max-width: 104px;
    max-height: 104px;
    object-fit: contain;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.3));
  }
  // 어두운 바다에서는 윤곽이 묻히지 않게 은은한 빛
  .deep .charm,
  .abyss .charm {
    filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.18));
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
      word-break: keep-all;
      overflow-wrap: anywhere;
    }
    @media (max-width: 360px) {
      div {
        padding: 9px 9px;
      }
      dd {
        font-size: 12.5px;
      }
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
