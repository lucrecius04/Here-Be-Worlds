import { describe, expect, it } from 'vitest';
import {
  affinityBreakdown,
  affinityPercent,
  farthestAxis,
  kinshipPairs,
  kinshipPercent,
  kinshipRanking,
  kinshipLevel,
  levelFromPercent,
  pillarStrength,
  parseCompareIds,
  slotHue,
  themeCoverage,
} from './compare';
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

const field = (en: string, sub?: string) =>
  (sub ? { en, sub: { en: sub } } : { en }) as World['metadata']['genreProfile'];

const minimal = (
  id: string,
  themes: string[],
  axis: number,
  hope = axis,
  extras: Partial<World> = {},
): World =>
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
      genreProfile: field('High fantasy'),
      atmosphere: field('Fascination'),
      spatialScope: field('Region'),
      historicalDepth: field('Mythic'),
      societalOrder: field('Nations'),
      sourceOfPower: field('Magic'),
      protagonistPerspective: field('Champion'),
      keyActors: field('x'),
    },
    themes,
    axes: {
      ...axisStub(axis),
      hopeDespair: { value: hope, comment: { en: 'c', cs: 'c' } },
    },
    triad: {
      originalSin: { en: 'x' },
      centralDilemma: { en: 'x' },
      ultimateMystery: { en: 'x' },
    },
    chronicleSlug: id,
    ...extras,
  }) as World;

describe('affinityBreakdown', () => {
  it('awards archetype plus overlap when the other main matches a sub cue', () => {
    const a = minimal('a', [], 3, 3, {
      metadata: {
        ...minimal('a', [], 3).metadata,
        genreProfile: field('High fantasy', 'overlap: dark fantasy'),
      },
    });
    const b = minimal('b', [], 3, 3, {
      chapterId: 'fantasy',
      metadata: {
        ...minimal('b', [], 3).metadata,
        genreProfile: field('Dark fantasy'),
      },
    });
    const score = affinityBreakdown(a, b);
    expect(score.archetype).toBe(16);
    const noOverlap = affinityBreakdown(
      a,
      minimal('c', [], 3, 3, {
        metadata: {
          ...minimal('c', [], 3).metadata,
          genreProfile: field('Science fantasy'),
        },
      }),
    );
    expect(noOverlap.archetype).toBe(12);
  });

  it('adds atmosphere cross-match between main and secondary mood', () => {
    const a = minimal('a', [], 3, 3, {
      metadata: {
        ...minimal('a', [], 3).metadata,
        atmosphere: field('Fascination', 'secondary: Tension'),
      },
    });
    const b = minimal('b', [], 3, 3, {
      metadata: {
        ...minimal('b', [], 3).metadata,
        atmosphere: field('Tension'),
      },
    });
    const withCross = affinityBreakdown(a, b);
    const none = affinityBreakdown(
      a,
      minimal('c', [], 3, 3, {
        metadata: {
          ...minimal('c', [], 3).metadata,
          atmosphere: field('Melancholy'),
        },
      }),
    );
    expect(withCross.character - none.character).toBe(3);
  });

  it('uses the discrete axis table Δ0=7, Δ1=5, Δ2=2, Δ3=0', () => {
    const base = minimal('a', ['faith'], 3);
    const d0 = affinityBreakdown(base, minimal('b', ['faith'], 3));
    const d1 = affinityBreakdown(base, minimal('c', ['faith'], 4));
    const d2 = affinityBreakdown(base, minimal('d', ['faith'], 5));
    const d3 = affinityBreakdown(minimal('hi', ['faith'], 5), minimal('lo', ['faith'], 1));
    expect(d0.axes).toBe(35);
    expect(d1.axes).toBe(25);
    expect(d2.axes).toBe(10);
    expect(d3.axes).toBe(0);
  });

  it('scores shared themes as 6 / 11 / 15', () => {
    const a = minimal('a', ['faith', 'war', 'power'], 3);
    const one = affinityBreakdown(a, minimal('b', ['faith'], 3));
    const two = affinityBreakdown(a, minimal('c', ['faith', 'war'], 3));
    const three = affinityBreakdown(a, minimal('d', ['faith', 'war', 'power'], 3));
    expect(one.themes).toBe(6);
    expect(two.themes).toBe(11);
    expect(three.themes).toBe(15);
  });

  it('equals the sum of rounded pillars', () => {
    const a = minimal('a', ['faith'], 3);
    const b = minimal('b', ['war'], 5);
    const score = affinityBreakdown(a, b);
    expect(affinityPercent(a, b)).toBe(score.percent);
    expect(score.percent).toBe(score.archetype + score.axes + score.character + score.themes);
  });
});

