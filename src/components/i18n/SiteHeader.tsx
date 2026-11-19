import { useEffect, useState } from 'react';
import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import BrandMark, { Wordmark } from './BrandMark';

type Props = { base: string };

export default function SiteHeader({ base }: Props) {
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Mobilní menu: zavře se Escapem, klikem mimo hlavičku a při rozšíření okna na desktop.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element | null)?.closest('.site-header')) setMenuOpen(false);
    };
    const wide = window.matchMedia('(min-width: 721px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    wide.addEventListener('change', onWide);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  // Na titulní straně hlavička splývá s nočním pásem; po posunu ji od obsahu oddělí linka.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${menuOpen ? ' is-menu-open' : ''}`}>
      <a href={withBase(base, '/')} className="site-header__brand" aria-label={uiT('siteName', locale)}>
        <BrandMark size={28} className="brand-mark site-header__mark" />
        <Wordmark className="site-header__name" />
        <span className="site-header__tagline">{uiT('footer.tagline', locale)}</span>
      </a>
      <div className="site-header__end">
        {/* Na desktopu řádek odkazů a jazyků; na mobilu rozbalovací panel pod hlavičkou. */}
        <div id="site-menu" className="site-menu">
          <nav className="site-nav" aria-label={locale === 'cs' ? 'Hlavní' : 'Main'}>
            <a href={withBase(base, '/atlas/')}>{uiT('nav.atlas', locale)}</a>
            <a href={withBase(base, '/compare/')}>{uiT('nav.compare', locale)}</a>
            <a href={withBase(base, '/map/')}>{uiT('nav.map', locale)}</a>
            <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('nav.essay', locale)}</a>
          </nav>
          <LanguageSwitcher />
        </div>
        <ThemeSwitcher />
        <button
          type="button"
          className="site-header__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={uiT(menuOpen ? 'nav.menuClose' : 'nav.menuOpen', locale)}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
