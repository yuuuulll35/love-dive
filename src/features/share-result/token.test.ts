import { decodeToken, encodeToken } from './token';

describe('share token', () => {
  it('왕복', () => {
    for (const pair of ['', '하루×유키', 'A & B', '🐟 x 🌊']) {
      const t = encodeToken('ABYSS-9TAT-YJUZ-52DW-ZZ', pair);
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(decodeToken(t)).toEqual({ code: 'ABYSS-9TAT-YJUZ-52DW-ZZ', pair: pair.trim() });
    }
  });
  it('깨진 토큰은 null', () => {
    expect(decodeToken('!!!')).toBeNull();
    expect(decodeToken('AAAA')).toBeNull();
  });
});
