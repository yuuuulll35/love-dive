<script lang="ts">
  import Button from '$shared/ui/Button.svelte';
  import { QUESTIONS, answersToCode } from './questions';

  interface Props {
    oncomplete: (code: string) => void;
  }
  let { oncomplete }: Props = $props();

  type Stage = 'intro' | 'running' | 'done';
  let stage = $state<Stage>('intro');
  let index = $state(0);
  let answers = $state<number[]>([]);
  let code = $state('');
  let locked = $state(false);

  const total = QUESTIONS.length;
  const current = $derived(QUESTIONS[index]);
  const pad = (n: number) => String(n).padStart(2, '0');

  /** 위에서부터: 그렇다 쪽이 위. tone 은 색, size 는 기포 크기(강도) */
  const OPTIONS = [
    { value: 4, label: '매우 그렇다', tone: 'yes', size: 16 },
    { value: 3, label: '그렇다', tone: 'yes', size: 11 },
    { value: 2, label: '보통이다', tone: 'mid', size: 7 },
    { value: 1, label: '아니다', tone: 'no', size: 11 },
    { value: 0, label: '전혀 아니다', tone: 'no', size: 16 },
  ] as const;

  function start() {
    answers = [];
    index = 0;
    code = '';
    stage = 'running';
  }

  function choose(v: number) {
    if (locked) return;
    answers[index] = v;
    locked = true;
    // 고른 칸이 차오르는 걸 잠깐 보여준 뒤 다음 문장
    setTimeout(() => {
      locked = false;
      if (index < total - 1) index++;
      else finish();
    }, 320);
  }

  function back() {
    if (index > 0 && !locked) index--;
  }

  function finish() {
    code = answersToCode(answers);
    stage = 'done';
    oncomplete(code);
  }

  function onkey(e: KeyboardEvent) {
    if (stage !== 'running') return;
    if ((e.target as HTMLElement)?.closest?.('input, textarea, select')) return;
    const n = Number(e.key);
    if (n >= 1 && n <= OPTIONS.length) choose(OPTIONS[n - 1].value);
    else if (e.key === 'Backspace' || e.key === 'ArrowLeft') back();
  }
</script>

<svelte:window onkeydown={onkey} />

