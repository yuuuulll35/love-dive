<!-- 두 사람의 사랑의 무게: 이유 문장 · 상세 항목(항목별 점수 | 무게 비율) · 칭호·온도 근거 -->
<script lang="ts">
  import Corners from '$shared/ui/Corners.svelte';
  import { explain, AXIS_INFO, anchorFor, type MeasureResult } from '$entities/abyss';
  import { getTables } from '$shared/config/tables';
  import { depthMood } from './mood';

  interface Props {
    result: MeasureResult;
  }
  let { result }: Props = $props();

  const mood = $derived(depthMood(result));
  const ex = $derived(explain(result));
  const topPulls = $derived(ex.pulls.slice(0, 6));
  const maxShare = $derived(Math.max(0.01, ...topPulls.map((p) => p.share), ex.buoyShare));
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  // 상세 항목 탭: 항목별 점수 / 무게 비율
  let tab = $state<'pull' | 'axes'>('axes');
  // 하는 일별로 묶어 보여 준다. 묶음 안에서는 점수 높은 순
  const GROUPS = [
    { id: 'weight', title: '가라앉히는 마음' },
    { id: 'modifier', title: '무게를 키우는 것' },
    { id: 'rest', title: '떠오르는 힘과 분위기' },
  ] as const;
  const axes = $derived(
    getTables().slotAxes.map((k) => ({
      key: k,
      ...AXIS_INFO[k],
      score: result.scores[k],
      now: anchorFor(k, result.scores[k]),
    })),
  );
  const groups = $derived(
    GROUPS.map((g) => ({
      ...g,
      items: axes
        .filter((a) => (g.id === 'rest' ? a.group === 'buoy' || a.group === 'tone' : a.group === g.id))
        .sort((a, b) => (g.id === 'rest' ? 0 : b.score - a.score)),
    })),
  );

</script>

