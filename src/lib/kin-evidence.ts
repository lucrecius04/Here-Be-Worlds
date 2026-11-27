/**
 * Důkazy příbuznosti slovy: co dva světy v jednom pilíři sdílejí (`pillarEvidence`), v čem se
 * rozcházejí (`pillarRift`) a které pouto je nejsilnější a nejslabší (`kinshipBonds`).
 * Jen skládá texty; body a shody počítá `compare.ts`. Používá ho Srovnání (vlákna) i Příbuzenstvo
 * na spisu světa, takže obě místa říkají totéž stejnými slovy.
 */
import type { LocalizedString, World } from '../schemas/world';
import { AXIS_KEYS } from './axes';
import { PILLARS, affinityBreakdown, kinshipEvidence, type PillarKey } from './compare';
import { t, uiT, type Locale } from './i18n';

/** Názvy typů triády, způsobů a kruhů vyprávění (skládá `kin-worlds.ts`). */
export type KinLabels = {
  sin: Record<string, LocalizedString>;
  dilemma: Record<string, LocalizedString>;
  mystery: Record<string, LocalizedString>;
  technique: Record<string, { label: LocalizedString; ring: string }>;
  ring: Record<string, LocalizedString>;
};

export type EvidenceCtx = {
  locale: Locale;
  /** Krátký název archetypu světa. */
  chapterName: (world: World) => string;
  themeLabel: (slug: string) => string;
  kinLabels: KinLabels;
};

/** Položky důkazu, případný úvod („shodné souřadnice:“), počet nevypsaných a příznak „tady shoda není“. */
export type Evidence = { items: string[]; lead?: string; more?: number; muted?: boolean };

export const PILLAR_LABEL: Record<PillarKey, string> = {
  archetype: 'compare.pillarArchetype',
  axes: 'compare.pillarAxes',
  character: 'compare.pillarCharacter',
  themes: 'compare.pillarThemes',
  triad: 'compare.pillarTriad',
  narration: 'compare.pillarNarration',
};

const AXIS_NAME: Record<string, string> = {
  hopeDespair: 'map.nameHopeDespair',
  knownUnknown: 'map.nameKnownUnknown',
  intimateEpic: 'map.nameIntimateEpic',
  moralClarityAmbiguity: 'map.nameMoralClarityAmbiguity',
  realismMetaphysical: 'map.nameRealismMetaphysical',
};

const SUB_PREFIX = /^(overlap|přesah|secondary|vedlejší)\s*:\s*/i;
/** Nejvýš tolik položek v jednom důkazu; zbytek se shrne do „+N“. */
const EVIDENCE_MAX = 4;

const cap = (items: string[], lead?: string): Evidence =>
  items.length > EVIDENCE_MAX ? { items: items.slice(0, EVIDENCE_MAX), more: items.length - EVIDENCE_MAX, lead } : { items, lead };
const none = (text: string, lead?: string): Evidence => ({ items: [text], lead, muted: true });
const versus = (a: string, b: string) => `${a} × ${b}`;
const label = (group: Record<string, LocalizedString>, id: string, locale: Locale) => (group[id] ? t(group[id], locale) : id);

