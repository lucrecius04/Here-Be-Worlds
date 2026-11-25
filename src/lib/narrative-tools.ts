/**
 * Jak světy vyprávějí (/jak-svety-vypraveji/): vypravěčské nástroje z oddílu „5. Hlavní nástroje
 * vyprávění“ v kronikách, zařazené do způsobů a rejstříků z data/meta/narrative-tools.json.
 * Rejstříky jdou od toho, co umí i kniha, po to, co umí jen hra. Skládá se při sestavení.
 */
import type { LocalizedString, World } from '../schemas/world';
import raw from '../../data/meta/narrative-tools.json';
import { worlds as allWorlds, chapters, narrationTaxonomy } from './worlds';
import { slugifyChronicleHeading } from './chronicle-toc';

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

/** Jeden nástroj z kroniky: název (bez anglické závorky), závorka zvlášť, celý odstavec. */
export type NarrTool = {
  world: string;
  technique: string;
  title: string;
  aside?: string;
  text: string;
};

export type NarrWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  number: number;
  /** Kotva oddílu Hlavní nástroje vyprávění v Anatomii vyprávění. */
  anchor: string;
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
  const shared = narrationTaxonomy.find((n) => n.slug === tech.id)?.label as LocalizedString | undefined;
  return { id: tech.id, family: tech.family, label: shared ?? tech.label ?? { en: tech.id }, desc: tech.desc, trail: tech.trail };
});

export const NARR_ASSIGNMENTS: Record<string, string[]> = data.assignments;

/** Pořadí rejstříku (0 = jako kniha … 6 = hráč); slouží k řazení světů od slova ke hře. */
export const familyIndex = (familyId: string) => NARR_FAMILIES.findIndex((f) => f.id === familyId);
export const techniqueOf = (id: string) => NARR_TECHNIQUES.find((t) => t.id === id);

const TOOLS_HEADING = /^##\s+5\.\s+Hlavní nástroje vyprávění\s*$/m;

/** Nástroje z jedné kroniky: odstavce, které začínají **názvem**, v pořadí kroniky. */
export function chronicleTools(md: string): Array<{ title: string; aside?: string; text: string }> {
  const start = md.search(TOOLS_HEADING);
  if (start < 0) return [];
  const rest = md.slice(start).split('\n').slice(1).join('\n');
  const end = rest.search(/^##\s/m);
  const body = end < 0 ? rest : rest.slice(0, end);
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .map((p) => /^\*\*(.+?)\*\*\s*[:：]?\s*([\s\S]*)$/.exec(p))
    .filter((m): m is RegExpExecArray => Boolean(m))
    .map((m) => {
      const full = m[1].trim().replace(/[:：]$/, '');
      // „Vědomostní zámky (Knowledge-gating)“ → název a závorka zvlášť (závorka jen na konci).
      const paren = /^(.*\S)\s+\(([^()]+)\)$/.exec(full);
      return {
        title: paren ? paren[1] : full,
        aside: paren ? paren[2] : undefined,
        text: m[2].replace(/\s*\n\s*/g, ' ').trim(),
      };
    });
}

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const published = allWorlds.filter((w) => !w.draft);
const chronicleOf = (w: World) => CHRONICLES[`../../content/chronicles/${w.chronicleSlug}.md`] ?? '';

function toolsAnchor(md: string): string {
  const m = TOOLS_HEADING.exec(md);
  return m ? slugifyChronicleHeading(m[0].replace(/^##\s+/, '').trim()) : '';
}

export const narrWorlds: NarrWorld[] = published.map((w) => ({
  id: w.id,
  title: w.gameTitle,
  chapterId: w.chapterId,
  accent: chapters.find((c) => c.id === w.chapterId)?.accent ?? { light: '#57534d', dark: '#c9ceda' },
  number: w.number,
  anchor: toolsAnchor(chronicleOf(w)),
}));

/** Všechny nástroje všech publikovaných světů se způsobem podle zařazení (bez zařazení se vynechají). */
export const narrTools: NarrTool[] = published.flatMap((w) => {
  const assigned = NARR_ASSIGNMENTS[w.id] ?? [];
  return chronicleTools(chronicleOf(w)).flatMap((tool, i) =>
    assigned[i] ? [{ world: w.id, technique: assigned[i], ...tool }] : [],
  );
});

/** Počet nástrojů světa v každém rejstříku (pořadí jako NARR_FAMILIES). */
export function familyCounts(worldId: string, tools: NarrTool[] = narrTools): number[] {
  const counts = NARR_FAMILIES.map(() => 0);
  for (const tool of tools) {
    if (tool.world !== worldId) continue;
    const tech = techniqueOf(tool.technique);
    if (tech) counts[familyIndex(tech.family)] += 1;
  }
  return counts;
}

/** Těžiště vyprávění světa: 0 = vypráví jako kniha, 6 = vypráví jen jako hra (průměr rejstříků). */
export function centroid(counts: number[]): number {
  const total = counts.reduce((a, b) => a + b, 0);
  return total ? counts.reduce((sum, n, i) => sum + n * i, 0) / total : 0;
}

export const narrChapters = chapters.map((c) => ({
  id: c.id,
  title: c.title as LocalizedString,
  short: (c as { short?: LocalizedString }).short,
  accent: c.accent,
}));
