import { describe, expect, it } from 'vitest';
import {
  addDays,
  dailyWorldIndex,
  dayOfYear,
  formatMysteryKicker,
  mysteryChoices,
  mysteryMode,
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
