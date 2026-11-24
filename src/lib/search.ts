import MiniSearch from 'minisearch';
import type { World } from '../schemas/world';
import { buildSearchText } from './worlds';
import { STEM_MARK, czStem } from './cz-stem';

export type SearchDocument = {
  id: string;
  title: string;
  chapterId: string;
  themes: string;
  body: string;
};

/** Malá písmena a bez diakritiky: „zaklinac“ najde Zaklínače. */
export function normalizeTerm(term: string): string | null {
  const t = term.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  return t.length ? t : null;
}

/**
 * Volby dotazu: všechna slova musí sedět (AND), začátek slova stačí,
 * překlep se toleruje až u slov od šesti písmen. Kratší nesmysl tak nic nenajde
 * („deatc“ dřív díky jednomu překlepu sedělo na anglické „death“ v tématu).
 */
export const SEARCH_OPTIONS = {
  combineWith: 'AND' as const,
  prefix: (term: string) => term.length >= 2,
  fuzzy: (term: string) => (term.length >= 6 ? 0.2 : false),
};

/** Do rejstříku jde celé slovo i jeho kmen se značkou (ohýbání češtiny: boha ↔ bůh). */
export function indexTerms(term: string): string[] | null {
  const word = normalizeTerm(term);
  if (!word) return null;
  const stem = czStem(term);
  return stem ? [word, `${STEM_MARK}${stem}`] : [word];
}

const stemTerm = (term: string) => {
  const stem = czStem(term);
  return stem ? `${STEM_MARK}${stem}` : null;
};

/**
 * Dotaz: každé slovo musí sedět (AND), a to buď začátkem slova / s překlepem jako dřív,
 * nebo celým kmenem (jiný pád téhož slova). Kmen se porovnává celý, bez začátku a překlepu.
 */
export function buildQuery(query: string) {
  const words = query.split(/[\s\p{P}]+/u).filter(Boolean);
  return {
    combineWith: 'AND' as const,
    queries: words.map((w) => ({
      combineWith: 'OR' as const,
      queries: [
        { queries: [w], processTerm: normalizeTerm, prefix: SEARCH_OPTIONS.prefix, fuzzy: SEARCH_OPTIONS.fuzzy },
        { queries: [w], processTerm: stemTerm, prefix: false, fuzzy: false },
      ],
    })),
  };
}

export function searchWorldIds(index: MiniSearch<SearchDocument>, query: string): Set<string> {
  if (!query.trim()) return new Set();
  return new Set(index.search(buildQuery(query)).map((hit) => hit.id as string));
}

export function createWorldIndex(worlds: World[]) {
  const docs: SearchDocument[] = worlds.map((w) => ({
    id: w.id,
    title: w.gameTitle.en,
    chapterId: w.chapterId,
    themes: w.themes.join(' '),
    body: buildSearchText(w),
  }));

  const mini = new MiniSearch<SearchDocument>({
    fields: ['title', 'body', 'themes'],
    storeFields: ['id', 'chapterId', 'themes'],
    processTerm: indexTerms,
  });
  mini.addAll(docs);
  return mini;
}
