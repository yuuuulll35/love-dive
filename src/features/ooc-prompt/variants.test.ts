import { readFileSync } from 'node:fs';
import { buildPrompt } from './variants';

const src = readFileSync('public/ooc-prompt.md', 'utf8');

describe('OOC 프롬프트 변형', () => {
  it('원문은 (OOC: 로 시작해 ) 로 끝나고 예시 코드를 담는다', () => {
    expect(src.trim().startsWith('(OOC:')).toBe(true);
    expect(src.trim().endsWith(')')).toBe(true);
    expect(src).toContain('ABYSS-9TAT-YJUZ-52DW-QK');
    expect(src).toContain('{char}와 {user}');
  });
  it('티팟·소괄호는 원문 그대로', () => {
    expect(buildPrompt(src, { platform: 'teapot', bracket: 'paren' })).toBe(src.trim());
  });
  it('괄호 변형', () => {
    const t = buildPrompt(src, { platform: 'teapot', bracket: 'double-paren' });
    expect(t.startsWith('((OOC:')).toBe(true);
    expect(t.endsWith('))')).toBe(true);
  });
  it('이름 직접 표기', () => {
    const t = buildPrompt(src, { platform: 'named', bracket: 'square', charName: '하루', userName: '유키' });
    expect(t).toContain('하루와 유키');
    expect(t).not.toMatch(/\{(char|user)\}/);
  });
  it('{{char}} 형식', () => {
    expect(buildPrompt(src, { platform: 'double', bracket: 'paren' })).toContain('{{char}}와 {{user}}');
  });
});

describe('첫 줄 괄호', () => {
  it('대괄호 변형에 소괄호 닫힘이 남지 않는다', () => {
    const t = buildPrompt(src, { platform: 'teapot', bracket: 'square' });
    expect(t.split('\n')[0].endsWith('¬]')).toBe(true);
  });
});
