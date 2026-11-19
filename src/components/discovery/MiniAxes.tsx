/** Krátké názvy pólů os pro úsporné zobrazení (pruh os, mapa, kompas). */
import { t, type Locale } from '../../lib/i18n';
import axesMeta from '../../../data/meta/axes.json';

const SHORT_POLES: Record<string, { left: { cs: string; en: string }; right: { cs: string; en: string } }> = {
  moralClarityAmbiguity: {
    left: { cs: 'Jednoznačné', en: 'Absolute' },
    right: { cs: 'Komplexní', en: 'Complex' },
  },
};

export function axisPoleLabel(
  axis: (typeof axesMeta.axes)[number],
  side: 'left' | 'right',
  locale: Locale,
): string {
  const compact = SHORT_POLES[axis.id];
  if (compact) return compact[side][locale];
  return t(axis[side], locale);
}
