import { describe, expect, it } from 'vitest';
import {
  HALF_MAX,
  KINSHIP_CUTOFFS,
  PILLARS,
  SIBLING_MIN_STRONG_PILLARS,
  kinshipCutoffs,
  strongPillarCount,
  affinityBreakdown,
  affinityPercent,
  kinshipEvidence,
  kinshipHalves,
  farthestAxis,
  kinshipPairs,
  kinshipPercent,
  kinshipRanking,
  kinshipLevel,
  levelFromPercent,
  pillarStrength,
  parseCompareIds,
  slotHue,
  themeCoverage,
} from './compare';
import type { World } from '../schemas/world';
import { kinPublished } from './kin-worlds';
import { chapters } from './worlds';

function axisStub(value: number): World['axes'] {
  const comment = { en: 'c', cs: 'c' };
  return {
    hopeDespair: { value, comment },
    knownUnknown: { value, comment },
    intimateEpic: { value, comment },
    moralClarityAmbiguity: { value, comment },
    realismMetaphysical: { value, comment },
  };
}

const field = (en: string, sub?: string) =>
  (sub ? { en, sub: { en: sub } } : { en }) as World['metadata']['genreProfile'];

const minimal = (
  id: string,
  themes: string[],
  axis: number,
  hope = axis,
  extras: Partial<World> = {},
): World =>
  ({
    id,
    number: 1,
    chapterId: 'fantasy',
    gameTitle: { en: id },
    chronicleTitle: { en: id },
    subtitlePoetic: { en: id },
    studios: [],
    yearRange: '',
    canonScope: { en: 'x' },
    core: { en: 'x' },
    metadata: {
      genreProfile: field('High fantasy'),
      atmosphere: field('Fascination'),
      spatialScope: field('Region'),
      historicalDepth: field('Mythic'),
      societalOrder: field('Nations'),
      sourceOfPower: field('Magic'),
      protagonistPerspective: field('Champion'),
      keyActors: field('x'),
    },
    themes,
    axes: {
      ...axisStub(axis),
      hopeDespair: { value: hope, comment: { en: 'c', cs: 'c' } },
    },
    triad: {
      originalSin: { en: 'x' },
      centralDilemma: { en: 'x' },
      ultimateMystery: { en: 'x' },
    },
    chronicleSlug: id,
    ...extras,
  }) as World;

type Kin = NonNullable<World['kin']>;
const kin = (over: Partial<Kin> = {}): Kin => ({
  sin: 's1',
  dilemma: 'd1',
  mystery: 'm1',
  tools: [],
  memory: null,
  myth: false,
  ...over,
});
/** Dva světy lišící se ve všem kromě toho, co test nastaví (jiný archetyp, žádná společná pole). */
const apart = (id: string, extras: Partial<World> = {}): World =>
  minimal(id, [], 1, 1, {
    chapterId: `ch-${id}`,
    metadata: {
      genreProfile: field(`g-${id}`),
      atmosphere: field(`m-${id}`),
      spatialScope: field(`sp-${id}`),
      historicalDepth: field(`h-${id}`),
      societalOrder: field(`so-${id}`),
      sourceOfPower: field(`p-${id}`),
      protagonistPerspective: field(`pp-${id}`),
      keyActors: field('x'),
    },
    ...extras,
  });

