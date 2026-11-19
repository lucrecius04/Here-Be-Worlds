import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { AXIS_KEYS } from '../../lib/axes';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from './MiniAxes';

type Props = {
  world: World;
  locale: Locale;
  /** Úsporná verze pro karty katalogu: tenčí dílky, menší písmo. */
  compact?: boolean;
};

/**
 * Hodnota jednoho světa na pěti osách: pět dílků, svítí jen ten, na kterém svět leží,
 * a zvýrazněný je pól, ke kterému se kloní. Stejný jazyk jako Profil světa na spisu.
 */
export default function AxisBars({ world, locale, compact = false }: Props) {
  return (
    <div
      className={`axis-bars${compact ? ' axis-bars--compact' : ''}`}
      role="group"
      aria-label={uiT('card.profileWorld', locale)}
    >
      {AXIS_KEYS.map((key) => {
        const meta = axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
        const value = world.axes[key].value;
        const left = axisPoleLabel(meta, 'left', locale);
        const right = axisPoleLabel(meta, 'right', locale);
        const lean = value < 3 ? 'left' : value > 3 ? 'right' : null;
        return (
          <div
            key={key}
            className="axis-bars__row"
            role="img"
            aria-label={`${t(meta.left, locale)} ${value} / 5 ${t(meta.right, locale)}`}
            title={t(meta.help, locale)}
          >
            <span className={`axis-bars__pole${lean === 'left' ? ' is-lean' : ''}`}>{left}</span>
            <span className="axis-bars__cells" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((v) => (
                <i key={v} className={v === value ? 'is-on' : undefined} />
              ))}
            </span>
            <span className={`axis-bars__pole axis-bars__pole--right${lean === 'right' ? ' is-lean' : ''}`}>
              {right}
            </span>
          </div>
        );
      })}
    </div>
  );
}
