import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocale } from '../../lib/locale-store';
import { t, uiCount, uiT, worldsCountLabel, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString, World } from '../../schemas/world';
import { dayNumber, featuredWorldIndex } from '../../lib/calendar';
import { TRAILS, dailyTrails, trailSlug } from '../../lib/trails';
import { latestAdded, mostRecentAdded } from '../../lib/atlas-news';
import AxisBars from './AxisBars';
import DailyMystery from './DailyMystery';
import ReaderDesk from './ReaderDesk';
import WorldCompass from './WorldCompass';

export type ChapterCardData = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: { light: string; dark: string };
  count: number;
};

export type JourneyInfo = {
  id: string;
  tagline?: string;
  minutes?: number;
  quote?: string;
  quoteSource?: string;
};

type Props = {
  chapters: ChapterCardData[];
  worlds: World[];
  journeys?: JourneyInfo[];
  base: string;
};


/** Krátký název souhvězdí na obloze (i18n klíč podle archetypu). */
const SKY_NAME: Record<string, string> = {
  fantasy: 'home2.skyFantasy',
  'science-fiction': 'home2.skyScienceFiction',
  'post-apocalypse': 'home2.skyPostApocalypse',
  horror: 'home2.skyHorror',
  historical: 'home2.skyHistorical',
  dystopia: 'home2.skyDystopia',
  metaphysical: 'home2.skyMetaphysical',
};

/**
 * Trvale popsané hvězdy: světy, které čtenář pozná nejspíš (velká souhvězdí tři, malá dvě).
 * Ostatní jména se ukážou po najetí na hvězdu nebo na název souhvězdí.
 */
const ICONIC: Record<string, string[]> = {
  fantasy: ['the-witcher', 'dark-souls', 'elder-scrolls'],
  'science-fiction': ['mass-effect', 'halo', 'starcraft'],
  'post-apocalypse': ['fallout', 'metro'],
  horror: ['silent-hill', 'resident-evil'],
  historical: ['disco-elysium', 'assassins-creed'],
  dystopia: ['cyberpunk-2077', 'bioshock'],
  metaphysical: ['outer-wilds', 'control'],
};

/**
 * Souhvězdí mají tvar, který k archetypu patří (jako figury ve starých hvězdných atlasech).
 * Body tvaru jsou v pořadí, v jakém se souhvězdí dokresluje: k-tý svět archetypu (podle čísla)
 * dostane k-tý bod. Hrana se kreslí, až když jsou obě hvězdy na obloze (a je-li uveden min,
 * teprve od tolika světů), takže souhvězdí roste spolu s atlasem a v každé fázi drží pohromadě.
 * Souřadnice jsou v jednotkách oblohy (šířka 1000) od počátku souhvězdí.
 */
type Shape = {
  points: Array<[number, number]>;
  edges: Array<[number, number, number?]>;
  /** Body pro trvale popsané (známé) světy: dost daleko od sebe, aby se jména nepřekrývala. */
  named: number[];
};

const SHAPES: Record<string, Shape> = {
  // Hrad se třemi věžemi; brána přibude, až bude světů víc.
  fantasy: {
    points: [[10, 150], [10, 45], [55, 45], [55, 95], [110, 95], [110, 10], [170, 10], [170, 95], [225, 95], [225, 45], [270, 45], [270, 150], [120, 150], [140, 118], [160, 150]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 0, 12], [11, 12], [12, 13], [13, 14]],
    named: [1, 6, 11],
  },
  // Raketa: špička, trup, stabilizátory a okénko.
  'science-fiction': {
    points: [[110, 0], [70, 50], [150, 50], [70, 110], [150, 110], [25, 145], [195, 145], [110, 74]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [3, 5], [4, 6]],
    named: [0, 5, 6],
  },
  // Hřib výbuchu nad krajinou.
  'post-apocalypse': {
    points: [[120, 0], [30, 45], [210, 45], [120, 70], [120, 148], [60, 148], [180, 148]],
    edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6]],
    named: [0, 4],
  },
  // Srpek měsíce.
  horror: {
    points: [[115, 0], [20, 62], [115, 125], [68, 62]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
    named: [0, 1],
  },
  // Oko, které hlídá; zornice bez spojnic.
  dystopia: {
    points: [[10, 45], [115, 0], [220, 45], [115, 92], [115, 46]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0]],
    named: [0, 2],
  },
  // Přesýpací hodiny; tři světy se zatím spojí jen napřímo.
  historical: {
    points: [[20, 0], [150, 0], [85, 65], [20, 130], [150, 130]],
    edges: [[0, 1], [1, 2], [0, 2, 5], [2, 3], [3, 4], [2, 4]],
    named: [0, 2],
  },
  // Nekonečno: smyčka, která se vrací.
  metaphysical: {
    points: [[115, 50], [58, 8], [0, 50], [58, 92], [172, 8], [230, 50], [172, 92]],
    edges: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 5], [5, 6], [6, 0]],
    named: [2, 5],
  },
};

