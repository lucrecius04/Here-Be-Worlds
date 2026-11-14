import type { World } from '../schemas/world';
import { AXIS_KEYS } from './similarity';

export const MAX_COMPARE = 3;

export const SUGGESTED_PAIRS: Array<[string, string]> = [
  ['baldurs-gate', 'dark-souls'],
  ['dark-souls', 'diablo'],
  ['baldurs-gate', 'diablo'],
];

export function parseCompareIds(search: string, valid: Set<string>): string[] {
  const raw = new URLSearchParams(search).get('w') ?? '';
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const token of raw.split(',')) {
    const id = token.trim();
    if (!id || !valid.has(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_COMPARE) break;
  }
  return ids;
}

export function writeCompareQuery(ids: string[]): void {
  const url = new URL(window.location.href);
  const cleaned = ids.filter(Boolean).slice(0, MAX_COMPARE);
  if (cleaned.length === 0) url.searchParams.delete('w');
  else url.searchParams.set('w', cleaned.join(','));
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

export function sharedThemes(worlds: World[]): string[] {
  if (worlds.length === 0) return [];
  return worlds[0].themes.filter((slug) => worlds.every((world) => world.themes.includes(slug)));
}

export function exclusiveThemes(world: World, others: World[]): string[] {
  return world.themes.filter((slug) => others.every((other) => !other.themes.includes(slug)));
}

export function closestAxisIds(worlds: World[]): Array<(typeof AXIS_KEYS)[number]> {
  if (worlds.length < 2) return [];
  const spreads = AXIS_KEYS.map((key) => {
    const values = worlds.map((world) => world.axes[key].value);
    return { key, spread: Math.max(...values) - Math.min(...values) };
  });
  const min = Math.min(...spreads.map((item) => item.spread));
  return spreads.filter((item) => item.spread === min).map((item) => item.key);
}
