import type { World } from '../../schemas/world';
import { t, type Locale } from '../../lib/i18n';
import type { AxisValues } from '../../lib/imprint';
import axesMeta from '../../../data/meta/axes.json';

type Props = {
  world?: World;
  values?: AxisValues;
  locale: Locale;
  variant?: 'dots' | 'strips';
};

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

export default function MiniAxes({ world, values, locale, variant = 'dots' }: Props) {
  const readValue = (key: keyof World['axes']) => values?.[key] ?? world?.axes[key].value;
  if (variant === 'strips') {
    return (
      <div className="mini-axes mini-axes--strips">
        {axesMeta.axes.map((axis) => {
          const key = axis.id as keyof World['axes'];
          const value = readValue(key);
          if (value == null) return null;
          const left = t(axis.left, locale);
          const right = t(axis.right, locale);
          const tip = `${left} ↔ ${right} (${value}/5): ${t(axis.help, locale)}`;
          return (
            <div
              key={axis.id}
              className="mini-axes__strip-row"
              title={tip}
              data-tip={tip}
            >
              <span className="mini-axes__pole mini-axes__pole--left">
                {axisPoleLabel(axis, 'left', locale)}
              </span>
              <span className="mini-axes__strip">
                <span
                  className="mini-axes__strip-mark"
                  style={{ left: `${((value - 1) / 4) * 100}%` }}
                />
              </span>
              <span className="mini-axes__pole mini-axes__pole--right">
                {axisPoleLabel(axis, 'right', locale)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mini-axes mini-axes--dots" aria-hidden="true">
      {axesMeta.axes.map((axis) => {
        const key = axis.id as keyof World['axes'];
        const value = readValue(key);
        if (value == null) return null;
        return (
          <div key={axis.id} className="mini-axes__row">
            <span className="mini-axes__pole mini-axes__pole--left">
              {axisPoleLabel(axis, 'left', locale)}
            </span>
            <span className="mini-axes__track">
              {[1, 2, 3, 4, 5].map((tick) => {
                const dist = Math.abs(tick - value);
                const state = dist === 0 ? 'on' : dist === 1 ? 'near' : '';
                return (
                  <span
                    key={tick}
                    className={`mini-axes__tick${state ? ` mini-axes__tick--${state}` : ''}`}
                  />
                );
              })}
            </span>
            <span className="mini-axes__pole mini-axes__pole--right">
              {axisPoleLabel(axis, 'right', locale)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
