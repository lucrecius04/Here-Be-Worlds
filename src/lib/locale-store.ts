import { useSyncExternalStore } from 'react';
import { applyDomI18n, type Locale } from './i18n';

export const LOCALE_STORAGE_KEY = 'hbw_lang';
export const LOCALE_EVENT = 'hbw:locale';

export const DEFAULT_LOCALE: Locale = 'cs';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'cs') return stored;
  return DEFAULT_LOCALE;
}

let snapshot = readStoredLocale();
const listeners = new Set<() => void>();

export function getLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  return snapshot;
}

export function setLocale(locale: Locale): void {
  if (locale === snapshot) return;
  snapshot = locale;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.documentElement.lang = locale;
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }));
  applyDomI18n(locale);
  listeners.forEach((fn) => fn());
}

export function subscribeLocale(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const onWindow = (e: Event) => {
    const next = (e as CustomEvent<Locale>).detail;
    if (next === 'en' || next === 'cs') snapshot = next;
    onStoreChange();
  };
  window.addEventListener(LOCALE_EVENT, onWindow);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener(LOCALE_EVENT, onWindow);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, () => DEFAULT_LOCALE);
}

export function initLocaleFromStorage(): void {
  snapshot = readStoredLocale();
  document.documentElement.lang = snapshot;
}
