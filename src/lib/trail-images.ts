/**
 * Obrázky k putováním (styl: docs/obrazky-putovani.md). Soubory v public/putovani-obrazky/:
 * <slug>-1.jpg pod úvodním citátem eseje a jako náhled v rejstříku, <slug>-2.jpg uprostřed eseje.
 * Masky: maska/<soubor>.png podle tuše pro tmavý motiv (scripts/ink-masks.py), maska/freska.png obecná.
 */
import { existsSync } from 'node:fs';
import { withBase } from './base-url';
import { TRAIL_SLUGS, type TrailId } from './trails';

export type TrailImage = { src: string; ink?: string; mask: string };

/** Putování, která už obrázky mají: počet obrázků (1 nebo 2). */
const READY: Record<TrailId, 1 | 2> = {
  'gods-burden': 2,
};

const DIR = 'putovani-obrazky';

function image(base: string, file: string): TrailImage {
  const ink = `${DIR}/maska/${file.replace(/\.jpg$/, '.png')}`;
  return {
    src: withBase(base, `/${DIR}/${file}`),
    ink: existsSync(`public/${ink}`) ? withBase(base, `/${ink}`) : undefined,
    mask: withBase(base, `/${DIR}/maska/freska.png`),
  };
}

export function trailImages(base: string, id: TrailId): TrailImage[] {
  const n = READY[id] ?? 0;
  const slug = TRAIL_SLUGS[id];
  return Array.from({ length: n }, (_, i) => image(base, `${slug}-${i + 1}.jpg`));
}

/** Náhledy do rejstříku putování: id → první obrázek. */
export function trailThumbs(base: string): Record<string, TrailImage> {
  return Object.fromEntries(
    Object.keys(READY).map((id) => [id, trailImages(base, id)[0]]),
  );
}