describe('compare kinship', () => {
  it('uses affinity percent for two worlds', () => {
    const a = minimal('a', ['faith'], 3);
    const b = minimal('b', ['faith'], 3);
    expect(kinshipPercent([a, b])).toBe(affinityPercent(a, b));
  });

  it('names the axis with the largest spread', () => {
    const low = minimal('low', [], 3, 1);
    const high = minimal('high', [], 3, 5);
    expect(farthestAxis([low, high])?.key).toBe('hopeDespair');
    expect(farthestAxis([low, high])?.spread).toBe(4);
  });

  it('keeps slot colors in gold / teal / amethyst order', () => {
    expect(slotHue(0)).toBe('#B74A9D');
    expect(slotHue(1)).toBe('#1A9389');
    expect(slotHue(2)).toBe('#5F9205');
  });
});

describe('themeCoverage', () => {
  it('keeps 2-of-3 themes in the shared set for BG + Dark Souls + Diablo', () => {
    const bg = minimal('baldurs-gate', [
      'free-will-and-fate',
      'identity-and-existence',
      'power-and-dominion',
    ], 3);
    const ds = minimal('dark-souls', ['uncovering-the-past', 'faith', 'power-and-dominion'], 4);
    const diablo = minimal('diablo', ['war', 'free-will-and-fate', 'faith'], 4);
    const coverage = themeCoverage([bg, ds, diablo]);
    const bySlug = Object.fromEntries(coverage.map((item) => [item.slug, item.owners]));

    expect(bySlug['power-and-dominion']).toEqual([0, 1]);
    expect(bySlug['free-will-and-fate']).toEqual([0, 2]);
    expect(bySlug['faith']).toEqual([1, 2]);
    expect(coverage.filter((item) => item.owners.length >= 2).map((item) => item.slug).sort()).toEqual(
      ['faith', 'free-will-and-fate', 'power-and-dominion'],
    );
    expect(coverage.filter((item) => item.owners.length === 1).map((item) => item.slug).sort()).toEqual(
      ['identity-and-existence', 'uncovering-the-past', 'war'],
    );
    expect(coverage.some((item) => item.owners.length === 3)).toBe(false);
  });
});

describe('kinshipPairs', () => {
  it('lists every pair and sorts by percent descending', () => {
    const a = minimal('a', ['faith', 'war', 'power'], 3);
    const b = minimal('b', ['faith', 'war', 'power'], 3);
    const c = minimal('c', [], 5, 5, { chapterId: 'horror' });
    const pairs = kinshipPairs([a, b, c]);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toMatchObject({ left: 0, right: 1, percent: affinityPercent(a, b) });
    const percents = pairs.map((pair) => pair.percent);
    expect(percents).toEqual([...percents].sort((left, right) => right - left));
  });
});

describe('parseCompareIds', () => {
  const valid = new Set(['baldurs-gate', 'dark-souls', 'diablo']);

  it('reads worlds and w query aliases', () => {
    expect(parseCompareIds('?worlds=baldurs-gate,dark-souls,diablo', valid)).toEqual([
      'baldurs-gate',
      'dark-souls',
      'diablo',
    ]);
    expect(parseCompareIds('?w=baldurs-gate,diablo', valid)).toEqual(['baldurs-gate', 'diablo']);
    expect(parseCompareIds('?worlds=baldurs-gate,dark-souls&w=diablo', valid)).toEqual([
      'baldurs-gate',
      'dark-souls',
    ]);
  });
});

describe('kinshipRanking', () => {
  it('orders other worlds by affinity and skips the source and drafts', () => {
    const source = minimal('a', ['x', 'y', 'z'], 3);
    const close = minimal('b', ['x', 'y', 'z'], 3);
    const far = minimal('c', [], 1, 5);
    const draft = { ...minimal('d', ['x', 'y', 'z'], 3), draft: true } as World;
    const ranked = kinshipRanking(source, [source, far, close, draft], 3);
    expect(ranked.map((r) => r.world.id)).toEqual(['b', 'c']);
    expect(ranked[0].percent).toBe(affinityPercent(source, close));
  });
});

describe('kinship levels', () => {
  it('maps percent to five levels by cutoffs', () => {
    const cut = [66, 51, 38, 29];
    expect(levelFromPercent(70, cut)).toBe(5);
    expect(levelFromPercent(51, cut)).toBe(4);
    expect(levelFromPercent(40, cut)).toBe(3);
    expect(levelFromPercent(30, cut)).toBe(2);
    expect(levelFromPercent(10, cut)).toBe(1);
  });

  it('lifts curated pairs to at least close kin', () => {
    const a = { ...minimal('a', [], 1, 1), relatedWorlds: [{ id: 'b', title: { en: 'b' }, note: { en: 'n' } }] } as World;
    const b = minimal('b', ['x'], 5, 5);
    const fillers = ['c', 'd', 'e', 'f', 'g'].map((id) => minimal(id, ['x'], 5, 5));
    expect(kinshipLevel(a, b, [a, b, ...fillers])).toBeGreaterThanOrEqual(4);
  });

  it('describes pillar strength in words', () => {
    expect(pillarStrength(20, 20)).toBe('Strong');
    expect(pillarStrength(0, 15)).toBe('None');
    expect(pillarStrength(6, 15)).toBe('Partial');
  });
});
