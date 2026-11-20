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
  /** Doba čtení schválené eseje v minutách; null = esej se teprve píše. */
  essayMinutes: number | null;
};

type Props = {
  base: string;
  trails: TrailsIndexTrail[];
  worlds: TrailsIndexWorld[];
};

const hue = (accent: { light: string; dark: string }) =>
  ({ '--tr-hue-l': accent.light, '--tr-hue-d': accent.dark }) as CSSProperties;

function trailsCount(n: number, locale: Locale) {
  return uiT(n >= 2 && n <= 4 ? 'trailsPage.trailsFew' : 'trailsPage.trailsMany', locale).replace('{n}', String(n));
}

/**
 * Stránka /stezky/: rejstřík šestnácti stezek (název, popis, složení v barvách archetypů,
 * světy, stav eseje), filtr „od světa ke stezkám“ a mřížka, kde se stezky kříží.
 */
export default function TrailsIndex({ base, trails, worlds }: Props) {
  const locale = useLocale();
  const [world, setWorld] = useState('');
  const [essaysOnly, setEssaysOnly] = useState(false);
  const [hoverTrail, setHoverTrail] = useState('');

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

  // Křižovatky: světy na dvou a více stezkách, nejvíc nahoře.
  const crossWorlds = useMemo(
    () =>
      [...counts.entries()]
        .filter(([, n]) => n >= 2)
        .sort((a, b) => b[1] - a[1] || title(a[0]).localeCompare(title(b[0]), locale))
        .map(([id]) => id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counts, locale, byId],
  );

  const anyEssay = trails.some((tr) => tr.essayMinutes !== null);

  // Výběr světa jde sdílet odkazem: /stezky/?svet=<id>.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('svet') ?? '';
    if (fromUrl && counts.has(fromUrl)) setWorld(fromUrl);
  }, [counts]);

  const pick = (id: string) => {
    const next = id === world ? '' : id;
    setWorld(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('svet', next);
    else url.searchParams.delete('svet');
    window.history.replaceState(null, '', url);
  };

  // Výběr z křižovatek leží pod rejstříkem: po kliknutí se vrátíme nahoru ke stezkám.
  const pickAndShow = (id: string) => {
    pick(id);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelector('.trails-toolbar')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Při výběru světa jdou jeho stezky nahoru, ostatní zůstanou ztlumené pod nimi.
  const visible = trails
    .filter((tr) => !essaysOnly || tr.essayMinutes !== null)
    .map((tr, i) => ({ tr, i, on: world ? tr.members.includes(world) : false }))
    .sort((a, b) => Number(b.on) - Number(a.on) || a.i - b.i)
    .map(({ tr }) => tr);

  return (
    <div className="trails-page">
      <header className="atlas-page__head">
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
        {anyEssay ? (
          <button
            type="button"
            className="trails-toggle"
            aria-pressed={essaysOnly}
            onClick={() => setEssaysOnly((v) => !v)}
          >
            {uiT('trailsPage.essaysOnly', locale)}
          </button>
        ) : null}
        {world ? (
          <button type="button" className="trails-clear" onClick={() => pick('')}>
            {uiT('trailsPage.clear', locale)}
          </button>
        ) : null}
      </div>

      <ol className={`trails-index${world ? ' has-pick' : ''}`}>
        {visible.map((tr) => {
          const on = world ? tr.members.includes(world) : false;
          return (
            <li key={tr.id} id={`stezka-${tr.slug}`} className={`trails-row${on ? ' is-on' : ''}`}>
              <div className="trails-row__main">
                <h2 className="trails-row__name">
                  <a href={withBase(base, `/stezky/${tr.slug}/`)}>{uiT(tr.nameKey, locale)}</a>
                </h2>
                <p className="trails-row__desc">{uiT(tr.descKey, locale)}</p>
                <div className="trails-row__strip" aria-hidden="true">
                  {tr.members.map((id) => {
                    const w = byId.get(id);
                    return (
                      <span
                        key={id}
                        className={`trails-row__seg${id === world ? ' is-pick' : ''}`}
                        style={w ? hue(w.accent) : undefined}
                      />
                    );
                  })}
                </div>
                <p className="trails-row__worlds">
                  {tr.members.map((id, i) => (
                    <span key={id}>
                      {i > 0 ? <span className="trails-row__sep"> · </span> : null}
                      <button
                        type="button"
                        className={`trails-row__world${id === world ? ' is-pick' : ''}`}
                        title={uiT('trailsPage.pickWorld', locale)}
                        aria-pressed={id === world}
                        onClick={() => pick(id)}
                      >
                        {title(id).replace(/(\d) (\d)/g, '$1 $2')}
                      </button>
                    </span>
                  ))}
                </p>
              </div>
              <div className="trails-row__side">
                {tr.essayMinutes !== null ? (
                  <a className="trails-row__essay" href={withBase(base, `/stezky/${tr.slug}/`)}>
                    {uiT('trailsPage.essay', locale).replace('{n}', String(tr.essayMinutes))}
                  </a>
                ) : (
                  <span className="trails-row__essay is-pending">{uiT('trailsPage.essayPending', locale)}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="trails-cross" aria-labelledby="kde-se-stezky-krizi">
        <h2 id="kde-se-stezky-krizi" className="trails-cross__title">
          {uiT('trailsPage.crossTitle', locale)}
        </h2>

        <div className="trails-cross__wrap">
          <table className="trails-cross__table" onMouseLeave={() => setHoverTrail('')}>
            <thead>
              <tr>
                <td />
                {trails.map((tr) => (
                  <th
                    key={tr.id}
                    scope="col"
                    className={`trails-cross__trail${hoverTrail === tr.id ? ' is-hover' : ''}`}
                    onMouseEnter={() => setHoverTrail(tr.id)}
                  >
                    <a href={withBase(base, `/stezky/${tr.slug}/`)}>
                      <span>{uiT(tr.nameKey, locale)}</span>
                    </a>
                  </th>
                ))}
                <td />
              </tr>
            </thead>
            <tbody>
              {crossWorlds.map((id) => {
                const w = byId.get(id);
                return (
                  <tr key={id} className={id === world ? 'is-pick' : undefined}>
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
