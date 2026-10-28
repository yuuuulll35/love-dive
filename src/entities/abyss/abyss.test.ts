import { getTables } from '$shared/config/tables';
import { decodeCode, encodeScores, normalizeCode } from './codec';
import { computeDepth, mapDepth, rawMax } from './depth';
import { mulberry32 } from '$shared/lib/random';
import { ARCHETYPES, matchArchetype } from './archetype';
import { ZONES, VOID_ZONE } from './zones';
import { TITLE_DESC } from '$shared/config/copy';
import { measure } from './measure';
import { normalizePair, pairJitter } from './pair';
import type { Scores } from './types';

const scores = (s: Partial<Scores>): Scores => ({
  ruin: 4, tru: 4, tmp: 4, obs: 4, tab: 4, den: 4, dep: 4, irr: 4, one: 4, lack: 4, clo: 4, sac: 4, ...s,
});

const decoded = (code: string) => {
  const r = decodeCode(code);
  if (!r.ok) throw new Error(`decode failed: ${r.error}`);
  return r.scores;
};

describe('tables', () => {
  it('런타임에서 인코딩된 테이블을 복원한다', () => {
    const t = getTables();
    expect(t.slotTables).toHaveLength(12);
    expect(t.slotTables[0]).toBe('Q7MR3XK9BW');
    expect(t.slotTables[11]).toBe('P5GH2WE9ZS');
    expect(t.slotAxes[0]).toBe('ruin');
    t.slotTables.forEach((row) => expect(new Set(row).size).toBe(10));
  });

  it('치환표 문자는 모두 허용 문자셋 안에 있다', () => {
    const t = getTables();
    for (const row of t.slotTables) for (const c of row) expect(t.noiseCharset).toContain(c);
  });

  it('RAW_MAX ≈ 13.091', () => {
    expect(rawMax()).toBeCloseTo(13.091, 3);
  });
});

describe('#1 기준 벡터', () => {
  const s = decoded('ABYSS-9TAT-YJUZ-52DW-ZZ'); // 예시 코드(…-QK) 그대로면 차단되므로 노이즈만 다르게
  it('디코드', () => {
    expect(s).toEqual({
      ruin: 7, tru: 2, tmp: 8, obs: 9,
      tab: 3, den: 6, dep: 8, irr: 5,
      one: 4, lack: 7, clo: 6, sac: 5,
    });
  });
  it('x ≈ 0.6855 (기획서 검산값), 원식이면 4,794m', () => {
    const d = computeDepth(s);
    expect(d.x).toBeCloseTo(0.6855, 4);
    // 기획서 원식 (k=2.2): 보정 전 값이 검산과 일치하는지
    const raw = (10935 * (Math.exp(2.2 * d.x) - 1)) / (Math.exp(2.2) - 1);
    expect(Math.round(raw)).toBe(4794);
  });
  it('분포 보정 후: 초심해 · 뜨거운 심해', () => {
    const r = measure(s);
    expect(r.kind).toBe('normal');
    expect(r.jitter).toBe(0);
    expect(Math.round(r.depth)).toBe(Math.round(mapDepth(computeDepth(s).x)));
    expect(r.zone.id).toBe('hadal');
    expect(r.temperature.id).toBe('hot');
    expect(r.atm).toBeCloseTo(r.depth / 10 + 1, 6);
  });
});

