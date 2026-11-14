import { useEffect } from 'react';
import { useLocale } from '../../lib/locale-store';
import { initThemeFromStorage, setTheme, useTheme, type Theme } from '../../lib/theme-store';
import { uiT } from '../../lib/i18n';

export default function ThemeSwitcher() {
  const locale = useLocale();
  const theme = useTheme();

  useEffect(() => {
    initThemeFromStorage();
  }, []);

  const pick = (next: Theme) => {
    if (next !== theme) setTheme(next);
  };

  return (
    <div className="theme-switch" role="group" aria-label={uiT('theme.group', locale)}>
      <button
        type="button"
        className="theme-switch__btn"
        data-theme-pick="light"
        aria-pressed={theme === 'light'}
        aria-label={uiT('theme.light', locale)}
        title={uiT('theme.light', locale)}
        onClick={() => pick('light')}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className="theme-switch__btn"
        data-theme-pick="dark"
        aria-pressed={theme === 'dark'}
        aria-label={uiT('theme.dark', locale)}
        title={uiT('theme.dark', locale)}
        onClick={() => pick('dark')}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg className="theme-switch__icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21M5.64 5.64l1.13 1.13M17.23 17.23l1.13 1.13M5.64 18.36l1.13-1.13M17.23 6.77l1.13-1.13"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-switch__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.5A8.2 8.2 0 1 1 9.5 4 6.4 6.4 0 0 0 20 14.5z"
      />
    </svg>
  );
}
