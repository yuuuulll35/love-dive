/** 공개 사이트 주소 (vite.config 의 SITE_URL) */
export const SITE_URL: string = __SITE_URL__;

/** 공개 사이트에서 연 결과면 미리보기 페이지를 거치는 공유 주소, 아니면(미리보기·로컬) 지금 주소 그대로 */
export function shareUrl(key: string): string {
  const here = location.origin + location.pathname;
  return here === SITE_URL ? `${SITE_URL}s/${key}/${location.hash}` : location.href;
}