<section class="analysis {mood.tier}" data-tier={mood.tier} style:--rad="{mood.radius}px" aria-labelledby="why-title">
  <Corners />
  <h3 id="why-title">두 사람의 사랑의 무게</h3>

  <div class="reasons">
    {#each ex.reasons as line, i (i)}<p>{line}</p>{/each}
  </div>

  <!-- 상세 항목: 12축 점수 / 무게 분해 -->
  <div class="block">
    <div class="head">
      <h4>상세 항목</h4>
      <div class="tabs" role="tablist" aria-label="상세 항목 보기">
        <button type="button" role="tab" aria-selected={tab === 'axes'} class:on={tab === 'axes'} onclick={() => (tab = 'axes')}>항목별 점수</button>
        <button type="button" role="tab" aria-selected={tab === 'pull'} class:on={tab === 'pull'} onclick={() => (tab = 'pull')}>무게 비율</button>
      </div>
    </div>

    {#if tab === 'pull'}
      {#if topPulls.length}
        <ul class="pulls">
          {#each topPulls as p (p.label)}
            <li class={p.kind}>
              <span class="name">
                {p.label}
                {#if p.kind === 'synergy'}<em>시너지</em>{:else if p.kind === 'taboo'}<em>증폭</em>{/if}
              </span>
              <span class="track"><span class="fill" style:width="{(p.share / maxShare) * 100}%"></span></span>
              <span class="val">{pct(p.share)}</span>
            </li>
          {/each}
          {#if ex.buoyShare >= 0.01}
            <li class="buoy">
              <span class="name">신뢰 부력</span>
              <span class="track"><span class="fill" style:width="{(ex.buoyShare / maxShare) * 100}%"></span></span>
              <span class="val">−{pct(ex.buoyShare)}</span>
            </li>
          {/if}
        </ul>
      {/if}
      <p class="hint">끌어내린 힘 전체를 100%로 봤을 때 각 요소의 몫이에요. 시너지는 두 축이 함께 높을 때만 생겨요.</p>
    {:else}
      {#each groups as g (g.id)}
        <div class="group {g.id}">
          <p class="gtitle"><span aria-hidden="true">✦</span>{g.title}</p>
          <ul class="tiles">
            {#each g.items as a (a.key)}
              <li class={a.group} class:strong={a.score >= 7}>
                <div class="top">
                  <span class="name">{a.label}</span>
                  <span class="val">{a.score}</span>
                </div>
                <span class="meaning">{a.desc}</span>
                <span class="dots" aria-hidden="true">
                  {#each Array(9) as _, i (i)}<i class:on={i < a.score}></i>{/each}
                </span>
                <p class="now">{a.now}</p>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
      <p class="hint">점수는 0~9예요. 높을수록 그 성향이 강하고, 신뢰가 높으면 덜 가라앉아요.</p>
    {/if}
  </div>

  <!-- 칭호·온도 근거 -->
  <dl class="why">
    <div>
      <dt>칭호</dt>
      <dd>{ex.titleReason}</dd>
    </div>
    <div>
      <dt>온도</dt>
      <dd>{ex.tempReason}</dd>
    </div>
  </dl>

</section>

<style lang="scss">
  .analysis {
    --frame-ink: var(--frame);
    position: relative;
    display: grid;
    gap: 22px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    padding: 24px 22px;
    border: 1.5px solid var(--frame);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-sans);
    // 결과 카드와 같은 종이·두 겹 선
    box-shadow:
      inset 0 0 0 3px var(--paper),
      inset 0 0 0 4px var(--frame-soft),
      0 20px 50px -24px rgba(0, 0, 0, 0.5);
  }

  h3 {
    margin: 0;
    font-family: var(--font-kserif);
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-align: center;

    // 양옆 가는 선과 마름모
    display: flex;
    align-items: center;
    gap: 10px;
    &::before,
    &::after {
      content: '';
      flex: 1;
      border-top: 1px solid var(--frame-soft);
    }
  }

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
  }

  .reasons {
    display: grid;
    gap: 6px;
    margin-top: -10px;

    p {
      margin: 0;
      font-size: 14.5px;
      line-height: 1.75;
      color: var(--ink-2);
      text-wrap: pretty;
    }
    // 첫 문장은 이 관계의 한 줄 요약
    p:first-child {
      font-family: var(--font-kserif);
      font-size: 16px;
      font-weight: 700;
      color: var(--ink);
    }
  }

  .block {
    padding-top: 18px;
    border-top: 1px solid var(--rule);

    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 14px;
      h4 {
        margin: 0;
      }
    }
  }

  .tabs {
    display: flex;
    gap: 2px;
    padding: 3px;
    border-radius: 999px;
    border: 1px solid var(--rule);

    button {
      padding: 4px 11px;
      border: 0;
      border-radius: 999px;
      background: none;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ink-3);
      transition: background 0.2s, color 0.2s;

      &.on {
        background: var(--frame);
        color: var(--paper);
      }
    }
  }

  // ── 항목별 점수: 하는 일별 묶음 + 작은 카드 ──
  .group + .group {
    margin-top: 16px;
  }
  .gtitle {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 8px;
    font-family: var(--font-kserif);
    font-size: 13.5px;
    font-weight: 700;
    color: var(--ink);

    span {
      font-size: 10px;
      color: var(--frame);
    }
    &::after {
      content: '';
      flex: 1;
      border-top: 1px solid var(--rule);
    }
  }

  .tiles {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: grid;
      gap: 4px;
      align-content: start;
      padding: 10px 11px 11px;
      border: 1px solid var(--rule);
      border-radius: 6px;
      background: var(--stat-bg);
    }
    li.strong {
      border-color: var(--frame-soft);
      box-shadow: inset 0 0 0 1px var(--frame-soft);
    }
    .top {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
    }
    .name {
      font-size: 14px;
      font-weight: 700;
    }
    .val {
      font-family: var(--font-serif);
      font-size: 22px;
      font-weight: 600;
      line-height: 1;
      font-variant-numeric: lining-nums;
      color: var(--ink-2);
    }
    .strong .val {
      color: var(--accent);
    }
    .meaning {
      font-size: 11.5px;
      color: var(--ink-2);
      opacity: 0.8;
    }
    .now {
      margin: 2px 0 0;
      font-size: 12.5px;
      line-height: 1.45;
      color: var(--ink);
      word-break: keep-all;
    }
  }
  // 가는 네모 칸 9개가 이어진 직선 눈금
  .dots {
    display: flex;
    gap: 2px;
    margin-top: 2px;

    i {
      flex: 1;
      height: 3px;
      background: var(--rule);
    }
    i.on {
      background: var(--accent);
    }
  }
  .buoy .dots i.on {
    background: var(--buoy);
  }
  .tiles li.buoy.strong .val {
    color: var(--buoy);
  }
  .tone .dots i.on {
    background: var(--accent-temp, var(--ink-2));
  }

  // ── 무게 분해 ──
  .pulls {
    display: grid;
    gap: 9px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 7.2em 1fr 3em;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
      font-weight: 600;
      white-space: nowrap;

      em {
        font-style: normal;
        font-size: 10.5px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--chip);
        color: var(--accent);
      }
    }
    .synergy .name,
    .taboo .name {
      font-size: 12.5px;
    }
    .track {
      height: 8px;
      border-radius: 999px;
      background: var(--rule);
      overflow: hidden;
    }
    .fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--accent);
    }
    .synergy .fill,
    .taboo .fill {
      background: repeating-linear-gradient(-45deg, var(--accent) 0 4px, transparent 4px 7px);
      box-shadow: inset 0 0 0 1px var(--accent);
    }
    .buoy {
      margin-top: 4px;
      .name,
      .val {
        color: var(--buoy);
      }
      .fill {
        background: var(--buoy);
      }
    }
    .val {
      text-align: right;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--ink-2);
    }
  }

  .hint {
    margin: 12px 0 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--ink-3);
  }

  // ── 칭호·온도 근거 ──
  .why {
    display: grid;
    gap: 10px;
    margin: 0;
    padding-top: 18px;
    border-top: 1px solid var(--rule);

    div {
      display: grid;
      grid-template-columns: 3em 1fr;
      gap: 10px;
    }
    dt {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ink-3);
      padding-top: 2px;
    }
    dd {
      margin: 0;
      font-size: 14px;
      line-height: 1.65;
      color: var(--ink-2);
    }
  }

</style>
