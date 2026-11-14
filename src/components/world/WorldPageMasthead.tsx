import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';

type Props = {
  base: string;
  world: World;
  chapterTitle?: LocalizedString;
};

export default function WorldPageMasthead({ base, world, chapterTitle }: Props) {
  const locale = useLocale();

  return (
    <header className="world-card__header">
      <div className="world-card__kicker">
        {chapterTitle ? (
          <p className="world-card__genre">
            {uiT('world.genreLine', locale)}: {t(chapterTitle, locale)}
          </p>
        ) : (
          <span />
        )}
        <a href={withBase(base, '/')} className="world-back__link">
          ← {uiT('world.backToAtlas', locale)}
        </a>
      </div>
      <div className="world-card__title-row">
        <h1 className="world-card__title display">{t(world.gameTitle, locale)}</h1>
        <p className="world-card__byline">
          {world.studios.join(' · ')} · {world.yearRange}
        </p>
      </div>
      <p className="world-card__canon">
        <span className="world-card__canon-label">{uiT('world.canonScope', locale)}</span>
        <span className="world-card__canon-value">{t(world.canonScope, locale)}</span>
      </p>
    </header>
  );
}
