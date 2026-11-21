import type { MeasureKind } from '$entities/abyss';
import { clamp, invLerp, lerp } from '$shared/lib/math';
import { easeDive, easeDiveVelocity, easeInBack, easeInOutSine, easeOutCubic } from '$shared/lib/easing';

/**
 * 연출 타임라인 (순수 함수). 화면 좌표는 뷰포트 높이 비율(0=위, 1=아래).
 *
 * count  −2.9 ~ 0s  3·2·1·LOVE DIVE! 카운트다운, 추는 수면 위에 매달려 대기
 * drop   0 ~ 1.2s   다이빙대에서 뛰듯 살짝 솟았다가 낙하 → 입수(0.7s) → 카메라가 수면 아래로
 * sink   가변        수심 카운터 easeDive, 최소 3s ~ 최대 12s (천천히 가라앉는 맛)
 * settle 1.1s        착저 · 모래 먼지
 * (float) bob 2.6s  수면에서 흔들림
 * (void)  glitch 1.8s → blackout 2.2s
 */
/** 카운트다운 길이 (t 는 −T_COUNT 에서 시작) */
export const T_COUNT = 2.9;
export const T_IMPACT = 0.7;
export const T_DROP = 1.2;
export const T_SETTLE = 1.4;
export const T_BOB = 2.6;
export const T_GLITCH = 1.8;
export const T_BLACKOUT = 2.2;
export const VOID_SINK = 8.5;

export const MAX_DEPTH = 10935;
export const WEIGHT_REST_Y = 0.4;
/** 착저: 카메라가 멈추고 추가 화면 아래쪽 모래 위에 내려앉는다 */
export const LAND_Y = 0.775;
/** 해저면 요소의 top. 모래 표면은 여기서 약 0.16(화면 높이 비) 아래 */
export const BED_Y = 0.64;
export const BED_SURFACE = 0.157;
/** 카운트다운 동안 추가 매달려 있는 높이 */
export const HANG_Y = 0.24;
export const SURFACE_START_Y = 0.5;

export type Phase = 'count' | 'drop' | 'sink' | 'settle' | 'bob' | 'glitch' | 'blackout' | 'done';

export interface Frame {
  phase: Phase;
  /** 카메라(=추) 수심 m. 입수 전 0 */
  depth: number;
  /** 0~1 수심 진행도 (MAX 기준) — 기포·드론 등 */
  depthRatio: number;
  /** 화면상 수면 높이 (비율). 화면 밖이면 < 0 */
  surfaceY: number;
  /** 추 중심 높이 (비율) */
  weightY: number;
  /** 해저면 높이 (비율). 1 이상이면 안 보임 */
  seabedY: number;
  /** 침강 속도 0~1 (마린 스노우 흐름) */
  speed: number;
  /** 열수구 붉은빛 0~1 */
  vent: number;
  /** 글리치 강도 0~1 */
  glitch: number;
  /** 암전 0~1 */
  black: number;
}

export function sinkDuration(depth: number, kind: MeasureKind): number {
  if (kind === 'void') return VOID_SINK;
  return clamp(3 + 9 * Math.sqrt(depth / MAX_DEPTH), 3, 12);
}

export function totalDuration(depth: number, kind: MeasureKind): number {
  if (kind === 'float') return T_DROP + T_BOB;
  if (kind === 'void') return T_DROP + VOID_SINK + T_GLITCH + T_BLACKOUT;
  return T_DROP + sinkDuration(depth, kind) + T_SETTLE;
}

function dropFrame(t: number, kind: MeasureKind): Pick<Frame, 'surfaceY' | 'weightY'> {
  if (t < T_IMPACT) {
    // easeInBack: 다이빙대에서 뛰듯 살짝 솟았다가 가속해 떨어진다
    return { surfaceY: SURFACE_START_Y, weightY: lerp(HANG_Y, SURFACE_START_Y, easeInBack(t / T_IMPACT)) };
  }
  if (kind === 'float') {
    // 입수 직후 살짝 잠겼다가 떠오른다
    const u = (t - T_IMPACT) / (T_DROP - T_IMPACT);
    return { surfaceY: SURFACE_START_Y, weightY: SURFACE_START_Y - 0.01 + Math.sin(u * Math.PI) * 0.035 };
  }
  const u = easeInOutSine((t - T_IMPACT) / (T_DROP - T_IMPACT));
  return { surfaceY: lerp(SURFACE_START_Y, -0.35, u), weightY: lerp(SURFACE_START_Y, WEIGHT_REST_Y, u) };
}

