import type { World } from '../schemas/world';

/**
 * Tematické stezky: ručně sestavené výběry světů napříč archetypy.
 * Členy ověřujeme proti kronikám (content/chronicles); pořadí členů = pořadí na titulní straně.
 * Stezka má mít 4–7 světů, jinak přestává být výběrem.
 */
export type TrailDef = {
  id: string;
  nameKey: string;
  descKey: string;
  members: string[];
  match: (world: World) => boolean;
};

export type TrailId = string;

const def = (id: string, key: string, members: string[]): TrailDef => ({
  id,
  nameKey: `trails.${key}`,
  descKey: `trails.${key}Desc`,
  members,
  match: (world) => members.includes(world.id),
});

export const TRAILS: TrailDef[] = [
  def('gods-burden', 'gods', ['baldurs-gate', 'diablo', 'dark-souls', 'elden-ring', 'pillars-of-eternity', 'hades', 'elder-scrolls']),
  def('cursed-legacy', 'curse', ['bloodborne', 'dragon-age', 'horizon', 'assassins-creed', 'path-of-exile', 'nier-automata']),
  def('free-will', 'will', ['bioshock', 'baldurs-gate', 'the-witcher', 'xenoblade', 'half-life', 'deus-ex']),
  def('god-corpse', 'corpse', ['bloodborne', 'xenoblade', 'elder-scrolls', 'pathfinder', 'warhammer-40k']),
  def('loops', 'loops', ['outer-wilds', 'hades', 'undertale', 'dark-souls', 'nier-automata', 'xenoblade', 'mass-effect']),
  def('knows-you-play', 'meta', ['undertale', 'inscryption', 'nier-automata', 'bioshock', 'pathologic']),
  def('who-woke-up', 'woke', ['planescape-torment', 'disco-elysium', 'tides-of-numenera', 'soma', 'baldurs-gate']),
  def('monster-mirror', 'monster', ['silent-hill', 'undertale', 'planescape-torment', 'dishonored', 'nier-automata']),
  def('scapegoat', 'scapegoat', ['pathologic', 'dishonored', 'pentiment', 'silent-hill', 'the-witcher', 'dragon-age']),
  def('failed-paradise', 'paradise', ['bioshock', 'fallout', 'disco-elysium', 'pathologic']),
  def('corporate', 'corporate', ['cyberpunk-2077', 'deus-ex', 'resident-evil', 'fallout', 'horizon']),
  def('dead-speak', 'dead', ['bioshock', 'soma', 'horizon', 'outer-wilds', 'resident-evil']),
  def('laughter', 'laughter', ['hades', 'disco-elysium', 'control', 'inscryption', 'undertale', 'fallout', 'doom']),
  def('living-city', 'city', ['disco-elysium', 'cyberpunk-2077', 'dishonored', 'pathologic', 'silent-hill', 'bioshock', 'planescape-torment']),
  def('endless-war', 'war', ['warhammer-40k', 'nier-automata', 'warcraft', 'the-witcher', 'metro', 'starcraft']),
  def('indifferent-stars', 'stars', ['bloodborne', 'soma', 'warhammer-40k', 'control', 'mass-effect', 'outer-wilds']),
];

/** České adresy stránek stezek (/stezky/<slug>/); stejný slug má soubor eseje v content/trails. */
export const TRAIL_SLUGS: Record<string, string> = {
  'gods-burden': 'bohove-jako-bremeno',
  'cursed-legacy': 'proklete-dedictvi',
  'free-will': 'krehka-hranice-svobodne-vule',
  'god-corpse': 'na-mrtvole-boha',
  loops: 'uvezneni-v-kruhu',
  'knows-you-play': 'hra-vi-ze-ji-hrajes',
  'who-woke-up': 'kdo-se-to-probudil',
  'monster-mirror': 'netvor-v-zrcadle',
  scapegoat: 'kdo-za-to-muze',
  'failed-paradise': 'raj-ktery-se-nepovedl',
  corporate: 'logo-nad-troskami',
  'dead-speak': 'mluvi-uz-jen-mrtvi',
  laughter: 'smich-nad-propasti',
  'living-city': 'mesto-ktere-dycha',
  'endless-war': 'valka-kterou-nikdo-nevyhraje',
  'indifferent-stars': 'pod-lhostejnymi-hvezdami',
};

export function trailSlug(id: TrailId): string {
  return TRAIL_SLUGS[id] ?? id;
}

export function trailBySlug(slug: string | undefined): TrailDef | undefined {
  return TRAILS.find((trail) => trailSlug(trail.id) === slug);
}

export function trailById(id: TrailId | null | undefined): TrailDef | undefined {
  return TRAILS.find((trail) => trail.id === id);
}

/** Stezky dne na titulní straně: každý den jiná trojice, za šest dní se vystřídají všechny. */
export function dailyTrails(day: number, count = 3, trails: TrailDef[] = TRAILS): TrailDef[] {
  if (!trails.length) return [];
  const start = (((day * count) % trails.length) + trails.length) % trails.length;
  return Array.from({ length: Math.min(count, trails.length) }, (_, i) => trails[(start + i) % trails.length]);
}
