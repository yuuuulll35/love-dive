<!-- 착저 지점 바닥 풍경: 도착한 구간마다 다른 바닥 생물 -->
<script lang="ts">
  import type { ZoneId } from '$entities/abyss';

  interface Props {
    zone: ZoneId;
  }
  let { zone }: Props = $props();
</script>

<div class="life {zone}" aria-hidden="true">
  {#if zone === 'sunlight'}
    <!-- 산호·해초·불가사리 -->
    <svg class="i" style:--w="84px" viewBox="0 0 84 90"><path class="coral-a" d="M40 90V60c-12-4-18-14-18-26 0-6 4-8 6-4 2 8 6 14 12 16V30c0-8 8-8 8 0v20c6-2 10-8 12-16 2-4 6-2 6 4 0 12-6 22-18 26v26z" /></svg>
    <svg class="i sway" style:--w="40px" viewBox="0 0 40 110"><path class="grass" d="M8 110C2 80 12 50 6 10c8 30 4 60 10 100M20 110c-4-34 6-60 4-100 6 30 0 70 4 100M30 110c0-30 10-50 6-80 8 24 0 56 2 80" /></svg>
    <svg class="i" style:--w="34px" viewBox="0 0 40 40"><path class="star" d="M20 2l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z" /></svg>
    <!-- 말미잘과 흰동가리 -->
    <svg class="i" style:--w="76px" viewBox="0 0 80 80">
      <g class="anemone">
        {#each [-36, -22, -10, 2, 14, 26, 38] as a, i (i)}
          <path d="M40 74C40 56 {40 + a * 0.6} 40 {40 + a} 26" style:animation-delay="{-i * 0.2}s" />
        {/each}
      </g>
      <ellipse class="anemone-base" cx="40" cy="74" rx="20" ry="6" />
      <g class="clown">
        <path class="clown-body" d="M28 30c4-6 14-7 20-2l6-4-1 6 1 6-6-4c-6 5-16 4-20-2z" />
        <path class="clown-stripe" d="M33 25v10M42 25v10" />
        <circle class="clown-eye" cx="31" cy="29" r="1.1" />
      </g>
    </svg>
    <svg class="i" style:--w="70px" viewBox="0 0 70 60"><path class="coral-b" d="M6 60c0-20 6-30 14-30-4-10 2-20 10-16 4-10 16-8 16 2 10-2 16 8 12 16 8 4 8 18 4 28z" /><circle class="polyp" cx="22" cy="30" r="2" /><circle class="polyp" cx="38" cy="18" r="2" /><circle class="polyp" cx="52" cy="34" r="2" /></svg>
    <svg class="i sway" style:--w="34px" viewBox="0 0 40 100"><path class="grass" d="M10 100C4 70 14 40 8 6c8 30 4 60 10 94M26 100c-2-30 8-50 4-86 6 26 0 62 2 86" /></svg>
  {:else if zone === 'twilight'}
    <!-- 부채산호·해면 -->
    <svg class="i" style:--w="90px" viewBox="0 0 90 90"><path class="fan" d="M45 90V62M45 62C20 58 6 40 8 18M45 62c-10-14-14-32-10-52M45 62c4-20 12-38 26-50M45 62c18-4 32-18 38-38M30 50c-8-6-12-14-12-22M58 46c8-4 14-12 16-20" /></svg>
    <svg class="i" style:--w="46px" viewBox="0 0 46 70"><path class="sponge" d="M6 70V30C6 12 40 12 40 30v40z" /><ellipse class="sponge-hole" cx="23" cy="24" rx="9" ry="4" /></svg>
    <svg class="i" style:--w="60px" viewBox="0 0 60 60"><path class="fan" d="M30 60V40M30 40C14 36 6 24 8 10M30 40c-4-12-4-24 0-36M30 40c12-6 20-18 22-32" /></svg>
  {:else if zone === 'midnight'}
    <!-- 유리해면·바다나리 -->
    <svg class="i glowy" style:--w="40px" viewBox="0 0 40 110"><path class="glass" d="M14 110V40C14 20 26 20 26 40v70zM14 50h12M14 64h12M14 78h12M14 92h12" /></svg>
    <svg class="i sway" style:--w="56px" viewBox="0 0 56 110"><path class="lily-stem" d="M28 110V30" /><path class="lily" d="M28 30C14 22 6 8 8 2M28 30C20 18 18 8 22 2M28 30c4-12 10-22 18-28M28 30c10-6 20-10 26-10" /></svg>
    <svg class="i glowy" style:--w="30px" viewBox="0 0 30 80"><path class="glass" d="M10 80V30c0-14 10-14 10 0v50zM10 40h10M10 54h10M10 68h10" /></svg>
  {:else if zone === 'abyss'}
    <!-- 바다조름(끝이 빛남)·해삼 -->
    <svg class="i sway" style:--w="30px" viewBox="0 0 30 110"><path class="pen" d="M15 110V20" /><path class="pen-leaf" d="M15 20c-10 4-12 14-10 24 4-6 8-10 10-10 2 0 6 4 10 10 2-10 0-20-10-24z" /><circle class="tip-glow" cx="15" cy="18" r="3" /></svg>
    <svg class="i" style:--w="78px" viewBox="0 0 80 30"><path class="cucumber" d="M4 24C6 12 24 6 44 8c18 2 30 8 32 16-20 4-52 6-72 0z" /><path class="papillae" d="M18 10l-2-6M30 8l-1-6M44 8V2M58 10l2-6" /></svg>
    <svg class="i sway" style:--w="24px" viewBox="0 0 30 90"><path class="pen" d="M15 90V18" /><path class="pen-leaf" d="M15 18c-8 4-10 12-8 20 3-5 6-8 8-8s5 3 8 8c2-8 0-16-8-20z" /><circle class="tip-glow" cx="15" cy="16" r="2.5" /></svg>
  {:else if zone === 'hadal'}
    <!-- 해구 바위·제노피오포어 -->
    <svg class="i" style:--w="110px" viewBox="0 0 110 60"><path class="rock" d="M4 60l8-30 20-14 18 6 22-18 16 16 12 6 6 34z" /></svg>
    <svg class="i" style:--w="40px" viewBox="0 0 40 30"><ellipse class="xeno" cx="20" cy="18" rx="16" ry="11" /><path class="xeno-line" d="M8 16c8-4 16-4 24 0M10 22c6-3 14-3 20 0" /></svg>
    <svg class="i" style:--w="80px" viewBox="0 0 80 50"><path class="rock" d="M2 50l6-22 18-10 14 8 18-20 18 20 2 24z" /></svg>
  {/if}
</div>

<style lang="scss">
  .life {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 21dvh;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    padding: 0 4%;
    pointer-events: none;
  }

  .i {
    display: block;
    width: var(--w);
    height: auto;
    overflow: visible;
  }

  .sway {
    animation: sway 4s ease-in-out infinite alternate;
    transform-origin: 50% 100%;
  }
  .sway:nth-of-type(odd) {
    animation-duration: 5.2s;
  }

  // 표층: 알록달록 귀엽게
  .coral-a {
    fill: #ff8fa3;
  }
  .coral-b {
    fill: #ffb37a;
  }
  .polyp {
    fill: #ffe3c4;
  }
  .grass {
    fill: none;
    stroke: #3fae8c;
    stroke-width: 4;
    stroke-linecap: round;
  }
  .star {
    fill: #ffcf5c;
  }
  .anemone path {
    fill: none;
    stroke: #ff9ec4;
    stroke-width: 5;
    stroke-linecap: round;
    animation: tentacle 2.4s ease-in-out infinite alternate;
    transform-origin: 50% 100%;
    transform-box: fill-box;
  }
  .anemone-base {
    fill: #e9799f;
  }
  .clown {
    animation: hover 3s ease-in-out infinite;
  }
  .clown-body {
    fill: #ff8a3d;
  }
  .clown-stripe {
    stroke: #fff;
    stroke-width: 2.2;
  }
  .clown-eye {
    fill: #1b2333;
  }

  // 박광층: 보랏빛 부채산호·해면
  .fan {
    fill: none;
    stroke: rgba(176, 140, 230, 0.7);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .sponge {
    fill: rgba(120, 150, 200, 0.55);
  }
  .sponge-hole {
    fill: rgba(10, 30, 60, 0.6);
  }

  // 점심해: 반투명 유리해면, 바다나리
  .glass {
    fill: rgba(200, 230, 255, 0.12);
    stroke: rgba(200, 230, 255, 0.45);
    stroke-width: 1.2;
  }
  .glowy {
    filter: drop-shadow(0 0 6px rgba(150, 210, 255, 0.35));
  }
  .lily-stem,
  .lily {
    fill: none;
    stroke: rgba(230, 180, 200, 0.55);
    stroke-width: 2;
    stroke-linecap: round;
  }

  // 심해저: 끝이 빛나는 바다조름, 해삼
  .pen {
    stroke: rgba(255, 190, 170, 0.45);
    stroke-width: 2;
  }
  .pen-leaf {
    fill: rgba(255, 170, 150, 0.4);
  }
  .tip-glow {
    fill: #ffc7a8;
    filter: drop-shadow(0 0 6px #ffb08a);
    animation: blink 2s ease-in-out infinite;
  }
  .cucumber {
    fill: rgba(220, 120, 140, 0.45);
  }
  .papillae {
    stroke: rgba(220, 120, 140, 0.45);
    stroke-width: 2;
    stroke-linecap: round;
  }

  // 초심해: 바위, 제노피오포어
  .rock {
    fill: rgba(30, 30, 40, 0.9);
    stroke: rgba(180, 190, 210, 0.12);
    stroke-width: 1;
  }
  .xeno {
    fill: rgba(200, 190, 170, 0.2);
  }
  .xeno-line {
    fill: none;
    stroke: rgba(200, 190, 170, 0.3);
    stroke-width: 1;
  }

  @keyframes tentacle {
    to {
      transform: rotate(8deg);
    }
  }
  @keyframes hover {
    50% {
      transform: translate(8px, -4px);
    }
  }
  @keyframes sway {
    from {
      transform: rotate(-4deg);
    }
    to {
      transform: rotate(4deg);
    }
  }
  @keyframes blink {
    50% {
      opacity: 0.4;
    }
  }
</style>