export function frameAt(t: number, target: number, kind: MeasureKind, hot: boolean): Frame {
  const base: Frame = {
    phase: 'drop', depth: 0, depthRatio: 0, surfaceY: SURFACE_START_Y, weightY: HANG_Y,
    seabedY: 1.3, speed: 0, vent: 0, glitch: 0, black: 0,
  };

  if (t < 0) return { ...base, phase: 'count' };

  if (t < T_DROP) {
    const d = dropFrame(t, kind);
    const entering = kind !== 'float' && t > T_IMPACT;
    const speed = entering ? invLerp(T_IMPACT, T_DROP, t) * 0.6 : 0;
    return { ...base, ...d, speed };
  }

  if (kind === 'float') {
    const u = t - T_DROP;
    const bobY = SURFACE_START_Y - 0.01 + Math.sin(u * 2.4) * 0.008;
    return {
      ...base,
      phase: u < T_BOB ? 'bob' : 'done',
      depth: Math.max(0, target),
      surfaceY: SURFACE_START_Y,
      weightY: bobY,
    };
  }

  const sinkT = sinkDuration(target, kind);
  const ts = t - T_DROP;

  if (kind === 'void') {
    if (ts < sinkT) {
      // 감속 없이 계속 가속: 바닥이 없다
      const u = ts / sinkT;
      const depth = MAX_DEPTH * u ** 1.7;
      return { ...base, phase: 'sink', depth, depthRatio: depth / MAX_DEPTH, surfaceY: -1, weightY: WEIGHT_REST_Y, speed: clamp(0.6 + u, 0, 1.4) };
    }
    const tg = ts - sinkT;
    if (tg < T_GLITCH) {
      const g = tg / T_GLITCH;
      return {
        ...base, phase: 'glitch',
        depth: MAX_DEPTH + (g * g * 40000),
        depthRatio: 1, surfaceY: -1, weightY: WEIGHT_REST_Y + g * 0.7, speed: 1.6, glitch: 0.35 + g * 0.65,
      };
    }
    const tb = tg - T_GLITCH;
    return {
      ...base, phase: tb < T_BLACKOUT ? 'blackout' : 'done',
      depth: MAX_DEPTH, depthRatio: 1, surfaceY: -1, weightY: 1.3, glitch: 0, black: clamp(tb / 0.25, 0, 1),
    };
  }

  if (ts < sinkT) {
    const u = ts / sinkT;
    const depth = target * easeDive(u);
    // 마지막 22% 구간에서 해저면이 아래에서 올라온다
    const seabedU = invLerp(0.78, 1, u);
    const vent = hot ? easeOutCubic(invLerp(Math.max(0, 1 - 1.5 / sinkT), 1, u)) : 0;
    return {
      ...base, phase: 'sink', depth, depthRatio: depth / MAX_DEPTH,
      surfaceY: -1,
      weightY: lerp(WEIGHT_REST_Y, LAND_Y, easeOutCubic(seabedU)),
      seabedY: seabedU > 0 ? lerp(1.15, BED_Y, easeOutCubic(seabedU)) : 1.3,
      speed: clamp(easeDiveVelocity(u) / 2.1, 0.04, 1),
      vent,
    };
  }

  const tt = ts - sinkT;
  return {
    ...base, phase: tt < T_SETTLE ? 'settle' : 'done',
    depth: target, depthRatio: target / MAX_DEPTH, surfaceY: -1, weightY: LAND_Y,
    seabedY: BED_Y, vent: hot ? 1 : 0,
  };
}

/** 건너뛰기 / reduced-motion 용 최종 프레임 */
export function finalFrame(target: number, kind: MeasureKind, hot: boolean): Frame {
  return frameAt(totalDuration(target, kind) + 1, target, kind, hot);
}
