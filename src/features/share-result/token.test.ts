import { decodeToken, encodeToken } from './token';

describe('share token', () => {
  it('왕복', () => {
    for (const pair of ['', '하루×유키', 'A & B', '🐟 x 🌊']) {
      const t = encodeToken('ABYSS-9TAT-YJUZ-52DW-ZZ', pair);
      expect(t).toMatch(/^[0-9a-f]+$/);
      expect(decodeToken(t)).toEqual({ code: 'ABYSS-9TAT-YJUZ-52DW-ZZ', pair: pair.trim() });
    }
  });
  it('깨진 토큰은 null', () => {
    expect(decodeToken('!!!')).toBeNull();
    expect(decodeToken('abc')).toBeNull();
    expect(decodeToken('ffff')).toBeNull();
    expect(decodeToken('4142')).toBeNull(); // 줄바꿈 없음
  });
});
