import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocale } from '../../lib/locale-store';
import { t, uiCount, uiT, worldsCountLabel, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString, World } from '../../schemas/world';
import { dailyWorldIndex } from '../../lib/calendar';
import { AXIS_KEYS } from '../../lib/axes';
import { TRAILS } from '../../lib/trails';
import { mostRecentAdded } from '../../lib/atlas-news';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from './MiniAxes';
import DailyMystery from './DailyMystery';
import ReaderDesk from './ReaderDesk';

export type ChapterCardData = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: { light: string; dark: string };
  count: number;
};

type Props = {
  chapters: ChapterCardData[];
  worlds: World[];
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

/** Jedna trvale popsaná hvězda v každém souhvězdí. */
const ICONIC: Record<string, string> = {
  fantasy: 'dark-souls',
  'science-fiction': 'mass-effect',
  'post-apocalypse': 'fallout',
  horror: 'silent-hill',
  historical: 'disco-elysium',
  dystopia: 'cyberpunk-2077',
  metaphysical: 'outer-wilds',
};

/*
 * Obloha v souřadnicích 1000 × H. Souhvězdí mají pevné počátky a 80jednotkový krok hvězd.
 * Popsaná hvězda stojí na konci první řady, vpravo od ní je volno až k dalšímu souhvězdí,
 * takže se popisky nepřekrývají. Ostatní názvy se ukážou po najetí myší nebo fokusu.
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

type Star = { id: string; title: string; named: boolean; x: number; y: number; size: number; chapterId: string };
type Line = { x: number; y: number; w: number; a: number; chapterId: string };
type Group = { chapterId: string; x: number; y: number; count: number };

function buildSky(worlds: World[], chapters: ChapterCardData[]) {
  const stars: Star[] = [];
  const lines: Line[] = [];
  const groups: Group[] = [];
  let maxY = 0;
  chapters.forEach((chapter, gi) => {
    const [ox, oy, perRow] = ORIGINS[gi] ?? [20 + (gi % 3) * 330, 50 + Math.floor(gi / 3) * 240, 3];
    let items = worlds.filter((w) => w.chapterId === chapter.id).sort((a, b) => a.number - b.number);
    if (!items.length) return;
    const iconic = items.find((w) => w.id === ICONIC[chapter.id]) ?? items[0];
    items = items.filter((w) => w !== iconic);
    items.splice(Math.min(perRow, items.length + 1) - 1, 0, iconic);
    groups.push({ chapterId: chapter.id, x: ox, y: oy - 30, count: items.length });
    let prev: [number, number] | null = null;
    items.forEach((w, k) => {
      const seed = gi * 13 + k * 7;
      const x = ox + (k % perRow) * STEP_X + ((seed * 37) % 9) - 4;
      const y = oy + Math.floor(k / perRow) * STEP_Y + ((seed * 53) % 13) - 6;
      const named = w === iconic;
      stars.push({ id: w.id, title: w.gameTitle.cs ?? w.gameTitle.en, named, x, y, size: named ? 10 : [4, 6, 7][(seed * 17) % 3], chapterId: chapter.id });
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


export default function HomeIntro({ chapters, worlds = [], base }: Props) {
  const locale = useLocale();
  const [today, setToday] = useState<Date | null>(null);
  const [litGroup, setLitGroup] = useState<string | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const chapterById = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, index: i }])), [chapters]);
  const sky = useMemo(() => buildSky(worlds, chapters), [worlds, chapters]);
  const latest = mostRecentAdded(worlds);
  const featured = today && worlds.length > 0 ? worlds[dailyWorldIndex(worlds.length, 0, today)] : undefined;
  const featuredChapter = featured ? chapterById[featured.chapterId] : undefined;

  const openRandom = () => {
    if (worlds.length === 0) return;
    const pick = worlds[Math.floor(Math.random() * worlds.length)];
    window.location.href = withBase(base, `/worlds/${pick.id}/`);
  };

  const [titleA, titleEm, titleB] = uiT('home2.title', locale).split('|');
  const trails = TRAILS.map((trail) => ({ trail, members: worlds.filter((w) => trail.match(w)) }));

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
              <button type="button" className="hp-btn hp-btn--ghost" onClick={openRandom}>
                {uiT('home2.random', locale)}
              </button>
            </p>
          </div>
        </div>

        <div className="hp-wrap">
          <div className="hp-sky-scroll">
          <div
            className={`hp-sky${litGroup ? ' has-lit' : ''}`}
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
                {uiT(SKY_NAME[group.chapterId] ?? '', locale)} <span className="hp-sky__count">{group.count}</span>
              </a>
            ))}
            {sky.stars.map((star) => {
              const world = worlds.find((w) => w.id === star.id);
              return (
                <a
                  key={star.id}
                  className={`hp-star${star.named ? ' is-named' : ''}${litGroup === star.chapterId ? ' is-lit' : ''}`}
                  href={withBase(base, `/worlds/${star.id}/`)}
                  style={{
                    left: `${star.x / 10}%`,
                    top: `${(star.y / sky.height) * 100}%`,
                    ...hueVars(chapterById[star.chapterId]?.accent),
                    ['--s' as string]: `${star.size}px`,
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
                {uiT(SKY_NAME[group.chapterId] ?? '', locale)} <span className="hp-sky__count">{group.count}</span>
              </a>
            ))}
          </nav>
          <p className="hp-sky__caption">
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
        <ReaderDesk locale={locale} base={base} />

        <section className="hp-today" aria-label={uiT('home.featured', locale)}>
          {featured ? (
            <article className="hp-featured" style={hueVars(featuredChapter?.accent)}>
              <p className="hp-featured__meta">
                <span>{uiT('home.featured', locale)}</span>
                <span className="hp-featured__arch">
                  {featuredChapter ? t(featuredChapter.title, locale) : ''}
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
                  <span className="hp-tab">{items.length}</span>
                  <div className="hp-index__body">
                    <a className="hp-index__name" href={withBase(base, `/chapters/${chapter.id}/`)}>
                      {t(chapter.title, locale)}
                    </a>
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

        <nav className="hp-ways" aria-label={uiT('home2.waysAria', locale)}>
          <a className="hp-way" href={withBase(base, '/atlas/')}>
            <span className="hp-way__title">{uiT('nav.atlas', locale)}</span>
            <span className="hp-way__text">{uiT('home2.wayAtlas', locale).replace('{n}', worldsCountLabel(worlds.length, locale))}</span>
          </a>
          <a className="hp-way" href={withBase(base, '/compare/')}>
            <span className="hp-way__title">{uiT('nav.compare', locale)}</span>
            <span className="hp-way__text">{uiT('home2.wayCompare', locale)}</span>
          </a>
          <a className="hp-way" href={withBase(base, '/map/')}>
            <span className="hp-way__title">{uiT('map.title', locale)}</span>
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
          <div className="hp-trails">
            <p className="hp-kicker">{uiT('home.trailsTitle', locale)}</p>
            {trails.map(({ trail, members }) => {
              const shown = members.slice(0, 6).map((w) => t(w.gameTitle, locale));
              const rest = members.length - shown.length;
              return (
                <a key={trail.id} className="hp-trail" href={withBase(base, `/atlas/?trail=${trail.id}`)}>
                  <span className="hp-trail__name">{uiT(trail.nameKey, locale)}</span>
                  <span className="hp-trail__worlds">
                    {shown.join(' · ')}
                    {rest > 0 ? ` · ${uiT('home2.trailsMore', locale).replace('{n}', String(rest))}` : ''}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Profil světa jako pět řad po pěti dílcích (barva archetypu). */
function AxisBars({ world, locale }: { world: World; locale: Locale }) {
  return (
    <div className="hp-axes" aria-label={uiT('card.profileWorld', locale)}>
      {AXIS_KEYS.map((key) => {
        const meta = axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
        const value = world.axes[key].value;
        return (
          <div key={key} className="hp-axes__row">
            <span>{axisPoleLabel(meta, 'left', locale)}</span>
            <span className="hp-axes__cells" aria-label={`${value} / 5`}>
              {[1, 2, 3, 4, 5].map((v) => (
                <i key={v} className={v === value ? 'is-on' : undefined} />
              ))}
            </span>
            <span>{axisPoleLabel(meta, 'right', locale)}</span>
          </div>
        );
      })}
    </div>
  );
}
