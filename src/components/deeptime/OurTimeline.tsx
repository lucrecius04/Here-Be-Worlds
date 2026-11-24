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
};

const hue = (accent: { light: string; dark: string }) =>
  ({ '--dt-hue-l': accent.light, '--dt-hue-d': accent.dark }) as CSSProperties;

/** Řády minulosti (do 10^10,2 let, kvůli vzniku vesmíru) a budoucnosti (do 10^4,7 ≈ 50 000 let). */
const PAST = 10.2;
const FUTURE = 4.7;
/** Hluboká minulost (nad 10 000 let) má poloviční šířku řádu, aby zbylo místo kolem dneška. */
const DEEP_FROM = 4;
const DEEP_WEIGHT = 0.5;
const PAST_TICKS = [1, 2, 3, 4, 7, 9];
const FUTURE_TICKS = [1, 2, 3, 4];
const pastSpan = (log: number) => Math.min(log, DEEP_FROM) + Math.max(0, log - DEEP_FROM) * DEEP_WEIGHT;

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
export default function OurTimeline({ worlds, now, locale, compact, picked, onPick }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const g = compact
    ? { width: 390, gutter: 100, top: 40, row: 19, bar: 4, label: 8.5, zone: 6, bottom: 62 }
    : { width: 1000, gutter: 156, top: 52, row: 24, bar: 6, label: 11, zone: 10, bottom: 64 };
  const plot = g.width - g.gutter - 12;
  const decade = (plot - 2 * g.zone) / (pastSpan(PAST) + FUTURE);
  const center = g.gutter + g.zone + pastSpan(PAST) * decade;
  const X = (year: number) => {
    const d = year - now;
    const a = Math.abs(d);
    if (a < 1) return center + Math.sign(d) * g.zone * a;
    const log = Math.log10(a);
    const off = g.zone + (d < 0 ? pastSpan(Math.min(log, PAST)) : Math.min(log, FUTURE)) * decade;
    return d < 0 ? center - off : center + off;
  };
  const breakX = X(now - 10 ** (DEEP_FROM + 1));

  const rows = useMemo(
    () =>
      worlds
        .filter((w) => typeof w.deep.presentYear === 'number')
        .sort((a, b) => (a.deep.presentYear ?? 0) - (b.deep.presentYear ?? 0)),
    [worlds],
  );
  const height = g.top + rows.length * g.row + g.bottom;
  const focus = picked ?? hover;

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
            .filter((tk) => !compact || [2, 4, 9].includes(tk.p) || (tk.x > center && tk.p % 2 === 0))
            .map((tk, i) => (
              <g key={i} className="dt-ours__tick">
                <line x1={tk.x} x2={tk.x} y1={g.top - 8} y2={g.top + rows.length * g.row + 8} />
                <text x={tk.x} y={g.top - 14} textAnchor="middle" fontSize={g.label - 1.5}>
                  {tk.label}
                </text>
              </g>
            ))}

          {/* zlom stupnice: hlubší minulost má poloviční řády */}
          <path
            className="dt-ours__break"
            d={`M${breakX - 4} ${g.top - 2} l3 -6 l3 6 l3 -6`}
            aria-hidden="true"
          />

          {/* délky z našeho světa: tady opravdu leží na ose */}
          {YARDSTICKS.map((ys, i) => {
            const x = X(now - ys.years);
            const y = g.top + rows.length * g.row + 22 + (i % (compact ? 3 : 2)) * (compact ? 12 : 15);
            return (
              <g key={ys.key} className="dt-ours__yard">
                <line x1={x} x2={x} y1={g.top - 8} y2={y - 9} />
                <text x={x} y={y} textAnchor="middle" fontSize={g.label - 1.5}>
                  {uiT(ys.key, locale)}
                </text>
              </g>
            );
          })}

          {/* řádky světů */}
          {rows.map((w, i) => {
            const py = w.deep.presentYear!;
            const y = g.top + i * g.row + g.row / 2;
            const dated = w.deep.events
              .map((e) => ({ e, year: eventYear(e, py) }))
              .filter((d): d is { e: (typeof w.deep.events)[number]; year: number } => d.year !== null);
            const past = dated.filter((d) => d.e.after === undefined);
            const later = dated.filter((d) => d.e.after !== undefined);
            const oldest = past.reduce((m, d) => Math.min(m, d.year), py);
            const oldestRange = past.find((d) => d.year === oldest && isRange(d.e.ago));
            const oldestSolid = oldestRange ? py - (oldestRange.e.ago as [number, number])[0] : oldest;
            const playedFrom = py - w.sum.played;
            const isFocus = focus === w.id;
            const label = `${t(w.title, locale)}: ${formatYear(oldest, locale)} – ${formatYear(py, locale)}`;
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
                {/* dějiny světa: nejstarší datovaná událost → přítomnost */}
                {oldestRange ? (
                  <line className="dt-ours__fade" x1={X(oldest)} x2={X(oldestSolid)} y1={y} y2={y} strokeWidth={g.bar} />
                ) : null}
                <line className="dt-ours__span" x1={X(oldestSolid)} x2={X(py)} y1={y} y2={y} strokeWidth={g.bar} />
                {w.sum.played > 0 ? (
                  <line className="dt-ours__played" x1={X(playedFrom)} x2={X(py)} y1={y} y2={y} strokeWidth={g.bar} />
                ) : null}
                {/* pozdější díly */}
                {later.map((d, k) => (
                  <g key={k}>
                    <line className="dt-ours__later" x1={X(py)} x2={X(d.year)} y1={y} y2={y} />
                    <circle className="dt-ours__later-end" cx={X(d.year)} cy={y} r={compact ? 2 : 3} />
                  </g>
                ))}
                {/* zlomy */}
                {past
                  .filter((d) => d.e.kind === 'catastrophe')
                  .map((d, k) => (
                    <line key={k} className="dt-ours__seam" x1={X(d.year)} x2={X(d.year)} y1={y - g.bar} y2={y + g.bar} />
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
