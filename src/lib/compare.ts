import type { World } from '../schemas/world';
import { AXIS_KEYS } from './similarity';

export const MAX_COMPARE = 3;

export const SLOT_COLORS = ['#D4AF37', '#4EA8B4', '#9B7EDE'] as const;
export const SLOT_WASH = [
  'rgba(212, 175, 55, 0.16)',
  'rgba(78, 168, 180, 0.16)',
  'rgba(155, 126, 222, 0.18)',
] as const;

export function slotHue(index: number): string {
  return SLOT_COLORS[Math.min(Math.max(index, 0), SLOT_COLORS.length - 1)];
}

export function slotWash(index: number): string {
  return SLOT_WASH[Math.min(Math.max(index, 0), SLOT_WASH.length - 1)];
}

export const SUGGESTED_PAIRS: Array<[string, string]> = [
  ['baldurs-gate', 'dark-souls'],
  ['dark-souls', 'diablo'],
  ['baldurs-gate', 'diablo'],
];

export function parseCompareIds(search: string, valid: Set<string>): string[] {
  const params = new URLSearchParams(search);
  const raw = params.get('worlds') || params.get('w') || '';
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const token of raw.split(',')) {
    const id = token.trim();
    if (!id || !valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_COMPARE) break;
  }
  return ids;
}

