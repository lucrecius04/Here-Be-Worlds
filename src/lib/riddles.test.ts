import { describe, expect, it } from 'vitest';
import { riddlePool, riddleCounts, redact, leaksTitle, chronicleMottos } from './riddles';
import { RIDDLE_KINDS, riddleSlot } from './riddle-day';
import { worlds } from './worlds';

const pool = riddlePool();
const all = Object.values(pool).flat();
const byId = new Map(worlds.map((w) => [w.id, w]));

const clueTexts = (r: (typeof all)[number]) =>
  [r.quote, r.heading, ...(r.lines ?? []).map((l) => l.text), ...(r.tags ?? [])]
    .filter(Boolean)
    .flatMap((v) => [v!.cs, v!.en])
    .filter((s): s is string => Boolean(s));

describe('zásobník hádanek', () => {
  it('má od každého druhu dost hádanek', () => {
    for (const kind of RIDDLE_KINDS) expect(pool[kind].length, kind).toBeGreaterThanOrEqual(20);
    expect(all.length).toBeGreaterThan(600);
  });

  it('každá hádanka má tři různé možnosti a mezi nimi správnou', () => {
    const keys = new Set<string>();
    for (const r of all) {
      expect(new Set(r.choices.map((c) => c.id)).size, r.key).toBe(3);
      expect(r.choices.some((c) => c.id === r.answer), r.key).toBe(true);
      expect(keys.has(r.key)).toBe(false);
      keys.add(r.key);
    }
  });

  it('indicie neprozradí název hry, o kterou jde', () => {
    for (const r of all) {
      const subject = byId.get(r.about ?? r.answer);
      if (!subject) continue;
      for (const text of clueTexts(r)) expect(leaksTitle(text, subject), `${r.key}: ${text}`).toBe(false);
    }
  });

  it('světy v zadání nikdy nejsou odpovědí', () => {
    for (const r of all) expect(r.worlds?.some((w) => w.id === r.answer) ?? false, r.key).toBe(false);
  });

  it('u souřadnic se správný svět kloní k pólu aspoň o dva dílky víc', () => {
    for (const r of pool.axis) {
      const right = r.choices.find((c) => c.id === r.answer)!.value!;
      const others = r.choices.filter((c) => c.id !== r.answer).map((c) => c.value!);
      const leanRight = others.every((v) => right - v >= 2);
      const leanLeft = others.every((v) => v - right >= 2);
      expect(leanRight || leanLeft, r.key).toBe(true);
    }
  });

  it('skrývá název i s diakritikou a českou koncovkou', () => {
    const hades = byId.get('hades')!;
    expect(redact('Hádes a dům podsvětí', hades)).toBe('[…] a dům podsvětí');
    const witcher = byId.get('the-witcher')!;
    expect(redact('aby stvořili Zaklínače.', witcher)).toBe('aby stvořili […].');
    const halo = byId.get('halo')!;
    expect(redact('zahalovat prstenec Halo', halo)).toBe('zahalovat prstenec […]');
  });

  it('bere jen mota kapitol bez citátů s autorem', () => {
    const md = '## Úvodem\n\n*„Krátké motto, které je dost dlouhé na to, aby prošlo filtrem.“*\n\n*„„Cizí citát.“ (Nietzsche)“*\n';
    expect(chronicleMottos(md)).toEqual([{ text: 'Krátké motto, které je dost dlouhé na to, aby prošlo filtrem.', heading: 'Úvodem' }]);
  });
});

describe('hádanka pro den', () => {
  const counts = riddleCounts();

  it('stejný druh se vrátí nejdřív po půl bloku', () => {
    const size = RIDDLE_KINDS.filter((k) => (counts[k] ?? 0) > 0).length;
    const last = new Map<string, number>();
    for (let day = 20000; day < 23000; day += 1) {
      const { kind } = riddleSlot(day, counts)!;
      const prev = last.get(kind);
      if (prev !== undefined) {
        expect(day - prev, `${kind} ${day}`).toBeGreaterThanOrEqual(Math.floor(size / 2));
        expect(day - prev, `${kind} ${day}`).toBeLessThanOrEqual(size * 2);
      }
      last.set(kind, day);
    }
  });

  it('v jednom druhu se hádanka nezopakuje, dokud nepřijdou na řadu všechny', () => {
    const size = RIDDLE_KINDS.filter((k) => (counts[k] ?? 0) > 0).length;
    const groups = new Map<string, number[]>();
    for (let day = 20000; day < 20000 + size * 120; day += 1) {
      const slot = riddleSlot(day, counts)!;
      const n = counts[slot.kind]!;
      expect(slot.index).toBeLessThan(n);
      const cycle = Math.floor(Math.floor(day / size) / n);
      const key = `${slot.kind}:${cycle}`;
      groups.set(key, [...(groups.get(key) ?? []), slot.index]);
    }
    for (const [key, indexes] of groups) expect(new Set(indexes).size, key).toBe(indexes.length);
  });

  it('je pro daný den stabilní', () => {
    expect(riddleSlot(20500, counts)).toEqual(riddleSlot(20500, counts));
  });
});
