#!/usr/bin/env node
/**
 * Ikony webu ze znaku (podoba O2, src/lib/brand-mark.ts): public/favicon.svg, public/favicon.ico (16, 32, 48)
 * a public/apple-touch-icon.png (180). Spuštění: `npx tsx scripts/brand-icons.mjs` (Playwright s Chromiem,
 * vlastní Chromium přes HBW_OG_CHROMIUM; ICO skládá Python s Pillow). Výstup se commituje.
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { markSvg } = await import('../src/lib/brand-mark.ts');

const NIGHT = '#0D1324';
/** Znak v nočním čtverci se zaoblenými rohy; kruh o něco silnější, aby v 16 px nezmizel. */
const icon = (ring) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Here Be Worlds</title>` +
  `<rect width="64" height="64" rx="14" fill="${NIGHT}"/>` +
  `<g transform="translate(8.5 11) scale(2.92)">` +
  markSvg({ light: '#F4F1EA', glow: '#E5BE7E', shade: '#AEB3BE', gap: NIGHT, ring }) +
  `</g></svg>`;

writeFileSync(join(root, 'public/favicon.svg'), icon(1) + '\n');

const { chromium } = require('playwright');
const browser = await chromium.launch(process.env.HBW_OG_CHROMIUM ? { executablePath: process.env.HBW_OG_CHROMIUM } : {});
const page = await browser.newPage();
const tmp = mkdtempSync(join(tmpdir(), 'hbw-icons-'));
const png = async (size, ring, file) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${icon(ring).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
};
await png(180, 1, join(root, 'public/apple-touch-icon.png'));
const parts = [];
// malé velikosti kreslí Chromium čtyřikrát větší a Pillow je zmenší (ostřejší než přímé vykreslení v 16 px)
for (const [size, ring] of [[16, 1.5], [32, 1.2], [48, 1.1]]) {
  const f = join(tmp, `${size}.png`);
  await png(size * 4, ring, f);
  parts.push(f);
}
await browser.close();
execFileSync('python3', ['-c', `
import sys
from PIL import Image
sizes=[16,32,48]
ims=[Image.open(f).convert('RGBA').resize((s,s),Image.LANCZOS) for f,s in zip(sys.argv[2:],sizes)]
ims[-1].save(sys.argv[1], format='ICO', sizes=[im.size for im in ims], append_images=ims[:-1])
`, join(root, 'public/favicon.ico'), ...parts]);
console.log('favicon.svg, favicon.ico, apple-touch-icon.png');
