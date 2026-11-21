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
  /** Témata, kterých se esej stezky dotýká (slugy z data/meta/theme-taxonomy.json), nejdůležitější první. */
  themes: string[];
  match: (world: World) => boolean;
};

export type TrailId = string;

const def = (id: string, key: string, members: string[], themes: string[]): TrailDef => ({
  id,
  nameKey: `trails.${key}`,
  descKey: `trails.${key}Desc`,
  members,
  themes,
  match: (world) => members.includes(world.id),
});

export const TRAILS: TrailDef[] = [
  def('gods-burden', 'gods', ['baldurs-gate', 'diablo', 'dark-souls', 'elden-ring', 'pillars-of-eternity', 'hades', 'elder-scrolls'], ['gods', 'faith', 'power-and-dominion', 'free-will-and-fate']),
  def('cursed-legacy', 'curse', ['bloodborne', 'dragon-age', 'horizon', 'assassins-creed', 'path-of-exile', 'nier-automata'], ['guilt-and-redemption', 'uncovering-the-past', 'civilizational-collapse']),
  def('free-will', 'will', ['bioshock', 'baldurs-gate', 'the-witcher', 'xenoblade', 'half-life', 'deus-ex'], ['free-will-and-fate', 'identity-and-existence', 'conspiracy', 'power-and-dominion']),
  def('god-corpse', 'corpse', ['bloodborne', 'xenoblade', 'elder-scrolls', 'pathfinder', 'warhammer-40k'], ['gods', 'faith', 'death-and-immortality']),
  def('loops', 'loops', ['outer-wilds', 'hades', 'undertale', 'dark-souls', 'nier-automata', 'xenoblade', 'mass-effect'], ['cyclical-history', 'death-and-immortality', 'free-will-and-fate']),
  def('knows-you-play', 'meta', ['undertale', 'inscryption', 'nier-automata', 'bioshock', 'pathologic'], ['identity-and-existence', 'free-will-and-fate', 'guilt-and-redemption']),
  def('who-woke-up', 'woke', ['planescape-torment', 'disco-elysium', 'tides-of-numenera', 'soma', 'baldurs-gate'], ['identity-and-existence', 'uncovering-the-past', 'guilt-and-redemption']),
  def('monster-mirror', 'monster', ['silent-hill', 'undertale', 'planescape-torment', 'dishonored', 'nier-automata'], ['guilt-and-redemption', 'identity-and-existence', 'revenge']),
  def('scapegoat', 'scapegoat', ['pathologic', 'dishonored', 'pentiment', 'silent-hill', 'the-witcher', 'dragon-age'], ['guilt-and-redemption', 'faith', 'politics-and-intrigue']),
  def('failed-paradise', 'paradise', ['bioshock', 'fallout', 'disco-elysium', 'pathologic'], ['progress-and-its-costs', 'power-and-dominion', 'civilizational-collapse']),
  def('corporate', 'corporate', ['cyberpunk-2077', 'deus-ex', 'resident-evil', 'fallout', 'horizon'], ['power-and-dominion', 'progress-and-its-costs', 'conspiracy']),
  def('dead-speak', 'dead', ['bioshock', 'soma', 'horizon', 'outer-wilds', 'resident-evil'], ['uncovering-the-past', 'death-and-immortality', 'civilizational-collapse']),
  def('laughter', 'laughter', ['hades', 'disco-elysium', 'control', 'inscryption', 'undertale', 'fallout', 'doom'], ['humor-irony-exaggeration', 'friendship-and-fellowship', 'death-and-immortality']),
  def('living-city', 'city', ['disco-elysium', 'cyberpunk-2077', 'dishonored', 'pathologic', 'silent-hill', 'bioshock', 'planescape-torment'], ['politics-and-intrigue', 'survival', 'identity-and-existence']),
  def('endless-war', 'war', ['warhammer-40k', 'nier-automata', 'warcraft', 'the-witcher', 'metro', 'starcraft'], ['war', 'power-and-dominion', 'faith']),
  def('indifferent-stars', 'stars', ['bloodborne', 'soma', 'warhammer-40k', 'control', 'mass-effect', 'outer-wilds'], ['discovery', 'identity-and-existence', 'death-and-immortality']),
  def('chronicle-keepers', 'keepers', ['pentiment', 'elder-scrolls', 'dragon-age', 'warhammer-40k', 'doom', 'pillars-of-eternity'], ['uncovering-the-past', 'power-and-dominion', 'faith']),
  def('copies', 'copies', ['mass-effect', 'halo', 'fallout', 'horizon', 'deus-ex', 'cyberpunk-2077'], ['identity-and-existence', 'progress-and-its-costs', 'death-and-immortality']),
  def('house', 'house', ['metro', 'resident-evil', 'inscryption', 'control', 'half-life', 'xcom'], ['power-and-dominion', 'survival', 'conspiracy']),
  def('endless-work', 'work', ['death-stranding', 'pentiment', 'disco-elysium', 'half-life', 'dark-souls'], ['survival', 'friendship-and-fellowship', 'cyclical-history']),
  def('true-names', 'names', ['dishonored', 'undertale', 'dragon-age', 'elder-scrolls', 'control', 'tides-of-numenera'], ['identity-and-existence', 'power-and-dominion', 'gods']),
  def('contagion', 'contagion', ['halo', 'starcraft', 'warcraft', 'diablo', 'elden-ring', 'pathfinder'], ['survival', 'identity-and-existence', 'civilizational-collapse']),
];

/** České adresy stránek stezek (/putovani/<slug>/); stejný slug má soubor eseje v content/trails. */
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
  'chronicle-keepers': 'kdo-drzi-kroniku',
  copies: 'kopie-bez-originalu',
  house: 'dum-ze-ktereho-nejde-odejit',
  'endless-work': 'prace-ktera-nikdy-nekonci',
  'true-names': 'jmeno-jako-klic-i-kletba',
  'contagion': 'nakaza-s-vlastni-vuli',
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
