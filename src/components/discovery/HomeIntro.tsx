import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocale } from '../../lib/locale-store';
import { t, uiCount, uiT, worldsCountLabel, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString, World } from '../../schemas/world';
import { dayNumber, featuredWorldIndex } from '../../lib/calendar';
import { TRAILS, dailyTrails, trailSlug } from '../../lib/trails';
import { mostRecentAdded } from '../../lib/atlas-news';
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

/** Pozice popsaných hvězd v souhvězdí (cik-cak, aby jména pod hvězdami nesousedila). */
function namedSlots(count: number, perRow: number, named: number): number[] {
  const zigzag = [perRow - 1, perRow, 3 * perRow - 1, 2 * perRow + 1];
  const slots = zigzag.filter((slot) => slot < count).slice(0, named);
  if (slots.length < named && count > 0) {
    for (let k = 0; k < count && slots.length < named; k += 2) if (!slots.includes(k)) slots.push(k);
  }
  return slots;
}

/**
 * Rozdělí hvězdy souhvězdí do stálých skupinek, které se na obloze střídají. První skupinka
 * jsou známé světy (slots); další berou zbylé hvězdy tak, aby v jedné řadě nestály dvě
 * sousední hvězdy (jména pod nimi by se překrývala). Vrací index skupinky pro každou pozici.
 */
function rotationSets(count: number, perRow: number, first: number[], size: number): number[] {
  const setOf = new Array<number>(count).fill(-1);
  first.forEach((k) => {
    setOf[k] = 0;
  });
  const clash = (a: number, b: number) =>
    Math.floor(a / perRow) === Math.floor(b / perRow) && Math.abs((a % perRow) - (b % perRow)) === 1;
  // Zbylé pozice v rozházeném pořadí, aby po sobě nesvítily vždy stejné řady.
  let rest = Array.from({ length: count }, (_, k) => k)
    .filter((k) => setOf[k] < 0)
    .sort((a, b) => ((a * 5) % count) - ((b * 5) % count));
  let index = 1;
  while (rest.length) {
    const group: number[] = [];
    for (const k of rest) {
      if (group.length >= Math.max(1, size)) break;
      if (group.every((g) => !clash(g, k))) group.push(k);
    }
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
 * Obloha v souřadnicích 1000 × H. Souhvězdí mají pevné počátky a 80jednotkový krok hvězd.
 * Jména popsaných hvězd stojí pod hvězdou, stejně jako při rozsvíceném souhvězdí.
 * Při růstu atlasu: horní pás snese 4–5 řad (cca 15 světů v souhvězdí), pak upravit počátky.
 */
const ORIGINS: Array<[number, number, number]> = [
  [20, 50, 3],
  [340, 50, 3],
  [680, 50, 3],
  [10, 290, 2],
  [210, 290, 3],
  [480, 290, 3],
  [750, 290, 3],
];
const STEP_X = 80;
const STEP_Y = 44;

type Star = { id: string; title: string; set: number; x: number; y: number; size: number; chapterId: string };
type Line = { x: number; y: number; w: number; a: number; chapterId: string };
type Group = { chapterId: string; x: number; y: number; count: number; sets: number; order: number };

function buildSky(worlds: World[], chapters: ChapterCardData[]) {
  const stars: Star[] = [];
  const lines: Line[] = [];
  const groups: Group[] = [];
  let maxY = 0;
  chapters.forEach((chapter, gi) => {
    const [ox, oy, perRow] = ORIGINS[gi] ?? [20 + (gi % 3) * 330, 50 + Math.floor(gi / 3) * 240, 3];
    const all = worlds.filter((w) => w.chapterId === chapter.id).sort((a, b) => a.number - b.number);
    if (!all.length) return;
    const wanted = (ICONIC[chapter.id] ?? [])
      .map((id) => all.find((w) => w.id === id))
      .filter((w): w is World => Boolean(w));
    const slots = namedSlots(all.length, perRow, wanted.length);
    const iconic = wanted.slice(0, slots.length);
    const rest = all.filter((w) => !iconic.includes(w));
    const items: World[] = [];
    for (let k = 0, r = 0; k < all.length; k += 1) {
      const slotIndex = slots.indexOf(k);
      items.push(slotIndex >= 0 ? iconic[slotIndex] : rest[r++]);
    }
    const setOf = rotationSets(all.length, perRow, slots, wanted.length || 2);
    groups.push({ chapterId: chapter.id, x: ox, y: oy - 44, count: all.length, sets: Math.max(...setOf) + 1, order: gi });
    let prev: [number, number] | null = null;
    items.forEach((w, k) => {
      const seed = gi * 13 + k * 7;
      const x = ox + (k % perRow) * STEP_X + ((seed * 37) % 9) - 4;
      const y = oy + Math.floor(k / perRow) * STEP_Y + ((seed * 53) % 13) - 6;
      stars.push({ id: w.id, title: w.gameTitle.cs ?? w.gameTitle.en, set: setOf[k], x, y, size: [5, 6, 7, 8][(seed * 17) % 4], chapterId: chapter.id });
      if (prev) {
        const dx = x - prev[0];
        const dy = y - prev[1];
        lines.push({ x: prev[0], y: prev[1], w: Math.hypot(dx, dy), a: (Math.atan2(dy, dx) * 180) / Math.PI, chapterId: chapter.id });
      }
      prev = [x, y];
      maxY = Math.max(maxY, y);
    });
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
  const sky = useMemo(() => buildSky(worlds, chapters), [worlds, chapters]);
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
              <a className="hp-btn hp-btn--light" href={withBase(base, '/atlas/')}>
                {uiT('home2.openAtlas', locale)}
              </a>
              <a className="hp-btn hp-btn--ghost" href={withBase(base, '/putovani/')}>
                {uiT('home2.heroJourneys', locale)}
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
            {sky.lines.map((line, i) => (
              <i
                key={`l${i}`}
                className={`hp-sky__line${litGroup === line.chapterId ? ' is-lit' : ''}`}
                style={{
                  left: `${line.x / 10}%`,
                  top: `${(line.y / sky.height) * 100}%`,
                  width: `${line.w / 10}%`,
                  transform: `rotate(${line.a}deg)`,
                }}
              />
            ))}
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
                  className={`hp-star${star.set === phase % (groupSets[star.chapterId]?.sets ?? 1) ? ' is-named' : ''}${litGroup === star.chapterId || routeIds.has(star.id) ? ' is-lit' : ''}${routeIds.has(star.id) ? ' is-route' : ''}`}
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
                  <a className="hp-btn hp-btn--ink" href={withBase(base, `/putovani/${trailSlug(featuredTrail.trail.id)}/`)}>
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
            <a className="hp-link hp-trails__all" href={withBase(base, '/putovani/')}>
              {uiT('trails.all', locale).replace('{n}', String(TRAILS.length))}
            </a>
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