describe('affinityBreakdown: šest pilířů', () => {
  it('váhy pilířů dávají dohromady 100 (podoba 62, povaha 38)', () => {
    expect(PILLARS.reduce((sum, p) => sum + p.max, 0)).toBe(100);
    expect(PILLARS.filter((p) => p.half === 'look').reduce((sum, p) => sum + p.max, 0)).toBe(HALF_MAX.look);
    expect(PILLARS.filter((p) => p.half === 'nature').reduce((sum, p) => sum + p.max, 0)).toBe(HALF_MAX.nature);
  });

  it('archetyp: stejný archetyp 6, stejný profil 4, příbuzný profil 2', () => {
    const a = minimal('a', [], 3, 3, {
      metadata: { ...minimal('a', [], 3).metadata, genreProfile: field('High fantasy', 'overlap: dark fantasy') },
    });
    const same = minimal('b', [], 3);
    const near = minimal('c', [], 3, 3, { metadata: { ...minimal('c', [], 3).metadata, genreProfile: field('Dark fantasy') } });
    const other = minimal('d', [], 3, 3, { metadata: { ...minimal('d', [], 3).metadata, genreProfile: field('Science fantasy') } });
    expect(affinityBreakdown(a, same).archetype).toBe(10);
    expect(affinityBreakdown(a, near).archetype).toBe(8);
    expect(affinityBreakdown(a, other).archetype).toBe(6);
    expect(affinityBreakdown(a, { ...other, chapterId: 'horror' } as World).archetype).toBe(0);
  });

  it('archetyp: přesah do druhého archetypu dá 4 (hlavní × přesah) nebo 2 (jen přesahy), nikdy víc než hlavní', () => {
    const profile = (id: string, name: string) => ({ ...minimal(id, [], 3).metadata, genreProfile: field(name) });
    const scifi = minimal('s', [], 3, 3, { chapterId: 'science-fiction', metadata: profile('s', 'Space opera') });
    const dystopia = minimal('d', [], 3, 3, {
      chapterId: 'dystopia',
      secondaryChapterId: 'science-fiction',
      metadata: profile('d', 'Cyberpunk'),
    });
    const horror = minimal('h', [], 3, 3, {
      chapterId: 'horror',
      secondaryChapterId: 'science-fiction',
      metadata: profile('h', 'Sci-fi horror'),
    });
    const plain = minimal('p', [], 3, 3, { chapterId: 'historical', metadata: profile('p', 'Historical realism') });
    expect(affinityBreakdown(scifi, dystopia).archetype).toBe(4);
    expect(affinityBreakdown(dystopia, scifi).archetype).toBe(4);
    expect(kinshipEvidence(scifi, dystopia).archetype).toEqual({ chapter: 'cross', shared: 'science-fiction', profile: null });
    expect(affinityBreakdown(dystopia, horror).archetype).toBe(2);
    expect(kinshipEvidence(dystopia, horror).archetype.chapter).toBe('overlap');
    expect(affinityBreakdown(dystopia, plain).archetype).toBe(0);
    /* společný hlavní archetyp má přednost a přesah k němu nic nepřidá */
    const twin = { ...dystopia, id: 'd2', metadata: profile('d2', 'Political dystopia') } as World;
    expect(affinityBreakdown(dystopia, twin).archetype).toBe(6);
  });

  it('souřadnice: 5 / 3,5 / 1,5 / 0 za rozdíl 0, 1, 2 a víc', () => {
    const base = minimal('a', [], 3);
    expect(affinityBreakdown(base, minimal('b', [], 3)).axes).toBe(25);
    expect(affinityBreakdown(base, minimal('c', [], 4)).axes).toBe(17.5);
    expect(affinityBreakdown(base, minimal('d', [], 5)).axes).toBe(7.5);
    expect(affinityBreakdown(minimal('hi', [], 5), minimal('lo', [], 1)).axes).toBe(0);
  });

  it('nálada se počítá jako dvojice hlavní + vedlejší, 4 body za každou společnou', () => {
    const mood = (id: string, main: string, sub?: string) =>
      apart(id, { metadata: { ...apart(id).metadata, atmosphere: field(main, sub ? `secondary: ${sub}` : undefined) } });
    const a = mood('a', 'Melancholy', 'Hope');
    expect(affinityBreakdown(a, mood('b', 'Hope', 'Melancholy')).character).toBe(8);
    expect(affinityBreakdown(a, mood('c', 'Melancholy', 'Fear')).character).toBe(4);
    expect(affinityBreakdown(a, mood('d', 'Wonder', 'Melancholy')).character).toBe(4);
    expect(affinityBreakdown(a, mood('e', 'Wonder', 'Fear')).character).toBe(0);
  });

  it('charakter: moc 5, společnost 4, dosah 4, perspektiva 2 a paměť světa 4', () => {
    const a = apart('a', { kin: kin({ memory: 10_000, myth: true }) });
    const withField = (key: keyof World['metadata']) =>
      apart('b', { metadata: { ...apart('b').metadata, [key]: a.metadata[key] } as World['metadata'] });
    expect(affinityBreakdown(a, withField('sourceOfPower')).character).toBe(5);
    expect(affinityBreakdown(a, withField('societalOrder')).character).toBe(4);
    expect(affinityBreakdown(a, withField('spatialScope')).character).toBe(4);
    expect(affinityBreakdown(a, withField('protagonistPerspective')).character).toBe(2);
    expect(affinityBreakdown(a, withField('historicalDepth')).character).toBe(2);
    // délka paměti ve stejném řádu (do desetinásobku) 1 bod, mýtický čas u obou 1 bod
    expect(affinityBreakdown(a, apart('c', { kin: kin({ memory: 60_000 }) })).character).toBe(1);
    expect(affinityBreakdown(a, apart('d', { kin: kin({ memory: 500_000 }) })).character).toBe(0);
    expect(affinityBreakdown(a, apart('e', { kin: kin({ memory: 500_000, myth: true }) })).character).toBe(1);
    const all = minimal('x', [], 1, 1, { kin: kin({ memory: 10_000, myth: true }) });
    const twin = minimal('y', [], 1, 1, {
      metadata: { ...minimal('y', [], 1).metadata, atmosphere: field('Fascination', 'secondary: Hope') },
      kin: kin({ memory: 10_000, myth: true }),
    });
    const full = minimal('z', [], 1, 1, {
      metadata: { ...minimal('z', [], 1).metadata, atmosphere: field('Fascination', 'secondary: Hope') },
      kin: kin({ memory: 10_000, myth: true }),
    });
    expect(affinityBreakdown(all, twin).character).toBe(23); // jen jedna společná nálada
    expect(affinityBreakdown(twin, full).character).toBe(27);
  });

  it('témata: 9 / 16 / 22 za jedno, dvě, tři a víc společných', () => {
    const a = minimal('a', ['faith', 'war', 'power', 'gods'], 3);
    expect(affinityBreakdown(a, minimal('b', [], 3)).themes).toBe(0);
    expect(affinityBreakdown(a, minimal('b', ['faith'], 3)).themes).toBe(9);
    expect(affinityBreakdown(a, minimal('c', ['faith', 'war'], 3)).themes).toBe(16);
    expect(affinityBreakdown(a, minimal('d', ['faith', 'war', 'power'], 3)).themes).toBe(22);
    expect(affinityBreakdown(a, minimal('e', ['faith', 'war', 'power', 'gods'], 3)).themes).toBe(22);
  });

  it('triáda: hřích 4 (hraniční „také“ 2), dilema 4, druh tajemství 2', () => {
    const a = apart('a', { kin: kin({ sin: 's1', sinAlso: 's9', dilemma: 'd1', mystery: 'm1' }) });
    const t = (over: Partial<Kin>) => affinityBreakdown(a, apart('b', { kin: kin({ sin: 's2', dilemma: 'd2', mystery: 'm2', ...over }) })).triad;
    expect(t({})).toBe(0);
    expect(t({ sin: 's1' })).toBe(4);
    expect(t({ sin: 's9' })).toBe(2);
    expect(t({ sin: 's3', sinAlso: 's1' })).toBe(2);
    expect(t({ dilemma: 'd1' })).toBe(4);
    expect(t({ mystery: 'm1' })).toBe(2);
    expect(t({ sin: 's1', dilemma: 'd1', mystery: 'm1' })).toBe(10);
  });

  it('svět bez údajů `kin` za triádu a vyprávění nedostane nic', () => {
    const score = affinityBreakdown(apart('a'), apart('b'));
    expect(score.triad).toBe(0);
    expect(score.narration).toBe(0);
  });

  it('vyprávění: jeden společný způsob 3, dva 6, k tomu 2 za společný kruh Zákulisí nebo Hráč', () => {
    const tools = (...list: Array<[string, string, string?]>) => kin({ tools: list.map(([t, ring, also]) => ({ t, ring, ...(also ? { also } : {}) })) });
    const a = apart('a', { kin: tools(['pamet-hry', 'zakulisi'], ['hudba', 'obraz-a-zvuk'], ['prunik', 'hrac']) });
    const n = (k: Kin) => affinityBreakdown(a, apart('b', { kin: k })).narration;
    expect(n(tools(['vrstvy', 'prostor-a-stopy']))).toBe(0);
    /* jediný společný způsob je jen částečná shoda (polovina bodů) */
    expect(n(tools(['hudba', 'obraz-a-zvuk']))).toBe(3);
    expect(pillarStrength(3, 6)).toBe('Partial');
    expect(n(tools(['hudba', 'obraz-a-zvuk'], ['pamet-hry', 'zakulisi']))).toBe(6);
    // jiný způsob ve stejném vzácném kruhu
    expect(n(tools(['rozhrani', 'zakulisi']))).toBe(2);
    expect(n(tools(['rozhrani', 'zakulisi'], ['cizi-hraci', 'hrac']))).toBe(4);
    // druhý kruh nástroje („také“) se počítá, běžné kruhy ne
    expect(n(tools(['zapisky', 'prostor-a-stopy', 'hrac']))).toBe(2);
    expect(n(tools(['jiny-zvuk', 'obraz-a-zvuk']))).toBe(0);
    // společný způsob + další vzácný kruh, strop 6
    expect(n(tools(['hudba', 'obraz-a-zvuk'], ['rozhrani', 'zakulisi'], ['cizi-hraci', 'hrac']))).toBe(6);
    // kruh pokrytý společným způsobem se nepočítá podruhé
    expect(n(tools(['pamet-hry', 'zakulisi']))).toBe(3);
    // společný způsob a k němu jeden vzácný kruh
    expect(n(tools(['hudba', 'obraz-a-zvuk'], ['rozhrani', 'zakulisi']))).toBe(5);
  });

  it('index je součet šesti pilířů, podoba a povaha jeho dvě části', () => {
    const a = minimal('a', ['faith'], 3, 3, { kin: kin({ tools: [{ t: 'x', ring: 'slovo' }] }) });
    const b = minimal('b', ['faith'], 4, 5, { kin: kin({ tools: [{ t: 'x', ring: 'slovo' }] }) });
    const score = affinityBreakdown(a, b);
    expect(score.look).toBe(score.archetype + score.axes + score.character);
    expect(score.nature).toBe(score.themes + score.triad + score.narration);
    expect(score.percent).toBe(score.look + score.nature);
    expect(affinityPercent(a, b)).toBe(score.percent);
    const twin = affinityBreakdown(a, { ...a, id: 'c' } as World);
    expect(twin.percent).toBeLessThanOrEqual(100);
  });

  it('důkazy říkají, co světy sdílejí', () => {
    const a = minimal('a', ['faith', 'war'], 3, 3, { kin: kin({ myth: true, tools: [{ t: 'hudba', ring: 'obraz-a-zvuk' }] }) });
    const b = minimal('b', ['war', 'gods'], 3, 4, { kin: kin({ myth: true, dilemma: 'd2', tools: [{ t: 'hudba', ring: 'obraz-a-zvuk' }] }) });
    const ev = kinshipEvidence(a, b);
    expect(ev.archetype).toEqual({ chapter: 'same', shared: 'fantasy', profile: 'same' });
    expect(ev.axes.same).toHaveLength(4);
    expect(ev.axes.near).toEqual(['hopeDespair']);
    expect(ev.themes).toEqual(['war']);
    expect(ev.triad).toEqual({ sin: 'same', dilemma: false, mystery: true });
    expect(ev.narration).toEqual({ techniques: ['hudba'], rings: [] });
    expect(ev.character.myth).toBe(true);
    expect(ev.character.moods).toEqual(['main']);
  });
});

