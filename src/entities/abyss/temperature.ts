export type TempId = 'cold' | 'lukewarm' | 'hot';

export interface Temperature {
  id: TempId;
  label: string;
  tone: string;
}

export const TEMPERATURES: Record<TempId, Temperature> = {
  cold: { id: 'cold', label: '차가운 심해', tone: '고요하고 서늘한 무게' },
  lukewarm: { id: 'lukewarm', label: '미지근한 심해', tone: '정체된 무게' },
  hot: { id: 'hot', label: '뜨거운 심해', tone: '끓어오르는 무게' },
};

/** 6-2. 0~3 차가움 / 4~5 미지근 / 6~9 뜨거움 */
export function temperatureOf(tmp: number): Temperature {
  if (tmp <= 3) return TEMPERATURES.cold;
  if (tmp <= 5) return TEMPERATURES.lukewarm;
  return TEMPERATURES.hot;
}
