import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocale } from '../../lib/locale-store';
import { t, uiCount, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString, World } from '../../schemas/world';
import { dayNumber, featuredWorldIndex } from '../../lib/calendar';
import { TRAILS, dailyTrails, trailSlug } from '../../lib/trails';
import { latestAdded, mostRecentAdded } from '../../lib/atlas-news';
import AxisBars from './AxisBars';
import DailyMystery from './DailyMystery';
import type { RiddleCounts } from '../../lib/riddle-day';
import ReaderDesk from './ReaderDesk';
import WorldCompass from './WorldCompass';
import { buildSky, windingPath } from '../../lib/sky';

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
  image?: { src: string; ink?: string; inkLight?: string; mask: string };
};

type Props = {
  chapters: ChapterCardData[];
  worlds: World[];
  journeys?: JourneyInfo[];
  /** Počet hádanek dne po druzích (zásobník skládá riddles.ts při sestavení). */
  riddleCounts?: RiddleCounts;
  /** Obrázek eseje Anatomie herního lore v posledním pásu (src a masky jako u putování). */
  essayImage?: { src: string; ink?: string; inkLight?: string; mask: string };
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

/** Jak často se na obloze vymění popsané světy (ms). */
const ROTATE_MS = 5000;


function hueVars(accent?: { light: string; dark: string }): CSSProperties | undefined {
  return accent ? ({ '--hue-l': accent.light, '--hue-d': accent.dark } as CSSProperties) : undefined;
}

/** Zastávka trasy Putování dne: vlastní barva a barva další zastávky (úsek linky mezi nimi přechází). */
function routeVars(
  accent?: { light: string; dark: string },
  next?: { light: string; dark: string },
): CSSProperties | undefined {
  const own = hueVars(accent);
  if (!own || !next) return own;
  return { ...own, '--next-l': next.light, '--next-d': next.dark } as CSSProperties;
}


export default function HomeIntro({ chapters, worlds = [], journeys = [], riddleCounts = {}, essayImage, base }: Props) {
  const locale = useLocale();
  const [today, setToday] = useState<Date | null>(null);
  const [litGroup, setLitGroup] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  // Putování, jehož trasa je právě nakreslená přes oblohu (najetí na jeho název pod oblohou).
  const [route, setRoute] = useState<string | null>(null);
  // Trasy oblohou: při každém načtení stránky jiná trojice putování (jiná než Putování dne).
  const [skyPick, setSkyPick] = useState<string[] | null>(null);

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
    const now = new Date();
    setToday(now);
    const daily = new Set(dailyTrails(dayNumber(now)).map((tr) => tr.id));
    const pool = TRAILS.filter((tr) => !daily.has(tr.id)).map((tr) => tr.id);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const k = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[k]] = [pool[k], pool[i]];
    }
    setSkyPick(pool.slice(0, 3));
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
  const skyRoutes = (skyPick ?? []).map((id) => TRAILS.find((tr) => tr.id === id)).filter((tr): tr is (typeof TRAILS)[number] => Boolean(tr));
  // Trasa putování přes oblohu jen při najetí: hvězdy jeho světů v pořadí, v jakém je putování prochází.
  const shownRoute = route;
  const routeTrail = TRAILS.find((tr) => tr.id === shownRoute);
  const routeMembers = routeTrail
    ? routeTrail.members.map((id) => sky.stars.find((st) => st.id === id)).filter((st): st is (typeof sky.stars)[number] => Boolean(st))
    : [];
  // Trasa vede nejkratší cestou mezi hvězdami světů putování, ne v pořadí seznamu.
  const routeStars = windingPath(routeMembers.map((st) => [st.x, st.y] as [number, number])).map((k) => routeMembers[k]);
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
                {/* hvězda jako na obloze: náhodný svět je jedna z nich */}
                <span className="hp-hero__random-star" aria-hidden="true" />
                <span className="hp-hero__random-label">{uiT('home2.random', locale)}</span>
                <span className="hp-hero__random-arrow" aria-hidden="true">→</span>
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
              <span className="hp-sky__routes-set">
              {skyRoutes.map((trail, i) => (
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
              <article className={`hp-journey${featuredTrail.info?.image ? ' has-image' : ''}`}>
                <div className="hp-journey__top">
                <div className="hp-journey__intro">
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
                </div>
                {featuredTrail.info?.image ? (
                  <a
                    className="hp-journey__img"
                    href={withBase(base, `/putovani/${trailSlug(featuredTrail.trail.id)}/`)}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={featuredTrail.info.image.src}
                      alt=""
                      decoding="async"
                      className={featuredTrail.info.image.ink ? 'has-ink' : undefined}
                      style={
                        {
                          '--pv-mask': `url("${featuredTrail.info.image.mask}")`,
                          ...(featuredTrail.info.image.ink
                            ? {
                                '--pv-mask-ink': `url("${featuredTrail.info.image.ink}")`,
                                '--pv-mask-ink-light': `url("${featuredTrail.info.image.inkLight ?? featuredTrail.info.image.ink}")`,
                              }
                            : {}),
                        } as CSSProperties
                      }
                    />
                  </a>
                ) : null}
                </div>
                <ol className="hp-route" aria-label={uiT('home2.routeAria', locale)}>
                  {featuredTrail.members.map((w, i, all) => (
                    <li key={w.id} style={routeVars(chapterById[w.chapterId]?.accent, chapterById[all[i + 1]?.chapterId]?.accent)}>
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
                  {featuredTrail.info?.minutes ? (
                    <span className="hp-journey__meta">{uiT('home2.journeyEssay', locale).replace('{m}', String(featuredTrail.info.minutes))}</span>
                  ) : null}
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
                    {info?.minutes ? (
                      <span className="hp-journey__meta hp-journey-small__meta">
                        {uiT('home2.journeyEssay', locale).replace('{m}', String(info.minutes))}
                      </span>
                    ) : null}
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
            {today ? <DailyMystery catalog={worlds} counts={riddleCounts} locale={locale} base={base} today={today} /> : null}
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
          <a className="hp-way" href={withBase(base, '/poetika-svetu/')}>
            <span className="hp-way__title">
              {uiT('narrPage.title', locale)} <span className="hp-way__arrow" aria-hidden="true">→</span>
            </span>
            <span className="hp-way__text">{uiT('home2.wayNarration', locale)}</span>
          </a>
          <a className="hp-way" href={withBase(base, '/galerie-triad/')}>
            <span className="hp-way__title">
              {uiT('triads.title', locale)} <span className="hp-way__arrow" aria-hidden="true">→</span>
            </span>
            <span className="hp-way__text">{uiT('home2.wayTriads', locale)}</span>
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
          {essayImage ? (
            <a className="hp-essay__img" href={withBase(base, '/anatomie-herniho-lore/')} tabIndex={-1} aria-hidden="true">
              <img
                src={essayImage.src}
                alt=""
                loading="lazy"
                decoding="async"
                className={essayImage.ink ? 'has-ink' : undefined}
                style={
                  {
                    '--pv-mask': `url("${essayImage.mask}")`,
                    ...(essayImage.ink
                      ? {
                          '--pv-mask-ink': `url("${essayImage.ink}")`,
                          '--pv-mask-ink-light': `url("${essayImage.inkLight ?? essayImage.ink}")`,
                        }
                      : {}),
                  } as CSSProperties
                }
              />
            </a>
          ) : null}
        </section>
      </div>
    </div>
  );
}
