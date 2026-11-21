export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInCubic = (t: number) => t ** 3;
/** 처음에 살짝 반대로 갔다가 가속 (도움닫기) */
export const easeInBack = (t: number, s = 1.9) => (s + 1) * t ** 3 - s * t ** 2;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/**
 * 수심 카운터 이징 (easeOutCubic 계열): 정지에서 출발해 t=0.25에서 최고 속도,
 * 이후 길게 감속해 목표에서 멈춘다. f'(t) = 20·t·(1−t)³.
 */
export const easeDive = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 4 * (1 + 4 * t));

/** easeDive의 도함수 (침강 속도 → 마린 스노우 속도 등에 사용) */
export const easeDiveVelocity = (t: number) => (t <= 0 || t >= 1 ? 0 : 20 * t * (1 - t) ** 3);
