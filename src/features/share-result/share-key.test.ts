import { measure } from '$entities/abyss';
import { getTables } from '$shared/config/tables';
import { mulberry32 } from '$shared/lib/random';
import { shares } from '../../../tools/vite-plugin-share-pages';
import { sharePageKey } from './share-key';

describe('링크 미리보기 페이지', () => {
  it('어떤 결과가 나와도 그 결과의 미리보기 페이지가 있다', () => {
    const keys = new Set(shares().map((s) => s.key));
    const rand = mulberry32(7);
    const axes = getTables().slotAxes;
    for (let n = 0; n < 5000; n++) {
      const scores = Object.fromEntries(axes.map((k) => [k, Math.floor(rand() * 10)])) as never;
      const r = measure(scores, '');
      expect(keys.has(sharePageKey(r.zone.id, r.archetypeId))).toBe(true);
    }
  });
});
