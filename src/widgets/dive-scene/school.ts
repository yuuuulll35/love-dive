/**
 * 물고기 떼 (boids: 분리·정렬·응집). 화면을 가로지르며 함께 방향을 틀고,
 * 카메라가 내려가면 제 깊이에 머무르도록 위로 밀려 올라간다.
 * 물고기마다 꼬리 흔들림 위상이 달라 떼가 기계적으로 보이지 않는다.
 */
interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  size: number;
}

export type SchoolStyle = 'silver' | 'tropical' | 'lantern';

const TROPICAL = ['255,216,77', '79,182,255', '255,138,76'];

export class School {
  fish: Fish[] = [];
  private dir: number;
  private goalY: number;
  done = false;

  constructor(
    private w: number,
    private h: number,
    public style: SchoolStyle,
    count: number,
  ) {
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.goalY = h * (0.3 + Math.random() * 0.4);
    const x0 = this.dir > 0 ? -60 : w + 60;
    for (let i = 0; i < count; i++) {
      this.fish.push({
        x: x0 - this.dir * Math.random() * 120,
        y: this.goalY + (Math.random() - 0.5) * 90,
        vx: this.dir * (60 + Math.random() * 20),
        vy: (Math.random() - 0.5) * 20,
        phase: Math.random() * Math.PI * 2,
        size: style === 'silver' ? 0.8 + Math.random() * 0.5 : 0.9 + Math.random() * 0.4,
      });
    }
  }

  update(dt: number, lift: number, time: number) {
    const F = this.fish;
    // 목표 높이가 천천히 출렁여 떼 전체가 굽이친다
    const goal = this.goalY + Math.sin(time * 0.8) * 60;
    for (const a of F) {
      let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
      for (const b of F) {
        if (a === b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 70 * 70) continue;
        n++;
        ax += b.vx; ay += b.vy;
        cx += b.x; cy += b.y;
        if (d2 < 14 * 14) { sx -= dx; sy -= dy; }
      }
      if (n) {
        a.vx += ((ax / n - a.vx) * 0.6 + (cx / n - a.x) * 0.35 + sx * 3) * dt;
        a.vy += ((ay / n - a.vy) * 0.6 + (cy / n - a.y) * 0.35 + sy * 3) * dt;
      }
      // 가는 방향으로 계속 헤엄치고, 목표 높이로 서서히 모인다
      a.vx += (this.dir * 75 - a.vx) * 0.4 * dt;
      a.vy += (goal - a.y) * 0.25 * dt;
      const sp = Math.hypot(a.vx, a.vy);
      const max = 110;
      if (sp > max) { a.vx *= max / sp; a.vy *= max / sp; }
      a.x += a.vx * dt;
      a.y += a.vy * dt - lift;
      a.phase += dt * (10 + sp * 0.05);
    }
    this.goalY -= lift;
    const gone = F.every((f) => (this.dir > 0 ? f.x > this.w + 40 : f.x < -40) || f.y < -60);
    if (gone) this.done = true;
  }

  draw(ctx: CanvasRenderingContext2D, alpha: number) {
    for (let i = 0; i < this.fish.length; i++) {
      const f = this.fish[i];
      const ang = Math.atan2(f.vy, f.vx);
      const wag = Math.sin(f.phase) * 0.45;
      const s = f.size;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(ang);
      let body = `rgba(200,225,240,${0.75 * alpha})`;
      if (this.style === 'tropical') body = `rgba(${TROPICAL[i % 3]},${0.95 * alpha})`;
      if (this.style === 'lantern') body = `rgba(14,26,52,${0.9 * alpha})`;
      ctx.fillStyle = body;
      // 몸통
      ctx.beginPath();
      ctx.ellipse(0, 0, 8 * s, 3 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      // 꼬리 (흔들림)
      ctx.save();
      ctx.translate(-7 * s, 0);
      ctx.rotate(wag);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-6 * s, -3.4 * s);
      ctx.lineTo(-6 * s, 3.4 * s);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (this.style === 'silver') {
        // 햇빛에 비늘이 번쩍
        const glint = Math.max(0, Math.sin(f.phase * 0.3 + i)) ** 6;
        ctx.fillStyle = `rgba(255,255,255,${(0.25 + glint * 0.7) * alpha})`;
        ctx.beginPath();
        ctx.ellipse(1 * s, -1 * s, 4 * s, 1 * s, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.style === 'tropical') {
        ctx.strokeStyle = `rgba(255,255,255,${0.85 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(1 * s, -2.8 * s); ctx.lineTo(1 * s, 2.8 * s);
        ctx.stroke();
      } else {
        // 샛비늘치: 배 쪽 발광점
        ctx.fillStyle = `rgba(143,216,255,${(0.6 + Math.sin(f.phase * 0.2 + i) * 0.4) * alpha})`;
        ctx.beginPath(); ctx.arc(-1 * s, 2 * s, 1.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(3 * s, 2.2 * s, 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }
}
