export * from './types';
export { decodeCode, encodeScores, normalizeCode } from './codec';
export { computeDepth, mapDepth, rawMax, isUnmeasurable } from './depth';
export { normalizePair, pairJitter } from './pair';
export { ZONES, VOID_ZONE, ZONE_LIFE, zoneOf, zoneById, waterColor, type Zone, type ZoneId, type CreatureId } from './zones';
export { ARCHETYPES, matchArchetype } from './archetype';
export { temperatureOf, type Temperature, type TempId } from './temperature';
export { measure, type MeasureResult, type MeasureKind } from './measure';
export { explain, AXIS_INFO, anchorFor, type Explanation, type PullItem } from './explain';
