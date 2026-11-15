import type { World } from '../schemas/world';

export type TrailId = 'gods-burden' | 'cursed-legacy' | 'free-will';

export type TrailDef = {
  id: TrailId;
  nameKey: string;
  descKey: string;
  match: (world: World) => boolean;
};

const GODS = new Set(['baldurs-gate', 'dark-souls', 'diablo']);

export const TRAILS: TrailDef[] = [
  {
    id: 'gods-burden',
    nameKey: 'home.trailGods',
    descKey: 'home.trailGodsDesc',
    match: (world) =>
      GODS.has(world.id) ||
      (world.themes.includes('faith') && world.themes.includes('power-and-dominion')),
  },
  {
    id: 'cursed-legacy',
    nameKey: 'home.trailCurse',
    descKey: 'home.trailCurseDesc',
    match: (world) =>
      world.axes.hopeDespair.value >= 4 || world.themes.includes('uncovering-the-past'),
  },
  {
    id: 'free-will',
    nameKey: 'home.trailWill',
    descKey: 'home.trailWillDesc',
    match: (world) =>
      world.themes.includes('free-will-and-fate') &&
      world.themes.includes('identity-and-existence'),
  },
];

export function trailById(id: TrailId | null): TrailDef | undefined {
  return TRAILS.find((trail) => trail.id === id);
}
