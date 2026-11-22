/**
 * Společný základ návrhů nové Mapy souřadnic (2026-11-22, skryté stránky /map/navrh/a|b|c/).
 * Jen prototypy k rozhodnutí majitele: česky, bez překladů, nikam z webu nevedou.
 */
import type { CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS, type AxisKey } from '../../lib/axes';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from '../discovery/MiniAxes';
import '../../styles/map-proto.css';

export type ChapterLite = { id: string; title: LocalizedString; accent: { light: string; dark: string } };
export type ProtoProps = { worlds: World[]; chapters: ChapterLite[]; base: string };

export { AXIS_KEYS };
export type { AxisKey };

const NAME_KEY: Record<AxisKey, string> = {
  hopeDespair: 'map.nameHopeDespair',
  knownUnknown: 'map.nameKnownUnknown',
  intimateEpic: 'map.nameIntimateEpic',
  moralClarityAmbiguity: 'map.nameMoralClarityAmbiguity',
  realismMetaphysical: 'map.nameRealismMetaphysical',
};

export const axisMeta = (key: AxisKey) => axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
export const axisName = (key: AxisKey, locale: Locale) => uiT(NAME_KEY[key], locale);
export const pole = (key: AxisKey, side: 'left' | 'right', locale: Locale) => t(axisMeta(key)[side], locale);
export const shortPole = (key: AxisKey, side: 'left' | 'right', locale: Locale) =>
  axisPoleLabel(axisMeta(key), side, locale);
export const val = (w: World, key: AxisKey) => w.axes[key].value;

/** Barva archetypu do proměnných; CSS z nich podle motivu složí --hue. */
export function hue(chapters: ChapterLite[], chapterId: string): CSSProperties {
  const c = chapters.find((ch) => ch.id === chapterId);
  return { '--c-l': c?.accent.light ?? '#888', '--c-d': c?.accent.dark ?? '#aaa' } as CSSProperties;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

const VARIANTS = [
  { id: 'a', name: 'Kartografický list', note: 'dvě souřadnice zkřížené' },
  { id: 'b', name: 'Pět poledníků', note: 'všech pět najednou' },
  { id: 'c', name: 'Pět pásů', note: 'rozložení a profil' },
] as const;

/** Hlavička návrhu v pásu jako zbytek webu + přepínání mezi návrhy. */
export function ProtoHead({ variant, lead, base }: { variant: 'a' | 'b' | 'c'; lead: string; base: string }) {
  const v = VARIANTS.find((x) => x.id === variant)!;
  return (
    <header className="atlas-page__head page-band mp-head">
      <p className="atlas-page__kicker">
        Návrh {variant.toUpperCase()} · {v.name}
      </p>
      <h1 className="atlas-page__title display">Mapa souřadnic</h1>
      <p className="atlas-page__lead">{lead}</p>
      <nav className="mp-variants" aria-label="Návrhy">
        {VARIANTS.map((x) => (
          <a
            key={x.id}
            href={withBase(base, `/map/navrh/${x.id}/`)}
            className={x.id === variant ? 'is-on' : undefined}
            aria-current={x.id === variant ? 'page' : undefined}
          >
            <b>{x.id.toUpperCase()}</b> {x.name}
            <small>{x.note}</small>
          </a>
        ))}
        <a href={withBase(base, '/map/')}>
          <b>·</b> Dnešní mapa
          <small>pro srovnání</small>
        </a>
      </nav>
    </header>
  );
}

/** Legenda archetypů jako záložky atlasu; klik zvýrazní archetyp. */
export function ArchetypeLegend({
  chapters,
  worlds,
  focus,
  onFocus,
  locale,
}: {
  chapters: ChapterLite[];
  worlds: World[];
  focus: string;
  onFocus: (id: string) => void;
  locale: Locale;
}) {
  return (
    <div className="mp-legend" role="group" aria-label="Archetypy">
      {chapters.map((c) => (
        <button
          key={c.id}
          type="button"
          style={hue(chapters, c.id)}
          aria-pressed={focus === c.id}
          className={focus && focus !== c.id ? 'is-dim' : undefined}
          onClick={() => onFocus(focus === c.id ? '' : c.id)}
        >
          <i aria-hidden="true" />
          {t(c.title, locale)}
          <small>{worlds.filter((w) => w.chapterId === c.id).length}</small>
        </button>
      ))}
    </div>
  );
}
