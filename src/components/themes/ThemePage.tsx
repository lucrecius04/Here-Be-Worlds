import { useState, type CSSProperties } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { countWord, t, uiT, worldsCountLabel } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import type { AxisSpread } from '../../lib/chapter-portrait';
import type { ThemeChapter, ThemeJourney, ThemeLink, ThemeSkyData, ThemeWorld } from '../../lib/theme-pages';
import { THEMES_PATH } from '../../lib/themes';
import AxisRange from '../discovery/AxisRange';
import ThemeSky from './ThemeSky';
import '../../styles/chapter.css';
import '../../styles/themes.css';

type Props = {
  base: string;
  theme: ThemeLink & { question: LocalizedString };
  worlds: ThemeWorld[];
  chapters: ThemeChapter[];
  sky: ThemeSkyData;
  spread: AxisSpread | null;
  atlasMean: Record<string, number>;
  journeys: ThemeJourney[];
  neighbours: Array<ThemeLink & { shared: number }>;
};

export const hueVars = (accent: { light: string; dark: string }) =>
  ({ '--th-hue-l': accent.light, '--th-hue-d': accent.dark }) as CSSProperties;

export default function ThemePage({ base, theme, worlds, chapters, sky, spread, atlasMean, journeys, neighbours }: Props) {
  const locale = useLocale();
  // Najetí na svět nebo archetyp rozsvítí jeho hvězdy na obloze v hlavičce.
  const [active, setActive] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string | null>(null);
  const chapterShort = (id: string) => t(chapters.find((c) => c.id === id)?.short ?? { cs: id, en: id }, locale);
  const present = chapters.filter((c) => worlds.some((w) => w.chapterId === c.id));
  const lit = new Set(
    active ? [active] : activeChapter ? worlds.filter((w) => w.chapterId === activeChapter).map((w) => w.id) : [],
  );

  const stats = [
    worldsCountLabel(worlds.length, locale),
    countWord(present.length, ['archetyp', 'archetypy', 'archetypů'], ['archetype', 'archetypes'], locale),
    journeys.length ? uiT('themesPage.journeysCount', locale).replace('{n}', String(journeys.length)) : null,
  ].filter(Boolean);

  return (
    <article className="th-page">
      <header className="page-band th-head">
        <div className="th-head__text">
          <p className="doc-kicker">
            <a href={withBase(base, THEMES_PATH)}>{uiT('themesPage.kicker', locale)}</a>
          </p>
          <h1 className="doc-title">{t(theme.label, locale)}</h1>
          <p className="th-head__question">{t(theme.question, locale)}</p>
          <p className="th-head__stats">{stats.join(' · ')}</p>
        </div>
        <ThemeSky
          sky={sky}
          base={base}
          locale={locale}
          label={uiT('themesPage.sky', locale)}
          highlight={lit}
          onHover={setActive}
        />
      </header>

      <section className="th-section th-section--first" aria-labelledby="th-worlds">
        <h2 className="th-section__title" id="th-worlds">
          {uiT('themesPage.worlds', locale)}
        </h2>
        <ul className="th-worlds">
          {worlds.map((w) => (
            <li
              key={w.id}
              className={`th-world${lit.size && !lit.has(w.id) ? ' is-dim' : ''}`}
              style={hueVars(w.accent)}
              onMouseEnter={() => setActive(w.id)}
              onMouseLeave={() => setActive(null)}
            >
              <p className="th-world__name">
                <a href={withBase(base, `/worlds/${w.id}/`)} onFocus={() => setActive(w.id)} onBlur={() => setActive(null)}>
                  {t(w.title, locale)}
                </a>
              </p>
              <p className="th-world__arch">
                {chapterShort(w.chapterId)} · {t(w.genre, locale)}
              </p>
              <p className="th-world__core">{t(w.core, locale)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="th-section th-shape" aria-labelledby="th-shape">
        <h2 className="th-section__title" id="th-shape">
          {uiT('themesPage.shape', locale)}
        </h2>
        <div className="th-shape__grid">
          <div>
            <h3 className="th-sub">{uiT('themesPage.archetypes', locale)}</h3>
            <ul className="th-arch">
              {chapters
                .filter((c) => c.total > 0)
                .map((c) => {
                  const n = worlds.filter((w) => w.chapterId === c.id).length;
                  return (
                    <li
                      key={c.id}
                      className={`th-arch__row${n ? '' : ' is-empty'}`}
                      style={hueVars(c.accent)}
                      onMouseEnter={() => n && setActiveChapter(c.id)}
                      onMouseLeave={() => setActiveChapter(null)}
                    >
                      <span className="th-arch__name">{t(c.short, locale)}</span>
                      <span
                        className="th-arch__cells"
                        role="img"
                        aria-label={uiT('themesPage.ofArchetype', locale).replace('{n}', String(n)).replace('{total}', String(c.total))}
                      >
                        {Array.from({ length: c.total }, (_, k) => (
                          <i key={k} className={k < n ? 'is-on' : undefined} />
                        ))}
                      </span>
                      <span className="th-arch__n" aria-hidden="true">
                        {n} / {c.total}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
          {spread ? (
            <div>
              <h3 className="th-sub">{uiT('themesPage.coordinates', locale)}</h3>
              <div className="th-range">
                <AxisRange spread={spread} locale={locale} reference={atlasMean} />
              </div>
              <p className="th-legend" aria-hidden="true">
                <span className="th-legend__mark" /> {uiT('themesPage.legendTheme', locale)}
                <span className="th-legend__ref" /> {uiT('themesPage.legendAtlas', locale)}
                <a href={withBase(base, '/notes/#stupnice')}>{uiT('themesPage.coordinatesHelp', locale)}</a>
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {journeys.length ? (
        <section className="th-section" aria-labelledby="th-journeys">
          <h2 className="th-section__title" id="th-journeys">
            {uiT('themesPage.journeys', locale)}
          </h2>
          <ul className="th-journeys">
            {journeys.map((j) => {
              const href = withBase(base, `/putovani/${j.slug}/`);
              return (
                <li key={j.id} className={`th-journey${j.image ? ' has-image' : ''}`}>
                  {j.image ? (
                    <a className="th-journey__img" href={href} tabIndex={-1} aria-hidden="true">
                      <img
                        src={j.image.src}
                        alt=""
                        loading="lazy"
                        className={j.image.ink ? 'has-ink' : undefined}
                        style={
                          {
                            '--pv-mask': `url("${j.image.mask}")`,
                            ...(j.image.ink
                              ? {
                                  '--pv-mask-ink': `url("${j.image.ink}")`,
                                  '--pv-mask-ink-light': `url("${j.image.ink.replace(/\.png$/, '-light.png')}")`,
                                }
                              : {}),
                          } as CSSProperties
                        }
                      />
                    </a>
                  ) : null}
                  <div className="th-journey__body">
                    <h3 className="th-journey__name">
                      <a href={href}>{uiT(j.nameKey, locale)}</a>
                    </h3>
                    <p className="th-journey__q">{locale === 'cs' && j.tagline ? j.tagline : uiT(j.descKey, locale)}</p>
                    <ol className="th-route">
                      {j.members.map((m) => (
                        <li key={m.id} style={hueVars(m.accent)} className={worlds.some((w) => w.id === m.id) ? 'is-own' : undefined}>
                          <a href={withBase(base, `/worlds/${m.id}/`)}>{t(m.title, locale)}</a>
                        </li>
                      ))}
                    </ol>
                    {j.minutes ? (
                      <p className="th-journey__min">{uiT('themesPage.essay', locale).replace('{n}', String(j.minutes))}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {neighbours.length ? (
        <section className="th-section" aria-labelledby="th-neighbours">
          <h2 className="th-section__title" id="th-neighbours">
            {uiT('themesPage.neighbours', locale)}
          </h2>
          <ul className="th-neigh">
            {neighbours.map((n) => (
              <li key={n.slug} className="th-neigh__row">
                <a className="th-neigh__name" href={withBase(base, `${THEMES_PATH}${n.page}/`)}>
                  {t(n.label, locale)}
                </a>
                <span
                  className="th-neigh__cells"
                  role="img"
                  aria-label={uiT('themesPage.sharedOf', locale)
                    .replace('{n}', String(n.shared))
                    .replace('{total}', worldsCountLabel(worlds.length, locale))}
                >
                  {worlds.map((w, k) => (
                    <i key={w.id} className={k < n.shared ? 'is-on' : undefined} />
                  ))}
                </span>
                <span className="th-neigh__n" aria-hidden="true">
                  {n.shared} / {worlds.length}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="th-foot" aria-label={uiT('themesPage.more', locale)}>
        <a href={withBase(base, `/atlas/?theme=${theme.slug}`)}>{uiT('themesPage.inAtlas', locale)} →</a>
        <a href={withBase(base, THEMES_PATH)}>{uiT('themesPage.all', locale)} →</a>
      </nav>
    </article>
  );
}
