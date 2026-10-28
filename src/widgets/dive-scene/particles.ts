import type { Frame } from './timeline';

interface P {
  x: number; y: number; vx: number; vy: number;
  r: number; life: number; max: number; kind: 'snow' | 'bubble' | 'drop' | 'dust' | 'glow';
  a: number; seed: number;
  /** 발광 색 (r,g,b) */
  c?: string;
}

/** 생물 발광 색: 청록이 가장 흔하고, 깊을수록 파랑·보라·분홍이 섞인다 */
const GLOW_COLORS = ['127,246,228', '127,246,228', '143,190,255', '196,160,255', '255,160,206'];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

interface Ripple {
  x: number; age: number; max: number; w: number;
}

/**
 * 캔버스 하나에 모든 입자를 그린다. 좌표는 CSS px.
 * 카메라가 내려가는 느낌은 입자를 위로 흘려서 만든다 (speed × px/s).
 */
export class Particles {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private ps: P[] = [];
  private ripples: Ripple[] = [];
  private bubbleAcc = 0;
  private glowAcc = 0;
  /** 카메라가 내려간 누적 거리(px) — 양옆 암벽 시차 스크롤용 */
  private scroll = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.ps.some((p) => p.kind === 'snow')) this.seedSnow();
  }

  private seedSnow() {
    const n = Math.round((this.w * this.h) / 9000);
    for (let i = 0; i < n; i++) {
      this.ps.push({
        kind: 'snow', x: Math.random() * this.w, y: Math.random() * this.h,
        vx: 0, vy: 0, r: 0.5 + Math.random() * 1.3, life: 0, max: Infinity,
        a: 0.15 + Math.random() * 0.45, seed: Math.random() * 1000,
      });
    }
  }

  splash(x: number, y: number) {
    for (let i = 0; i < 34; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = 140 + Math.random() * 300;
      this.ps.push({
        kind: 'drop', x: x + (Math.random() - 0.5) * 14, y,
        vx: Math.cos(ang) * sp * 0.7, vy: Math.sin(ang) * sp,
        r: 1 + Math.random() * 2.6, life: 0, max: 0.6 + Math.random() * 0.5, a: 0.9, seed: 0,
      });
    }
    for (let i = 0; i < 3; i++) this.ripples.push({ x, age: -i * 0.18, max: 1.6, w: Math.min(this.w * 0.9, 420) });
  }

  bob(x: number) {
    this.ripples.push({ x, age: 0, max: 2.2, w: 140 });
  }

  dust(x: number, y: number) {
    for (let i = 0; i < 46; i++) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      this.ps.push({
        kind: 'dust', x: x + (Math.random() - 0.5) * 20, y: y - Math.random() * 6,
        vx: dir * (20 + Math.random() * 90), vy: -(8 + Math.random() * 34),
        r: 1 + Math.random() * 2.4, life: 0, max: 1.6 + Math.random() * 1.6, a: 0.5, seed: Math.random() * 100,
      });
    }
  }

  update(dt: number, f: Frame, weightX: number, time: number) {
    const H = this.h;
    const flow = f.speed * H * 1.15; // px/s, 카메라 하강 속도
    const surfacePx = f.surfaceY * H;
    const wy = f.weightY * H;
    const underwater = f.surfaceY < 0.98;
    this.scroll += flow * dt;

    // 추에서 올라오는 기포: 깊어질수록 적고 작다
    if (f.phase === 'sink' || f.phase === 'settle' || (f.phase === 'drop' && f.weightY > f.surfaceY)) {
      const rate = (16 * (1 - f.depthRatio) ** 1.6 + 1.2) * (f.phase === 'settle' ? 0.3 : 1);
      this.bubbleAcc += rate * dt;
      while (this.bubbleAcc >= 1) {
        this.bubbleAcc -= 1;
        const size = (1.5 + Math.random() * 4.5) * (1 - 0.65 * f.depthRatio);
        this.ps.push({
          kind: 'bubble', x: weightX + (Math.random() - 0.5) * 18, y: wy - 10,
          vx: 0, vy: -(40 + size * 14), r: size, life: 0, max: 4, a: 0.7, seed: Math.random() * 1000,
        });
      }
    }

    // 박광층 이하: 생물 발광 반짝임
    if (f.depth > 250 && f.depth < 7000 && f.phase !== 'blackout') {
      this.glowAcc += dt * 2.2;
      while (this.glowAcc >= 1) {
        this.glowAcc -= 1;
        const deepMix = Math.min(GLOW_COLORS.length, 2 + Math.floor((f.depth / 6000) * GLOW_COLORS.length));
        this.ps.push({
          kind: 'glow', x: Math.random() * this.w, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 10, vy: 0, r: 1 + Math.random() * 1.8, life: 0, max: 1.2 + Math.random() * 1.6, a: 0.9, seed: 0,
          c: GLOW_COLORS[Math.floor(Math.random() * deepMix)],
        });
      }
    }

    for (const p of this.ps) {
      p.life += dt;
      switch (p.kind) {
        case 'snow':
          p.y += (8 - flow * (0.5 + p.r * 0.35)) * dt;
          p.x += Math.sin(time * 0.6 + p.seed) * 6 * dt;
          if (p.y < -4) { p.y = H + 4; p.x = Math.random() * this.w; }
          if (p.y > H + 4) p.y = -4;
          break;
        case 'bubble':
          p.y += (p.vy - flow) * dt;
          p.x += Math.sin(time * 5 + p.seed) * 14 * dt;
          if (!underwater || p.y < surfacePx) p.life = p.max;
          break;
        case 'drop':
          p.vy += 900 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.y > surfacePx + 4 && p.vy > 0) p.life = p.max;
          break;
        case 'dust':
          p.vx *= 1 - 1.6 * dt;
          p.vy *= 1 - 1.2 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'glow':
          p.y -= flow * 0.4 * dt;
          p.x += p.vx * dt;
          break;
      }
    }
    this.ps = this.ps.filter((p) => p.life < p.max && p.y > -40);
    for (const r of this.ripples) r.age += dt;
    this.ripples = this.ripples.filter((r) => r.age < r.max);
  }

  draw(f: Frame, opts: { tint: string }) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    const surfacePx = f.surfaceY * this.h;
    const visibleSnow = f.surfaceY < 0.9 ? Math.min(1, 0.4 + f.depthRatio * 3) : 0.35;
    if (f.surfaceY < -0.2) this.drawWalls(f);

    for (const p of this.ps) {
      const fade = p.max === Infinity ? 1 : 1 - p.life / p.max;
      switch (p.kind) {
        case 'snow': {
          if (p.y < surfacePx) continue;
          ctx.fillStyle = `rgba(220,236,240,${p.a * visibleSnow})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'bubble': {
          ctx.strokeStyle = `rgba(220,245,255,${0.55 * fade + 0.1})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = `rgba(255,255,255,${0.35 * fade})`;
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'drop': {
          ctx.fillStyle = `rgba(235,250,255,${0.9 * fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'dust': {
          ctx.fillStyle = `rgba(${opts.tint},${p.a * fade})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + p.life * 0.6), 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'glow': {
          const tw = Math.sin((p.life / p.max) * Math.PI);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
          const c = p.c ?? GLOW_COLORS[0];
          g.addColorStop(0, `rgba(${c},${0.85 * tw})`);
          g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }

    // 동심원 파문 (수면에 붙어 움직인다)
    for (const r of this.ripples) {
      if (r.age < 0) continue;
      const u = r.age / r.max;
      const rx = (r.w / 2) * (0.1 + u * 0.9);
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - u)})`;
      ctx.lineWidth = 1.6 * (1 - u) + 0.4;
      ctx.beginPath();
      ctx.ellipse(r.x, surfacePx + 4, rx, rx * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * 양옆 암벽: 1,000m 부터 조금씩 다가오고, 초심해에서는 좁은 해구가 된다.
   * 먼 층은 느리게, 가까운 층은 빠르게 흘러 깊이감이 생긴다.
   */
  private drawWalls(f: Frame) {
    const { ctx, w, h } = this;
    const reach = smooth(900, 6000, f.depth) * 0.16 + smooth(6000, 9500, f.depth) * 0.12;
    if (reach <= 0.002) return;

    const layers = [
      { speed: 0.45, width: reach * 1.25, fill: 'rgba(120,150,200,0.07)', rim: null, seed: 1.7 },
      { speed: 1, width: reach, fill: 'rgba(2,4,10,0.72)', rim: 'rgba(127,246,228,0.10)', seed: 4.2 },
    ];
    for (const L of layers) {
      for (const side of [0, 1]) {
        const seed = L.seed + side * 9.1;
        const edge = (y: number) => {
          const yw = (y + this.scroll * L.speed) / 1;
          return w * (L.width + 0.035 * Math.sin(yw / 95 + seed) + 0.022 * Math.sin(yw / 41 + seed * 2.3) + 0.01 * Math.sin(yw / 13 + seed * 3.1));
        };
        ctx.beginPath();
        const x0 = side ? w : 0;
        ctx.moveTo(x0, -10);
        for (let y = -10; y <= h + 10; y += 10) {
          const e = Math.max(0, edge(y));
          ctx.lineTo(side ? w - e : e, y);
        }
        ctx.lineTo(x0, h + 10);
        ctx.closePath();
        ctx.fillStyle = L.fill;
        ctx.fill();
        if (L.rim) {
          ctx.strokeStyle = L.rim;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }
}
