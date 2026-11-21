<!-- 종이 카드 네 모서리의 반짝이 별. 부모는 position: relative -->
<script lang="ts">
  interface Props {
    /** 모서리에서 떨어진 거리(px) */
    inset?: number;
    size?: number;
  }
  let { inset = 9, size = 11 }: Props = $props();
  const STAR = 'M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z';
</script>

{#each ['tl', 'tr', 'bl', 'br'] as c (c)}
  <svg class="corner {c}" style:--o="{inset}px" style:width="{size}px" viewBox="0 0 24 24" aria-hidden="true">
    <path d={STAR} />
  </svg>
{/each}

<style>
  .corner {
    position: absolute;
    z-index: 1;
    fill: var(--frame-ink, currentColor);
    pointer-events: none;
  }
  .tl { top: var(--o); left: var(--o); }
  .tr { top: var(--o); right: var(--o); }
  .bl { bottom: var(--o); left: var(--o); }
  .br { bottom: var(--o); right: var(--o); }
</style>
