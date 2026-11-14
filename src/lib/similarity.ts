import type { World } from '../schemas/world';

export const AXIS_WEIGHT = 0.7;
export const THEME_WEIGHT = 0.3;

export const AXIS_KEYS = [
  'hopeDespair',
  'knownUnknown',
  'intimateEpic',
  'moralClarityAmbiguity',
  'realismMetaphysical',
] as const;

function axisVector(world: World): number[] {
  return AXIS_KEYS.map((k) => (world.axes[k].value - 1) / 4);
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function similarityScore(source: World, other: World): number {
  const axisDist = euclidean(axisVector(source), axisVector(other));
  const maxDist = Math.sqrt(AXIS_KEYS.length);
  const axisSim = 1 - axisDist / maxDist;
  const themeSim = jaccard(source.themes, other.themes);
  return AXIS_WEIGHT * axisSim + THEME_WEIGHT * themeSim;
}

export function similarWorlds(source: World, all: World[], limit = 5): World[] {
  return all
    .filter((w) => w.id !== source.id)
    .map((w) => ({ world: w, score: similarityScore(source, w) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.world);
}
