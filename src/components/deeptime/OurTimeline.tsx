import { useMemo, useState, type CSSProperties } from 'react';
import { t, uiT, type Locale } from '../../lib/i18n';
import { YARDSTICKS, eventYear, formatYear, isRange, nf, summarize } from '../../lib/deep-time';
import type { DeepTimeWorld } from '../../lib/deep-time-pages';

type Item = DeepTimeWorld & { sum: ReturnType<typeof summarize> };
type Props = {
  worlds: Item[];
  now: number;
  locale: Locale;
  compact: boolean;
  picked: string | null;
  onPick: (id: string | null) => void;
  /** Při řazení podle archetypu: pořadí archetypů. */
  chapterOrder?: Map<string, number>;
};

const hue = (accent: { light: string; dark: string }) =>
  ({ '--dt-hue-l': accent.light, '--dt-hue-d': accent.dark }) as CSSProperties;

/** Řády minulosti (do 10^10,2 let, kvůli vzniku vesmíru) a budoucnosti (do 10^4,7 ≈ 50 000 let). */
const PAST = 10.2;
const FUTURE = 4.7;
/** Stejné měřítko jako vrty nahoře: každý řád (×10) má stejnou šířku v minulosti i budoucnosti. */
const PAST_TICKS = [1, 2, 3, 6, 9];
const FUTURE_TICKS = [1, 2, 3, 4];

/** Krátký popisek roku na stupnici: zaokrouhlený na dvě platné číslice u let před n. l. */
function tickLabel(year: number, locale: Locale): string {
  if (year >= 1) return year >= 10000 ? nf(Math.round(year), locale) : String(Math.round(year));
  const bc = 1 - year;
  const r = Number(bc.toPrecision(2));
  if (r < 1e6) return locale === 'cs' ? `${nf(r, locale)} př. n. l.` : `${nf(r, locale)} BC`;
  if (r < 1e9) return locale === 'cs' ? `${nf(r / 1e6, locale)} mil. let` : `${nf(r / 1e6, locale)} Myr`;
  return locale === 'cs' ? `${nf(r / 1e9, locale)} mld. let` : `${nf(r / 1e9, locale)} Gyr`;
}

/**
 * Naše časová osa: světy, které počítají roky jako my, kolem dnešního dne.
 * Vlevo minulost, vpravo budoucnost, obojí logaritmicky podle vzdálenosti od dneška;
 * každý svět je vodorovný vrt od nejstarší datované události po svou přítomnost.
 */
