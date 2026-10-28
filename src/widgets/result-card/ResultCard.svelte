<script lang="ts">
  import { waterColor, ZONES, type MeasureResult } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';
  import { depthMood } from './mood';

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
  const hot = $derived(result.temperature.id === 'hot');

  // ── 바다 단면: 도착한 층과 위아래 한 층씩, 세 층을 잘라 보여 준다 ──
  // 얕으면 하늘·수면이 보이는 밝은 단면, 깊으면 검은 층만 남는다
  const MAX = 10935;
  const SHOWN = 3;
  const idx = $derived(Math.max(0, ZONES.findIndex((z) => z.id === result.zone.id)));
  const start = $derived(Math.max(0, Math.min(ZONES.length - SHOWN, idx - 1)));
  const bands = $derived(
    ZONES.slice(start, start + SHOWN).map((z) => ({
      z,
      from: rgb(waterColor(z.from)),
      to: rgb(waterColor(Math.min(z.to, MAX))),
    })),
  );
  // 층 안에서의 위치 (로그 스케일), 가장자리에 붙지 않게
  const frac = $derived.by(() => {
    const z = result.zone;
    const to = Math.min(z.to, MAX);
    const f = (Math.log1p(result.depth) - Math.log1p(z.from)) / (Math.log1p(to) - Math.log1p(z.from));
    return Math.max(0.25, Math.min(0.75, f || 0));
  });
  const at = $derived(((idx - start + frac) / SHOWN) * 100);
  // 수면 위 하늘: 첫 층의 위쪽 60%
  const SURFACE = 60;
  // 층마다 사는 작은 생물 실루엣
  const LIFE: Record<string, string> = {
    sunlight: 'M2 12C6 7 13 7 18 10l5-3-1 5 1 5-5-3C13 17 6 17 2 12zM26 4C29 1 34 1 38 3l3-2-1 3 1 3-3-2C34 7 29 7 26 4zM30 22c3-3 8-3 12-1l3-2-1 3 1 3-3-2c-4 2-9 2-12-1z',
    twilight: 'M10 12C10 5 15 2 20 2s10 3 10 10c0 1-1 1-2 1H12c-1 0-2 0-2-1zM13 14c0 5-2 8 0 13M18 14c0 6 2 9 0 15M23 14c0 6-2 9 0 15M28 14c0 5 2 8 0 13',
    midnight: 'M6 16c0-6 7-10 15-10 7 0 13 4 15 9l6-4-1 6 1 6-6-4c-2 5-8 8-15 8C13 27 6 22 6 16zM14 7C12 2 6 1 4 4',
    abyss: 'M12 10c0-5 4-8 9-8s9 3 9 8c0 3-1 5-3 6l2 6-4-4-2 6-2-6-2 6-2-6-4 4 2-6c-2-1-3-3-3-6zM12 9C8 8 5 9 4 12c3 0 6-1 8-2zM30 9c4-1 7 0 8 3-3 0-6-1-8-2z',
    hadal: 'M4 14c0-5 5-8 11-8 8 0 14 3 26 6-12 3-18 7-26 7-6 0-11-1-11-5z',
  };

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
  bind:this={node}
  aria-label="측정 결과"
