import { describe, expect, it } from 'vitest';
import { buildTextIndex } from './text-search-index';
import { snippetAround, wantsTextSearch } from './text-search';
import { worlds } from './worlds';

const { meta, shards, texts } = buildTextIndex();

describe('hledání v textech', () => {
  it('má kroniku každého publikovaného světa a schválené eseje', () => {
    const chronicles = meta.docs.filter((d) => d.kind === 'chronicle').length;
    expect(chronicles).toBe(worlds.filter((w) => !w.draft).length);
    expect(meta.docs.some((d) => d.kind === 'essay')).toBe(true);
    expect(meta.docs.some((d) => d.key === 'p-anatomie-herniho-lore')).toBe(true);
  });

  it('každý oddíl má text a kotvu a slova odkazují na existující oddíly', () => {
    for (const [docIdx, local, , , anchor] of meta.sections) {
      expect(texts.get(meta.docs[docIdx].key)?.[local]?.length).toBeGreaterThan(0);
      expect(anchor).toMatch(/^[a-z0-9-]+$/);
    }
    const gwyn = shards.get('gw')?.gwyn ?? [];
    expect(gwyn.length).toBeGreaterThan(0);
    expect(gwyn.every((v, i) => i % 2 === 1 || v < meta.sections.length)).toBe(true);
  });

  it('úryvek začíná u hledaného slova a tabulky nemají prázdné tečky', () => {
    expect(snippetAround('Na počátku byl Věk prastarých a pak přišel Gwyn s duší Světla.', 'gwyn')).toContain('Gwyn');
    for (const list of texts.values()) for (const t of list) expect(t).not.toMatch(/·\s*·/);
  });

  it('v textech se hledá až od slova o třech písmenech', () => {
    expect(wantsTextSearch('ab')).toBe(false);
    expect(wantsTextSearch('gwy')).toBe(true);
  });
});