/** Dvě hvězdy se „srazí“, když by se jejich jména pod nimi překrývala. */
function clash(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < 78 && Math.abs(a[1] - b[1]) < 30;
}

/**
 * Rozdělí hvězdy souhvězdí do stálých skupinek, které se na obloze střídají. První skupinka
 * jsou známé světy (first); další berou zbylé hvězdy tak, aby se jména ve skupince nepřekrývala
 * ani s trvale popsanými (always, nově zmapované světy). Vrací index skupinky pro každou hvězdu
 * (-1 = trvale popsaná).
 */
function rotationSets(coords: Array<[number, number]>, first: number[], always: number[], size: number): number[] {
  const count = coords.length;
  const setOf = new Array<number>(count).fill(-2);
  always.forEach((k) => {
    setOf[k] = -1;
  });
  const free = (k: number, group: number[]) =>
    group.every((g) => !clash(coords[g], coords[k])) && always.every((a) => !clash(coords[a], coords[k]));
  const firstGroup: number[] = [];
  first.forEach((k) => {
    if (setOf[k] === -2 && free(k, firstGroup)) firstGroup.push(k);
  });
  firstGroup.forEach((k) => {
    setOf[k] = 0;
  });
  // Zbylé pozice v rozházeném pořadí, aby po sobě nesvítily vždy stejné části tvaru.
  let rest = Array.from({ length: count }, (_, k) => k)
    .filter((k) => setOf[k] === -2)
    .sort((a, b) => ((a * 5) % count) - ((b * 5) % count));
  let index = firstGroup.length ? 1 : 0;
  while (rest.length) {
    const group: number[] = [];
    for (const k of rest) {
      if (group.length >= Math.max(1, size)) break;
      if (free(k, group)) group.push(k);
    }
    if (!group.length) group.push(rest[0]);
    group.forEach((k) => {
      setOf[k] = index;
    });
    rest = rest.filter((k) => !group.includes(k));
    index += 1;
  }
  return setOf;
}

/** Jak často se na obloze vymění popsané světy (ms). */
const ROTATE_MS = 5000;

/*
 * Obloha v souřadnicích 1000 × H. Souhvězdí mají pevné počátky (horní a dolní pás).
 * Jména popsaných hvězd stojí pod hvězdou, stejně jako při rozsvíceném souhvězdí.
 */
const ORIGINS: Array<[number, number]> = [
  [20, 50],
  [340, 50],
  [660, 50],
  [15, 290],
  [215, 290],
  [480, 290],
  [740, 290],
];

type Star = { id: string; title: string; set: number; x: number; y: number; size: number; chapterId: string; isNew: boolean };
type Line = { x1: number; y1: number; x2: number; y2: number; chapterId: string };
type Group = { chapterId: string; x: number; y: number; count: number; sets: number; order: number };

