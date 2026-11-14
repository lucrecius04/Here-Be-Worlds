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
  const universe = (world.universe ?? []).map((name) => t(name, locale)).filter(Boolean);
  const facts = [
    chapterTitle
      ? {
          label: uiT('world.genreLine', locale),
          value: t(chapterTitle, locale),
          href: withBase(base, `/chapters/${world.chapterId}/`),
        }
      : null,
    universe.length
      ? { label: uiT('world.universe', locale), value: universe.join(' · ') }
      : null,
    { label: uiT('world.canonScope', locale), value: t(world.canonScope, locale) },
  ].filter((item): item is { label: string; value: string; href?: string } => Boolean(item));

  return (
    <header className="world-card__header">
      <div className="world-card__kicker">
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
      <p className="world-card__facts">
        {facts.map((fact, index) => (
          <span key={fact.label} className="world-card__fact-wrap">
            {index > 0 ? (
              <span className="world-card__fact-dot" aria-hidden="true">
                ·
              </span>
            ) : null}
            <span className="world-card__fact">
              <span className="world-card__canon-label">{fact.label}</span>
              {fact.href ? (
                <a className="world-card__canon-value world-card__canon-link" href={fact.href}>
                  {fact.value}
                </a>
              ) : (
                <span className="world-card__canon-value">{fact.value}</span>
              )}
            </span>
          </span>
        ))}
      </p>
    </header>
  );
}
