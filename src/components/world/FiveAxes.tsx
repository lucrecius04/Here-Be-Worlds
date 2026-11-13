import type { World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import axesMeta from '../../../data/meta/axes.json';

type Props = { world: World };

export default function FiveAxes({ world }: Props) {
  const locale = useLocale();

  return (
    <section className="axes-block" aria-label={uiT('card.axesAria', locale)}>
      <h2 className="axes-block__title display">{uiT('card.profileWorld', locale)}</h2>
      {axesMeta.axes.map((axis) => {
        const key = axis.id as keyof World['axes'];
        const val = world.axes[key];
        const left = t(axis.left, locale);
        const right = t(axis.right, locale);
        const markerPct = ((val.value - 1) / 4) * 100;
        const note = t(axis.help, locale);
        return (
          <div className="carto-axis" key={axis.id}>
            <div className="carto-axis__poles">
              <span className="carto-axis__pole carto-axis__pole--left">{left}</span>
              <span className="carto-axis__pole carto-axis__pole--right">{right}</span>
            </div>
            <div className="carto-axis__track" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((tick) => (
                <span
                  key={tick}
                  className={`carto-axis__tick${tick === 3 ? ' carto-axis__tick--mid' : ''}`}
                  style={{ left: `${((tick - 1) / 4) * 100}%` }}
                />
              ))}
              <span className="carto-axis__marker" style={{ left: `${markerPct}%` }} />
            </div>
            <p className="carto-axis__comment">
              <em>{note}</em>
            </p>
          </div>
        );
      })}
    </section>
  );
}