function buildSky(worlds: World[], chapters: ChapterCardData[], newIds: Set<string>) {
  const stars: Star[] = [];
  const lines: Line[] = [];
  const groups: Group[] = [];
  let maxY = 0;
  const line = (a: [number, number], b: [number, number], chapterId: string) => {
    lines.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], chapterId });
  };
  chapters.forEach((chapter, gi) => {
    const [ox, oy] = ORIGINS[gi] ?? [20 + (gi % 3) * 330, 50 + Math.floor(gi / 3) * 240];
    const items = worlds.filter((w) => w.chapterId === chapter.id).sort((a, b) => a.number - b.number);
    if (!items.length) return;
    const shape = SHAPES[chapter.id] ?? { points: [], edges: [], named: [] };
    const n = items.length;
    // Body tvaru; kdyby světů bylo víc než bodů, další hvězdy pokračují řadou pod tvarem.
    const height = Math.max(0, ...shape.points.map((pt) => pt[1]));
    const coords: Array<[number, number]> = items.map((_, k) => {
      const pt = shape.points[k];
      if (pt) return [ox + pt[0], oy + pt[1]];
      const j = k - shape.points.length;
      return [ox + 10 + j * 80, oy + height + 44];
    });
    // Známé světy na body určené pro jména, ostatní podle čísla do zbylých bodů.
    const wanted = (ICONIC[chapter.id] ?? [])
      .map((id) => items.find((w) => w.id === id))
      .filter((w): w is World => Boolean(w));
    const slots = shape.named.filter((k) => k < n).slice(0, wanted.length);
    const iconic = wanted.slice(0, slots.length);
    const rest = items.filter((w) => !iconic.includes(w));
    const placed: World[] = [];
    for (let k = 0, r = 0; k < n; k += 1) {
      const slotIndex = slots.indexOf(k);
      placed.push(slotIndex >= 0 ? iconic[slotIndex] : rest[r++]);
    }
    const always = placed.map((w, k) => (newIds.has(w.id) ? k : -1)).filter((k) => k >= 0);
    const setOf = rotationSets(coords, slots, always, wanted.length || 2);
    groups.push({ chapterId: chapter.id, x: ox, y: oy - 44, count: n, sets: Math.max(1, ...setOf.map((v) => v + 1)), order: gi });
    placed.forEach((w, k) => {
      const seed = gi * 13 + k * 7;
      const [x, y] = coords[k];
      stars.push({ id: w.id, title: w.gameTitle.cs ?? w.gameTitle.en, set: setOf[k], x, y, size: [5, 6, 7, 8][(seed * 17) % 4], chapterId: chapter.id, isNew: newIds.has(w.id) });
      maxY = Math.max(maxY, y);
    });
    shape.edges.forEach(([a, b, min]) => {
      if (a < n && b < n && n >= (min ?? 0)) line(coords[a], coords[b], chapter.id);
    });
    for (let k = Math.max(1, shape.points.length); k < n; k += 1) line(coords[k - 1], coords[k], chapter.id);
  });
  return { stars, lines, groups, height: Math.max(430, Math.ceil(maxY + 40)) };
}

function hueVars(accent?: { light: string; dark: string }): CSSProperties | undefined {
  return accent ? ({ '--hue-l': accent.light, '--hue-d': accent.dark } as CSSProperties) : undefined;
}