{#if stage === 'intro'}
  <div class="intro">
    <p>두 사람을 떠올리며, 각 문장이 얼마나 가까운지 고르세요.</p>
    <dl class="facts">
      <div><dt class="mono">24</dt><dd>문장</dd></div>
      <div><dt class="mono">3</dt><dd>분</dd></div>
      <div><dt class="mono">5</dt><dd>단계 응답</dd></div>
    </dl>
    <Button variant="ghost" block onclick={start}>
      테스트 시작하기
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </Button>
  </div>
{:else if stage === 'running'}
  <div class="run">
    <!-- 진행도: 측심줄을 따라 하트 추가 이동 -->
    <div
      class="line"
      role="progressbar"
      aria-label="진행도"
      aria-valuemin="1"
      aria-valuemax={total}
      aria-valuenow={index + 1}
      style:--p={index / (total - 1)}
    >
      <span class="thread"></span>
      <span class="filled"></span>
      {#each QUESTIONS as _, i (i)}
        <span class="tick" class:done={i < index} class:answered={answers[i] !== undefined} style:left="{(i / (total - 1)) * 100}%"></span>
      {/each}
      <svg class="heart" viewBox="0 0 20 18" aria-hidden="true">
        <path d="M10 17C5 13.6 1 10.2 1 6.2 1 3.3 3.2 1 6 1c1.7 0 3.1.8 4 2.1C10.9 1.8 12.3 1 14 1c2.8 0 5 2.3 5 5.2 0 4-4 7.4-9 10.8z" />
      </svg>
    </div>

    <div class="head mono">
      <span class="qno">Q.{pad(index + 1)}</span>
      <span class="count">{pad(index + 1)} <i>/</i> {total}</span>
    </div>

    {#key index}
      <div class="q">
        <p class="statement">{current.text}</p>

        <div class="options" role="radiogroup" aria-label={current.text}>
          {#each OPTIONS as o, k (o.value)}
            {@const on = answers[index] === o.value}
            <button
              type="button"
              role="radio"
              aria-checked={on}
              class="opt {o.tone}"
              class:on
              style:--i={k}
              onclick={() => choose(o.value)}
            >
              <span class="bubble" style:--s="{o.size}px" aria-hidden="true"></span>
              <span class="label">{o.label}</span>
              <kbd class="mono" aria-hidden="true">{k + 1}</kbd>
            </button>
          {/each}
        </div>
      </div>
    {/key}

    <div class="foot">
      <button type="button" class="back" onclick={back} disabled={index === 0}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M7.5 2.5L4 6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        이전
      </button>
      <span class="hint">키보드 1–5로도 고를 수 있어요</span>
    </div>
  </div>
{:else}
  <div class="done">
    <span class="badge" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 22 22"><path d="M5 11.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </span>
    <p class="title">측정 준비 완료</p>
    <p class="sub">결과값을 아래 칸에 넣어 두었어요.</p>
    <code class="chip mono">{code}</code>
    <Button variant="quiet" size="sm" onclick={start}>처음부터 다시 하기</Button>
  </div>
{/if}

<style lang="scss">
  .intro {
    display: grid;
    gap: 16px;

    p {
      margin: 0;
      font-size: 14px;
      color: var(--ink-dim);
      text-wrap: pretty;
    }
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--well, rgba(2, 10, 24, 0.3));

    div {
      display: grid;
      justify-items: center;
      gap: 2px;
      padding: 14px 4px 12px;
      & + div {
        border-left: 1px solid var(--line);
      }
    }
    dt {
      font-size: 26px;
      font-weight: 500;
      line-height: 1;
      color: var(--ink);
    }
    dd {
      margin: 0;
      font-size: 12px;
      color: var(--ink-faint);
    }
  }

  .run {
    display: grid;
    gap: 14px;
  }

  .line {
    position: relative;
    height: 22px;
    margin: 0 8px;

    .thread,
    .filled {
      position: absolute;
      left: 0;
      top: 50%;
      height: 1.5px;
      transform: translateY(-50%);
    }
    .thread {
      right: 0;
      background: var(--line-strong);
    }
    .filled {
      width: calc(var(--p) * 100%);
      background: var(--thread);
      box-shadow: 0 0 8px rgba(255, 77, 109, 0.6);
      transition: width 0.45s var(--ease-out);
    }
  }

  .tick {
    position: absolute;
    top: 50%;
    width: 1px;
    height: 6px;
    transform: translate(-50%, -50%);
    background: var(--ink-faint);
    &.answered {
      background: rgba(255, 77, 109, 0.55);
    }
    &.done {
      height: 8px;
      background: var(--thread);
    }
  }

  .heart {
    position: absolute;
    top: 50%;
    left: calc(var(--p) * 100%);
    width: 18px;
    height: 16px;
    transform: translate(-50%, -50%);
    fill: var(--heart-fill, #3c4556);
    stroke: var(--thread);
    stroke-width: 1.5;
    filter: drop-shadow(0 0 6px rgba(255, 77, 109, 0.55));
    transition: left 0.45s var(--ease-out);
  }

  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 4px;

    .qno {
      font-size: 13px;
      letter-spacing: 0.14em;
      color: var(--biolume);
    }
    .count {
      font-size: 12px;
      color: var(--ink-faint);
      i {
        font-style: normal;
        opacity: 0.5;
      }
    }
  }

  .q {
    display: grid;
    gap: 18px;
  }

  .statement {
    margin: 0;
    min-height: 3.2em;
    font-size: clamp(19px, 5.4vw, 22px);
    line-height: 1.55;
    letter-spacing: -0.01em;
    text-wrap: balance;
    animation: rise 0.5s var(--ease-out) both;
  }

  .options {
    display: grid;
    gap: 8px;
  }

  .opt {
    --c: var(--ink-dim);
    --c-soft: var(--tint, rgba(255, 255, 255, 0.06));
    position: relative;
    display: grid;
    grid-template-columns: 28px 1fr auto;
    align-items: center;
    gap: 10px;
    min-height: 50px;
    padding: 0 14px 0 10px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: var(--well, rgba(2, 10, 24, 0.28));
    text-align: left;
    overflow: hidden;
    animation: rise 0.45s var(--ease-out) both;
    animation-delay: calc(60ms + var(--i) * 35ms);
    transition:
      border-color 0.2s,
      background 0.2s,
      transform 0.15s var(--ease-out);

    &.yes {
      --c: #ff6f88;
      --c-soft: rgba(255, 77, 109, 0.16);
    }
    &.no {
      --c: var(--biolume);
      --c-soft: rgba(127, 246, 228, 0.12);
    }

    // 선택 시 왼쪽에서 물이 차오르듯 채워짐
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--c-soft);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.32s var(--ease-out);
    }

    @media (hover: hover) {
      &:hover {
        border-color: var(--c);
      }
    }
    &:active {
      transform: scale(0.985);
    }
    &.on {
      border-color: var(--c);
      &::before {
        transform: scaleX(1);
      }
      .bubble {
        background: var(--c);
        box-shadow: 0 0 0 4px var(--c-soft), 0 0 14px var(--c);
      }
      .label {
        color: var(--ink);
      }
    }

    > * {
      position: relative;
    }
  }

  .bubble {
    justify-self: center;
    width: var(--s);
    height: var(--s);
    border-radius: 50%;
    border: 1.5px solid var(--c);
    background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), transparent 55%);
    transition:
      background 0.2s,
      box-shadow 0.2s;
  }

  .label {
    font-size: 15px;
    font-weight: 500;
    color: var(--ink-dim);
    transition: color 0.2s;
  }

  kbd {
    font-size: 11px;
    color: var(--ink-faint);
    opacity: 0;
    @media (hover: hover) {
      opacity: 0.8;
    }
  }

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 32px;

    .hint {
      font-size: 11.5px;
      color: var(--ink-faint);
      display: none;
      @media (hover: hover) {
        display: inline;
      }
    }
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 2px;
    border: 0;
    background: none;
    font-size: 13px;
    color: var(--ink-dim);
    &:disabled {
      visibility: hidden;
    }
  }

  .done {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 6px 0 2px;
    text-align: center;

    .badge {
      display: grid;
      place-items: center;
      width: 46px;
      height: 46px;
      margin-bottom: 6px;
      border-radius: 50%;
      color: #fff;
      background: var(--biolume);
      box-shadow: 0 0 0 6px rgba(127, 246, 228, 0.14), 0 0 30px rgba(127, 246, 228, 0.45);
      animation: pop 0.5s var(--ease-out);
    }
    .title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
    .sub {
      margin: 0;
      font-size: 13.5px;
      color: var(--ink-dim);
    }
    .chip {
      margin: 8px 0 4px;
      padding: 8px 14px;
      border-radius: 10px;
      border: 1px dashed var(--line-strong);
      background: var(--well, rgba(1, 6, 16, 0.5));
      font-size: 14px;
      letter-spacing: 0.08em;
      color: var(--ink);
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @keyframes pop {
    from {
      transform: scale(0.4);
      opacity: 0;
    }
  }
</style>
