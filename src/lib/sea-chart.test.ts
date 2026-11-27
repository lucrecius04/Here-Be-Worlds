import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { CHART_W, CHART_H, islandRadius, isArchipelago, islandShape, scopeKey } from './sea-chart';
import chart from '../../data/meta/sea-chart.json';

// Mapa známých světů: polohy ostrovů jsou zmražené v data/meta/sea-chart.json (npm run sea-chart).
const positions = chart.worlds as Record<string, [number, number]>;
const published = worlds.filter((w) => !w.draft);

describe('mapa známých světů (sea-chart)', () => {
  it('každý publikovaný svět má na mapě místo – po přidání světa spusť `npm run sea-chart`', () => {
    const missing = published.filter((w) => !positions[w.id]).map((w) => w.id);
    expect(missing).toEqual([]);
  });

  it('ostrovy leží uvnitř rámu mapy', () => {
    for (const w of published) {
      const [x, y] = positions[w.id];
      const r = islandRadius(w.metadata.spatialScope.en) * (isArchipelago(w.metadata.spatialScope.en) ? 1.4 : 1.15);
      expect(x - r, w.id).toBeGreaterThan(40);
      expect(x + r, w.id).toBeLessThan(CHART_W - 40);
      expect(y - r, w.id).toBeGreaterThan(40);
      expect(y + r, w.id).toBeLessThan(CHART_H - 40);
    }
  });

  it('ostrovy se nepřekrývají', () => {
    const clash: string[] = [];
    for (let i = 0; i < published.length; i += 1) {
      for (let j = i + 1; j < published.length; j += 1) {
        const a = published[i];
        const b = published[j];
        const [ax, ay] = positions[a.id];
        const [bx, by] = positions[b.id];
        const ra = islandRadius(a.metadata.spatialScope.en) * (isArchipelago(a.metadata.spatialScope.en) ? 1.35 : 1.05);
        const rb = islandRadius(b.metadata.spatialScope.en) * (isArchipelago(b.metadata.spatialScope.en) ? 1.35 : 1.05);
        if (Math.hypot(ax - bx, ay - by) < ra + rb) clash.push(`${a.id} × ${b.id}`);
      }
    }
    expect(clash).toEqual([]);
  });

  it('každý dosah světa má velikost ostrova', () => {
    const known = new Set(['Location', 'City', 'Region', 'Continent', 'World', 'Star system', 'Galaxy', 'Multiverse and planes']);
    for (const w of published) expect(known.has(scopeKey(w.metadata.spatialScope.en)), w.metadata.spatialScope.en).toBe(true);
  });

  it('tvar pobřeží je pro stejný svět vždy stejný', () => {
    const a = islandShape('dark-souls', 100, 100, 22, false);
    const b = islandShape('dark-souls', 100, 100, 22, false);
    expect(a.coast).toBe(b.coast);
    expect(a.waterLines).toHaveLength(3);
  });
});
