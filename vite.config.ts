/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { abyssTables } from './tools/vite-plugin-abyss-tables.ts';

// @fontsource CSS 의 woff 폴백을 지워 woff2 만 내보낸다 (번들 파일 수 절반)
const woff2Only = (): Plugin => ({
  name: 'woff2-only',
  enforce: 'pre',
  transform(code, id) {
    if (!/@fontsource[\\/].+\.css$/.test(id)) return;
    return code.replace(/,\s*url\([^)]+\.woff\) format\('woff'\)/g, '');
  },
});

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  // 상대 경로 → 어떤 하위 경로(GitHub Pages 등)에 올려도 동작
  base: './',
  plugins: [woff2Only(), abyssTables(), svelte()],
  resolve: {
    alias: {
      $app: r('./src/app'),
      $pages: r('./src/pages'),
      $widgets: r('./src/widgets'),
      $features: r('./src/features'),
      $entities: r('./src/entities'),
      $shared: r('./src/shared'),
    },
  },
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
