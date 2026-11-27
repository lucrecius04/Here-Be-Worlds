#!/usr/bin/env node
/**
 * Karty pro sdílení (Open Graph, 1200 × 630):
 *   public/og/site.jpg            obecná karta webu (noční modř, obloha, znak)
 *   public/og/worlds/<id>.jpg     karta každého publikovaného světa (papír, barva archetypu)
 *   public/og/compare.jpg         karta stránky Srovnání (noční, stupnice s kosočtverci v barvách srovnání)
 *   public/og/putovani.jpg        karta rejstříku putování (papír, čtyři kresby jako tabule atlasu)
 *   public/og/putovani/<slug>.jpg karta každého putování: kresba (když je v READY), název, otázka eseje
 *                                 a trasa světů jako na titulní straně; bez kresby čistě typografická
 *
 * Spuštění: `npm run og` (po přidání nebo úpravě světa). Jen vybrané karty:
 * `npm run og -- compare`, `npm run og -- site`, `npm run og -- <id světa>`,
 * `npm run og -- putovani` (rejstřík a všechna putování) nebo `npm run og -- <slug putování>`.
 * Po přidání obrázku k putování spusť `npm run og -- <slug putování> putovani`.
 * Potřebuje Playwright s Chromiem: `npx playwright install chromium` (jednou).
 * Písma bere z Google Fonts; bez sítě lze podstrčit vlastní CSS přes HBW_OG_FONT_CSS
 * (soubor s @font-face, url() jako cesty k souborům na disku). Vlastní Chromium: HBW_OG_CHROMIUM=<cesta>.
 * Běží přes tsx (`npm run og`), protože čte putování z src/lib/trails.ts a src/lib/trail-images.ts.
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

const { TRAILS, TRAIL_SLUGS } = await import('../src/lib/trails.ts');
const { READY } = await import('../src/lib/trail-images.ts');
const { markSvg, SAIL_VIEWBOX } = await import('../src/lib/brand-mark.ts');
const worlds = JSON.parse(readFileSync(join(root, 'data/worlds.json'), 'utf8')).worlds.filter((w) => !w.draft);
const chapters = JSON.parse(readFileSync(join(root, 'data/meta/chapters.json'), 'utf8')).chapters;
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

/** Znak (podoba O2, src/lib/brand-mark.ts): loď s brkem v kruhu otevřeném dole, mezery v barvě noci. */
const mark = (light, glow, shade, size) => {
  const side = Math.round(size * 1.45);
  return `<svg width="${side}" height="${side}" viewBox="${SAIL_VIEWBOX}">${markSvg({ light, glow, shade, gap: '#0D1324' })}</svg>`;
};

