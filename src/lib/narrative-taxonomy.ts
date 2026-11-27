/**
 * Model šesti kruhů (docs/metodika-vypraveni.md): kruhy, způsoby a zařazení nástrojů
 * (data/meta/narrative-tools.json), bez kronik. Smí se načíst i v prohlížeči (filtr „Poetika světa“
 * v atlasu, karta světa). Nástroje z kronik: narrative-tools.ts.
 */
import type { LocalizedString } from '../schemas/world';
import raw from '../../data/meta/narrative-tools.json';

export type NarrFamily = {
  id: string;
  short: LocalizedString;
  label: LocalizedString;
  kin: LocalizedString;
  question: LocalizedString;
  desc: LocalizedString;
  /** Skupina mimo kruhy (vlastnosti světa): nevypráví, je tím, co se vypráví. */
  outside?: boolean;
};

export type NarrTechnique = {
  id: string;
  family: string;
  label: LocalizedString;
  desc: LocalizedString;
  /** Putování, které se tomuto způsobu věnuje (id z trails.ts). */
  trail?: string;
};

/** Režim: V vložený, I inscenovaný, E vznikající (vzniká při hraní). */
export type NarrMode = 'V' | 'I' | 'E';

/** Zařazení jednoho nástroje kroniky. */
export type NarrAssignment = { t: string; m?: NarrMode; also?: string };

type Raw = {
  families: NarrFamily[];
  techniques: NarrTechnique[];
  assignments: Record<string, NarrAssignment[]>;
};

const data = raw as unknown as Raw;

/** Všechny skupiny včetně té mimo kruhy (ta je poslední). */
export const NARR_FAMILIES: NarrFamily[] = data.families;
/** Jen šest kruhů, od slova k hráči. */
export const NARR_RINGS: NarrFamily[] = data.families.filter((f) => !f.outside);
/** Od kterého kruhu dál umí vyprávět jen hra (Čin). */
export const OWN_FROM = NARR_RINGS.findIndex((f) => f.id === 'cin');

export const NARR_TECHNIQUES: NarrTechnique[] = data.techniques;
export const NARR_ASSIGNMENTS: Record<string, NarrAssignment[]> = data.assignments;

export const familyIndex = (familyId: string) => NARR_RINGS.findIndex((f) => f.id === familyId);
export const techniqueOf = (id: string) => NARR_TECHNIQUES.find((t) => t.id === id);
const isRingTechnique = (id: string) => {
  const fam = NARR_FAMILIES.find((f) => f.id === techniqueOf(id)?.family);
  return Boolean(fam && !fam.outside);
};

/** Způsoby, kterými svět vypráví (podle nástrojů jeho kroniky), bez opakování, v pořadí stránky; bez vlastností světa. */
export function worldTechniques(worldId: string): string[] {
  const own = new Set((NARR_ASSIGNMENTS[worldId] ?? []).map((a) => a.t).filter(isRingTechnique));
  return NARR_TECHNIQUES.filter((t) => own.has(t.id)).map((t) => t.id);
}
