import type { World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import axesMeta from '../../../data/meta/axes.json';

type Props = { world: World; notesHref?: string };

export default function FiveAxes({ world, notesHref }: Props) {
  const locale = useLocale();

  return (
    <section className="axes-block" aria-label={uiT('card.axesAria', locale)}>
      <div className="axes-block__head">
        <h2 className="axes-block__title">{uiT('card.profileWorld', locale)}</h2>
        {notesHref ? (
          <a className="world-notes-link axes-block__notes" href={notesHref}>
            {uiT('world.howJudged', locale)}
          </a>
        ) : null}
      </div>
      {axesMeta.axes.map((axis) => {
        const key = axis.id as keyof World['axes'];
        const val = world.axes[key];
        const left = t(axis.left, locale);
        const right = t(axis.right, locale);
        const note = t(axis.help, locale);
        const lean = val.value < 3 ? 'left' : val.value > 3 ? 'right' : null;
        return (
          <div className="carto-axis" key={axis.id}>
            <div
              className="carto-axis__row"
              role="img"
              aria-label={`${left} ${val.value} / 5 ${right}`}
            >
              <span
                className={`carto-axis__pole carto-axis__pole--left${lean === 'left' ? ' carto-axis__pole--active' : lean === 'right' ? ' carto-axis__pole--dim' : ' carto-axis__pole--idle'}`}
              >
                {left}
              </span>
              <div className="carto-axis__track" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((tick) => {
                  const dist = Math.abs(tick - val.value);
                  const state = dist === 0 ? 'on' : dist === 1 ? 'near' : '';
                  return (
                    <span
                      key={tick}
                      className={`carto-axis__dot${state ? ` carto-axis__dot--${state}` : ''}`}
                    />
                  );
                })}
              </div>
              <span
                className={`carto-axis__pole carto-axis__pole--right${lean === 'right' ? ' carto-axis__pole--active' : lean === 'left' ? ' carto-axis__pole--dim' : ' carto-axis__pole--idle'}`}
              >
                {right}
              </span>
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
