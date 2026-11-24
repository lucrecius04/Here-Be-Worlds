/**
 * Hledání v plných textech (kroniky, eseje) pro lupu v hlavičce. Rejstřík skládá při sestavení
 * `text-search-index.ts`; tady se načítají jen potřebné kousky: přehled oddílů, slova podle
 * prvních dvou písmen dotazu a texty dokumentů, ze kterých se ukáže úryvek.
 * Pravidla: všechna slova dotazu musí být v oddílu, bez diakritiky, slovo od 3 písmen stačí začátkem.
 */
import { withBase } from './base-url';
import { matchRanges } from './site-search';
import { czStem } from './cz-stem';

export type TextPart = 'chronicle' | 'appendices' | 'analysis' | 'essay';

export type TextDoc = {
  key: string;
  kind: 'chronicle' | 'essay' | 'page';
  title: { cs: string; en: string };
  href: string;
  hue?: { light: string; dark: string };
};

/** [dokument, pořadí oddílu v dokumentu, část, kde leží, kotva] */
export type TextSection = [number, number, TextPart, string, string];

export type TextMeta = { docs: TextDoc[]; sections: TextSection[] };

export type TextHit = {
  key: string;
  doc: TextDoc;
  part: TextPart;
  place: string;
  href: string;
  snippet: string;
};

export type TextResult = { total: number; hits: TextHit[] };

const PART_VIEW: Record<TextPart, string> = {
  chronicle: '?view=chronicle',
  appendices: '?view=appendices',
  analysis: '?view=analysis',
  essay: '',
};

export function foldQueryWords(query: string): string[] {
  return query
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2);
}

/** Hledat v textech má smysl až od slova o třech písmenech. */
export function wantsTextSearch(query: string): boolean {
  return foldQueryWords(query).some((w) => w.length >= 3);
}

const cache = {
  meta: null as Promise<TextMeta> | null,
  shards: new Map<string, Promise<Record<string, number[]>>>(),
  docs: new Map<string, Promise<string[]>>(),
};

function getJson<T>(base: string, path: string): Promise<T> {
  return fetch(withBase(base, path)).then((r) => {
    if (!r.ok) throw new Error(`${r.status} ${path}`);
    return r.json() as Promise<T>;
  });
}

function loadMeta(base: string) {
  cache.meta ??= getJson<TextMeta>(base, '/search/texts/meta.json').catch((e) => {
    cache.meta = null;
    throw e;
  });
  return cache.meta;
}

function loadShard(base: string, key: string) {
  let p = cache.shards.get(key);
  if (!p) {
    // Dvojice, která v textech není, nemá soubor: prázdný výsledek, ne chyba.
    p = getJson<Record<string, number[]>>(base, `/search/texts/${key}.json`).catch(() => ({}));
    cache.shards.set(key, p);
  }
  return p;
}

function loadDoc(base: string, key: string) {
  let p = cache.docs.get(key);
  if (!p) {
    p = getJson<string[]>(base, `/search/texts/doc/${key}.json`).catch((e) => {
      cache.docs.delete(key);
      throw e;
    });
    cache.docs.set(key, p);
  }
  return p;
}

/** Úryvek kolem prvního výskytu některého slova dotazu (na začátku slova). */
export function snippetAround(text: string, query: string, before = 70, after = 130): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const ranges = matchRanges(flat, query);
  const chars = [...flat];
  if (!ranges.length) return chars.length > before + after ? `${chars.slice(0, before + after).join('')}…` : flat;
  const [from] = ranges[0];
  let start = Math.max(0, from - before);
  let end = Math.min(chars.length, from + after);
  if (start > 0) {
    const space = chars.indexOf(' ', start);
    if (space >= 0 && space < from) start = space + 1;
  }
  if (end < chars.length) {
    const space = chars.lastIndexOf(' ', end);
    if (space > from) end = space;
  }
  return `${start > 0 ? '… ' : ''}${chars.slice(start, end).join('')}${end < chars.length ? ' …' : ''}`;
}

export async function searchTexts(base: string, query: string, limit = 5): Promise<TextResult> {
  const words = foldQueryWords(query);
  if (!words.some((w) => w.length >= 3)) return { total: 0, hits: [] };
  // kmen každého slova z původního dotazu (s diakritikou kvůli ů → o): jiný pád téhož slova
  const rawWords = query.split(/[^\p{L}\p{N}]+/u).filter((w) => foldQueryWords(w).length);
  const stems = words.map((_, i) => czStem(rawWords[i] ?? words[i]));
  const shardKeys = words.map((w, i) => [...new Set([w.slice(0, 2), stems[i].slice(0, 2)].filter((k) => k.length === 2))]);
  const [meta, ...shardLists] = await Promise.all([
    loadMeta(base),
    ...shardKeys.map((keys) => Promise.all(keys.map((k) => loadShard(base, k)))),
  ]);

  // Pro každé slovo dotazu: oddíl → počet výskytů (slovo celé, od 3 písmen i začátkem, nebo stejný kmen).
  let scores: Map<number, number> | null = null;
  words.forEach((w, i) => {
    const shard = Object.assign({}, ...shardLists[i]) as Record<string, number[]>;
    const stem = stems[i];
    const local = new Map<number, number>();
    for (const [word, postings] of Object.entries(shard)) {
      const prefix = word === w || (w.length >= 3 && word.startsWith(w));
      if (!prefix && !(stem && czStem(word) === stem)) continue;
      const exact = word === w ? 2 : 1;
      for (let k = 0; k < postings.length; k += 2) {
        local.set(postings[k], (local.get(postings[k]) ?? 0) + postings[k + 1] * exact);
      }
    }
    if (!scores) {
      scores = local;
    } else {
      const next = new Map<number, number>();
      for (const [id, s] of scores) if (local.has(id)) next.set(id, s + local.get(id)!);
      scores = next;
    }
  });
  const ranked = [...(scores ?? new Map<number, number>()).entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const top = ranked.slice(0, limit).map(([id]) => id);

  const docKeys = [...new Set(top.map((id) => meta.docs[meta.sections[id][0]].key))];
  const texts = new Map(await Promise.all(docKeys.map(async (k) => [k, await loadDoc(base, k)] as const)));

  const hits = top.map((id) => {
    const [docIdx, local, part, place, anchor] = meta.sections[id];
    const doc = meta.docs[docIdx];
    const text = texts.get(doc.key)?.[local] ?? '';
    return {
      key: `t${id}`,
      doc,
      part,
      place,
      href: `${doc.href}${PART_VIEW[part]}${anchor ? `#${anchor}` : ''}`,
      snippet: snippetAround(text, query),
    };
  });
  return { total: ranked.length, hits };
}
