import { describe, expect, it } from 'vitest';
import {
  addDays,
  dailyWorldIndex,
  dayOfYear,
  featuredWorldIndex,
  formatMysteryKicker,
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

  it('formats the mystery kicker date', () => {
    expect(formatMysteryKicker(new Date(2026, 10, 15), 'cs')).toBe('15. listopadu');
    expect(formatMysteryKicker(new Date(2026, 10, 15), 'en')).toBe('15 November');
  });
});
