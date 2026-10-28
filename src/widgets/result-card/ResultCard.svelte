<script lang="ts">
  import { waterColor, ZONES, type MeasureResult } from '$entities/abyss';
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

  // 타로 카드 번호처럼: 부유 0, 표층 I … 초심해 V
  const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V'];
  const numeral = $derived(
    result.kind === 'void' ? '∞' : ROMAN[Math.max(0, ZONES.findIndex((z) => z.id === result.zone.id))],
  );
  // 세리프 숫자 굵기 (Cormorant 500~600)
  const serifWeight = $derived(mood.numWeight > 560 ? 600 : 500);

  // 아치 창 속 물방울 [x%, y%, 지름px]
  const BUBBLES: Record<Tier, readonly (readonly [number, number, number])[]> = {
    light: [[16, 74, 12], [24, 58, 7], [13, 44, 5], [82, 28, 9], [74, 50, 5], [86, 64, 6]],
    soft: [[18, 70, 8], [80, 30, 6], [84, 58, 5], [24, 46, 4]],
    deep: [[20, 64, 5], [78, 36, 4]],
    abyss: [],
    void: [],
  };
  // 물빛에 번지는 큰 빛망울
  const BOKEH: Record<Tier, readonly (readonly [number, number, number])[]> = {
    light: [[72, 22, 90], [26, 80, 56]],
    soft: [[74, 26, 76], [28, 78, 44]],
    deep: [[70, 34, 60]],
    abyss: [],
    void: [],
  };
  const SNOW = [[10, 24], [20, 60], [30, 38], [38, 82], [48, 16], [56, 66], [64, 42], [72, 86], [80, 22], [88, 54], [92, 76], [44, 50]] as const;
  const GLINTS = [[16, 30], [28, 68], [64, 18], [76, 60], [86, 36], [44, 78]] as const;

  // 창 안에서 반짝이는 별빛 [x%, y%, 크기px]
  const TWINKLE: Record<Tier, readonly (readonly [number, number, number])[]> = {
    light: [[24, 22, 11], [76, 60, 8], [34, 50, 6], [70, 18, 7]],
    soft: [[26, 24, 9], [74, 56, 7], [68, 18, 6]],
    deep: [[28, 26, 7], [72, 64, 6]],
    abyss: [],
    void: [],
  };

  const STAR = 'M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z';

  // 이미지 저장 시 height 는 복사되지 않으므로, 이 카드는 높이를 inset·aspect-ratio·padding 으로만 잡는다
</script>

<article
  class="card {tier}"
  class:hot
  data-tier={tier}
  style:--nw={serifWeight}
  style:--top={waterTop}
  style:--bottom={waterBottom}
  bind:this={node}
  aria-label="측정 결과"
