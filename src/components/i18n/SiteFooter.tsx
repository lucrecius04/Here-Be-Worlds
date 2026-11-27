import { t, uiCount, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { chapters, worlds } from '../../lib/worlds';
import BrandMark, { Wordmark } from './BrandMark';

const PUBLISHED_COUNT = worlds.filter((world) => !world.draft).length;

type Props = { base: string };

const FOOTER_CHAPTER_COLUMNS = [
  ['fantasy', 'science-fiction', 'post-apocalypse', 'horror'],
  ['historical', 'dystopia', 'metaphysical'],
] as const;

export default function SiteFooter({ base }: Props) {
  const locale = useLocale();

  return (
    <footer className="site-footer" id="footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <a href={withBase(base, '/')} className="site-footer__name" aria-label={uiT('siteName', locale)}>
            <BrandMark size={24} className="brand-mark site-footer__mark" />
            <Wordmark />
          </a>
          <p className="site-footer__tagline">{uiT('footer.tagline', locale)}</p>
          <p className="site-footer__meta">{uiCount('home.kicker', PUBLISHED_COUNT, locale)}</p>
        </div>
        <nav className="site-footer__col" aria-label={uiT('footer.explore', locale)}>
          <h2 className="site-footer__heading">{uiT('footer.explore', locale)}</h2>
          <a className="site-footer__link" href={withBase(base, '/atlas/')}>
            {uiT('nav.atlas', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/putovani/')}>
            {uiT('nav.trails', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/compare/')}>
            {uiT('nav.compare', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/map/')}>
            {uiT('nav.map', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/temata/')}>
            {uiT('footer.themes', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/hlubina-casu/')}>
            {uiT('footer.deepTime', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/galerie-triad/')}>
            {uiT('triads.title', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/poetika-svetu/')}>
            {uiT('narrPage.title', locale)}
          </a>
        </nav>
        <nav className="site-footer__col site-footer__col--chapters" aria-label={uiT('footer.chapters', locale)}>
          <h2 className="site-footer__heading">{uiT('footer.chapters', locale)}</h2>
          {FOOTER_CHAPTER_COLUMNS.map((ids) => (
            <div className="site-footer__chapter-col" key={ids.join('-')}>
              {ids.map((id) => {
                const chapter = chapters.find((item) => item.id === id);
                if (!chapter) return null;
                return (
                  <a
                    key={chapter.id}
                    className="site-footer__link"
                    href={withBase(base, `/chapters/${chapter.id}/`)}
                  >
                    {t(chapter.title, locale)}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>
        <nav className="site-footer__col" aria-label={uiT('footer.about', locale)}>
          <h2 className="site-footer__heading">{uiT('footer.about', locale)}</h2>
          <a className="site-footer__link" href={withBase(base, '/about/')}>
            {uiT('footer.aboutProject', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/notes/')}>
            {uiT('footer.method', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/anatomie-herniho-lore/')}>
            {uiT('footer.essay', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/teoreticke-zazemi/')}>
            {uiT('footer.theory', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/contact/')}>
            {uiT('footer.contact', locale)}
          </a>
          <a className="site-footer__link" href={withBase(base, '/rss.xml')} type="application/rss+xml">
            {uiT('footer.rss', locale)}
          </a>
        </nav>
      </div>
      <div className="site-footer__bottom">
        <p className="site-footer__copy">
          {uiT('footer.copyright', locale)}
          <span className="site-footer__dot" aria-hidden="true">
            ·
          </span>
          {uiT('footer.unofficial', locale)}
        </p>
        <p className="site-footer__disclaimer">{uiT('footer.disclaimer', locale)}</p>
      </div>
    </footer>
  );
}
