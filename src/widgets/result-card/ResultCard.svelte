<script lang="ts">
  import { waterColor, type MeasureResult } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';

  interface Props {
    result: MeasureResult;
    /** 페어 이미지 (data URL) */
    image?: string | null;
    /** 캡처 대상 노드 */
    node?: HTMLElement;
  }
  let { result, image = null, node = $bindable() }: Props = $props();

  const isVoid = $derived(result.kind === 'void');
  const isFloat = $derived(result.kind === 'float');
  const rgb = (c: number[]) => `rgb(${c.join(',')})`;
  // 창 배경: 그 수심의 물빛. 위는 조금 밝게
  const waterTop = $derived(rgb(waterColor(result.depth * 0.25)));
  const waterBottom = $derived(rgb(waterColor(result.depth)));
  const first = $derived(result.lines[0]);
  const rest = $derived(result.lines.slice(1));

  // 장식 기포 (x%, y%, 크기px)
  const bubbles = [
    [12, 70, 10], [20, 52, 6], [9, 38, 4], [70, 24, 7], [80, 46, 5], [62, 62, 4],
  ] as const;

  // 이미지 저장 시 height 는 복사되지 않으므로, 이 카드는 높이를 inset·aspect-ratio·padding 으로만 잡는다
</script>

<article
  class="card t-{result.temperature.id}"
  class:void={isVoid}
  class:float={isFloat}
  bind:this={node}
  aria-label="측정 결과"
