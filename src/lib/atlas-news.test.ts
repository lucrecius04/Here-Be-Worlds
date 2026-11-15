import { describe, expect, it } from 'vitest';
import { isSampleWorld, latestAdded, mostRecentAdded } from './atlas-news';
import type { World } from '../schemas/world';

function stub(id: string, addedAt?: string, draft = false): World {
  return {
    id,
    number: 1,
    chapterId: 'fantasy',
    addedAt,
    draft,
    gameTitle: { en: id, cs: id },
    chronicleTitle: { en: id, cs: id },
    subtitlePoetic: { en: '', cs: '' },
    studios: [],
    yearRange: '',
    canonScope: { en: '', cs: '' },
    core: { en: '', cs: '' },
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
      hopeDespair: { value: 3 },
      knownUnknown: { value: 3 },
      intimateEpic: { value: 3 },
      moralClarityAmbiguity: { value: 3 },
      realismMetaphysical: { value: 3 },
    },
    triad: {
      originalSin: { en: '', cs: '' },
      centralDilemma: { en: '', cs: '' },
      ultimateMystery: { en: '', cs: '' },
    },
    chronicleSlug: id,
  };
}

describe('atlas-news', () => {
  it('ignores samples and drafts when ranking new entries', () => {
    const worlds = [
      stub('baldurs-gate', '2026-11-01'),
      stub('dark-souls', '2026-11-08'),
      stub('diablo', '2026-11-15'),
      stub('vzorek-fantasy', '2026-12-01'),
      stub('hidden', '2026-12-02', true),
    ];
    expect(isSampleWorld(worlds[3])).toBe(true);
    expect(latestAdded(worlds, 3).map((world) => world.id)).toEqual([
      'diablo',
      'dark-souls',
      'baldurs-gate',
    ]);
    expect(mostRecentAdded(worlds)?.id).toBe('diablo');
  });
});
