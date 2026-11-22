import type { CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldCountLabel } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { isMappedWorld } from '../../lib/atlas-news';
import { axisExtremes, axisSpread } from '../../lib/chapter-portrait';
import AxisRange from './AxisRange';
import WorldTeaser, { type WorldTeaserExtra } from './WorldTeaser';

type Props = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  lead?: LocalizedString;
  accent: { light: string; dark: string };
  worlds: World[];
  extras?: Record<string, WorldTeaserExtra>;
  themeLabels?: Record<string, LocalizedString>;
  base: string;
};

export default function ChapterPage({ id, title, thesis, lead, accent, worlds, extras, themeLabels, base }: Props) {
  const locale = useLocale();
  const hueVars = {
    '--chapter-hue-light': accent.light,
    '--chapter-hue-dark': accent.dark,
  } as CSSProperties;
  const mapped = worlds.filter(isMappedWorld);
  const spread = axisSpread(mapped);
  const extremes = spread ? axisExtremes(mapped, 3) : [];
  const thesisText = t(thesis, locale);
  const leadText = lead ? t(lead, locale) : '';

  return (
    <article className="chapter-page" data-chapter={id} style={hueVars}>
      <header className="chapter-hero page-band">
        <div className="chapter-hero__top">
          <p className="chapter-hero__kicker">{uiT('chapterPage.kicker', locale)}</p>
        </div>
        <div className="chapter-hero__grid">
          <div className="chapter-hero__identity">
            <h1 className="chapter-hero__title display">
              <span className="chapter-hero__name">{t(title, locale)}</span>
            </h1>
            <p className="chapter-hero__thesis">{thesisText}</p>
            {leadText && leadText !== thesisText ? (
              <p className="chapter-hero__lead">{leadText}</p>
            ) : null}
            <p className="chapter-hero__count">{worldCountLabel(mapped.length, locale)}</p>
          </div>
          {spread ? (
            <aside className="chapter-portrait" aria-label={uiT('chapterPage.portrait', locale)}>
              <p className="chapter-portrait__kicker">{uiT('chapterPage.portrait', locale)}</p>
              <AxisRange spread={spread} locale={locale} />
              {extremes.length > 0 ? (
                <ul className="chapter-portrait__extremes">
                  {extremes.map((item) => (
                    <li key={item.axisId}>
                      <span>{uiT(item.labelKey, locale)}</span>
                      <a href={withBase(base, `/worlds/${item.world.id}/`)}>
                        {t(item.world.gameTitle, locale)}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </aside>
          ) : null}
        </div>
      </header>
      {worlds.length === 0 ? (
        <p className="catalog-empty">{uiT('chapterPage.empty', locale)}</p>
      ) : (
        <div className="world-grid">
          {worlds.map((world) => (
            <WorldTeaser
              key={world.id}
              world={world}
              href={withBase(base, `/worlds/${world.id}/`)}
              locale={locale}
              extra={extras?.[world.id]}
              themeLabels={themeLabels}
            />
          ))}
        </div>
      )}
    </article>
  );
}
