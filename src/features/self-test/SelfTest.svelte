<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { QUESTIONS, SCALE_MAX, answersToCode } from './questions';

  interface Props {
    oncomplete: (code: string) => void;
  }
  let { oncomplete }: Props = $props();

  type Stage = 'intro' | 'running' | 'done';
  let stage = $state<Stage>('intro');
  let index = $state(0);
  let answers = $state<number[]>([]);
  let advancing = false;

  const total = QUESTIONS.length;
  const current = $derived(QUESTIONS[index]);
  const progress = $derived((answers.filter((a) => a !== undefined).length / total) * 100);
  const dots = Array.from({ length: SCALE_MAX + 1 }, (_, i) => i);
  const dotLabels = ['전혀 아니다', '아니다', '조금 아니다', '보통', '조금 그렇다', '그렇다', '매우 그렇다'];

  function start() {
    answers = [];
    index = 0;
    stage = 'running';
  }

  function choose(v: number) {
    if (advancing) return;
    answers[index] = v;
    advancing = true;
    // 선택한 점이 잠깐 보이도록 짧게 머문 뒤 다음 문항
    setTimeout(() => {
      advancing = false;
      if (index < total - 1) index++;
      else finish();
    }, 220);
  }

  function finish() {
    stage = 'done';
    oncomplete(answersToCode(answers));
  }

  function onkey(e: KeyboardEvent) {
    if (stage !== 'running') return;
    if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= 7) choose(n - 1);
    else if (e.key === 'Backspace' && index > 0) index--;
  }
</script>

<svelte:window onkeydown={onkey} />

{#if stage === 'intro'}
  <div class="intro">
    <p>두 사람을 떠올리며 {total}개의 문장에 얼마나 가까운지 고르세요. 3분이면 끝납니다.</p>
    <Button variant="ghost" block onclick={start}>테스트 시작</Button>
  </div>
{:else if stage === 'running'}
  <div class="run">
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={index + 1} aria-label="진행도">
      <span style:width="{progress}%"></span>
    </div>
    <div class="meta mono">
      <button type="button" class="back" onclick={() => index--} disabled={index === 0}>← 이전</button>
      <span>{index + 1} / {total}</span>
    </div>

    {#key index}
      <p class="statement serif">{current.text}</p>
    {/key}

    <fieldset class="scale">
      <legend class="sr-only">{current.text}</legend>
      {#each dots as v (v)}
        <button
          type="button"
          class="dot d{Math.abs(v - SCALE_MAX / 2)}"
          class:no={v < SCALE_MAX / 2}
          class:yes={v > SCALE_MAX / 2}
          class:on={answers[index] === v}
          aria-label={dotLabels[v]}
          aria-pressed={answers[index] === v}
          onclick={() => choose(v)}
        ></button>
      {/each}
    </fieldset>
    <div class="ends" aria-hidden="true"><span>아니다</span><span>그렇다</span></div>
  </div>
{:else}
  <div class="done">
    <p><strong>측정 코드가 아래 칸에 들어갔어요.</strong><br />페어 이름과 이미지를 넣고 측정해 보세요.</p>
    <Button variant="quiet" size="sm" onclick={start}>다시 하기</Button>
  </div>
{/if}

<style lang="scss">
  .intro,
  .done {
    display: grid;
    gap: 12px;

    p {
      margin: 0;
      font-size: 14px;
      color: var(--ink-dim);
    }
  }

  .done {
    justify-items: start;

    strong {
      color: var(--biolume);
      font-weight: 600;
    }
  }

  .run {
    display: grid;
    gap: 14px;
  }

  .progress {
    height: 3px;
    border-radius: 2px;
    background: var(--line);
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      background: var(--thread);
      transition: width 0.3s var(--ease-out);
    }
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: var(--ink-faint);
  }

  .back {
    padding: 4px 0;
    border: 0;
    background: none;
    font-size: 12px;
    color: var(--ink-dim);
    &:disabled {
      visibility: hidden;
    }
  }

  .statement {
    margin: 4px 0 6px;
    min-height: 3.4em;
    font-size: 19px;
    line-height: 1.6;
    text-wrap: balance;
    animation: in 0.35s var(--ease-out);
  }

  .scale {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 0;
    padding: 0 2px;
    border: 0;
  }

  .dot {
    --s: 26px;
    width: var(--s);
    height: var(--s);
    padding: 0;
    border-radius: 50%;
    border: 2px solid var(--ink-faint);
    background: transparent;
    transition:
      background 0.15s,
      border-color 0.15s,
      transform 0.15s var(--ease-out);

    &.d3 { --s: 42px; }
    &.d2 { --s: 36px; }
    &.d1 { --s: 30px; }

    &.no { border-color: rgba(127, 246, 228, 0.6); }
    &.yes { border-color: rgba(255, 77, 109, 0.75); }

    &:active { transform: scale(0.9); }
    @media (hover: hover) {
      &.no:hover { background: rgba(127, 246, 228, 0.15); }
      &.yes:hover { background: rgba(255, 77, 109, 0.18); }
    }
    &.on.no { background: var(--biolume); }
    &.on.yes { background: var(--thread); }
    &.on:not(.no):not(.yes) { background: var(--ink-dim); }
  }

  .ends {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--ink-faint);
  }

  @keyframes in {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
  }
</style>