/** Co dva světy v pilíři sdílejí. Kde nesdílejí nic, vrátí tlumený text o tom, v čem se rozcházejí. */
export function pillarEvidence(key: PillarKey, a: World, b: World, ctx: EvidenceCtx): Evidence {
  const { locale, kinLabels } = ctx;
  const ev = kinshipEvidence(a, b);

  if (key === 'archetype') {
    const items: string[] = [];
    if (ev.archetype.chapter) items.push(ctx.chapterName(a));
    if (ev.archetype.profile === 'same') items.push(t(a.metadata.genreProfile, locale));
    else if (ev.archetype.profile === 'near') items.push(uiT('compare.evNearProfile', locale));
    return items.length ? cap(items) : none(versus(ctx.chapterName(a), ctx.chapterName(b)));
  }

  if (key === 'axes') {
    /* souřadnic je jen pět, vypíšou se všechny */
    const names = (keys: string[]) => keys.map((k) => uiT(AXIS_NAME[k], locale));
    if (ev.axes.same.length)
      return { items: names(ev.axes.same), lead: uiT(ev.axes.same.length === 1 ? 'compare.evAxesSameOne' : 'compare.evAxesSameMany', locale) };
    if (ev.axes.near.length)
      return { items: names(ev.axes.near), lead: uiT(ev.axes.near.length === 1 ? 'compare.evAxesNearOne' : 'compare.evAxesNearMany', locale) };
    return none(uiT('compare.evAxesNone', locale));
  }

  if (key === 'character') {
    const items: string[] = [];
    for (const where of ev.character.moods) {
      const field = where === 'main' ? a.metadata.atmosphere : a.metadata.atmosphere.sub;
      if (field) items.push(t(field, locale).replace(SUB_PREFIX, ''));
    }
    for (const field of ev.character.fields) {
      const value = t(a.metadata[field], locale);
      items.push(field === 'historicalDepth' ? uiT('compare.evDepth', locale).replace('{v}', value) : value);
    }
    if (ev.character.myth) items.push(uiT('compare.evMyth', locale));
    if (ev.character.memorySpan) items.push(uiT('compare.evMemory', locale));
    return items.length ? cap(items) : none(uiT('compare.evCharacterNone', locale));
  }

  if (key === 'themes') {
    const items = ev.themes.map(ctx.themeLabel);
    return items.length ? cap(items) : none(uiT('compare.evThemesNone', locale));
  }

  if (key === 'triad') {
    const ka = a.kin;
    const kb = b.kin;
    if (!ka || !kb) return none('–');
    const items: string[] = [];
    if (ev.triad.sin === 'same') items.push(label(kinLabels.sin, ka.sin, locale));
    else if (ev.triad.sin === 'near') items.push(label(kinLabels.sin, ka.sinAlso === kb.sin ? kb.sin : ka.sin, locale));
    if (ev.triad.dilemma) items.push(label(kinLabels.dilemma, ka.dilemma, locale));
    if (ev.triad.mystery) items.push(label(kinLabels.mystery, ka.mystery, locale));
    return items.length ? cap(items) : none(versus(label(kinLabels.sin, ka.sin, locale), label(kinLabels.sin, kb.sin, locale)));
  }

  const items = ev.narration.techniques.map((id) => (kinLabels.technique[id] ? t(kinLabels.technique[id].label, locale) : id));
  for (const ring of ev.narration.rings) items.push(uiT('compare.evRing', locale).replace('{v}', label(kinLabels.ring, ring, locale)));
  return items.length ? cap(items) : none(uiT('compare.evNarrationNone', locale));
}

/**
 * V čem se dva světy v pilíři rozcházejí (pro nejslabší pouto). Vybírá to nejvýraznější:
 * u charakteru nejtěžší rozdílný údaj, u triády první rozdílný typ, u souřadnic ty nejvzdálenější.
 */
export function pillarRift(key: PillarKey, a: World, b: World, ctx: EvidenceCtx): Evidence {
  const { locale, kinLabels } = ctx;
  const ev = kinshipEvidence(a, b);

  if (key === 'archetype') {
    if (!ev.archetype.chapter) return { items: [versus(ctx.chapterName(a), ctx.chapterName(b))] };
    return { items: [versus(t(a.metadata.genreProfile, locale), t(b.metadata.genreProfile, locale))] };
  }

  if (key === 'axes') {
    const delta = (k: (typeof AXIS_KEYS)[number]) => Math.abs(a.axes[k].value - b.axes[k].value);
    const far = AXIS_KEYS.filter((k) => delta(k) >= 2).sort((x, y) => delta(y) - delta(x));
    const keys = far.length ? far : AXIS_KEYS.filter((k) => delta(k) >= 1);
    if (!keys.length) return none(uiT('compare.evAxesNone', locale));
    const kind = far.length ? 'Far' : 'Diff';
    return {
      items: keys.map((k) => uiT(AXIS_NAME[k], locale)),
      lead: uiT(`compare.riftAxes${kind}${keys.length === 1 ? 'One' : 'Many'}`, locale),
    };
  }

  if (key === 'character') {
    const main = (w: World) => t(w.metadata.atmosphere, locale);
    if (ev.character.moods.length === 0) return { items: [versus(main(a), main(b))], lead: uiT('compare.riftMood', locale) };
    const order = [
      ['sourceOfPower', 'compare.riftPower'],
      ['societalOrder', 'compare.riftSociety'],
      ['spatialScope', 'compare.riftSpace'],
      ['historicalDepth', 'compare.riftDepth'],
      ['protagonistPerspective', 'compare.riftPerspective'],
    ] as const;
    for (const [field, leadKey] of order) {
      if (!ev.character.fields.includes(field))
        return { items: [versus(t(a.metadata[field], locale), t(b.metadata[field], locale))], lead: uiT(leadKey, locale) };
    }
    return none(uiT('compare.evCharacterNone', locale));
  }

  if (key === 'themes') {
    if (ev.themes.length === 0) return none(uiT('compare.evThemesNone', locale));
    return {
      items: ev.themes.map(ctx.themeLabel),
      lead: uiT(ev.themes.length === 1 ? 'compare.riftThemesOne' : 'compare.riftThemesFew', locale),
    };
  }

  if (key === 'triad') {
    const ka = a.kin;
    const kb = b.kin;
    if (!ka || !kb) return none('–');
    if (ev.triad.sin !== 'same')
      return { items: [versus(label(kinLabels.sin, ka.sin, locale), label(kinLabels.sin, kb.sin, locale))], lead: uiT('compare.riftSin', locale) };
    if (!ev.triad.dilemma)
      return { items: [versus(label(kinLabels.dilemma, ka.dilemma, locale), label(kinLabels.dilemma, kb.dilemma, locale))], lead: uiT('compare.riftDilemma', locale) };
    return { items: [versus(label(kinLabels.mystery, ka.mystery, locale), label(kinLabels.mystery, kb.mystery, locale))], lead: uiT('compare.riftMystery', locale) };
  }

  if (ev.narration.techniques.length === 0 && ev.narration.rings.length)
    return { items: ev.narration.rings.map((ring) => label(kinLabels.ring, ring, locale)), lead: uiT('compare.riftRingOnly', locale) };
  if (ev.narration.techniques.length === 0) return none(uiT('compare.evNarrationNone', locale));
  return {
    items: ev.narration.techniques.map((id) => (kinLabels.technique[id] ? t(kinLabels.technique[id].label, locale) : id)),
    lead: uiT('compare.riftNarrationOne', locale),
  };
}

