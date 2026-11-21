import type { MeasureResult } from '$entities/abyss';
import { lerp } from '$shared/lib/math';

/**
 * 깊이 → 분위기. 얕을수록 밝고 둥글고 굵게(가볍고 귀엽게),
 * 깊을수록 어둡고 각지고 가늘게(무겁고 진중하게).
 */
export type Tier = 'light' | 'soft' | 'deep' | 'abyss' | 'void';

const TIER: Record<string, Tier> = {
  float: 'light', sunlight: 'light', twilight: 'soft', midnight: 'deep', abyss: 'abyss', hadal: 'abyss', void: 'void',
};

export function depthMood(result: Pick<MeasureResult, 'zone' | 'depth'>) {
  // 로그 스케일 수심 진행도 0~1
  const r = Math.min(1, Math.log1p(result.depth) / Math.log1p(10935));
  return {
    tier: TIER[result.zone.id],
    numWeight: Math.round(lerp(860, 200, r ** 1.4)),
    radius: Math.round(lerp(32, 10, r)),
  };
}
