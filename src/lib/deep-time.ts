/**
 * Hlubina času (/hlubina-casu/): časové osy kronik jako hloubka v letech před přítomností světa.
 * Data v data/meta/deep-time.json (ověřená proti Faktografii kronik). Tady jen typy, odvozené
 * údaje a měřítko (logaritmické od jednoho roku, pod rokem odmocnina, dole mýtický čas).
 */
import raw from '../../data/meta/deep-time.json';

export type DeepKind = 'origin' | 'turn' | 'catastrophe' | 'game';
/** Hloubka: roky, [od, do] = odhad, 'myth' = mýtický čas, null = kronika datum neuvádí. */
export type DeepAgo = number | [number, number] | 'myth' | null;
export type DeepEvent = {
  ago?: DeepAgo;
  /** Roky po přítomnosti (pozdější díly a odbočky); jen v seznamu. */
  after?: number | [number, number];
  when: string;
  kind: DeepKind;
  text: string;
};
export type DeepWorld = { present: string; presentYear?: number; cycle?: string; events: DeepEvent[] };

export const DEEP_TIME: Record<string, DeepWorld> = (raw as unknown as { worlds: Record<string, DeepWorld> }).worlds;

export const isRange = (ago: DeepAgo | undefined): ago is [number, number] => Array.isArray(ago);
export const isPlaced = (e: DeepEvent) => typeof e.ago === 'number' || isRange(e.ago);
/** Hloubka pro řazení a měřítko: u odhadu geometrický střed. */
export const agoMid = (ago: DeepAgo | undefined): number | null =>
  typeof ago === 'number' ? ago : isRange(ago) ? Math.sqrt(Math.max(ago[0], 1e-6) * ago[1]) : null;
export const agoMax = (ago: DeepAgo | undefined): number | null =>
  typeof ago === 'number' ? ago : isRange(ago) ? ago[1] : null;

export type DeepSummary = {
  /** Nejhlubší umístěná událost (u odhadu horní mez). */
  deepest: number;
  /** Totéž pro řazení (u odhadu geometrický střed). */
  deepestMid: number;
  deepestEvent: DeepEvent | null;
  /** Hratelná vrstva: od přítomnosti po nejstarší událost, která je hrou. */
  played: number;
  hasMyth: boolean;
  /** Žádné přesné datum kromě přítomnosti (jen odhady a mýtus). */
  noDates: boolean;
};

export function summarize(world: DeepWorld): DeepSummary {
  let deepest = 0;
  let deepestMid = 0;
  let deepestEvent: DeepEvent | null = null;
  let played = 0;
  for (const e of world.events) {
    const max = agoMax(e.ago);
    const mid = agoMid(e.ago);
    if (max === null || mid === null) continue;
    if (mid > deepestMid) {
      deepestMid = mid;
      deepest = max;
      deepestEvent = e;
    }
    if (e.kind === 'game') played = Math.max(played, max);
  }
  return {
    deepest,
    deepestMid,
    deepestEvent,
    played,
    hasMyth: world.events.some((e) => e.ago === 'myth'),
    noDates: !world.events.some((e) => typeof e.ago === 'number' && e.ago > 0),
  };
}

/* ---------- měřítko ---------- */

export const SCALE = {
  /** výška pásma pod jeden rok (odmocnina) */
  subYear: 34,
  /** výška jednoho řádu (×10) */
  decade: 58,
  /** nejhlubší řád na stupnici (10^10,2 ≈ 16 miliard let) */
  maxLog: 10.2,
  /** mezera mezi měřitelným a mýtickým časem */
  gap: 30,
  /** výška mýtického pásma */
  myth: 92,
};

/** Svislá poloha pod hladinou (0 = teď) v jednotkách SVG. */
export function depthY(years: number, decade = SCALE.decade): number {
  if (years <= 0) return 0;
  if (years < 1) return SCALE.subYear * Math.sqrt(years);
  return SCALE.subYear + Math.min(Math.log10(years), SCALE.maxLog) * decade;
}

export const measuredHeight = (decade = SCALE.decade) => SCALE.subYear + SCALE.maxLog * decade;
export const mythTop = (decade = SCALE.decade) => measuredHeight(decade) + SCALE.gap;

/** Řády na stupnici: 1 rok … 10 miliard let. */
export const DECADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Délky z našeho světa pro měřítko (šedé značky u stupnice). */
/* ---------- naše časová osa (světy s naším letopočtem) ---------- */

/** Rok události v našem letopočtu (u odhadu střed), nebo null. */
export function eventYear(e: DeepEvent, presentYear: number): number | null {
  if (e.after !== undefined) return typeof e.after === 'number' ? presentYear + e.after : null;
  const mid = agoMid(e.ago);
  return mid === null ? null : presentYear - mid;
}

/** Rok slovy: „1543“, „852 př. n. l.“, „před 60 miliony let“. */
export function formatYear(year: number, locale: Loc): string {
  const y = Math.round(year);
  if (y >= 1) return y >= 10000 ? nf(y, locale) : String(y);
  const bc = 1 - y;
  if (bc < 1e6) return locale === 'cs' ? `${nf(bc, locale)} př. n. l.` : `${nf(bc, locale)} BC`;
  if (bc < 1e9) return locale === 'cs' ? `${nf(Number((bc / 1e6).toPrecision(2)), locale, 1)} mil. let př. n. l.` : `${nf(Number((bc / 1e6).toPrecision(2)), locale, 1)} million years BC`;
  return locale === 'cs' ? `${nf(Number((bc / 1e9).toPrecision(2)), locale, 1)} mld. let př. n. l.` : `${nf(Number((bc / 1e9).toPrecision(2)), locale, 1)} billion years BC`;
}

