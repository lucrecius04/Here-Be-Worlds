import { useState } from 'react';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  MYSTERY_HOLDERS,
  MYSTERY_KINDS,
  WORLD_TRIAD_TYPES,
  mysteryAnchor,
} from '../../lib/triad-types';
import { hueVars, type TriadWorld } from './shared';
import { HolderIcon } from './HolderIcon';
import '../../styles/triads.css';

/**
 * Hlavní tajemství (dřív samostatná Mapa neznáma, od 2026-11-25 třetí oddíl Galerie triád):
 * mřížka druh tajemství × kdo drží mezeru a rejstřík tajemství. Filtr archetypu je společný pro celou galerii.
 */
type Props = { base: string; sorted: TriadWorld[]; arch: string | null; title: string };

export { HolderIcon };

export const MYSTERIES_ID = 'hlavni-tajemstvi';

export default function MysterySection({ base, sorted, arch, title }: Props) {
  const locale = useLocale();
  const [holder, setHolder] = useState<string | null>(null);
  const archDim = (w: TriadWorld) => arch !== null && w.chapterId !== arch;
  const cell = (kind: string, h: string) =>
    sorted.filter((w) => WORLD_TRIAD_TYPES[w.id]?.mystery === kind && WORLD_TRIAD_TYPES[w.id]?.holder === h);
  const holderLabel = (id: string) => {
    const h = MYSTERY_HOLDERS.find((x) => x.id === id);
    return h ? t(h.label, locale) : id;
  };
  const visible = sorted.filter((w) => holder === null || WORLD_TRIAD_TYPES[w.id]?.holder === holder);

  return (
    <section className="tg-section un-section" id={MYSTERIES_ID} aria-labelledby={`${MYSTERIES_ID}-h`}>
      <h2 className="tg-section__title" id={`${MYSTERIES_ID}-h`}>
        {title}
      </h2>
      <div className="tg-filter un-holders" role="group" aria-label={uiT('unknown.filter', locale)}>
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

      <p className="tg-type__kicker un-grid__kicker">{uiT('unknown.title', locale)}</p>
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
                            <li key={w.id} style={hueVars(w.accent)} className={archDim(w) ? 'is-dim' : undefined}>
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

      <div className="un-register" aria-labelledby="rejstrik-tajemstvi">
        <h3 className="tg-type__kicker un-register__title" id="rejstrik-tajemstvi">
          {uiT('unknown.registerTitle', locale)}
        </h3>
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
                    <li key={w.id} id={mysteryAnchor(w.id)} className={`tg-entry un-item${archDim(w) ? ' is-dim' : ''}`} style={hueVars(w.accent)}>
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
      </div>
    </section>
  );
}
