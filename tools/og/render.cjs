/**
 * 링크 미리보기(og:image) 그림 만들기 — 개발할 때 한 번 돌려 public/og/*.png 로 커밋한다.
 *   node tools/og/render.cjs
 * Playwright(Chromium)가 필요하다. 폰트는 node_modules 의 웹폰트를 그대로 쓴다.
 */
const { chromium } = require('playwright');
const path = require('node:path');
const fs = require('node:fs');

const root = path.resolve(__dirname, '../..');
const nm = (p) => 'file://' + path.join(root, 'node_modules', p);
const out = path.join(root, 'public/og');
fs.mkdirSync(out, { recursive: true });

// [파일 이름, 카드 번호, 층 이름, 물빛 위·아래, 밝은 바탕인지, 제목 두 줄]
const CARDS = [
  ['main', '✦', '', ['#c9f3f4', '#06122e'], true, ['우리 사랑은', '얼마나 무거울까?']],
  ['float', '0', '부유', ['#ffd9e3', '#3fb7c9'], true, ['우리 사랑은', '아직 떠 있다']],
  ['sunlight', 'I', '표층', ['#c9f3f4', '#2aa5bd'], true, ['우리 사랑은', '표층까지 가라앉았다']],
  ['twilight', 'II', '박광층', ['#3f9fc4', '#0a4a7c'], false, ['우리 사랑은', '박광층까지 가라앉았다']],
  ['midnight', 'III', '점심해', ['#0b3a78', '#06122e'], false, ['우리 사랑은', '점심해까지 가라앉았다']],
  ['abyss', 'IV', '심해저', ['#071533', '#02040b'], false, ['우리 사랑은', '심해저까지 가라앉았다']],
  ['hadal', 'V', '초심해', ['#050b1e', '#000002'], false, ['우리 사랑은', '초심해까지 가라앉았다']],
  ['void', '∞', '측정 불가', ['#14060b', '#000000'], false, ['우리 사랑은', '바다로도 잴 수 없다']],
];

const STAR = 'M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z';
const star = (x, y, s, fill) =>
  `<svg style="position:absolute;left:${x}px;top:${y}px;width:${s}px" viewBox="0 0 24 24"><path d="${STAR}" fill="${fill}"/></svg>`;

