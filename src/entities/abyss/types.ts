import type { AxisKey } from '$shared/config/tables';

export type { AxisKey, WeightAxis } from '$shared/config/tables';

/** 축별 점수 0~9 */
export type Scores = Record<AxisKey, number>;

export type CodecError = 'ERR_FORMAT' | 'ERR_SIGNAL' | 'ERR_EXAMPLE';

export type DecodeResult =
  | { ok: true; scores: Scores; code: string; /** 표에 없는 문자라 4점(근거 부족)으로 읽은 슬롯 번호 */ fuzzy?: number[] }
  | { ok: false; error: CodecError; /** 내부 로그용. 유저에게 노출 금지 */ slot?: number };
