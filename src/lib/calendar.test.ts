import { describe, expect, it } from 'vitest';
import {
  addDays,
  dailyWorldIndex,
  dayOfYear,
  featuredWorldIndex,
  formatMysteryKicker,
  mysteryChoices,
  mysteryMode,
  mysteryWorldIndex,
} from './calendar';

describe('calendar helpers', () => {
  const date = new Date(2026, 0, 15);

  it('returns a stable day-of-year', () => {
    expect(dayOfYear(date)).toBe(15);
  });

  it('rotates featured and mystery worlds by offset', () => {
    expect(dailyWorldIndex(3, 0, date)).toBe(15 % 3);
    expect(dailyWorldIndex(3, 1, date)).not.toBe(dailyWorldIndex(3, 0, date));
  });

  it('shows every world once per cycle as the world of the day', () => {
    const start = new Date(2026, 0, 1);
    const seen = new Set<number>();
    // začátek cyklu: dayNumber dělitelné 43
    let d = start;
    while (Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000) % 43 !== 0) d = addDays(d, 1);
    for (let i = 0; i < 43; i += 1) seen.add(featuredWorldIndex(43, addDays(d, i)));
    expect(seen.size).toBe(43);
  });

  it('never asks about the world of the day within the next and previous weeks', () => {
    let d = new Date(2026, 0, 1);
    for (let day = 0; day < 365; day += 1, d = addDays(d, 1)) {
      const answer = mysteryWorldIndex(43, d);
      for (let k = -7; k <= 7; k += 1) {
        const near = addDays(d, k);
        const sameCycle =
          Math.floor(Math.floor(Date.UTC(near.getFullYear(), near.getMonth(), near.getDate()) / 86_400_000) / 43) ===
          Math.floor(Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000) / 43);
        if (sameCycle) expect(featuredWorldIndex(43, near)).not.toBe(answer);
      }
    }
  });

  it('puts one world of the same archetype among the wrong answers', () => {
    const catalog = [
      { id: 'a', chapterId: 'x' },
      { id: 'b', chapterId: 'x' },
      { id: 'c', chapterId: 'y' },
      { id: 'd', chapterId: 'y' },
      { id: 'e', chapterId: 'z' },
    ];
    const choices = mysteryChoices(catalog, catalog[0], date);
    expect(choices.map((c) => c.id)).toContain('b');
    expect(choices.filter((c) => c.chapterId === 'x')).toHaveLength(2);
  });

  it('keeps three seeded mystery choices stable for the day', () => {
    const catalog = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const first = mysteryChoices(catalog, catalog[0], date);
    const second = mysteryChoices(catalog, catalog[0], date);
    expect(first).toHaveLength(3);
    expect(first.map((item) => item.id).sort()).toEqual(second.map((item) => item.id).sort());
    expect(first.some((item) => item.id === 'a')).toBe(true);
  });

  it('cycles mystery mode by day of year', () => {
    expect(mysteryMode(new Date(2026, 0, 15))).toBe(3);
    expect(mysteryMode(new Date(2026, 0, 16))).toBe(0);
    expect(mysteryMode(addDays(date, -1))).toBe(2);
  });

  it('formats the mystery kicker date', () => {
    expect(formatMysteryKicker(new Date(2026, 10, 15), 'cs')).toBe('15. listopadu');
    expect(formatMysteryKicker(new Date(2026, 10, 15), 'en')).toBe('15 November');
  });
});
