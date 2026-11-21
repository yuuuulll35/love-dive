<!-- 우측 수심 게이지: 로그 스케일 레일 + 구간 눈금 + 현재 위치 -->
<script lang="ts">
  import { ZONES } from '$entities/abyss';

  interface Props {
    depth: number;
  }
  let { depth }: Props = $props();
  const max = 10935;

  const pos = (d: number) => Math.log1p(Math.max(0, d)) / Math.log1p(max);
  const ticks = [
    { d: 0, label: '0' },
    ...ZONES.slice(2).map((z) => ({ d: z.from, label: z.from >= 1000 ? `${z.from / 1000}K` : String(z.from) })),
    { d: max, label: '10.9K' },
  ];
  const zoneBands = ZONES.slice(1).map((z) => ({ id: z.id, from: pos(z.from), to: pos(Math.min(z.to, max)) }));
  const p = $derived(Math.min(1.08, pos(depth)));
</script>

<div class="gauge" aria-hidden="true">
  <div class="rail">
    {#each zoneBands as b (b.id)}
      <span class="band {b.id}" style:top="{b.from * 100}%" style:height="{(b.to - b.from) * 100}%"></span>
    {/each}
    <span class="fill" style:height="{Math.min(1, p) * 100}%"></span>
    {#each ticks as t (t.d)}
      <span class="tick mono" style:top="{pos(t.d) * 100}%">{t.label}</span>
    {/each}
    <span class="marker" style:top="{p * 100}%"></span>
  </div>
</div>

<style lang="scss">
  .gauge {
    position: absolute;
    right: 14px;
    top: max(150px, 20vh);
    bottom: max(110px, 18vh);
    width: 40px;
    pointer-events: none;
  }

  .rail {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.08);
  }

  .band {
    position: absolute;
    left: 0;
    width: 100%;
    opacity: 0.35;
    &.sunlight { background: #40c4ce; }
    &.twilight { background: #1c6aa8; }
    &.midnight { background: #24357a; }
    &.abyss { background: #3a2b62; }
    &.hadal { background: #4a1f3c; }
  }

  .fill {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: linear-gradient(to bottom, rgba(255, 77, 109, 0.2), var(--thread));
    border-radius: 2px;
  }

  .tick {
    position: absolute;
    right: 9px;
    transform: translateY(-50%);
    font-size: 9.5px;
    color: var(--ink-faint);
    white-space: nowrap;
    line-height: 1;

    &::after {
      content: '';
      position: absolute;
      right: -9px;
      top: 50%;
      width: 6px;
      height: 1px;
      background: var(--ink-faint);
    }
  }

  .marker {
    position: absolute;
    left: 50%;
    width: 11px;
    height: 11px;
    transform: translate(-50%, -50%) rotate(45deg);
    background: var(--thread);
    box-shadow: 0 0 0 3px rgba(255, 77, 109, 0.25), 0 0 14px rgba(255, 77, 109, 0.8);
  }
</style>
