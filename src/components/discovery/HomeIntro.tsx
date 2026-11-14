import { useLocale } from '../../lib/locale-store';
import { profileCountLabel, t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString } from '../../schemas/world';

export type ChapterCardData = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: string;
  count: number;
};

type Props = {
  chapters: ChapterCardData[];
  base: string;
};

export default function HomeIntro({ chapters, base }: Props) {
  const locale = useLocale();

  return (
    <>
      <header className="home-cover">
        <p className="home-cover__kicker">{uiT('home.kicker', locale)}</p>
        <p className="home-cover__brand">{uiT('siteName', locale)}</p>
        <h1 className="home-cover__title display">{uiT('home.title', locale)}</h1>
        <div className="home-cover__ornament" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
        <p className="home-cover__lead">{uiT('home.slogan', locale)}</p>
        <p className="home-cover__method">
          <a href={withBase(base, '/notes/')}>{uiT('home.readAtlas', locale)}</a>
        </p>
      </header>

      <nav className="home-realms" aria-label={uiT('home.chaptersAria', locale)}>
        <h2 className="home-section-title home-realms__title">{uiT('home.realms', locale)}</h2>
        <div className="home-realms__cols">
          <div className="home-realms__col">
            {chapters.slice(0, 4).map((chapter) => (
              <ChapterLink key={chapter.id} chapter={chapter} base={base} locale={locale} />
            ))}
          </div>
          <div className="home-realms__col">
            {chapters.slice(4).map((chapter) => (
              <ChapterLink key={chapter.id} chapter={chapter} base={base} locale={locale} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

function ChapterLink({
  chapter,
  base,
  locale,
}: {
  chapter: ChapterCardData;
  base: string;
  locale: Locale;
}) {
  return (
    <a
      className={`home-realm${chapter.count === 0 ? ' home-realm--empty' : ''}`}
      href={withBase(base, `/chapters/${chapter.id}/`)}
    >
      <span className="home-realm__name">{t(chapter.title, locale)}</span>
      <span className="home-realm__count">
        {chapter.count === 0
          ? uiT('home.chapterSoon', locale)
          : profileCountLabel(chapter.count, locale)}
      </span>
    </a>
  );
}
