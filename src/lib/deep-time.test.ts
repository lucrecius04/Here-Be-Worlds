import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { DEEP_TIME, formatAgo, formatDuration, gameParts, laterParts, partDetail, summarize } from './deep-time';

describe('hlubina času', () => {
  it('každý publikovaný svět má hlubinu s přítomností', () => {
    for (const w of worlds.filter((x) => !x.draft)) {
      const deep = DEEP_TIME[w.id];
      expect(deep, w.id).toBeTruthy();
      expect(deep.events.some((e) => e.ago === 0), `${w.id}: chybí přítomnost (ago 0)`).toBe(true);
    }
  });

  it('údaje jsou platné a události jdou od nejstarší', () => {
    for (const [id, deep] of Object.entries(DEEP_TIME)) {
      let last = Infinity;
      for (const e of deep.events) {
        expect(['origin', 'turn', 'catastrophe', 'game']).toContain(e.kind);
        expect(e.text.length, id).toBeGreaterThan(5);
        if (Array.isArray(e.ago)) expect(e.ago[0], `${id}: ${e.when}`).toBeLessThan(e.ago[1]);
        const v = typeof e.ago === 'number' ? e.ago : Array.isArray(e.ago) ? Math.sqrt(e.ago[0] * e.ago[1]) : null;
        if (v !== null) {
          expect(v, `${id}: ${e.when} je mimo pořadí`).toBeLessThanOrEqual(last * 1.0001);
          last = v;
        }
      }
    }
  });

  it('shrnutí a slovní hloubky', () => {
    expect(summarize(DEEP_TIME['pathologic']).deepest).toBeCloseTo(0.0301);
    expect(formatDuration(0.0301, 'cs')).toBe('11 dní');
    expect(formatDuration(4208, 'cs').replace(/\s/g, ' ')).toBe('4 208 let');
    expect(formatDuration(1e9, 'cs')).toBe('1 miliarda let');
    expect(formatAgo({ ago: [1000, 10000], when: '', kind: 'turn', text: '' }, 'cs')).toBe('řádově tisíce let');
    const ds = formatAgo({ ago: [66000000, 445000000], when: '', kind: 'turn', text: '' }, 'cs').replace(/\s/g, ' ');
    expect(ds).toBe('450–66 milionů let');
    expect(summarize(DEEP_TIME['hades']).noDates).toBe(true);
  });

  it('období her a díly: přítomnost je hraný díl, období končí u nejstaršího zářezu', () => {
    for (const [id, deep] of Object.entries(DEEP_TIME)) {
      const parts = gameParts(deep);
      // Přítomnost je čas hlavní hry série (Warhammer 40k je jediný svět bez hry v kronice).
      if (id !== 'warhammer-40k') expect(parts.at(-1)?.ago, `${id}: přítomnost má být hraný díl`).toBe(0);
      expect(summarize(deep).played, id).toBe(Math.max(0, ...parts.map((p) => p.ago)));
      const later = laterParts(deep);
      for (let i = 1; i < later.length; i++) expect(later[i].after, id).toBeGreaterThanOrEqual(later[i - 1].after);
    }
    expect(gameParts(DEEP_TIME['mass-effect']).map((p) => p.e.when)).toEqual(['2183', '2185', '2186']);
    expect(laterParts(DEEP_TIME['control']).map((l) => [l.after, l.isGame])).toEqual([
      [4, true],
      [7, true],
    ]);
    expect(laterParts(DEEP_TIME['fallout'])[0].isGame).toBe(false);
    // každá hra má název (popisek dílu v grafech), události mimo hry ho nemají
    for (const [id, deep] of Object.entries(DEEP_TIME))
      for (const e of deep.events) expect(Boolean(e.game), `${id}: ${e.when}`).toBe(e.kind === 'game');
    const fo3 = DEEP_TIME['fallout'].events.find((e) => e.when === '2277')!;
    expect(partDetail(fo3)).toBe('Projekt Čistota');
    const ody = DEEP_TIME['assassins-creed'].events.find((e) => e.game === "Assassin's Creed Odyssey")!;
    expect(partDetail(ody).startsWith('první atentát')).toBe(true);
  });
});
