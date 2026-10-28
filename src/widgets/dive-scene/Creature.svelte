<!-- 구간 생물 실루엣. 모두 머리가 왼쪽 → 오른쪽에서 왼쪽으로 스쳐 간다 -->
<script lang="ts">
  import type { CreatureId } from '$entities/abyss';

  interface Props {
    id: CreatureId;
    onend?: () => void;
  }
  let { id, onend }: Props = $props();

  // 물고기 떼 배치 (x, y, scale)
  const school = [
    [0, 30, 1], [28, 14, 0.85], [34, 44, 0.9], [62, 26, 1.05], [70, 56, 0.8],
    [96, 10, 0.75], [100, 38, 0.95], [128, 24, 0.85], [134, 52, 0.7], [160, 34, 0.8],
  ] as const;
  const fish = 'M0 8C5 2 15 1 22 6l7-4-2 6 2 6-7-4C15 15 5 14 0 8z';
</script>

<div class="creature {id}" onanimationend={(e) => e.target === e.currentTarget && onend?.()} aria-hidden="true">
  {#if id === 'school'}
    <svg viewBox="-4 0 196 72" class="body">
      {#each school as [x, y, s], i (i)}
        <path d={fish} transform="translate({x} {y}) scale({s})" style:animation-delay="{-i * 0.13}s" />
      {/each}
    </svg>
  {:else if id === 'jelly'}
    <svg viewBox="0 0 60 110" class="body">
      <path class="bell" d="M6 26C6 10 18 2 30 2s24 8 24 24c-3 3-8 4-12 2-3 3-8 3-12 0-4 3-9 3-12 0-4 2-9 1-12-2z" />
      <g class="tentacles">
        <path d="M14 28c-3 14 5 22 0 36s4 22 0 36" />
        <path d="M24 30c3 14-4 24 0 38s-3 20 0 32" />
        <path d="M36 30c-3 14 4 24 0 38s3 22 0 34" />
        <path d="M46 28c3 14-5 22 0 36s-4 22 0 30" />
      </g>
    </svg>
  {:else if id === 'angler'}
    <svg viewBox="0 0 110 70" class="body">
      <path class="stalk" d="M36 20C30 6 16 2 8 8" />
      <circle class="lure" cx="7" cy="10" r="3.2" />
      <path
        class="fish"
        d="M14 38C14 22 30 14 48 16c14 2 26 10 34 18l14-10-3 16 4 16-15-10c-9 10-22 16-38 14C26 59 14 52 14 38z"
      />
      <path class="teeth" d="M16 42l3 4 2-4 3 5 2-5 3 5 2-5 3 4" />
      <circle class="eye" cx="30" cy="30" r="2" />
    </svg>
  {:else if id === 'squid'}
    <svg viewBox="0 0 320 90" class="body">
      <g class="arms">
        <path d="M120 44C90 40 60 30 2 34" />
        <path d="M120 46C90 48 50 58 8 52" />
        <path d="M120 42C96 30 70 20 30 14" />
        <path d="M120 48C96 60 70 74 26 78" />
        <path d="M120 45C80 44 40 44 0 44" />
      </g>
      <path class="mantle" d="M112 45c4-12 18-18 40-20 50-4 110 2 140 14l24-12-6 18 6 18-24-12c-30 12-90 18-140 14-22-2-36-8-40-20z" />
      <circle class="eye" cx="132" cy="41" r="4" />
    </svg>
  {:else if id === 'snailfish'}
    <svg viewBox="0 0 120 44" class="body">
      <path class="fish" d="M6 22C6 10 20 4 34 8c16 4 40 8 60 10 8 1 18 2 24 4-6 2-16 3-24 4-20 2-44 6-60 10C20 40 6 34 6 22z" />
      <circle class="eye" cx="18" cy="18" r="1.6" />
    </svg>
  {/if}
</div>

<style lang="scss">
  .creature {
    position: absolute;
    pointer-events: none;
    will-change: transform;
  }

  .body {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  // 표층: 반짝이는 은빛 물고기 떼
  .school {
    top: 22%;
    width: min(56vw, 260px);
    animation: swim 3.4s linear forwards;

    path {
      fill: rgba(8, 48, 72, 0.55);
      animation: wiggle 0.5s ease-in-out infinite alternate;
      transform-box: fill-box;
      transform-origin: 30% 50%;
    }
  }

  // 박광층: 위로 떠오르는 해파리 (카메라가 내려가므로)
  .jelly {
    left: 14%;
    width: min(20vw, 84px);
    animation: rise 4.2s linear forwards;

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

  // 점심해: 초롱아귀 — 몸은 거의 안 보이고 등불만 빛난다
  .angler {
    top: 50%;
    width: min(44vw, 200px);
    animation: swim 4.6s linear forwards;

    .fish {
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
    .eye {
      fill: rgba(127, 246, 228, 0.25);
    }
  }

  // 심해저: 대왕오징어 — 화면을 가로지르는 거대한 그림자
  .squid {
    top: 30%;
    width: min(150vw, 680px);
    animation: swim-slow 5.2s linear forwards;

    .mantle {
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

  // 초심해: 꼼치 — 반투명한 분홍빛
  .snailfish {
    top: 58%;
    width: min(46vw, 210px);
    animation: swim-slow 5s linear forwards;

    .fish {
      fill: rgba(255, 214, 222, 0.14);
      stroke: rgba(255, 214, 222, 0.42);
      stroke-width: 0.8;
    }
    .eye {
      fill: rgba(20, 10, 14, 0.7);
    }
  }

  @keyframes swim {
    from {
      transform: translate3d(110vw, 0, 0);
    }
    to {
      transform: translate3d(-110%, -6vh, 0);
    }
  }
  @keyframes swim-slow {
    from {
      transform: translate3d(105vw, 0, 0);
    }
    to {
      transform: translate3d(-105%, 2vh, 0);
    }
  }
  @keyframes rise {
    from {
      transform: translate3d(0, 105vh, 0);
    }
    to {
      transform: translate3d(8vw, -40vh, 0);
    }
  }
  @keyframes wiggle {
    to {
      transform: rotate(4deg) translateY(1px);
    }
  }
  @keyframes pulse {
    50% {
      transform: scaleY(0.86) scaleX(1.06);
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.45;
    }
  }
</style>
