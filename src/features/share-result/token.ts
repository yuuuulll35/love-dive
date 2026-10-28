/**
 * 결과 공유 토큰: UTF-8 "코드\n페어" 를 16진수로. 해시가 `#dive-<hex>` 처럼 영숫자·하이픈만 쓰도록 해서
 * 어떤 호스팅(미리보기 프레임 포함)에서도 링크 그대로 전달된다. 코드가 평문으로 보이지 않게만 한다.
 */
export function encodeToken(code: string, pair: string): string {
  const bytes = new TextEncoder().encode(`${code}\n${pair.trim()}`);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function decodeToken(token: string): { code: string; pair: string } | null {
  if (!/^(?:[0-9a-f]{2})+$/.test(token)) return null;
  try {
    const bytes = Uint8Array.from(token.match(/../g)!, (h) => parseInt(h, 16));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const nl = text.indexOf('\n');
    if (nl < 0) return null;
    return { code: text.slice(0, nl), pair: text.slice(nl + 1) };
  } catch {
    return null;
  }
}

export const diveHash = (code: string, pair: string) => `#dive-${encodeToken(code, pair)}`;