/** Znak v nočním čtverci (jako ikona webu); na papírové kartě nese vlna barvu archetypu. */
const badge = (glow, size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0D1324"/><g transform="translate(8.5 11) scale(2.92)">${markSvg({ light: '#F4F1EA', glow, shade: '#AEB3BE', gap: '#0D1324', ring: 1 })}</g></svg>`;

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
<h1 style="margin:50px 0 0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:72px;line-height:.98;letter-spacing:-.025em;color:#F4F1EA">Tajemství světů, které <em style="font-style:italic;font-weight:500">nikdy</em> neexistovaly</h1>
<p style="margin:26px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:24px;line-height:1.45;color:#C9CEDA;max-width:520px">Průvodce herním lore od temné fantasy přes vesmírné opery po rozpadlé dystopie.</p>
</div>
<div style="position:absolute;left:80px;right:80px;bottom:44px">
<div style="height:9px;border-right:1px solid #3A4562;background-image:linear-gradient(to right,#3A4562 1px,transparent 1px),linear-gradient(to right,#26304A 1px,transparent 1px);background-size:10% 9px,2% 4px;background-position:0 100%,0 100%;background-repeat:repeat-x"></div>
<p class="mono" style="margin:0;padding-top:12px;border-top:1px solid #1C2540;display:flex;justify-content:space-between;font-size:14px;color:#8E97AD"><span>${count} ${word}</span><span>Kroniky · anatomie vyprávění · faktografie</span></p>
</div></div>`;
}

function worldHtml(w) {
  const ci = chapters.findIndex((c) => c.id === w.chapterId);
  const ch = chapters[ci];
  const hue = ch?.accent?.light ?? '#2B44C9';
  const genre = cs(w.metadata.genreProfile);
  const sub = cs(w.metadata.genreProfile.sub);
  return `<div class="card" style="background:#F4F2EE;color:#17161A;padding:56px 80px 48px;display:flex;flex-direction:column">
<div style="display:flex;justify-content:space-between;align-items:center">
<span style="display:flex;align-items:center;gap:14px">${badge(ch?.accent?.dark ?? '#E5BE7E', 46)}<span class="word" style="font-size:26px">Here <em>Be</em> Worlds</span></span>
<span class="mono" style="font-size:15px;color:#57534D">${esc(cs(ch?.title))}</span>
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

/** Barvy srovnání (stejné jako SLOT_COLORS v src/lib/compare.ts). */
const SLOT = ['#1A9389', '#B74A9D', '#5F9205'];

function compareHtml() {
  // pět stupnic jako na stránce srovnání: tři světy, mezi krajními pás rozpětí
  const rows = [
    [4, 4, 5],
    [5, 5, 4],
    [4, 5, 4],
    [2, 4, 5],
    [5, 4, 3],
  ];
  const W = 420;
  const x = (v) => 14 + ((v - 1) / 4) * (W - 40);
  const tracks = rows
    .map((vals, r) => {
      const y = 40 + r * 64;
      const ticks = [1, 2, 3, 4, 5].map((t) => `<line x1="${x(t)}" y1="${y - 6}" x2="${x(t)}" y2="${y + 6}" stroke="#3A4562" stroke-width="1.5"/>`).join('');
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      const span = hi > lo ? `<line x1="${x(lo)}" y1="${y}" x2="${x(hi)}" y2="${y}" stroke="#ECE8E0" stroke-opacity=".28" stroke-width="5"/>` : '';
      const marks = vals
        .map((v, i) => {
          const same = vals.filter((o) => o === v).length;
          const order = vals.slice(0, i).filter((o) => o === v).length;
          const cx = x(v) + (order - (same - 1) / 2) * 15;
          return `<rect x="${cx - 8}" y="${y - 8}" width="16" height="16" fill="${SLOT[i]}" stroke="#0D1324" stroke-width="3" transform="rotate(45 ${cx} ${y})"/>`;
        })
        .join('');
      return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#26304A" stroke-width="1.5"/>${ticks}${span}${marks}`;
    })
    .join('');
  const columns = SLOT.map(
    (c, i) =>
      `<div style="flex:1;height:118px;padding:20px 16px 0;border-top:5px solid ${c};background:color-mix(in srgb, ${c} 24%, #0D1324)${i ? ';border-left:1px solid #1C2540' : ''}"><div style="width:${[72, 58, 66][i]}%;height:12px;background:#ECE8E0;opacity:.85"></div><div style="width:88%;height:5px;margin-top:16px;background:#ECE8E0;opacity:.28"></div><div style="width:${[64, 76, 52][i]}%;height:5px;margin-top:8px;background:#ECE8E0;opacity:.28"></div></div>`,
  ).join('');
  return `<div class="card" style="background:#0D1324;color:#ECE8E0">
<div style="position:absolute;left:80px;top:64px;display:flex;align-items:center;gap:16px">${mark('#F4F1EA', '#E5BE7E', '#AEB3BE', 46)}<span class="word" style="font-size:34px;color:#F4F1EA">Here <em>Be</em> Worlds</span></div>
<div style="position:absolute;left:80px;top:170px;width:560px">
<h1 style="margin:0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:92px;line-height:.95;letter-spacing:-.025em;color:#F4F1EA">Srovnání světů</h1>
<p style="margin:26px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:27px;line-height:1.4;color:#C9CEDA">Jak blízko mají k sobě světy, které o sobě <em>nikdy</em> neslyšely.</p>
</div>
<div style="position:absolute;right:80px;top:64px;width:${W}px">
<div style="display:flex">${columns}</div>
<svg width="${W}" height="330" viewBox="0 0 ${W} 330" style="display:block;margin-top:14px">${tracks}</svg>
</div>
<p class="mono" style="position:absolute;left:80px;right:80px;bottom:44px;margin:0;padding-top:14px;border-top:1px solid #1C2540;display:flex;justify-content:space-between;font-size:14px;color:#8E97AD"><span>Příbuznost · Pět souřadnic · Témata · Charakter</span><span>Atlas herních světů</span></p>
</div>`;
}

/* --- putování ------------------------------------------------------------- */

const IMG_DIR = join(root, 'public/putovani-obrazky');
const dataUrl = (file, type) => `data:${type};base64,${readFileSync(file).toString('base64')}`;

/** Esej putování: název, otázka a doba čtení (200 slov za minutu jako v trail-pages.ts). */
function trailEssay(slug) {
  const raw = readFileSync(join(root, 'content/trails', `${slug}.md`), 'utf8');
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  const meta = (key) => (fm ? new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(fm[1])?.[1]?.trim() : undefined);
  const body = fm ? raw.slice(fm[0].length) : raw;
  const words = body.replace(/[#>*_`|[\]()-]+/g, ' ').split(/\s+/).filter(Boolean).length;
  return { title: meta('title') ?? slug, tagline: meta('tagline') ?? '', minutes: Math.max(1, Math.round(words / 200)) };
}

const hueOf = (worldId) => {
  const w = worlds.find((x) => x.id === worldId);
  return chapters.find((c) => c.id === w?.chapterId)?.accent?.light ?? '#57534D';
};

/** Trasa světů jako Putování dne na titulní straně: tečky v barvě archetypu, linka s přechodem barev, jména pod tečkami. */
function route(members, { width = 1040 } = {}) {
  const list = members.filter((id) => worlds.some((w) => w.id === id));
  const slot = width / list.length;
  const xs = list.map((_, i) => slot * i + slot / 2);
  const segs = list
    .slice(1)
    .map((id, i) => `<div style="position:absolute;top:9px;left:${xs[i]}px;width:${xs[i + 1] - xs[i]}px;height:3px;background:linear-gradient(to right,${hueOf(list[i])},${hueOf(id)})"></div>`)
    .join('');
  const stops = list
    .map((id, i) => {
      const w = worlds.find((x) => x.id === id);
      return `<div style="position:absolute;top:0;left:${xs[i] - slot / 2}px;width:${slot}px;text-align:center">
<span style="display:inline-block;width:21px;height:21px;border-radius:50%;background:${hueOf(id)};box-shadow:0 0 0 4px #F4F2EE"></span>
<span class="rn" style="display:block;margin:12px auto 0;max-width:${slot - 14}px;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:19px;line-height:1.15;color:#17161A">${esc(cs(w.gameTitle))}</span></div>`;
    })
    .join('');
  return `<div style="position:relative;height:84px;width:${width}px">${segs}${stops}</div>`;
}

const brand = () =>
  `<span style="display:flex;align-items:center;gap:14px">${badge('#E5BE7E', 46)}<span class="word" style="font-size:26px">Here <em>Be</em> Worlds</span></span>`;

function trailHtml(trail) {
  const slug = TRAIL_SLUGS[trail.id];
  const essay = trailEssay(slug);
  const img = join(IMG_DIR, `${slug}-1.jpg`);
  const mask = join(IMG_DIR, 'maska', `${slug}-1-light.png`);
  const kicker = `Putování atlasem · esej ${essay.minutes} min`;
  if ((READY[trail.id] ?? 0) > 0 && existsSync(img)) {
    const m = existsSync(mask) ? `-webkit-mask-image:url(${dataUrl(mask, 'image/png')});-webkit-mask-size:100% 100%;` : '';
    return `<div class="card" style="background:#F4F2EE;color:#17161A">
<img src="${dataUrl(img, 'image/jpeg')}" style="position:absolute;right:-6px;top:26px;width:790px;height:441px;object-fit:cover;mix-blend-mode:multiply;filter:brightness(1.06) saturate(.8);${m}">
<div style="position:absolute;left:80px;top:56px">${brand()}</div>
<div style="position:absolute;left:80px;top:150px;width:400px">
<p class="mono" style="margin:0;font-size:14px;color:#57534D">${esc(kicker)}</p>
<h1 id="tt" style="margin:18px 0 0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:56px;line-height:1;letter-spacing:-.025em">${esc(essay.title)}</h1>
<p id="tq" style="margin:20px 0 0;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:24px;line-height:1.3;color:#2B2A2E">${esc(essay.tagline)}</p>
</div>
<div style="position:absolute;left:80px;bottom:30px;padding-top:24px;border-top:1px solid #D6D1C8">${route(trail.members)}</div>
</div>`;
  }
  return `<div class="card" style="background:#F4F2EE;color:#17161A">
<div style="position:absolute;left:80px;right:80px;top:56px;display:flex;justify-content:space-between;align-items:center">${brand()}<span class="mono" style="font-size:15px;color:#57534D">${esc(kicker)}</span></div>
<div style="position:absolute;left:80px;top:184px;width:1040px">
<h1 id="t" style="margin:0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:96px;line-height:.98;letter-spacing:-.025em;white-space:nowrap">${esc(essay.title)}</h1>
<p id="c" style="margin:24px 0 0;max-width:960px;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:30px;line-height:1.3">${esc(essay.tagline)}</p>
</div>
<div style="position:absolute;left:80px;bottom:30px;padding-top:24px;border-top:1px solid #D6D1C8">${route(trail.members)}</div>
</div>`;
}

/** Rejstřík putování: čtyři kresby jako tabule atlasu. */
function trailsIndexHtml() {
  const withImg = TRAILS.filter((t) => (READY[t.id] ?? 0) > 0 && existsSync(join(IMG_DIR, `${TRAIL_SLUGS[t.id]}-1.jpg`)));
  const pick = ['god-corpse', 'knows-you-play', 'dead-speak', 'house'].map((id) => withImg.find((t) => t.id === id)).filter(Boolean);
  for (const t of withImg) if (pick.length < 4 && !pick.includes(t)) pick.push(t);
  const cells = pick
    .map((t, i) => {
      const slug = TRAIL_SLUGS[t.id];
      const mask = join(IMG_DIR, 'maska', `${slug}-1-light.png`);
      const m = existsSync(mask) ? `-webkit-mask-image:url(${dataUrl(mask, 'image/png')});-webkit-mask-size:100% 100%;` : '';
      const x = (i % 2) * 316;
      const y = Math.floor(i / 2) * 236;
      return `<img src="${dataUrl(join(IMG_DIR, `${slug}-1.jpg`), 'image/jpeg')}" style="position:absolute;left:${x}px;top:${y}px;width:380px;height:212px;object-fit:cover;mix-blend-mode:multiply;filter:brightness(1.06) saturate(.8);${m}">`;
    })
    .join('');
  const n = TRAILS.length;
  return `<div class="card" style="background:#F4F2EE;color:#17161A">
<div style="position:absolute;right:24px;top:52px;width:696px;height:460px">${cells}</div>
<div style="position:absolute;left:80px;top:56px">${brand()}</div>
<div style="position:absolute;left:80px;top:168px;width:390px">
<p class="mono" style="margin:0;font-size:14px;color:#57534D">${n} esejí · ${worlds.length} světů</p>
<h1 style="margin:18px 0 0;font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:76px;line-height:.96;letter-spacing:-.025em">Putování světy</h1>
<p style="margin:22px 0 0;font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:26px;line-height:1.3">Otázky, které si herní světy kladou – a cesty, kterými na ně odpovídají.</p>
</div>
<p class="mono" style="position:absolute;left:80px;right:80px;bottom:44px;margin:0;padding-top:14px;border-top:1px solid #D6D1C8;display:flex;justify-content:space-between;font-size:14px;color:#57534D"><span>Eseje · světy na cestě · prameny</span><span>Atlas herních světů</span></p>
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
  // putování s kresbou: název nanejvýš na tři řádky, otázka tak, aby se vešla nad trasu
  const tt = document.getElementById('tt');
  const tq = document.getElementById('tq');
  if (tt) {
    let size = 56;
    while (tt.scrollHeight > 3 * size + 4 && size > 40) tt.style.fontSize = `${(size -= 2)}px`;
  }
  if (tt && tq) {
    let size = 24;
    while (tq.getBoundingClientRect().bottom > 458 && size > 17) tq.style.fontSize = `${(size -= 1)}px`;
  }
  // jména světů na trase nanejvýš na dva řádky
  for (const rn of document.querySelectorAll('.rn')) {
    let size = 19;
    while (rn.scrollHeight > 2 * 1.15 * size + 2 && size > 14) rn.style.fontSize = `${(size -= 1)}px`;
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
  const browser = await chromium.launch(process.env.HBW_OG_CHROMIUM ? { executablePath: process.env.HBW_OG_CHROMIUM } : {});
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

  const only = process.argv.slice(2);
  const want = (name) => only.length === 0 || only.includes(name);
  let done = 0;
  if (want('site')) {
    await render(siteHtml(), join(outDir, 'site.jpg'));
    done++;
  }
  if (want('compare')) {
    await render(compareHtml(), join(outDir, 'compare.jpg'));
    done++;
  }
  for (const w of worlds) {
    if (!want(w.id)) continue;
    await render(worldHtml(w), join(outDir, 'worlds', `${w.id}.jpg`));
    done++;
  }
  if (want('putovani')) {
    await render(trailsIndexHtml(), join(outDir, 'putovani.jpg'));
    done++;
  }
  mkdirSync(join(outDir, 'putovani'), { recursive: true });
  for (const t of TRAILS) {
    const slug = TRAIL_SLUGS[t.id];
    if (!want(slug) && !want('putovani')) continue;
    if (!existsSync(join(root, 'content/trails', `${slug}.md`))) continue;
    await render(trailHtml(t), join(outDir, 'putovani', `${slug}.jpg`));
    done++;
  }
  await browser.close();
  console.log(`Hotovo: ${done} karet v public/og/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
