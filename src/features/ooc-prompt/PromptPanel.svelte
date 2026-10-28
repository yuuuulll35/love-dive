<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { copyText } from '$features/share-result/clipboard';
  import { BRACKETS, PLATFORMS, buildPrompt, type Bracket, type Platform } from './variants';

  let source = $state('');
  let loadError = $state(false);
  let platform = $state<Platform>('teapot');
  let bracket = $state<Bracket>('paren');
  let charName = $state('');
  let userName = $state('');
  let expanded = $state(false);
  let copied = $state(false);
  let timer: ReturnType<typeof setTimeout>;

  $effect(() => {
    fetch(`${import.meta.env.BASE_URL}ooc-prompt.md`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => (source = t))
      .catch(() => (loadError = true));
  });

  const text = $derived(source ? buildPrompt(source, { platform, bracket, charName, userName }) : '');

  async function copy() {
    if (!text) return;
    copied = await copyText(text);
    clearTimeout(timer);
    timer = setTimeout(() => (copied = false), 2200);
  }
</script>

<section class="panel" aria-labelledby="prompt-title">
  <header>
    <span class="step mono">01</span>
    <div>
      <h2 id="prompt-title">측정 프롬프트 복사</h2>
      <p>롤플레이 채팅에 그대로 붙여넣으면 AI가 측정 코드 한 줄을 돌려줍니다.</p>
    </div>
  </header>

  <div class="group" role="radiogroup" aria-label="플랫폼">
    {#each PLATFORMS as p (p.id)}
      <button
        type="button"
        role="radio"
        aria-checked={platform === p.id}
        class="seg"
        class:on={platform === p.id}
        onclick={() => (platform = p.id)}
      >
        <span>{p.label}</span>
        <small>{p.desc}</small>
      </button>
    {/each}
  </div>

  {#if platform === 'named'}
    <div class="names">
      <input bind:value={charName} placeholder="캐릭터 이름" aria-label="캐릭터 이름" maxlength="20" />
      <input bind:value={userName} placeholder="유저 이름" aria-label="유저 이름" maxlength="20" />
    </div>
  {/if}

  <div class="brackets" role="radiogroup" aria-label="OOC 괄호 표기">
    <span class="label">OOC 표기</span>
    {#each BRACKETS as b (b.id)}
      <button
        type="button"
        role="radio"
        aria-checked={bracket === b.id}
        class="chip mono"
        class:on={bracket === b.id}
        onclick={() => (bracket = b.id)}>{b.label}</button
      >
    {/each}
  </div>

  <div class="preview" class:expanded>
    {#if loadError}
      <p class="err">프롬프트를 불러오지 못했습니다. 새로고침해 주세요.</p>
    {:else}
      <pre>{text || '불러오는 중…'}</pre>
    {/if}
    <button type="button" class="more" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
      {expanded ? '접기' : '전체 보기'}
    </button>
  </div>

  <Button variant="ghost" block onclick={copy} disabled={!text}>
    {#if copied}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.8" /></svg>
      복사했습니다
    {:else}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.4" /><path d="M10.5 3.2V3a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3v5.5A1.5 1.5 0 0 0 3.5 10h.3" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>
      프롬프트 복사
    {/if}
  </Button>
  <p class="sr-only" aria-live="polite">{copied ? '프롬프트를 복사했습니다' : ''}</p>
</section>

<style lang="scss">
  .panel {
    display: grid;
    gap: 14px;
  }

  header {
    display: flex;
    gap: 14px;
    align-items: flex-start;

    h2 {
      margin: 0 0 2px;
      font-family: var(--font-serif);
      font-size: 19px;
      font-weight: 700;
    }
    p {
      margin: 0;
      color: var(--ink-dim);
      font-size: 13.5px;
    }
  }

  .step {
    flex: none;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    font-size: 12px;
    color: var(--biolume);
  }

  .group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 4px;
    border-radius: var(--radius-sm);
    background: rgba(2, 10, 24, 0.35);
    border: 1px solid var(--line);
  }

  .seg {
    display: grid;
    gap: 1px;
    padding: 8px 4px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink-dim);
    text-align: center;
    transition:
      background 0.2s,
      color 0.2s;

    span {
      font-size: 13.5px;
      font-weight: 600;
    }
    small {
      font-size: 10.5px;
      opacity: 0.7;
      line-height: 1.3;
    }
    &.on {
      background: rgba(255, 255, 255, 0.12);
      color: var(--ink);
    }
  }

  .names {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    input {
      min-width: 0;
      min-height: 44px;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--line-strong);
      background: rgba(2, 10, 24, 0.38);
      font-size: 16px;
      &:focus {
        outline: none;
        border-color: var(--biolume);
      }
    }
  }

  .brackets {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;

    .label {
      font-size: 12px;
      color: var(--ink-faint);
      margin-right: 4px;
    }
  }

  .chip {
    min-height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: transparent;
    font-size: 12px;
    color: var(--ink-dim);
    &.on {
      border-color: var(--biolume);
      color: var(--biolume);
      background: rgba(127, 246, 228, 0.08);
    }
  }

  .preview {
    position: relative;
    border-radius: var(--radius-sm);
    border: 1px solid var(--line);
    background: rgba(1, 6, 16, 0.5);
    overflow: hidden;

    pre {
      margin: 0;
      padding: 14px 14px 40px;
      max-height: 168px;
      overflow: hidden;
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.65;
      color: var(--ink-dim);
      white-space: pre-wrap;
      word-break: break-all;
    }

    &::after {
      content: '';
      position: absolute;
      inset: auto 0 0;
      height: 72px;
      background: linear-gradient(to bottom, transparent, rgba(1, 8, 20, 0.95));
      pointer-events: none;
    }

    &.expanded {
      pre {
        max-height: none;
      }
      &::after {
        height: 40px;
      }
    }
  }

  .more {
    position: absolute;
    z-index: 1;
    left: 50%;
    bottom: 8px;
    transform: translateX(-50%);
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(4, 14, 32, 0.8);
    font-size: 12px;
    color: var(--ink-dim);
  }

  .err {
    margin: 0;
    padding: 16px;
    color: var(--danger);
    font-size: 13px;
  }
</style>
