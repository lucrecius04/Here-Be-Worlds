/**
 * Katalog světů doplněný o údaje pro příbuznost (`world.kin`): typy triády, způsoby vyprávění
 * a paměť světa. Příbuznost počítá jen `compare.ts`; ten si údaje bere z `world.kin`, takže
 * každý, kdo příbuznost počítá (Srovnání, Příbuzenstvo, hádanky, mapa), musí brát světy odsud,
 * ne přímo z `worlds.ts`. Soubor načítá tři datové soubory, proto se používá jen při sestavení
 * a hotové světy se do prohlížeče posílají jako data stránky.
 */
import type { KinFacts, LocalizedString, World } from '../schemas/world';
import { chapters, themeTaxonomy, worlds } from './worlds';
import { PILLAR_LABEL, evidenceItems, kinshipBonds, type Evidence, type EvidenceCtx, type KinLabels, type KinshipBonds } from './kin-evidence';
import type { PillarKey } from './compare';
import { t, uiT, type Locale } from './i18n';
import { DEEP_TIME, summarize } from './deep-time';
import { DILEMMA_TYPES, MYSTERY_KINDS, SIN_TYPES, WORLD_TRIAD_TYPES } from './triad-types';
import { NARR_ASSIGNMENTS, NARR_RINGS, NARR_TECHNIQUES, techniqueOf } from './narrative-taxonomy';

const ringIds = new Set(NARR_RINGS.map((r) => r.id));

export function kinFactsOf(worldId: string): KinFacts | undefined {
  const triad = WORLD_TRIAD_TYPES[worldId];
  if (!triad) return undefined;
  const seen = new Set<string>();
  const tools: KinFacts['tools'] = [];
  for (const a of NARR_ASSIGNMENTS[worldId] ?? []) {
    const tech = techniqueOf(a.t);
    if (!tech || !ringIds.has(tech.family) || seen.has(a.t)) continue; // vlastnosti světa mimo kruhy se nepočítají
    seen.add(a.t);
    tools.push({ t: a.t, ring: tech.family, ...(a.also && ringIds.has(a.also) ? { also: a.also } : {}) });
  }
  const deep = DEEP_TIME[worldId];
  const summary = deep ? summarize(deep) : null;
  return {
    sin: triad.sin,
    ...(triad.sinAlso ? { sinAlso: triad.sinAlso } : {}),
    dilemma: triad.dilemma,
    mystery: triad.mystery,
    tools,
    memory: summary && summary.deepest > 0 ? summary.deepest : null,
    myth: Boolean(summary?.hasMyth),
  };
}

/** Všechny světy (i drafty) s `kin`; publikované = `kinWorlds.filter((w) => !w.draft)`. */
export const kinWorlds: World[] = worlds.map((w) => {
  const kin = kinFactsOf(w.id);
  return kin ? { ...w, kin } : w;
});

export const kinPublished: World[] = kinWorlds.filter((w) => !w.draft);

/** Názvy pro důkazy příbuznosti: typy triády, způsoby a kruhy vyprávění. */
const byId = (list: Array<{ id: string; label: LocalizedString }>) => Object.fromEntries(list.map((x) => [x.id, x.label]));

export const kinLabels: KinLabels = {
  sin: byId(SIN_TYPES),
  dilemma: byId(DILEMMA_TYPES),
  mystery: byId(MYSTERY_KINDS),
  technique: Object.fromEntries(
    NARR_TECHNIQUES.filter((t) => ringIds.has(t.family)).map((t) => [t.id, { label: t.label, ring: t.family }]),
  ),
  ring: Object.fromEntries(NARR_RINGS.map((r) => [r.id, r.short ?? r.label])),
};

/**
 * Nejsilnější a nejslabší pouto dvojice pro Příbuzenstvo na spisu světa, česky i anglicky.
 * `label` = čeho se pouto týká: název pilíře, nebo přesnější úvod důkazu („Shodné souřadnice“,
 * „Prvotní hřích“, „Nálada“); `text` = co světy sdílejí, nebo v čem se rozcházejí („A × B“).
 */
export type RelatedBond = { label: LocalizedString; text: LocalizedString };

const LOCALES: Locale[] = ['cs', 'en'];
const themeLabelOf = new Map(themeTaxonomy.map((theme) => [theme.slug, theme.label as LocalizedString]));

function ctxFor(locale: Locale): EvidenceCtx {
  return {
    locale,
    kinLabels,
    chapterLabel: (id) => {
      const chapter = chapters.find((c) => c.id === id) as { title: LocalizedString; short?: LocalizedString } | undefined;
      return chapter ? t(chapter.short ?? chapter.title, locale) : id;
    },
    themeLabel: (slug) => (themeLabelOf.has(slug) ? t(themeLabelOf.get(slug)!, locale) : slug),
  };
}

function bondLabel(pillar: PillarKey, evidence: Evidence, locale: Locale): string {
  const lead = evidence.lead?.replace(/:\s*$/, '');
  if (!lead) return uiT(PILLAR_LABEL[pillar], locale);
  return lead.charAt(0).toLocaleUpperCase(locale) + lead.slice(1);
}

export function relatedBonds(aId: string, bId: string): { bond: RelatedBond; rift: RelatedBond | null } | null {
  const a = kinWorlds.find((w) => w.id === aId);
  const b = kinWorlds.find((w) => w.id === bId);
  if (!a || !b) return null;
  const per = LOCALES.map((locale) => ({ locale, bonds: kinshipBonds(a, b, ctxFor(locale)) }));
  const localized = (pick: (bonds: KinshipBonds, locale: Locale) => string) =>
    Object.fromEntries(per.map(({ locale, bonds }) => [locale, pick(bonds, locale)])) as unknown as LocalizedString;
  return {
    bond: {
      label: localized((bonds, locale) => bondLabel(bonds.bond.pillar, bonds.bond.evidence, locale)),
      text: localized((bonds) => evidenceItems(bonds.bond.evidence)),
    },
    rift: per[0].bonds.rift
      ? {
          label: localized((bonds, locale) => bondLabel(bonds.rift!.pillar, bonds.rift!.evidence, locale)),
          text: localized((bonds) => evidenceItems(bonds.rift!.evidence)),
        }
      : null,
  };
}
