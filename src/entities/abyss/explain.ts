import { getTables, type AxisKey, type WeightAxis } from '$shared/config/tables';
import { rankAxes, ARCHETYPE_MIN_SCORE } from './archetype';
import type { MeasureResult } from './measure';
import type { Scores } from './types';

/** 축 이름·묶음·0/5/9 앵커 (OOC 프롬프트의 판정 기준과 같은 문장) */
export const AXIS_INFO: Record<AxisKey, { label: string; group: 'weight' | 'modifier' | 'buoy' | 'tone'; anchors: [string, string, string] }> = {
  obs: { label: '집착', group: 'weight', anchors: ['상대가 떠나도 괜찮음', '붙잡고 싶음', '놓아줄 수 없음, 통제하려 함'] },
  dep: { label: '의존', group: 'weight', anchors: ['혼자서도 온전함', '상대가 큰 지지대', '상대 없으면 무너짐'] },
  clo: { label: '폐쇄성', group: 'weight', anchors: ['각자의 세계가 넓음', '둘의 시간이 우선', '외부와 단절된 둘만의 세계'] },
  ruin: { label: '파멸성', group: 'weight', anchors: ['서로를 해치지 않음', '상처 주고받지만 회복함', '망가지는 걸 알면서 멈추지 않음'] },
  irr: { label: '비가역성', group: 'weight', anchors: ['언제든 되돌릴 수 있음', '무시 못 할 일이 있었음', '이미 돌아갈 수 없는 선을 넘음'] },
  den: { label: '농도', group: 'weight', anchors: ['담백함', '감정이 짙음', '한 장면마다 감정이 넘침'] },
  lack: { label: '결핍', group: 'weight', anchors: ['채울 공백 없음', '서로가 상처를 메워 줌', '상대가 유일한 구멍 메우개'] },
  sac: { label: '희생', group: 'weight', anchors: ['자신을 깎지 않음', '많은 걸 양보함', '자신을 버릴 각오'] },
  one: { label: '일방성', group: 'modifier', anchors: ['감정이 쌍방으로 대등', '한쪽이 더 기움', '완전한 일방'] },
  tab: { label: '금기', group: 'modifier', anchors: ['장애물 없음', '숨겨야 할 사정 있음', '관계 자체가 금지되거나 치명적 비밀'] },
  tru: { label: '신뢰', group: 'buoy', anchors: ['서로를 믿지 못함', '대체로 안심함', '의심 없는 안정감'] },
  tmp: { label: '온도', group: 'tone', anchors: ['차갑고 고요한 감정', '미지근함', '뜨겁고 격렬한 감정'] },
};

export const anchorFor = (axis: AxisKey, score: number) => AXIS_INFO[axis].anchors[score <= 2 ? 0 : score <= 6 ? 1 : 2];

export interface PullItem {
  kind: 'axis' | 'synergy' | 'taboo';
  label: string;
  /** 시너지 항목의 두 축 */
  pair?: [AxisKey, AxisKey];
  /** 끌어내린 힘 전체 중 비율 0~1 */
  share: number;
  value: number;
}

export interface Explanation {
  /** 끌어내린 힘 (큰 순) */
  pulls: PullItem[];
  /** 신뢰 부력이 끌어내린 힘을 덜어 낸 비율 0~1 */
  buoyShare: number;
  reasons: string[];
  titleReason: string;
  tempReason: string;
}

const WEIGHT_AXES: readonly WeightAxis[] = ['obs', 'dep', 'clo', 'ruin', 'irr', 'den', 'lack', 'sac'];

/** 받침 유무로 조사 고르기 (이/가, 과/와 …). 「집착(9)」처럼 괄호가 붙으면 괄호 앞 낱말 기준 */
function particle(word: string, withBatchim: string, without: string): string {
  const base = word.replace(/\([^)]*\)$/, '');
  const code = base.charCodeAt(base.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 && code % 28 !== 0;
  return has ? withBatchim : without;
}
const josa = (word: string, withBatchim: string, without: string) => word + particle(word, withBatchim, without);

const L = (k: AxisKey) => AXIS_INFO[k].label;
const LS = (k: AxisKey, s: Scores) => `${L(k)}(${s[k]})`;

