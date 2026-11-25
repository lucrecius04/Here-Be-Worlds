import type { CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';

/** Svět v Galerii triád (všechny tři oddíly: prvotní hříchy, ústřední dilemata, hlavní tajemství). */
export type TriadWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  originalSin: LocalizedString;
  centralDilemma: LocalizedString;
  ultimateMystery: LocalizedString;
  /** Kotva oddílu Nosná mezera v Anatomii vyprávění (odkaz „Jak se to vykládá“ u tajemství). */
  mysteryAnchor?: string | null;
};

export type TriadChapter = { id: string; title: LocalizedString; short?: LocalizedString; accent: { light: string; dark: string } };

export const hueVars = (accent: { light: string; dark: string }) =>
  ({ '--tg-hue-l': accent.light, '--tg-hue-d': accent.dark }) as CSSProperties;
