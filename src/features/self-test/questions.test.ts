import { decodeCode } from '$entities/abyss';
import { getTables } from '$shared/config/tables';
import { answersToCode, QUESTIONS, scoreAnswers, SCALE_MAX } from './questions';

describe('셀프 테스트', () => {
  it('12축 각각 정확히 두 문항', () => {
    const { slotAxes } = getTables();
    for (const axis of slotAxes) expect(QUESTIONS.filter((q) => q.axis === axis)).toHaveLength(2);
  });

  it('같은 축 문항이 연달아 나오지 않는다', () => {
    for (let i = 1; i < QUESTIONS.length; i++) expect(QUESTIONS[i].axis).not.toBe(QUESTIONS[i - 1].axis);
  });

  it('전부 보통이면 모든 축 4 (근거 부족 기본값과 같음)', () => {
    const s = scoreAnswers(QUESTIONS.map(() => 3));
    expect(new Set(Object.values(s))).toEqual(new Set([4]));
  });

  it('정방향 매우 그렇다 + 역방향 전혀 아니다 = 9, 반대면 0', () => {
    const high = scoreAnswers(QUESTIONS.map((q) => (q.reverse ? 0 : SCALE_MAX)));
    const low = scoreAnswers(QUESTIONS.map((q) => (q.reverse ? SCALE_MAX : 0)));
    expect(new Set(Object.values(high))).toEqual(new Set([9]));
    expect(new Set(Object.values(low))).toEqual(new Set([0]));
  });

  it('생성된 코드는 디코드되고 점수가 보존된다', () => {
    const answers = QUESTIONS.map((_, i) => i % 7);
    const code = answersToCode(answers);
    const r = decodeCode(code);
    expect(r.ok && r.scores).toEqual(scoreAnswers(answers));
  });

  it('예시 코드와 우연히 같아지면 노이즈를 다시 뽑는다', () => {
    // 예시 코드 점수와 같은 답 + 첫 노이즈를 'QK'로 강제
    const { noiseCharset } = getTables();
    const seq = [noiseCharset.indexOf('Q'), noiseCharset.indexOf('K'), 0, 0].map((i) => (i + 0.5) / noiseCharset.length);
    let n = 0;
    const rand = () => seq[n++ % seq.length];
    const target = decodeCode('ABYSS-9TAT-YJUZ-52DW-ZZ');
    if (!target.ok) throw new Error();
    const answers = QUESTIONS.map(() => 0);
    // 해당 점수를 만드는 답을 역산: 축 점수 s → 두 문항 합 ≈ s/9*12
    const perAxis: Record<string, number[]> = {};
    QUESTIONS.forEach((q, i) => (perAxis[q.axis] ??= []).push(i));
    for (const [axis, idx] of Object.entries(perAxis)) {
      const total = Math.round((target.scores[axis as keyof typeof target.scores] / 9) * 12);
      const a = Math.min(6, total), b = total - a;
      [a, b].forEach((v, k) => (answers[idx[k]] = QUESTIONS[idx[k]].reverse ? 6 - v : v));
    }
    expect(scoreAnswers(answers)).toEqual(target.scores);
    const code = answersToCode(answers, rand);
    expect(code).not.toBe('ABYSS-9TAT-YJUZ-52DW-QK');
    expect(code.startsWith('ABYSS-9TAT-YJUZ-52DW-')).toBe(true);
  });
});
