<!-- 물음표 버튼 → 클릭/탭으로 여닫는 툴팁. 바깥 클릭·Esc 로 닫힘 -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    children: Snippet;
  }
  let { label, children }: Props = $props();

  let open = $state(false);
  let root: HTMLElement;
  const uid = $props.id();

  function onDocClick(e: MouseEvent) {
    if (open && !root.contains(e.target as Node)) open = false;
  }
</script>

<svelte:document onclick={onDocClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<span class="tip" bind:this={root}>
  <button
    type="button"
    class="q"
    aria-label={label}
    aria-expanded={open}
    aria-controls="tip-{uid}"
    onclick={() => (open = !open)}>?</button
  >
  {#if open}
    <div class="pop" id="tip-{uid}" role="tooltip">
      {@render children()}
    </div>
  {/if}
</span>

<style lang="scss">
  .tip {
    position: relative;
    display: inline-flex;
  }

  .q {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    background: var(--well, rgba(255, 255, 255, 0.05));
    color: var(--ink-dim);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1;
    transition:
      border-color 0.2s,
      color 0.2s;

    &[aria-expanded='true'],
    &:hover {
      border-color: var(--biolume);
      color: var(--biolume);
    }
  }

  .pop {
    position: absolute;
    z-index: 30;
    top: calc(100% + 10px);
    right: -8px;
    width: min(300px, calc(100vw - 48px));
    padding: 14px 16px;
    border-radius: var(--radius);
    border: 1px solid var(--line-strong);
    background: var(--pop-bg, rgba(4, 14, 32, 0.96));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 20px 50px -16px rgba(0, 0, 0, 0.45);
    animation: pop 0.18s var(--ease-out);

    &::before {
      content: '';
      position: absolute;
      top: -6px;
      right: 16px;
      width: 10px;
      height: 10px;
      transform: rotate(45deg);
      background: inherit;
      border-left: 1px solid var(--line-strong);
      border-top: 1px solid var(--line-strong);
    }
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
  }
</style>
