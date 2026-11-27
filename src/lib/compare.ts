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

/* ---------- Index příbuznosti: šest pilířů ve dvou trojicích (2026-11-27) ----------
 * PODOBA (62): Archetyp 10 · Souřadnice 25 · Charakter 27
 * POVAHA (38): Témata 22 · Triáda (jádro příběhu) 10 · Vyprávění 6
 *
 * Počítá se jen z dat světů a pevných koeficientů. Triáda, vyprávění a paměť světa jsou
 * v `world.kin` (doplňuje `kin-worlds.ts`); svět bez `kin` za ně nedostane nic.
 * U řídkých údajů (témata, vyprávění) se počítá jen to, co světy sdílejí: chybějící
 * nástroj vyprávění nic neznamená, protože kronika vybírá jen hlavní nástroje.
 * Analýza a měření: Claude Docs „Index příbuznosti světů — analýza a návrh“, shrnutí v docs/stav.md.
 */
export const PILLARS = [
  { key: 'archetype', max: 10, half: 'look' },
  { key: 'axes', max: 25, half: 'look' },
  { key: 'character', max: 27, half: 'look' },
  { key: 'themes', max: 22, half: 'nature' },
  { key: 'triad', max: 10, half: 'nature' },
  { key: 'narration', max: 6, half: 'nature' },
] as const;

export type PillarKey = (typeof PILLARS)[number]['key'];
export type KinHalf = 'look' | 'nature';
export const HALF_MAX: Record<KinHalf, number> = { look: 62, nature: 38 };

/** Koeficienty: jediné místo, kde se váhy nastavují. */
export const KIN_POINTS = {
  /**
   * Archetyp: společný hlavní archetyp; hlavní jednoho je přesahem druhého (`chapterCross`); společný jen
   * přesah (`chapterOverlap`). Počítá se nejvyšší z těch tří. Profil: stejný, nebo přes přesah profilu.
   */
  archetype: { chapter: 6, chapterCross: 4, chapterOverlap: 2, profile: 4, profileNear: 2 },
  /** Body za jednu souřadnici podle rozdílu hodnot 0, 1, 2, 3+. */
  axis: [5, 3.5, 1.5, 0],
  character: { moodEach: 4, power: 5, society: 4, space: 4, perspective: 2, depthKind: 2, memorySpan: 1, myth: 1 },
  /** Body za 0, 1, 2 a 3+ společná témata. */
  themes: [0, 9, 16, 22],
  triad: { sin: 4, sinNear: 2, dilemma: 4, mystery: 2 },
  /** Jeden společný způsob, dva a víc; bez společného způsobu body za společný kruh Zákulisí / Hráč. */
  narration: { one: 3, many: 6, metaRing: 2, max: 6 },
} as const;

/** Kruhy, které má jen menšina světů; společný kruh se počítá i bez společného způsobu. */
export const META_RINGS = ['zakulisi', 'hrac'] as const;

export type AffinityBreakdown = Record<PillarKey, number> & {
  /** Součet šesti pilířů (0–100). Na webu se nezobrazuje, slouží jen k řazení a stupňům. */
  percent: number;
  look: number;
  nature: number;
};

