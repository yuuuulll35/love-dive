import { encodeScores, type AxisKey, type Scores } from '$entities/abyss';
import { getTables } from '$shared/config/tables';

export interface Question {
  axis: AxisKey;
  text: string;
  /** true 면 '그렇다'일수록 축 점수가 낮아진다 */
  reverse?: boolean;
}

/** 5점 척도: 0 = 전혀 아니다 … 4 = 매우 그렇다 (모바일에서 라벨을 세로로 쌓아 읽기 쉽게) */
export const SCALE_MAX = 4;

const FIRST: Question[] = [
  { axis: 'obs', text: '한쪽이 상대의 시선과 행동을 늘 붙잡아 두고 싶어 한다.' },
  { axis: 'tru', text: '눈앞에 없어도 서로를 의심하지 않는다.' },
  { axis: 'den', text: '함께하는 장면 하나하나에 감정이 넘쳐흐른다.' },
  { axis: 'ruin', text: '서로 때문에 상처받으면서도 관계를 멈추지 못한다.' },
  { axis: 'tab', text: '이 관계는 누구에게도 들켜선 안 된다.' },
  { axis: 'dep', text: '상대가 없으면 일상이 무너질 것 같다.' },
  { axis: 'tmp', text: '둘의 감정은 뜨겁고 격렬하게 부딪힌다.' },
  { axis: 'clo', text: '둘만의 세계가 있고, 다른 사람은 그 안에 들어올 수 없다.' },
  { axis: 'one', text: '한쪽의 마음이 다른 쪽보다 훨씬 무겁다.' },
  { axis: 'irr', text: '이미 되돌릴 수 없는 일이 둘 사이에 일어났다.' },
  { axis: 'lack', text: '상대가 오래된 빈자리를 채워 주고 있다.' },
  { axis: 'sac', text: '상대를 위해서라면 자신의 것을 기꺼이 버릴 수 있다.' },
];

const SECOND: Question[] = [
  { axis: 'irr', text: '지금이라도 아무 일 없던 사이로 돌아갈 수 있다.', reverse: true },
  { axis: 'sac', text: '관계 때문에 스스로를 깎아내는 일은 없다.', reverse: true },
  { axis: 'obs', text: '상대가 떠나겠다고 하면 놓아줄 수 있다.', reverse: true },
  { axis: 'tmp', text: '둘 사이에는 차분하고 서늘한 공기가 흐른다.', reverse: true },
  { axis: 'lack', text: '만나기 전의 둘은 각자 무언가 크게 결여되어 있었다.' },
  { axis: 'ruin', text: '함께 있을수록 두 사람 모두 더 나은 사람이 된다.', reverse: true },
  { axis: 'clo', text: '둘 다 서로 말고도 소중한 사람과 세계가 많다.', reverse: true },
  { axis: 'tru', text: '상대의 말을 곧이곧대로 믿기 어렵다.', reverse: true },
  { axis: 'tab', text: '세상이나 주변이 이 관계를 허락하지 않는다.' },
  { axis: 'den', text: '둘의 관계는 담백하고 가볍다.', reverse: true },
  { axis: 'one', text: '두 사람은 같은 크기로 서로를 원한다.', reverse: true },
  { axis: 'dep', text: '서로가 없어도 각자 온전히 살아갈 수 있다.', reverse: true },
];

/** 같은 축 문항이 이어지지 않도록 앞뒤 절반을 다른 순서로 배치 */
export const QUESTIONS: readonly Question[] = [...FIRST, ...SECOND];

/**
 * 답(0~4) → 축 점수(0~9). 축마다 두 문항 합(0~8)을 9점 척도로 환산.
 * 정중앙(둘 다 '보통')은 OOC 판정의 '근거 부족 = 4'와 맞추려고 반올림을 아래로 한다.
 */
export function scoreAnswers(answers: readonly number[]): Scores {
  const sum = {} as Record<AxisKey, number>;
  QUESTIONS.forEach((q, i) => {
    const a = answers[i] ?? SCALE_MAX / 2;
    sum[q.axis] = (sum[q.axis] ?? 0) + (q.reverse ? SCALE_MAX - a : a);
  });
  const scores = {} as Scores;
  for (const axis of Object.keys(sum) as AxisKey[]) {
    const x = (sum[axis] / (SCALE_MAX * 2)) * 9;
    scores[axis] = Math.min(9, Math.max(0, Math.ceil(x - 0.5)));
  }
  return scores;
}

/** 점수 → 측정 코드. 노이즈 2자리는 무작위 (예시 코드와 겹치면 다시 뽑는다) */
export function answersToCode(
  answers: readonly number[],
  rand: () => number = Math.random,
  exampleCode = getTables().exampleCode,
): string {
  const { noiseCharset } = getTables();
  const scores = scoreAnswers(answers);
  for (;;) {
    const noise = Array.from({ length: 2 }, () => noiseCharset[Math.floor(rand() * noiseCharset.length)]).join('');
    const code = encodeScores(scores, noise);
    if (code !== exampleCode) return code;
  }
}
