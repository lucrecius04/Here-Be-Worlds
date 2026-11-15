import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';

export default function WorldTeaser({
  world,
  href,
  locale,
}: {
  world: World;
  href: string;
  locale: Locale;
}) {
  const genre = t(world.metadata.genreProfile, locale);
  const mood = t(world.metadata.atmosphere, locale);
  const selected = useCompareTray().includes(world.id);

  return (
    <article className="world-teaser">
      <div className="world-teaser__top">
        <button
          type="button"
          className={`catalog-card__compare${selected ? ' catalog-card__compare--on' : ''}`}
          onClick={() => toggleCompareTray(world.id)}
        >
          {selected ? uiT('home.compareIn', locale) : uiT('home.compareAdd', locale)}
        </button>
      </div>
      <a href={href} className="world-teaser__body">
        <h3 className="world-teaser__title">
          {t(world.gameTitle, locale)}
          {genre ? <span className="world-teaser__genre"> ({genre})</span> : null}
        </h3>
        <p className="world-teaser__meta">{[world.yearRange, mood].filter(Boolean).join(' · ')}</p>
        <p className="world-teaser__core">{t(world.core, locale)}</p>
      </a>
    </article>
  );
}
