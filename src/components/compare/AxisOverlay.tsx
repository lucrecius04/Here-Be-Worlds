import type { CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { AXIS_KEYS } from '../../lib/similarity';

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

export default function AxisOverlay({ worlds, hues, axes, locale }: Props) {
  return (
    <section className="compare-axes" aria-label={uiT('card.axesAria', locale)}>
      <h2 className="compare-section__title">{uiT('compare.axesTitle', locale)}</h2>
      <ul className="compare-legend">
        {worlds.map((world, index) => (
          <li key={world.id} className="compare-legend__item">
            <span
              className="compare-legend__mark"
              style={{ '--mark-hue': hues[index] } as CSSProperties}
              aria-hidden="true"
            />
            <span>{t(world.gameTitle, locale)}</span>
          </li>
        ))}
      </ul>
      {axes.map((axis) => {
        const key = axis.id as (typeof AXIS_KEYS)[number];
        const left = t(axis.left, locale);
        const right = t(axis.right, locale);
        const note = t(axis.help, locale);
        const marks = worlds.map((world, index) => ({
          id: world.id,
          value: world.axes[key].value,
          hue: hues[index],
          title: t(world.gameTitle, locale),
        }));
        return (
          <div className="overlay-axis" key={axis.id}>
            <div
              className="overlay-axis__row"
              role="img"
              aria-label={`${left} — ${marks.map((mark) => `${mark.title} ${mark.value}/5`).join(', ')} — ${right}`}
            >
              <span className="overlay-axis__pole overlay-axis__pole--left">{left}</span>
              <div className="overlay-axis__track" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((tick) => {
                  const here = marks.filter((mark) => mark.value === tick);
                  return (
                    <div key={tick} className="overlay-axis__cell">
                      {here.length === 0 ? <span className="overlay-axis__tick" /> : null}
                      {here.map((mark) => (
                        <span
                          key={mark.id}
                          className="overlay-axis__mark"
                          style={{ '--mark-hue': mark.hue } as CSSProperties}
                          title={`${mark.title}: ${mark.value}/5`}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
              <span className="overlay-axis__pole overlay-axis__pole--right">{right}</span>
            </div>
            <p className="overlay-axis__comment">
              <em>{note}</em>
            </p>
          </div>
        );
      })}
    </section>
  );
}
