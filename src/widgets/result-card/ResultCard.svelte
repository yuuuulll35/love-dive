<script lang="ts">
  import { ZONES, waterColor, type MeasureResult } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';

  interface Props {
    result: MeasureResult;
    /** 캡처 대상 노드 */
    node?: HTMLElement;
  }
  let { result, node = $bindable() }: Props = $props();

  const MAX = 10935;
  const pos = (d: number) => Math.log1p(Math.max(0, d)) / Math.log1p(MAX);
  const bands = ZONES.slice(1).map((z) => ({ id: z.id, name: z.name, from: pos(z.from), to: pos(Math.min(z.to, MAX)) }));

  const labels = [
    { d: 0, text: '0' }, { d: 200, text: '200' }, { d: 1000, text: '1K' }, { d: MAX, text: '10,935m' },
  ];

  const tone = $derived(waterColor(Math.min(result.depth, 3000) * 0.4).join(','));
  const isVoid = $derived(result.kind === 'void');
  const isFloat = $derived(result.kind === 'float');
</script>

<article
  class="card {result.temperature.id}"
  class:void={isVoid}
  class:float={isFloat}
  style:--tone={tone}
  bind:this={node}
  aria-label="측정 결과"
>
  <header class="top mono">
    <span class="brand">LOVE DIVE</span>
    <span>SOUNDING LOG</span>
  </header>

  {#if result.pair}
    <p class="pair serif">{result.pair}</p>
  {/if}

  <div class="depth">
    {#if isVoid}
      <p class="value mono glitch" data-text="ERR">측정 불가</p>
      <p class="sub mono">&gt; {formatDepth(MAX)} m · &gt; {formatAtm(MAX)} atm</p>
    {:else}
      <p class="value mono">{formatDepth(result.depth)}<span class="unit">m</span></p>
      <p class="sub mono">{formatAtm(result.depth)} atm · {result.zone.name} <span class="latin">{result.zone.latin}</span></p>
    {/if}
  </div>

  <!-- 수심 프로필 바 -->
  <div class="profile" aria-hidden="true">
    {#each bands as b (b.id)}
      <span class="band {b.id}" style:left="{b.from * 100}%" style:width="{(b.to - b.from) * 100}%"></span>
    {/each}
    <span class="marker" style:left="{Math.min(1, pos(result.depth)) * 100}%"></span>
  </div>
  <div class="profile-labels mono" aria-hidden="true">
    {#each labels as l (l.d)}
      <span style:left="{pos(l.d) * 100}%">{l.text}</span>
    {/each}
  </div>

  <div class="title">
    <p class="label mono">칭호</p>
    <h2 class="serif">{result.title}</h2>
    <p class="temp"><span class="swatch"></span>{result.temperature.label} · {result.temperature.tone}</p>
  </div>

  <div class="lines serif">
    {#each result.lines as line, i (i)}
      <p>{line}</p>
    {/each}
  </div>

  <footer class="foot mono">
    <span>12-AXIS PAIR SOUNDING</span>
    <span>♥ ─── {isVoid ? '∞' : formatDepth(result.depth) + 'm'}</span>
  </footer>
</article>

<style lang="scss">
  .card {
    --fg: #eef5f8;
    --fg-dim: rgba(238, 245, 248, 0.66);
    --fg-faint: rgba(238, 245, 248, 0.36);
    --rule: rgba(238, 245, 248, 0.14);
    --accent: var(--biolume);

    position: relative;
    display: grid;
    gap: 18px;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 22px 22px 18px;
    border-radius: 22px;
    overflow: hidden;
    color: var(--fg);
    background:
      radial-gradient(120% 60% at 85% -10%, rgba(var(--tone), 0.9), transparent 60%),
      linear-gradient(170deg, #0b1c36 0%, #050b18 55%, #020409 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow:
      0 30px 80px -20px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);

    // 종이 결 노이즈 대신 아주 옅은 스캔라인
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.018) 0 1px, transparent 1px 4px);
      pointer-events: none;
    }

    > * {
      position: relative;
    }
  }

  .lukewarm {
    --accent: #b9c7d4;
    background:
      radial-gradient(120% 60% at 85% -10%, rgba(var(--tone), 0.7), transparent 60%),
      linear-gradient(170deg, #1b2633 0%, #0b1017 60%, #050709 100%);
  }

  .hot {
    --accent: #ff7a59;
    background:
      radial-gradient(120% 50% at 85% -10%, rgba(var(--tone), 0.6), transparent 60%),
      radial-gradient(90% 45% at 60% 110%, rgba(255, 80, 50, 0.45), transparent 70%),
      linear-gradient(170deg, #12101c 0%, #0a0509 60%, #060203 100%);
  }

  .float {
    --fg: var(--sky-ink);
    --fg-dim: rgba(15, 43, 59, 0.7);
    --fg-faint: rgba(15, 43, 59, 0.42);
    --rule: rgba(15, 43, 59, 0.14);
    --accent: #0d7f99;
    background:
      radial-gradient(120% 60% at 80% -10%, rgba(255, 246, 232, 1), transparent 60%),
      radial-gradient(140% 40% at 50% 112%, rgba(64, 196, 206, 0.55), transparent 70%),
      linear-gradient(180deg, #f6eee8 0%, #e3ecef 55%, #c5e6ec 100%);
    border-color: rgba(15, 43, 59, 0.12);

    &::before {
      display: none;
    }
  }

  .void {
    --accent: #ff4d6d;
    background:
      repeating-linear-gradient(to bottom, rgba(255, 77, 109, 0.05) 0 1px, transparent 1px 3px),
      linear-gradient(180deg, #050505, #000);
    border-color: rgba(255, 77, 109, 0.25);
  }

  .top {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    letter-spacing: 0.18em;
    color: var(--fg-faint);

    .brand {
      color: var(--thread);
      font-weight: 500;
    }
  }

  .pair {
    margin: -6px 0 -10px;
    font-size: 16px;
    color: var(--fg-dim);
  }

  .depth {
    .value {
      margin: 0;
      font-size: clamp(56px, 18vw, 76px);
      font-weight: 500;
      line-height: 1;
      letter-spacing: -0.03em;

      .unit {
        margin-left: 6px;
        font-size: 0.34em;
        font-weight: 400;
        letter-spacing: 0;
        color: var(--fg-dim);
      }
    }
    .sub {
      margin: 10px 0 0;
      font-size: 12px;
      color: var(--fg-dim);

      .latin {
        font-size: 10px;
        letter-spacing: 0.14em;
        color: var(--fg-faint);
      }
    }
  }

  .glitch {
    font-family: var(--font-sans) !important;
    font-size: clamp(44px, 13vw, 58px) !important;
    font-weight: 600 !important;
    color: #fff;
    text-shadow:
      -3px 0 rgba(255, 42, 85, 0.85),
      3px 0 rgba(42, 255, 234, 0.6);
  }

  .profile {
    position: relative;
    padding-top: 6px;
    border-radius: 3px;
    background: var(--rule);
    margin-top: 2px;

    .band {
      position: absolute;
      top: 0;
      bottom: 0;
      opacity: 0.85;
      &:first-child {
        border-radius: 3px 0 0 3px;
      }
      &:last-of-type {
        border-radius: 0 3px 3px 0;
      }
      &.sunlight { background: #40c4ce; }
      &.twilight { background: #1c6aa8; }
      &.midnight { background: #24357a; }
      &.abyss { background: #3a2b62; }
      &.hadal { background: #5a2147; }
    }

    .marker {
      position: absolute;
      top: 50%;
      width: 12px;
      padding-top: 12px;
      transform: translate(-50%, -50%) rotate(45deg);
      background: var(--thread);
      box-shadow: 0 0 0 3px rgba(255, 77, 109, 0.25), 0 0 12px rgba(255, 77, 109, 0.7);
    }
  }

  .profile-labels {
    position: relative;
    padding-top: 12px;
    margin-top: -12px;
    font-size: 9px;
    color: var(--fg-faint);

    span {
      position: absolute;
      top: 0;
      white-space: nowrap;
      transform: translateX(-50%);
      &:first-child {
        transform: none;
      }
      &:last-child {
        transform: translateX(-100%);
      }
    }
  }

  .title {
    padding-top: 16px;
    border-top: 1px solid var(--rule);

    .label {
      margin: 0 0 4px;
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--fg-faint);
    }
    h2 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }
    .temp {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 10px 0 0;
      font-size: 13px;
      color: var(--fg-dim);
    }
    // 이미지 저장 시 height 는 복사되지 않으므로 빈 요소는 padding 으로 크기를 잡는다
    .swatch {
      flex: none;
      width: 10px;
      padding-top: 10px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 10px var(--accent);
    }
  }

  .lines {
    display: grid;
    gap: 6px;

    p {
      margin: 0;
      font-size: 15px;
      line-height: 1.7;
      // 라이브 화면과 이미지 저장 결과의 줄바꿈이 어긋나지 않도록 여유 있게 균형 배분
      text-wrap: balance;
      color: var(--fg);

      &:first-child {
        color: var(--accent);
      }
      &:not(:first-child) {
        color: var(--fg-dim);
      }
    }
  }

  .foot {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px dashed var(--rule);
    font-size: 10px;
    letter-spacing: 0.14em;
    color: var(--fg-faint);
  }
</style>
