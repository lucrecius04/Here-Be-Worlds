/**
 * Rejstříky a způsoby vyprávění a zařazení nástrojů (data/meta/narrative-tools.json), bez kronik:
 * smí se načíst i v prohlížeči (filtr „Jak svět vypráví“ v atlasu). Nástroje z kronik: narrative-tools.ts.
 */
import type { LocalizedString } from '../schemas/world';
import raw from '../../data/meta/narrative-tools.json';
import narrationData from '../../data/meta/narration-taxonomy.json';

export type NarrFamily = {
  id: string;
  short: LocalizedString;
  label: LocalizedString;
  kin: LocalizedString;
  desc: LocalizedString;
};

export type NarrTechnique = {
  id: string;
  family: string;
  label: LocalizedString;
  desc: LocalizedString;
  /** Putování, které se tomuto způsobu věnuje (id z trails.ts). */
  trail?: string;
};

type Raw = {
  families: NarrFamily[];
  techniques: Array<{ id: string; family: string; trail?: string; label?: LocalizedString; desc: LocalizedString }>;
  assignments: Record<string, string[]>;
};

const data = raw as unknown as Raw;

export const NARR_FAMILIES: NarrFamily[] = data.families;

/** Způsoby; ty se stejným slugem jako štítky „Jak svět vypráví“ berou název odtamtud. */
export const NARR_TECHNIQUES: NarrTechnique[] = data.techniques.map((tech) => {
  const shared = narrationData.narration.find((n) => n.slug === tech.id)?.label as LocalizedString | undefined;
  return { id: tech.id, family: tech.family, label: shared ?? tech.label ?? { en: tech.id }, desc: tech.desc, trail: tech.trail };
});

export const NARR_ASSIGNMENTS: Record<string, string[]> = data.assignments;

/** Pořadí rejstříku (0 = jako kniha … 6 = hráč); slouží k řazení světů od slova ke hře. */
export const familyIndex = (familyId: string) => NARR_FAMILIES.findIndex((f) => f.id === familyId);
export const techniqueOf = (id: string) => NARR_TECHNIQUES.find((t) => t.id === id);

/** Způsoby, kterými svět vypráví (podle nástrojů jeho kroniky), bez opakování, v pořadí stránky. */
export function worldTechniques(worldId: string): string[] {
  const own = new Set(NARR_ASSIGNMENTS[worldId] ?? []);
  return NARR_TECHNIQUES.filter((t) => own.has(t.id)).map((t) => t.id);
}