export function writeCompareQuery(ids: string[]): void {
  const url = new URL(window.location.href);
  const cleaned = ids.filter(Boolean).slice(0, MAX_COMPARE);
  url.searchParams.delete('worlds');
  if (cleaned.length === 0) url.searchParams.delete('w');
  else url.searchParams.set('w', cleaned.join(','));
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function sharedThemes(worlds: World[]): string[] {
  if (worlds.length === 0) return [];
  return worlds[0].themes.filter((slug) => worlds.every((world) => world.themes.includes(slug)));
}

export function exclusiveThemes(world: World, others: World[]): string[] {
  return world.themes.filter((slug) => others.every((other) => !other.themes.includes(slug)));
}

export type ThemeCoverage = {
  slug: string;
  owners: number[];
};

export function themeCoverage(worlds: World[]): ThemeCoverage[] {
  const slugs = [...new Set(worlds.flatMap((world) => world.themes))];
  return slugs.map((slug) => ({
    slug,
    owners: worlds.flatMap((world, index) => (world.themes.includes(slug) ? [index] : [])),
  }));
}

export type AxisMatchKind = 'full' | 'partial' | 'spread';

export function axisMatchKind(values: number[]): AxisMatchKind {
  if (values.length < 2) return 'full';
  const unique = new Set(values);
  if (unique.size === 1) return 'full';
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const hasPair = [...counts.values()].some((count) => count >= 2);
  return hasPair ? 'partial' : 'spread';
}

const OVERLAP_PREFIX = /^(overlap|přesah|secondary|vedlejší)\s*:\s*/i;

export type AffinityBreakdown = {
  archetype: number;
  axes: number;
  character: number;
  themes: number;
  percent: number;
};

function enMain(field: { en: string }): string {
  return field.en.trim();
}

function enSub(field: { en: string; sub?: { en: string } }): string | null {
  const extra = field.sub?.en?.trim();
  return extra ? extra : null;
}

export function normalizeCue(value: string): string {
  return value.toLowerCase().replace(OVERLAP_PREFIX, '').trim();
}

function cueEquals(a: string, b: string): boolean {
  return normalizeCue(a) === normalizeCue(b);
}

function crossOverlap(aMain: string, aSub: string | null, bMain: string, bSub: string | null): boolean {
  if (aSub && cueEquals(aSub, bMain)) return true;
  if (bSub && cueEquals(bSub, aMain)) return true;
  return false;
}

function axisPoints(delta: number): number {
  if (delta <= 0) return 7;
  if (delta === 1) return 5;
  if (delta === 2) return 2;
  return 0;
}

function themePoints(shared: number): number {
  if (shared >= 3) return 15;
  if (shared === 2) return 11;
  if (shared === 1) return 6;
  return 0;
}

export function affinityBreakdown(a: World, b: World): AffinityBreakdown {
  const genreA = enMain(a.metadata.genreProfile);
  const genreB = enMain(b.metadata.genreProfile);
  const genreSubA = enSub(a.metadata.genreProfile);
  const genreSubB = enSub(b.metadata.genreProfile);
  let profile = 0;
  if (cueEquals(genreA, genreB)) profile = 8;
  else if (crossOverlap(genreA, genreSubA, genreB, genreSubB)) profile = 4;
  const chapter = a.chapterId === b.chapterId ? 12 : 0;
  const archetype = Math.round(chapter + profile);

  const axesRaw = AXIS_KEYS.reduce((sum, key) => {
    const delta = Math.abs(a.axes[key].value - b.axes[key].value);
    return sum + axisPoints(delta);
  }, 0);
  const axes = Math.round(axesRaw);

  const moodA = enMain(a.metadata.atmosphere);
  const moodB = enMain(b.metadata.atmosphere);
  const moodSubA = enSub(a.metadata.atmosphere);
  const moodSubB = enSub(b.metadata.atmosphere);
  let atmosphere = 0;
  if (cueEquals(moodA, moodB)) atmosphere += 5;
  if (
    (moodSubA && moodSubB && cueEquals(moodSubA, moodSubB)) ||
    crossOverlap(moodA, moodSubA, moodB, moodSubB)
  ) {
    atmosphere += 3;
  }
  atmosphere = Math.min(8, atmosphere);
  const power = cueEquals(enMain(a.metadata.sourceOfPower), enMain(b.metadata.sourceOfPower)) ? 6 : 0;
  const depth = cueEquals(enMain(a.metadata.historicalDepth), enMain(b.metadata.historicalDepth)) ? 4 : 0;
  const society = cueEquals(enMain(a.metadata.societalOrder), enMain(b.metadata.societalOrder)) ? 4 : 0;
  const perspective = cueEquals(
    enMain(a.metadata.protagonistPerspective),
    enMain(b.metadata.protagonistPerspective),
  )
    ? 4
    : 0;
  const space = cueEquals(enMain(a.metadata.spatialScope), enMain(b.metadata.spatialScope)) ? 4 : 0;
  const character = Math.round(atmosphere + power + depth + society + perspective + space);

  const sharedThemesCount = a.themes.filter((slug) => b.themes.includes(slug)).length;
  const themes = Math.round(themePoints(sharedThemesCount));

  return {
    archetype,
    axes,
    character,
    themes,
    percent: Math.min(100, archetype + axes + character + themes),
  };
}

export function averageBreakdown(pairs: KinshipPair[]): AffinityBreakdown {
  if (pairs.length === 0) {
    return { archetype: 0, axes: 0, character: 0, themes: 0, percent: 0 };
  }
  const n = pairs.length;
  const archetype = Math.round(pairs.reduce((sum, pair) => sum + pair.breakdown.archetype, 0) / n);
  const axes = Math.round(pairs.reduce((sum, pair) => sum + pair.breakdown.axes, 0) / n);
  const character = Math.round(pairs.reduce((sum, pair) => sum + pair.breakdown.character, 0) / n);
  const themes = Math.round(pairs.reduce((sum, pair) => sum + pair.breakdown.themes, 0) / n);
  return {
    archetype,
    axes,
    character,
    themes,
    percent: Math.min(100, archetype + axes + character + themes),
  };
}

export function affinityPercent(a: World, b: World): number {
  return affinityBreakdown(a, b).percent;
}

export type KinshipPair = {
  left: number;
  right: number;
  percent: number;
  breakdown: AffinityBreakdown;
};

export function kinshipPairs(worlds: World[]): KinshipPair[] {
  const pairs: KinshipPair[] = [];
  for (let i = 0; i < worlds.length; i++) {
    for (let j = i + 1; j < worlds.length; j++) {
      const breakdown = affinityBreakdown(worlds[i], worlds[j]);
      pairs.push({
        left: i,
        right: j,
        percent: breakdown.percent,
        breakdown,
      });
    }
  }
  return pairs.sort((a, b) => b.percent - a.percent || a.left - b.left);
}

export function majorityIndexes(values: string[]): number[] | null {
  if (values.length < 3) return null;
  const counts = new Map<string, number[]>();
  values.forEach((value, index) => {
    const list = counts.get(value) ?? [];
    list.push(index);
    counts.set(value, list);
  });
  const majority = [...counts.values()].find((indexes) => indexes.length === values.length - 1);
  return majority && majority.length >= 2 ? majority : null;
}

export type AxisSpread = {
  key: (typeof AXIS_KEYS)[number];
  spread: number;
  min: number;
  max: number;
};

export function axisSpreads(worlds: World[]): AxisSpread[] {
  if (worlds.length === 0) return [];
  return AXIS_KEYS.map((key) => {
    const values = worlds.map((world) => world.axes[key].value);
    return {
      key,
      spread: Math.max(...values) - Math.min(...values),
      min: Math.min(...values),
      max: Math.max(...values),
    };
  });
}

export function closestAxisIds(worlds: World[]): Array<(typeof AXIS_KEYS)[number]> {
  if (worlds.length < 2) return [];
  const spreads = axisSpreads(worlds);
  const min = Math.min(...spreads.map((item) => item.spread));
  return spreads.filter((item) => item.spread === min).map((item) => item.key);
}

export function farthestAxis(worlds: World[]): AxisSpread | null {
  if (worlds.length < 2) return null;
  const spreads = axisSpreads(worlds);
  const max = Math.max(...spreads.map((item) => item.spread));
  return spreads.find((item) => item.spread === max) ?? null;
}

export function kinshipPercent(worlds: World[]): number {
  if (worlds.length < 2) return 0;
  const pairs = kinshipPairs(worlds);
  const mean = pairs.reduce((sum, pair) => sum + pair.percent, 0) / pairs.length;
  return Math.round(mean);
}

export function valueFrequencies(values: string[]): number[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return values.map((value) => counts.get(value) ?? 0);
}
