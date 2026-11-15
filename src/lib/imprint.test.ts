import { describe, expect, it } from 'vitest';
import { DEFAULT_IMPRINT, imprintNeighbors, matchPercent, type AxisValues } from './imprint';
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

describe('imprint neighbors', () => {
  const near = fakeWorld('near', DEFAULT_IMPRINT);
  const mid = fakeWorld('mid', { ...DEFAULT_IMPRINT, hopeDespair: 5 });
  const far = fakeWorld('far', {
    hopeDespair: 5,
    knownUnknown: 5,
    intimateEpic: 5,
    moralClarityAmbiguity: 5,
    realismMetaphysical: 5,
  });

  it('scores an exact match as 100%', () => {
    expect(matchPercent(DEFAULT_IMPRINT, near)).toBe(100);
  });

  it('returns two nearest worlds and a distinct antipode', () => {
    const { nearest, antipode } = imprintNeighbors(DEFAULT_IMPRINT, [far, mid, near]);
    expect(nearest.map((hit) => hit.world.id)).toEqual(['near', 'mid']);
    expect(antipode?.world.id).toBe('far');
  });
});
