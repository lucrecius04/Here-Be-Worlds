import { useSyncExternalStore } from 'react';

export const THEME_STORAGE_KEY = 'hbw_theme';
export const THEME_EVENT = 'hbw:theme';

export type Theme = 'light' | 'dark';

export const DEFAULT_THEME: Theme = 'dark';

/** Uložená volba čtenáře; bez ní systémové nastavení (prefers-color-scheme). */
function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

let snapshot = readStoredTheme();
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  snapshot = readStoredTheme();
  return snapshot;
}

export function setTheme(theme: Theme): void {
  if (theme === snapshot) return;
  snapshot = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
  listeners.forEach((fn) => fn());
}

export function subscribeTheme(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  const onWindow = (e: Event) => {
    const next = (e as CustomEvent<Theme>).detail;
    if (next === 'light' || next === 'dark') snapshot = next;
    onStoreChange();
  };
  window.addEventListener(THEME_EVENT, onWindow);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener(THEME_EVENT, onWindow);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, getTheme, () => DEFAULT_THEME);
}

export function initThemeFromStorage(): void {
  snapshot = readStoredTheme();
  applyTheme(snapshot);
}
