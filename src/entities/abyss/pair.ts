import { fnv1a32 } from '$shared/lib/hash';

/** 명시적 구분자 (x 제외) */
const SEP = /[×✕✖⨯╳*/&＆+＋,，·♡♥❤💕\\|]/;

/**
 * 페어 이름 정규화 (기획서 4-6)
 * trim → 소문자 → 구분자 통일 → 공백 제거 → 이름 2개면 정렬 (A×B ≡ B×A)
 * 'x'는 앞뒤가 공백이거나 라틴 문자가 아닐 때만 구분자로 본다 (alex 같은 이름 보호).
 */
export function normalizePair(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (!s) return '';

  let names: string[];
  if (SEP.test(s)) {
    names = s.split(SEP);
  } else {
    const at = findLetterX(s);
    names = at < 0 ? [s] : [s.slice(0, at), s.slice(at + 1)];
  }

  names = names.map((n) => n.replace(/\s+/g, '')).filter(Boolean);
  if (names.length === 2) names.sort();
  return names.join('×');
}

/** ±3% 지터. 페어 이름 미입력 시 0 */
export function pairJitter(raw: string): number {
  const key = normalizePair(raw);
  if (!key) return 0;
  return (fnv1a32(key) % 6001) / 100000 - 0.03;
}

const isBoundary = (c: string | undefined) => c !== undefined && !/[a-z]/.test(c);

/** 'x'가 양옆이 라틴 문자가 아닌 위치(공백·한글 등)에 있고 양쪽에 이름이 있으면 그 index */
function findLetterX(s: string): number {
  for (let i = 1; i < s.length - 1; i++) {
    if (s[i] !== 'x' || !isBoundary(s[i - 1]) || !isBoundary(s[i + 1])) continue;
    if (s.slice(0, i).trim() && s.slice(i + 1).trim()) return i;
  }
  return -1;
}
