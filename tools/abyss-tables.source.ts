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

export const NOISE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const EXAMPLE_CODE = 'ABYSS-9TAT-YJUZ-52DW-QK';
