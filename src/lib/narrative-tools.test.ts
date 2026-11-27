import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import {
  NARR_ASSIGNMENTS,
  NARR_FAMILIES,
  NARR_RINGS,
  NARR_TECHNIQUES,
  OWN_FROM,
  chronicleTools,
  familyCounts,
  narrTools,
  narrWorlds,
  worldTechniques,
} from './narrative-tools';

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const published = worlds.filter((w) => !w.draft);
const outside = new Set(NARR_FAMILIES.filter((f) => f.outside).map((f) => f.id));

describe('Poetika světů (model šesti kruhů)', () => {
  it('má šest kruhů v pořadí od slova k hráči a jednu skupinu mimo kruhy', () => {
    expect(NARR_RINGS.map((f) => f.id)).toEqual(['slovo', 'obraz-a-zvuk', 'prostor-a-stopy', 'cin', 'zakulisi', 'hrac']);
    expect(OWN_FROM).toBe(3);
    expect(outside.size).toBe(1);
  });

  it('každý publikovaný svět má zařazený každý nástroj své kroniky', () => {
    for (const w of published) {
      const tools = chronicleTools(CHRONICLES[`../../content/chronicles/${w.chronicleSlug}.md`] ?? '');
      expect(tools.length, w.id).toBeGreaterThan(0);
      expect(NARR_ASSIGNMENTS[w.id]?.length, `${w.id}: počet zařazení ≠ počet nástrojů v kronice`).toBe(tools.length);
    }
  });

  it('zařazení odkazují na existující způsoby, režimy a kruhy', () => {
    const techIds = new Set(NARR_TECHNIQUES.map((t) => t.id));
    const famIds = new Set(NARR_FAMILIES.map((f) => f.id));
    const ringIds = new Set(NARR_RINGS.map((f) => f.id));
    for (const [world, list] of Object.entries(NARR_ASSIGNMENTS)) {
      for (const a of list) {
        expect(techIds.has(a.t), `${world}: ${a.t}`).toBe(true);
        const fam = NARR_TECHNIQUES.find((t) => t.id === a.t)!.family;
        if (outside.has(fam)) expect(a.m, `${world}: vlastnost světa nemá režim`).toBeUndefined();
        else expect(['V', 'I', 'E'], `${world}: ${a.t} bez režimu`).toContain(a.m);
        if (a.also) {
          expect(ringIds.has(a.also), `${world}: také ${a.also}`).toBe(true);
          expect(a.also, `${world}: „také“ je týž kruh`).not.toBe(fam);
        }
      }
    }
    for (const t of NARR_TECHNIQUES) expect(famIds.has(t.family), t.id).toBe(true);
  });

  it('každý způsob má aspoň dva nástroje (pravidlo zařazení 11)', () => {
    for (const t of NARR_TECHNIQUES) {
      if (outside.has(t.family)) continue;
      expect(narrTools.filter((tool) => tool.technique === t.id).length, t.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('karta světa a filtr atlasu nepočítají vlastnosti světa', () => {
    const outsideTech = new Set(NARR_TECHNIQUES.filter((t) => outside.has(t.family)).map((t) => t.id));
    for (const w of published) for (const id of worldTechniques(w.id)) expect(outsideTech.has(id), `${w.id}: ${id}`).toBe(false);
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

  it('každý svět má v kruzích tolik nástrojů, kolik jich má kronika, bez vlastností světa', () => {
    for (const w of narrWorlds) {
      const inRings = NARR_ASSIGNMENTS[w.id].filter((a) => !outside.has(NARR_TECHNIQUES.find((t) => t.id === a.t)!.family)).length;
      expect(familyCounts(w.id).reduce((a, b) => a + b, 0), w.id).toBe(inRings);
    }
  });
});
