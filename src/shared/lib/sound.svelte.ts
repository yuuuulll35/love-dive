/**
 * 효과음: 에셋 없이 WebAudio 로 합성한다. 기본 OFF, 토글 상태는 브라우저에만 기억.
 */
const KEY = 'love-dive:sound';

function readPref(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

class Sound {
  enabled = $state(readPref());
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: { stop: () => void; setDepth: (x: number) => void } | null = null;

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(KEY, this.enabled ? '1' : '0');
    } catch {
      /* 저장 실패해도 동작엔 지장 없음 */
    }
    if (this.enabled) this.ensure();
    else this.stopDrone();
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private noise(ctx: AudioContext, seconds: number) {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  /** 입수: 저역 '퐁' + 필터드 노이즈 물보라 */
  splash() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;

    const o = ctx.createOscillator();
    const og = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.4);

    const n = this.noise(ctx, 0.9);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(2400, t);
    f.frequency.exponentialRampToValueAtTime(500, t + 0.8);
    f.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    n.connect(f).connect(ng).connect(this.master);
    n.start(t);
  }

  /** 수중 저음 드론. 깊어질수록 낮고 어두워진다 */
  startDrone() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.drone) return;
    const t = ctx.currentTime;
    const n = this.noise(ctx, 4);
    n.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 520;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 55;
    const og = ctx.createGain();
    og.gain.value = 0.12;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 1.2);
    n.connect(lp).connect(g);
    o.connect(og).connect(g);
    g.connect(this.master);
    n.start(t);
    o.start(t);
    this.drone = {
      setDepth: (x) => {
        const now = ctx.currentTime;
        lp.frequency.setTargetAtTime(520 - 420 * x, now, 0.2);
        o.frequency.setTargetAtTime(55 - 22 * x, now, 0.3);
      },
      stop: () => {
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, 0.25);
        n.stop(now + 1.2);
        o.stop(now + 1.2);
      },
    };
  }

  setDepth(x: number) {
    this.drone?.setDepth(x);
  }

  stopDrone() {
    this.drone?.stop();
    this.drone = null;
  }

  /** 구간 통과: 소나 핑 */
  ping(pitch = 1) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 1180 * pitch;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    const d = ctx.createDelay();
    d.delayTime.value = 0.32;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    o.connect(g);
    g.connect(this.master);
    g.connect(d);
    d.connect(fb).connect(d);
    d.connect(this.master);
    o.start(t);
    o.stop(t + 1.7);
  }

  /** 착저: 둔탁한 쿵 */
  thud() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.6, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.7);
  }

  /** 측정 불가: 디지털 노이즈 */
  glitch() {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime;
    const n = this.noise(ctx, 0.6);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800;
    const g = ctx.createGain();
    for (let i = 0; i < 10; i++) g.gain.setValueAtTime(i % 2 ? 0.0001 : 0.22, t + i * 0.05);
    g.gain.setValueAtTime(0.0001, t + 0.55);
    n.connect(f).connect(g).connect(this.master);
    n.start(t);
  }
}

export const sound = new Sound();
