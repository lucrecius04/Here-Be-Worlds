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

  // Na titulní straně hlavička splývá s nočním pásem; po posunu ji od obsahu oddělí linka.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <a href={withBase(base, '/')} className="site-header__brand" aria-label={uiT('siteName', locale)}>
        <BrandMark size={28} className="brand-mark site-header__mark" />
        <Wordmark className="site-header__name" />
        <span className="site-header__tagline">{uiT('footer.tagline', locale)}</span>
      </a>
      <div className="site-header__end">
        <nav className="site-nav" aria-label={locale === 'cs' ? 'Hlavní' : 'Main'}>
          <a href={withBase(base, '/atlas/')}>{uiT('nav.atlas', locale)}</a>
          <a href={withBase(base, '/compare/')}>{uiT('nav.compare', locale)}</a>
          <a href={withBase(base, '/map/')}>{uiT('nav.map', locale)}</a>
          <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('nav.essay', locale)}</a>
        </nav>
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
    </header>
  );
}
