/**
 * Poetika světů (/poetika-svetu/, do 2026-11-28 Jak světy vyprávějí): vypravěčské nástroje z oddílu „5. Hlavní nástroje
 * vyprávění“ v kronikách, zařazené do způsobů a šesti kruhů z data/meta/narrative-tools.json.
 * Kruhy jdou od slova k hráči (model v docs/metodika-vypraveni.md). Skládá se při sestavení.
 */
import type { LocalizedString, World } from '../schemas/world';
import { worlds as allWorlds, chapters } from './worlds';
import { NARR_ASSIGNMENTS, NARR_RINGS, familyIndex, techniqueOf, type NarrMode } from './narrative-taxonomy';

export {
  NARR_ASSIGNMENTS,
  NARR_FAMILIES,
  NARR_RINGS,
  NARR_TECHNIQUES,
  OWN_FROM,
  familyIndex,
  techniqueOf,
  worldTechniques,
  type NarrFamily,
  type NarrMode,
  type NarrTechnique,
} from './narrative-taxonomy';
import { slugifyChronicleHeading } from './chronicle-toc';

/** Jeden nástroj z kroniky: název (bez anglické závorky), závorka zvlášť, celý odstavec. */
export type NarrTool = {
  world: string;
  /** Pořadí nástroje v kronice (od 0), pro kotvu `n-<svět>-<pořadí>`. */
  index: number;
  technique: string;
  mode?: NarrMode;
  /** Druhý kruh u hraničního případu. */
  also?: string;
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
    assigned[i]
      ? [{ world: w.id, index: i, technique: assigned[i].t, mode: assigned[i].m, also: assigned[i].also, ...tool }]
      : [],
  );
});

/** Počet nástrojů světa v každém kruhu (pořadí jako NARR_RINGS); vlastnosti světa se nepočítají. */
export function familyCounts(worldId: string, tools: NarrTool[] = narrTools): number[] {
  const counts = NARR_RINGS.map(() => 0);
  for (const tool of tools) {
    if (tool.world !== worldId) continue;
    const ring = familyIndex(techniqueOf(tool.technique)?.family ?? '');
    if (ring >= 0) counts[ring] += 1;
  }
  return counts;
}


export const narrChapters = chapters.map((c) => ({
  id: c.id,
  title: c.title as LocalizedString,
  short: (c as { short?: LocalizedString }).short,
  accent: c.accent,
}));
