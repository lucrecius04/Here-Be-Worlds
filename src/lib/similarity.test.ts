import { describe, expect, it } from 'vitest';
import { similarWorlds, similarityScore } from './similarity';
import type { World } from '../schemas/world';

function axisStub(value: number): World['axes'] {
  const comment = { en: 'c', cs: 'c' };
  return {
    hopeDespair: { value, comment },
    knownUnknown: { value, comment },
    intimateEpic: { value, comment },
    moralClarityAmbiguity: { value, comment },
    realismMetaphysical: { value, comment },
  };
}

const minimal = (id: string, themes: string[], axis: number): World =>
  ({
    id,
    number: 1,
    chapterId: 'fantasy',
    gameTitle: { en: id },
    chronicleTitle: { en: id },
    subtitlePoetic: { en: id },
    studios: [],
    yearRange: '',
    canonScope: { en: 'x' },
    core: { en: 'x' },
    metadata: {
      genreProfile: { en: 'x' },
      atmosphere: { en: 'x' },
      spatialScope: { en: 'x' },
      historicalDepth: { en: 'x' },
      societalOrder: { en: 'x' },
      sourceOfPower: { en: 'x' },
      protagonistPerspective: { en: 'x' },
      keyActors: { en: 'x' },
    },
    themes,
    axes: axisStub(axis),
    triad: {
      originalSin: { en: 'x' },
      centralDilemma: { en: 'x' },
      ultimateMystery: { en: 'x' },
    },
    chronicleSlug: id,
  }) as World;

describe('similarity', () => {
  it('ranks closer axes and shared themes higher', () => {
    const source = minimal('a', ['faith', 'war'], 3);
    const close = minimal('b', ['faith', 'war'], 3);
    const far = minimal('c', [], 5);
    expect(similarityScore(source, close)).toBeGreaterThan(similarityScore(source, far));
  });

  it('excludes self from similar worlds', () => {
    const all = [minimal('a', [], 3), minimal('b', [], 4)];
    const sim = similarWorlds(all[0], all, 5);
    expect(sim.every((w) => w.id !== 'a')).toBe(true);
  });
});
