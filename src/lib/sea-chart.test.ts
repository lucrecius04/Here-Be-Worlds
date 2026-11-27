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
    expect(islandShape('dark-souls', 100, 100, 22, false, { depth: 5, myth: true, fog: 'dense' }).depths).toHaveLength(5);
  });
});

/* ---------- etapa 2: hloubky, přístavy a plavby ---------- */
import { TRAILS } from './trails';
import { windingPath } from './sky';
import { depthLines, harbourPlan, onLand, voyageLegs } from './sea-chart';
import type { ChartIsland, ChartTrail } from './sea-chart';

describe('mapa známých světů: hloubky, přístavy a plavby', () => {
  const positions = chart.worlds as Record<string, [number, number]>;
  const isles: ChartIsland[] = published.map((w) => ({
    id: w.id,
    x: positions[w.id][0],
    y: positions[w.id][1],
    r: islandRadius(w.metadata.spatialScope.en),
    arch: isArchipelago(w.metadata.spatialScope.en),
  }));
  const trails: ChartTrail[] = TRAILS.map((trail) => {
    const members = trail.members.filter((id) => positions[id]);
    return { id: trail.id, stops: windingPath(members.map((id) => positions[id])).map((k) => members[k]) };
  });
  const plan = harbourPlan(isles, trails);

  it('linek hloubky je tolik, kolik má paměť světa číslic v letech', () => {
    expect(depthLines(null)).toBe(0);
    expect(depthLines(0.03)).toBe(1);
    expect(depthLines(78)).toBe(2);
    expect(depthLines(1000)).toBe(4);
    expect(depthLines(10_000)).toBe(5);
    expect(depthLines(1_000_000_000)).toBe(10);
  });

  it('každý ostrov má jeden přístav za každé putování, které jím prochází', () => {
    for (const isl of isles) {
      const through = trails.filter((trail) => trail.stops.includes(isl.id)).map((trail) => trail.id).sort();
      expect((plan[isl.id] ?? []).map((h) => h.trail).sort(), isl.id).toEqual(through);
    }
  });

  it('přístavy téhož ostrova se nepřekrývají a nestojí na pevnině', () => {
    for (const [id, list] of Object.entries(plan)) {
      for (let a = 0; a < list.length; a += 1) {
        // souostroví se pro plavby bere jako kruh kolem celé skupiny, přístav leží uvnitř něj u ostrůvku
        if (!isles.find((isl) => isl.id === id)!.arch) expect(onLand([list[a].x, list[a].y], isles), `${id} · ${list[a].trail}`).toBeNull();
        for (let b = a + 1; b < list.length; b += 1)
          expect(Math.hypot(list[a].x - list[b].x, list[a].y - list[b].y), `${id}: ${list[a].trail} × ${list[b].trail}`).toBeGreaterThan(6.5);
      }
    }
  });

  it('plavba má úsek mezi každými dvěma zastávkami a nikde nevede přes pevninu', () => {
    for (const trail of trails) {
      const legs = voyageLegs(trail, isles, plan);
      expect(legs, trail.id).toHaveLength(trail.stops.length - 1);
      for (const leg of legs) {
        for (let k = 0; k < leg.pts.length - 1; k += 1) {
          const [a, b] = [leg.pts[k], leg.pts[k + 1]];
          const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3);
          for (let s = 0; s <= steps; s += 1) {
            const p: [number, number] = [a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps];
            expect(onLand(p, isles), `${trail.id}: ${leg.from} → ${leg.to}`).toBeNull();
          }
        }
      }
    }
  });
});
