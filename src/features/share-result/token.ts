/** 결과 공유 토큰: base64url(UTF-8 "코드\n페어"). 코드가 평문으로 URL에 보이지 않게만 한다. */
export function encodeToken(code: string, pair: string): string {
  const bytes = new TextEncoder().encode(`${code}\n${pair.trim()}`);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeToken(token: string): { code: string; pair: string } | null {
  try {
    const bin = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const nl = text.indexOf('\n');
    if (nl < 0) return null;
    return { code: text.slice(0, nl), pair: text.slice(nl + 1) };
  } catch {
    return null;
  }
}

export const diveHash = (code: string, pair: string) => `#/dive/${encodeToken(code, pair)}`;
