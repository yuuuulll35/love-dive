export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** [a,b] 구간에서 v의 위치 (0~1, clamp) */
export const invLerp = (a: number, b: number, v: number) => (a === b ? 0 : clamp((v - a) / (b - a), 0, 1));
