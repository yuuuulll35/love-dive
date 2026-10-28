export type Platform = 'teapot' | 'double' | 'named';
export type Bracket = 'paren' | 'square' | 'double-paren';

export const PLATFORMS: { id: Platform; label: string; desc: string }[] = [
  { id: 'teapot', label: '티팟', desc: '{char} · {user} 매크로' },
  { id: 'double', label: '{{char}} 형식', desc: '제타·SillyTavern 등' },
  { id: 'named', label: '이름 직접', desc: '매크로 없는 플랫폼' },
];

export const BRACKETS: { id: Bracket; label: string; open: string; close: string }[] = [
  { id: 'paren', label: '( OOC )', open: '(OOC:', close: ')' },
  { id: 'square', label: '[ OOC ]', open: '[OOC:', close: ']' },
  { id: 'double-paren', label: '(( OOC ))', open: '((OOC:', close: '))' },
];

export interface VariantOptions {
  platform: Platform;
  bracket: Bracket;
  charName?: string;
  userName?: string;
}

/** 원문(티팟 · 소괄호)을 플랫폼·괄호 표기에 맞춰 변형 */
export function buildPrompt(source: string, o: VariantOptions): string {
  let text = source.trim();
  const b = BRACKETS.find((x) => x.id === o.bracket) ?? BRACKETS[0];
  const m = text.match(/^\(OOC:([\s\S]*)\)$/);
  if (m) {
    const lines = m[1].split('\n');
    // 원문 첫 줄은 "(OOC: … ¬)" 로 자체적으로 닫힌다 → 같은 괄호 표기로 맞춘다
    if (lines[0].endsWith(')')) lines[0] = lines[0].slice(0, -1) + b.close;
    text = `${b.open}${lines.join('\n')}${b.close}`;
  }

  if (o.platform === 'double') {
    text = text.replace(/\{char\}/g, '{{char}}').replace(/\{user\}/g, '{{user}}');
  } else if (o.platform === 'named') {
    const c = o.charName?.trim() || '캐릭터';
    const u = o.userName?.trim() || '유저';
    text = text.replace(/\{char\}/g, c).replace(/\{user\}/g, u);
  }
  return text;
}
