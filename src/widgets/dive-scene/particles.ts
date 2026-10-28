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
  /** 카메라가 내려간 누적 거리(px). 생물이 제 깊이에 머물도록 DiveScene 이 읽는다 */
  get scrollPx() {
    return this.scroll;
  }
  private sparkAcc = 0;
  private time = 0;

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
    this.time = time;

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

    // 표층: 햇빛 반짝임
    if (underwater && f.depth < 180 && f.phase !== 'done') {
      this.sparkAcc += dt * 5;
      while (this.sparkAcc >= 1) {
        this.sparkAcc -= 1;
        const top = Math.max(0, surfacePx + 20);
        this.ps.push({
          kind: 'glow', x: Math.random() * this.w, y: top + Math.random() * (H - top) * 0.55,
          vx: 0, vy: 0, r: 0.5 + Math.random() * 0.8, life: 0, max: 0.6 + Math.random() * 0.8, a: 0.9, seed: 0,
          c: '255,255,240',
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
    this.drawWalls(f);

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
   * 양옆 암벽: 수면 바로 아래부터 시작해 카메라와 함께 흘러간다(내려가는 느낌의 기준점).
   * 얕은 곳은 산호초 바위(산호·부채산호·다시마·말미잘과 흰동가리), 깊어질수록 어두운 절벽,
   * 초심해에서는 좁은 해구가 된다. 먼 층은 느리게, 가까운 층은 빠르게 흘러 깊이감이 생긴다.
   */
  private drawWalls(f: Frame) {
    const { ctx, w, h } = this;
    const top = f.surfaceY < 0.98 ? Math.max(-10, f.surfaceY * h + 24) : h + 1;
    if (top >= h) return;
    const d = f.depth;
    const reach = 0.12 + smooth(1500, 6000, d) * 0.05 + smooth(6000, 9500, d) * 0.12;
    // 바위 색: 얕은 곳 청록빛 바위 → 깊은 곳 거의 검정
    const k = smooth(80, 1500, d);
    const mix = (a: number[], b: number[]) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const near = mix([36, 96, 104], [2, 4, 10]);
    const far = mix([96, 170, 176], [120, 150, 200]);
    const nearA = 0.92 - k * 0.2;
    const farA = 0.4 - k * 0.33;

    const layers = [
      { speed: 0.45, width: reach * 1.3, fill: `rgba(${far},${farA})`, rim: null as string | null, seed: 1.7, decor: false },
      {
        speed: 1, width: reach, fill: `rgba(${near},${nearA})`,
        rim: k < 0.5 ? `rgba(255,255,240,${0.22 * (1 - k * 2)})` : 'rgba(127,246,228,0.10)', seed: 4.2, decor: true,
      },
    ];

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top, w, h - top + 20);
    ctx.clip();
    for (const L of layers) {
      for (const side of [0, 1]) {
        const seed = L.seed + side * 9.1;
        const edge = (y: number) => {
          const yw = y + this.scroll * L.speed;
          return w * (L.width + 0.035 * Math.sin(yw / 95 + seed) + 0.022 * Math.sin(yw / 41 + seed * 2.3) + 0.01 * Math.sin(yw / 13 + seed * 3.1));
        };
        const x0 = side ? w : 0;
        ctx.beginPath();
        ctx.moveTo(x0, top - 10);
        for (let y = top - 10; y <= h + 10; y += 10) {
          const e = Math.max(0, edge(y));
          ctx.lineTo(side ? w - e : e, y);
        }
        ctx.lineTo(x0, h + 10);
        ctx.closePath();
        ctx.fillStyle = L.fill;
        ctx.fill();
        if (L.rim) {
          ctx.strokeStyle = L.rim;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        if (L.decor) this.drawReef(side, edge, top, L.speed, d);
      }
    }
    ctx.restore();
  }

  /** 얕은 바다의 바위 턱에 붙은 생물. 바위와 같이 흘러간다 */
  private drawReef(side: number, edge: (y: number) => number, top: number, speed: number, depth: number) {
    const fade = 1 - smooth(140, 420, depth);
    if (fade <= 0.02) return;
    const { ctx, w, h } = this;
    const SPACING = 118;
    const offset = this.scroll * speed;
    const first = Math.floor((top + offset) / SPACING) - 1;
    const last = Math.ceil((h + offset) / SPACING) + 1;
    const dir = side ? -1 : 1;
    ctx.save();
    ctx.globalAlpha = fade;
    for (let i = first; i <= last; i++) {
      const y = i * SPACING - offset + (side ? SPACING / 2 : 0);
      if (y < top - 40 || y > h + 60) continue;
      const e = Math.max(0, edge(y));
      const x = side ? w - e : e;
      const kind = (((i * 7 + side * 3) % 5) + 5) % 5;
      const sway = Math.sin(this.time * 1.6 + i) * 0.12;
      ctx.save();
      ctx.translate(x - dir * 2, y);
      ctx.scale(dir, 1);
      ctx.rotate(sway * (kind === 3 ? 1.6 : 0.6));
      switch (kind) {
        case 0: this.coral(); break;
        case 1: this.fan(); break;
        case 2: this.anemone(i); break;
        case 3: this.kelp(); break;
        case 4: this.coral('#ffb37a', '#ffd9b0'); break;
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // 아래 그림들은 바위 턱(0,0)에서 안쪽(+x)·위쪽(-y)으로 자란다
  private coral(color = '#ff8fa3', tip = '#ffd1db') {
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(14, -16); ctx.lineTo(16, -34);
    ctx.moveTo(14, -16); ctx.lineTo(30, -24); ctx.lineTo(36, -38);
    ctx.moveTo(30, -24); ctx.lineTo(44, -22);
    ctx.moveTo(6, -6); ctx.lineTo(4, -24);
    ctx.stroke();
    ctx.fillStyle = tip;
    for (const [px, py] of [[16, -34], [36, -38], [44, -22], [4, -24]]) {
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  private fan() {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(176,140,230,0.9)';
    ctx.lineWidth = 1.6;
    for (let a = -1.4; a <= 0.2; a += 0.22) {
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(4 + Math.cos(a) * 18, Math.sin(a) * 18, 4 + Math.cos(a) * 34, Math.sin(a) * 34);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(4, 0, 34, -1.45, 0.25);
    ctx.stroke();
  }

  private anemone(i: number) {
    const { ctx } = this;
    ctx.strokeStyle = '#ff9ec4';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let k = 0; k < 7; k++) {
      const a = -1.9 + k * 0.32 + Math.sin(this.time * 2 + k) * 0.08;
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.quadraticCurveTo(10 + Math.cos(a) * 10, -2 + Math.sin(a) * 12, 10 + Math.cos(a) * 22, -2 + Math.sin(a) * 22);
      ctx.stroke();
    }
    ctx.fillStyle = '#e9799f';
    ctx.beginPath(); ctx.ellipse(10, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    // 흰동가리: 말미잘 곁을 맴돈다
    const t = this.time * 1.3 + i;
    const fx = 34 + Math.cos(t) * 8;
    const fy = -22 + Math.sin(t * 1.4) * 5;
    const facing = Math.sin(t) > 0 ? -1 : 1;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(facing, 1);
    ctx.fillStyle = '#ff8a3d';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 4.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(12, -4); ctx.lineTo(12, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(-3, 4); ctx.moveTo(2, -4.4); ctx.lineTo(2, 4.4); ctx.stroke();
    ctx.fillStyle = '#1b2333';
    ctx.beginPath(); ctx.arc(-5.5, -0.8, 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  private kelp() {
    const { ctx } = this;
    ctx.strokeStyle = 'rgba(56,158,112,0.95)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let y = 0; y >= -90; y -= 10) ctx.lineTo(6 + Math.sin(y / 14 + this.time * 1.5) * 4, y);
    ctx.stroke();
    ctx.fillStyle = 'rgba(74,176,124,0.9)';
    for (let y = -18; y >= -84; y -= 22) {
      const x = 6 + Math.sin(y / 14 + this.time * 1.5) * 4;
      ctx.beginPath(); ctx.ellipse(x + 8, y, 9, 3.6, -0.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}
