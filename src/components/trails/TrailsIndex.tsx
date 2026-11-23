import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { t, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import '../../styles/trails.css';

export type TrailsIndexWorld = {
  id: string;
  title: { en: string; cs?: string };
  chapterId: string;
  accent: { light: string; dark: string };
};

export type TrailsIndexTrail = {
  id: string;
  slug: string;
  nameKey: string;
  descKey: string;
  members: string[];
  /** Slugy témat, kterých se esej dotýká. */
  themes: string[];
  /** Doba čtení schválené eseje v minutách; null = esej se teprve píše. */
  essayMinutes: number | null;
};

type Props = {
  base: string;
  trails: TrailsIndexTrail[];
  worlds: TrailsIndexWorld[];
  themeLabels: Record<string, { en: string; cs?: string }>;
  /** Náhled obrázků (zatím jen skrytá stránka): id stezky → adresa obrázku. */
  images?: Record<string, { src: string; ink?: string; mask?: string }>;
  /** Kam vedou odkazy na stránky stezek (výchozí /putovani/). */
  trailHref?: string;
};

const hue = (accent: { light: string; dark: string }) =>
  ({ '--tr-hue-l': accent.light, '--tr-hue-d': accent.dark }) as CSSProperties;

function trailsCount(n: number, locale: Locale) {
  return uiT(n >= 2 && n <= 4 ? 'trailsPage.trailsFew' : 'trailsPage.trailsMany', locale).replace('{n}', String(n));
}

/**
 * Stránka /putovani/: rejstřík všech stezek (název, popis, světy s linkou v barvě archetypu,
 * témata eseje, doba čtení), filtr podle světa a tématu a mřížka, kde se stezky kříží.
 */
export default function TrailsIndex({ base, trails, worlds, themeLabels, images, trailHref = '/putovani/' }: Props) {
  const locale = useLocale();
  const [world, setWorld] = useState('');
  const [theme, setTheme] = useState('');
  const [hoverTrail, setHoverTrail] = useState('');
  const [hoverWorld, setHoverWorld] = useState('');

  const byId = useMemo(() => new Map(worlds.map((w) => [w.id, w])), [worlds]);
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const tr of trails) for (const id of tr.members) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [trails]);

  const title = (id: string) => {
    const w = byId.get(id);
    return w ? t(w.title, locale) : id;
  };

  // Svět ve výběru: seřazený podle jména, jen světy, které na nějaké stezce leží.
  const worldOptions = useMemo(
    () => [...counts.keys()].sort((a, b) => title(a).localeCompare(title(b), locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts, locale, byId],
  );

  // Mřížka křižovatek: všechny světy na stezkách podle abecedy (rozhodnutí majitele 2026-11-22),
  // i ty na jediné stezce, aby bylo vidět, kde křížení chybí.
  const gridWorlds = worldOptions;

  // Seznam na telefonu: světy na dvou a více stezkách, nejvíc nahoře.
  const crossWorlds = useMemo(
    () =>
      [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || title(a[0]).localeCompare(title(b[0]), locale))
        .map(([id]) => id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts, locale, byId],
  );

  const themeName = (slug: string) => (themeLabels[slug] ? t(themeLabels[slug], locale) : slug);

  // Témata ve výběru: jen ta, kterých se nějaká stezka dotýká, podle abecedy.
  const themeOptions = useMemo(
    () => [...new Set(trails.flatMap((tr) => tr.themes))].sort((a, b) => themeName(a).localeCompare(themeName(b), locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trails, locale, themeLabels],
  );

  // Výběr jde sdílet odkazem: /putovani/?svet=<id>&tema=<slug>.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('svet') ?? '';
    if (fromUrl && counts.has(fromUrl)) setWorld(fromUrl);
    const themeFromUrl = params.get('tema') ?? '';
    if (themeFromUrl && trails.some((tr) => tr.themes.includes(themeFromUrl))) setTheme(themeFromUrl);
  }, [counts, trails]);

  const syncUrl = (key: string, value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    window.history.replaceState(null, '', url);
  };

  const pick = (id: string) => {
    const next = id === world ? '' : id;
    setWorld(next);
    syncUrl('svet', next);
  };

  const pickTheme = (slug: string) => {
    const next = slug === theme ? '' : slug;
    setTheme(next);
    syncUrl('tema', next);
  };

  const clearAll = () => {
    setWorld('');
    setTheme('');
    syncUrl('svet', '');
    syncUrl('tema', '');
  };

  const filtering = Boolean(world || theme);
  const matches = (tr: TrailsIndexTrail) =>
    (!world || tr.members.includes(world)) && (!theme || tr.themes.includes(theme));

  // Výběr z křižovatek leží pod rejstříkem: po kliknutí se vrátíme nahoru ke stezkám.
  const pickAndShow = (id: string) => {
    pick(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.trails-toolbar')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Při výběru jdou odpovídající stezky nahoru, ostatní zůstanou ztlumené pod nimi.
  const visible = trails
    .map((tr, i) => ({ tr, i, on: filtering && matches(tr) }))
    .sort((a, b) => Number(b.on) - Number(a.on) || a.i - b.i)
    .map(({ tr }) => tr);

  return (
    <div className="trails-page">
      <header className="atlas-page__head page-band">
        <h1 className="atlas-page__title display">{uiT('trailsPage.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('trailsPage.lead', locale)}</p>
      </header>

      <div className="trails-toolbar">
        <div className="trails-toolbar__field">
          <label className="field-label" htmlFor="trails-world">
            {uiT('trailsPage.world', locale)}
          </label>
          <select id="trails-world" className="field-input" value={world} onChange={(e) => pick(e.target.value)}>
            <option value="">{uiT('trailsPage.allWorlds', locale)}</option>
            {worldOptions.map((id) => (
              <option key={id} value={id}>
                {title(id)}
              </option>
            ))}
          </select>
        </div>
        <div className="trails-toolbar__field">
          <label className="field-label" htmlFor="trails-theme">
            {uiT('filter.theme', locale)}
          </label>
          <select id="trails-theme" className="field-input" value={theme} onChange={(e) => pickTheme(e.target.value)}>
            <option value="">{uiT('filter.allThemes', locale)}</option>
            {themeOptions.map((slug) => (
              <option key={slug} value={slug}>
                {themeName(slug)}
              </option>
            ))}
          </select>
        </div>
        {filtering ? (
          <button type="button" className="trails-clear" onClick={clearAll}>
            {uiT('trailsPage.clear', locale)}
          </button>
        ) : null}
      </div>

      <ol className={`trails-index${filtering ? ' has-pick' : ''}`}>
        {visible.map((tr) => {
          const on = filtering && matches(tr);
          return (
            <li
              key={tr.id}
              id={`stezka-${tr.slug}`}
              className={`trails-row${on ? ' is-on' : ''}${images?.[tr.id] ? ' has-image' : ''}`}
            >
              <div className="trails-row__main">
                <h2 className="trails-row__name">
                  <a href={withBase(base, `${trailHref}${tr.slug}/`)}>{uiT(tr.nameKey, locale)}</a>
                </h2>
                <p className="trails-row__desc">{uiT(tr.descKey, locale)}</p>
                <ul className="trails-row__worlds">
                  {tr.members.map((id) => {
                    const w = byId.get(id);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          className={`trails-row__world${id === world ? ' is-pick' : ''}`}
                          style={w ? hue(w.accent) : undefined}
                          title={uiT('trailsPage.pickWorld', locale)}
                          aria-pressed={id === world}
                          onClick={() => pick(id)}
                        >
                          {title(id).replace(/(\d) (\d)/g, '$1\u00a0$2')}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="trails-row__themes" aria-label={uiT('card.themesHeading', locale)}>
                  {tr.themes.map((slug, i) => (
                    <span key={slug}>
                      {i > 0 ? <span className="trails-row__sep" aria-hidden="true"> · </span> : null}
                      <button
                        type="button"
                        className={`trails-row__theme${slug === theme ? ' is-pick' : ''}`}
                        title={uiT('trailsPage.pickTheme', locale)}
                        aria-pressed={slug === theme}
                        onClick={() => pickTheme(slug)}
                      >
                        {themeName(slug)}
                      </button>
                    </span>
                  ))}
                  {tr.essayMinutes !== null ? (
                    <a className="trails-row__essay trails-row__essay--inline" href={withBase(base, `${trailHref}${tr.slug}/`)}>
                      {uiT('trailsPage.essay', locale).replace('{n}', String(tr.essayMinutes))}
                    </a>
                  ) : (
                    <span className="trails-row__essay trails-row__essay--inline is-pending">
                      {uiT('trailsPage.essayPending', locale)}
                    </span>
                  )}
                </p>
              </div>
              {images?.[tr.id] ? (
                <div className="trails-row__side">
                  <a className="trails-row__img" href={withBase(base, `${trailHref}${tr.slug}/`)} tabIndex={-1} aria-hidden="true">
                    <img
                      src={images[tr.id].src}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={images[tr.id].ink ? 'has-ink' : undefined}
                      style={
                        {
                          ...(images[tr.id].mask ? { '--pv-mask': `url("${images[tr.id].mask}")` } : {}),
                          ...(images[tr.id].ink
                            ? {
                                '--pv-mask-ink': `url("${images[tr.id].ink}")`,
                                '--pv-mask-ink-light': `url("${images[tr.id].ink!.replace(/\.png$/, '-light.png')}")`,
                              }
                            : {}),
                        } as CSSProperties
                      }
                    />
                  </a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <section className="trails-cross" aria-labelledby="kde-se-stezky-krizi">
        <h2 id="kde-se-stezky-krizi" className="trails-cross__title">
          {uiT('trailsPage.crossTitle', locale)}
        </h2>

        <div className="trails-cross__wrap">
          <table
            className="trails-cross__table"
            onMouseLeave={() => {
              setHoverTrail('');
              setHoverWorld('');
            }}
          >
            <thead>
              <tr onMouseEnter={() => setHoverWorld('')}>
                <td />
                {trails.map((tr) => (
                  <th
                    key={tr.id}
                    scope="col"
                    className={`trails-cross__trail${hoverTrail === tr.id ? ' is-hover' : ''}`}
                    onMouseEnter={() => setHoverTrail(tr.id)}
                  >
                    <a href={withBase(base, `/putovani/${tr.slug}/`)}>
                      <span>{uiT(tr.nameKey, locale)}</span>
                    </a>
                  </th>
                ))}
                <td />
              </tr>
            </thead>
            <tbody>
              {gridWorlds.map((id) => {
                const w = byId.get(id);
                return (
                  <tr
                    key={id}
                    className={[id === world ? 'is-pick' : '', hoverWorld === id ? 'is-hover' : ''].filter(Boolean).join(' ') || undefined}
                    onMouseEnter={() => setHoverWorld(id)}
                  >
                    <th scope="row" className="trails-cross__world">
                      <button
                        type="button"
                        title={uiT('trailsPage.pickWorld', locale)}
                        aria-pressed={id === world}
                        onClick={() => pickAndShow(id)}
                      >
                        {title(id)}
                      </button>
                    </th>
                    {trails.map((tr) => {
                      const has = tr.members.includes(id);
                      return (
                        <td
                          key={tr.id}
                          className={`trails-cross__cell${hoverTrail === tr.id ? ' is-hover' : ''}`}
                          onMouseEnter={() => setHoverTrail(tr.id)}
                        >
                          {has ? (
                            <span
                              className="trails-cross__dot"
                              style={w ? hue(w.accent) : undefined}
                              title={`${title(id)} · ${uiT(tr.nameKey, locale)}`}
                            />
                          ) : null}
                        </td>
                      );
                    })}
                    <td className="trails-cross__count">{counts.get(id)}</td>
                  </tr>
                );
              })}
            </tbody>
            {/* Názvy stezek i pod mřížkou: s přibývajícími světy se horní řádek vzdaluje. */}
            <tfoot>
              <tr onMouseEnter={() => setHoverWorld('')}>
                <td />
                {trails.map((tr) => (
                  <th
                    key={tr.id}
                    scope="col"
                    className={`trails-cross__trail trails-cross__trail--foot${hoverTrail === tr.id ? ' is-hover' : ''}`}
                    onMouseEnter={() => setHoverTrail(tr.id)}
                  >
                    <a href={withBase(base, `/putovani/${tr.slug}/`)} tabIndex={-1} aria-hidden="true">
                      <span>{uiT(tr.nameKey, locale)}</span>
                    </a>
                  </th>
                ))}
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <ol className="trails-cross__list">
          {crossWorlds.slice(0, 12).map((id) => (
            <li key={id}>
              <button type="button" onClick={() => pickAndShow(id)} aria-pressed={id === world}>
                {title(id)}
              </button>
              <span>{trailsCount(counts.get(id) ?? 0, locale)}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
