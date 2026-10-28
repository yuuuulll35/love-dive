<script lang="ts">
  import { onMount } from 'svelte';
  import { ZONES, waterColor, zoneOf, type CreatureId, type MeasureResult, type ZoneId } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';
  import { sound } from '$shared/lib/sound.svelte';
  import { VOID_HEADLINE, FLOAT_HEADLINE } from '$shared/config/copy';
  import Plummet from './Plummet.svelte';
  import WaterSurface from './WaterSurface.svelte';
  import Creature from './Creature.svelte';
  import DepthGauge from './DepthGauge.svelte';
  import { Particles } from './particles';
  import { T_IMPACT, finalFrame, frameAt, totalDuration, type Frame } from './timeline';

  interface Props {
    result: MeasureResult;
    /** true 면 연출 없이 최종 프레임 (reduced-motion · 결과 재표시) */
    instant?: boolean;
    ondone?: () => void;
  }
  let { result, instant = false, ondone }: Props = $props();

  const hot = $derived(result.temperature.id === 'hot');
  const kind = $derived(result.kind);
  const target = $derived(result.depth);

  let frame = $state<Frame>(frameAt(0, 0, 'normal', false));
  let time = $state(0);
  let done = $state(false);
  let canvas: HTMLCanvasElement;
  let host: HTMLDivElement;

  // 구간 통과 이벤트
  type Spawn = { key: number; id: CreatureId };
  let creatures = $state<Spawn[]>([]);
  let passage = $state<{ key: number; text: string } | null>(null);
  let spawnKey = 0;

  const zoneIndex = (d: number) => (d < 5 ? 0 : ZONES.indexOf(zoneOf(d)));

  // ── 파생 시각값 ──
  const rgb = (c: number[], k = 0) => `rgb(${c.map((v) => Math.min(255, v + k)).join(',')})`;
  const water = $derived.by(() => {
    const d = frame.depth;
    const span = Math.max(30, d * 0.35);
    return {
      top: rgb(waterColor(Math.max(0, d - span * 0.6))),
      mid: rgb(waterColor(d)),
      bottom: rgb(waterColor(d + span)),
    };
  });
  const seabedColor = $derived(waterColor(target).map((v) => Math.min(255, Math.round(v * 1.5 + 14))));
  const raysOpacity = $derived(Math.max(0, 1 - frame.depth / 260) * (frame.surfaceY < 0.9 ? 1 : 0));
  const zoneLabel = $derived.by(() => {
    if (frame.phase === 'glitch' || frame.phase === 'blackout') return { name: '측정 불가', latin: 'NO SIGNAL' };
    if (frame.depth < 5) return { name: '수면', latin: 'SURFACE' };
    const z = zoneOf(frame.depth);
    return { name: z.name, latin: z.latin };
  });
  const counterText = $derived.by(() => {
    if (frame.phase === 'glitch') return scramble(formatDepth(frame.depth), frame.glitch, time);
    return formatDepth(frame.depth);
  });

  const GLYPHS = '#%▓▒░?!/<>=*0123456789';
  function scramble(s: string, g: number, t: number): string {
    const tick = Math.floor(t * 24);
    return s
      .split('')
      .map((c, i) => ((((tick * 31 + i * 17) % 97) / 97) < g * 0.8 ? GLYPHS[(tick + i * 7) % GLYPHS.length] : c))
      .join('');
  }

  onMount(() => {
    const particles = new Particles(canvas);
    const resize = () => particles.resize(host.clientWidth, host.clientHeight);
    resize();
    addEventListener('resize', resize);

    const total = totalDuration(target, kind);
    let t = instant ? total + 1 : 0;
    let last = performance.now();
    let lastZone = zoneIndex(0);
    let fired = { impact: instant, settle: instant, glitch: instant, done: false };
    let bobAcc = 0;
    let raf = 0;

    const finish = () => {
      if (fired.done) return;
      fired.done = true;
      done = true;
      sound.stopDrone();
      ondone?.();
    };

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      time = t;
      const f = frameAt(t, target, kind, hot);
      frame = f;
      const w = host.clientWidth;
      const h = host.clientHeight;

      // 입수
      if (!fired.impact && t >= T_IMPACT) {
        fired.impact = true;
        particles.splash(w / 2, f.surfaceY * h);
        sound.splash();
        if (kind !== 'float') sound.startDrone();
      }
      if (kind === 'float' && fired.impact) {
        bobAcc += dt;
        if (bobAcc > 1.2) {
          bobAcc = 0;
          particles.bob(w / 2);
        }
      }

      // 구간 통과
      const zi = zoneIndex(f.depth);
      if (zi > lastZone && f.phase === 'sink' && !instant) {
        for (let i = lastZone + 1; i <= zi; i++) enterZone(ZONES[i].id, i === zi);
      }
      lastZone = Math.max(lastZone, zi);
      sound.setDepth(f.depthRatio);

      if (!fired.settle && f.phase === 'settle') {
        fired.settle = true;
        particles.dust(w / 2, f.seabedY * h + 4);
        sound.stopDrone();
        sound.thud();
      }
      if (!fired.glitch && f.phase === 'glitch') {
        fired.glitch = true;
        sound.glitch();
      }
      if (f.phase === 'done') finish();

      particles.update(dt, f, w / 2, t);
      particles.draw(f, { tint: seabedColor.join(',') });
      raf = requestAnimationFrame(step);
    };

    if (instant) {
      frame = finalFrame(target, kind, hot);
      particles.draw(frame, { tint: seabedColor.join(',') });
      finish();
      // reduced-motion 이 아니면 배경 입자(마린 스노우 등)만 계속 흐르게 둔다
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) raf = requestAnimationFrame(step);
    } else {
      raf = requestAnimationFrame(step);
    }

    function enterZone(id: ZoneId, latest: boolean) {
      const z = ZONES.find((x) => x.id === id)!;
      if (z.creature) creatures = [...creatures, { key: ++spawnKey, id: z.creature }];
      const text = result.passages[id];
      if (latest && text) passage = { key: ++spawnKey, text };
      if (latest) sound.ping(1 - ZONES.indexOf(z) * 0.08);
    }

    // 외부에서 skip() 호출 시
    skipImpl = () => {
      t = total + 1;
      creatures = [];
      passage = null;
      fired = { impact: true, settle: true, glitch: true, done: fired.done };
    };

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      sound.stopDrone();
    };
  });

  let skipImpl = () => {};
  export function skip() {
    skipImpl();
  }

  // 하늘 위(낙하 중)에서는 HUD 가 추를 가리고 밝은 배경에 묻히므로 입수 후에만 띄운다
  const showHud = $derived(!done && frame.phase !== 'blackout' && kind !== 'float' && frame.surfaceY < 0.15);
