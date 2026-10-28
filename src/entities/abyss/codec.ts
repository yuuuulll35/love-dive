import { getTables } from '$shared/config/tables';
import type { DecodeResult, Scores } from './types';

const HEADER = 'ABYSS';
const GROUP_SIZES = [4, 4, 4, 2] as const;
/** 표에 없는 문자를 근거 부족으로 봐줄 최대 칸 수 */
const MAX_FUZZY = 2;
const FALLBACK_SCORE = 4;

const SEP = '[\\s\\-‐‑‒–—―_·.:]*';
// 해설 문장 + 코드블록을 통째로 붙여넣어도 코드 모양 덩어리를 찾아낸다 (해설에 'ABYSS'라는 말이 섞여도)
const CODE_SHAPE = new RegExp(`ABYSS${SEP}([A-Z0-9]{4})${SEP}([A-Z0-9]{4})${SEP}([A-Z0-9]{4})${SEP}([A-Z0-9]{2})(?![A-Z0-9])`, 'g');

/**
 * 입력 정규화: 대문자 변환, 코드블록·따옴표 제거, 공백·하이픈류 → '-'.
 * `abyss 9tat yjuz 52dw qk`, "```ABYSS-…```" 등도 통과시킨다.
 */
export function normalizeCode(raw: string): string {
  let s = raw.toUpperCase().replace(/[`'"“”‘’「」『』<>\[\]()]/g, ' ');
  // 코드 모양이 있으면 마지막 것을 쓴다 (AI 답변은 해설 뒤에 코드가 온다)
  const shaped = [...s.matchAll(CODE_SHAPE)].pop();
  if (shaped) return [HEADER, ...shaped.slice(1, 5)].join('-');
  // 앞뒤 잡문이 섞였으면 헤더부터 잘라낸다
  const at = s.indexOf(HEADER);
  if (at > 0) s = s.slice(at);
  return s
    .replace(/[\s\-‐‑‒–—―_·.:]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** 정규화된 코드를 [헤더, 그룹×4] 로 분해. 구분자가 아예 없는 19자 연속 입력도 허용. */
function split(norm: string): string[] | null {
  let parts = norm.split('-');
  if (parts.length === 1 && norm.length === HEADER.length + 14) {
    const body = norm.slice(HEADER.length);
    parts = [HEADER, body.slice(0, 4), body.slice(4, 8), body.slice(8, 12), body.slice(12)];
  }
  if (parts.length !== 5) return null;
  if (parts[0] !== HEADER) return null;
  for (let i = 0; i < GROUP_SIZES.length; i++) {
    // 영숫자가 아닌 문자(?, # 등)는 슬롯 판정 이전에 형식 오류
    if (parts[i + 1].length !== GROUP_SIZES[i] || !/^[A-Z0-9]+$/.test(parts[i + 1])) return null;
  }
  return parts;
}

export function decodeCode(raw: string): DecodeResult {
  const t = getTables();
  const norm = normalizeCode(raw);
  const parts = split(norm);
  if (!parts) return { ok: false, error: 'ERR_FORMAT' };

  const slots = (parts[1] + parts[2] + parts[3]).split('');
  const noise = parts[4];
  if (![...noise].every((c) => t.noiseCharset.includes(c))) return { ok: false, error: 'ERR_FORMAT' };

  // AI 가 표를 잘못 읽어 다른 줄의 문자를 넣는 일이 잦다.
  // 1~2칸까지는 그 축만 '근거 부족 = 4'로 읽고, 그 이상이면 코드 자체를 믿을 수 없다.
  const scores = {} as Scores;
  const fuzzy: number[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = t.slotTables[i].indexOf(slots[i]);
    if (idx < 0) {
      if (import.meta.env?.DEV) console.debug(`[abyss] signal mismatch at S${i + 1}`);
      fuzzy.push(i + 1);
    }
    scores[t.slotAxes[i]] = idx < 0 ? FALLBACK_SCORE : idx;
  }
  if (fuzzy.length > MAX_FUZZY) return { ok: false, error: 'ERR_SIGNAL', slot: fuzzy[0] };

  const code = `${HEADER}-${parts[1]}-${parts[2]}-${parts[3]}-${noise}`;
  if (code === t.exampleCode) return { ok: false, error: 'ERR_EXAMPLE' };

  return fuzzy.length ? { ok: true, scores, code, fuzzy } : { ok: true, scores, code };
}

/** 점수 → 코드 (테스트·디버그용 왕복 인코더) */
export function encodeScores(scores: Scores, noise = 'QK'): string {
  const t = getTables();
  const chars = t.slotAxes.map((axis, i) => t.slotTables[i][scores[axis]]);
  const s = chars.join('');
  return `${HEADER}-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${noise}`;
}