/** Co přesně dva světy sdílejí (podklad pro vlákna na Srovnání). Jen klíče a id, texty skládá stránka. */
export type KinshipEvidence = {
  archetype: {
    /** `same` společný hlavní archetyp · `cross` hlavní jednoho je přesahem druhého · `overlap` společný jen přesah. */
    chapter: 'same' | 'cross' | 'overlap' | null;
    /** Id archetypu, který světy sdílejí. */
    shared: string | null;
    profile: 'same' | 'near' | null;
  };
  axes: { same: Array<(typeof AXIS_KEYS)[number]>; near: Array<(typeof AXIS_KEYS)[number]> };
  character: {
    /** Společné nálady: `main` / `sub` říká, kde ji má první svět (kvůli lokalizovanému názvu). */
    moods: Array<'main' | 'sub'>;
    fields: Array<'sourceOfPower' | 'societalOrder' | 'spatialScope' | 'historicalDepth' | 'protagonistPerspective'>;
    memorySpan: boolean;
    myth: boolean;
  };
  themes: string[];
  triad: { sin: 'same' | 'near' | null; dilemma: boolean; mystery: boolean };
  narration: { techniques: string[]; rings: string[] };
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

function sameField(a: World, b: World, key: keyof World['metadata']): boolean {
  return cueEquals(enMain(a.metadata[key]), enMain(b.metadata[key]));
}

/** Délka paměti ve stejném řádu: nejhlubší datované události se neliší víc než desetkrát. */
function sameMemorySpan(a: World, b: World): boolean {
  const x = a.kin?.memory;
  const y = b.kin?.memory;
  if (!x || !y) return false;
  return Math.abs(Math.log10(x) - Math.log10(y)) <= 1;
}

const round1 = (v: number) => Math.round(v * 10) / 10;

/** Který archetyp světy sdílejí: hlavní, hlavní jednoho s přesahem druhého, nebo jen přesah obou. */
function sharedArchetype(a: World, b: World): Pick<KinshipEvidence['archetype'], 'chapter' | 'shared'> {
  if (a.chapterId === b.chapterId) return { chapter: 'same', shared: a.chapterId };
  if (b.secondaryChapterId === a.chapterId) return { chapter: 'cross', shared: a.chapterId };
  if (a.secondaryChapterId === b.chapterId) return { chapter: 'cross', shared: b.chapterId };
  if (a.secondaryChapterId && a.secondaryChapterId === b.secondaryChapterId)
    return { chapter: 'overlap', shared: a.secondaryChapterId };
  return { chapter: null, shared: null };
}

export function kinshipEvidence(a: World, b: World): KinshipEvidence {
  const genreA = enMain(a.metadata.genreProfile);
  const genreB = enMain(b.metadata.genreProfile);
  const genreSubA = enSub(a.metadata.genreProfile);
  const genreSubB = enSub(b.metadata.genreProfile);
  const profile = cueEquals(genreA, genreB)
    ? 'same'
    : (genreSubA && cueEquals(genreSubA, genreB)) || (genreSubB && cueEquals(genreSubB, genreA))
      ? 'near'
      : null;

  const same: KinshipEvidence['axes']['same'] = [];
  const near: KinshipEvidence['axes']['near'] = [];
  for (const key of AXIS_KEYS) {
    const delta = Math.abs(a.axes[key].value - b.axes[key].value);
    if (delta === 0) same.push(key);
    else if (delta === 1) near.push(key);
  }

  /* Nálada jako dvojice hlavní + vedlejší: počítá se každá nálada, kterou mají oba světy, ať je u nich hlavní, nebo vedlejší. */
  const moodsB = [enMain(b.metadata.atmosphere), enSub(b.metadata.atmosphere)].filter((m): m is string => Boolean(m)).map(normalizeCue);
  const moods: Array<'main' | 'sub'> = [];
  if (moodsB.includes(normalizeCue(enMain(a.metadata.atmosphere)))) moods.push('main');
  const subA = enSub(a.metadata.atmosphere);
  if (subA && normalizeCue(subA) !== normalizeCue(enMain(a.metadata.atmosphere)) && moodsB.includes(normalizeCue(subA))) moods.push('sub');

  const fields = (
    ['sourceOfPower', 'societalOrder', 'spatialScope', 'historicalDepth', 'protagonistPerspective'] as const
  ).filter((key) => sameField(a, b, key));

  const ka = a.kin;
  const kb = b.kin;
  const sin: KinshipEvidence['triad']['sin'] =
    ka && kb
      ? ka.sin === kb.sin
        ? 'same'
        : ka.sinAlso === kb.sin || kb.sinAlso === ka.sin
          ? 'near'
          : null
      : null;

  const toolsB = kb?.tools ?? [];
  const techniques = (ka?.tools ?? []).map((x) => x.t).filter((t) => toolsB.some((y) => y.t === t));
  const ringsOf = (tools: NonNullable<World['kin']>['tools']) => new Set(tools.flatMap((x) => (x.also ? [x.ring, x.also] : [x.ring])));
  const ringsA = ringsOf(ka?.tools ?? []);
  const ringsB = ringsOf(toolsB);
  const coveredRings = new Set((ka?.tools ?? []).filter((x) => techniques.includes(x.t)).map((x) => x.ring));
  const rings = META_RINGS.filter((r) => ringsA.has(r) && ringsB.has(r) && !coveredRings.has(r));

  return {
    archetype: { ...sharedArchetype(a, b), profile },
    axes: { same, near },
    character: { moods, fields, memorySpan: sameMemorySpan(a, b), myth: Boolean(ka?.myth && kb?.myth) },
    themes: a.themes.filter((slug) => b.themes.includes(slug)),
    triad: { sin, dilemma: Boolean(ka && kb && ka.dilemma === kb.dilemma), mystery: Boolean(ka && kb && ka.mystery === kb.mystery) },
    narration: { techniques, rings: [...rings] },
  };
}

export function affinityBreakdown(a: World, b: World): AffinityBreakdown {
  const ev = kinshipEvidence(a, b);
  const P = KIN_POINTS;

  const archetype =
    (ev.archetype.chapter === 'same'
      ? P.archetype.chapter
      : ev.archetype.chapter === 'cross'
        ? P.archetype.chapterCross
        : ev.archetype.chapter === 'overlap'
          ? P.archetype.chapterOverlap
          : 0) +
    (ev.archetype.profile === 'same' ? P.archetype.profile : ev.archetype.profile === 'near' ? P.archetype.profileNear : 0);

  const axes = AXIS_KEYS.reduce((sum, key) => {
    const delta = Math.abs(a.axes[key].value - b.axes[key].value);
    return sum + (P.axis[Math.min(delta, 3)] ?? 0);
  }, 0);

  const has = (key: KinshipEvidence['character']['fields'][number]) => ev.character.fields.includes(key);
  const character =
    ev.character.moods.length * P.character.moodEach +
    (has('sourceOfPower') ? P.character.power : 0) +
    (has('societalOrder') ? P.character.society : 0) +
    (has('spatialScope') ? P.character.space : 0) +
    (has('protagonistPerspective') ? P.character.perspective : 0) +
    (has('historicalDepth') ? P.character.depthKind : 0) +
    (ev.character.memorySpan ? P.character.memorySpan : 0) +
    (ev.character.myth ? P.character.myth : 0);

  const themes = P.themes[Math.min(ev.themes.length, 3)];

  const triad =
    (ev.triad.sin === 'same' ? P.triad.sin : ev.triad.sin === 'near' ? P.triad.sinNear : 0) +
    (ev.triad.dilemma ? P.triad.dilemma : 0) +
    (ev.triad.mystery ? P.triad.mystery : 0);

  const narration = Math.min(
    P.narration.max,
    (ev.narration.techniques.length >= 2 ? P.narration.many : ev.narration.techniques.length === 1 ? P.narration.one : 0) +
      ev.narration.rings.length * P.narration.metaRing,
  );

  const look = round1(archetype + axes + character);
  const nature = round1(themes + triad + narration);
  return {
    archetype,
    axes: round1(axes),
    character,
    themes,
    triad,
    narration,
    look,
    nature,
    percent: round1(Math.min(100, look + nature)),
  };
}

export function averageBreakdown(pairs: KinshipPair[]): AffinityBreakdown {
  const n = pairs.length || 1;
  const mean = (key: PillarKey | 'look' | 'nature' | 'percent') => round1(pairs.reduce((sum, pair) => sum + pair.breakdown[key], 0) / n);
  return {
    archetype: mean('archetype'),
    axes: mean('axes'),
    character: mean('character'),
    themes: mean('themes'),
    triad: mean('triad'),
    narration: mean('narration'),
    look: mean('look'),
    nature: mean('nature'),
    percent: mean('percent'),
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

function cutoffsFor(all: World[], measure: 'percent' | KinHalf): number[] {
  const pool = all.filter((w) => !w.draft);
  const key = `${measure}:${pool.map((w) => w.id).sort().join(',')}`;
  const hit = cutoffCache.get(key);
  if (hit) return hit;
  const scores: number[] = [];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) scores.push(affinityBreakdown(pool[i], pool[j])[measure]);
  scores.sort((a, b) => b - a);
  const cut = KINSHIP_SHARES.map((share) => scores[Math.min(scores.length - 1, Math.floor(share * scores.length))] ?? 0);
  cutoffCache.set(key, cut);
  return cut;
}

/** Prahy indexu pro stupně 5, 4, 3, 2 (sestupně) nad všemi dvojicemi daných světů. */
export function kinshipCutoffs(all: World[]): number[] {
  return cutoffsFor(all, 'percent');
}

/**
 * Stupeň podoby a stupeň povahy: každá trojice pilířů se seřadí přes všechny dvojice stejně jako
 * celý index a dostane stejných pět stupňů. Slouží jen k větě o druhu příbuznosti na Srovnání.
 */
export function kinshipHalves(a: World, b: World, all: World[]): Record<KinHalf, KinshipLevel> {
  const score = affinityBreakdown(a, b);
  return {
    look: levelFromPercent(score.look, cutoffsFor(all, 'look')),
    nature: levelFromPercent(score.nature, cutoffsFor(all, 'nature')),
  };
}

export function levelFromPercent(percent: number, cutoffs: number[]): KinshipLevel {
  for (let i = 0; i < cutoffs.length; i++) if (percent >= cutoffs[i]) return (5 - i) as KinshipLevel;
  return 1;
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
 * Náměty na prázdné srovnání, všechny jen z indexu (nic ručně spojeného):
 * skrytí příbuzní = dvojice blízké povahou (stupeň povahy aspoň Blízcí příbuzní), ale vzdálené
 * podobou (nejvýš Vzdálení příbuzní), celkově aspoň Spříznění; nečekaní příbuzní = nejbližší dvojice
 * z různých archetypů; protinožci = nejvzdálenější dvojice.
 * Každý svět se v jednom seznamu objeví nejvýš jednou, ať náměty nejsou o tomtéž.
 * Vrací zásobník (výchozí 9 dvojic); stránka z něj při každé návštěvě vybere tři.
 */
export function discoveryPairs(
  all: World[],
  count = 9,
): { hidden: DiscoveryPair[]; unexpected: DiscoveryPair[]; opposites: DiscoveryPair[] } {
  const pool = all.filter((w) => !w.draft);
  const scored: Array<{ a: World; b: World; percent: number; look: number; nature: number }> = [];
  for (let i = 0; i < pool.length; i++)
    for (let j = i + 1; j < pool.length; j++) {
      const score = affinityBreakdown(pool[i], pool[j]);
      scored.push({ a: pool[i], b: pool[j], percent: score.percent, look: score.look, nature: score.nature });
    }
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
  const hidden = scored
    .filter((item) => {
      const halves = kinshipHalves(item.a, item.b, pool);
      return halves.nature >= 4 && halves.look <= 2 && kinshipLevel(item.a, item.b, pool) >= 3;
    })
    .sort((x, y) => y.nature - x.nature || x.look - y.look || x.a.id.localeCompare(y.a.id) || x.b.id.localeCompare(y.b.id));
  return {
    hidden: pick(hidden),
    unexpected: pick(scored.filter((item) => item.a.chapterId !== item.b.chapterId)),
    opposites: pick([...scored].reverse()),
  };
}
