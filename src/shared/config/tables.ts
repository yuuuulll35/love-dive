import { payload } from 'virtual:abyss-tables';

export type AxisKey =
  | 'ruin' | 'tru' | 'tmp' | 'obs'
  | 'tab' | 'den' | 'dep' | 'irr'
  | 'one' | 'lack' | 'clo' | 'sac';

export type WeightAxis = 'obs' | 'dep' | 'clo' | 'ruin' | 'irr' | 'den' | 'lack' | 'sac';

export interface AbyssTables {
  /** 슬롯 순서 → 축 */
  slotAxes: readonly AxisKey[];
  /** 슬롯별 index(0~9) → 문자 */
  slotTables: readonly string[];
  weights: Readonly<Record<WeightAxis, number>>;
  coef: Readonly<{
    oneObs: number; oneDen: number; tabIrr: number;
    interObsDep: number; interCloRuin: number; interLackSac: number;
    buoy: number; buoyClo: number; k: number; maxDepth: number;
  }>;
  /** x → 수심 보정 기준점 [x, m] (오름차순) */
  calibration: readonly (readonly [number, number])[];
  noiseCharset: string;
  exampleCode: string;
}

function decodePayload(encoded: string): unknown {
  const seed = parseInt(encoded.slice(0, 7), 36);
  const bin = atob(encoded.slice(7).split('').reverse().join(''));
  const n = bin.length;
  const bytes = new Uint8Array(n);
  let x = seed >>> 0 || 0x9e3779b9;
  for (let i = 0; i < n; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    bytes[i] = bin.charCodeAt(n - 1 - i) ^ (x & 0xff);
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

let cache: AbyssTables | null = null;

export function getTables(): AbyssTables {
  if (cache) return cache;
  const d = decodePayload(payload) as {
    a: AxisKey[]; t: string[]; w: AbyssTables['weights']; c: AbyssTables['coef']; q: [number, number][]; n: string; e: string;
  };
  cache = Object.freeze({
    slotAxes: Object.freeze(d.a),
    slotTables: Object.freeze(d.t),
    weights: Object.freeze(d.w),
    coef: Object.freeze(d.c),
    calibration: Object.freeze(d.q),
    noiseCharset: d.n,
    exampleCode: d.e,
  });
  return cache;
}
