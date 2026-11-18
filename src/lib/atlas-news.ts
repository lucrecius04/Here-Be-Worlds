import type { World } from '../schemas/world';

export const ATLAS_UNIVERSE_TOTAL = 43;

export function isSampleWorld(world: { id: string }): boolean {
  return world.id.startsWith('vzorek-');
}

export function isMappedWorld(world: World): boolean {
  return !world.draft && !isSampleWorld(world);
}

export function latestAdded(worlds: World[], limit = 3): World[] {
  return worlds
    .filter((world) => Boolean(world.addedAt) && isMappedWorld(world))
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? '') || b.number - a.number)
    .slice(0, limit);
}

export function mostRecentAdded(worlds: World[]): World | undefined {
  return latestAdded(worlds, 1)[0];
}
