import type { CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
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

  return (
    <article className="chapter-page" data-chapter={id} style={hueVars}>
      <header className="chapter-hero">
        <div className="chapter-hero__top">
          <h1 className="chapter-hero__title display">
            <span className="chapter-hero__kicker">{uiT('chapterPage.kicker', locale)}:</span>
            <span className="chapter-hero__name">{t(title, locale)}</span>
          </h1>
          <a className="chapter-hero__back" href={home}>
            {uiT('chapterPage.back', locale)}
          </a>
        </div>
        <p className="chapter-hero__thesis">{t(lead ?? thesis, locale)}</p>
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
