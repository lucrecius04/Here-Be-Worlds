import { useMemo, useState } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT, worldsCountLabel } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { THEMES_PATH } from '../../lib/themes';
import type { ThemeLink } from '../../lib/theme-pages';
import { hueVars } from './ThemePage';
import '../../styles/themes.css';

type Accent = { light: string; dark: string };
type IndexTheme = ThemeLink & {
  question: LocalizedString;
  worlds: Array<{ id: string; title: LocalizedString; accent: Accent; chapterId: string }>;
  journeys: number;
};

type Props = { base: string; themes: IndexTheme[]; matrix: number[][] };

export default function ThemesIndex({ base, themes, matrix }: Props) {
  const locale = useLocale();
  const [sort, setSort] = useState<'alpha' | 'count'>('alpha');
  const [cell, setCell] = useState<[number, number] | null>(null);

  const ordered = useMemo(() => {
    const list = themes.map((th, i) => ({ th, i }));
    return sort === 'count'
      ? list.sort((a, b) => b.th.worlds.length - a.th.worlds.length || t(a.th.label, locale).localeCompare(t(b.th.label, locale), locale))
      : list.sort((a, b) => t(a.th.label, locale).localeCompare(t(b.th.label, locale), locale));
  }, [themes, sort, locale]);

  const max = Math.max(1, ...matrix.flat());
  const href = (th: ThemeLink) => withBase(base, `${THEMES_PATH}${th.page}/`);
  const pairLabel = (a: number, b: number) =>
    `${t(themes[a].label, locale)} × ${t(themes[b].label, locale)} · ${worldsCountLabel(matrix[a][b], locale)}`;

  return (
    <div className="th-page th-index">
      <header className="atlas-page__head page-band">
        <h1 className="atlas-page__title display">{uiT('themesPage.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('themesPage.lead', locale)}</p>
      </header>

      <div className="th-sort" role="group" aria-label={uiT('themesPage.sort', locale)}>
        <span className="th-sort__label" aria-hidden="true">
          {uiT('themesPage.sort', locale)}
        </span>
        {(['alpha', 'count'] as const).map((key) => (
          <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>
            {uiT(key === 'alpha' ? 'themesPage.sortAlpha' : 'themesPage.sortCount', locale)}
          </button>
        ))}
      </div>

      <ul className="th-register">
        {ordered.map(({ th }) => (
          <li key={th.slug} className="th-entry">
            <h2 className="th-entry__name">
              <a href={href(th)}>{t(th.label, locale)}</a>
            </h2>
            <p className="th-entry__q">{t(th.question, locale)}</p>
            <p className="th-entry__print" aria-hidden="true">
              {th.worlds.map((w) => (
                <span key={w.id} className="th-dot" style={hueVars(w.accent)} title={t(w.title, locale)} />
              ))}
            </p>
            <p className="th-entry__meta">
              {worldsCountLabel(th.worlds.length, locale)}
              {th.journeys ? ` · ${uiT('themesPage.journeysCount', locale).replace('{n}', String(th.journeys))}` : ''}
            </p>
          </li>
        ))}
      </ul>

      <section className="th-section th-matrix" aria-labelledby="th-matrix">
        <h2 className="th-section__title" id="th-matrix">
          {uiT('themesPage.matrixTitle', locale)}
        </h2>
        <p className="th-matrix__info" aria-live="polite">
          {cell ? pairLabel(cell[0], cell[1]) : uiT('themesPage.matrixHint', locale)}
        </p>
        <div className="th-matrix__wrap">
          <table className={`th-matrix__table${cell ? ' has-focus' : ''}`} onMouseLeave={() => setCell(null)}>
            <caption className="visually-hidden">{uiT('themesPage.matrixCaption', locale)}</caption>
            <thead>
              <tr>
                <td />
                {themes.slice(0, -1).map((th, j) => (
                  <th
                    key={th.slug}
                    scope="col"
                    className={`th-matrix__col${cell && (cell[1] === j || cell[0] === j) ? ' is-on' : ''}`}
                  >
                    <span>{t(th.label, locale)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {themes.map((th, i) => (i === 0 ? null : (
                <tr key={th.slug}>
                  <th scope="row" className={`th-matrix__row${cell && (cell[0] === i || cell[1] === i) ? ' is-on' : ''}`}>
                    <a href={href(th)}>{t(th.label, locale)}</a>
                  </th>
                  {themes.slice(0, -1).map((other, j) => {
                    if (j >= i) return <td key={other.slug} className="th-matrix__void" aria-hidden="true" />;
                    const n = matrix[i][j];
                    const on = cell && cell[0] === i && cell[1] === j;
                    return (
                      <td
                        key={other.slug}
                        className={`th-matrix__cell${on ? ' is-on' : ''}${n ? '' : ' is-zero'}`}
                        onMouseEnter={() => setCell([i, j])}
                        title={pairLabel(i, j)}
                      >
                        {n ? (
                          <span
                            className="th-matrix__dot"
                            style={{ width: `${0.3 + 1.25 * Math.sqrt(n / max)}rem`, height: `${0.3 + 1.25 * Math.sqrt(n / max)}rem` }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="visually-hidden">{pairLabel(i, j)}</span>
                      </td>
                    );
                  })}
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