function html([id, num, zone, [top, bottom], light, [h1, h2]]) {
  const bg = light
    ? 'linear-gradient(160deg,#ffd3df 0%,#ffe6da 45%,#d6f0fb 100%)'
    : id === 'void'
      ? 'radial-gradient(ellipse at 30% 40%,#2a0d16,#050407 70%)'
      : `radial-gradient(ellipse at 28% 45%,${top},${bottom} 75%)`;
  const ink = light ? '#22305a' : '#f1eef0';
  const sub = light ? 'rgba(34,48,90,.72)' : 'rgba(241,238,240,.7)';
  const paper = light ? '#fbf6ee' : id === 'void' ? '#070508' : '#0f1731';
  const frame = light ? '#31508a' : id === 'void' ? '#ff4d6d' : '#c9d6f2';
  const archText = light && id !== 'main' ? '#1f3460' : '#fff';
  const water = id === 'float'
    ? 'linear-gradient(to bottom,#ffd9e3 0%,#ffe9dc 48%,#d4f1fb 64%,#63d0db 65%,#3fb7c9 100%)'
    : id === 'main'
      ? 'linear-gradient(to bottom,#c9f3f4,#2aa5bd 30%,#0a4a7c 55%,#06122e 80%,#000 100%)'
      : id === 'void'
        ? 'repeating-linear-gradient(to bottom,rgba(255,77,109,.1) 0 1px,transparent 1px 3px),#050407'
        : `linear-gradient(to bottom,${top},${bottom})`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${nm('@fontsource/fredoka/latin-700.css')}">
<link rel="stylesheet" href="${nm('@fontsource/gowun-batang/700.css')}">
<link rel="stylesheet" href="${nm('@fontsource/cormorant-garamond/latin-600.css')}">
<style>
@font-face{font-family:Pretendard;src:url(${nm('pretendard/dist/web/variable/woff2/PretendardVariable.woff2')}) format('woff2');font-weight:100 900}
*{box-sizing:border-box}html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:${bg};font-family:Pretendard,sans-serif;color:${ink}}
.card{position:absolute;left:96px;top:58px;width:330px;height:514px;padding:10px;background:${paper};
  border-radius:4px;box-shadow:0 30px 60px -20px rgba(0,0,0,.45);
  -webkit-mask:linear-gradient(#000 0 0) content-box,radial-gradient(circle 6px,#0000 96%,#000) -8px -8px/16px 16px round padding-box}
.frame{position:relative;height:100%;border:2px solid ${frame};border-radius:6px;box-shadow:inset 0 0 0 4px ${paper},inset 0 0 0 5px ${frame}55;
  display:flex;flex-direction:column;align-items:center;padding:20px 22px}
.num{font-family:'Cormorant Garamond';font-weight:600;font-size:28px;color:${frame};letter-spacing:.12em;line-height:1}
.arch{margin-top:14px;width:100%;flex:1;padding:5px;border:2px solid ${frame};border-radius:999px 999px 10px 10px}
.win{position:relative;height:100%;border-radius:999px 999px 7px 7px;background:${water};overflow:hidden;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:${archText}}
.zone{font-family:'Gowun Batang';font-weight:700;font-size:30px;letter-spacing:.3em;text-indent:.3em}
.rope{position:absolute;left:50%;top:0;height:46%;width:2px;background:rgba(200,210,225,.8)}
.heart{position:absolute;left:50%;top:46%;width:46px;transform:translate(-50%,-4px)}
.brand{margin-top:16px;font-family:Fredoka;font-weight:700;font-size:15px;letter-spacing:.24em;color:${frame}}
.text{position:absolute;left:500px;top:0;bottom:0;right:80px;display:flex;flex-direction:column;justify-content:center}
.logo{font-family:Fredoka;font-weight:700;font-size:46px;letter-spacing:.02em;color:${ink};${light ? 'text-shadow:3px 3px 0 #ffb3c6' : ''}}
.logo b{color:#ff5c7a}
h1{margin:26px 0 0;font-family:Pretendard;font-weight:750;font-size:58px;line-height:1.3;letter-spacing:-.01em}
p{margin:26px 0 0;font-size:26px;font-weight:500;color:${sub}}
</style></head><body>
${star(470, 70, 22, light ? '#31508a' : '#c9d6f2')}${star(1110, 120, 16, '#ff7d96')}${star(1060, 520, 20, light ? '#fff' : '#c9d6f2')}${star(60, 560, 14, light ? '#fff' : '#7ff6e4')}
<div class="card"><div class="frame">
  <div class="num">${num}</div>
  <div class="arch"><div class="win">
    ${id === 'main' ? `<span class="rope"></span><svg class="heart" viewBox="0 0 44 40"><path d="M22 38C10 30 2 23 2 13A10 10 0 0 1 22 9a10 10 0 0 1 20 4c0 10-8 17-20 25z" fill="#ff5c7a"/></svg>` : `<span class="zone">${zone}</span>`}
  </div></div>
  <div class="brand">LOVE DIVE</div>
</div></div>
<div class="text">
  <div class="logo">L<b>♥</b>VE DIVE</div>
  <h1>${h1}<br>${h2}</h1>
  <p>${id === 'main' ? '롤플레이 페어의 무게를 재는 수심 측정기' : '두 사람의 사랑은 몇 미터일까?'}</p>
</div>
</body></html>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const card of CARDS) {
    // file:// 폰트를 읽으려면 페이지도 file:// 여야 한다
    const tmp = path.join(out, `.${card[0]}.html`);
    fs.writeFileSync(tmp, html(card));
    await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await Promise.all(['700 46px Fredoka', "700 58px 'Gowun Batang'", "600 28px 'Cormorant Garamond'", '500 26px Pretendard'].map((f) => document.fonts.load(f, '우리 사랑LOVE DIVE0')));
      await document.fonts.ready;
    });
    await page.screenshot({ path: path.join(out, `${card[0]}.png`), type: 'png' });
    fs.rmSync(tmp);
    console.log('og/' + card[0] + '.png');
  }
  await browser.close();
})();