export default function OurTimeline({ worlds, now, locale, compact, picked, onPick, chapterOrder }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const g = compact
    ? { width: 390, gutter: 100, top: 40, row: 19, bar: 4, label: 8.5, zone: 6, bottom: 74 }
    : { width: 1000, gutter: 156, top: 52, row: 24, bar: 6, label: 11, zone: 10, bottom: 84 };
  const plot = g.width - g.gutter - 12;
  const decade = (plot - 2 * g.zone) / (PAST + FUTURE);
  const center = g.gutter + g.zone + PAST * decade;
  const X = (year: number) => {
    const d = year - now;
    const a = Math.abs(d);
    if (a < 1) return center + Math.sign(d) * g.zone * a;
    const log = Math.log10(a);
    const off = g.zone + Math.min(log, d < 0 ? PAST : FUTURE) * decade;
    return d < 0 ? center - off : center + off;
  };

  const rows = useMemo(
    () =>
      worlds
        .filter((w) => typeof w.deep.presentYear === 'number')
        .sort(
          (a, b) =>
            (chapterOrder ? (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0) : 0) ||
            (a.deep.presentYear ?? 0) - (b.deep.presentYear ?? 0),
        ),
    [worlds, chapterOrder],
  );
  const height = g.top + rows.length * g.row + g.bottom;
  // Ztlumit ostatní jen tehdy, když vybraný svět na této ose leží.
  const focusRaw = picked ?? hover;
  const focus = focusRaw && rows.some((w) => w.id === focusRaw) ? focusRaw : hover;

  const pastLabel = (p: number) => tickLabel(now - 10 ** p, locale);
  const futureLabel = (p: number) => tickLabel(now + 10 ** p, locale);

  return (
    <section className="dt-ours" aria-labelledby="dt-ours-h">
      <h2 className="dt-ours__title" id="dt-ours-h">
        {uiT('deepTime.oursTitle', locale)}
      </h2>
      <p className="dt-ours__lead">{uiT('deepTime.oursLead', locale)}</p>
      <figure className="dt-ours__chart" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${g.width} ${height}`} className={focus ? 'has-focus' : undefined} role="group" aria-label={uiT('deepTime.oursTitle', locale)}>
          <defs>
            {rows.map((w) => (
              <linearGradient key={w.id} id={`dt-ours-fade-${w.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" className="dt-fade-1" style={hue(w.accent)} />
                <stop offset="1" className="dt-fade-0" style={hue(w.accent)} />
              </linearGradient>
            ))}
          </defs>

          {/* minulost a budoucnost */}
          <rect className="dt-ours__past" x={g.gutter} y={g.top - 8} width={center - g.gutter} height={rows.length * g.row + 16} />
          <text className="dt-ours__side" x={g.gutter} y={14} fontSize={g.label}>
            ← {uiT('deepTime.past', locale)}
          </text>
          <text className="dt-ours__side" x={g.width - 12} y={14} textAnchor="end" fontSize={g.label}>
            {uiT('deepTime.future', locale)} →
          </text>

          {/* stupnice: roky našeho letopočtu */}
          {[...PAST_TICKS.map((p) => ({ x: X(now - 10 ** p), label: pastLabel(p), p })), ...FUTURE_TICKS.map((p) => ({ x: X(now + 10 ** p), label: futureLabel(p), p }))]
            .filter((tk) => !compact || [2, 6, 9].includes(tk.p) || (tk.x > center && tk.p % 2 === 0))
            .map((tk, i) => (
              <g key={i} className="dt-ours__tick">
                <line x1={tk.x} x2={tk.x} y1={g.top - 8} y2={g.top + rows.length * g.row + 8} />
                <text x={tk.x} y={g.top - 14} textAnchor="middle" fontSize={g.label - 1.5}>
                  {tk.label}
                </text>
              </g>
            ))}

          {/* délky z našeho světa: tady opravdu leží na ose */}
          {YARDSTICKS.map((ys, i) => {
            const x = X(ys.year);
            const step = compact ? 22 : 28;
            const y = g.top + rows.length * g.row + 22 + (i % 2) * step;
            return (
              <g key={ys.key} className="dt-ours__yard">
                <line x1={x} x2={x} y1={g.top - 8} y2={y - 9} />
                <text x={x} y={y} textAnchor="middle" fontSize={g.label - 1}>
                  {uiT(ys.key, locale)}
                </text>
                <text className="dt-ours__yard-when" x={x} y={y + g.label + 1} textAnchor="middle" fontSize={g.label - 1.5}>
                  {uiT(ys.when, locale)}
                </text>
              </g>
            );
          })}

          {/* řádky světů */}
          {rows.map((w, i) => {
            const py = w.deep.presentYear!;
            const y = g.top + i * g.row + g.row / 2;
            // Události jako roky našeho letopočtu: přesné datum, nebo odhad [od, do] jako dva roky.
            const placed = w.deep.events
              .filter((e) => e.after === undefined && (typeof e.ago === 'number' || isRange(e.ago)))
              .map((e) => ({
                e,
                mid: eventYear(e, py)!,
                from: isRange(e.ago) ? py - e.ago[1] : py - (e.ago as number),
                to: isRange(e.ago) ? py - e.ago[0] : py - (e.ago as number),
              }));
            const later = w.deep.events
              .filter((e) => typeof e.after === 'number')
              .map((e) => ({ e, year: py + (e.after as number) }));
            // Nejhlubší událost jako u vrtu nahoře (u odhadu podle středu), její starší mez = začátek pruhu.
            const deepest = placed.reduce<(typeof placed)[number] | null>((m, d) => (!m || d.mid < m.mid ? d : m), null);
            const oldest = deepest ? deepest.from : py;
            const solidFrom = deepest ? deepest.to : py;
            const deepRange = deepest && isRange(deepest.e.ago);
            // Hranice vrstev: středy událostí od přítomnosti do minulosti (stejně jako praskliny ve vrtu).
            const bounds = [...new Set(placed.map((d) => d.mid).filter((v) => v < py))]
              .sort((p, q) => q - p)
              .map((v) => Math.max(v, solidFrom));
            const layers: Array<[number, number]> = [];
            let edge = py;
            for (const bnd of bounds) {
              if (edge - bnd > 0) layers.push([bnd, edge]);
              edge = bnd;
            }
            if (edge - solidFrom > 0) layers.push([solidFrom, edge]);
            const playedFrom = py - w.sum.played;
            const isFocus = focus === w.id;
            const label = `${t(w.title, locale)}: ${formatYear(oldest, locale)} – ${formatYear(py, locale)}`;
            const hb = g.bar + 2;
            return (
              <g
                key={w.id}
                className={`dt-ours__row${isFocus ? ' is-focus' : ''}`}
                style={hue(w.accent)}
                role="button"
                tabIndex={0}
                aria-label={label}
                aria-pressed={picked === w.id}
                onMouseEnter={() => setHover(w.id)}
                onFocus={() => setHover(w.id)}
                onBlur={() => setHover(null)}
                onClick={() => onPick(picked === w.id ? null : w.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    onPick(picked === w.id ? null : w.id);
                  }
                }}
              >
                <rect className="dt-hit" x={0} y={y - g.row / 2} width={g.width} height={g.row} />
                <text className="dt-ours__name" x={g.gutter - 10} y={y + g.label * 0.35} textAnchor="end" fontSize={g.label}>
                  {t(w.title, locale)}
                </text>
                {/* vrstvy dějin (střídavé tóny), nejhlubší odhad do ztracena */}
                {layers.map(([x0, x1], k) => (
                  <rect key={`l${k}`} className="dt-layer" x={X(x0)} y={y - hb / 2} width={Math.max(X(x1) - X(x0), 0.8)} height={hb} />
                ))}
                {deepRange ? (
                  <rect x={X(oldest)} y={y - hb / 2} width={Math.max(X(solidFrom) - X(oldest), 1)} height={hb} fill={`url(#dt-ours-fade-${w.id})`} />
                ) : null}
                {/* nejisté vrstvy (odhady nad nejhlubší událostí) */}
                {placed
                  .filter((d) => d !== deepest && isRange(d.e.ago))
                  .map((d, k) => (
                    <rect key={`u${k}`} x={X(d.from)} y={y - hb / 2} width={Math.max(X(d.to) - X(d.from), 1)} height={hb} fill="url(#dt-unsure)" />
                  ))}
                {/* hratelná vrstva */}
                {w.sum.played > 0 ? (
                  <rect className="dt-played" x={X(playedFrom)} y={y - hb / 2} width={Math.max(X(py) - X(playedFrom), 1.5)} height={hb} />
                ) : null}
                {/* praskliny mezi vrstvami */}
                {bounds.map((bnd, k) => (
                  <line key={`c${k}`} className="dt-crack" x1={X(bnd)} x2={X(bnd)} y1={y - hb / 2} y2={y + hb / 2} />
                ))}
                {/* pozdější díly */}
                {later.map((d, k) => (
                  <g key={k}>
                    <line className="dt-ours__later" x1={X(py)} x2={X(d.year)} y1={y} y2={y} />
                    <circle className="dt-ours__later-end" cx={X(d.year)} cy={y} r={compact ? 2 : 3} />
                  </g>
                ))}
                {/* zlomy */}
                {placed
                  .filter((d) => d.e.kind === 'catastrophe' && d.mid < py)
                  .map((d, k) => (
                    <rect key={k} className="dt-seam" x={X(Math.max(d.mid, solidFrom)) - 1.25} y={y - hb / 2 - 2} width={2.5} height={hb + 4} />
                  ))}
                {/* přítomnost světa */}
                <rect className="dt-ours__now" x={X(py) - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${X(py)} ${y})`} />
                {isFocus && !compact ? (
                  <text className="dt-ours__tip" x={X(py) + 9} y={y + 4}>
                    {formatYear(oldest, locale)} – {formatYear(py, locale)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* dnes */}
          <line className="dt-ours__today" x1={center} x2={center} y1={g.top - 26} y2={g.top + rows.length * g.row + 8} />
          <text className="dt-ours__today-label" x={center} y={g.top - 30} textAnchor="middle" fontSize={g.label}>
            {uiT('deepTime.today', locale)} · {now}
          </text>
        </svg>
      </figure>
    </section>
  );
}
