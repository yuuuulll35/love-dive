import { decodeCode } from './codec';
import { explain } from './explain';
import { measure } from './measure';
import type { Scores } from './types';

const scores = (s: Partial<Scores>): Scores => ({
  ruin: 4, tru: 4, tmp: 4, obs: 4, tab: 4, den: 4, dep: 4, irr: 4, one: 4, lack: 4, clo: 4, sac: 4, ...s,
});

describe('결과 해설', () => {
  it('기준 벡터: 집착이 가장 크고 집착×의존 시너지를 설명한다', () => {
    const r = decodeCode('ABYSS-9TAT-YJUZ-52DW-ZZ');
    if (!r.ok) throw new Error();
    const e = explain(measure(r.scores));
    expect(e.pulls[0].label).toBe('집착');
    expect(e.reasons[0]).toBe('집착(9)이 가장 큰 무게를 실었다.');
    expect(e.reasons.join(' ')).toContain('집착과 의존이 함께 높아');
    expect(e.reasons.join(' ')).toContain('신뢰가 낮아(2)');
    const sum = e.pulls.reduce((t, p) => t + p.share, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('조사: 받침 없는 축은 가/와', () => {
    const e = explain(measure(scores({ den: 9, obs: 1, dep: 1, clo: 1, ruin: 1, irr: 1, lack: 8, sac: 1 })));
    expect(e.reasons[0]).toBe('농도(9)가 가장 큰 무게를 실었다.');
    expect(e.reasons[1]).toBe('그 뒤를 결핍(8)이 이었다.');
  });

  it('칭호 근거', () => {
    expect(explain(measure(scores({ obs: 9, ruin: 8 }))).titleReason).toBe('가장 두드러진 두 축이 집착(9)과 파멸성(8)이라서 「소용돌이」.');
    expect(explain(measure(scores({}))).titleReason).toContain('기본 칭호');
  });

  it('부유와 측정 불가', () => {
    const f = explain(measure(scores({ obs: 0, dep: 0, clo: 0, ruin: 0, irr: 0, den: 0, lack: 0, sac: 0, tru: 9 })));
    expect(f.reasons.join(' ')).toContain('가라앉지 않았다');
    const v = explain(measure(scores({ obs: 9, dep: 9, clo: 9, irr: 9, tru: 0 })));
    expect(v.reasons[0]).toContain('측정 범위를 벗어난다');
  });
});
