/** FNV-1a 32bit (UTF-8 바이트 기준) */
export function fnv1a32(input: string): number {
  const bytes = new TextEncoder().encode(input);
  let h = 0x811c9dc5;
  for (const b of bytes) {
    h ^= b;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
