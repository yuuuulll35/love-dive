import { decodeCode, measure, type MeasureResult } from '$entities/abyss';
import { ERROR_COPY } from '$shared/config/copy';

export type DecodeOutcome =
  | { ok: true; code: string; pair: string; result: MeasureResult }
  | { ok: false; message: string; kind: 'empty' | 'signal' | 'example' };

/** 입력 정규화 → codec → 측정. 에러 종류는 유저에게 구분해 보여주지 않는다 (예시 코드 안내만 예외). */
export function decodeInput(rawCode: string, rawPair: string): DecodeOutcome {
  if (!rawCode.trim()) return { ok: false, kind: 'empty', message: ERROR_COPY.empty };
  const r = decodeCode(rawCode);
  if (!r.ok) {
    if (r.error === 'ERR_EXAMPLE') return { ok: false, kind: 'example', message: ERROR_COPY.example };
    return { ok: false, kind: 'signal', message: ERROR_COPY.signal };
  }
  const pair = rawPair.trim().slice(0, 40);
  return { ok: true, code: r.code, pair, result: measure(r.scores, pair) };
}
