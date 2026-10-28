import { toCanvas } from 'html-to-image';

/**
 * 한글 웹폰트는 unicode-range 로 수십~수백 조각에 나뉘어 있어서 html-to-image 기본 동작으로는
 * 전부 내려받는다. 카드에 실제로 쓰인 글자가 포함된 조각만 골라 data URL 로 인라인한다.
 */
async function buildFontEmbedCSS(node: HTMLElement): Promise<string> {
  const used = new Set<number>();
  for (const ch of node.innerText) used.add(ch.codePointAt(0)!);

  const rules: CSSFontFaceRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let list: CSSRuleList;
    try {
      list = sheet.cssRules;
    } catch {
      continue; // cross-origin
    }
    for (const rule of Array.from(list)) {
      if (rule instanceof CSSFontFaceRule && rangeHits(rule.style.getPropertyValue('unicode-range'), used)) {
        rules.push(rule);
      }
    }
  }

  const css = await Promise.all(
    rules.map(async (rule) => {
      const src = rule.style.getPropertyValue('src');
      const m = src.match(/url\(["']?([^"')]+\.woff2)["']?\)/) ?? src.match(/url\(["']?([^"')]+)["']?\)/);
      if (!m) return '';
      try {
        const url = new URL(m[1], rule.parentStyleSheet?.href ?? location.href).href;
        const dataUrl = await toDataUrl(url);
        const st = rule.style;
        const range = st.getPropertyValue('unicode-range');
        return `@font-face{font-family:${st.getPropertyValue('font-family')};font-style:${st.getPropertyValue('font-style') || 'normal'};font-weight:${st.getPropertyValue('font-weight') || '400'};src:url(${dataUrl});${range ? `unicode-range:${range};` : ''}}`;
      } catch {
        return '';
      }
    }),
  );
  return css.join('\n');
}

function rangeHits(range: string, used: Set<number>): boolean {
  if (!range) return true;
  for (const part of range.split(',')) {
    const p = part.trim().replace(/^U\+/i, '');
    let lo: number, hi: number;
    if (p.includes('?')) {
      lo = parseInt(p.replace(/\?/g, '0'), 16);
      hi = parseInt(p.replace(/\?/g, 'F'), 16);
    } else if (p.includes('-')) {
      const [a, b] = p.split('-');
      lo = parseInt(a, 16);
      hi = parseInt(b.replace(/^U\+/i, ''), 16);
    } else {
      lo = hi = parseInt(p, 16);
    }
    for (const cp of used) if (cp >= lo && cp <= hi) return true;
  }
  return false;
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/**
 * html-to-image 는 font-size 를 내림(15.5px → 14.9px)하면서 높이는 원본 px 그대로 복사한다.
 * 그러면 줄바꿈이 달라져 빈 줄이 생기므로, 높이 계열 속성은 빼고 복제본이 스스로 흐르게 한다.
 */
// grid 컨테이너는 계산된 행 높이(px)까지 복사되므로 함께 뺀다
const SKIP_PROPS = new Set(['height', 'block-size', 'min-height', 'min-block-size', 'grid-template-rows']);
function styleProperties(): string[] {
  return Array.from(getComputedStyle(document.documentElement)).filter((p) => !SKIP_PROPS.has(p));
}

export async function renderCardBlob(node: HTMLElement): Promise<Blob> {
  await document.fonts?.ready;
  const fontEmbedCSS = await buildFontEmbedCSS(node);
  const canvas = await toCanvas(node, {
    includeStyleProperties: styleProperties(),
    pixelRatio: Math.min(3, Math.max(2, devicePixelRatio || 2)),
    fontEmbedCSS,
    cacheBust: false,
    // 그림자는 카드 밖 여백으로 찍히므로 저장본에서는 뺀다
    style: { boxShadow: 'none', margin: '0' },
    filter: (el) => !(el instanceof HTMLElement && el.dataset.noCapture !== undefined),
  });
  const framed = onBackdrop(trimBottom(canvas), node.dataset.tier ?? 'light');
  const blob = await new Promise<Blob | null>((resolve) => framed.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('render failed');
  return blob;
}

// 저장본 배경: 우표를 올려 둔 종이·물빛 바탕 (깊이 분위기와 같은 색)
const BACKDROPS: Record<string, [string, string]> = {
  light: ['#ffdfe8', '#d6f0fb'],
  soft: ['#cfe6f4', '#7fb3d6'],
  deep: ['#1a2a55', '#060c22'],
  abyss: ['#141722', '#020306'],
  void: ['#1a0a10', '#020102'],
};

/** 카드를 여백 있는 배경 위에 그림자와 함께 올린다 (인스타 4:5 비율에 가깝게 위아래 여백을 맞춤) */
function onBackdrop(card: HTMLCanvasElement, tier: string): HTMLCanvasElement {
  const pad = Math.round(card.width * 0.12);
  const width = card.width + pad * 2;
  const height = Math.max(card.height + pad * 2, Math.round(width * 1.25));
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;
  const [top, bottom] = BACKDROPS[tier] ?? BACKDROPS.light;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  const x = pad;
  const y = Math.round((height - card.height) / 2);
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)';
  ctx.shadowBlur = pad * 0.5;
  ctx.shadowOffsetY = pad * 0.18;
  ctx.drawImage(card, x, y);
  ctx.restore();
  return out;
}

/** 복제본은 글자 크기 내림 때문에 원본보다 살짝 짧게 그려진다 → 아래쪽 빈 줄을 잘라 낸다 */
function trimBottom(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext('2d');
  if (!ctx) return src;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let bottom = height;
  outer: for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x += 2) {
      if (data[(y * width + x) * 4 + 3] > 0) break outer;
    }
    bottom = y;
  }
  if (bottom >= height || bottom === 0) return src;
  const out = document.createElement('canvas');
  out.width = width;
  out.height = bottom;
  out.getContext('2d')!.drawImage(src, 0, 0);
  return out;
}

/** 모바일은 공유 시트(사진 앱에 저장 가능), 데스크톱은 다운로드 */
export async function saveCardImage(node: HTMLElement, filename: string): Promise<'shared' | 'downloaded'> {
  const blob = await renderCardBlob(node);
  const file = new File([blob], filename, { type: 'image/png' });
  const coarse = matchMedia('(pointer: coarse)').matches;
  if (coarse && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'LOVE DIVE' });
      return 'shared';
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
