import type { Plugin } from 'vite';
import * as source from './abyss-tables.source.ts';

const VIRTUAL_ID = 'virtual:abyss-tables';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/** 런타임 decodePayload(shared/config/tables.ts)와 짝을 이루는 인코더. 보안 목적이 아니라 평문 노출 방지용. */
export function encodePayload(data: unknown, seed: number): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let x = seed >>> 0 || 0x9e3779b9;
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    out[bytes.length - 1 - i] = bytes[i] ^ (x & 0xff);
  }
  const b64 = Buffer.from(out).toString('base64').replace(/=+$/, '');
  return seed.toString(36).padStart(7, '0') + b64.split('').reverse().join('');
}

export function abyssTables(): Plugin {
  return {
    name: 'love-dive:abyss-tables',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;
      const data = {
        a: source.SLOT_AXES,
        t: source.SLOT_TABLES,
        w: source.WEIGHTS,
        c: source.COEF,
        q: source.CALIBRATION,
        n: source.NOISE_CHARSET,
        e: source.EXAMPLE_CODE,
      };
      const seed = 0x5eed_0b5 ^ source.SLOT_TABLES.join('').length * 2654435761;
      return `export const payload = ${JSON.stringify(encodePayload(data, seed >>> 0))};`;
    },
  };
}