>
  <div class="frame">
    {#each ['tl', 'tr', 'bl', 'br'] as c (c)}
      <svg class="corner {c}" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
    {/each}

    <header class="arcana">
      <span class="rule" aria-hidden="true"></span>
      <span class="num">{numeral}</span>
      <span class="rule" aria-hidden="true"></span>
    </header>

    <div class="arch-wrap">
      {#each ['l', 'r'] as side (side)}
        <svg class="spandrel {side}" viewBox="0 0 40 40" aria-hidden="true">
          <path d={STAR} transform="translate(2 2) scale(0.62)" />
          <path d={STAR} transform="translate(22 4) scale(0.3)" />
          <circle cx="8" cy="26" r="1.4" />
        </svg>
      {/each}
      <div class="arch" class:with-img={!!image}>
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
          {#if tier === 'abyss'}
            {#each GLINTS as [x, y], i (i)}
              <span class="glint" style:left="{x}%" style:top="{y}%" aria-hidden="true"></span>
            {/each}
          {/if}
          {#each TWINKLE[tier] as [x, y, s], i (i)}
            <svg class="twinkle" style:left="{x}%" style:top="{y}%" style:width="{s}px" style:--d="{i * 0.9}s" viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
          {/each}
          {#each BUBBLES[tier] as [x, y, s], i (i)}
            <span class="bubble" style:left="{x}%" style:top="{y}%" style:width="{s}px" style:--d="{i * 0.7}s" aria-hidden="true"></span>
          {/each}
          <svg class="bed" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 24C60 10 110 28 180 20S300 6 400 22V44H0z" />
          </svg>
        {/if}
        {#if hot && tier !== 'void' && result.kind !== 'float'}<span class="vent" aria-hidden="true"></span>{/if}

        <!-- 페어 이미지(배경 없는 PNG)가 측심줄에 매달린다 -->
        {#if image && tier !== 'void'}
          <div class="hanger" class:floating={result.kind === 'float'} aria-hidden="true">
            <span class="thread"></span>
            <img class="charm" src={image} alt="" />
          </div>
        {/if}
        <!-- 물빛 베일: 이미지를 물속에 담가 글자보다 한 걸음 뒤로 -->
        {#if image && tier !== 'void'}<span class="veil" class:float={result.kind === 'float'} aria-hidden="true"></span>{/if}

        {#if result.kind === 'void'}
          <p class="depth glitch">측정 불가</p>
        {:else}
          <p class="depth">{formatDepth(result.depth)}<span class="unit">m</span></p>
          <p class="zone">{result.zone.name}</p>
        {/if}
      </div>
    </div>

    <div class="plate">
      <h2 class="title">{result.title}</h2>
    </div>
    <p class="quote">{result.titleLine}</p>

    <svg class="stars" viewBox="0 0 168 12" aria-hidden="true">
      {#each [0, 34, 78, 122, 156] as x, i (i)}
        <path d={STAR} transform="translate({x} {i === 2 ? 0 : 2}) scale({i === 2 ? 0.5 : 0.34})" />
      {/each}
      {#each [20, 56, 100, 136] as x (x)}<circle cx={x + 2} cy="6" r="1.1" />{/each}
    </svg>

    {#if result.pair}
      <p class="pair">{result.pair}</p>
    {/if}

    <div class="tear" aria-hidden="true"></div>

    <div class="reading">
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

    <p class="brand">LOVE DIVE</p>
  </div>
</article>

<style lang="scss">
  // 깊이별 색 토큰은 src/app/styles/_tiers.scss ([data-tier])
  // 우표: 가장자리에 구멍 난 종이, 안쪽에 두 겹 선
  .card {
    --hole: 5px;
    --step: 14px;
    position: relative;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    padding: 9px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-sans);
    mask:
      linear-gradient(#000 0 0) content-box,
      radial-gradient(circle var(--hole), #0000 96%, #000) calc(var(--step) / -2) calc(var(--step) / -2) / var(--step) var(--step) round padding-box;
    filter: drop-shadow(0 22px 34px rgba(0, 0, 0, 0.35));
  }

  // 종이 결
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.45 0 0 0 0 0.4 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.22;
    mix-blend-mode: multiply;
  }
  .deep::after,
  .abyss::after,
  .void::after {
    mix-blend-mode: screen;
    opacity: 0.1;
  }

  .frame {
    position: relative;
    display: grid;
    justify-items: center;
    padding: 18px 18px 16px;
    border: 1.5px solid var(--frame);
    box-shadow: inset 0 0 0 3px var(--paper), inset 0 0 0 4px var(--frame-soft);
    border-radius: 6px;
  }

  .corner {
    position: absolute;
    width: 12px;
    fill: var(--frame);

    &.tl { top: 8px; left: 8px; }
    &.tr { top: 8px; right: 8px; }
    &.bl { bottom: 8px; left: 8px; }
    &.br { bottom: 8px; right: 8px; }
  }

  .arcana {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: var(--frame);

    .rule {
      width: 34px;
      border-top: 1px solid var(--frame-soft);
    }
    .num {
      font-variant-numeric: lining-nums;
      font-family: var(--font-serif);
      font-size: 19px;
      font-weight: 600;
      letter-spacing: 0.12em;
      line-height: 1;
    }
  }

  .arch-wrap {
    position: relative;
    width: 100%;
    padding: 4px;
    border: 1.5px solid var(--frame);
    border-radius: 999px 999px 10px 10px;
  }
  // 아치 바깥 모서리의 별
  .spandrel {
    position: absolute;
    top: 4px;
    width: 34px;
    fill: var(--frame);
    opacity: 0.8;

    &.l { left: 4px; }
    &.r {
      right: 4px;
      transform: scaleX(-1);
    }
  }

  .twinkle {
    position: absolute;
    z-index: -1;
    fill: rgba(255, 255, 255, 0.85);
    filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.7));
    transform: translate(-50%, -50%);
    animation: twinkle 3.2s ease-in-out var(--d) infinite alternate;
  }
  .deep .twinkle {
    fill: rgba(200, 220, 255, 0.6);
  }
  @keyframes twinkle {
    to {
      opacity: 0.35;
    }
  }

  .arch {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 6px;
    aspect-ratio: 5 / 5.4;
    border-radius: 999px 999px 7px 7px;
    background: linear-gradient(to bottom, var(--top), var(--bottom));
    color: #fff;
    text-align: center;

    // 페어 이미지가 있으면 글자는 창 위쪽, 이미지는 아래쪽에 두어 겹치지 않게 (cqh = 창 높이 %)
    &.with-img {
      container-type: size;
      align-content: start;
      padding-top: 9cqh;

      .depth {
        font-size: 19cqh;
      }
    }
  }
  .light .arch {
    background: linear-gradient(to bottom, #d9f6f4, #9fdfe6 55%, var(--bottom));
    color: #1f3460;
  }
  .soft .arch {
    background: linear-gradient(to bottom, #8fd0e0, var(--top) 40%, var(--bottom));
  }
  .void .arch {
    background:
      repeating-linear-gradient(to bottom, rgba(255, 77, 109, 0.08) 0 1px, transparent 1px 3px),
      #050407;
  }
  .card:has(.wave) .arch {
    background: linear-gradient(to bottom, #ffd9e3 0%, #ffe9dc 48%, #d4f1fb 66%, #63d0db 67%, #3fb7c9 100%);
  }

  .depth {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(60px, 18vw, 76px);
    font-weight: var(--nw);
    font-variant-numeric: lining-nums;
    line-height: 0.95;
    letter-spacing: -0.01em;

    .unit {
      margin-left: 3px;
      font-size: 0.42em;
      font-style: italic;
      font-weight: 500;
      opacity: 0.85;
    }
  }
  .light .depth {
    text-shadow: 0 2px 24px rgba(255, 255, 255, 0.8);
  }
  .soft .depth {
    text-shadow: 0 0 26px rgba(190, 235, 255, 0.4);
  }
  .deep .depth {
    text-shadow: 0 0 30px rgba(143, 180, 255, 0.4);
  }
  .abyss .depth {
    text-shadow: 0 0 34px rgba(127, 246, 228, 0.18);
  }
  .zone {
    margin: 0;
    font-family: var(--font-kserif);
    font-size: 13px;
    letter-spacing: 0.3em;
    opacity: 0.8;
  }
  .glitch {
    font-family: var(--font-kserif);
    font-weight: 700;
    font-size: clamp(36px, 11vw, 46px);
    text-shadow:
      -3px 0 rgba(255, 42, 85, 0.9),
      3px 0 rgba(42, 255, 234, 0.7);
  }

  .bloom {
    position: absolute;
    z-index: -2;
    inset: 0;
    background:
      radial-gradient(ellipse 70% 50% at 50% -6%, rgba(255, 255, 255, 0.6), transparent 70%),
      radial-gradient(ellipse 45% 40% at 96% 8%, rgba(255, 196, 214, 0.35), transparent 70%);
  }
  .soft .bloom {
    background: radial-gradient(ellipse 70% 50% at 50% -6%, rgba(190, 235, 255, 0.4), transparent 70%);
  }
  .deep .bloom {
    background: radial-gradient(ellipse 60% 45% at 50% 0%, rgba(110, 160, 255, 0.2), transparent 70%);
  }
  .abyss .bloom {
    background: radial-gradient(ellipse 55% 45% at 50% 30%, rgba(127, 246, 228, 0.07), transparent 70%);
  }

  .bokeh {
    position: absolute;
    z-index: -2;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 70%);
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
    background: rgba(220, 232, 255, 0.26);
  }

  .bubble {
    position: absolute;
    z-index: -1;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.75);
    background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9) 0 12%, rgba(255, 255, 255, 0.18) 34%, rgba(255, 255, 255, 0.04) 70%);
    box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
    animation: drift 5s ease-in-out var(--d) infinite alternate;
  }
  .deep .bubble {
    border-color: rgba(255, 255, 255, 0.25);
    background: none;
    box-shadow: none;
  }
  @keyframes drift {
    to {
      transform: translateY(-6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble,
    .snow,
    .twinkle {
      animation: none;
    }
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
    fill: rgba(255, 255, 255, 0.12);
  }
  .deep .bed,
  .abyss .bed {
    fill: rgba(255, 255, 255, 0.05);
  }

  .wave {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 66%;
    width: 100%;
    aspect-ratio: 400 / 24;
    fill: #63d0db;
  }

  .vent {
    position: absolute;
    z-index: -1;
    inset: 45% 0 0;
    background: radial-gradient(ellipse 70% 60% at 50% 115%, rgba(255, 95, 60, 0.6), transparent 70%);
  }

  .hanger {
    position: absolute;
    z-index: -1;
    top: 0;
    left: 50%;
    bottom: 9%;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 120px;
    transform: translateX(-50%);

    // 부유: 수면(창 높이 67%)에 반쯤 잠기게
    &.floating {
      bottom: 20%;
    }
  }
  // 줄은 글자 뒤로 지나가므로 은은하게. 어두운 바다일수록 더 흐리게
  .thread {
    flex: 1;
    width: 1.5px;
    background: var(--rope);
    box-shadow: 0 0 0 0.5px var(--rope-edge);
    opacity: 0.7;
  }
  .soft .thread {
    opacity: 0.45;
  }
  .deep .thread,
  .abyss .thread {
    width: 1px;
    box-shadow: none;
    opacity: 0.22;
  }
  // 깊을수록 색이 빠지고 어두워지고 살짝 흐려진다
  .charm {
    display: block;
    max-width: 120px;
    max-height: 30cqh;
    object-fit: contain;
    filter: saturate(0.92) blur(0.3px) drop-shadow(0 6px 10px rgba(0, 0, 0, 0.25));
  }
  .soft .charm {
    filter: saturate(0.7) brightness(0.88) blur(0.5px) drop-shadow(0 4px 10px rgba(0, 20, 50, 0.35));
  }
  .deep .charm {
    filter: saturate(0.55) brightness(0.82) blur(0.5px) drop-shadow(0 0 12px rgba(143, 180, 255, 0.25));
  }
  .abyss .charm {
    filter: saturate(0.4) brightness(0.72) blur(0.6px) drop-shadow(0 0 14px rgba(127, 246, 228, 0.15));
  }

  .veil {
    position: absolute;
    z-index: -1;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(to bottom, transparent 35%, color-mix(in srgb, var(--bottom) 40%, transparent));
  }
  // 부유: 수면 아래로 잠긴 부분만 물빛으로 덮는다
  .veil.float {
    inset: 67% 0 0;
    background: linear-gradient(to bottom, rgba(99, 208, 219, 0.7), rgba(63, 183, 201, 0.55));
  }

  .plate {
    position: relative;
    margin-top: 16px;
    padding: 7px 30px 8px;
    border: 1.5px solid var(--frame);
    border-radius: 3px;
    box-shadow: inset 0 0 0 2.5px var(--paper), inset 0 0 0 3.5px var(--frame-soft);

    // 양끝 마름모
    &::before,
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 7px;
      aspect-ratio: 1;
      background: var(--frame);
      transform: translateY(-50%) rotate(45deg);
    }
    &::before { left: -4.5px; }
    &::after { right: -4.5px; }
  }
  .title {
    margin: 0;
    font-family: var(--font-kserif);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.06em;
    color: var(--ink);
  }
  .quote {
    margin: 10px 0 0;
    max-width: 30ch;
    font-family: var(--font-kserif);
    font-size: 14.5px;
    line-height: 1.7;
    text-align: center;
    color: var(--accent);
    text-wrap: balance;
  }

  .stars {
    width: 132px;
    margin-top: 14px;
    fill: var(--frame);
    opacity: 0.85;
  }

  .tear {
    width: calc(100% + 36px);
    margin: 18px 0 0;
    border-top: 1.5px dashed var(--frame-soft);
  }

  .reading {
    display: grid;
    gap: 14px;
    justify-items: center;
    width: 100%;
    padding-top: 18px;
    text-align: center;
  }

  .pair {
    margin: 12px 0 0;
    font-family: var(--font-kserif);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--ink);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      padding: 4px 11px;
      border: 1px solid var(--frame-soft);
      border-radius: 999px;
      color: var(--accent);
      font-size: 12.5px;
      font-weight: 600;
      line-height: 1.3;
    }
  }

  .desc {
    margin: 0;
    font-size: 14px;
    line-height: 1.8;
    color: var(--ink-2);
    text-wrap: balance;
    word-break: keep-all;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    width: 100%;
    margin: 0;
    border-top: 1px solid var(--frame-soft);
    border-bottom: 1px solid var(--frame-soft);

    div {
      display: grid;
      gap: 3px;
      padding: 10px 6px;
      min-width: 0;
      & + div {
        border-left: 1px solid var(--frame-soft);
      }
    }
    dt {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.1em;
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
    gap: 2px;

    p {
      margin: 0;
      font-family: var(--font-kserif);
      font-size: 13.5px;
      line-height: 1.8;
      color: var(--ink-2);
      text-wrap: balance;
      word-break: keep-all;
    }
  }

  .brand {
    margin: 16px 0 0;
    font-family: var(--font-logo);
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.24em;
    color: var(--frame);
    opacity: 0.8;
  }
</style>
