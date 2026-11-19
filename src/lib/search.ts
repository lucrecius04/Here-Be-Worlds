import MiniSearch from 'minisearch';
import type { World } from '../schemas/world';
import { buildSearchText } from './worlds';

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

export function searchWorldIds(index: MiniSearch<SearchDocument>, query: string): Set<string> {
  return new Set(index.search(query, SEARCH_OPTIONS).map((hit) => hit.id as string));
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
    processTerm: normalizeTerm,
  });
  mini.addAll(docs);
  return mini;
}
