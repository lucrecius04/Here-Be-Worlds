import type { World } from '../schemas/world';
import { AXIS_KEYS } from './similarity';

export type AxisValues = Record<(typeof AXIS_KEYS)[number], number>;

export const DEFAULT_IMPRINT: AxisValues = {
  hopeDespair: 3,
  knownUnknown: 3,
  intimateEpic: 3,
  moralClarityAmbiguity: 3,
  realismMetaphysical: 3,
};

function clampAxis(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function toVector(values: AxisValues): number[] {
  return AXIS_KEYS.map((key) => (clampAxis(values[key]) - 1) / 4);
}

function worldVector(world: World): number[] {
  return AXIS_KEYS.map((key) => (world.axes[key].value - 1) / 4);
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

const MAX_DIST = Math.sqrt(AXIS_KEYS.length);

export function matchPercent(values: AxisValues, world: World): number {
  const dist = euclidean(toVector(values), worldVector(world));
  return Math.round((1 - dist / MAX_DIST) * 100);
}

export type ImprintHit = {
  world: World;
  percent: number;
  dist: number;
};

export function rankByImprint(values: AxisValues, worlds: World[]): ImprintHit[] {
  const imprint = toVector(values);
  return worlds
    .filter((world) => !world.draft)
    .map((world) => {
      const dist = euclidean(imprint, worldVector(world));
      return {
        world,
        dist,
        percent: Math.round((1 - dist / MAX_DIST) * 100),
      };
    })
    .sort((a, b) => a.dist - b.dist || a.world.id.localeCompare(b.world.id));
}

export function imprintNeighbors(
  values: AxisValues,
  worlds: World[],
): { nearest: ImprintHit[]; antipode: ImprintHit | null } {
  const ranked = rankByImprint(values, worlds);
  const nearest = ranked.slice(0, 2);
  const skip = new Set(nearest.map((hit) => hit.world.id));
  const antipode = [...ranked].reverse().find((hit) => !skip.has(hit.world.id)) ?? null;
  return { nearest, antipode };
}
