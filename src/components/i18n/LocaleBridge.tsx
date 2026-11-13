import { useEffect } from 'react';
import { applyDomI18n } from '../../lib/i18n';
import { initLocaleFromStorage, useLocale } from '../../lib/locale-store';

/** Keeps `data-i18n` nodes in Astro markup in sync with the active locale. */
export default function LocaleBridge() {
  const locale = useLocale();

  useEffect(() => {
    initLocaleFromStorage();
    applyDomI18n(locale);
  }, [locale]);

  return null;
}
