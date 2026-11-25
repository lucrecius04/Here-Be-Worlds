import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import {
  NARR_ASSIGNMENTS,
  NARR_FAMILIES,
  NARR_TECHNIQUES,
  chronicleTools,
  familyCounts,
  narrTools,
  narrWorlds,
} from './narrative-tools';
import narration from '../../data/meta/narration-taxonomy.json';

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const published = worlds.filter((w) => !w.draft);

describe('Jak světy vyprávějí', () => {
  it('každý publikovaný svět má zařazený každý nástroj své kroniky', () => {
    for (const w of published) {
      const tools = chronicleTools(CHRONICLES[`../../content/chronicles/${w.chronicleSlug}.md`] ?? '');
      expect(tools.length, w.id).toBeGreaterThan(0);
      expect(NARR_ASSIGNMENTS[w.id]?.length, `${w.id}: počet zařazení ≠ počet nástrojů v kronice`).toBe(tools.length);
    }
  });

  it('zařazení odkazují jen na existující způsoby a způsoby na existující rejstříky', () => {
    const techIds = new Set(NARR_TECHNIQUES.map((t) => t.id));
    const famIds = new Set(NARR_FAMILIES.map((f) => f.id));
    for (const [world, list] of Object.entries(NARR_ASSIGNMENTS)) for (const id of list) expect(techIds.has(id), `${world}: ${id}`).toBe(true);
    for (const t of NARR_TECHNIQUES) expect(famIds.has(t.family), t.id).toBe(true);
  });

  it('štítky „Jak svět vypráví“ jsou způsoby na stránce (karta na ně odkazuje)', () => {
    const techIds = new Set(NARR_TECHNIQUES.map((t) => t.id));
    for (const n of narration.narration) expect(techIds.has(n.slug), n.slug).toBe(true);
  });

  it('každý způsob má aspoň jeden nástroj', () => {
    for (const t of NARR_TECHNIQUES) expect(narrTools.some((tool) => tool.technique === t.id), t.id).toBe(true);
  });

  it('má kotvu oddílu nástrojů v Anatomii vyprávění', () => {
    for (const w of narrWorlds) expect(w.anchor, w.id).toBe('5-hlavni-nastroje-vypraveni');
  });

  it('oddělí anglickou závorku od názvu', () => {
    const md = '## 5. Hlavní nástroje vyprávění\n\n**Vědomostní zámky (Knowledge-gating):** Neexistují klíče.\n\n**Hudební motiv:** Melodie.\n\n## 6. Co vytýkají\n';
    expect(chronicleTools(md)).toEqual([
      { title: 'Vědomostní zámky', aside: 'Knowledge-gating', text: 'Neexistují klíče.' },
      { title: 'Hudební motiv', aside: undefined, text: 'Melodie.' },
    ]);
  });

  it('každý svět má v rejstřících tolik nástrojů, kolik jich má kronika', () => {
    for (const w of narrWorlds) {
      expect(familyCounts(w.id).reduce((a, b) => a + b, 0), w.id).toBe(NARR_ASSIGNMENTS[w.id].length);
    }
  });
});