export function explain(result: MeasureResult): Explanation {
  const s = result.scores;
  const { weights, coef } = getTables();
  const a = (k: AxisKey) => s[k] / 9;

  // 4절 계산을 항목별로 쪼갠다
  const w: Record<WeightAxis, number> = { ...weights };
  w.obs = weights.obs * (1 + coef.oneObs * s.one);
  w.den = weights.den * (1 - coef.oneDen * s.one);

  const items: PullItem[] = WEIGHT_AXES.map((k) => ({ kind: 'axis' as const, label: L(k), value: w[k] * a(k), share: 0 }));
  items.push({ kind: 'taboo', label: '금기 × 비가역성', value: weights.irr * a('irr') * coef.tabIrr * s.tab, share: 0 });
  items.push(
    { kind: 'synergy', label: '집착 × 의존', pair: ['obs', 'dep'], value: coef.interObsDep * a('obs') * a('dep'), share: 0 },
    { kind: 'synergy', label: '폐쇄성 × 파멸성', pair: ['clo', 'ruin'], value: coef.interCloRuin * a('clo') * a('ruin'), share: 0 },
    { kind: 'synergy', label: '결핍 × 희생', pair: ['lack', 'sac'], value: coef.interLackSac * a('lack') * a('sac'), share: 0 },
  );
  const total = items.reduce((t, i) => t + i.value, 0);
  for (const i of items) i.share = total > 0 ? i.value / total : 0;
  const pulls = items.filter((i) => i.value > 0.001).sort((x, y) => y.value - x.value);

  const buoy = coef.buoy * a('tru') * (1 - s.clo / coef.buoyClo);
  const buoyShare = total > 0 ? Math.min(1, buoy / total) : buoy > 0 ? 1 : 0;

  // ── 이유 문장 ──
  const reasons: string[] = [];
  const topAxes = [...WEIGHT_AXES].sort((x, y) => w[y] * a(y) - w[x] * a(x)).filter((k) => s[k] > 0);

  if (result.kind === 'void') {
    reasons.push('집착·의존·폐쇄성·비가역성이 모두 끝까지 찼고, 신뢰는 바닥이었다. 이 조합은 측정 범위를 벗어난다.');
  } else if (topAxes.length === 0) {
    reasons.push('관계를 끌어내릴 무게가 거의 실리지 않았다.');
  } else {
    const [k1, k2, k3] = topAxes;
    reasons.push(`${josa(LS(k1, s), '이', '가')} 가장 큰 무게를 실었다.`);
    const next = [k2, k3].filter((k) => k && s[k] >= 3);
    if (next.length === 2) reasons.push(`그 뒤를 ${josa(LS(next[0], s), '과', '와')} ${josa(LS(next[1], s), '이', '가')} 이었다.`);
    else if (next.length === 1) reasons.push(`그 뒤를 ${josa(LS(next[0], s), '이', '가')} 이었다.`);
  }

  const syn = pulls.find((p) => p.kind === 'synergy' && p.share >= 0.07);
  if (syn?.pair && result.kind !== 'void') {
    const [x, y] = syn.pair;
    reasons.push(`${josa(L(x), '과', '와')} ${josa(L(y), '이', '가')} 함께 높아 서로의 무게를 키웠다. 둘 다 높을 때만 생기는 무게다.`);
  }
  if (s.one >= 6) reasons.push(`마음이 한쪽으로 기울어(일방성 ${s.one}) 집착은 더 무겁게, 농도는 더 가볍게 계산됐다.`);
  if (s.tab >= 6 && s.irr >= 4) reasons.push(`금기(${s.tab})가 이미 넘은 선(비가역성 ${s.irr})을 더 무겁게 만들었다.`);

  if (result.kind === 'float') {
    reasons.push(`신뢰(${s.tru})가 만든 부력이 끌어내리는 힘보다 커서 가라앉지 않았다.`);
  } else if (s.tru >= 6) {
    const weak = s.clo >= 6 ? ` 다만 폐쇄성(${s.clo})이 높아 부력이 약해졌다.` : '';
    reasons.push(`신뢰(${s.tru})가 부력이 되어 무게의 ${Math.round(buoyShare * 100)}%를 덜어 냈다.${weak}`);
  } else if (s.tru <= 2 && result.kind !== 'void') {
    reasons.push(`신뢰가 낮아(${s.tru}) 떠오르게 할 힘이 거의 없었다.`);
  }

  // ── 칭호 근거 ──
  let titleReason: string;
  if (result.kind === 'float') titleReason = `가라앉지 않은 관계에는 「${result.title}」${particle(result.title, '이', '가')} 붙는다.`;
  else if (result.kind === 'void') titleReason = `측정 범위를 벗어난 관계에는 「${result.title}」${particle(result.title, '이', '가')} 붙는다.`;
  else if (result.archetypeId) {
    const [r1, r2] = rankAxes(s);
    titleReason = `가장 두드러진 두 축이 ${josa(LS(r1.axis, s), '과', '와')} ${josa(LS(r2.axis, s), '이라서', '라서')} 「${result.title}」.`;
  } else {
    titleReason = `${ARCHETYPE_MIN_SCORE}점 이상으로 함께 두드러진 축 조합이 없어서, 이 깊이의 기본 칭호 「${result.title}」${particle(result.title, '이', '가')} 붙었다.`;
  }

  const tempReason = `온도 ${s.tmp}점 → ${result.temperature.label}. ${result.temperature.tone}.`;

  return { pulls, buoyShare, reasons, titleReason, tempReason };
}