/* Skutečná data: výpočet musí sedět na světech doplněných o `kin` (kin-worlds.ts). */
describe('příbuznost nad daty atlasu', () => {
  const W = (id: string) => kinPublished.find((w) => w.id === id)!;

  it('každý publikovaný svět má údaje pro triádu, vyprávění a paměť', () => {
    const missing = kinPublished.filter((w) => !w.kin || w.kin.tools.length === 0).map((w) => w.id);
    expect(missing).toEqual([]);
  });

  it('přesah do druhého archetypu je platný archetyp a liší se od hlavního', () => {
    const ids = new Set(chapters.map((c) => c.id));
    const bad = kinPublished
      .filter((w) => w.secondaryChapterId && (!ids.has(w.secondaryChapterId) || w.secondaryChapterId === w.chapterId))
      .map((w) => w.id);
    expect(bad).toEqual([]);
  });

  it('Mass Effect × Cyberpunk 2077: sci-fi je u jednoho hlavní archetyp, u druhého přesah', () => {
    const ev = kinshipEvidence(W('mass-effect'), W('cyberpunk-2077'));
    expect(ev.archetype.chapter).toBe('cross');
    expect(ev.archetype.shared).toBe('science-fiction');
    expect(affinityBreakdown(W('mass-effect'), W('cyberpunk-2077')).archetype).toBe(4);
  });

  it('Dark Souls × Outer Wilds: vypadají jinak, ale stojí na stejných základech', () => {
    const score = affinityBreakdown(W('dark-souls'), W('outer-wilds'));
    expect(score.archetype).toBe(0);
    expect(score.themes).toBe(22);
    expect(score.triad).toBe(8);
    expect(score.narration).toBe(6);
    expect(kinshipLevel(W('dark-souls'), W('outer-wilds'), kinPublished)).toBe(4);
    const halves = kinshipHalves(W('dark-souls'), W('outer-wilds'), kinPublished);
    expect(halves.nature).toBe(5);
    expect(halves.look).toBeLessThanOrEqual(3);
  });

  it('Dark Souls × Elden Ring zůstávají Sourozenci', () => {
    expect(kinshipLevel(W('dark-souls'), W('elden-ring'), kinPublished)).toBe(5);
  });

  it('Undertale × Inscryption: žádný společný způsob, ale společné kruhy Zákulisí a Hráč', () => {
    const ev = kinshipEvidence(W('undertale'), W('inscryption'));
    expect(ev.narration.techniques).toEqual([]);
    expect(ev.narration.rings.length).toBeGreaterThan(0);
  });

  it('stupně mají pevné hranice: přidání světů stupeň dvojice nezmění', () => {
    const a = W('dark-souls');
    const b = W('elden-ring');
    const c = W('death-stranding');
    const d = W('tides-of-numenera');
    /* stejný výsledek nad celým atlasem, nad dvojicí samotnou i nad atlasem plným kopií jednoho světa */
    const clones = Array.from({ length: 30 }, (_, i) => ({ ...a, id: `klon-${i}` })) as World[];
    for (const pool of [kinPublished, [a, b], [...kinPublished, ...clones]]) {
      expect(kinshipLevel(a, b, pool)).toBe(5);
      expect(kinshipLevel(c, d, pool)).toBe(4);
      expect(kinshipHalves(c, d, pool)).toEqual(kinshipHalves(c, d, kinPublished));
    }
    expect(kinshipCutoffs(kinPublished)).toEqual([...KINSHIP_CUTOFFS.percent]);
  });

  it('pojistka: Sourozenci mají aspoň čtyři pilíře s výraznou nebo silnou shodou', () => {
    /* Death Stranding × Tides of Numenera: bodů na Sourozence dost, ale nesou je jen dva pilíře */
    const c = W('death-stranding');
    const d = W('tides-of-numenera');
    expect(affinityPercent(c, d)).toBeGreaterThanOrEqual(KINSHIP_CUTOFFS.percent[0]);
    expect(strongPillarCount(c, d)).toBeLessThan(SIBLING_MIN_STRONG_PILLARS);
    expect(kinshipLevel(c, d)).toBe(4);
    expect(kinshipLevel(W('cyberpunk-2077'), W('deus-ex'))).toBe(5);
    /* totéž uvnitř trojice: podoba nesená jediným silným vláknem není „podobou sourozenci“ */
    expect(strongPillarCount(c, d, 'look')).toBe(1);
    expect(kinshipHalves(c, d).look).toBe(4);
    for (let i = 0; i < kinPublished.length; i += 1)
      for (let j = i + 1; j < kinPublished.length; j += 1)
        if (kinshipLevel(kinPublished[i], kinPublished[j]) === 5)
          expect(strongPillarCount(kinPublished[i], kinPublished[j])).toBeGreaterThanOrEqual(SIBLING_MIN_STRONG_PILLARS);
  });

  it('kalibrace hranic: stupně zůstávají rozumně obsazené (po změně koeficientů přeměřit)', () => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < kinPublished.length; i += 1)
      for (let j = i + 1; j < kinPublished.length; j += 1) counts[kinshipLevel(kinPublished[i], kinPublished[j])] += 1;
    const total = counts.reduce((x, y) => x + y, 0);
    const share = (level: number) => counts[level] / total;
    expect(share(5)).toBeGreaterThan(0.01);
    expect(share(5)).toBeLessThan(0.05);
    expect(share(5) + share(4)).toBeLessThan(0.18);
    expect(share(3)).toBeGreaterThan(0.12);
    expect(share(1)).toBeGreaterThan(0.25);
    expect(share(1)).toBeLessThan(0.5);
  });
});

