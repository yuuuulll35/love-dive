<!-- 두 사람의 사랑의 무게: 이유 문장 · 상세 항목(12축 점수 | 무게 분해) · 칭호·온도 근거 -->
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

  // 상세 항목 탭: 12축 점수 / 무게 분해
  let tab = $state<'pull' | 'axes'>('axes');
  const ROLE = { weight: '무게', modifier: '증폭', buoy: '부력', tone: '온도' } as const;
  // OOC 코드와 같은 순서 (S1~S12)
  const axes = $derived(
    getTables().slotAxes.map((k) => ({
      key: k,
      ...AXIS_INFO[k],
      score: result.scores[k],
      now: anchorFor(k, result.scores[k]),
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
        <button type="button" role="tab" aria-selected={tab === 'axes'} class:on={tab === 'axes'} onclick={() => (tab = 'axes')}>12축 점수</button>
        <button type="button" role="tab" aria-selected={tab === 'pull'} class:on={tab === 'pull'} onclick={() => (tab = 'pull')}>무게 분해</button>
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
      <ol class="axes">
        {#each axes as a (a.key)}
          <li class={a.group}>
            <div class="row">
              <span class="name">{a.label}<em>{ROLE[a.group]}</em></span>
              <span class="dots" aria-hidden="true">
                {#each Array(9) as _, i (i)}<i class:on={i < a.score}></i>{/each}
              </span>
              <span class="val"><b>{a.score}</b>/9</span>
            </div>
            <p class="desc">{a.desc} · <span class="now">{a.now}</span></p>
          </li>
        {/each}
      </ol>
      <p class="hint">무게 축은 깊이를 끌어내리고, 금기·일방성은 무게를 키우고, 신뢰는 떠오르게 해요. 온도는 깊이 대신 분위기를 정해요.</p>
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
      line-height: 1.7;
      color: var(--ink-2);
      text-wrap: pretty;
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

  // ── 12축 점수 ──
  .axes {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;

    .row {
      display: grid;
      grid-template-columns: 6.4em 1fr auto;
      align-items: center;
      gap: 10px;
    }
    .name {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13.5px;
      font-weight: 700;
      white-space: nowrap;

      em {
        font-style: normal;
        font-size: 10px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        background: var(--chip);
        color: var(--accent);
      }
    }
    .buoy .name em {
      color: var(--buoy);
    }
    // 가는 네모 칸 9개가 이어진 직선 눈금
    .dots {
      display: flex;
      gap: 2px;

      i {
        flex: 1;
        height: 4px;
        background: var(--rule);
      }
      i.on {
        background: var(--accent);
      }
    }
    .buoy .dots i.on {
      background: var(--buoy);
    }
    .tone .dots i.on {
      background: var(--accent-temp, var(--ink-2));
    }
    .val {
      font-size: 12px;
      color: var(--ink-3);
      font-variant-numeric: tabular-nums;
      b {
        font-size: 14px;
        color: var(--ink);
      }
    }
    .desc {
      margin: 3px 0 0;
      font-size: 12.5px;
      line-height: 1.55;
      color: var(--ink-3);
    }
    .now {
      color: var(--ink-2);
      font-weight: 600;
    }
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
