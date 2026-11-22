import { describe, expect, it } from 'vitest';
import { buildSearchEntries } from './site-search-index';
import { comparePair, createSiteIndex, matchRanges, searchSite } from './site-search';
import { worlds } from './worlds';
import { TRAILS } from './trails';

const entries = buildSearchEntries();
const index = createSiteIndex(entries);
const top = (q: string, kind: string) => searchSite(index, q).find((g) => g.kind === kind)?.items[0]?.id;

describe('hledání v hlavičce', () => {
  it('rejstřík obsahuje všechny publikované světy a všechna putování', () => {
    expect(entries.filter((e) => e.kind === 'world')).toHaveLength(worlds.filter((w) => !w.draft).length);
    expect(entries.filter((e) => e.kind === 'trail')).toHaveLength(TRAILS.length);
    expect(new Set(entries.map((e) => `${e.kind}:${e.id}`)).size).toBe(entries.length);
  });

  it('najde svět podle českého i původního názvu a bez diakritiky', () => {
    expect(top('zaklinac', 'world')).toBe('the-witcher');
    expect(top('Zaklínač', 'world')).toBe('the-witcher');
    expect(top('lordran', 'world')).toBe('dark-souls');
  });

  it('najde téma, pojem i stránku', () => {
    expect(top('bohove', 'theme')).toBe('gods');
    expect(top('prvotni hrich', 'term')).toBe('original-sin');
    expect(top('mapa', 'page')).toBe('map');
  });

  it('archetypy: všech sedm v pořadí atlasu, zkratky a upřesnění', () => {
    const ids = (q: string) => searchSite(index, q).find((g) => g.kind === 'chapter')?.items.map((e) => e.id) ?? [];
    expect(ids('arche')).toEqual([
      'fantasy',
      'science-fiction',
      'post-apocalypse',
      'horror',
      'dystopia',
      'historical',
      'metaphysical',
    ]);
    expect(ids('scifi')[0]).toBe('science-fiction');
    expect(ids('postapo')[0]).toBe('post-apocalypse');
    expect(ids('archetyp dystopie')).toEqual(['dystopia']);
  });

  it('nabídne srovnání, když dotaz jmenuje dva světy', () => {
    const pair = comparePair(index, 'dark souls elden ring');
    expect(pair?.map((e) => e.id)).toEqual(['dark-souls', 'elden-ring']);
    expect(comparePair(index, 'dark souls')).toBeNull();
  });

  it('podtrhne začátky slov bez ohledu na diakritiku', () => {
    expect(matchRanges('Bohové jako břemeno', 'boh')).toEqual([[0, 3]]);
    expect(matchRanges('Smrt a nesmrtelnost', 'smrt')).toEqual([[0, 4]]);
  });
});
