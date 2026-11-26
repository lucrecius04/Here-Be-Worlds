/**
 * Obrázky k putováním (styl: docs/obrazky-putovani.md). Soubory v public/putovani-obrazky/:
 * <slug>-1.jpg pod úvodním citátem eseje a jako náhled v rejstříku, <slug>-2.jpg (a -3.jpg…) rozložené textem eseje.
 * Masky: maska/<soubor>.png podle tuše pro tmavý motiv (scripts/ink-masks.py), maska/freska.png obecná.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { withBase } from './base-url';
import { TRAIL_SLUGS, type TrailId } from './trails';

/** dark: volitelná varianta pro tmavý motiv (<soubor>-dark.jpg), když tuš sahá k okraji papíru a krémový lem by v noci prosvítal. */
export type TrailImage = { src: string; dark?: string; ink?: string; inkLight?: string; mask: string };

/** Putování, která už obrázky mají: počet obrázků (první pod citátem, další rovnoměrně textem). */
export const READY: Record<TrailId, number> = {
  'gods-burden': 2,
  house: 2,
  'indifferent-stars': 2,
  'endless-war': 3,
  'living-city': 2,
  loops: 3,
  'dead-speak': 3,
  'monster-mirror': 1,
  'god-corpse': 3,
  'knows-you-play': 3,
  scapegoat: 3,
  'who-woke-up': 3,
  'cursed-legacy': 3,
  'free-will': 3,
  'failed-paradise': 3,
  corporate: 3,
  laughter: 3,
  'chronicle-keepers': 3,
  copies: 3,
  'endless-work': 3,
  'true-names': 3,
};

const DIR = 'putovani-obrazky';

/** Adresa s otiskem obsahu (?v=…): po výměně obrázku pod stejným jménem prohlížeč nesmíchá starý obrázek s novou maskou. */
function versioned(base: string, path: string): string {
  const v = createHash('md5').update(readFileSync(`public/${path}`)).digest('hex').slice(0, 8);
  return `${withBase(base, `/${path}`)}?v=${v}`;
}

function image(base: string, file: string): TrailImage {
  const ink = `${DIR}/maska/${file.replace(/\.jpg$/, '.png')}`;
  const inkLight = ink.replace(/\.png$/, '-light.png');
  const dark = `${DIR}/${file.replace(/\.jpg$/, '-dark.jpg')}`;
  return {
    src: versioned(base, `${DIR}/${file}`),
    dark: existsSync(`public/${dark}`) ? versioned(base, dark) : undefined,
    ink: existsSync(`public/${ink}`) ? versioned(base, ink) : undefined,
    inkLight: existsSync(`public/${inkLight}`) ? versioned(base, inkLight) : undefined,
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
