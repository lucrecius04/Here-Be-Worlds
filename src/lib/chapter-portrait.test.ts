import { describe, expect, it } from 'vitest';
import { axisExtremes, meanAxes } from './chapter-portrait';
import type { AxisValues } from './imprint';
import type { World } from '../schemas/world';

function fakeWorld(id: string, axes: AxisValues): World {
  return {
    id,
    number: 1,
    chapterId: 'fantasy',
    gameTitle: { en: id, cs: id },
    chronicleTitle: { en: id, cs: id },
    subtitlePoetic: { en: '', cs: '' },
    studios: [],
    yearRange: '',
    canonScope: { en: '', cs: '' },
    core: { en: 'core', cs: 'jádro' },
    metadata: {
      genreProfile: { en: '', cs: '' },
      atmosphere: { en: '', cs: '' },
      spatialScope: { en: '', cs: '' },
      historicalDepth: { en: '', cs: '' },
      societalOrder: { en: '', cs: '' },
      sourceOfPower: { en: '', cs: '' },
      protagonistPerspective: { en: '', cs: '' },
      keyActors: { en: '', cs: '' },
    },
    themes: [],
    axes: {
      hopeDespair: { value: axes.hopeDespair },
      knownUnknown: { value: axes.knownUnknown },
      intimateEpic: { value: axes.intimateEpic },
      moralClarityAmbiguity: { value: axes.moralClarityAmbiguity },
      realismMetaphysical: { value: axes.realismMetaphysical },
    },
    triad: {
      originalSin: { en: '', cs: '' },
      centralDilemma: { en: '', cs: '' },
      ultimateMystery: { en: '', cs: '' },
    },
    chronicleSlug: id,
  };
}

const even: AxisValues = {
  hopeDespair: 3,
  knownUnknown: 3,
  intimateEpic: 3,
  moralClarityAmbiguity: 3,
  realismMetaphysical: 3,
};

describe('meanAxes', () => {
  it('rounds the mean of each axis to a whole 1–5', () => {
    const a = fakeWorld('a', { ...even, hopeDespair: 1, realismMetaphysical: 5 });
    const b = fakeWorld('b', { ...even, hopeDespair: 2, realismMetaphysical: 4 });
    expect(meanAxes([a, b]).hopeDespair).toBe(2);
    expect(meanAxes([a, b]).realismMetaphysical).toBe(5);
    expect(meanAxes([a, b]).knownUnknown).toBe(3);
  });
});

describe('axisExtremes', () => {
  it('skips a single world and returns unique right-pole worlds', () => {
    expect(axisExtremes([fakeWorld('solo', even)])).toEqual([]);
    const low = fakeWorld('low', { ...even, hopeDespair: 1, realismMetaphysical: 1, intimateEpic: 5 });
    const high = fakeWorld('high', { ...even, hopeDespair: 5, realismMetaphysical: 5, intimateEpic: 1 });
    const extras = axisExtremes([low, high], 3);
    expect(extras).toHaveLength(2);
    expect(new Set(extras.map((item) => item.world.id)).size).toBe(2);
    expect(extras.find((item) => item.axisId === 'hopeDespair')?.world.id).toBe('high');
  });
});
