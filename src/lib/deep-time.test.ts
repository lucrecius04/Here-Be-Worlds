import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { DEEP_TIME, formatAgo, formatDuration, summarize } from './deep-time';

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
    expect(summarize(DEEP_TIME['hades']).noDates).toBe(true);
  });
});