export default function HomeIntro({ chapters, worlds = [], journeys = [], base }: Props) {
  const locale = useLocale();
  const [today, setToday] = useState<Date | null>(null);
  const [litGroup, setLitGroup] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  // Putování, jehož trasa je právě nakreslená přes oblohu (najetí na jeho název pod oblohou).
  const [route, setRoute] = useState<string | null>(null);

  // Popsané světy se po skupinkách střídají pořád; stojí jen při rozsvíceném souhvězdí (kurzor na
  // názvu archetypu), na kartě v pozadí a u čtenáře, který nechce pohyb. Na úzkém a dotykovém
  // displeji jména nejsou, takže se nestřídá.
  useEffect(() => {
    if (litGroup || route) return undefined;
    const still = window.matchMedia('(prefers-reduced-motion: reduce), (hover: none), (max-width: 760px)');
    if (still.matches) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setPhase((value) => value + 1);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [litGroup, route]);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const chapterById = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, index: i }])), [chapters]);
  // Dva naposledy zmapované světy na obloze pulzují a na počítači mají trvale jméno se štítkem.
  const newIds = useMemo(() => new Set(latestAdded(worlds, 2).map((w) => w.id)), [worlds]);
  const sky = useMemo(() => buildSky(worlds, chapters, newIds), [worlds, chapters, newIds]);
  const groupSets = useMemo(() => Object.fromEntries(sky.groups.map((g) => [g.chapterId, g])), [sky]);
  const latest = mostRecentAdded(worlds);
  const featured = today && worlds.length > 0 ? worlds[featuredWorldIndex(worlds.length, today)] : undefined;
  const featuredChapter = featured ? chapterById[featured.chapterId] : undefined;

  const openRandom = () => {
    if (worlds.length === 0) return;
    const pick = worlds[Math.floor(Math.random() * worlds.length)];
    window.location.href = withBase(base, `/worlds/${pick.id}/`);
  };

  const [titleA, titleEm, titleB] = uiT('home2.title', locale).split('|');
  // Stezky dne: před hydratací první trojice, pak trojice podle dne (stejně jako Svět dne).
  const byId = new Map(worlds.map((w) => [w.id, w]));
  const journeyInfo = new Map(journeys.map((j) => [j.id, j]));
  const trails = (today ? dailyTrails(dayNumber(today)) : TRAILS.slice(0, 3)).map((trail) => ({
    trail,
    info: journeyInfo.get(trail.id),
    members: trail.members.map((id) => byId.get(id)).filter((w): w is (typeof worlds)[number] => Boolean(w)),
  }));
  // Trasa putování přes oblohu: hvězdy jeho světů v pořadí, v jakém je putování prochází.
  const shownRoute = route ?? trails[0]?.trail.id ?? null;
  const routeTrail = TRAILS.find((tr) => tr.id === shownRoute);
  const routeStars = routeTrail
    ? routeTrail.members.map((id) => sky.stars.find((st) => st.id === id)).filter((st): st is (typeof sky.stars)[number] => Boolean(st))
    : [];
  const routeIds = new Set(route ? routeStars.map((st) => st.id) : []);
  const [featuredTrail, ...otherTrails] = trails;
  const tagline = (info?: JourneyInfo, descKey?: string) =>
    locale === 'cs' && info?.tagline ? info.tagline : descKey ? uiT(descKey, locale) : '';

  return (
    <div className="hp">
      <section className="hp-night" aria-labelledby="hp-title">
        <div className="hp-wrap hp-hero">
          <div className="hp-hero__main">
            <p className="hp-kicker hp-kicker--night">{uiCount('home2.kicker', worlds.length, locale)}</p>
            <h1 id="hp-title" className="hp-hero__title">
              {titleA}
              {titleEm ? <em>{titleEm}</em> : null}
              {titleB}
            </h1>
          </div>
          <div className="hp-hero__side">
            <p className="hp-hero__lead">{uiT('home2.lead', locale)}</p>
            <p className="hp-hero__actions">
              <a className="hp-btn hp-btn--tab" href={withBase(base, '/putovani/')}>
                {uiT('home2.heroJourneys', locale)}
              </a>
              <a className="hp-btn hp-btn--ghost" href={withBase(base, '/atlas/')}>
                {uiT('home2.openAtlas', locale)}
              </a>
              <button type="button" className="hp-hero__random" onClick={openRandom}>
                {uiT('home2.random', locale)} →
              </button>
            </p>
          </div>
        </div>

        <div className="hp-wrap">
          <div className="hp-sky-scroll">
          <div
            className={`hp-sky${litGroup || route ? ' has-lit' : ''}${route ? ' has-route' : ''}`}
            role="group"
            aria-label={uiT('home2.skyAria', locale)}
            style={{
              ['--sky-ratio' as string]: `1000 / ${sky.height}`,
              ['--sky-ratio-narrow' as string]: `1000 / ${Math.round(sky.height * 1.35)}`,
            }}
          >
            <svg className="hp-sky__lines" viewBox={`0 0 1000 ${sky.height}`} preserveAspectRatio="none" aria-hidden="true">
              {sky.lines.map((line, i) => (
                <line
                  key={`l${i}`}
                  className={litGroup === line.chapterId ? 'is-lit' : undefined}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  vectorEffect="non-scaling-stroke"
                  style={hueVars(chapterById[line.chapterId]?.accent)}
                />
              ))}
            </svg>
            {routeStars.length > 1 ? (
              <svg className="hp-sky__route" viewBox={`0 0 1000 ${sky.height}`} preserveAspectRatio="none" aria-hidden="true">
                <polyline points={routeStars.map((st) => `${st.x},${st.y}`).join(' ')} vectorEffect="non-scaling-stroke" />
              </svg>
            ) : null}
            {sky.groups.map((group) => (
              <a
                key={group.chapterId}
                className={`hp-sky__group${litGroup === group.chapterId ? ' is-lit' : ''}`}
                href={`#rejstrik-${group.chapterId}`}
                onMouseEnter={() => setLitGroup(group.chapterId)}
                onMouseLeave={() => setLitGroup(null)}
                onFocus={() => setLitGroup(group.chapterId)}
                onBlur={() => setLitGroup(null)}
                style={{ left: `${group.x / 10}%`, top: `${(group.y / sky.height) * 100}%`, ...hueVars(chapterById[group.chapterId]?.accent) }}
              >
                {uiT(SKY_NAME[group.chapterId] ?? '', locale)}
              </a>
            ))}
            {sky.stars.map((star) => {
              const world = worlds.find((w) => w.id === star.id);
              return (
                <a
                  key={star.id}
                  className={`hp-star${star.set === phase % (groupSets[star.chapterId]?.sets ?? 1) || star.isNew ? ' is-named' : ''}${star.isNew ? ' is-new' : ''}${litGroup === star.chapterId || routeIds.has(star.id) ? ' is-lit' : ''}${routeIds.has(star.id) ? ' is-route' : ''}`}
                  href={withBase(base, `/worlds/${star.id}/`)}
                  style={{
                    left: `${star.x / 10}%`,
                    top: `${(star.y / sky.height) * 100}%`,
                    ...hueVars(chapterById[star.chapterId]?.accent),
                    ['--s' as string]: `${star.size}px`,
                    ['--wave' as string]: `${(groupSets[star.chapterId]?.order ?? 0) * 180}ms`,
                  }}
                >
                  <i className="hp-star__dot" aria-hidden="true" />
                  {star.isNew ? <span className="hp-star__new">{uiT('home2.newWorld', locale)}</span> : null}
                  <span className="hp-star__name">{(world ? t(world.gameTitle, locale) : star.title).replace(/(\d) (\d)/g, '$1\u00a0$2')}</span>
                </a>
              );
            })}
          </div>
          <div className="hp-sky__scale" aria-hidden="true" />
          </div>
          <nav className="hp-sky__legend" aria-label={uiT('home.realms', locale)}>
            {sky.groups.map((group) => (
              <a key={group.chapterId} href={`#rejstrik-${group.chapterId}`} style={hueVars(chapterById[group.chapterId]?.accent)}>
                <i aria-hidden="true" />
                {uiT(SKY_NAME[group.chapterId] ?? '', locale)}
              </a>
            ))}
          </nav>
          <p className="hp-sky__caption">
            <span className="hp-sky__routes">
              {uiT('home2.skyRoutes', locale)}:{' '}
              {trails.map(({ trail }, i) => (
                <span key={trail.id}>
                  {i > 0 ? ' · ' : ''}
                  <a
                    href={withBase(base, `/putovani/${trailSlug(trail.id)}/`)}
                    className={shownRoute === trail.id ? 'is-on' : undefined}
                    onMouseEnter={() => setRoute(trail.id)}
                    onMouseLeave={() => setRoute(null)}
                    onFocus={() => setRoute(trail.id)}
                    onBlur={() => setRoute(null)}
                  >
                    {uiT(trail.nameKey, locale)}
                  </a>
                </span>
              ))}
            </span>
            {latest ? (
              <span>
                {uiT('home2.latest', locale)}:{' '}
                <a href={withBase(base, `/worlds/${latest.id}/`)}>
                  {t(latest.gameTitle, locale)}
                </a>
              </span>
            ) : null}
          </p>
        </div>
      </section>

      <div className="hp-wrap hp-body">
        {featuredTrail ? (
          <section className="hp-journeys" aria-labelledby="hp-journeys-title">
            <div className="hp-journeys__head">
              <p className="hp-kicker">{uiT('trails.daily', locale)}</p>
              <a className="hp-link" href={withBase(base, '/putovani/')}>
                {uiT('trails.all', locale).replace('{n}', String(TRAILS.length))}
              </a>
            </div>
            <div className="hp-journeys__grid">
              <article className="hp-journey">
                <h2 id="hp-journeys-title" className="hp-journey__title">
                  <a href={withBase(base, `/putovani/${trailSlug(featuredTrail.trail.id)}/`)}>{uiT(featuredTrail.trail.nameKey, locale)}</a>
                </h2>
                <p className="hp-journey__question">{tagline(featuredTrail.info, featuredTrail.trail.descKey)}</p>
                {featuredTrail.info?.quote && locale === 'cs' ? (
                  <blockquote className="hp-journey__quote">
                    <p>„{featuredTrail.info.quote}“</p>
                    {featuredTrail.info.quoteSource ? <cite>{featuredTrail.info.quoteSource}</cite> : null}
                  </blockquote>
                ) : null}
                <ol className="hp-route" aria-label={uiT('home2.routeAria', locale)}>
                  {featuredTrail.members.map((w) => (
                    <li key={w.id} style={hueVars(chapterById[w.chapterId]?.accent)}>
                      <a href={withBase(base, `/worlds/${w.id}/`)}>
                        <i aria-hidden="true" />
                        <span>{t(w.gameTitle, locale)}</span>
                      </a>
                    </li>
                  ))}
                </ol>
                <p className="hp-journey__go">
                  <a className="hp-btn hp-btn--tab" href={withBase(base, `/putovani/${trailSlug(featuredTrail.trail.id)}/`)}>
                    {uiT('home2.journeyGo', locale)} →
                  </a>
                  <span className="hp-journey__meta">
                    {[
                      featuredTrail.info?.minutes ? uiT('home2.journeyEssay', locale).replace('{m}', String(featuredTrail.info.minutes)) : '',
                      worldsCountLabel(featuredTrail.members.length, locale),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </p>
              </article>
              <div className="hp-journeys__more">
                <p className="hp-kicker">{uiT('home2.moreJourneys', locale)}</p>
                {otherTrails.map(({ trail, info, members }) => (
                  <a key={trail.id} className="hp-journey-small" href={withBase(base, `/putovani/${trailSlug(trail.id)}/`)}>
                    <span className="hp-journey-small__title">{uiT(trail.nameKey, locale)}</span>
                    <span className="hp-journey-small__question">{tagline(info, trail.descKey)}</span>
                    <span className="hp-route hp-route--small" aria-hidden="true">
                      {members.map((w) => (
                        <span key={w.id} style={hueVars(chapterById[w.chapterId]?.accent)}>
                          <i />
                          {t(w.gameTitle, locale)}
                        </span>
                      ))}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <ReaderDesk locale={locale} base={base} />

        <section className="hp-today" aria-label={uiT('home.featured', locale)}>
          {featured ? (
            <article className="hp-featured" style={hueVars(featuredChapter?.accent)}>
              <p className="hp-featured__meta">
                <span>{uiT('home.featured', locale)}</span>
                <span className="hp-featured__arch">
                  {[featuredChapter ? t(featuredChapter.title, locale) : '', t(featured.metadata.genreProfile, locale)]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </p>
              <h2 className="hp-featured__title">
                <a href={withBase(base, `/worlds/${featured.id}/`)}>{t(featured.gameTitle, locale)}</a>
              </h2>
              <p className="hp-featured__core">{t(featured.core, locale)}</p>
              <AxisBars world={featured} locale={locale} />
              <p className="hp-featured__links">
                <a href={withBase(base, `/worlds/${featured.id}/`)}>{uiT('world.viewCard', locale)} →</a>
                <a href={withBase(base, `/worlds/${featured.id}/?view=chronicle`)}>{uiT('home.readChronicle', locale)}</a>
              </p>
            </article>
          ) : (
            <div className="hp-featured hp-featured--placeholder" aria-hidden="true" />
          )}
          <div className="hp-riddle">
            {today ? <DailyMystery catalog={worlds} locale={locale} base={base} today={today} /> : null}
          </div>
        </section>

        <section className="hp-index" aria-labelledby="hp-index-title">
          <div className="hp-section-head">
            <h2 id="hp-index-title" className="hp-h2">
              {uiT('home2.index', locale)}
            </h2>
            <a className="hp-link" href={withBase(base, '/atlas/')}>
              {uiT('home2.indexAll', locale)}
            </a>
          </div>
          <div className="hp-index__grid">
            {chapters.map((chapter) => {
              const items = worlds.filter((w) => w.chapterId === chapter.id).sort((a, b) => a.number - b.number);
              if (!items.length) return null;
              return (
                <div key={chapter.id} id={`rejstrik-${chapter.id}`} className="hp-index__col" style={hueVars(chapter.accent)}>
                  <a className="hp-tab" href={withBase(base, `/chapters/${chapter.id}/`)} title={t(chapter.title, locale)}>
                    {uiT(SKY_NAME[chapter.id] ?? '', locale) || t(chapter.title, locale)} · {items.length}
                  </a>
                  <div className="hp-index__body">
                    <ul className="hp-index__list">
                      {items.map((w) => (
                        <li key={w.id}>
                          <a href={withBase(base, `/worlds/${w.id}/`)}>
                            <span>{t(w.gameTitle, locale)}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <WorldCompass worlds={worlds} locale={locale} base={base} alwaysOpen />

        <nav className="hp-ways" aria-label={uiT('home2.waysAria', locale)}>
          <a className="hp-way" href={withBase(base, '/atlas/')}>
            <span className="hp-way__title">
              {uiT('nav.atlas', locale)} <span className="hp-way__arrow" aria-hidden="true">→</span>
            </span>
            <span className="hp-way__text">{uiT('home2.wayAtlas', locale).replace('{n}', worldsCountLabel(worlds.length, locale))}</span>
          </a>
          <a className="hp-way" href={withBase(base, '/compare/')}>
            <span className="hp-way__title">
              {uiT('nav.compare', locale)} <span className="hp-way__arrow" aria-hidden="true">→</span>
            </span>
            <span className="hp-way__text">{uiT('home2.wayCompare', locale)}</span>
          </a>
          <a className="hp-way" href={withBase(base, '/map/')}>
            <span className="hp-way__title">
              {uiT('map.title', locale)} <span className="hp-way__arrow" aria-hidden="true">→</span>
            </span>
            <span className="hp-way__text">{uiT('home2.wayMap', locale)}</span>
          </a>
        </nav>

        <section className="hp-essay-row" aria-label={uiT('essay.title', locale)}>
          <article className="hp-essay">
            <p className="hp-kicker">{uiT('essay.homeKicker', locale)}</p>
            <h2 className="hp-essay__title">
              <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('essay.title', locale)}</a>
            </h2>
            <p className="hp-essay__lead">{uiT('essay.homeLead', locale)}</p>
            <a className="hp-link" href={withBase(base, '/anatomie-herniho-lore/')}>
              {uiT('essay.homeCta', locale)} →
            </a>
          </article>
        </section>
      </div>
    </div>
  );
}
