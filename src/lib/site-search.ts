/**
 * Hledání v hlavičce webu (lupa): typy rejstříku, index a skupiny výsledků.
 * Rejstřík skládá při sestavení `site-search-index.ts` (/search-index.json);
 * tady se jen načte a prohledává. Pravidla dotazu jsou stejná jako v katalogu
 * (`SEARCH_OPTIONS`): všechna slova, bez diakritiky, začátek slova, překlep od šesti písmen.
 */
import MiniSearch from 'minisearch';
import { normalizeTerm, SEARCH_OPTIONS } from './search';

type Pair = { cs: string; en: string };

export type SearchKind = 'world' | 'trail' | 'theme' | 'chapter' | 'term' | 'page';

export type SearchEntry = {
  kind: SearchKind;
  id: string;
  title: Pair;
  sub?: Pair;
  href: string;
  /** Téma: druhý odkaz na putování k tématu. */
  altHref?: string;
  /** Téma: počet světů. */
  count?: number;
  hue?: { light: string; dark: string };
  keys: string;
};

/** Pořadí skupin a kolik výsledků se z každé ukáže. */
export const SEARCH_GROUPS: { kind: SearchKind; limit: number }[] = [
  { kind: 'world', limit: 5 },
  { kind: 'trail', limit: 3 },
  { kind: 'theme', limit: 3 },
  { kind: 'chapter', limit: 7 }, // archetypů je jen sedm: ukázat všechny, které sedí
  { kind: 'term', limit: 3 },
  { kind: 'page', limit: 3 },
];

type Doc = { key: string; kind: SearchKind; titleCs: string; titleEn: string; sub: string; keys: string };

export type SiteIndex = { mini: MiniSearch<Doc>; byKey: Map<string, SearchEntry>; order: Map<string, number> };

export function createSiteIndex(entries: SearchEntry[]): SiteIndex {
  const byKey = new Map(entries.map((e) => [`${e.kind}:${e.id}`, e]));
  const order = new Map(entries.map((e, i) => [`${e.kind}:${e.id}`, i]));
  const mini = new MiniSearch<Doc>({
    idField: 'key',
    fields: ['titleCs', 'titleEn', 'sub', 'keys'],
    storeFields: ['key'],
    processTerm: normalizeTerm,
    searchOptions: { boost: { titleCs: 4, titleEn: 3, sub: 1, keys: 1.5 } },
  });
  mini.addAll(
    entries.map((e) => ({
      key: `${e.kind}:${e.id}`,
      kind: e.kind,
      titleCs: e.title.cs,
      titleEn: e.title.en,
      // u světa je pod názvem podžánr, u putování otázka eseje: obojí stojí za hledání
      sub: e.kind === 'world' || e.kind === 'trail' ? `${e.sub?.cs ?? ''} ${e.sub?.en ?? ''}` : '',
      keys: e.keys,
    })),
  );
  return { mini, byKey, order };
}

export type SearchGroup = { kind: SearchKind; items: SearchEntry[]; total: number };

export function searchSite(index: SiteIndex, query: string): SearchGroup[] {
  const q = query.trim();
  if (!q) return [];
  const hits = index.mini.search(q, SEARCH_OPTIONS);
  const groups = new Map<SearchKind, SearchEntry[]>();
  for (const hit of hits) {
    const entry = index.byKey.get(hit.id as string);
    if (!entry) continue;
    const list = groups.get(entry.kind) ?? [];
    list.push(entry);
    groups.set(entry.kind, list);
  }
  return SEARCH_GROUPS.filter((g) => groups.has(g.kind)).map((g) => {
    const list = groups.get(g.kind)!;
    // archetypy v pořadí atlasu (jinak by kratší názvy vyhrávaly jen délkou textu)
    if (g.kind === 'chapter') {
      list.sort((a, b) => (index.order.get(`chapter:${a.id}`) ?? 0) - (index.order.get(`chapter:${b.id}`) ?? 0));
    }
    return { kind: g.kind, items: list.slice(0, g.limit), total: list.length };
  });
}

/** Malá písmena bez diakritiky, znak po znaku (kvůli zvýraznění shody v původním textu). */
function foldChars(text: string): string[] {
  return [...text].map((ch) => ch.toLowerCase().normalize('NFD').replace(/\p{M}/gu, ''));
}

export function fold(text: string): string {
  return foldChars(text).join('');
}

/**
 * Úseky textu, které začínají slovem dotazu (pro podtržení shody).
 * Vrací [od, do) v indexech znaků původního textu.
 */
export function matchRanges(text: string, query: string): Array<[number, number]> {
  const words = fold(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 1);
  if (!words.length) return [];
  const chars = [...text];
  const folded = foldChars(text);
  const ranges: Array<[number, number]> = [];
  for (let i = 0; i < chars.length; i += 1) {
    const atWordStart = i === 0 || !/[\p{L}\p{N}]/u.test(chars[i - 1]);
    if (!atWordStart) continue;
    for (const w of words) {
      let j = i;
      let k = 0;
      while (j < chars.length && k < w.length && folded[j] === w.slice(k, k + folded[j].length) && folded[j].length) {
        k += folded[j].length;
        j += 1;
      }
      if (k >= w.length) {
        ranges.push([i, j]);
        break;
      }
    }
  }
  return ranges;
}

/**
 * Dva světy, jejichž celé názvy dotaz obsahuje („dark souls elden ring“):
 * nabídne se rovnou jejich srovnání. Hledá se přímo v názvech, protože běžné
 * hledání chce všechna slova v jednom záznamu a dvojici by nenašlo.
 */
export function comparePair(index: SiteIndex, query: string): [SearchEntry, SearchEntry] | null {
  const q = ` ${fold(query).replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const named: Array<{ entry: SearchEntry; at: number }> = [];
  for (const entry of index.byKey.values()) {
    if (entry.kind !== 'world') continue;
    let at = -1;
    for (const title of [entry.title.cs, entry.title.en]) {
      const t = fold(title).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      const pos = t.length > 1 ? q.indexOf(` ${t} `) : -1;
      if (pos >= 0 && (at < 0 || pos < at)) at = pos;
    }
    if (at >= 0) named.push({ entry, at });
  }
  named.sort((x, y) => x.at - y.at);
  return named.length >= 2 ? [named[0].entry, named[1].entry] : null;
}
