import { toBlob } from 'html-to-image';

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
const SKIP_PROPS = new Set(['height', 'block-size', 'min-height', 'min-block-size']);
function styleProperties(): string[] {
  return Array.from(getComputedStyle(document.documentElement)).filter((p) => !SKIP_PROPS.has(p));
}

export async function renderCardBlob(node: HTMLElement): Promise<Blob> {
  await document.fonts?.ready;
  const fontEmbedCSS = await buildFontEmbedCSS(node);
  const blob = await toBlob(node, {
    includeStyleProperties: styleProperties(),
    pixelRatio: Math.min(3, Math.max(2, devicePixelRatio || 2)),
    fontEmbedCSS,
    cacheBust: false,
    filter: (el) => !(el instanceof HTMLElement && el.dataset.noCapture !== undefined),
  });
  if (!blob) throw new Error('render failed');
  return blob;
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
