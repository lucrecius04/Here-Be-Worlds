import type { World } from '../schemas/world';
import { AXIS_KEYS } from './axes';
import overridesData from '../../data/meta/kinship-overrides.json';

export const MAX_COMPARE = 3;

/* Barvy srovnání (2026-11-21): mořská zeleň, purpurová a trávová zeleň (zelené nestojí vedle sebe). Leží v mezerách mezi
 * barvami archetypů i akcentem (ΔE2000 ≥ 15 vůči světlým i tmavým barvám archetypů, mezi sebou ≥ 27)
 * a mají kontrast ≥ 3,3 na papíře i na noci, takže stačí jedna sada pro oba motivy.
 * Podbarvení (wash) míchá compare.css z barvy a pozadí (color-mix), tady je jen pro úplnost. */
export const SLOT_COLORS = ['#1A9389', '#B74A9D', '#5F9205'] as const;
export const SLOT_WASH = [
  'rgba(26, 147, 137, 0.16)',
  'rgba(183, 74, 157, 0.16)',
  'rgba(95, 146, 5, 0.16)',
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

/* ---------- Stupně příbuznosti ----------
 * Index (affinityPercent) slouží jen k řazení a na webu se nezobrazuje.
 * Všechny dvojice publikovaných světů seřadíme podle indexu a rozdělíme podle podílu:
 * nejbližší 3 % = Sourozenci, dalších 9 % = Blízcí příbuzní, dalších 23 % = Spříznění,
 * dalších 30 % = Vzdálení příbuzní, zbytek = Cizí. Při úpravě výpočtu se stupně jen přeskupí.
 * Ruční výjimky: data/meta/kinship-overrides.json.
 */
export type KinshipLevel = 1 | 2 | 3 | 4 | 5;
export const KINSHIP_SHARES = [0.03, 0.12, 0.35, 0.65] as const;

type Override = { a: string; b: string; level: number };
const OVERRIDES = new Map<string, KinshipLevel>(
  ((overridesData as { pairs?: Override[] }).pairs ?? []).map((o) => [pairId(o.a, o.b), o.level as KinshipLevel]),
);

function pairId(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

const cutoffCache = new Map<string, number[]>();

/** Prahy indexu pro stupně 5, 4, 3, 2 (sestupně) nad všemi dvojicemi daných světů. */
export function kinshipCutoffs(all: World[]): number[] {
  const pool = all.filter((w) => !w.draft);
  const key = pool.map((w) => w.id).sort().join(',');
  const hit = cutoffCache.get(key);
  if (hit) return hit;
  const scores: number[] = [];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) scores.push(affinityPercent(pool[i], pool[j]));
  scores.sort((a, b) => b - a);
  const cut = KINSHIP_SHARES.map((share) => scores[Math.min(scores.length - 1, Math.floor(share * scores.length))] ?? 0);
  cutoffCache.set(key, cut);
  return cut;
}

export function levelFromPercent(percent: number, cutoffs: number[]): KinshipLevel {
  for (let i = 0; i < cutoffs.length; i++) if (percent >= cutoffs[i]) return (5 - i) as KinshipLevel;
  return 1;
}

export function isCuratedPair(a: World, b: World): boolean {
  return Boolean(
    a.relatedWorlds?.some((r) => r.id === b.id) || b.relatedWorlds?.some((r) => r.id === a.id),
  );
}

/** Kurátorská poznámka k dvojici (z kterékoli strany), pokud existuje. */
export function curatedNote(a: World, b: World) {
  return a.relatedWorlds?.find((r) => r.id === b.id)?.note ?? b.relatedWorlds?.find((r) => r.id === a.id)?.note;
}

export function kinshipLevel(a: World, b: World, all: World[]): KinshipLevel {
  const manual = OVERRIDES.get(pairId(a.id, b.id));
  if (manual) return manual;
  const computed = levelFromPercent(affinityPercent(a, b), kinshipCutoffs(all));
  return computed;
}

/** Nejpříbuznější světy (jediný index na webu: srovnání, karta i mapa), řazeno podle stupně a indexu. */
export function kinshipRanking(
  source: World,
  all: World[],
  limit = 3,
): Array<{ world: World; percent: number; level: KinshipLevel }> {
  return all
    .filter((world) => world.id !== source.id && !world.draft)
    .map((world) => ({ world, percent: affinityPercent(source, world), level: kinshipLevel(source, world, all) }))
    .sort((a, b) => b.level - a.level || b.percent - a.percent || a.world.id.localeCompare(b.world.id))
    .slice(0, limit);
}

/** Slovní síla pilíře podle podílu bodů (0–1); klíč do i18n `compare.strength*`. */
export function pillarStrength(value: number, max: number): 'Strong' | 'Marked' | 'Partial' | 'Faint' | 'None' {
  const r = max ? value / max : 0;
  if (r >= 0.8) return 'Strong';
  if (r >= 0.55) return 'Marked';
  if (r >= 0.3) return 'Partial';
  if (r > 0) return 'Faint';
  return 'None';
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

export type DiscoveryPair = { a: World; b: World; level: KinshipLevel };

/**
 * Náměty na prázdné srovnání (stejný index jako všude jinde):
 * nečekaní příbuzní = nejbližší dvojice z různých archetypů, protinožci = nejvzdálenější dvojice.
 * Každý svět se v jednom seznamu objeví nejvýš jednou, ať náměty nejsou o tomtéž.
 * Vrací zásobník (výchozí 9 dvojic); stránka z něj při každé návštěvě vybere tři.
 */
export function discoveryPairs(all: World[], count = 9): { unexpected: DiscoveryPair[]; opposites: DiscoveryPair[] } {
  const pool = all.filter((w) => !w.draft);
  const scored: Array<{ a: World; b: World; percent: number }> = [];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++)
      scored.push({ a: pool[i], b: pool[j], percent: affinityPercent(pool[i], pool[j]) });
  scored.sort((x, y) => y.percent - x.percent || x.a.id.localeCompare(y.a.id) || x.b.id.localeCompare(y.b.id));
  const pick = (list: typeof scored) => {
    const used = new Set<string>();
    const out: DiscoveryPair[] = [];
    for (const item of list) {
      if (used.has(item.a.id) || used.has(item.b.id)) continue;
      used.add(item.a.id);
      used.add(item.b.id);
      out.push({ a: item.a, b: item.b, level: kinshipLevel(item.a, item.b, pool) });
      if (out.length >= count) break;
    }
    return out;
  };
  return {
    unexpected: pick(scored.filter((item) => item.a.chapterId !== item.b.chapterId)),
    opposites: pick([...scored].reverse()),
  };
}

/** Dvojice, které atlas spojil ručně (relatedWorlds), každá jednou: zásobník oblíbených párů. */
export function curatedPairs(all: World[]): DiscoveryPair[] {
  const pool = all.filter((w) => !w.draft);
  const byId = new Map(pool.map((w) => [w.id, w]));
  const seen = new Set<string>();
  const out: DiscoveryPair[] = [];
  for (const a of pool) {
    for (const rel of a.relatedWorlds ?? []) {
      const b = rel.id ? byId.get(rel.id) : undefined;
      if (!b) continue;
      const key = pairId(a.id, b.id);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a, b, level: kinshipLevel(a, b, pool) });
    }
  }
  return out;
}