/** Události z našeho světa na naší časové ose; `year` = rok (záporný = před n. l.), `when` = popisek data. */
export const YARDSTICKS: Array<{ year: number; key: string; when: string }> = [
  { year: -3200, key: 'deepTime.yardWriting', when: 'deepTime.yardWritingWhen' },
  { year: -300000, key: 'deepTime.yardSapiens', when: 'deepTime.yardSapiensWhen' },
  { year: -66000000, key: 'deepTime.yardDinosaurs', when: 'deepTime.yardDinosaursWhen' },
  { year: -4540000000, key: 'deepTime.yardEarth', when: 'deepTime.yardEarthWhen' },
  { year: -13800000000, key: 'deepTime.yardUniverse', when: 'deepTime.yardUniverseWhen' },
];

/* ---------- slovy ---------- */

type Loc = 'cs' | 'en';
export const nf = (n: number, locale: Loc, digits = 0) =>
  n.toLocaleString(locale === 'cs' ? 'cs-CZ' : 'en-GB', { maximumFractionDigits: digits });
const csPlural = (n: number, one: string, few: string, many: string) =>
  n === 1 ? one : n >= 2 && n <= 4 && Number.isInteger(n) ? few : many;

/** Délka slovy: „22 minut“, „11 dní“, „4 208 let“, „37 milionů let“, „1 miliarda let“. */
export function formatDuration(years: number, locale: Loc): string {
  if (years <= 0) return locale === 'cs' ? 'teď' : 'now';
  if (years < 1 / 365) {
    const m = Math.round(years * 525960);
    return locale === 'cs' ? `${m} ${csPlural(m, 'minuta', 'minuty', 'minut')}` : `${m} minutes`;
  }
  if (years < 1) {
    const d = Math.round(years * 365);
    return locale === 'cs' ? `${d} ${csPlural(d, 'den', 'dny', 'dní')}` : `${d} ${d === 1 ? 'day' : 'days'}`;
  }
  if (years < 1e6) {
    const y = Math.round(years);
    return locale === 'cs' ? `${nf(y, locale)} ${csPlural(y, 'rok', 'roky', 'let')}` : `${nf(y, locale)} ${y === 1 ? 'year' : 'years'}`;
  }
  if (years < 1e9) {
    const m = Number((years / 1e6).toPrecision(2));
    return locale === 'cs' ? `${nf(m, locale, 1)} ${csPlural(m, 'milion', 'miliony', 'milionů')} let` : `${nf(m, locale, 1)} million years`;
  }
  const b = Number((years / 1e9).toPrecision(2));
  return locale === 'cs'
    ? `${nf(b, locale, 1)} ${Number.isInteger(b) ? csPlural(b, 'miliarda', 'miliardy', 'miliard') : 'miliardy'} let`
    : `${nf(b, locale, 1)} billion years`;
}

const MAGNITUDE: Array<[number, number, { cs: string; en: string }]> = [
  [100, 1000, { cs: 'řádově staletí', en: 'centuries' }],
  [1000, 10000, { cs: 'řádově tisíce let', en: 'thousands of years' }],
  [100000, 1000000, { cs: 'statisíce let', en: 'hundreds of millennia' }],
  [1000000, 10000000, { cs: 'miliony let', en: 'millions of years' }],
  [10000000, 100000000, { cs: 'desítky milionů let', en: 'tens of millions of years' }],
];

/** Hloubka události slovy (bez „před“): číslo, odhad, mýtus nebo „bez data“. */
export function formatAgo(e: DeepEvent, locale: Loc): string {
  if (e.after !== undefined) {
    const a = e.after;
    if (Array.isArray(a)) {
      const m = MAGNITUDE.find(([lo, hi]) => lo === a[0] && hi === a[1]);
      return `+ ${m ? m[2][locale] : `${nf(a[0], locale)}–${formatDuration(a[1], locale)}`}`;
    }
    return `+ ${formatDuration(a, locale)}`;
  }
  const ago = e.ago;
  if (ago === 'myth') return locale === 'cs' ? 'mýtický čas' : 'mythic time';
  if (ago === null || ago === undefined) return locale === 'cs' ? 'bez data' : 'undated';
  if (Array.isArray(ago)) {
    const m = MAGNITUDE.find(([lo, hi]) => lo === ago[0] && hi === ago[1]);
    if (m) return m[2][locale];
    if (ago[1] >= 1e6) {
      const unit = ago[1] >= 1e9 ? 1e9 : 1e6;
      const tail = formatDuration(ago[1], locale);
      return `${nf(Number((ago[0] / unit).toPrecision(2)), locale, 1)}–${tail}`;
    }
    return `${nf(ago[0], locale)}–${formatDuration(ago[1], locale)}`;
  }
  return formatDuration(ago, locale);
}
