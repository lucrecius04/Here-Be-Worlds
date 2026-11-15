import type { CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldCountLabel } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { isMappedWorld } from '../../lib/atlas-news';
import { axisExtremes, meanAxes } from '../../lib/chapter-portrait';
import { chapterRoman } from './ChapterEmblem';
import MiniAxes from './MiniAxes';
import WorldTeaser from './WorldTeaser';

type Props = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  lead?: LocalizedString;
  accent: { light: string; dark: string };
  worlds: World[];
  base: string;
};

export default function ChapterPage({ id, title, thesis, lead, accent, worlds, base }: Props) {
  const locale = useLocale();
  const hueVars = {
    '--chapter-hue-light': accent.light,
    '--chapter-hue-dark': accent.dark,
  } as CSSProperties;
  const home = withBase(base, '/');
  const mapped = worlds.filter(isMappedWorld);
  const mean = mapped.length > 0 ? meanAxes(mapped) : null;
  const extremes = mean ? axisExtremes(mapped, 3) : [];
  const thesisText = t(thesis, locale);
  const leadText = lead ? t(lead, locale) : '';

  return (
    <article className="chapter-page" data-chapter={id} style={hueVars}>
      <header className="chapter-hero">
        <div className="chapter-hero__top">
          <p className="chapter-hero__kicker">{uiT('chapterPage.kicker', locale)}</p>
          <a className="chapter-hero__back" href={home}>
            {uiT('chapterPage.back', locale)}
          </a>
        </div>
        <div className="chapter-hero__grid">
          <div className="chapter-hero__identity">
            <p className="chapter-hero__roman" aria-hidden="true">
              {chapterRoman(id)}
            </p>
            <h1 className="chapter-hero__title display">
              <span className="chapter-hero__name">{t(title, locale)}</span>
            </h1>
            <p className="chapter-hero__thesis">{thesisText}</p>
            {leadText && leadText !== thesisText ? (
              <p className="chapter-hero__lead">{leadText}</p>
            ) : null}
            <p className="chapter-hero__count">{worldCountLabel(mapped.length, locale)}</p>
          </div>
          {mean ? (
            <aside className="chapter-portrait" aria-label={uiT('chapterPage.portrait', locale)}>
              <p className="chapter-portrait__kicker">{uiT('chapterPage.portrait', locale)}</p>
              <MiniAxes values={mean} locale={locale} variant="dots" />
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
            />
          ))}
        </div>
      )}
    </article>
  );
}
