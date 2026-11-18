#!/usr/bin/env node
/**
 * Karty pro sdílení (Open Graph, 1200 × 630):
 *   public/og/site.jpg            obecná karta webu (noční modř, obloha, znak)
 *   public/og/worlds/<id>.jpg     karta každého publikovaného světa (papír, barva archetypu)
 *
 * Spuštění: `npm run og` (po přidání nebo úpravě světa).
 * Potřebuje Playwright s Chromiem: `npx playwright install chromium` (jednou).
 * Písma bere z Google Fonts; bez sítě lze podstrčit vlastní CSS přes HBW_OG_FONT_CSS
 * (soubor s @font-face, url() jako cesty k souborům na disku).
 */
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Chybí Playwright. Nainstaluj: npm i -D playwright && npx playwright install chromium');
  process.exit(1);
}

const worlds = JSON.parse(readFileSync(join(root, 'data/worlds.json'), 'utf8')).worlds.filter((w) => !w.draft);
const chapters = JSON.parse(readFileSync(join(root, 'data/meta/chapters.json'), 'utf8')).chapters;
const LETTERS = 'ABCDEFGHIJ';
const cs = (v) => (v ? v.cs || v.en || '' : '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function fontHead() {
  const custom = process.env.HBW_OG_FONT_CSS;
  if (custom && existsSync(custom)) {
    const css = readFileSync(custom, 'utf8').replace(/url\(([^)]+)\)/g, (_, p) => {
      const file = p.replace(/['"]/g, '');
      return `url(data:font/woff2;base64,${readFileSync(file).toString('base64')})`;
    });
    return `<style>${css}</style>`;
  }
  return '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&family=IBM+Plex+Mono:wght@400;500;600&display=block">';
}

/** Znak: čtyři vrstvy kotouče rozjeté do schodů (stejné cesty jako BrandMark.tsx). */
const MARK = ['M38 10A22 22 0 0 1 56.37 19.9H19.63A22 22 0 0 1 38 10Z', 'M14.35 22.1H53.65A22 22 0 0 1 55.97 30.9H12.03A22 22 0 0 1 14.35 22.1Z', 'M8.03 33.1H51.97A22 22 0 0 1 49.65 41.9H10.35A22 22 0 0 1 8.03 33.1Z', 'M7.63 44.1H44.37A22 22 0 0 1 26 54A22 22 0 0 1 7.63 44.1Z'];
const layers = (light, glow, shade) =>
  [light, glow, light, shade].map((fill, i) => `<path d="${MARK[i]}" fill="${fill}"/>`).join('');

const mark = (light, glow, shade, size) =>
  `<svg width="${Math.round((size * 7) / 6)}" height="${size}" viewBox="4 8 56 48">${layers(light, glow, shade)}</svg>`;

/** Znak v nočním čtverci (jako ikona webu); na papírové kartě nese zlatá vrstva barvu archetypu. */
const badge = (glow, size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0D1324"/><g transform="translate(32 32) scale(0.82) translate(-32 -32)">${layers('#F4F1EA', glow, '#AEB3BE')}</g></svg>`;

const BASE_CSS = `
*{box-sizing:border-box}body{margin:0;font-variation-settings:'SOFT' 0,'WONK' 0}
.card{position:relative;width:1200px;height:630px;overflow:hidden}
.word{font-family:'Fraunces',Georgia,serif;font-weight:700;letter-spacing:-0.015em}
.word em{font-style:italic;font-weight:500}
.mono{font-family:'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase}
`;

function siteHtml() {
  const sky = `<svg width="560" height="460" viewBox="0 0 560 460" style="position:absolute;right:40px;top:70px">
<g fill="none" stroke="#26304A" stroke-width="1.5"><path d="M40 70L120 58L200 76L272 40"/><path d="M120 58L132 118L214 130"/><path d="M330 150L410 140L470 182L540 168"/><path d="M90 300L170 290L250 312L300 270"/><path d="M380 330L452 348L520 316"/><path d="M60 420L130 404L200 430"/></g>
<g fill="#E0B36A"><circle cx="40" cy="70" r="3.5"/><circle cx="120" cy="58" r="3"/><circle cx="200" cy="76" r="4"/><circle cx="132" cy="118" r="3"/><circle cx="214" cy="130" r="3.5"/><circle cx="272" cy="40" r="5"/></g>
<g fill="#7EC0E0"><circle cx="330" cy="150" r="3"/><circle cx="410" cy="140" r="4"/><circle cx="470" cy="182" r="3"/><circle cx="540" cy="168" r="3.5"/></g>
<g fill="#C49BC8"><circle cx="90" cy="300" r="3"/><circle cx="170" cy="290" r="3.5"/><circle cx="250" cy="312" r="3"/><circle cx="300" cy="270" r="4"/></g>
<g fill="#D4848C"><circle cx="380" cy="330" r="3.5"/><circle cx="452" cy="348" r="3"/><circle cx="520" cy="316" r="4"/></g>
<g fill="#6EC4A0"><circle cx="60" cy="420" r="3"/><circle cx="130" cy="404" r="3.5"/><circle cx="200" cy="430" r="3"/></g></svg>`;
  const count = worlds.length;
  const word = count === 1 ? 'svět' : count >= 2 && count <= 4 ? 'světy' : 'světů';
  return `<div class="card" style="background:#0D1324;color:#ECE8E0">${sky}
<div style="position:absolute;left:80px;top:84px;width:640px">
<div style="display:flex;align-items:center;gap:16px">${mark('#F4F1EA', '#E5BE7E', '#AEB3BE', 56)}<span class="word" style="font-size:44px;color:#F4F1EA">Here <em>Be</em> Worlds</span></div>
<h1 style="margin:50px 0 0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:72px;line-height:.98;letter-spacing:-.025em;color:#F4F1EA">Mapy světů, kam se <em style="font-style:italic;font-weight:500">nedá</em> doletět</h1>
<p style="margin:26px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:24px;line-height:1.45;color:#C9CEDA;max-width:520px">Atlas herních vesmírů: kroniky, povaha světů, příbuzní ve srovnání.</p>
</div>
<div style="position:absolute;left:80px;right:80px;bottom:44px">
<div style="height:9px;border-right:1px solid #3A4562;background-image:linear-gradient(to right,#3A4562 1px,transparent 1px),linear-gradient(to right,#26304A 1px,transparent 1px);background-size:10% 9px,2% 4px;background-position:0 100%,0 100%;background-repeat:repeat-x"></div>
<p class="mono" style="margin:0;padding-top:12px;border-top:1px solid #1C2540;display:flex;justify-content:space-between;font-size:14px;color:#8E97AD"><span>${count} ${word} · 7 souhvězdí</span><span>Kroniky a faktografie</span></p>
</div></div>`;
}

function worldHtml(w) {
  const ci = chapters.findIndex((c) => c.id === w.chapterId);
  const ch = chapters[ci];
  const hue = ch?.accent?.light ?? '#2B44C9';
  const letter = LETTERS[ci] ?? '';
  const genre = cs(w.metadata.genreProfile);
  const sub = cs(w.metadata.genreProfile.sub);
  return `<div class="card" style="background:#F4F2EE;color:#17161A;padding:56px 80px 48px;display:flex;flex-direction:column">
<div style="display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:14px">${badge(ch?.accent?.dark ?? '#E5BE7E', 46)}<span class="word" style="font-size:26px">Here <em>Be</em> Worlds</span></span>
<span class="mono" style="font-size:15px;color:#57534D">№ ${w.number} · ${esc(letter)} · ${esc(cs(ch?.title))}</span>
</div>
<div style="margin-top:58px">
<span class="mono" style="display:inline-block;max-width:100%;padding:7px 14px 6px;border-radius:3px 3px 0 0;background:${hue};color:#F4F2EE;font-size:15px;font-weight:600;letter-spacing:.04em">${esc(genre)}${sub ? ` · ${esc(sub)}` : ''}</span>
<div style="border-top:5px solid ${hue};padding-top:24px">
<h1 id="t" style="margin:0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:104px;line-height:.95;letter-spacing:-.025em;white-space:nowrap">${esc(cs(w.gameTitle))}</h1>
<p id="c" style="margin:22px 0 0;max-width:960px;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:30px;line-height:1.3">${esc(cs(w.core))}</p>
</div></div>
<p class="mono" style="margin:auto 0 0;padding-top:14px;border-top:1px solid #D6D1C8;display:flex;justify-content:space-between;font-size:14px;color:#57534D"><span>Kronika · Faktografie · Anatomie vyprávění</span><span>Atlas herních světů</span></p>
</div>`;
}

/** Název na jeden řádek (zmenšit do 64 px), jádro nanejvýš na tři řádky. */
function fitText() {
  const t = document.getElementById('t');
  if (t) {
    let size = 104;
    while (t.scrollWidth > 1040 && size > 64) t.style.fontSize = `${(size -= 2)}px`;
    if (t.scrollWidth > 1040) t.style.whiteSpace = 'normal';
  }
  const c = document.getElementById('c');
  if (c) {
    let size = 30;
    while (c.scrollHeight > 3 * 1.3 * size + 2 && size > 22) c.style.fontSize = `${(size -= 1)}px`;
  }
}

async function main() {
  const outDir = join(root, 'public/og');
  mkdirSync(join(outDir, 'worlds'), { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<!doctype html><html lang="cs"><head><meta charset="utf-8">${fontHead()}<style>${BASE_CSS}</style></head><body><div id="root"></div></body></html>`, { waitUntil: 'networkidle' });

  const render = async (html, file) => {
    await page.evaluate((h) => {
      document.getElementById('root').innerHTML = h;
    }, html);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(fitText);
    await page.screenshot({ path: file, type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  };

  await render(siteHtml(), join(outDir, 'site.jpg'));
  for (const w of worlds) await render(worldHtml(w), join(outDir, 'worlds', `${w.id}.jpg`));
  await browser.close();
  console.log(`Hotovo: site.jpg + ${worlds.length} karet světů v public/og/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
