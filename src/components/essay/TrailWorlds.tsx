import type { CSSProperties } from 'react';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS } from '../../lib/axes';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from '../discovery/MiniAxes';
import type { TrailWorldInfo } from './EssayPage';

export const TRAIL_WORLDS_ID = 'svety-stezky';

const AXIS_NAME: Record<string, string> = {
  hopeDespair: 'map.nameHopeDespair',
  knownUnknown: 'map.nameKnownUnknown',
  intimateEpic: 'map.nameIntimateEpic',
  moralClarityAmbiguity: 'map.nameMoralClarityAmbiguity',
  realismMetaphysical: 'map.nameRealismMetaphysical',
};

type Props = {
  worlds: TrailWorldInfo[];
  base: string;
  locale: Locale;
};

/**
 * Světy stezky pod esejem: poloha všech světů na pěti souřadnicích
 * (kosočtverec na stupnici 1–5, pod ním jména světů) a seznam světů s jádrem.
 */
export default function TrailWorlds({ worlds, base, locale }: Props) {
  return (
    <section className="trail-worlds" aria-labelledby={TRAIL_WORLDS_ID}>
      <h2 id={TRAIL_WORLDS_ID} className="essay-chapter">
        {uiT('trails.worldsHeading', locale)}
      </h2>

      <div className="trail-axes" role="group" aria-label={uiT('card.profileWorld', locale)}>
        {AXIS_KEYS.map((key) => {
          const meta = axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
          return (
            <div key={key} className="trail-axis" title={t(meta.help, locale)}>
              <p className="trail-axis__name">{uiT(AXIS_NAME[key] ?? '', locale)}</p>
              <div className="trail-axis__row">
                <span className="trail-axis__pole">{axisPoleLabel(meta, 'left', locale)}</span>
                <div className="trail-axis__track">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const here = worlds.filter((w) => w.axes[key] === value);
                    return (
                      <div key={value} className={`trail-axis__cell${here.length ? ' is-on' : ''}`}>
                        <span className="trail-axis__tick" aria-hidden="true" />
                        {here.length ? (
                          <>
                            <span className="trail-axis__diamond" aria-hidden="true" />
                            <span className="trail-axis__names">
                              {here.map((w) => (
                                <span key={w.id}>{w.title}</span>
                              ))}
                            </span>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <span className="trail-axis__pole trail-axis__pole--right">
                  {axisPoleLabel(meta, 'right', locale)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="trail-list">
        {worlds.map((w) => (
          <li
            key={w.id}
            className="trail-world"
            style={{ '--tw-hue-l': w.accent.light, '--tw-hue-d': w.accent.dark } as CSSProperties}
          >
            <span className="trail-world__tag">{w.archetype}</span>
            <a className="trail-world__title" href={withBase(base, `/worlds/${w.id}/`)}>
              {w.title}
            </a>
            <p className="trail-world__core">{w.core}</p>
            <a className="trail-world__more" href={withBase(base, `/worlds/${w.id}/?view=chronicle`)}>
              {uiT('home.readChronicle', locale)}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Světy stezky hned pod hlavičkou eseje: sloupce s linkou v barvě archetypu
 * (jako Zmapované světy na titulní straně), archetyp · podžánr a název jako odkaz.
 */
export function TrailCast({ worlds, base, locale }: Props) {
  return (
    <ul className="trail-cast" aria-label={uiT('trails.worldsHeading', locale)}>
      {worlds.map((w) => (
        <li
          key={w.id}
          className="trail-cast__item"
          style={{ '--tw-hue-l': w.accent.light, '--tw-hue-d': w.accent.dark } as CSSProperties}
        >
          <span className="trail-cast__kind">
            {w.archetype}
            {w.genre && w.genre !== w.archetype ? <span> · {w.genre}</span> : null}
          </span>
          <a className="trail-cast__title" href={withBase(base, `/worlds/${w.id}/`)}>
            {w.title.replace(/(\d) (\d)/g, '$1\u00a0$2')}
          </a>
        </li>
      ))}
    </ul>
  );
}
