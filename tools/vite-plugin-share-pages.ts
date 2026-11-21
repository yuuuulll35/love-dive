import type { Plugin } from 'vite';
import { ARCHETYPES } from '../src/entities/abyss/archetype';
import { VOID_ZONE, ZONES } from '../src/entities/abyss/zones';
import { DEFAULT_TITLE_LINES } from '../src/shared/config/copy';
import { sharePageKey } from '../src/features/share-result/share-key';

/**
 * 링크 미리보기용 공유 페이지. 결과 주소(#dive-…)의 해시는 미리보기를 만드는 쪽(카톡·디스코드·X 등)에
 * 전달되지 않으므로, 결과 종류(구간 × 칭호)마다 og 태그만 다른 작은 페이지를 s/<key>/ 로 미리 만든다.
 * 열리면 해시를 그대로 들고 본 페이지로 넘어간다.
 */
interface Share {
  key: string;
  image: string;
  title: string;
  description: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function shares(): Share[] {
  const list: Share[] = [];
  const add = (zoneId: string, archetypeId: string | null, headline: string, title: string, line: string) =>
    list.push({
      key: sharePageKey(zoneId, archetypeId),
      image: zoneId,
      title: `${headline} · 「${title}」`,
      description: `${line}. 두 사람의 사랑은 몇 미터까지 가라앉을까? 우리도 재 보기 →`,
    });

  add('float', null, '우리 사랑은 아직 수면 위에 떠 있대', ZONES[0].defaultTitle, DEFAULT_TITLE_LINES.float);
  for (const z of ZONES.slice(1)) {
    const headline = `우리 사랑은 ${z.name}까지 가라앉았대`;
    add(z.id, null, headline, z.defaultTitle, DEFAULT_TITLE_LINES[z.id]);
    for (const a of ARCHETYPES) add(z.id, a.id, headline, a.title, a.line);
  }
  add('void', null, '우리 사랑은 바다로도 잴 수 없대', VOID_ZONE.defaultTitle, DEFAULT_TITLE_LINES.void);
  return list;
}

function page(s: Share, site: string) {
  const url = `${site}s/${s.key}/`;
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(s.title)} | LOVE DIVE</title>
<meta name="description" content="${esc(s.description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="LOVE DIVE" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(s.title)}" />
<meta property="og:description" content="${esc(s.description)}" />
<meta property="og:image" content="${site}og/${s.image}.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="theme-color" content="#22305a" />
<link rel="icon" href="../../favicon.svg" type="image/svg+xml" />
<script>location.replace('../../' + location.hash);</script>
</head>
<body><a href="../../">LOVE DIVE 열기</a></body>
</html>
`;
}

export function sharePages(site: string): Plugin {
  return {
    name: 'share-pages',
    apply: 'build',
    generateBundle() {
      for (const s of shares()) {
        this.emitFile({ type: 'asset', fileName: `s/${s.key}/index.html`, source: page(s, site) });
      }
    },
  };
}
