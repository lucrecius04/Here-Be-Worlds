import { t, uiT, type Locale } from '../../lib/i18n';
import { AXIS_KEYS } from '../../lib/axes';
import type { AxisSpread } from '../../lib/chapter-portrait';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from './MiniAxes';

type Props = {
  spread: AxisSpread;
  locale: Locale;
  /** Volitelné srovnání (např. průměr celého atlasu na stránce tématu): prázdný kosočtverec. */
  reference?: Record<string, number>;
};

const pos = (value: number) => `${((value - 1) / 4) * 100}%`;

/**
 * Profil skupiny světů na stupnici 1–5: kosočtverec = průměr, pás = rozpětí od nejnižšího
 * po nejvyšší svět. Stejný jazyk jako srovnání (poloha na stupnici), ne pruh jednoho světa.
 */
export default function AxisRange({ spread, locale, reference }: Props) {
  return (
    <div className="axis-range" role="group" aria-label={uiT('chapterPage.portrait', locale)}>
      {AXIS_KEYS.map((key) => {
        const meta = axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
        const { mean, min, max } = spread[key];
        const lean = mean < 2.75 ? 'left' : mean > 3.25 ? 'right' : null;
        const meanLabel = mean.toLocaleString(locale === 'cs' ? 'cs-CZ' : 'en-GB', { maximumFractionDigits: 1 });
        return (
          <div
            key={key}
            className="axis-range__row"
            role="img"
            aria-label={`${t(meta.left, locale)} ↔ ${t(meta.right, locale)}: ${meanLabel} / 5 (${min}–${max})`}
            title={t(meta.help, locale)}
          >
            <span className={`axis-range__pole${lean === 'left' ? ' is-lean' : ''}`}>
              {axisPoleLabel(meta, 'left', locale)}
            </span>
            <span className="axis-range__track" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((tick) => (
                <i key={tick} className="axis-range__tick" style={{ left: pos(tick) }} />
              ))}
              {max > min ? (
                <span className="axis-range__band" style={{ left: pos(min), width: `calc(${pos(max)} - ${pos(min)})` }} />
              ) : null}
              {reference?.[key] !== undefined ? (
                <span className="axis-range__ref" style={{ left: pos(reference[key]) }} />
              ) : null}
              <span className="axis-range__mark" style={{ left: pos(mean) }} />
            </span>
            <span className={`axis-range__pole axis-range__pole--right${lean === 'right' ? ' is-lean' : ''}`}>
              {axisPoleLabel(meta, 'right', locale)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
