<!-- 두 사람의 사랑의 무게: 이유 문장 · 상세 항목 · 칭호·온도 근거 -->
<script lang="ts">
  import { explain, type MeasureResult } from '$entities/abyss';
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

</script>

<section class="analysis {mood.tier}" data-tier={mood.tier} style:--rad="{mood.radius}px" aria-labelledby="why-title">
  <h3 id="why-title">두 사람의 사랑의 무게</h3>

  <div class="reasons">
    {#each ex.reasons as line, i (i)}<p>{line}</p>{/each}
  </div>

  <!-- 무게 분해 -->
  {#if topPulls.length}
    <div class="block">
      <h4>상세 항목</h4>
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
      <p class="hint">끌어내린 힘 전체를 100%로 봤을 때 각 요소의 몫이에요. 시너지는 두 축이 함께 높을 때만 생겨요.</p>
    </div>
  {/if}

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
    display: grid;
    gap: 22px;
    width: 100%;
    max-width: 380px;
    margin: 0 auto;
    padding: 22px;
    border-radius: var(--rad);
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-sans);
    box-shadow: 0 20px 50px -24px rgba(0, 0, 0, 0.5);
  }

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: var(--title-w);
    letter-spacing: var(--title-ls);
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