describe('compare kinship', () => {
  it('uses affinity percent for two worlds', () => {
    const a = minimal('a', ['faith'], 3);
    const b = minimal('b', ['faith'], 3);
    expect(kinshipPercent([a, b])).toBe(affinityPercent(a, b));
  });

  it('names the axis with the largest spread', () => {
    const low = minimal('low', [], 3, 1);
    const high = minimal('high', [], 3, 5);
    expect(farthestAxis([low, high])?.key).toBe('hopeDespair');
    expect(farthestAxis([low, high])?.spread).toBe(4);
  });

  it('keeps slot colors in gold / teal / amethyst order', () => {
    expect(slotHue(0)).toBe('#1A9389');
    expect(slotHue(1)).toBe('#B74A9D');
    expect(slotHue(2)).toBe('#5F9205');
  });
});

describe('themeCoverage', () => {
  it('keeps 2-of-3 themes in the shared set for BG + Dark Souls + Diablo', () => {
    const bg = minimal('baldurs-gate', [
      'free-will-and-fate',
      'identity-and-existence',
      'power-and-dominion',
    ], 3);
    const ds = minimal('dark-souls', ['uncovering-the-past', 'faith', 'power-and-dominion'], 4);
    const diablo = minimal('diablo', ['war', 'free-will-and-fate', 'faith'], 4);
    const coverage = themeCoverage([bg, ds, diablo]);
    const bySlug = Object.fromEntries(coverage.map((item) => [item.slug, item.owners]));

    expect(bySlug['power-and-dominion']).toEqual([0, 1]);
    expect(bySlug['free-will-and-fate']).toEqual([0, 2]);
    expect(bySlug['faith']).toEqual([1, 2]);
    expect(coverage.filter((item) => item.owners.length >= 2).map((item) => item.slug).sort()).toEqual(
      ['faith', 'free-will-and-fate', 'power-and-dominion'],
    );
    expect(coverage.filter((item) => item.owners.length === 1).map((item) => item.slug).sort()).toEqual(
      ['identity-and-existence', 'uncovering-the-past', 'war'],
    );
    expect(coverage.some((item) => item.owners.length === 3)).toBe(false);
  });
});

