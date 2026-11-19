import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { TRAILS, dailyTrails } from './trails';

const published = new Set(worlds.filter((w) => !w.draft).map((w) => w.id));

describe('tematické stezky', () => {
  it('každý člen je publikovaný svět a stezka má 4–7 světů', () => {
    for (const trail of TRAILS) {
      for (const id of trail.members) expect(published.has(id), `${trail.id}: ${id}`).toBe(true);
      expect(new Set(trail.members).size).toBe(trail.members.length);
      expect(trail.members.length).toBeGreaterThanOrEqual(4);
      expect(trail.members.length).toBeLessThanOrEqual(7);
    }
  });

  it('id stezek jsou jedinečná', () => {
    expect(new Set(TRAILS.map((t) => t.id)).size).toBe(TRAILS.length);
  });

  it('stezky dne: tři různé a za pět dní se vystřídají všechny', () => {
    const seen = new Set<string>();
    for (let day = 0; day < Math.ceil(TRAILS.length / 3); day++) {
      const today = dailyTrails(day);
      expect(new Set(today.map((t) => t.id)).size).toBe(3);
      today.forEach((t) => seen.add(t.id));
    }
    expect(seen.size).toBe(TRAILS.length);
  });
});
