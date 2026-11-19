import { useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS } from '../../lib/axes';
import { DEFAULT_IMPRINT, imprintNeighbors, type AxisValues } from '../../lib/imprint';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel as poleLabel } from './MiniAxes';

type Props = {
  worlds: World[];
  locale: Locale;
  base: string;
  /** Na titulní straně je kompas otevřený rovnou, bez přepínače. */
  alwaysOpen?: boolean;
};

export default function WorldCompass({ worlds, locale, base, alwaysOpen = false }: Props) {
  const [toggled, setOpen] = useState(false);
  const open = alwaysOpen || toggled;
  const [values, setValues] = useState<AxisValues>(DEFAULT_IMPRINT);
  const catalog = useMemo(() => worlds.filter((world) => !world.draft), [worlds]);
  const { nearest, antipode } = useMemo(
    () => imprintNeighbors(values, catalog),
    [values, catalog],
  );
  const compareHref =
    nearest[0] && antipode
      ? withBase(base, `/compare/?w=${nearest[0].world.id},${antipode.world.id}`)
      : null;

  return (
    <section className={`compass${alwaysOpen ? ' compass--open' : ''}`} aria-label={uiT('home.compassTitle', locale)}>
      {alwaysOpen ? null : (
        <button
          type="button"
          className="compass__toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {uiT('home.compassToggle', locale)}
        </button>
      )}
      {open ? (
        <div className="compass__panel">
          <h2 className={alwaysOpen ? 'hp-h2' : 'home-section-title'}>
            {uiT(alwaysOpen ? 'home2.compassTitle' : 'home.compassTitle', locale)}
          </h2>
          <p className="compass__lead">{uiT('home.compassLead', locale)}</p>
          <div className="compass__grid">
            <div className="axis-bars compass__axes" role="group" aria-label={uiT('card.axesAria', locale)}>
              {axesMeta.axes.map((axis) => {
                const key = axis.id as (typeof AXIS_KEYS)[number];
                const value = values[key];
                const left = poleLabel(axis, 'left', locale);
                const right = poleLabel(axis, 'right', locale);
                const lean = value < 3 ? 'left' : value > 3 ? 'right' : null;
                return (
                  <div key={axis.id} className="axis-bars__row" title={t(axis.help, locale)}>
                    <span className={`axis-bars__pole${lean === 'left' ? ' is-lean' : ''}`}>{left}</span>
                    <span className="axis-bars__cells compass__cells">
                      {[1, 2, 3, 4, 5].map((tick) => (
                        <button
                          key={tick}
                          type="button"
                          className={`compass__cell${tick === value ? ' is-on' : ''}`}
                          aria-label={`${t(axis.left, locale)} ↔ ${t(axis.right, locale)}: ${tick} / 5`}
                          aria-pressed={tick === value}
                          onClick={() => setValues((current) => ({ ...current, [key]: tick }))}
                        />
                      ))}
                    </span>
                    <span className={`axis-bars__pole axis-bars__pole--right${lean === 'right' ? ' is-lean' : ''}`}>
                      {right}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="compass__results">
              {nearest.map((hit) => (
                <a
                  key={hit.world.id}
                  className="compass__card"
                  href={withBase(base, `/worlds/${hit.world.id}/`)}
                >
                  <span className="compass__badge">
                    {uiT('home.compassMatch', locale).replace('{n}', String(hit.percent))}
                  </span>
                  <strong className="compass__name">{t(hit.world.gameTitle, locale)}</strong>
                  <span className="compass__core">{t(hit.world.core, locale)}</span>
                </a>
              ))}
              {antipode ? (
                <a
                  className="compass__card compass__card--far"
                  href={withBase(base, `/worlds/${antipode.world.id}/`)}
                >
                  <span className="compass__badge compass__badge--far">
                    {uiT('home.compassAntipode', locale)}
                  </span>
                  <strong className="compass__name">{t(antipode.world.gameTitle, locale)}</strong>
                  <span className="compass__core">{t(antipode.world.core, locale)}</span>
                </a>
              ) : null}
              {compareHref ? (
                <a className="compass__compare" href={compareHref}>
                  {uiT('home.compassCompare', locale)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
