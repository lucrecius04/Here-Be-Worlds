import type { CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';
import AxisBars from './AxisBars';

type Props = {
  world: World;
  locale: Locale;
  base: string;
  themeLabels: Record<string, LocalizedString>;
  accent?: { light: string; dark: string };
  isNew?: boolean;
};

export default function CatalogWorldCard({
  world,
  locale,
  base,
  themeLabels,
  accent,
  isNew = false,
}: Props) {
  const genre = t(world.metadata.genreProfile, locale);
  const universe = world.universe?.[0] ? t(world.universe[0], locale) : '';
  const meta = [universe, genre].filter(Boolean).join(' · ');
  const href = withBase(base, `/worlds/${world.id}/`);
  const selected = useCompareTray().includes(world.id);
  const hueVars = accent
    ? ({
        '--chapter-hue-light': accent.light,
        '--chapter-hue-dark': accent.dark,
      } as CSSProperties)
    : undefined;

  return (
    <article className="catalog-card" style={hueVars}>
      <div className="catalog-card__top">
        <span className="catalog-card__meta">
          {isNew ? <span className="catalog-card__new">{uiT('home.newEntry', locale)}</span> : null}
          {meta}
        </span>
        <button
          type="button"
          className={`catalog-card__compare${selected ? ' catalog-card__compare--on' : ''}`}
          aria-pressed={selected}
          onClick={() => toggleCompareTray(world.id)}
        >
          {selected ? uiT('home.compareIn', locale) : uiT('home.compareAdd', locale)}
        </button>
      </div>
      <a className="catalog-card__body" href={href}>
        <h3 className="catalog-card__title">{t(world.gameTitle, locale)}</h3>
        <p className="catalog-card__core">{t(world.core, locale)}</p>
        <AxisBars world={world} locale={locale} compact />
      </a>
      {world.themes.length ? (
        <p className="catalog-card__themes" aria-label={uiT('card.themesHeading', locale)}>
          {world.themes.map((slug, i) => (
            <span key={slug}>
              {i > 0 ? <span className="catalog-card__sep" aria-hidden="true"> · </span> : null}
              <a href={withBase(base, `/atlas/?theme=${encodeURIComponent(slug)}`)}>
                {themeLabels[slug] ? t(themeLabels[slug], locale) : slug}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </article>
  );
}
