import type { World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import axesMeta from '../../../data/meta/axes.json';

type Props = { world: World; notesHref?: string };

/** Profil světa: pět os po pěti dílcích, zvýrazněný dílek v barvě archetypu. */
export default function FiveAxes({ world, notesHref }: Props) {
  const locale = useLocale();

  return (
    <section className="wc-block wc-axes" aria-label={uiT('card.axesAria', locale)}>
      <div className="wc-axes__head">
        <h2 className="wc-label">{uiT('card.profileWorld', locale)}</h2>
        {notesHref ? (
          <a className="wc-axes__notes" href={notesHref}>
            {uiT('world.howJudged', locale)}
          </a>
        ) : null}
      </div>
      <div className="wc-axes__rows">
        {axesMeta.axes.map((axis) => {
          const key = axis.id as keyof World['axes'];
          const value = world.axes[key].value;
          const left = t(axis.left, locale);
          const right = t(axis.right, locale);
          const lean = value < 3 ? 'left' : value > 3 ? 'right' : null;
          return (
            <div
              className="wc-axis"
              key={axis.id}
              role="img"
              aria-label={`${left} ${value} / 5 ${right}`}
              title={t(axis.help, locale)}
            >
              <span className={`wc-axis__pole${lean === 'left' ? ' is-lean' : ''}`}>{left}</span>
              <span className="wc-axis__cells" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((tick) => (
                  <i key={tick} className={tick === value ? 'is-on' : undefined} />
                ))}
              </span>
              <span className={`wc-axis__pole wc-axis__pole--right${lean === 'right' ? ' is-lean' : ''}`}>
                {right}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
