import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { DILEMMA_TYPES, MYSTERY_HOLDERS, MYSTERY_KINDS, SIN_TYPES, WORLD_TRIAD_TYPES } from './triad-types';

describe('roztřídění triád (data/meta/triad-types.json)', () => {
  const published = worlds.filter((w) => !w.draft).map((w) => w.id);

  it('každý publikovaný svět je zařazený – po přidání světa doplň triad-types.json', () => {
    expect(published.filter((id) => !WORLD_TRIAD_TYPES[id])).toEqual([]);
  });

  it('zařazení odkazují jen na existující typy', () => {
    const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
    const sin = ids(SIN_TYPES);
    const dil = ids(DILEMMA_TYPES);
    const kind = ids(MYSTERY_KINDS);
    const holder = ids(MYSTERY_HOLDERS);
    for (const [id, w] of Object.entries(WORLD_TRIAD_TYPES)) {
      expect(sin.has(w.sin), `${id} sin`).toBe(true);
      if (w.sinAlso) expect(sin.has(w.sinAlso) && w.sinAlso !== w.sin, `${id} sinAlso`).toBe(true);
      expect(dil.has(w.dilemma), `${id} dilemma`).toBe(true);
      expect(kind.has(w.mystery), `${id} mystery`).toBe(true);
      expect(holder.has(w.holder), `${id} holder`).toBe(true);
    }
  });

  it('žádný typ nezůstal prázdný', () => {
    const used = (key: 'sin' | 'dilemma' | 'mystery' | 'holder') => new Set(Object.values(WORLD_TRIAD_TYPES).map((w) => w[key]));
    expect(SIN_TYPES.filter((x) => !used('sin').has(x.id))).toEqual([]);
    expect(DILEMMA_TYPES.filter((x) => !used('dilemma').has(x.id))).toEqual([]);
    expect(MYSTERY_KINDS.filter((x) => !used('mystery').has(x.id))).toEqual([]);
    expect(MYSTERY_HOLDERS.filter((x) => !used('holder').has(x.id))).toEqual([]);
  });
});
