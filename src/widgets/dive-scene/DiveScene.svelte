<script lang="ts">
  import { onMount } from 'svelte';
  import { ZONES, ZONE_LIFE, waterColor, zoneOf, type CreatureId, type MeasureResult, type ZoneId } from '$entities/abyss';
  import { formatAtm, formatDepth } from '$shared/lib/format';
  import { sound } from '$shared/lib/sound.svelte';
  import { VOID_HEADLINE, FLOAT_HEADLINE } from '$shared/config/copy';
  import Plummet from './Plummet.svelte';
  import WaterSurface from './WaterSurface.svelte';
  import Creature from './Creature.svelte';
  import SeabedLife from './SeabedLife.svelte';
  import DepthGauge from './DepthGauge.svelte';
  import { Particles } from './particles';
  import { T_COUNT, T_IMPACT, finalFrame, frameAt, totalDuration, type Frame } from './timeline';

  interface Props {
    result: MeasureResult;
    /** 페어 이미지 — 측심추 대신 가라앉는다 */
    image?: string | null;
    /** true 면 연출 없이 최종 프레임 (reduced-motion · 결과 재표시) */
    instant?: boolean;
    ondone?: () => void;
  }
  let { result, image = null, instant = false, ondone }: Props = $props();

  const hot = $derived(result.temperature.id === 'hot');
  const kind = $derived(result.kind);
  const target = $derived(result.depth);

  let frame = $state<Frame>(frameAt(0, 0, 'normal', false));
  let time = $state(-T_COUNT);

  // 카운트다운: 3 · 2 · 1 · LOVE DIVE!
  const COUNT_STEP = 0.65;
  const countLabel = $derived.by(() => {
    if (instant || done || time >= 0.45) return null;
    if (time >= 0) return 'LOVE DIVE!';
    const i = Math.floor((time + T_COUNT) / COUNT_STEP);
    return i < 3 ? String(3 - i) : 'LOVE DIVE!';
  });
  let lastCount: string | null = null;
  $effect(() => {
    if (countLabel && countLabel !== lastCount) sound.tick(countLabel === 'LOVE DIVE!');
    lastCount = countLabel;
  });
  let done = $state(false);
  let canvas: HTMLCanvasElement;
  let host: HTMLDivElement;

  // 구간 통과 이벤트
  /** at: 나타난 순간의 카메라 누적 하강 거리(px) */
  type Spawn = { key: number; id: CreatureId; pos: number; scale: number; flip: boolean; far: boolean; at: number };
  let creatures = $state<Spawn[]>([]);
  let scrollPx = $state(0);
  // 실제보다 느리게 올려 보내 생물을 감상할 시간을 준다. 먼 생물·거대한 고래는 더 느리게(시차)
  const BIG: CreatureId[] = ['whale', 'sperm'];
  const liftOf = (c: Spawn) => (scrollPx - c.at) * (BIG.includes(c.id) ? 0.16 : c.far ? 0.18 : 0.35);
  let passage = $state<{ key: number; text: string } | null>(null);
  let spawnKey = 0;

  /** 생물 하나 띄우기: 위치·크기·방향·원근을 무작위로 */
  function spawn(id: CreatureId, opts: Partial<Omit<Spawn, 'key' | 'id'>> = {}) {
    const far = opts.far ?? Math.random() < 0.3;
    creatures = [
      ...creatures,
      {
        key: ++spawnKey,
        at: scrollPx,
        id,
        pos: 0.12 + Math.random() * 0.62,
        scale: (far ? 0.55 : 0.8) + Math.random() * 0.4,
        flip: Math.random() < 0.4,
        far,
        ...opts,
      },
    ];
  }

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
  // 얕은 바다는 모래빛, 깊어질수록 물빛에 섞인 어두운 바닥
  const seabedColor = $derived(
    target < 200 ? [232, 214, 176] : waterColor(target).map((v) => Math.min(255, Math.round(v * 1.5 + 14))),
  );
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
    let t = instant ? total + 1 : -T_COUNT;
    let last = performance.now();
    let lastZone = zoneIndex(0);
    let fired = { impact: instant, settle: instant, glitch: instant, done: false };
    let bobAcc = 0;
    let lifeAcc = 0;
    let nextLife = 0.8;
    let lastLife: CreatureId | null = null;
    const pickLife = (zid: string): CreatureId => {
      const pool = ZONE_LIFE[zid] ?? ZONE_LIFE.sunlight;
      let id = pool[Math.floor(Math.random() * pool.length)];
      if (id === lastLife) id = pool[(pool.indexOf(id) + 1) % pool.length];
      return (lastLife = id);
    };
    // 고래는 꼭 한 번: 입수 직후 혹등고래, 깊은 다이브면 점심해에서 향유고래
    let sinkStart = -1;
    let humpback = false;
    let humpbackFlip = false;
    let sperm = target < 1500;
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
        // 떠 있는 동안 수면 아래로 얕은 바다 생물이 지나간다
        lifeAcc += dt;
        if (lifeAcc >= nextLife && creatures.length < 4 && !done) {
          lifeAcc = 0;
          nextLife = 0.9 + Math.random() * 0.8;
          spawn(pickLife('sunlight'), { pos: 0.6 + Math.random() * 0.25, far: Math.random() < 0.25 });
        }
      }

      if (f.phase === 'sink' && !instant) {
        if (sinkStart < 0) {
          sinkStart = t;
          // 입수하자마자 얕은 바다의 생기: 열대어와 물고기 떼부터
          spawn('tropical', { pos: 0.66, far: false });
        }
        if (!humpback && t - sinkStart > 0.5) {
          humpback = true;
          humpbackFlip = Math.random() < 0.5;
          spawn('whale', { pos: 0.52, scale: 1, far: false, flip: humpbackFlip });
          sound.whale();
        }
        if (!sperm && f.depth > 1200) {
          sperm = true;
          // 혹등고래와 겹치지 않게 위쪽에서 반대 방향으로
          spawn('sperm', { pos: 0.3, scale: 0.9, far: false, flip: !humpbackFlip });
        }
      }

      // 구간에 머무는 동안 생물이 계속 지나간다 (얕을수록 더 북적이게)
      if (f.phase === 'sink' && !instant && f.depth >= 5) {
        const zid = zoneOf(f.depth).id;
        const shallow = zid === 'sunlight';
        lifeAcc += dt;
        if (lifeAcc >= nextLife && creatures.length < (shallow ? 7 : 5)) {
          lifeAcc = 0;
          nextLife = shallow ? 0.45 + Math.random() * 0.5 : 1.2 + Math.random() * 1.3;
          spawn(pickLife(zid));
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
      scrollPx = particles.scrollPx;
      // 생물은 제 깊이에 머문다: 카메라가 내려간 만큼 위로 밀려 올라가고, 화면 위로 충분히 벗어나면 정리
      if (creatures.some((c) => liftOf(c) > h * 1.4)) creatures = creatures.filter((c) => liftOf(c) <= h * 1.4);
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
      if (z.creature && latest) spawn(z.creature);
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

  <div class="caustics" style:opacity={raysOpacity * 0.9} aria-hidden="true"></div>

  <div class="rays" style:opacity={raysOpacity} aria-hidden="true">
    <span></span><span></span><span></span><span></span>
  </div>

  <!-- 하늘 + 수면 (수면이 화면 안에 있을 때만) -->
  {#if frame.surfaceY > -0.3}
    <div class="sky" style:transform="translateY({(frame.surfaceY - 1) * 100}dvh)" aria-hidden="true">
      <div class="sun"></div>
      <svg class="gull g1" viewBox="0 0 40 14"><path d="M2 10C8 2 14 2 20 9c6-7 12-7 18 1" /></svg>
      <svg class="gull g2" viewBox="0 0 40 14"><path d="M2 10C8 2 14 2 20 9c6-7 12-7 18 1" /></svg>
      <svg class="gull g3" viewBox="0 0 40 14"><path d="M2 10C8 2 14 2 20 9c6-7 12-7 18 1" /></svg>
    </div>
    <div class="surface" style:top="calc({frame.surfaceY * 100}dvh - 38px)">
      <WaterSurface calm={kind === 'float'} />
    </div>
  {/if}

  <canvas bind:this={canvas} class="particles" aria-hidden="true"></canvas>

  <div class="creatures">
    {#each creatures as c (c.key)}
      <Creature
        id={c.id}
        pos={c.pos}
        scale={c.scale}
        flip={c.flip}
        far={c.far}
        lift={liftOf(c)}
        onend={() => (creatures = creatures.filter((x) => x.key !== c.key))}
      />
    {/each}
  </div>

  <!-- 해저면 -->
  {#if frame.seabedY < 1.2}
    <div class="seabed" style:top="{frame.seabedY * 100}dvh" style:--bed={rgb(seabedColor)} aria-hidden="true">
      <svg viewBox="0 0 400 120" preserveAspectRatio="none">
        <path class="far" d="M0 26C50 12 90 30 150 20S260 4 320 18 380 24 400 16V120H0z" />
        <path class="near" d="M0 34C40 26 80 40 140 32S250 22 300 30 370 40 400 30V120H0z" />
      </svg>
      {#if kind === 'normal'}<SeabedLife zone={result.zone.id} />{/if}
    </div>
  {/if}

  <div class="vent-glow" style:opacity={frame.vent} aria-hidden="true"></div>

  <div
    class="weight"
    style:top="{frame.weightY * 100}dvh"
    style:transform="translate(-50%, -50%) rotate({Math.sin(time * 1.4) * (frame.phase === 'bob' ? 7 : 3)}deg)"
  >
    <Plummet glow={frame.depth > 1000} {image} />
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
      <p class="passage" aria-hidden="true">{passage.text}</p>
    {/key}
  {/if}

  {#if kind === 'float' && frame.phase === 'bob' && time > 2}
    <p class="passage float-line" aria-hidden="true">{FLOAT_HEADLINE}</p>
  {/if}

  {#if countLabel}
    {#key countLabel}
      <p class="count" class:go={countLabel === 'LOVE DIVE!'} aria-live="assertive">{countLabel}</p>
    {/key}
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

  // 갈매기: 하늘을 천천히 가로지르며 날갯짓
  .gull {
    position: absolute;
    left: 0;
    width: 30px;
    fill: none;
    stroke: rgba(43, 53, 102, 0.55);
    stroke-width: 2.4;
    stroke-linecap: round;
    animation:
      fly 16s linear infinite,
      flap-wing 0.9s ease-in-out infinite alternate;
  }
  .g1 {
    bottom: 34%;
  }
  .g2 {
    bottom: 42%;
    width: 22px;
    animation-delay: -6s, -0.3s;
    animation-duration: 20s, 0.8s;
  }
  .g3 {
    bottom: 27%;
    width: 18px;
    animation-delay: -11s, -0.5s;
    animation-duration: 24s, 1s;
    opacity: 0.7;
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

  // 수면 아래 햇빛 그물무늬: 두 겹의 빛 얼룩이 서로 다른 방향으로 흐른다
  .caustics {
    position: absolute;
    inset: 0;
    pointer-events: none;
    mix-blend-mode: screen;

    &::before,
    &::after {
      content: '';
      position: absolute;
      inset: -20%;
      background:
        radial-gradient(42px 16px at 20% 30%, rgba(255, 255, 255, 0.22), transparent 70%),
        radial-gradient(30px 12px at 70% 62%, rgba(255, 255, 255, 0.18), transparent 70%),
        radial-gradient(54px 18px at 46% 86%, rgba(255, 255, 255, 0.16), transparent 70%),
        radial-gradient(26px 10px at 86% 14%, rgba(255, 255, 255, 0.2), transparent 70%);
      background-size: 170px 130px;
      animation: caustic 7s linear infinite;
    }
    &::after {
      background-size: 230px 170px;
      transform: rotate(18deg);
      animation-duration: 11s;
      animation-direction: reverse;
      opacity: 0.8;
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
  // ── 카운트다운 ──
  .count {
    position: absolute;
    left: 0;
    right: 0;
    top: 34%;
    margin: 0;
    text-align: center;
    font-family: var(--font-logo);
    font-weight: 700;
    font-size: clamp(84px, 26vw, 120px);
    line-height: 1;
    color: #2b3566;
    text-shadow: 5px 5px 0 #ffb3c6;
    pointer-events: none;
    z-index: 4;
    animation: count-pop 0.65s var(--ease-out) both;

    &.go {
      top: 36%;
      font-size: clamp(44px, 14vw, 72px);
      color: #ff5c7a;
      text-shadow: 4px 4px 0 #2b3566;
      letter-spacing: 0.02em;
      animation: go-pop 1.4s var(--ease-out) both;
    }
  }
  @keyframes count-pop {
    0% {
      opacity: 0;
      transform: scale(0.4);
    }
    35% {
      opacity: 1;
      transform: scale(1.12);
    }
    60% {
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(0.92);
    }
  }
  @keyframes go-pop {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(-6deg);
    }
    25% {
      opacity: 1;
      transform: scale(1.1) rotate(3deg);
    }
    40% {
      transform: scale(1) rotate(-2deg);
    }
    75% {
      opacity: 1;
      transform: scale(1) rotate(0);
    }
    100% {
      opacity: 0;
      transform: translateY(-20px) scale(1.05);
    }
  }

  @keyframes fly {
    from {
      translate: -40px 0;
    }
    to {
      translate: 110vw -30px;
    }
  }
  @keyframes flap-wing {
    to {
      transform: scaleY(0.55);
    }
  }
  @keyframes caustic {
    to {
      background-position: 170px 130px;
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
