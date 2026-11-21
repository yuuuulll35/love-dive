import { finalFrame, frameAt, sinkDuration, totalDuration, T_COUNT, T_DROP, HANG_Y } from './timeline';

describe('timeline', () => {
  it('연출 길이: 최소 3s, 최대 12s, 수심에 비례', () => {
    expect(sinkDuration(5, 'normal')).toBeGreaterThanOrEqual(3);
    expect(sinkDuration(10935, 'normal')).toBeCloseTo(12);
    expect(sinkDuration(300, 'normal')).toBeLessThan(sinkDuration(4000, 'normal'));
  });

  it('카운터는 단조 증가하고 목표에서 정확히 멈춘다', () => {
    const target = 4794;
    let prev = -1;
    const end = totalDuration(target, 'normal');
    for (let t = 0; t <= end + 0.5; t += 0.05) {
      const f = frameAt(t, target, 'normal', false);
      expect(f.depth).toBeGreaterThanOrEqual(prev - 1e-9);
      expect(f.depth).toBeLessThanOrEqual(target + 1e-9);
      prev = f.depth;
    }
    expect(finalFrame(target, 'normal', false)).toMatchObject({ phase: 'done', depth: target });
  });

  it('뜨거운 심해는 마지막에 붉은빛', () => {
    const t = T_DROP + sinkDuration(4794, 'normal') - 0.1;
    expect(frameAt(t, 4794, 'normal', true).vent).toBeGreaterThan(0.5);
    expect(frameAt(t, 4794, 'normal', false).vent).toBe(0);
  });

  it('측정 불가는 10,935m를 넘어 글리치 후 암전', () => {
    const phases = new Set<string>();
    let maxDepth = 0;
    for (let t = 0; t < totalDuration(10935, 'void') + 0.5; t += 0.05) {
      const f = frameAt(t, 10935, 'void', false);
      phases.add(f.phase);
      if (f.phase === 'glitch') maxDepth = Math.max(maxDepth, f.depth);
    }
    expect([...phases]).toEqual(['drop', 'sink', 'glitch', 'blackout', 'done']);
    expect(maxDepth).toBeGreaterThan(10935);
  });

  it('카운트다운 동안은 수면 위에 매달려 기다리고, 낙하 직전에 살짝 솟는다', () => {
    const c = frameAt(-T_COUNT + 0.1, 4794, 'normal', false);
    expect(c.phase).toBe('count');
    expect(c.weightY).toBe(HANG_Y);
    expect(frameAt(0.1, 4794, 'normal', false).weightY).toBeLessThan(HANG_Y);
    expect(frameAt(0.69, 4794, 'normal', false).weightY).toBeGreaterThan(0.45);
  });

  it('부유는 가라앉지 않는다', () => {
    for (let t = 0; t < totalDuration(2, 'float'); t += 0.1) {
      const f = frameAt(t, 2, 'float', false);
      expect(f.surfaceY).toBe(0.5);
      expect(f.weightY).toBeLessThan(0.56);
    }
  });
});
