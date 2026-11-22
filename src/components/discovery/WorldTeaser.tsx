import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';

/** Údaje ke světu, které se skládají při sestavení (kronika, putování). */
export type WorldTeaserExtra = {
  minutes: number;
  journeys: number;
};

const FACTS = [
  ['atmosphere', 'card.atmosphere'],
  ['historicalDepth', 'card.historicalDepth'],
  ['spatialScope', 'card.spatialScope'],
  ['sourceOfPower', 'card.sourceOfPower'],
] as const;

/**
 * Box světa na stránce archetypu (2026-11-22): název kroniky, název a podžánr, studio · roky · vesmír,
 * jádro, ústřední dilema, čtyři údaje charakteru, témata a dole odkazy na kroniku a putování.
 * Souřadnice záměrně ne (profil archetypu je v hlavičce stránky).
 */
export default function WorldTeaser({
  world,
  href,
  locale,
  extra,
  themeLabels,
}: {
  world: World;
  href: string;
  locale: Locale;
  extra?: WorldTeaserExtra;
  themeLabels?: Record<string, LocalizedString>;
}) {
  const genre = t(world.metadata.genreProfile, locale);
  const universe = (world.universe ?? []).slice(0, 2).map((u) => t(u, locale));
  const meta = [world.studios.join(', '), world.yearRange, universe.join(', ')].filter(Boolean).join(' · ');
  const dilemma = t(world.triad.centralDilemma, locale);
  const themes = themeLabels
    ? world.themes.slice(0, 4).map((slug) => (themeLabels[slug] ? t(themeLabels[slug], locale) : slug))
    : [];
  const selected = useCompareTray().includes(world.id);
  const journeys = extra?.journeys ?? 0;

  return (
    <article className="world-teaser">
      <div className="world-teaser__top">
        <span className="world-teaser__chronicle">{t(world.chronicleTitle, locale)}</span>
        <button
          type="button"
          className={`catalog-card__compare${selected ? ' catalog-card__compare--on' : ''}`}
          aria-pressed={selected}
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
        {meta ? <p className="world-teaser__meta">{meta}</p> : null}
        <p className="world-teaser__core">{t(world.core, locale)}</p>
        {dilemma ? (
          <div className="world-teaser__dilemma">
            <span className="world-teaser__label">{uiT('card.centralDilemma', locale)}</span>
            <p>{dilemma}</p>
          </div>
        ) : null}
        <dl className="world-teaser__facts">
          {FACTS.map(([field, label]) => {
            const value = t(world.metadata[field], locale);
            return value ? (
              <div key={field}>
                <dt className="world-teaser__label">{uiT(label, locale)}</dt>
                <dd>{value}</dd>
              </div>
            ) : null;
          })}
        </dl>
        {themes.length ? (
          <p className="world-teaser__themes" aria-label={uiT('card.themesHeading', locale)}>
            {themes.join(' · ')}
          </p>
        ) : null}
      </a>
      <div className="world-teaser__foot">
        <a href={`${href}?view=chronicle`}>
          {uiT('chapterPage.chronicleLink', locale).replace('{m}', String(extra?.minutes ?? ''))}
          <span aria-hidden="true"> →</span>
        </a>
        {journeys > 0 ? (
          <a href={`${href}?view=journeys`}>
            {uiT(journeys === 1 ? 'chapterPage.journeysOne' : 'chapterPage.journeysMany', locale).replace(
              '{n}',
              String(journeys),
            )}
            <span aria-hidden="true"> →</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}
