import type { CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { AXIS_KEYS } from '../../lib/axes';
import { farthestAxis } from '../../lib/compare';

type AxisMeta = {
  id: string;
  left: LocalizedString;
  right: LocalizedString;
  help: LocalizedString;
};

type Props = {
  worlds: World[];
  hues: string[];
  axes: AxisMeta[];
  locale: Locale;
};

/** Poloha víc světů na stupnici 1–5: kosočtverce v barvách srovnání, mezi krajními světy tenký pás rozpětí. */
export default function AxisOverlay({ worlds, hues, axes, locale }: Props) {
  const widest = farthestAxis(worlds);
  return (
    <div className="cmp-rows cmp-axes" aria-label={uiT('card.axesAria', locale)}>
      {axes.map((axis) => {
        const key = axis.id as (typeof AXIS_KEYS)[number];
        const name = uiT(`map.name${key.charAt(0).toUpperCase()}${key.slice(1)}`, locale);
        const left = t(axis.left, locale);
        const right = t(axis.right, locale);
        const marks = worlds.map((world, index) => ({
          id: world.id,
          value: world.axes[key].value,
          hue: hues[index],
          title: t(world.gameTitle, locale),
        }));
        const values = marks.map((mark) => mark.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const isWidest = Boolean(widest && widest.key === key && widest.spread >= 2);
        const pos = (value: number) => `${((value - 1) / 4) * 100}%`;
        return (
          <div key={axis.id} className={`cmp-grid cmp-row cmp-axis${isWidest ? ' is-widest' : ''}`} title={t(axis.help, locale)}>
            <div className="cmp-grid__label">
              {name}
              {isWidest ? <span className="cmp-axis__tag">{uiT('compare.biggestGap', locale)}</span> : null}
            </div>
            <div
              className="cmp-axis__body"
              role="img"
              aria-label={`${name}: ${left} — ${marks.map((mark) => `${mark.title} ${mark.value}/5`).join(', ')} — ${right}`}
            >
              <span className={`cmp-axis__pole${min <= 2 ? ' is-near' : ''}`}>{left}</span>
              <span className="cmp-axis__track" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((tick) => (
                  <i key={tick} className="cmp-axis__tick" style={{ left: pos(tick) }} />
                ))}
                {max > min ? (
                  <span className="cmp-axis__span" style={{ left: pos(min), width: `${((max - min) / 4) * 100}%` }} />
                ) : null}
                {marks.map((mark, index) => {
                  const same = marks.filter((other) => other.value === mark.value);
                  const order = same.findIndex((other) => other.id === mark.id);
                  const shift = (order - (same.length - 1) / 2) * 0.85;
                  return (
                    <span
                      key={mark.id}
                      className="cmp-axis__mark"
                      style={
                        {
                          left: pos(mark.value),
                          '--slot-hue': mark.hue,
                          '--shift': `${shift}rem`,
                          zIndex: 3 + index,
                        } as CSSProperties
                      }
                      title={`${mark.title}: ${mark.value}/5`}
                    />
                  );
                })}
              </span>
              <span className={`cmp-axis__pole cmp-axis__pole--right${max >= 4 ? ' is-near' : ''}`}>{right}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
