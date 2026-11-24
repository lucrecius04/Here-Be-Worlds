/**
 * Roztřídění triád světů (data/meta/triad-types.json): typy prvotních hříchů a ústředních dilemat
 * pro Galerii triád (/galerie-triad/) a druh tajemství + kdo drží mezeru pro Mapu neznáma (/mapa-neznama/).
 * Spis světa z nich bere odkazy pod triádou. Test hlídá, že každý publikovaný svět je zařazený.
 */
import raw from '../../data/meta/triad-types.json';
import type { LocalizedString } from '../schemas/world';

export type TriadType = { id: string; label: LocalizedString; desc: LocalizedString };
export type WorldTriadTypes = { sin: string; sinAlso?: string; dilemma: string; mystery: string; holder: string };

export const SIN_TYPES: TriadType[] = raw.sinTypes;
export const DILEMMA_TYPES: TriadType[] = raw.dilemmaTypes;
export const MYSTERY_KINDS: TriadType[] = raw.mysteryKinds;
export const MYSTERY_HOLDERS: TriadType[] = raw.mysteryHolders;
export const WORLD_TRIAD_TYPES: Record<string, WorldTriadTypes> = raw.worlds;

const byId = (list: TriadType[]) => new Map(list.map((x) => [x.id, x]));
const SIN = byId(SIN_TYPES);
const DILEMMA = byId(DILEMMA_TYPES);
const KIND = byId(MYSTERY_KINDS);
const HOLDER = byId(MYSTERY_HOLDERS);

export function triadTypesOf(worldId: string) {
  const w = WORLD_TRIAD_TYPES[worldId];
  if (!w) return null;
  return {
    sin: SIN.get(w.sin),
    sinAlso: w.sinAlso ? SIN.get(w.sinAlso) : undefined,
    dilemma: DILEMMA.get(w.dilemma),
    mystery: KIND.get(w.mystery),
    holder: HOLDER.get(w.holder),
  };
}

/** Kotva tajemství světa v rejstříku Mapy neznáma. */
export const mysteryAnchor = (worldId: string) => `t-${worldId}`;

export const GALLERY_PATH = '/galerie-triad/';
export const UNKNOWN_PATH = '/mapa-neznama/';