/** Při stejné síle rozhoduje, které pouto se ukáže jako nejsilnější: od nejvýmluvnějšího. */
const BOND_ORDER: PillarKey[] = ['triad', 'themes', 'narration', 'character', 'axes', 'archetype'];
/** Sílu pod „výraznou“ (`pillarStrength`) bereme jako slabé místo. */
const WEAK_BELOW = 0.55;

export type KinshipBonds = {
  /** Nejsilnější pouto: pilíř s největším podílem bodů a co v něm světy sdílejí. */
  bond: { pillar: PillarKey; evidence: Evidence };
  /** Nejslabší pouto, jen když je opravdu slabé (pod „výraznou shodou“); jinak světy nic výrazného nedělí. */
  rift: { pillar: PillarKey; evidence: Evidence } | null;
};

/**
 * Co dva světy nejvíc pojí a co je nejvíc dělí. Měří se podíl získaných bodů pilíře (ne body samy,
 * jinak by těžké pilíře vyhrály vždy). Nejslabší pouto se hledá mimo archetyp: jiný archetyp je
 * vidět ze štítku světa, takže by řádek jen opakoval známé; archetyp přijde na řadu, až když
 * žádný jiný pilíř slabý není. Při shodě podílu je slabším místem těžší pilíř (chybí v něm víc).
 */
export function kinshipBonds(a: World, b: World, ctx: EvidenceCtx): KinshipBonds {
  const score = affinityBreakdown(a, b);
  const max = (key: PillarKey) => PILLARS.find((p) => p.key === key)!.max;
  const ratio = (key: PillarKey) => score[key] / max(key);
  const strongest = [...BOND_ORDER].sort((x, y) => ratio(y) - ratio(x) || BOND_ORDER.indexOf(x) - BOND_ORDER.indexOf(y))[0];
  const weakOf = (keys: PillarKey[]) =>
    keys
      .filter((key) => key !== strongest && ratio(key) < WEAK_BELOW)
      .sort((x, y) => ratio(x) - ratio(y) || max(y) - max(x))[0];
  const weakest = weakOf(PILLARS.map((p) => p.key).filter((key) => key !== 'archetype')) ?? weakOf(['archetype']);
  return {
    bond: { pillar: strongest, evidence: pillarEvidence(strongest, a, b, ctx) },
    rift: weakest ? { pillar: weakest, evidence: pillarRift(weakest, a, b, ctx) } : null,
  };
}

/** Nejsilnější pouto povahy (témata, triáda, vyprávění): čím jsou si blízcí skrytí příbuzní. */
export function natureBond(a: World, b: World, ctx: EvidenceCtx): { pillar: PillarKey; evidence: Evidence } {
  const score = affinityBreakdown(a, b);
  const keys = BOND_ORDER.filter((key) => PILLARS.find((p) => p.key === key)!.half === 'nature');
  const ratio = (key: PillarKey) => score[key] / PILLARS.find((p) => p.key === key)!.max;
  const pillar = [...keys].sort((x, y) => ratio(y) - ratio(x) || keys.indexOf(x) - keys.indexOf(y))[0];
  return { pillar, evidence: pillarEvidence(pillar, a, b, ctx) };
}

/** Položky důkazu jako jeden řádek, bez úvodu („A · B · C +2“). */
export function evidenceItems(evidence: Evidence): string {
  return `${evidence.items.join(' · ')}${evidence.more ? ` +${evidence.more}` : ''}`;
}
