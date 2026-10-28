/**
 * 측정 테이블 원본 (빌드 타임 전용).
 * 이 파일은 번들에 포함되지 않는다. vite-plugin-abyss-tables 가 인코딩한 문자열만
 * `virtual:abyss-tables` 로 노출되고, 런타임에서 shared/config/tables.ts 가 복원한다.
 */

/** 슬롯 순서 S1~S12 → 축 key (기획서 3-1) */
export const SLOT_AXES = [
  'ruin', 'tru', 'tmp', 'obs',
  'tab', 'den', 'dep', 'irr',
  'one', 'lack', 'clo', 'sac',
] as const;

/** 슬롯별 치환표, index 0~9 → 문자 (기획서 3-2) */
export const SLOT_TABLES = [
  'Q7MR3XK9BW',
  'H4TZN8CV2P',
  'E6JSY5GUAD',
  'R2WK9FMX3T',
  'Z5PYH7NBQE',
  'C8VG4SJW6K',
  'T3XMD9R5UH',
  'N6B2QZF7YA',
  'W9KE5PTH3G',
  'J4SU8CX2MV',
  'F7AR6YDK4N',
  'P5GH2WE9ZS',
];

/** 무게축 기본 가중치 (기획서 2-1) */
export const WEIGHTS = {
  obs: 1.4, dep: 1.4, clo: 1.3, ruin: 1.2,
  irr: 1.1, den: 1.0, lack: 0.9, sac: 0.9,
};

/** 4절 계수 */
export const COEF = {
  oneObs: 0.06,
  oneDen: 0.04,
  tabIrr: 0.05,
  interObsDep: 1.2,
  interCloRuin: 1.0,
  interLackSac: 0.8,
  buoy: 1.5,
  buoyClo: 15,
  k: 2.2,
  maxDepth: 10935,
};

/**
 * 분포 보정: x(무게 정규화 값) → 수심(m) 기준점.
 * 기획서의 지수 매핑(k=2.2)만 쓰면 현실적인 페어의 96%가 점심해로 몰려서,
 * 현실적인 점수 분포(축마다 평균 5.2·표준편차 2.0, 20만 쌍)의 x 백분위를
 * 구간 경계에 맞췄다 → 부유 3% · 표층 17% · 박광층 30% · 점심해 30% · 심해저 14% · 초심해 6%.
 * x 순서는 그대로라 더 무거운 페어가 항상 더 깊다. 분포를 바꾸려면 여기만 고치면 된다.
 */
export const CALIBRATION: [number, number][] = [
  [0, 0],
  [0.2983, 5],
  [0.3863, 200],
  [0.4595, 1000],
  [0.5337, 4000],
  [0.5964, 6000],
  [1, 10935],
];

export const NOISE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const EXAMPLE_CODE = 'ABYSS-9TAT-YJUZ-52DW-QK';
