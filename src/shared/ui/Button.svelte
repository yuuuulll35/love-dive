<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'ghost' | 'quiet';
    size?: 'md' | 'sm';
    block?: boolean;
    children: Snippet;
  }

  let { variant = 'ghost', size = 'md', block = false, children, class: cls = '', ...rest }: Props = $props();
</script>

<button class="btn {variant} {size} {cls}" class:block {...rest}>
  {@render children()}
</button>

<style lang="scss">
  .btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 20px;
    border-radius: 999px;
    border: 1px solid var(--line-strong);
    background: transparent;
    font-weight: 500;
    letter-spacing: 0.01em;
    transition:
      background 0.2s,
      border-color 0.2s,
      transform 0.15s var(--ease-out),
      opacity 0.2s;
    -webkit-user-select: none;
    user-select: none;

    &:active:not(:disabled) {
      transform: scale(0.97);
    }
    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  .block {
    width: 100%;
  }

  .sm {
    min-height: 40px;
    padding: 0 14px;
    font-size: 14px;
  }

  .primary {
    border-color: transparent;
    color: #fff;
    background: linear-gradient(180deg, #ff5c79, #e8395b);
    box-shadow:
      0 10px 30px -10px rgba(255, 77, 109, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    font-weight: 600;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: linear-gradient(180deg, #ff6d87, #f0466a);
      }
    }
  }

  .ghost {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--ink-faint);
      }
    }
  }

  .quiet {
    border-color: transparent;
    color: var(--ink-dim);
    padding: 0 10px;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        color: var(--ink);
      }
    }
  }
</style>
