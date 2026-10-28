import type { AxisKey, Scores } from './types';

export type ArchetypeAxis = 'obs' | 'dep' | 'clo' | 'ruin' | 'irr' | 'den' | 'lack' | 'sac' | 'tab' | 'tru';

/**
 * 동점 시 우선순위 (가중치 높은 축 우선).
 * 금기·신뢰는 가중치가 없으므로: 금기는 증폭 대상인 비가역성(1.1) 바로 뒤, 신뢰는 부력축이라 맨 뒤.
 */
export const TIE_ORDER: readonly ArchetypeAxis[] = ['obs', 'dep', 'clo', 'ruin', 'irr', 'tab', 'den', 'lack', 'sac', 'tru'];

/** 칭호가 붙으려면 상위 2개 축이 모두 이 점수 이상이어야 한다 (4 = '근거 부족' 기본값) */
export const ARCHETYPE_MIN_SCORE = 5;

export interface Archetype {
  id: string;
  axes: readonly [ArchetypeAxis, ArchetypeAxis];
  title: string;
  line: string;
}

/** 6-1. 위에서부터 우선순위 */
export const ARCHETYPES: readonly Archetype[] = [
  { id: 'maelstrom', axes: ['obs', 'ruin'], title: '소용돌이', line: '끌어당기는 힘이 곧 부수는 힘이다' },
  { id: 'wreck', axes: ['irr', 'tab'], title: '침몰선', line: '이미 가라앉은 것은 다시 떠오르지 않는다' },
  { id: 'anchor', axes: ['sac', 'dep'], title: '닻', line: '서로를 붙잡은 채 함께 내려간다' },
  { id: 'airless', axes: ['clo', 'den'], title: '기포 없는 방', line: '숨 쉴 공기는 서로에게만 있다' },
  { id: 'lantern', axes: ['lack', 'tru'], title: '심해어의 등불', line: '어둠 속에서 서로를 위해 켜둔 빛' },
  { id: 'trench', axes: ['obs', 'dep'], title: '해구', line: '끝없이 서로에게로 떨어진다' },
  { id: 'implosion', axes: ['clo', 'ruin'], title: '압궤', line: '둘만의 세계가 둘을 짓누른다' },
  { id: 'coral', axes: ['lack', 'sac'], title: '산호 무덤', line: '메우려 할수록 자신이 깎여 나간다' },
];

/** 점수 내림차순, 동점은 TIE_ORDER */
export function rankAxes(s: Scores): { axis: ArchetypeAxis; score: number }[] {
  return TIE_ORDER.map((axis) => ({ axis, score: s[axis as AxisKey] })).sort(
    (a, b) => b.score - a.score || TIE_ORDER.indexOf(a.axis) - TIE_ORDER.indexOf(b.axis),
  );
}

const samePair = (p: readonly [string, string], a: string, b: string) =>
  (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a);

/**
 * 상위 2개 축 조합으로 칭호 매칭. 2위 자리에 동점이 여럿이면 가능한 조합을 모두 후보로 두고
 * 표의 우선순위가 높은 칭호를 고른다. 매칭이 없으면 null (→ 구간 기본 칭호).
 */
export function matchArchetype(s: Scores): Archetype | null {
  const ranked = rankAxes(s);
  const [first, second] = ranked;
  if (second.score < ARCHETYPE_MIN_SCORE) return null;

  let pairs: [string, string][];
  if (first.score > second.score) {
    pairs = ranked.filter((r) => r.score === second.score).map((r) => [first.axis, r.axis]);
  } else {
    const tied = ranked.filter((r) => r.score === first.score).map((r) => r.axis);
    pairs = tied.flatMap((a, i) => tied.slice(i + 1).map((b) => [a, b] as [string, string]));
  }

  for (const arch of ARCHETYPES) {
    if (pairs.some(([a, b]) => samePair(arch.axes, a, b))) return arch;
  }
  return null;
}
