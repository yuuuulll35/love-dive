import { DEFAULT_TITLE_LINES, PASSAGE_LINES, TEMP_LINES, ZONE_LINES } from '$shared/config/copy';
import { getTables } from '$shared/config/tables';
import { fnv1a32 } from '$shared/lib/hash';
import { toAtm } from '$shared/lib/format';
import { mulberry32, pick } from '$shared/lib/random';
import { matchArchetype } from './archetype';
import { applyJitter, computeDepth, FLOAT_THRESHOLD, isUnmeasurable } from './depth';
import { normalizePair, pairJitter } from './pair';
import { temperatureOf, type Temperature } from './temperature';
import type { Scores } from './types';
import { VOID_ZONE, ZONES, zoneOf, type Zone, type ZoneId } from './zones';

export type MeasureKind = 'normal' | 'float' | 'void';

export interface MeasureResult {
  kind: MeasureKind;
  scores: Scores;
  pair: string;
  /** 지터·상한 적용된 최종 수심 (m). void 는 maxDepth */
  depth: number;
  x: number;
  jitter: number;
  atm: number;
  zone: Zone;
  title: string;
  titleLine: string;
  archetypeId: string | null;
  temperature: Temperature;
  /** 결과 해설 2~3줄 */
  lines: string[];
  /** 침강 중 통과하는 구간별 문구 */
  passages: Partial<Record<ZoneId, string>>;
}

export function measure(scores: Scores, pairRaw = ''): MeasureResult {
  const { coef, slotAxes } = getTables();
  const pair = pairRaw.trim();
  const jitter = pairJitter(pair);
  const temperature = temperatureOf(scores.tmp);
  const seed = fnv1a32(normalizePair(pair) + '|' + slotAxes.map((k) => scores[k]).join(''));
  const rand = mulberry32(seed);

  const { x, depth: rawDepth } = computeDepth(scores);
  let kind: MeasureKind = 'normal';
  let depth = applyJitter(rawDepth, jitter);
  let zone: Zone;

  if (isUnmeasurable(scores)) {
    kind = 'void';
    depth = coef.maxDepth;
    zone = VOID_ZONE;
  } else if (depth < FLOAT_THRESHOLD) {
    kind = 'float';
    zone = ZONES[0];
  } else {
    zone = zoneOf(depth);
  }

  const arch = kind === 'normal' ? matchArchetype(scores) : null;
  const title = arch?.title ?? zone.defaultTitle;
  const titleLine = arch?.line ?? DEFAULT_TITLE_LINES[zone.id];

  const lines = [titleLine + '.', pick(rand, TEMP_LINES[temperature.id]), pick(rand, ZONE_LINES[zone.id])];

  const passages: MeasureResult['passages'] = {};
  for (const z of ZONES) {
    const pool = PASSAGE_LINES[z.id];
    if (pool) passages[z.id] = pick(rand, pool);
  }

  return {
    kind, scores, pair, depth, x, jitter,
    atm: toAtm(depth),
    zone, title, titleLine,
    archetypeId: arch?.id ?? null,
    temperature, lines, passages,
  };
}
