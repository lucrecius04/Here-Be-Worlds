import { useMemo, useState } from 'react';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  GALLERY_PATH,
  MYSTERY_HOLDERS,
  MYSTERY_KINDS,
  WORLD_TRIAD_TYPES,
  mysteryAnchor,
} from '../../lib/triad-types';
import { hueVars, type TriadChapter, type TriadWorld } from './TriadGallery';
import '../../styles/triads.css';

type Props = { base: string; worlds: TriadWorld[]; chapters: TriadChapter[] };

/** Ikony „kdo drží mezeru“: zamčený zámek · přesýpací hodiny · odemčený zámek. */
export function HolderIcon({ id }: { id: string }) {
  const common = {
    className: 'un-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (id === 'zamceno-tvurci')
    return (
      <svg {...common}>
        <rect x="4.5" y="10.5" width="15" height="10.5" rx="1.2" fill="currentColor" />
        <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
        <path d="M12 14.6v2.6" stroke="var(--color-paper)" strokeWidth="1.8" />
      </svg>
    );
  if (id === 'ceka-na-pokracovani')
    return (
      <svg {...common}>
        <path d="M6.5 3h11M6.5 21h11" />
        <path d="M7.5 3c0 4.5 4.5 6 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 6-4.5 9s4.5 4.5 4.5 9" />
        <path d="M9.6 19.2c.8-1.4 4-1.4 4.8 0z" fill="currentColor" />
        <path d="M10 6.4h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="1.2" />
      <path d="M8 10.5V7.2a4 4 0 0 1 7.6-1.8" />
      <circle cx="12" cy="15.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function UnknownMap({ base, worlds, chapters }: Props) {
  const locale = useLocale();
  const [holder, setHolder] = useState<string | null>(null);
  const order = useMemo(() => new Map(chapters.map((c, i) => [c.id, i])), [chapters]);
  const sorted = useMemo(
    () =>
      [...worlds].sort(
        (a, b) =>
          (order.get(a.chapterId) ?? 0) - (order.get(b.chapterId) ?? 0) ||
          t(a.title, locale).localeCompare(t(b.title, locale), locale),
      ),
    [worlds, order, locale],
  );
  const cell = (kind: string, h: string) =>
    sorted.filter((w) => WORLD_TRIAD_TYPES[w.id]?.mystery === kind && WORLD_TRIAD_TYPES[w.id]?.holder === h);
  const holderLabel = (id: string) => {
    const h = MYSTERY_HOLDERS.find((x) => x.id === id);
    return h ? t(h.label, locale) : id;
  };
  const visible = sorted.filter((w) => holder === null || WORLD_TRIAD_TYPES[w.id]?.holder === holder);

  return (
    <div className="tg-page un-page">
      <header className="atlas-page__head page-band tg-head">
        <h1 className="atlas-page__title display">{uiT('unknown.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('unknown.lead', locale)}</p>
        <p className="tg-head__links">
          {uiT('unknown.leadGallery', locale)}{' '}
          <a href={withBase(base, GALLERY_PATH)}>{uiT('triads.title', locale).toLowerCase()} →</a>
          <span className="tg-head__sep" aria-hidden="true">
            ·
          </span>
          <a href={withBase(base, '/anatomie-herniho-lore/#rizena-mezera')}>{uiT('unknown.method', locale)}</a>
        </p>
      </header>

      <div className="tg-sticky">
        <div className="tg-filter" role="group" aria-label={uiT('unknown.filter', locale)}>
          <span className="tg-filter__label" aria-hidden="true">
            {uiT('unknown.filter', locale)}
          </span>
          <button type="button" className="tg-filter__btn" aria-pressed={holder === null} onClick={() => setHolder(null)}>
            {uiT('unknown.all', locale)}
          </button>
          {MYSTERY_HOLDERS.map((h) => (
            <button
              key={h.id}
              type="button"
              className="tg-filter__btn"
              aria-pressed={holder === h.id}
              onClick={() => setHolder(holder === h.id ? null : h.id)}
            >
              <HolderIcon id={h.id} />
              {t(h.label, locale)}
            </button>
          ))}
        </div>
      </div>

      {/* Mřížka: druh tajemství × kdo drží mezeru (na telefonu skrytá, stačí rejstřík) */}
      <div className="un-grid-wrap">
        <table className={`un-grid${holder ? ' has-focus' : ''}`}>
          <caption className="visually-hidden">{uiT('unknown.gridCaption', locale)}</caption>
          <thead>
            <tr>
              <td className="un-grid__corner">
                <span>{uiT('unknown.kindHead', locale)}</span>
              </td>
              {MYSTERY_HOLDERS.map((h) => {
                const n = sorted.filter((w) => WORLD_TRIAD_TYPES[w.id]?.holder === h.id).length;
                return (
                  <th key={h.id} scope="col" className={`un-grid__col${holder && holder !== h.id ? ' is-dim' : ''}`}>
                    <span className="un-grid__col-name">
                      <HolderIcon id={h.id} />
                      {t(h.label, locale)}
                      <span className="un-grid__n">{n}</span>
                    </span>
                    <span className="un-grid__col-desc">{t(h.desc, locale)}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {MYSTERY_KINDS.map((k) => (
              <tr key={k.id}>
                <th scope="row" className="un-grid__row">
                  <span className="un-grid__row-name">{t(k.label, locale)}</span>
                  <span className="un-grid__row-q">{t(k.desc, locale)}</span>
                </th>
                {MYSTERY_HOLDERS.map((h) => {
                  const list = cell(k.id, h.id);
                  const off = holder !== null && holder !== h.id;
                  return (
                    <td key={h.id} className={`un-cell${list.length ? '' : ' is-empty'}${off ? ' is-dim' : ''}`}>
                      {list.length ? (
                        <ul>
                          {list.map((w) => (
                            <li key={w.id} style={hueVars(w.accent)}>
                              <a href={`#${mysteryAnchor(w.id)}`} tabIndex={off ? -1 : undefined}>
                                <span className="tg-dot" aria-hidden="true" />
                                {t(w.title, locale)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <em>{uiT('unknown.empty', locale)}</em>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="tg-section un-register" aria-labelledby="rejstrik-tajemstvi">
        <h2 className="tg-section__title" id="rejstrik-tajemstvi">
          {uiT('unknown.registerTitle', locale)}
        </h2>
        <p className="visually-hidden" aria-live="polite">
          {uiT('unknown.shown', locale).replace('{n}', String(visible.length))}
        </p>
        {MYSTERY_KINDS.map((k) => {
          const list = visible.filter((w) => WORLD_TRIAD_TYPES[w.id]?.mystery === k.id);
          if (!list.length) return null;
          return (
            <section key={k.id} className="tg-type" aria-labelledby={`${k.id}-h`}>
              <div className="tg-type__head">
                <h3 className="tg-type__name" id={`${k.id}-h`}>
                  {t(k.label, locale)}
                </h3>
                <p className="tg-type__desc">{t(k.desc, locale)}</p>
              </div>
              <ol className="tg-list un-list">
                {list.map((w) => {
                  const h = WORLD_TRIAD_TYPES[w.id].holder;
                  const analysis = withBase(base, `/worlds/${w.id}/?view=analysis${w.mysteryAnchor ? `#${w.mysteryAnchor}` : ''}`);
                  return (
                    <li key={w.id} id={mysteryAnchor(w.id)} className="tg-entry un-item" style={hueVars(w.accent)}>
                      <p className="tg-entry__world">
                        <a href={withBase(base, `/worlds/${w.id}/`)}>{t(w.title, locale)}</a>
                      </p>
                      <p className="un-item__q">{t(w.ultimateMystery, locale)}</p>
                      <p className="un-item__meta">
                        <span className="un-item__holder">
                          <HolderIcon id={h} />
                          {holderLabel(h)}
                        </span>
                        <a className="un-item__read" href={analysis}>
                          {uiT('unknown.readings', locale)} <span aria-hidden="true">→</span>
                        </a>
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </section>
    </div>
  );
}
