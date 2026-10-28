<!-- 측심추: 하트 모양 납추 + 위로 이어지는 붉은 실 -->
<script lang="ts">
  interface Props {
    /** 실을 위로 얼마나 길게 그릴지 (px) */
    thread?: number;
    glow?: boolean;
    size?: number;
  }
  let { thread = 2000, glow = false, size = 44 }: Props = $props();
  const uid = $props.id();
</script>

<div class="plummet" class:glow style:--size="{size}px" style:--thread="{thread}px" aria-hidden="true">
  <span class="thread"></span>
  <svg viewBox="0 0 44 54" width={size} height={size * (54 / 44)}>
    <defs>
      <linearGradient id="lead-{uid}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8a95a6" />
        <stop offset="0.45" stop-color="#4b5566" />
        <stop offset="1" stop-color="#1c222e" />
      </linearGradient>
      <radialGradient id="shine-{uid}" cx="0.32" cy="0.38" r="0.35">
        <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
        <stop offset="1" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <circle cx="22" cy="6" r="4" fill="none" stroke="#6f7a8c" stroke-width="2" />
    <path
      d="M22 50C11 43 3 35.5 3 26.5 3 19.6 8.3 14.5 14.6 14.5c3.4 0 6 1.6 7.4 4 1.4-2.4 4-4 7.4-4C35.7 14.5 41 19.6 41 26.5 41 35.5 33 43 22 50z"
      fill="url(#lead-{uid})"
      stroke="#0b0f17"
      stroke-width="1"
    />
    <path
      d="M22 50C11 43 3 35.5 3 26.5 3 19.6 8.3 14.5 14.6 14.5c3.4 0 6 1.6 7.4 4 1.4-2.4 4-4 7.4-4C35.7 14.5 41 19.6 41 26.5 41 35.5 33 43 22 50z"
      fill="url(#shine-{uid})"
    />
    <path d="M22 18.6v29" stroke="#0b0f17" stroke-opacity="0.35" stroke-width="0.8" />
  </svg>
</div>

<style lang="scss">
  .plummet {
    position: relative;
    width: var(--size);
    display: grid;
    justify-items: center;
    filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.35));

    svg {
      display: block;
      overflow: visible;
    }
  }

  .thread {
    position: absolute;
    left: 50%;
    bottom: calc(100% - var(--size) * 0.12);
    width: 1.5px;
    height: var(--thread);
    transform: translateX(-50%);
    background: linear-gradient(to top, var(--thread), rgba(255, 77, 109, 0.85) 60%, rgba(255, 77, 109, 0.35));
    box-shadow: 0 0 6px rgba(255, 77, 109, 0.5);
  }

  .glow svg {
    filter: drop-shadow(0 0 10px rgba(255, 77, 109, 0.55));
  }
</style>
