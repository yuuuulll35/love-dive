<!--
  구간 생물. 모든 그림은 머리가 왼쪽 → 기본은 오른쪽에서 왼쪽으로 헤엄친다(flip 이면 반대).
  'rise' 계열(해파리·관해파리·흡혈오징어)은 카메라가 내려가므로 아래에서 위로 떠오른다.
-->
<script lang="ts">
  import type { CreatureId } from '$entities/abyss';

  interface Props {
    id: CreatureId;
    /** 화면 세로 위치 0~1 (헤엄치는 생물) / 가로 위치 0~1 (떠오르는 생물) */
    pos?: number;
    scale?: number;
    flip?: boolean;
    /** 먼 배경층: 흐리고 느리게 */
    far?: boolean;
    /** 카메라 하강으로 위로 밀려난 거리(px) */
    lift?: number;
    onend?: () => void;
  }
  let { id, pos = 0.4, scale = 1, flip = false, far = false, lift = 0, onend }: Props = $props();

  const RISERS: CreatureId[] = ['jelly', 'siphon', 'vampire'];
  const rise = $derived(RISERS.includes(id));

  const school = [
    [0, 30, 1], [28, 14, 0.85], [34, 44, 0.9], [62, 26, 1.05], [70, 56, 0.8],
    [96, 10, 0.75], [100, 38, 0.95], [128, 24, 0.85], [134, 52, 0.7], [160, 34, 0.8],
  ] as const;
  const lantern = [[0, 20, 1], [30, 6, 0.8], [38, 34, 0.9], [66, 18, 0.75], [74, 42, 0.85], [100, 28, 0.8]] as const;
  const fish = 'M0 8C5 2 15 1 22 6l7-4-2 6 2 6-7-4C15 15 5 14 0 8z';
  // x, y, 크기, 색
  const tropical = [
    [0, 20, 1.15, 'y'], [30, 4, 0.95, 'b'], [36, 36, 1, 'o'], [66, 18, 1.1, 'y'], [72, 46, 0.9, 'b'],
    [100, 6, 0.85, 'o'], [106, 30, 1, 'y'], [134, 18, 0.9, 'b'], [138, 44, 0.8, 'o'],
  ] as const;
</script>

<div
  class="creature {id}"
  class:rise
  class:flip
  class:far
  style:--pos={pos}
  style:--k={scale}
  style:translate="0 {-lift}px"
  onanimationend={(e) => e.target === e.currentTarget && onend?.()}
  aria-hidden="true"
