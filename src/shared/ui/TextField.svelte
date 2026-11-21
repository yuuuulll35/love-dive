<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label: string;
    hint?: string;
    invalid?: boolean;
    value?: string;
    mono?: boolean;
  }

  let { label, hint, invalid = false, value = $bindable(''), mono = false, id, ...rest }: Props = $props();
  const uid = $props.id();
  const inputId = $derived(id ?? `f-${uid}`);
</script>

<div class="field" class:invalid>
  <label for={inputId}>{label}</label>
  <input id={inputId} class:mono bind:value aria-invalid={invalid || undefined} aria-describedby={hint ? `${inputId}-hint` : undefined} {...rest} />
  {#if hint}<p class="hint" id="{inputId}-hint">{hint}</p>{/if}
</div>

<style lang="scss">
  .field {
    display: grid;
    gap: 6px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--ink-dim);
    letter-spacing: 0.02em;
  }

  input {
    width: 100%;
    min-height: 52px;
    padding: 0 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line-strong);
    background: var(--well, rgba(2, 10, 24, 0.38));
    font-size: 16px; // iOS 줌 방지
    transition:
      border-color 0.2s,
      background 0.2s,
      box-shadow 0.2s;

    &::placeholder {
      color: var(--ink-faint);
    }
    &:focus {
      outline: none;
      border-color: var(--biolume);
      background: var(--well-focus, rgba(2, 10, 24, 0.55));
      box-shadow: 0 0 0 4px rgba(127, 246, 228, 0.12);
    }
  }

  .mono {
    font-family: var(--font-mono);
    letter-spacing: 0.08em;
    text-transform: uppercase;

    // 작은 폰(≤360px)에서도 ABYSS-XXXX-XXXX-XXXX-XX 한 줄이 다 보이게
    @media (max-width: 360px) {
      padding: 0 12px;
      letter-spacing: 0;
      font-size: 14px;
    }

    &::placeholder {
      letter-spacing: 0.06em;
    }
  }

  .invalid input {
    border-color: var(--danger);
  }

  .hint {
    margin: 0;
    font-size: 12.5px;
    color: var(--ink-faint);
  }
</style>
