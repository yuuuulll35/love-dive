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

/** 이미지 파일 → 긴 변 720px 이하 data URL. PNG 는 투명도를 지키려 PNG 로 유지 */
export async function loadImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('type');
  if (file.size > MAX_BYTES) throw new Error('size');
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    return file.type === 'image/png' || file.type === 'image/gif'
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', 0.9);
  } finally {
    URL.revokeObjectURL(src);
  }
}