describe('kinshipPairs', () => {
  it('lists every pair and sorts by percent descending', () => {
    const a = minimal('a', ['faith', 'war', 'power'], 3);
    const b = minimal('b', ['faith', 'war', 'power'], 3);
    const c = minimal('c', [], 5, 5, { chapterId: 'horror' });
    const pairs = kinshipPairs([a, b, c]);
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toMatchObject({ left: 0, right: 1, percent: affinityPercent(a, b) });
    const percents = pairs.map((pair) => pair.percent);
    expect(percents).toEqual([...percents].sort((left, right) => right - left));
  });
});

describe('parseCompareIds', () => {
  const valid = new Set(['baldurs-gate', 'dark-souls', 'diablo']);

  it('reads worlds and w query aliases', () => {
    expect(parseCompareIds('?worlds=baldurs-gate,dark-souls,diablo', valid)).toEqual([
      'baldurs-gate',
      'dark-souls',
      'diablo',
    ]);
    expect(parseCompareIds('?w=baldurs-gate,diablo', valid)).toEqual(['baldurs-gate', 'diablo']);
    expect(parseCompareIds('?worlds=baldurs-gate,dark-souls&w=diablo', valid)).toEqual([
      'baldurs-gate',
      'dark-souls',
    ]);
  });
});

