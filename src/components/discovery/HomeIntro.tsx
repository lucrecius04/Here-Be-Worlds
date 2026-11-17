import { useEffect, useState, type CSSProperties } from 'react';
import { useLocale } from '../../lib/locale-store';
import { profileCountLabel, t, uiCount, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString, World } from '../../schemas/world';
import { dailyWorldIndex } from '../../lib/calendar';
import MiniAxes from './MiniAxes';
import DailyMystery from './DailyMystery';
import ReaderDesk from './ReaderDesk';
import ChapterEmblem from './ChapterEmblem';
import { mostRecentAdded } from '../../lib/atlas-news';

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

export default function HomeIntro({ chapters, worlds = [], base }: Props) {
  const locale = useLocale();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  const featured =
    today && worlds.length > 0 ? worlds[dailyWorldIndex(worlds.length, 0, today)] : undefined;
  const featuredChapter = featured
    ? chapters.find((chapter) => chapter.id === featured.chapterId)
    : undefined;
  const featuredUniverse = featured?.universe?.[0] ? t(featured.universe[0], locale) : '';
  const featuredArchetype = featuredChapter ? t(featuredChapter.title, locale) : '';
  const latest = mostRecentAdded(worlds);

  const openRandom = () => {
    if (worlds.length === 0) return;
    const pick = worlds[Math.floor(Math.random() * worlds.length)];
    window.location.href = withBase(base, `/worlds/${pick.id}/`);
  };

  return (
    <>
      <div className="home-bento">
        <header className="home-panel home-bento__identity">
          <div className="home-bento__identity-main">
            <p className="home-cover__kicker">{uiCount('home.heroKicker', worlds.length, locale)}</p>
            <p className="home-cover__brand">{uiT('siteName', locale)}</p>
            <h1 className="home-cover__title display">{uiT('home.title', locale)}</h1>
            <div className="home-cover__ornament" aria-hidden="true">
              <span>✦</span>
              <span>✦</span>
              <span>✦</span>
            </div>
            <p className="home-cover__lead">{uiT('home.heroSlogan', locale)}</p>
            <p className="home-cover__method">
              <button type="button" className="home-cover__cta home-cover__cta--primary" onClick={openRandom}>
                {uiT('home.randomWorld', locale)}
              </button>
              <a className="home-cover__cta home-cover__cta--secondary" href={withBase(base, '/notes/')}>
                {uiT('home.readAtlas', locale)}
              </a>
            </p>
          </div>
          <div className="home-cover__foot">
            <p className="home-cover__stats">{uiT('home.heroStats', locale)}</p>
            {latest ? (
              <p className="home-cover__latest">
                {uiT('home.latestEntry', locale)}{' '}
                <a href={withBase(base, `/worlds/${latest.id}/`)}>{t(latest.gameTitle, locale)}</a>
              </p>
            ) : null}
          </div>
        </header>

        {featured ? (
          <section className="home-panel home-featured home-bento__featured" aria-label={uiT('home.featured', locale)}>
            <div className="home-featured__head">
              <p className="home-panel__kicker">{uiT('home.featured', locale)}</p>
              <p className="home-featured__meta">
                {[featuredArchetype, featuredUniverse].filter(Boolean).join(' · ')}
              </p>
            </div>
            <h2 className="home-featured__title">{t(featured.gameTitle, locale)}</h2>
            <p className="home-featured__core">{t(featured.core, locale)}</p>
            <p className="home-featured__axes-label">{uiT('card.profileWorld', locale)}</p>
            <MiniAxes world={featured} locale={locale} />
            <p className="home-featured__links">
              <a href={withBase(base, `/worlds/${featured.id}/`)}>
                {uiT('world.viewCard', locale)} →
              </a>
              <a href={withBase(base, `/worlds/${featured.id}/?view=chronicle`)}>
                {uiT('home.readChronicle', locale)}
              </a>
            </p>
          </section>
        ) : null}

        {today ? (
          <div className="home-bento__mystery">
            <DailyMystery catalog={worlds} locale={locale} base={base} today={today} />
          </div>
        ) : null}
      </div>

      <ReaderDesk locale={locale} base={base} />

      <nav className="home-realms" aria-label={uiT('home.chaptersAria', locale)}>
        <h2 className="home-section-title home-realms__title">{uiT('home.realms', locale)}</h2>
        <div className="home-realms__grid">
          {chapters.map((chapter) => (
            <ChapterTile key={chapter.id} chapter={chapter} base={base} locale={locale} />
          ))}
        </div>
      </nav>
    </>
  );
}

function ChapterTile({
  chapter,
  base,
  locale,
}: {
  chapter: ChapterCardData;
  base: string;
  locale: Locale;
}) {
  const hueVars = {
    '--chapter-hue-light': chapter.accent.light,
    '--chapter-hue-dark': chapter.accent.dark,
  } as CSSProperties;

  return (
    <a
      className={`home-realm${chapter.count === 0 ? ' home-realm--empty' : ''}`}
      href={withBase(base, `/chapters/${chapter.id}/`)}
      style={hueVars}
      data-chapter={chapter.id}
    >
      <span className="home-realm__art" aria-hidden="true">
        <ChapterEmblem chapterId={chapter.id} />
      </span>
      <span className="home-realm__body">
        <span className="home-realm__name">{t(chapter.title, locale)}</span>
        <span className="home-realm__thesis">{t(chapter.thesis, locale)}</span>
        <span className="home-realm__count">
          {chapter.count === 0
            ? uiT('home.chapterSoon', locale)
            : profileCountLabel(chapter.count, locale)}
        </span>
      </span>
    </a>
  );
}
