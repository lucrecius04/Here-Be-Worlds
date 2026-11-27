/**
 * Katalog světů doplněný o údaje pro příbuznost (`world.kin`): typy triády, způsoby vyprávění
 * a paměť světa. Příbuznost počítá jen `compare.ts`; ten si údaje bere z `world.kin`, takže
 * každý, kdo příbuznost počítá (Srovnání, Příbuzenstvo, hádanky, mapa), musí brát světy odsud,
 * ne přímo z `worlds.ts`. Soubor načítá tři datové soubory, proto se používá jen při sestavení
 * a hotové světy se do prohlížeče posílají jako data stránky.
 */
import type { KinFacts, LocalizedString, World } from '../schemas/world';
import { worlds } from './worlds';
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

/** Názvy pro důkazy na vláknech příbuznosti (Srovnání): typy triády, způsoby a kruhy vyprávění. */
export type KinLabels = {
  sin: Record<string, LocalizedString>;
  dilemma: Record<string, LocalizedString>;
  mystery: Record<string, LocalizedString>;
  technique: Record<string, { label: LocalizedString; ring: string }>;
  ring: Record<string, LocalizedString>;
};

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
