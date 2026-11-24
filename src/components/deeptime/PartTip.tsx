import type { CSSProperties } from 'react';
import { uiT, type Locale } from '../../lib/i18n';
import { partDetail, type DeepEvent } from '../../lib/deep-time';

/**
 * Popisek dílu u kurzoru: sdílejí ho oba grafy Hlubiny času (vrty i naše časová osa).
 * Ukáže všechny díly, které u kurzoru leží (u dílů těsně po sobě, např. Mass Effect 1–3 na naší ose, víc najednou).
 */

/** Značka dílu: `at` = poloha v jednotkách SVG (svisle u vrtů, vodorovně na naší ose). */
export type PartMark = { key: string; at: number; when: string; title: string; detail: string; later: boolean };

/** Značka z události: název hry, rok a popis bez opakovaného názvu (u událostí mimo hry jen jejich text). */
export function markOf(key: string, at: number, e: DeepEvent, later: boolean): PartMark {
  return { key, at, when: e.when, title: e.game ?? e.text, detail: partDetail(e), later };
}

export type TipState = {
  id: string;
  keys: string[];
  items: Array<{ when: string; title: string; detail: string; later: boolean }>;
  /** poloha vůči obrázku (figure) v px */
  left: number;
  top: number;
  /** 'right' vpravo od vrtu · 'left' vlevo od vrtu · 'above-start' / 'above-end' nad řádkem */
  place: 'right' | 'left' | 'above-start' | 'above-end';
};

/** Jak daleko od značky (v px na obrazovce) ještě kurzor díl „chytí“. */
const REACH = 8;
/** Díly blíž než tolik px od sebe splývají v jednu značku a popisek je ukáže společně. */
const CLUSTER = 3;
/** Přibližná šířka popisku pro rozhodnutí, na kterou stranu ho dát. */
const BOX = 270;

/**
 * Najde díly u kurzoru a spočítá, kam popisek dát.
 * `dir` 'v': značky leží svisle (vrt), popisek vedle vrtu na úrovni nejbližšího dílu.
 * `dir` 'h': značky leží vodorovně (řádek), popisek nad řádkem u nejbližšího dílu.
 */
export function tipFor(
  id: string,
  marks: PartMark[],
  client: number,
  svg: SVGSVGElement,
  fig: HTMLElement,
  dir: 'v' | 'h',
  anchor: { after?: number; before?: number; y?: number },
): TipState | null {
  const ctm = svg.getScreenCTM();
  if (!ctm || !marks.length) return null;
  const sx = (x: number) => ctm.a * x + ctm.e;
  const sy = (y: number) => ctm.d * y + ctm.f;
  const screen = (m: PartMark) => (dir === 'v' ? sy(m.at) : sx(m.at));
  const near = marks.map((m) => ({ m, d: Math.abs(screen(m) - client) })).filter((o) => o.d <= REACH);
  if (!near.length) return null;
  const best = near.reduce((a, b) => (b.d < a.d ? b : a)).m;
  // Nejbližší díl a s ním díly, které s ním na obrazovce splývají (Mass Effect 1–3 na naší ose),
  // v pořadí, v jakém jdou v čase (pole značek je od nejstaršího po nejpozdější).
  const hits = marks.filter((m) => Math.abs(screen(m) - screen(best)) <= CLUSTER);
  const fr = fig.getBoundingClientRect();
  let left: number;
  let top: number;
  let place: TipState['place'];
  if (dir === 'v') {
    top = sy(best.at) - fr.top;
    const right = sx(anchor.after ?? 0) - fr.left;
    if (right + BOX <= fr.width) {
      left = right;
      place = 'right';
    } else {
      left = sx(anchor.before ?? 0) - fr.left;
      place = 'left';
    }
  } else {
    left = sx(best.at) - fr.left;
    top = sy(anchor.y ?? 0) - fr.top;
    place = left + BOX <= fr.width ? 'above-start' : 'above-end';
  }
  return {
    id,
    keys: hits.map((m) => m.key),
    items: hits.map((m) => ({ when: m.when, title: m.title, detail: m.detail, later: m.later })),
    left,
    top,
    place,
  };
}

export default function PartTip({
  tip,
  locale,
  accent,
}: {
  tip: TipState;
  locale: Locale;
  accent?: { light: string; dark: string };
}) {
  const style = {
    left: `${tip.left}px`,
    top: `${tip.top}px`,
    ...(accent ? { '--dt-hue-l': accent.light, '--dt-hue-d': accent.dark } : {}),
  } as CSSProperties;
  return (
    <div className={`dt-tipbox dt-tipbox--${tip.place}`} style={style} role="tooltip">
      <ul>
        {tip.items.map((it, i) => (
          <li key={i} className={it.later ? 'is-later' : undefined}>
            <span className="dt-tipbox__title">{it.title}</span>
            <span className="dt-tipbox__when">
              {it.later ? `${uiT('deepTime.laterInline', locale)} · ` : ''}
              {it.when}
            </span>
            {it.detail ? <span className="dt-tipbox__text">{it.detail}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
