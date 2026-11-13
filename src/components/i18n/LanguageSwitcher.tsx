import { useLocale, setLocale } from '../../lib/locale-store';
import type { Locale } from '../../lib/i18n';

export default function LanguageSwitcher() {
  const locale = useLocale();

  const pick = (next: Locale) => {
    if (next !== locale) setLocale(next);
  };

  return (
    <div className="lang-switch" role="group" aria-label={locale === 'cs' ? 'Jazyk' : 'Language'}>
      <button
        type="button"
        className={`lang-switch__btn${locale === 'cs' ? ' lang-switch__btn--active' : ''}`}
        aria-pressed={locale === 'cs'}
        onClick={() => pick('cs')}
      >
        CZ
      </button>
      <span className="lang-switch__sep" aria-hidden="true">
        |
      </span>
      <button
        type="button"
        className={`lang-switch__btn${locale === 'en' ? ' lang-switch__btn--active' : ''}`}
        aria-pressed={locale === 'en'}
        onClick={() => pick('en')}
      >
        EN
      </button>
    </div>
  );
}
