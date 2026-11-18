import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

type Props = { base: string };

export default function SiteHeader({ base }: Props) {
  const locale = useLocale();

  return (
    <header className="site-header">
      <a href={withBase(base, '/')} className="site-header__brand">
        <span className="site-header__name">{uiT('siteName', locale)}</span>
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
