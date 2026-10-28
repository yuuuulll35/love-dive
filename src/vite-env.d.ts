/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'virtual:abyss-tables' {
  export const payload: string;
}

/** vite.config 의 define: 공개 사이트 주소 */
declare const __SITE_URL__: string;