>
  <!-- ───── 물속 창 ───── -->
  <div class="window" style:--top={waterTop} style:--bottom={waterBottom}>
    {#if isFloat}
      <svg class="wave" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 10 Q25 2 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V24 H0Z" />
      </svg>
    {:else if !isVoid}
      {#each bubbles as [x, y, s], i (i)}
        <span class="bubble" style:left="{x}%" style:top="{y}%" style:width="{s}px" aria-hidden="true"></span>
      {/each}
      <svg class="bed" viewBox="0 0 400 44" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 22C60 8 110 26 180 18S300 4 400 20V44H0z" />
      </svg>
    {/if}
    {#if result.temperature.id === 'hot' && !isVoid && !isFloat}<span class="vent" aria-hidden="true"></span>{/if}

    <span class="thread" aria-hidden="true"></span>
    <svg class="heart" viewBox="0 0 44 40" aria-hidden="true">
      <circle cx="22" cy="4" r="3" fill="none" stroke="#c9d1dc" stroke-width="1.6" />
      <path d="M22 38C11 31 3 24 3 15.5 3 9.6 7.7 5 13.4 5c3.6 0 6.8 1.8 8.6 4.6C23.8 6.8 27 5 30.6 5 36.3 5 41 9.6 41 15.5 41 24 33 31 22 38z" />
      <ellipse cx="13.5" cy="13" rx="4" ry="3" fill="#fff" opacity="0.55" />
    </svg>

    <div class="pills">
      <span class="pill">{result.zone.name}</span>
      <span class="pill temp">{result.temperature.label}</span>
    </div>

    {#if isVoid}
      <p class="depth glitch">측정 불가</p>
      <p class="atm">10,935m 아래 · 장비 응답 없음</p>
    {:else}
      <p class="depth">{formatDepth(result.depth)}<span class="unit">m</span></p>
      <p class="atm">수압 {formatAtm(result.depth)} atm</p>
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

    <h2 class="title">{result.title}</h2>
    <p class="quote">{first}</p>

    {#if result.tags.length}
      <ul class="tags" aria-label="두드러진 축">
        {#each result.tags as tag (tag)}<li>#{tag}</li>{/each}
      </ul>
    {/if}

    <div class="lines">
      {#each rest as line, i (i)}<p>{line}</p>{/each}
    </div>

    <p class="brand" aria-hidden="true">
      L<svg viewBox="0 0 20 18"><path d="M10 17C5 13.6 1 10.2 1 6.2 1 3.3 3.2 1 6 1c1.7 0 3.1.8 4 2.1C10.9 1.8 12.3 1 14 1c2.8 0 5 2.3 5 5.2 0 4-4 7.4-9 10.8z" /></svg>VE DIVE
    </p>
  </div>
</article>

<style lang="scss">
  .card {
    --paper: #fffdf9;
    --ink: #24304a;
    --ink-2: #5b6680;
    --ink-3: #9aa3b5;
    --rule: #eee7de;
    --accent: #3d7bf2;
    --accent-soft: #e8f0ff;

    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 28px;
    background: var(--paper);
    color: var(--ink);
    box-shadow:
      0 0 0 5px rgba(255, 255, 255, 0.14),
      0 30px 70px -24px rgba(0, 0, 0, 0.65);
  }

  .t-lukewarm {
    --accent: #6a7896;
    --accent-soft: #edf0f5;
  }
  .t-hot {
    --accent: #f0436a;
    --accent-soft: #ffebf0;
  }
  .void {
    --accent: #ff4d6d;
    --accent-soft: #ffe9ee;
  }

  // ───── 물속 창 ─────
  .window {
    position: relative;
    overflow: hidden;
    padding: 18px 20px 78px;
    background: linear-gradient(to bottom, var(--top), var(--bottom));
    color: #fff;
    isolation: isolate;
  }

  .float .window {
    color: var(--ink);
    background: linear-gradient(to bottom, #ffd9e3 0%, #ffe9dc 45%, #cfeefa 70%, #5fcfda 71%, #3fb7c9 100%);
  }

  .void .window {
    background:
      repeating-linear-gradient(to bottom, rgba(255, 77, 109, 0.08) 0 1px, transparent 1px 3px),
      #050407;
  }

  .bubble {
    position: absolute;
    z-index: -1;
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.6), transparent 60%);
  }

  .bed {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    aspect-ratio: 400 / 44;
    fill: rgba(255, 255, 255, 0.12);
  }

  .wave {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    top: 66%;
    width: 100%;
    aspect-ratio: 400 / 24;
    fill: #5fcfda;
  }

  .vent {
    position: absolute;
    z-index: -1;
    left: 0;
    right: 0;
    bottom: 0;
    top: 40%;
    background: radial-gradient(ellipse 70% 60% at 70% 110%, rgba(255, 95, 60, 0.75), transparent 70%);
  }

  .thread {
    position: absolute;
    z-index: -1;
    top: 0;
    right: 51px;
    bottom: 46px;
    width: 2px;
    background: #ff4d6d;
    box-shadow: 0 0 8px rgba(255, 77, 109, 0.7);
  }

  .heart {
    position: absolute;
    right: 30px;
    bottom: 14px;
    width: 44px;
    aspect-ratio: 44 / 40;
    fill: #ff5c7a;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }

  .float .thread {
    bottom: 58px;
  }
  .float .heart {
    bottom: 30px;
  }
  .void .thread {
    bottom: 0;
    opacity: 0.6;
  }
  .void .heart {
    display: none;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    padding: 5px 11px 4px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.35);
    font-family: var(--font-display);
    font-size: 13px;
    line-height: 1.2;
    color: #fff;
  }
  .pill.temp {
    background: var(--accent-soft);
    border-color: transparent;
    color: var(--accent);
  }
  .float .pill:not(.temp) {
    background: rgba(255, 255, 255, 0.75);
    color: var(--ink);
  }

  .depth {
    margin: 14px 0 0;
    font-family: var(--font-num);
    font-weight: 700;
    font-size: clamp(56px, 18vw, 74px);
    line-height: 1;
    letter-spacing: -0.02em;
    text-shadow: 0 3px 16px rgba(0, 0, 0, 0.25);

    .unit {
      margin-left: 4px;
      font-size: 0.42em;
      font-weight: 600;
      opacity: 0.85;
    }
  }
  .float .depth {
    text-shadow: none;
  }

  .glitch {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(44px, 13vw, 54px);
    text-shadow:
      -3px 0 rgba(255, 42, 85, 0.9),
      3px 0 rgba(42, 255, 234, 0.7);
  }

  .atm {
    margin: 8px 0 0;
    font-size: 13px;
    opacity: 0.8;
  }

  // ───── 본문 ─────
  .body {
    display: grid;
    gap: 10px;
    padding: 20px 22px 16px;
  }

  .pair {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 2px;

    img {
      flex: none;
      width: 52px;
      aspect-ratio: 1;
      border-radius: 16px;
      object-fit: cover;
      border: 3px solid #fff;
      box-shadow: 0 0 0 1.5px var(--rule), 0 6px 14px -6px rgba(36, 48, 74, 0.35);
    }
    span {
      min-width: 0;
      font-family: var(--font-display);
      font-size: 17px;
      color: var(--ink-2);
    }
  }

  .title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 36px;
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  .quote {
    margin: 0;
    font-family: var(--font-soft);
    font-size: 15.5px;
    line-height: 1.6;
    color: var(--accent);
    text-wrap: balance;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0 2px;
    padding: 0;
    list-style: none;

    li {
      padding: 5px 11px 4px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-family: var(--font-display);
      font-size: 13.5px;
      line-height: 1.2;
    }
  }

  .lines {
    display: grid;
    gap: 4px;
    padding-top: 12px;
    border-top: 1.5px dashed var(--rule);

    p {
      margin: 0;
      font-family: var(--font-soft);
      font-size: 14.5px;
      line-height: 1.7;
      color: var(--ink-2);
      text-wrap: balance;
    }
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 6px 0 0;
    font-family: var(--font-num);
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.08em;
    color: var(--ink-3);

    svg {
      width: 11px;
      aspect-ratio: 20 / 18;
      margin: 0 1px;
      fill: #ff5c7a;
    }
  }
</style>