describe('kinshipRanking', () => {
  it('orders other worlds by affinity and skips the source and drafts', () => {
    const source = minimal('a', ['x', 'y', 'z'], 3);
    const close = minimal('b', ['x', 'y', 'z'], 3);
    const far = minimal('c', [], 1, 5);
    const draft = { ...minimal('d', ['x', 'y', 'z'], 3), draft: true } as World;
    const ranked = kinshipRanking(source, [source, far, close, draft], 3);
    expect(ranked.map((r) => r.world.id)).toEqual(['b', 'c']);
    expect(ranked[0].percent).toBe(affinityPercent(source, close));
  });
});

describe('kinship levels', () => {
  it('maps percent to five levels by cutoffs', () => {
    const cut = [66, 51, 38, 29];
    expect(levelFromPercent(70, cut)).toBe(5);
    expect(levelFromPercent(51, cut)).toBe(4);
    expect(levelFromPercent(40, cut)).toBe(3);
    expect(levelFromPercent(30, cut)).toBe(2);
    expect(levelFromPercent(10, cut)).toBe(1);
  });

  it('does not lift curated pairs: the grade comes from the index alone', () => {
    const a = { ...minimal('a', [], 1, 1), relatedWorlds: [{ id: 'b', title: { en: 'b' }, note: { en: 'n' } }] } as World;
    const plain = minimal('a', [], 1, 1);
    const b = minimal('b', ['x'], 5, 5);
    const fillers = ['c', 'd', 'e', 'f', 'g'].map((id) => minimal(id, ['x'], 5, 5));
    expect(kinshipLevel(a, b, [a, b, ...fillers])).toBe(kinshipLevel(plain, b, [plain, b, ...fillers]));
  });

  it('describes pillar strength in words', () => {
    expect(pillarStrength(22, 22)).toBe('Strong');
    expect(pillarStrength(16, 22)).toBe('Marked');
    expect(pillarStrength(9, 22)).toBe('Partial');
    expect(pillarStrength(2, 10)).toBe('Faint');
    expect(pillarStrength(0, 10)).toBe('None');
  });
});