>
  <!-- ───── 바다 단면 ───── -->
  <div
    class="window"
    class:with-img={!!image}
    class:surface={start === 0}
    style:--at="{at}%"
    style:--sea-top="{(SURFACE / SHOWN).toFixed(2)}%"
  >
    {#if tier !== 'void'}
      <div class="sea" aria-hidden="true">
        {#each bands as b, i (b.z.id)}
          <div
            class="band"
            class:here={b.z.id === result.zone.id}
            class:top={i === 0 && start === 0}
            style:--from={b.from}
            style:--to={b.to}
          >
            {#if i > 0 && LIFE[b.z.id]}
              <svg class="life {b.z.id}" class:left={i === SHOWN - 1} viewBox="0 0 46 30"><path d={LIFE[b.z.id]} />{#if b.z.id === 'midnight'}<circle class="lure" cx="4" cy="4" r="2.2" />{/if}</svg>
            {/if}
            <span class="label">{b.z.name}<small>{b.z.from ? `${formatDepth(b.z.from)}m` : '수면'}</small></span>
          </div>
        {/each}
      </div>
      {#if start === 0}
        <svg class="wave" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 6 Q25 0 50 6 T100 6 T150 6 T200 6 T250 6 T300 6 T350 6 T400 6 V12 H0Z" />
        </svg>
      {/if}
      {#if tier === 'abyss'}
        {#each GLINTS as [x, y], i (i)}
          <span class="glint" style:left="{x}%" style:top="{y}%" aria-hidden="true"></span>
        {/each}
      {/if}
      {#if hot}<span class="vent" aria-hidden="true"></span>{/if}

      <!-- 측심줄: 수면(또는 위쪽 끝)에서 도착한 깊이까지. 끝에는 페어 이미지나 측심추 -->
      <div class="line" aria-hidden="true">
        {#if start === 0}<span class="buoy"></span>{/if}
        <span class="thread"></span>
        <div class="weight">
          {#if image}
            <img class="charm" src={image} alt="" />
          {:else}
            <svg class="lead" viewBox="0 0 24 34">
              <circle cx="12" cy="4" r="3" />
              <path d="M8.5 8h7l4.4 21.4A3 3 0 0 1 17 33H7a3 3 0 0 1-2.9-3.6z" />
              <path class="shine" d="M9.6 11.5l-2.6 17" />
            </svg>
          {/if}
        </div>
      </div>
    {/if}

    <p class="logo">LOVE DIVE</p>

    {#if result.kind === 'void'}
      <p class="depth glitch">측정 불가</p>
    {:else}
      <p class="depth" class:long={result.depth >= 1000}>{formatDepth(result.depth)}<span class="unit">m</span></p>
      <p class="where"><i></i>{result.zone.name}{result.kind === 'float' ? '에 떠 있어요' : '까지 가라앉았어요'}</p>
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

  // ───── 바다 단면 ─────
  .window {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    padding: 18px 22px 108px;
    color: #fff;
  }
  .window.with-img {
    padding-bottom: 136px;
  }
  .light .window {
    color: var(--ink);
  }
  .void .window {
    padding-bottom: 40px;
    background:
      repeating-linear-gradient(to bottom, rgba(255, 77, 109, 0.08) 0 1px, transparent 1px 3px),
      #050407;
    color: #fff;
  }

  .sea {
    position: absolute;
    z-index: -3;
    inset: 0;
    display: flex;
    flex-direction: column;
  }
  .band {
    position: relative;
    flex: 1;
    background: linear-gradient(to bottom, var(--from), var(--to));

    & + .band {
      border-top: 1px dashed rgba(255, 255, 255, 0.16);
    }
    // 첫 층이 부유층이면 위쪽은 하늘
    &.top {
      background: linear-gradient(
        to bottom,
        #ffdfe8 0%,
        #ffeee2 calc(var(--surface, 60%) - 6%),
        #dff5fb var(--surface, 60%),
        var(--from) var(--surface, 60%),
        var(--to)
      );
    }
  }
  .label {
    position: absolute;
    top: 7px;
    right: 14px;
    display: flex;
    align-items: baseline;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    opacity: 0.55;

    small {
      font-size: 10px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      opacity: 0.8;
    }
  }
  .band.top .label {
    top: auto;
    bottom: 7px;
  }
  .band.here .label {
    opacity: 1;
  }
  .light .band + .band .label {
    color: #fff;
  }

  .life {
    position: absolute;
    right: 8%;
    bottom: 12%;
    width: 46px;
    fill: rgba(255, 255, 255, 0.4);
    stroke: rgba(255, 255, 255, 0.4);
    stroke-width: 0;

    &.left {
      right: auto;
      left: 7%;
    }
    &.twilight {
      fill: rgba(190, 220, 255, 0.45);
      stroke: rgba(190, 220, 255, 0.45);
      stroke-width: 1.4;
      stroke-linecap: round;
    }
    &.midnight {
      stroke-width: 1.2;
      fill: rgba(255, 255, 255, 0.22);
      stroke: rgba(255, 255, 255, 0.3);
    }
    &.abyss,
    &.hadal {
      fill: rgba(255, 255, 255, 0.18);
    }
    .lure {
      fill: #7ff6e4;
      stroke: none;
      filter: drop-shadow(0 0 4px #7ff6e4);
    }
  }

  .wave {
    position: absolute;
    z-index: -2;
    left: 0;
    right: 0;
    top: calc(var(--sea-top) - 3px);
    width: 100%;
    aspect-ratio: 400 / 12;
    fill: rgba(255, 255, 255, 0.55);
  }

  // ───── 측심줄 ─────
  .line {
    position: absolute;
    z-index: -1;
    left: 70%;
    top: 0;
    bottom: 0;
    width: 0;
  }
  .thread {
    position: absolute;
    left: -1px;
    top: var(--rope-top, 0px);
    bottom: calc(100% - var(--y));
    width: 2px;
    background: var(--rope);
    box-shadow: 0 0 0 0.5px var(--rope-edge);
  }
  .window {
    // 추가 창 아래로 빠져나가지 않게
    --y: min(var(--at), calc(100% - 44px));
  }
  .window.with-img {
    --y: min(var(--at), calc(100% - 112px));
  }
  .window.surface {
    --rope-top: var(--sea-top);
  }
  .weight {
    position: absolute;
    top: var(--y);
    left: 0;
    transform: translateX(-50%);
  }
  .buoy {
    position: absolute;
    top: calc(var(--sea-top) - 9px);
    left: -9px;
    width: 18px;
    aspect-ratio: 1;
    border-radius: 50%;
    background: linear-gradient(to bottom, #ff6b8a 50%, #fff 50%);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  }
  .lead {
    display: block;
    width: 24px;
    margin-top: -2px;
    fill: #4a5468;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));

    circle {
      fill: none;
      stroke: #4a5468;
      stroke-width: 2;
    }
    .shine {
      fill: none;
      stroke: rgba(255, 255, 255, 0.35);
      stroke-width: 1.6;
      stroke-linecap: round;
    }
  }
  .deep .lead,
  .abyss .lead {
    fill: #c9d2e3;
    circle {
      stroke: #c9d2e3;
    }
  }
  .charm {
    display: block;
    max-width: 100px;
    max-height: 100px;
    object-fit: contain;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.3));
  }
  // 어두운 바다에서는 윤곽이 묻히지 않게 은은한 빛
  .deep .charm,
  .abyss .charm {
    filter: drop-shadow(0 0 1px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.18));
  }

  .where {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 12px 0 0;
    padding: 5px 11px 5px 9px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 12.5px;
    font-weight: 700;
    backdrop-filter: blur(6px);

    i {
      width: 7px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: var(--accent);
    }
  }
  .light .where {
    background: rgba(255, 255, 255, 0.7);
  }

  .vent {
    position: absolute;
    z-index: -2;
    inset: 35% 0 0;
    background: radial-gradient(ellipse 70% 60% at 30% 110%, rgba(255, 95, 60, 0.6), transparent 70%);
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
    margin: 10px 0 0;
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
  }
  .depth.long {
    font-size: clamp(48px, 15vw, 64px);
  }
  .glitch {
    font-weight: 800;
    font-size: clamp(44px, 13vw, 54px);
    letter-spacing: -0.02em;
    text-shadow:
      -3px 0 rgba(255, 42, 85, 0.9),
      3px 0 rgba(42, 255, 234, 0.7);
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