describe('분포 보정', () => {
  it('x 가 클수록 항상 더 깊다 (단조 증가)', () => {
    let prev = -1;
    for (let x = 0; x <= 1.0001; x += 0.005) {
      const d = mapDepth(x);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
    expect(mapDepth(0)).toBe(0);
    expect(mapDepth(1)).toBe(10935);
  });

  it('전부 4(근거 부족)는 얕은 표층', () => {
    expect(measure(scores({})).zone.id).toBe('sunlight');
  });

  it('현실적인 페어 분포가 구간에 고루 퍼진다', () => {
    const rand = mulberry32(7);
    const gauss = () => Math.sqrt(-2 * Math.log(rand() || 1e-9)) * Math.cos(2 * Math.PI * rand());
    const keys = ['ruin', 'tru', 'tmp', 'obs', 'tab', 'den', 'dep', 'irr', 'one', 'lack', 'clo', 'sac'] as const;
    const h: Record<string, number> = {};
    const N = 6000;
    for (let i = 0; i < N; i++) {
      const sc = {} as Scores;
      for (const k of keys) sc[k] = Math.max(0, Math.min(9, Math.round(5.2 + 2 * gauss())));
      const z = measure(sc).zone.id;
      h[z] = (h[z] ?? 0) + 1;
    }
    const pct = (z: string) => ((h[z] ?? 0) / N) * 100;
    // 목표: 부유 3 · 표층 17 · 박광층 30 · 점심해 30 · 심해저 14 · 초심해 6 (± 오차)
    expect(pct('sunlight')).toBeGreaterThan(10);
    expect(pct('twilight')).toBeGreaterThan(22);
    expect(pct('midnight')).toBeGreaterThan(22);
    expect(pct('midnight')).toBeLessThan(40);
    expect(pct('abyss')).toBeGreaterThan(8);
    expect(pct('hadal')).toBeGreaterThan(2);
  });
});

describe('#2 스냅샷 벡터', () => {
  it('ABYSS-QPEX-ZGT2-W47S-AA', () => {
    const s = decoded('ABYSS-QPEX-ZGT2-W47S-AA');
    expect(s).toEqual({
      ruin: 0, tru: 9, tmp: 0, obs: 7,
      tab: 0, den: 3, dep: 0, irr: 3,
      one: 0, lack: 1, clo: 1, sac: 9,
    });
    const r = measure(s);
    expect({
      x: +r.x.toFixed(4),
      depth: Math.round(r.depth),
      zone: r.zone.id,
      temp: r.temperature.id,
      title: r.title,
    }).toMatchInlineSnapshot(`
      {
        "depth": 2,
        "temp": "cold",
        "title": "부표",
        "x": 0.1239,
        "zone": "float",
      }
    `);
  });
});

describe('#3 형식 오류', () => {
  it.each([
    'ABYSS-WHET-ZK??-QQQQ-AA',
    'ABYSS-WHET-ZK',
    'ABYS-9TAT-YJUZ-52DW-QK',
    'ABYSS-9TAT-YJUZ-52DW',
    'ABYSS-9TA-TYJUZ-52DW-QK',
    'ABYSS-9TAT-YJUZ-52DW-QKX',
    'ABYSS-9TAT-YJUZ-52DW-Q1',
    '',
  ])('%s → ERR_FORMAT', (code) => {
    expect(decodeCode(code)).toMatchObject({ ok: false, error: 'ERR_FORMAT' });
  });
});

describe('AI 답변 통째로 붙여넣기', () => {
  it('해설에 ABYSS 라는 말이 섞여도 마지막 코드 덩어리를 읽는다', () => {
    const answer = [
      '두 사람은 서로를 ABYSS처럼 깊은 곳까지 끌고 내려간다. abyss-like 한 집착이 보인다.',
      '신뢰는 흔들리지만 관계는 끊기지 않는다.',
      '',
      '```',
      'ABYSS-3863-P6U2-E2F9-ZZ',
      '```',
    ].join('\n');
    expect(decodeCode(answer)).toMatchObject({ ok: true, code: 'ABYSS-3863-P6U2-E2F9-ZZ' });
  });
});

describe('#4 슬롯 문자 불일치', () => {
  it('S1에 A → ERR_SIGNAL', () => {
    expect(decodeCode('ABYSS-ATAT-YJUZ-52DW-QK')).toEqual({ ok: false, error: 'ERR_SIGNAL', slot: 1 });
  });
  it('S12에 Q → ERR_SIGNAL', () => {
    expect(decodeCode('ABYSS-9TAT-YJUZ-52DQ-QK')).toEqual({ ok: false, error: 'ERR_SIGNAL', slot: 12 });
  });
});

describe('#5 측정 불가', () => {
  it('obs=dep=clo=irr=9, tru=0', () => {
    const r = measure(scores({ obs: 9, dep: 9, clo: 9, irr: 9, tru: 0 }));
    expect(r.kind).toBe('void');
    expect(r.zone.id).toBe('void');
  });
  it('tru=2 면 측정 불가가 아니다', () => {
    expect(measure(scores({ obs: 9, dep: 9, clo: 9, irr: 9, tru: 2 })).kind).toBe('normal');
  });
});

describe('#6 부유', () => {
  it('전 무게축 0, tru=9', () => {
    const r = measure(scores({ obs: 0, dep: 0, clo: 0, ruin: 0, irr: 0, den: 0, lack: 0, sac: 0, tru: 9 }));
    expect(r.kind).toBe('float');
    expect(r.depth).toBeLessThan(5);
    expect(r.title).toBe('부표');
  });
});

describe('#7 페어 이름 지터', () => {
  it('A×B ≡ B × a', () => {
    expect(normalizePair('A×B')).toBe(normalizePair('B × a'));
    expect(pairJitter('A×B')).toBe(pairJitter('B × a'));
    const s = decoded('ABYSS-QPEX-ZGT2-W47S-AA');
    expect(measure(s, 'A×B').depth).toBe(measure(s, 'B × a').depth);
  });
  it('여러 구분자를 통일한다', () => {
    const key = normalizePair('하루×유키');
    for (const v of ['유키 x 하루', '하루x유키', '유키/하루', '하루 & 유키', ' 유키♡하루 ']) {
      expect(normalizePair(v)).toBe(key);
    }
  });
  it('라틴 이름 속 x는 구분자가 아니다', () => {
    expect(normalizePair('Alex x Max')).toBe('alex×max');
    expect(normalizePair('Rex')).toBe('rex');
  });
  it('지터 범위 ±3%, 미입력 0', () => {
    expect(pairJitter('')).toBe(0);
    for (const n of ['a×b', '하루×유키', 'x', '🐟', 'longname×another']) {
      const j = pairJitter(n);
      expect(j).toBeGreaterThanOrEqual(-0.03);
      expect(j).toBeLessThanOrEqual(0.03);
    }
  });
  it('지터 후에도 10,935m를 넘지 않는다', () => {
    const s = scores({ obs: 9, dep: 9, clo: 9, ruin: 9, irr: 9, den: 9, lack: 9, sac: 9, one: 9, tab: 9, tru: 2 });
    for (const n of ['a×b', 'c×d', 'e×f', 'g×h']) expect(measure(s, n).depth).toBeLessThanOrEqual(10935);
  });
});

describe('입력 정규화', () => {
  it.each([
    'abyss 9tat yjuz 52dw zz',
    '  ABYSS—9TAT–YJUZ_52DW-ZZ ',
    '```\nABYSS-9TAT-YJUZ-52DW-ZZ\n```',
    'ABYSS9TATYJUZ52DWZZ',
    '코드: ABYSS-9TAT-YJUZ-52DW-ZZ',
  ])('%j 통과', (raw) => {
    expect(normalizeCode(raw).startsWith('ABYSS')).toBe(true);
    expect(decodeCode(raw).ok).toBe(true);
  });

  it('예시 코드 그대로면 ERR_EXAMPLE', () => {
    expect(decodeCode('ABYSS-9TAT-YJUZ-52DW-QK')).toMatchObject({ ok: false, error: 'ERR_EXAMPLE' });
  });
});

describe('테이블 왕복', () => {
  it('0~9 전 점수 → 인코딩 → 디코딩 = 원본', () => {
    const { slotAxes } = getTables();
    for (let v = 0; v <= 9; v++) {
      for (const axis of slotAxes) {
        const s = scores({ [axis]: v, ruin: axis === 'ruin' ? v : 1 });
        const r = decodeCode(encodeScores(s, 'NN'));
        expect(r.ok && r.scores).toEqual(s);
      }
    }
  });
});

describe('칭호', () => {
  it('집착+파멸성 → 소용돌이', () => {
    expect(matchArchetype(scores({ obs: 9, ruin: 8 }))?.title).toBe('소용돌이');
  });
  it('2위 동점이면 표 우선순위 (집착 9, 의존·파멸 8 → 소용돌이)', () => {
    expect(matchArchetype(scores({ obs: 9, dep: 8, ruin: 8 }))?.title).toBe('소용돌이');
  });
  it('결핍+신뢰 → 심해어의 등불', () => {
    expect(matchArchetype(scores({ lack: 8, tru: 9 }))?.title).toBe('심해어의 등불');
  });
  it('상위 축이 약하면 칭호 없음 → 구간 기본 칭호', () => {
    expect(matchArchetype(scores({}))).toBeNull();
    const r = measure(scores({}));
    expect(r.archetypeId).toBeNull();
    expect(r.title).toBe(r.zone.defaultTitle);
  });
  it('해시태그는 5점 이상 상위 축 최대 3개', () => {
    expect(measure(scores({ obs: 9, ruin: 8, dep: 7, clo: 6 })).tags).toEqual(['집착', '파멸성', '의존']);
    expect(measure(scores({})).tags).toEqual([]);
  });
  it('설명 사전이 모든 칭호·구간을 덮는다', () => {
    for (const a of ARCHETYPES) expect(TITLE_DESC[a.id]).toBeTruthy();
    for (const z of [...ZONES, VOID_ZONE]) expect(TITLE_DESC[z.id]).toBeTruthy();
  });
  it('모든 칭호에 설명이 있다', () => {
    for (const s of [scores({ obs: 9, ruin: 8 }), scores({}), scores({ obs: 0, dep: 0, clo: 0, ruin: 0, irr: 0, den: 0, lack: 0, sac: 0, tru: 9 })]) {
      expect(measure(s).description.length).toBeGreaterThan(20);
    }
  });
  it('같은 입력은 같은 해설', () => {
    const s = decoded('ABYSS-QPEX-ZGT2-W47S-AA');
    expect(measure(s, 'A×B').lines).toEqual(measure(s, 'b x a').lines);
  });
});
