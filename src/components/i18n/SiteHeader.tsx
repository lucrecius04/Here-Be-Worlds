import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

type Props = { base: string };

export default function SiteHeader({ base }: Props) {
  const locale = useLocale();

  return (
    <header className="site-header">
      <a href={base} className="site-header__brand">
        {uiT('siteName', locale)}
      </a>
      <div className="site-header__end">
        <nav className="site-nav" aria-label={locale === 'cs' ? 'Hlavní' : 'Main'}>
          <a href={base}>{uiT('nav.atlas', locale)}</a>
          <a href={`${base}compare/`}>{uiT('nav.compare', locale)}</a>
          <a href={`${base}map/`}>{uiT('nav.map', locale)}</a>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
