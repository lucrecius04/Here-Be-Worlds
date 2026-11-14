import type { World } from '../../schemas/world';
import { t, type Locale } from '../../lib/i18n';

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

  return (
    <a href={href} className="world-teaser">
      <h3 className="world-teaser__title">
        {t(world.gameTitle, locale)}
        {genre ? <span className="world-teaser__genre"> ({genre})</span> : null}
      </h3>
      <p className="world-teaser__meta">{[world.yearRange, mood].filter(Boolean).join(' · ')}</p>
      <p className="world-teaser__core">{t(world.core, locale)}</p>
    </a>
  );
}
