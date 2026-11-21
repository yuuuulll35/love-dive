/** 링크 미리보기 페이지(s/<key>/) 이름: 구간 × 칭호. 빌드 플러그인(tools/vite-plugin-share-pages.ts)과 같이 쓴다 */
export const sharePageKey = (zoneId: string, archetypeId: string | null) => `${zoneId}-${archetypeId ?? 'base'}`;
