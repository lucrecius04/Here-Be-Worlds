import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';

type Props = {
  base: string;
  world: World;
  chapterTitle?: LocalizedString;
};

/** Hlavička spisu světa: drobečky, záložka archetypu, velký název a kartotéční údaje. */
export default function WorldPageMasthead({ base, world, chapterTitle }: Props) {
  const locale = useLocale();
  const universe = (world.universe ?? []).map((name) => t(name, locale)).filter(Boolean);
  const genre = t(world.metadata.genreProfile, locale);
  const genreSub = world.metadata.genreProfile.sub ? t(world.metadata.genreProfile.sub, locale) : '';
  const chronicleTitle = t(world.chronicleTitle, locale);
  const facts = [
    world.studios.length ? { label: uiT('world.studio', locale), value: world.studios.join(' · ') } : null,
    world.yearRange ? { label: uiT('world.years', locale), value: world.yearRange } : null,
    universe.length ? { label: uiT('world.universe', locale), value: universe.join(' · ') } : null,
    { label: uiT('world.canonScope', locale), value: t(world.canonScope, locale) },
  ].filter((item): item is { label: string; value: string } => Boolean(item && item.value));
  const archetype = chapterTitle ? t(chapterTitle, locale) : '';

  return (
    <header className="wp-head">
      <p className="wp-head__crumbs">
        <a href={withBase(base, '/atlas/')}>{uiT('nav.atlas', locale)}</a>
        {archetype ? (
          <>
            <span aria-hidden="true">/</span>
            <a href={withBase(base, `/chapters/${world.chapterId}/`)}>{archetype}</a>
          </>
        ) : null}
      </p>
      <span className="wp-head__tab">
        {genre}
        {genreSub ? ` · ${genreSub}` : ''}
      </span>
      <div className="wp-head__main">
        <div className="wp-head__titles">
          <h1 className="wp-head__title">{t(world.gameTitle, locale)}</h1>
          {chronicleTitle ? <p className="wp-head__chronicle">{chronicleTitle}</p> : null}
        </div>
        <dl className="wp-head__facts">
          {facts.map((fact) => (
            <div key={fact.label} className="wp-head__fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
