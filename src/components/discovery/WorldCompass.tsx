import { useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS } from '../../lib/axes';
import { DEFAULT_IMPRINT, imprintNeighbors, type AxisValues } from '../../lib/imprint';
import axesMeta from '../../../data/meta/axes.json';

const SHORT_POLES: Record<string, { left: { cs: string; en: string }; right: { cs: string; en: string } }> = {
  moralClarityAmbiguity: {
    left: { cs: 'Jednoznačné', en: 'Absolute' },
    right: { cs: 'Komplexní', en: 'Complex' },
  },
};

type Props = {
  worlds: World[];
  locale: Locale;
  base: string;
};

function poleLabel(
  axis: (typeof axesMeta.axes)[number],
  side: 'left' | 'right',
  locale: Locale,
): string {
  const compact = SHORT_POLES[axis.id];
  if (compact) return compact[side][locale];
  return t(axis[side], locale);
}

export default function WorldCompass({ worlds, locale, base }: Props) {
  const [open, setOpen] = useState(false);
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
    <section className="compass" aria-label={uiT('home.compassTitle', locale)}>
      <button
        type="button"
        className="compass__toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {uiT('home.compassToggle', locale)}
      </button>
      {open ? (
        <div className="compass__panel">
          <h2 className="home-section-title">{uiT('home.compassTitle', locale)}</h2>
          <p className="compass__lead">{uiT('home.compassLead', locale)}</p>
          <div className="compass__grid">
            <div className="compass__axes" role="group" aria-label={uiT('card.axesAria', locale)}>
              {axesMeta.axes.map((axis) => {
                const key = axis.id as (typeof AXIS_KEYS)[number];
                const value = values[key];
                return (
                  <div key={axis.id} className="mini-axes__row compass__row">
                    <span className="mini-axes__pole mini-axes__pole--left">
                      {poleLabel(axis, 'left', locale)}
                    </span>
                    <span className="mini-axes__track">
                      {[1, 2, 3, 4, 5].map((tick) => {
                        const dist = Math.abs(tick - value);
                        const state = dist === 0 ? 'on' : dist === 1 ? 'near' : '';
                        return (
                          <button
                            key={tick}
                            type="button"
                            className={`mini-axes__tick compass__tick${state ? ` mini-axes__tick--${state}` : ''}`}
                            aria-label={`${poleLabel(axis, 'left', locale)} ${tick}/5`}
                            aria-pressed={tick === value}
                            onClick={() => setValues((current) => ({ ...current, [key]: tick }))}
                          />
                        );
                      })}
                    </span>
                    <span className="mini-axes__pole mini-axes__pole--right">
                      {poleLabel(axis, 'right', locale)}
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
