export type ZoneId = 'float' | 'sunlight' | 'twilight' | 'midnight' | 'abyss' | 'hadal' | 'void';

export interface Zone {
  id: ZoneId;
  name: string;
  /** 해양학 명칭 (보조 라벨) */
  latin: string;
  /** [from, to) m */
  from: number;
  to: number;
  creature: CreatureId | null;
  defaultTitle: string;
}

export type CreatureId =
  | 'school' | 'turtle' | 'ray' | 'whale'
  | 'jelly' | 'lantern' | 'siphon'
  | 'angler' | 'vampire'
  | 'squid' | 'dumbo'
  | 'snailfish' | 'amphipod';

/** 연출 중 구간마다 계속 지나가는 생물 풀 (첫 번째가 구간 대표) */
export const ZONE_LIFE: Record<string, readonly CreatureId[]> = {
  sunlight: ['school', 'turtle', 'ray', 'whale', 'school'],
  twilight: ['jelly', 'lantern', 'siphon', 'whale', 'jelly'],
  midnight: ['angler', 'siphon', 'vampire', 'lantern'],
  abyss: ['squid', 'dumbo', 'vampire', 'siphon'],
  hadal: ['snailfish', 'amphipod', 'dumbo', 'amphipod'],
};

export const ZONES: readonly Zone[] = [
  { id: 'float', name: '부유', latin: 'SURFACE', from: 0, to: 5, creature: null, defaultTitle: '부표' },
  { id: 'sunlight', name: '표층', latin: 'EPIPELAGIC', from: 5, to: 200, creature: 'school', defaultTitle: '물결' },
  { id: 'twilight', name: '박광층', latin: 'MESOPELAGIC', from: 200, to: 1000, creature: 'jelly', defaultTitle: '해무' },
  { id: 'midnight', name: '점심해', latin: 'BATHYPELAGIC', from: 1000, to: 4000, creature: 'angler', defaultTitle: '심연의 입구' },
  { id: 'abyss', name: '심해저', latin: 'ABYSSOPELAGIC', from: 4000, to: 6000, creature: 'squid', defaultTitle: '해저 평원' },
  { id: 'hadal', name: '초심해', latin: 'HADOPELAGIC', from: 6000, to: Infinity, creature: 'snailfish', defaultTitle: '바닥 없는 바다' },
];

export const VOID_ZONE: Zone = {
  id: 'void', name: '측정 불가', latin: 'NO SIGNAL', from: 10935, to: Infinity, creature: null, defaultTitle: '해저 아래',
};

export function zoneOf(depth: number): Zone {
  for (const z of ZONES) if (depth < z.to) return z;
  return ZONES[ZONES.length - 1];
}

export function zoneById(id: ZoneId): Zone {
  return id === 'void' ? VOID_ZONE : ZONES.find((z) => z.id === id)!;
}

/**
 * 수심별 배경색 스톱 (sRGB). 표층 청록 → 박광층 남색 → 점심해 거의 검정 → 해구 완전한 검정.
 * 실제 광투과(청색광이 가장 깊이 침투)를 따라 색상은 청록→청→남으로 이동하며 명도만 빠진다.
 */
export const WATER_STOPS: readonly [depth: number, rgb: [number, number, number]][] = [
  [0, [64, 196, 206]],
  [40, [24, 150, 176]],
  [200, [10, 88, 132]],
  [500, [9, 52, 104]],
  [1000, [8, 26, 66]],
  [2000, [6, 14, 38]],
  [4000, [3, 6, 16]],
  [6000, [2, 3, 8]],
  [10935, [0, 0, 2]],
];

export function waterColor(depth: number): [number, number, number] {
  const stops = WATER_STOPS;
  if (depth <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [d1, c1] = stops[i];
    if (depth <= d1) {
      const [d0, c0] = stops[i - 1];
      // 로그 스케일 보간: 깊은 구간에서 색 변화가 한쪽으로 몰리지 않게
      const t = (Math.log1p(depth) - Math.log1p(d0)) / (Math.log1p(d1) - Math.log1p(d0));
      return [0, 1, 2].map((j) => Math.round(c0[j] + (c1[j] - c0[j]) * t)) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}
