/**
 * Hádanka dne: typy hádanek a výběr hádanky pro daný den.
 * Zásobník hádanek skládá při sestavení `riddles.ts` (každá hádanka jako /hadanky/<druh>-<n>.json);
 * prohlížeč zná jen počty po druzích a podle dne si spočítá, kterou hádanku stáhnout.
 * Tento soubor se dostane do prohlížeče, nesmí proto načítat data atlasu.
 */
import type { LocalizedString } from '../schemas/world';
import { mulberry32, shuffle } from './calendar';

/** Druhy hádanek v pevném pořadí (pořadí se mezi dny míchá). */
export const RIDDLE_KINDS = [
  'sin',
  'dilemma',
  'secret',
  'actors',
  'core',
  'cover',
  'motto',
  'character',
  'themes',
  'timeline',
  'axis',
  'depth',
  'kin',
  'trail',
  'intruder',
  'sinType',
  'dilemmaType',
] as const;

export type RiddleKind = (typeof RIDDLE_KINDS)[number];
export type RiddleCounts = Partial<Record<RiddleKind, number>>;

export type Accent = { light: string; dark: string };

export type RiddleChoice = {
  /** Id světa nebo slug putování. */
  id: string;
  label: LocalizedString;
  /** Cesta bez base (doplní withBase). */
  href: string;
  /** Po odpovědi: drobný údaj pod volbou (stupeň příbuznosti, hloubka, typ hříchu). */
  note?: LocalizedString;
  /** Po odpovědi: hodnota souřadnice 1–5 (hádanky na souřadnice). */
  value?: number;
};

export type Riddle = {
  key: string;
  kind: RiddleKind;
  prompt: LocalizedString;
  /** Nadpis nad indicií (název putování, typ hříchu). */
  heading?: LocalizedString;
  /** Indicie kurzívou v uvozovkách. */
  quote?: LocalizedString;
  /** Indicie po řádcích s popiskem (charakter, hlubina času). */
  lines?: Array<{ label: LocalizedString; text: LocalizedString }>;
  /** Indicie jako výčet (témata). */
  tags?: LocalizedString[];
  /** Světy v zadání (putování, příbuzný), s barvou archetypu; nikdy ne odpověď. */
  worlds?: Array<{ id: string; label: LocalizedString; accent: Accent }>;
  /** Pruh souřadnic tohoto světa bez barvy archetypu (aktéři a souřadnice). */
  axesOf?: string;
  /** Hádanky na souřadnici: která souřadnice a póly pro pruh pod volbami. */
  scale?: { left: LocalizedString; right: LocalizedString };
  choices: RiddleChoice[];
  answer: string;
  /** Svět, o kterém hádanka je; nesmí to být Svět dne. */
  about?: string;
  /** Po odpovědi odkaz dál (Galerie triád, Hlubina času, srovnání…). */
  more?: { label: LocalizedString; href: string };
};

export const riddleKey = (kind: RiddleKind, index: number) => `${kind}-${index}`;

/**
 * Pořadí druhů v bloku: druhy jsou napevno ve dvou polovinách (střídavě podle RIDDLE_KINDS) a v každém
 * bloku jde nejdřív promíchaná první polovina, pak promíchaná druhá. Stejný druh se tak vrátí
 * nejdřív po půl bloku (u 17 druhů po 9 dnech) a nejpozději zhruba po půldruhém bloku.
 */
function kindOrder(kinds: RiddleKind[], block: number): RiddleKind[] {
  const rand = mulberry32(block * 4099 + 13);
  const first = kinds.filter((_, i) => i % 2 === 0);
  const second = kinds.filter((_, i) => i % 2 === 1);
  return [...shuffle(first, rand), ...shuffle(second, rand)];
}

function kindSeed(kind: RiddleKind): number {
  let h = 7;
  for (const ch of kind) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * Hádanka pro den (pořadové číslo dne od 1. 1. 1970). Druhy se střídají po blocích: v každém bloku
 * přijde každý druh jednou a stejný druh se vrátí nejdřív po půl bloku (viz kindOrder). Uvnitř druhu
 * se hádanky berou v promíchaném pořadí, takže se žádná nezopakuje, dokud nepřijdou na řadu všechny.
 */
export function riddleSlot(day: number, counts: RiddleCounts): { kind: RiddleKind; index: number } | null {
  const kinds = RIDDLE_KINDS.filter((k) => (counts[k] ?? 0) > 0);
  const size = kinds.length;
  if (size === 0) return null;
  const block = Math.floor(day / size);
  const pos = ((day % size) + size) % size;
  const order = kindOrder(kinds, block);
  const kind = order[pos];
  const n = counts[kind] ?? 1;
  const cycle = Math.floor(block / n);
  const shuffled = shuffle(
    Array.from({ length: n }, (_, i) => i),
    mulberry32(kindSeed(kind) + cycle * 7919),
  );
  return { kind, index: shuffled[((block % n) + n) % n] };
}
