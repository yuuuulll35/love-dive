import { getTables, type WeightAxis } from '$shared/config/tables';
import { clamp } from '$shared/lib/math';
import type { Scores } from './types';

const WEIGHT_AXES: readonly WeightAxis[] = ['obs', 'dep', 'clo', 'ruin', 'irr', 'den', 'lack', 'sac'];

export interface DepthBreakdown {
  base: number;
  inter: number;
  buoy: number;
  rawMax: number;
  /** 0~1 정규화 값 */
  x: number;
  /** 지터 적용 전 수심 (m) */
  depth: number;
}

/** base + inter (부력 제외). 4-1 ~ 4-3 */
function weightSum(s: Scores) {
  const { weights, coef } = getTables();
  const a = (k: keyof Scores) => s[k] / 9;

  const w: Record<WeightAxis, number> = { ...weights };
  w.obs = weights.obs * (1 + coef.oneObs * s.one);
  w.den = weights.den * (1 - coef.oneDen * s.one);

  let base = 0;
  for (const k of WEIGHT_AXES) base += w[k] * a(k);
  base += weights.irr * a('irr') * (coef.tabIrr * s.tab);

  const inter =
    coef.interObsDep * a('obs') * a('dep') +
    coef.interCloRuin * a('clo') * a('ruin') +
    coef.interLackSac * a('lack') * a('sac');

  return { base, inter };
}

let rawMaxCache: number | null = null;

/** 무게축 전부 9, one=9, tab=9 일 때의 base + inter (≈ 13.091) */
export function rawMax(): number {
  if (rawMaxCache !== null) return rawMaxCache;
  const s = { tru: 0, tmp: 0, one: 9, tab: 9 } as Scores;
  for (const k of WEIGHT_AXES) s[k] = 9;
  const { base, inter } = weightSum(s);
  return (rawMaxCache = base + inter);
}

/** x → 수심. depth = MAX × (e^(k·x) − 1) / (e^k − 1) */
export function mapDepth(x: number): number {
  const { coef } = getTables();
  return (coef.maxDepth * (Math.exp(coef.k * x) - 1)) / (Math.exp(coef.k) - 1);
}

export function computeDepth(s: Scores): DepthBreakdown {
  const { coef } = getTables();
  const { base, inter } = weightSum(s);
  const buoy = coef.buoy * (s.tru / 9) * (1 - s.clo / coef.buoyClo);
  const max = rawMax();
  const x = clamp((base + inter - buoy) / max, 0, 1);
  return { base, inter, buoy, rawMax: max, x, depth: mapDepth(x) };
}

/** 지터 적용 + 상한 (4-6) */
export function applyJitter(depth: number, jitter: number): number {
  return Math.min(depth * (1 + jitter), getTables().coef.maxDepth);
}

/** 4-7 측정 불가: obs = dep = clo = irr = 9 ∧ tru ≤ 1 */
export function isUnmeasurable(s: Scores): boolean {
  return s.obs === 9 && s.dep === 9 && s.clo === 9 && s.irr === 9 && s.tru <= 1;
}

export const FLOAT_THRESHOLD = 5;