</script>

<div
  class="scene"
  class:hot
  class:glitching={frame.glitch > 0}
  bind:this={host}
  style:--water-top={water.top}
  style:--water-mid={water.mid}
  style:--water-bottom={water.bottom}
  style:--glitch={frame.glitch}
>
  <div class="water"></div>

  <div class="rays" style:opacity={raysOpacity} aria-hidden="true">
    <span></span><span></span><span></span><span></span>
  </div>

  <!-- 하늘 + 수면 (수면이 화면 안에 있을 때만) -->
  {#if frame.surfaceY > -0.3}
    <div class="sky" style:transform="translateY({(frame.surfaceY - 1) * 100}dvh)" aria-hidden="true">
      <div class="sun"></div>
    </div>
    <div class="surface" style:top="calc({frame.surfaceY * 100}dvh - 38px)">
      <WaterSurface calm={kind === 'float'} />
    </div>
  {/if}

  <canvas bind:this={canvas} class="particles" aria-hidden="true"></canvas>

  <div class="creatures">
    {#each creatures as c (c.key)}
      <Creature id={c.id} onend={() => (creatures = creatures.filter((x) => x.key !== c.key))} />
    {/each}
  </div>

  <!-- 해저면 -->
  {#if frame.seabedY < 1.2}
    <div class="seabed" style:top="{frame.seabedY * 100}dvh" style:--bed={rgb(seabedColor)} aria-hidden="true">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none">
        <path class="far" d="M0 26C50 12 90 30 150 20S260 4 320 18 380 24 400 16V120H0z" />
        <path class="near" d="M0 34C40 26 80 40 140 32S250 22 300 30 370 40 400 30V120H0z" />
      </svg>
      {#if hot}
        <div class="vent">
          <svg viewBox="0 0 40 80"><path d="M10 80L14 40 11 30 16 18 15 6h10l-1 12 5 12-3 10 4 40z" /></svg>
          <span class="plume"></span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="vent-glow" style:opacity={frame.vent} aria-hidden="true"></div>

  <div
    class="weight"
    style:top="{frame.weightY * 100}dvh"
    style:transform="translate(-50%, -50%) rotate({Math.sin(time * 1.4) * (frame.phase === 'bob' ? 7 : 3)}deg)"
  >
    <Plummet glow={frame.depth > 1000} />
  </div>

  <!-- HUD -->
  <div class="hud" class:hidden={!showHud}>
    <div class="counter" aria-hidden="true">
      <div class="num mono" data-text={counterText}>{counterText}<span class="unit">m</span></div>
      <div class="meta mono">
        <span>{frame.phase === 'glitch' ? '----' : formatAtm(frame.depth)} atm</span>
        <span class="dot"></span>
        <span class="zone">{zoneLabel.name}</span>
        <span class="latin">{zoneLabel.latin}</span>
      </div>
    </div>
    {#if kind !== 'float'}
      <DepthGauge depth={frame.depth} />
    {/if}
  </div>

  {#if passage && !done}
    {#key passage.key}
      <p class="passage soft" aria-hidden="true">{passage.text}</p>
    {/key}
  {/if}

  {#if kind === 'float' && frame.phase === 'bob' && time > 2}
    <p class="passage soft float-line" aria-hidden="true">{FLOAT_HEADLINE}</p>
  {/if}

  {#if frame.black > 0}
    <div class="blackout" style:opacity={frame.black}>
      <p class="mono">{VOID_HEADLINE}</p>
    </div>
  {/if}

  <!-- 스크린리더용 진행 상황 -->
  <p class="sr-only" aria-live="polite">
    {done ? '' : frame.phase === 'drop' ? '측심추를 떨어뜨립니다' : ''}
  </p>
</div>

<style lang="scss">
  .scene {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: var(--water-mid);
    isolation: isolate;
  }

  .water {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, var(--water-top), var(--water-mid) 45%, var(--water-bottom));
  }

  .rays {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: screen;

    span {
      position: absolute;
      top: -20%;
      width: 18vw;
      min-width: 60px;
      height: 130%;
      background: linear-gradient(to bottom, rgba(220, 255, 255, 0.28), rgba(220, 255, 255, 0) 75%);
      transform-origin: top center;
      filter: blur(6px);
      animation: sway 9s ease-in-out infinite alternate;
    }
    span:nth-child(1) { left: 8%; transform: rotate(14deg); }
    span:nth-child(2) { left: 34%; width: 10vw; transform: rotate(8deg); animation-delay: -3s; }
    span:nth-child(3) { left: 58%; transform: rotate(4deg); animation-delay: -5s; }
    span:nth-child(4) { left: 80%; width: 8vw; transform: rotate(-4deg); animation-delay: -1s; }
  }

  .sky {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 100dvh;
    background: linear-gradient(to bottom, var(--sky-top), var(--sky-mid) 55%, var(--sky-bottom));
    pointer-events: none;
  }

  .sun {
    position: absolute;
    left: 50%;
    bottom: 12%;
    width: 180px;
    height: 180px;
    transform: translateX(-50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 246, 232, 0.95), rgba(255, 220, 200, 0.4) 40%, transparent 70%);
  }

  .surface {
    position: absolute;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  .particles {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .creatures {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .seabed {
    position: absolute;
    left: 0;
    right: 0;
    height: 70dvh;
    pointer-events: none;

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .far {
      fill: var(--bed);
      opacity: 0.45;
      transform: translateY(-14px);
    }
    .near {
      fill: var(--bed);
    }
  }

  .vent {
    position: absolute;
    right: 14%;
    top: -60px;
    width: 34px;

    svg {
      display: block;
      width: 100%;
      fill: #120607;
    }
    .plume {
      position: absolute;
      left: 50%;
      bottom: 92%;
      width: 60px;
      height: 140px;
      transform: translateX(-50%);
      background: radial-gradient(ellipse at 50% 100%, rgba(255, 110, 60, 0.55), transparent 65%);
      filter: blur(8px);
      animation: plume 2.4s ease-in-out infinite alternate;
    }
  }

  .vent-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 90% 45% at 60% 105%, rgba(255, 90, 50, 0.55), transparent 70%),
      radial-gradient(ellipse 60% 30% at 30% 110%, rgba(255, 40, 70, 0.35), transparent 70%);
    mix-blend-mode: screen;
    animation: flicker 3s ease-in-out infinite;
  }

  .weight {
    position: absolute;
    left: 50%;
    will-change: transform, top;
  }

  .hud {
    position: absolute;
    inset: 0;
    pointer-events: none;
    transition: opacity 0.6s;
    &.hidden {
      opacity: 0;
    }
  }

  .counter {
    position: absolute;
    left: var(--gutter);
    right: var(--gutter);
    top: max(64px, calc(env(safe-area-inset-top) + 56px));
    text-align: center;
    color: #fff;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.35);
  }

  .num {
    position: relative;
    font-size: clamp(44px, 14vw, 80px);
    font-weight: 500;
    line-height: 1;
    letter-spacing: -0.02em;

    .unit {
      margin-left: 6px;
      font-size: 0.36em;
      font-weight: 400;
      opacity: 0.7;
    }
  }

  .meta {
    display: inline-flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.78);

    .dot {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.6;
    }
    .zone {
      font-family: var(--font-sans);
      font-weight: 600;
      color: #fff;
    }
    .latin {
      font-size: 10px;
      letter-spacing: 0.14em;
      opacity: 0.6;
    }
  }

  .passage {
    position: absolute;
    left: var(--gutter);
    right: var(--gutter);
    top: 62%;
    margin: 0;
    text-align: center;
    font-size: clamp(17px, 4.6vw, 22px);
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.5);
    animation: passage 2.8s var(--ease-out) forwards;
    pointer-events: none;
  }

  .float-line {
    top: 64%;
    color: var(--sky-ink);
    text-shadow: none;
    animation: fade-in 1s var(--ease-out) forwards;
  }

  // ── 측정 불가 글리치 ──
  .glitching {
    animation: shake 0.12s steps(2) infinite;

    .num {
      color: #fff;
      &::before,
      &::after {
        content: attr(data-text);
        position: absolute;
        inset: 0;
        mix-blend-mode: screen;
      }
      &::before {
        color: #ff2a55;
        transform: translate(calc(var(--glitch) * -6px), 0);
        clip-path: inset(10% 0 55% 0);
      }
      &::after {
        color: #2affea;
        transform: translate(calc(var(--glitch) * 6px), 0);
        clip-path: inset(55% 0 8% 0);
      }
    }

    .water::after {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 3px);
      opacity: var(--glitch);
    }
  }

  .blackout {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: #000;
    z-index: 5;

    p {
      margin: 0;
      padding: 0 var(--gutter);
      font-size: 13px;
      letter-spacing: 0.12em;
      color: rgba(255, 90, 110, 0.9);
      text-align: center;
      animation: blink-text 1.1s steps(2) infinite;
    }
  }

  @keyframes sway {
    to {
      translate: 4vw 0;
      opacity: 0.6;
    }
  }
  @keyframes plume {
    to {
      transform: translateX(-50%) scale(1.15, 1.25);
      opacity: 0.7;
    }
  }
  @keyframes flicker {
    50% {
      filter: brightness(1.2);
    }
  }
  @keyframes passage {
    0% {
      opacity: 0;
      transform: translateY(10px);
      filter: blur(4px);
    }
    20%,
    70% {
      opacity: 1;
      transform: none;
      filter: none;
    }
    100% {
      opacity: 0;
      transform: translateY(-8px);
      filter: blur(3px);
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  @keyframes shake {
    0% {
      transform: translate(1px, -1px);
    }
    100% {
      transform: translate(-2px, 1px);
    }
  }
  @keyframes blink-text {
    50% {
      opacity: 0.35;
    }
  }
</style>
