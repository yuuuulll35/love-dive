/**
 * 페어 이미지: 메모리에만 둔다 (URL·서버로 보내지 않음).
 * 해시 라우팅이라 페이지 이동 사이에는 유지되고, 새로고침하거나 공유 링크로 열면 없다.
 */
class PairImage {
  url = $state<string | null>(null);
  name = $state('');
  /** 이 이미지와 함께 측정한 결과 토큰. 다른 결과(공유 링크 등)에는 붙이지 않는다 */
  token = $state<string | null>(null);

  /** 측정 직전에 호출: 지금 이미지를 이 결과에 묶는다 */
  attach(token: string) {
    this.token = this.url ? token : null;
  }

  for(token: string): string | null {
    return this.url && this.token === token ? this.url : null;
  }

  set(url: string, name: string) {
    this.url = url;
    this.name = name;
  }

  clear() {
    this.url = null;
    this.name = '';
    this.token = null;
  }
}

export const pairImage = new PairImage();

const MAX_SIDE = 720;
const MAX_BYTES = 15 * 1024 * 1024;

/** 배경 없는 PNG → 긴 변 720px 이하 PNG data URL (투명도 유지). 측심추 자리에 매달리므로 PNG 만 받는다 */
export async function loadImageFile(file: File): Promise<string> {
  if (file.type !== 'image/png') throw new Error('type');
  if (file.size > MAX_BYTES) throw new Error('size');
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    // 투명 여백을 잘라 내야 측심줄이 그림 윗변에 바로 닿는다
    const box = opaqueBounds(img);
    const scale = Math.min(1, MAX_SIDE / Math.max(box.w, box.h));
    const w = Math.max(1, Math.round(box.w * scale));
    const h = Math.max(1, Math.round(box.h * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(src);
  }
}

/** 알파가 있는 픽셀만 감싸는 사각형. 완전히 투명하면 원본 크기 그대로 */
function opaqueBounds(img: HTMLImageElement): { x: number; y: number; w: number; h: number } {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H).data;
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: W, h: H };
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