>
  <div class="body">
    {#if id === 'school'}
      <svg viewBox="-4 0 196 72">
        {#each school as [x, y, s], i (i)}
          <path class="fish" d={fish} transform="translate({x} {y}) scale({s})" style:animation-delay="{-i * 0.13}s" />
        {/each}
      </svg>
    {:else if id === 'tropical'}
      <!-- 알록달록 열대어 떼 -->
      <svg viewBox="-4 -4 170 74">
        {#each tropical as [x, y, s, c], i (i)}
          <g transform="translate({x} {y}) scale({s})">
            <path class="fish t-{c}" d={fish} style:animation-delay="{-i * 0.17}s" />
            <path class="stripe" d="M9 3v10M15 4v8" />
            <circle class="t-eye" cx="4.5" cy="7" r="1.1" />
          </g>
        {/each}
      </svg>
    {:else if id === 'dolphin'}
      <svg viewBox="0 0 180 80">
        <path class="dolphin-fin" d="M80 22c4-12 12-18 22-20-4 8-6 14-4 22z" />
        <path class="dolphin-body" d="M4 40c6-4 14-6 22-6 10-10 30-14 54-12 30 2 56 12 74 22l14-12-2 14 10 12-18-6c-22 10-50 16-80 14-20-2-36-8-46-16-10 0-20-2-28-10z" />
        <path class="dolphin-belly" d="M26 42c16 8 40 12 66 10 22-2 42-8 58-14-18 10-42 18-70 18-22 0-42-6-54-14z" />
        <path class="dolphin-fin" d="M70 52c0 10 6 18 16 20-4-6-6-12-4-18z" />
        <circle class="eye" cx="30" cy="34" r="2" />
      </svg>
    {:else if id === 'turtle'}
      <svg viewBox="0 0 130 76">
        <path class="limb" d="M54 22C44 6 30 2 24 8c10 4 18 10 26 18z" />
        <path class="limb" d="M54 52C44 68 30 74 24 68c10-4 18-10 26-18z" />
        <path class="limb" d="M98 30c10-6 20-6 22-2-6 4-14 6-22 6z" />
        <path class="limb" d="M98 46c10 6 20 6 22 2-6-4-14-6-22-6z" />
        <ellipse class="head" cx="24" cy="38" rx="13" ry="10" />
        <ellipse class="shell" cx="68" cy="38" rx="36" ry="23" />
        <path class="pattern" d="M48 38h40M58 22l10 16-10 16M80 22l-12 16 12 16" />
        <circle class="eye" cx="18" cy="35" r="1.8" />
      </svg>
    {:else if id === 'ray'}
      <svg viewBox="0 0 170 90">
        <path
          class="wing"
          d="M14 44C36 36 58 8 84 6c26 2 48 30 72 38-24 8-46 12-62 14l-4 26h-8l-4-26c-16-2-38-6-64-14z"
        />
        <path class="horn" d="M74 10c-4-6-8-8-12-6M94 10c4-6 8-8 12-6" />
      </svg>
    {:else if id === 'whale'}
      <!-- 혹등고래: 긴 가슴지느러미, 배 주름, 꼬리지느러미 -->
      <svg viewBox="0 0 340 130">
        <g class="tail">
          <path class="whale-body" d="M282 52c8-8 18-20 32-28 6 0 8 4 4 8-8 6-14 12-18 22 6 6 14 14 24 20 4 4 0 8-6 6-14-6-26-14-36-20z" />
        </g>
        <path class="whale-body" d="M6 60C22 40 74 30 144 32c58 2 108 12 142 18l2 16c-38 10-94 22-150 22C78 88 28 80 6 60z" />
        <path class="whale-belly" d="M14 66c36 14 86 20 130 18 30-2 56-6 78-12-30 12-70 18-110 18-40 0-76-8-98-24z" />
        <path class="grooves" d="M22 68c40 10 84 14 124 12M30 73c36 8 74 10 110 8M40 78c30 6 62 7 94 5" />
        <g class="fin">
          <path class="whale-fin" d="M96 76c6 22 26 42 62 50 4 0 4-4 0-6-26-10-42-26-50-44z" />
        </g>
        <g class="bumps">
          <circle cx="16" cy="56" r="1.6" /><circle cx="24" cy="50" r="1.6" /><circle cx="34" cy="46" r="1.6" /><circle cx="22" cy="60" r="1.4" />
        </g>
        <circle class="eye" cx="52" cy="58" r="2.6" />
      </svg>
    {:else if id === 'sperm'}
      <!-- 향유고래: 네모난 머리, 깊이 2,000m 넘게 잠수 -->
      <svg viewBox="0 0 320 100">
        <g class="tail">
          <path class="sperm-body" d="M262 50c8-8 18-18 30-24 6-1 8 3 4 7-8 6-12 12-16 18 6 6 12 12 20 18 3 4-1 7-6 5-12-6-22-12-32-18z" />
        </g>
        <path class="sperm-body" d="M6 40C6 22 30 16 76 16c60 0 130 14 188 30l2 10C210 72 140 80 80 78 32 76 6 62 6 40z" />
        <path class="jaw" d="M22 62c22 6 52 8 84 6" />
        <path class="wrinkle" d="M120 30c40 6 80 14 120 24M126 70c40-2 80-8 116-16" />
        <circle class="eye" cx="70" cy="48" r="2.4" />
      </svg>
    {:else if id === 'jelly'}
      <svg viewBox="0 0 60 110">
        <path class="bell" d="M6 26C6 10 18 2 30 2s24 8 24 24c-3 3-8 4-12 2-3 3-8 3-12 0-4 3-9 3-12 0-4 2-9 1-12-2z" />
        <g class="tentacles">
          <path d="M14 28c-3 14 5 22 0 36s4 22 0 36" />
          <path d="M24 30c3 14-4 24 0 38s-3 20 0 32" />
          <path d="M36 30c-3 14 4 24 0 38s3 22 0 34" />
          <path d="M46 28c3 14-5 22 0 36s-4 22 0 30" />
        </g>
      </svg>
    {:else if id === 'lantern'}
      <svg viewBox="-4 -4 140 66">
        {#each lantern as [x, y, s], i (i)}
          <g transform="translate({x} {y}) scale({s})">
            <path class="fish" d={fish} style:animation-delay="{-i * 0.2}s" />
            <circle class="dot" cx="6" cy="10" r="1.6" style:animation-delay="{-i * 0.37}s" />
            <circle class="dot" cx="12" cy="11" r="1.2" style:animation-delay="{-i * 0.51}s" />
          </g>
        {/each}
      </svg>
    {:else if id === 'siphon'}
      <svg viewBox="0 0 40 220">
        <path class="stem" d="M20 0c-8 30 8 50 0 80s8 50 0 80 8 40 0 60" />
        {#each Array.from({ length: 11 }, (_, i) => i) as i (i)}
          <circle class="bead" cx={20 + Math.sin(i * 1.1) * 6} cy={10 + i * 19} r={3.4 - i * 0.18} style:animation-delay="{-i * 0.15}s" />
        {/each}
      </svg>
    {:else if id === 'angler'}
      <svg viewBox="0 0 110 70">
        <path class="stalk" d="M36 20C30 6 16 2 8 8" />
        <circle class="lure" cx="7" cy="10" r="3.2" />
        <path class="angler-body" d="M14 38C14 22 30 14 48 16c14 2 26 10 34 18l14-10-3 16 4 16-15-10c-9 10-22 16-38 14C26 59 14 52 14 38z" />
        <path class="teeth" d="M16 42l3 4 2-4 3 5 2-5 3 5 2-5 3 4" />
        <circle class="eye glow-eye" cx="30" cy="30" r="2" />
      </svg>
    {:else if id === 'vampire'}
      <svg viewBox="0 0 90 110">
        <ellipse class="fin" cx="24" cy="18" rx="10" ry="6" transform="rotate(-35 24 18)" />
        <ellipse class="fin" cx="66" cy="18" rx="10" ry="6" transform="rotate(35 66 18)" />
        <path class="mantle" d="M45 4C62 4 70 20 68 40c10 12 20 30 14 46-8-6-14-6-18 2-6-8-12-8-19 4-7-12-13-12-19-4-4-8-10-8-18-2-6-16 4-34 14-46C20 20 28 4 45 4z" />
        <circle class="red-eye" cx="36" cy="34" r="3" />
        <circle class="red-eye" cx="54" cy="34" r="3" />
        <circle class="tip" cx="8" cy="86" r="2" />
        <circle class="tip" cx="82" cy="86" r="2" />
      </svg>
    {:else if id === 'squid'}
      <svg viewBox="0 0 320 90">
        <g class="arms">
          <path d="M120 44C90 40 60 30 2 34" />
          <path d="M120 46C90 48 50 58 8 52" />
          <path d="M120 42C96 30 70 20 30 14" />
          <path d="M120 48C96 60 70 74 26 78" />
          <path d="M120 45C80 44 40 44 0 44" />
        </g>
        <path class="squid-mantle" d="M112 45c4-12 18-18 40-20 50-4 110 2 140 14l24-12-6 18 6 18-24-12c-30 12-90 18-140 14-22-2-36-8-40-20z" />
        <circle class="eye" cx="132" cy="41" r="4" />
      </svg>
    {:else if id === 'dumbo'}
      <svg viewBox="0 0 110 96">
        <ellipse class="ear" cx="22" cy="34" rx="14" ry="8" transform="rotate(-30 22 34)" />
        <ellipse class="ear right" cx="88" cy="34" rx="14" ry="8" transform="rotate(30 88 34)" />
        <path class="dumbo-body" d="M24 52C24 22 86 22 86 52c0 12-8 20-18 24l4 14-12-9-5 12-5-12-6 12-5-12-12 9 4-14C32 72 24 64 24 52z" />
        <circle class="eye dark" cx="44" cy="50" r="3" />
        <circle class="eye dark" cx="66" cy="50" r="3" />
      </svg>
    {:else if id === 'snailfish'}
      <svg viewBox="0 0 120 44">
        <path class="snail-body" d="M6 22C6 10 20 4 34 8c16 4 40 8 60 10 8 1 18 2 24 4-6 2-16 3-24 4-20 2-44 6-60 10C20 40 6 34 6 22z" />
        <circle class="eye dark" cx="18" cy="18" r="1.6" />
      </svg>
    {:else if id === 'amphipod'}
      <svg viewBox="0 0 96 50">
        <path class="amph-body" d="M8 28C14 12 44 6 66 12c12 4 20 12 20 20-10-6-30-8-50-6-12 2-22 4-28 2z" />
        <path class="legs" d="M30 30l-4 12M40 30l-2 13M50 30v13M60 30l2 12M70 30l4 10M12 22C6 14 4 8 6 4M16 20c-2-8 0-14 4-16" />
        <circle class="eye dark" cx="18" cy="22" r="2" />
      </svg>
    {/if}
  </div>
</div>

<style lang="scss">
  .creature {
    position: absolute;
    left: 0;
    top: calc(var(--pos) * 100%);
    pointer-events: none;
    will-change: transform;
    animation: swim calc(var(--dur, 4.6s) / var(--speed, 1)) linear forwards;
  }

  .flip {
    animation-name: swim-right;
    .body {
      transform: scaleX(-1);
    }
  }

  .rise {
    top: auto;
    bottom: 0;
    left: calc(var(--pos) * 100%);
    animation-name: rise;
  }

  // 먼 배경층: 흐리고 작고 느리게
  .far {
    --speed: 0.7;
    opacity: 0.5;
    filter: blur(1.5px);
    z-index: -1;
  }

  .body {
    width: calc(var(--w) * var(--k));
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
  }

  .school {
    --w: min(56vw, 260px);
    --dur: 4.2s;
    .fish {
      fill: rgba(8, 48, 72, 0.5);
      animation: wiggle 0.5s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 30% 50%;
    }
  }
  .tropical {
    --w: min(46vw, 210px);
    --dur: 4s;
    .fish {
      animation: wiggle 0.45s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 30% 50%;
    }
    .t-y { fill: #ffd84d; }
    .t-b { fill: #4fb6ff; }
    .t-o { fill: #ff8a4c; }
    .stripe {
      fill: none;
      stroke: rgba(255, 255, 255, 0.85);
      stroke-width: 1.4;
    }
    .t-eye {
      fill: #1b2333;
    }
  }
  .dolphin {
    --w: min(48vw, 220px);
    --dur: 4.6s;
    .dolphin-body,
    .dolphin-fin {
      fill: #5f86a8;
    }
    .dolphin-belly {
      fill: #cfe3ef;
    }
    .eye {
      fill: #142233;
    }
    // .body 는 flip(scaleX) 이 쓰므로 안쪽 그림에 출렁임을 준다
    svg {
      animation: porpoise 1.6s ease-in-out infinite;
    }
  }
  .turtle {
    --w: min(34vw, 150px);
    --dur: 7s;
    .shell {
      fill: rgba(30, 92, 84, 0.75);
    }
    .head,
    .limb {
      fill: rgba(44, 112, 100, 0.7);
    }
    .limb {
      animation: paddle 1.4s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 100% 50%;
    }
    .pattern {
      fill: none;
      stroke: rgba(170, 230, 210, 0.35);
      stroke-width: 1.2;
    }
    .eye {
      fill: rgba(0, 20, 20, 0.8);
    }
  }
  .ray {
    --w: min(46vw, 210px);
    --dur: 6s;
    .wing {
      fill: rgba(10, 40, 70, 0.55);
      animation: flap 1.8s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }
    .horn {
      fill: none;
      stroke: rgba(10, 40, 70, 0.55);
      stroke-width: 3;
      stroke-linecap: round;
    }
  }
  .whale {
    --w: min(140vw, 600px);
    --dur: 12s;
    .whale-body {
      fill: rgba(16, 52, 82, 0.78);
    }
    .whale-belly {
      fill: rgba(170, 210, 230, 0.32);
    }
    .whale-fin {
      fill: rgba(28, 72, 104, 0.8);
    }
    .grooves {
      fill: none;
      stroke: rgba(200, 230, 245, 0.22);
      stroke-width: 1.2;
    }
    .bumps circle {
      fill: rgba(170, 210, 230, 0.35);
    }
    .eye {
      fill: rgba(0, 10, 20, 0.7);
    }
    .tail {
      animation: fluke 3.2s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 0% 50%;
    }
    .fin {
      animation: fin 3.2s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 0% 0%;
    }
  }
  .sperm {
    --w: min(120vw, 520px);
    --dur: 11s;
    .sperm-body {
      fill: rgba(62, 70, 92, 0.9);
      stroke: rgba(170, 195, 235, 0.45);
      stroke-width: 1.2;
    }
    .jaw,
    .wrinkle {
      fill: none;
      stroke: rgba(170, 195, 235, 0.3);
      stroke-width: 1.2;
    }
    .eye {
      fill: rgba(200, 220, 255, 0.25);
    }
    .tail {
      animation: fluke 3.6s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 0% 50%;
    }
  }

  .jelly {
    --w: min(20vw, 84px);
    --dur: 5.2s;
    .bell {
      fill: rgba(150, 210, 255, 0.16);
      stroke: rgba(170, 230, 255, 0.55);
      stroke-width: 1.2;
      filter: drop-shadow(0 0 6px rgba(127, 246, 228, 0.55));
      animation: pulse 1.4s ease-in-out infinite;
      transform-origin: 50% 80%;
      transform-box: fill-box;
    }
    .tentacles path {
      fill: none;
      stroke: rgba(170, 230, 255, 0.4);
      stroke-width: 1;
    }
  }
  .lantern {
    --w: min(40vw, 170px);
    --dur: 4.4s;
    .fish {
      fill: rgba(10, 24, 50, 0.7);
    }
    .dot {
      fill: #8fd8ff;
      filter: drop-shadow(0 0 3px #8fd8ff);
      animation: blink 1.3s ease-in-out infinite;
    }
  }
  .siphon {
    --w: min(9vw, 40px);
    --dur: 6.5s;
    .stem {
      fill: none;
      stroke: rgba(180, 160, 255, 0.35);
      stroke-width: 1;
    }
    .bead {
      fill: rgba(200, 170, 255, 0.85);
      filter: drop-shadow(0 0 4px rgba(190, 150, 255, 0.9));
      animation: blink 1.6s ease-in-out infinite;
    }
  }

  .angler {
    --w: min(44vw, 200px);
    --dur: 5.6s;
    .angler-body {
      fill: rgba(2, 4, 12, 0.92);
      stroke: rgba(90, 130, 170, 0.22);
      stroke-width: 0.8;
    }
    .teeth {
      fill: none;
      stroke: rgba(220, 230, 240, 0.4);
      stroke-width: 0.8;
    }
    .stalk {
      fill: none;
      stroke: rgba(90, 130, 170, 0.35);
      stroke-width: 1;
    }
    .lure {
      fill: var(--biolume);
      filter: drop-shadow(0 0 4px var(--biolume)) drop-shadow(0 0 12px var(--biolume));
      animation: blink 1.6s ease-in-out infinite;
    }
    .glow-eye {
      fill: rgba(127, 246, 228, 0.25);
    }
  }
  .vampire {
    --w: min(24vw, 100px);
    --dur: 6s;
    .mantle,
    .fin {
      fill: rgba(60, 10, 26, 0.85);
      stroke: rgba(255, 120, 150, 0.18);
      stroke-width: 1;
    }
    .fin {
      animation: paddle 1.2s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 50% 100%;
    }
    .red-eye {
      fill: #ff4d6d;
      filter: drop-shadow(0 0 4px #ff4d6d);
    }
    .tip {
      fill: #7fb4ff;
      filter: drop-shadow(0 0 5px #7fb4ff);
      animation: blink 1.1s ease-in-out infinite;
    }
  }

  .squid {
    --w: min(150vw, 680px);
    --dur: 7s;
    .squid-mantle {
      fill: rgba(30, 10, 16, 0.85);
      stroke: rgba(160, 90, 110, 0.22);
      stroke-width: 1;
    }
    .arms path {
      fill: none;
      stroke: rgba(40, 14, 22, 0.85);
      stroke-width: 4;
      stroke-linecap: round;
    }
    .eye {
      fill: rgba(220, 230, 255, 0.18);
    }
  }
  .dumbo {
    --w: min(26vw, 110px);
    --dur: 8s;
    .dumbo-body,
    .ear {
      fill: rgba(255, 196, 206, 0.32);
      stroke: rgba(255, 210, 220, 0.55);
      stroke-width: 1;
    }
    .ear {
      animation: paddle 1.1s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 100% 50%;
      &.right {
        transform-origin: 0% 50%;
      }
    }
    .body {
      animation: bob 2.2s ease-in-out infinite;
    }
  }

  .snailfish {
    --w: min(46vw, 210px);
    --dur: 6.5s;
    .snail-body {
      fill: rgba(255, 214, 222, 0.14);
      stroke: rgba(255, 214, 222, 0.42);
      stroke-width: 0.8;
    }
  }
  .amphipod {
    --w: min(18vw, 80px);
    --dur: 5s;
    .amph-body {
      fill: rgba(240, 236, 228, 0.22);
      stroke: rgba(240, 236, 228, 0.5);
      stroke-width: 0.8;
    }
    .legs {
      fill: none;
      stroke: rgba(240, 236, 228, 0.4);
      stroke-width: 0.8;
    }
  }

  .eye.dark {
    fill: rgba(10, 6, 10, 0.75);
  }

  @keyframes swim {
    from {
      transform: translate3d(105vw, 0, 0);
    }
    to {
      transform: translate3d(-110%, -5vh, 0);
    }
  }
  @keyframes swim-right {
    from {
      transform: translate3d(-110%, 0, 0);
    }
    to {
      transform: translate3d(105vw, -5vh, 0);
    }
  }
  @keyframes rise {
    from {
      transform: translate3d(-50%, 100%, 0);
    }
    to {
      transform: translate3d(-30%, -120vh, 0);
    }
  }
  @keyframes porpoise {
    50% {
      transform: translateY(-14px) rotate(-4deg);
    }
  }
  @keyframes fluke {
    50% {
      transform: rotate(-9deg);
    }
  }
  @keyframes fin {
    50% {
      transform: rotate(6deg);
    }
  }
  @keyframes wiggle {
    to {
      transform: rotate(4deg) translateY(1px);
    }
  }
  @keyframes paddle {
    to {
      transform: rotate(14deg);
    }
  }
  @keyframes flap {
    50% {
      transform: scaleY(0.82);
    }
  }
  @keyframes pulse {
    50% {
      transform: scaleY(0.86) scaleX(1.06);
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.4;
    }
  }
  @keyframes bob {
    50% {
      transform: translateY(-6px);
    }
  }
</style>
