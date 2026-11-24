import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { t, uiT, type Locale } from '../../lib/i18n';
import { SCALE, YARDSTICKS, eventYear, formatYear, isRange, nf, summarize, type GamePart, type LaterPart } from '../../lib/deep-time';
import type { DeepTimeWorld } from '../../lib/deep-time-pages';
import PartTip, { markOf, tipFor, type PartMark, type TipState } from './PartTip';

type Item = DeepTimeWorld & { sum: ReturnType<typeof summarize>; parts: GamePart[]; later: LaterPart[] };
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

/** Řády minulosti (do 10^9,8 let, kvůli vzniku Země) a budoucnosti (do 10^4,7 ≈ 50 000 let). */
const PAST = 9.8;
const FUTURE = 4.7;
/**
 * Minulost má stejný zlom jako vrty nahoře: do 100 000 let od dneška podrobně po řádech,
 * pak přetržená linka a stlačená propast od milionu let (vzdálené světy a éry našeho světa).
 */
const PAST_UNITS =
  SCALE.detailLog + SCALE.breakShare + (PAST - SCALE.abyssLog) * SCALE.abyssShare;
/** Kulaté roky na stupnici (na telefonu jen čtyři) a v propasti vzdálenost slovy. */
const TICK_YEARS = [-8000, 1000, 1900, 2000, 2050, 2100, 3000, 12000];
const TICK_YEARS_COMPACT = [-8000, 1900, 2100, 12000];
const DEEP_TICKS = [6, 9];

/** Rok na stupnici: „1900“, „12 000“, „−8 000“. */
function yearLabel(year: number, locale: Locale): string {
  if (year < 0) return `−${nf(-year, locale)}`;
  return year >= 10000 ? nf(year, locale) : String(year);
}
/** Vzdálenost od dneška (řády) jako vodorovný posun v jednotkách řádu. */
function pastUnits(log: number): number {
  const l = Math.min(log, PAST);
  if (l <= SCALE.detailLog) return l;
  if (l < SCALE.abyssLog) return SCALE.detailLog + ((l - SCALE.detailLog) / (SCALE.abyssLog - SCALE.detailLog)) * SCALE.breakShare;
  return SCALE.detailLog + SCALE.breakShare + (l - SCALE.abyssLog) * SCALE.abyssShare;
}

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
  const [tip, setTip] = useState<TipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const figRef = useRef<HTMLElement>(null);
  // `ear` = přesah zářezu dílu nad a pod vrt (jako u vrtů nahoře), `ring` = kroužek pozdějšího dílu.
  const g = compact
    ? { width: 390, gutter: 100, top: 54, row: 19, bar: 4, label: 8.5, zone: 6, bottom: 40, ear: 2, ring: 2 }
    : { width: 1000, gutter: 156, top: 52, row: 24, bar: 6, label: 11, zone: 10, bottom: 84, ear: 3, ring: 3 };
  const plot = g.width - g.gutter - 12;
  const decade = (plot - 2 * g.zone) / (PAST_UNITS + FUTURE);
  const center = g.gutter + g.zone + PAST_UNITS * decade;
  const X = (year: number) => {
    const d = year - now;
    const a = Math.abs(d);
    if (a < 1) return center + Math.sign(d) * g.zone * a;
    const log = Math.log10(a);
    const off = g.zone + (d < 0 ? pastUnits(log) : Math.min(log, FUTURE)) * decade;
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
  // Od nejstaršího (zleva) k nejmladšímu.
  // Značky pod grafem: éry z našeho světa a zlom stupnice (éra člověka rozumného leží uvnitř zlomu,
  // proto ji nahrazuje popisek zlomu). Zleva doprava.
  const marks = [
    ...YARDSTICKS.filter((ys) => ys.year < -(10 ** SCALE.abyssLog) || ys.year > -(10 ** SCALE.detailLog)).map((ys) => ({
      key: ys.key,
      when: ys.when,
      x: X(ys.year),
      isBreak: false,
    })),
    {
      key: 'deepTime.yardBreak',
      when: 'deepTime.yardBreakWhen',
      x: (X(now - 10 ** SCALE.detailLog) + X(now - 10 ** SCALE.abyssLog)) / 2,
      isBreak: true,
    },
  ].sort((a, b) => a.x - b.x);
  // Ztlumit ostatní jen tehdy, když vybraný svět na této ose leží.
  const focusRaw = picked ?? hover;
  const focus = focusRaw && rows.some((w) => w.id === focusRaw) ? focusRaw : hover;


  return (
    <section className="dt-ours" aria-labelledby="dt-ours-h">
      <h2 className="dt-ours__title" id="dt-ours-h">
        {uiT('deepTime.oursTitle', locale)}
      </h2>
      <p className="dt-ours__lead">{uiT('deepTime.oursLead', locale)}</p>
      <div className="dt-legend dt-legend--ours">
        <ul>
          {(
            [
              ['played', 'deepTime.legendPlayed'],
              ['layers', 'deepTime.legendLayers'],
              ['seam', 'deepTime.legendSeam'],
              ['unsure', 'deepTime.legendUnsure'],
              ['now', 'deepTime.legendNow'],
              ['later', 'deepTime.legendLater'],
            ] as const
          ).map(([key, label]) => (
            <li key={key}>
              <span className={`dt-glyph dt-glyph--h dt-glyph--h-${key}`} aria-hidden="true" />
              <span>{uiT(label, locale)}</span>
            </li>
          ))}
        </ul>
        <p className="dt-legend__hint">
          <span className="dt-hint--hover">{uiT('deepTime.oursHintHover', locale)}</span>
          <span className="dt-hint--touch">{uiT('deepTime.oursHint', locale)}</span>
        </p>
      </div>
      <figure
        className="dt-ours__chart"
        ref={figRef}
        onMouseLeave={() => {
          setHover(null);
          setTip(null);
        }}
      >
        <svg ref={svgRef} viewBox={`0 0 ${g.width} ${height}`} className={focus ? 'has-focus' : undefined} role="group" aria-label={uiT('deepTime.oursTitle', locale)}>
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
          <text className="dt-ours__side" x={g.gutter} y={compact ? 30 : 14} fontSize={g.label}>
            ← {uiT('deepTime.past', locale)}
          </text>
          <text className="dt-ours__side" x={g.width - 12} y={compact ? 30 : 14} textAnchor="end" fontSize={g.label}>
            {uiT('deepTime.future', locale)} →
          </text>

          {/* stupnice: roky našeho letopočtu */}
          {(compact ? TICK_YEARS_COMPACT : TICK_YEARS)
            .map((year) => ({ x: X(year), label: yearLabel(year, locale) }))
            .concat(compact ? [] : DEEP_TICKS.map((p) => ({ x: X(now - 10 ** p), label: tickLabel(now - 10 ** p, locale) })))
            .map((tk, i) => (
              <g key={i} className="dt-ours__tick">
                <line x1={tk.x} x2={tk.x} y1={g.top - 8} y2={g.top + rows.length * g.row + 8} />
                <text x={tk.x} y={g.top - 14} textAnchor="middle" fontSize={g.label - 1.5}>
                  {tk.label}
                </text>
              </g>
            ))}

          {/* délky z našeho světa: tady opravdu leží na ose */}
          {marks.map((m, i) => {
            const x = m.x;
            const base = g.top + rows.length * g.row;
            if (compact) {
              // Na telefonu jen číslo, popisky jsou v seznamu pod grafem.
              const y = base + 14 + (i % 2) * 14;
              return (
                <g key={m.key} className={`dt-ours__yard${m.isBreak ? ' is-break' : ''}`}>
                  {m.isBreak ? null : <line x1={x} x2={x} y1={g.top - 8} y2={y - 6} />}
                  <circle className="dt-ours__yard-dot" cx={x} cy={y} r={5.5} />
                  <text className="dt-ours__yard-num" x={x} y={y + 2.6} textAnchor="middle" fontSize={7}>
                    {i + 1}
                  </text>
                </g>
              );
            }
            const y = base + 22 + (i % 2) * 28;
            return (
              <g key={m.key} className={`dt-ours__yard${m.isBreak ? ' is-break' : ''}`}>
                {m.isBreak ? null : <line x1={x} x2={x} y1={g.top - 8} y2={y - 9} />}
                <text x={x} y={y} textAnchor="middle" fontSize={g.label - 1}>
                  {uiT(m.key, locale)}
                </text>
                <text className="dt-ours__yard-when" x={x} y={y + g.label + 1} textAnchor="middle" fontSize={g.label - 1.5}>
                  {uiT(m.when, locale)}
                </text>
              </g>
            );
          })}

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
            const later = w.later.map((l) => ({ ...l, year: py + l.after }));
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
            // Období her: od nejstaršího datovaného dílu po přítomnost; praskliny (události) jen v bledých dějinách před ním.
            const playedFrom = py - w.sum.played;
            const cracks = bounds.filter((bnd) => bnd < playedFrom - 1e-6);
            const marks: PartMark[] = [
              ...w.parts.map((p, k) => markOf(`p${k}`, X(py - p.ago), p.e, false)),
              ...later.map((d, k) => markOf(`l${k}`, X(d.year), d.e, true)),
            ];
            const tipKeys = tip?.id === w.id ? tip.keys : [];
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
                onPointerMove={(ev) => {
                  if (ev.pointerType !== 'mouse' || !svgRef.current || !figRef.current) return;
                  const next = tipFor(w.id, marks, ev.clientX, svgRef.current, figRef.current, 'h', { y: y - hb / 2 - g.ear - 5 });
                  setTip((prev) => (prev && next && prev.id === next.id && prev.keys.join() === next.keys.join() ? prev : next));
                }}
                onPointerLeave={() => setTip(null)}
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
                {/* období her */}
                {w.sum.played > 0 ? (
                  <rect className="dt-played" x={X(playedFrom)} y={y - hb / 2} width={Math.max(X(py) - X(playedFrom), 1.5)} height={hb} />
                ) : null}
                {/* praskliny mezi vrstvami (jen před obdobím her) */}
                {cracks.map((bnd, k) => (
                  <line key={`c${k}`} className="dt-crack" x1={X(bnd)} x2={X(bnd)} y1={y - hb / 2} y2={y + hb / 2} />
                ))}
                {/* hrané díly: zářez s přesahem, uvnitř tenká linka (stejně jako ve vrtech nahoře) */}
                {w.parts.map((p, k) => {
                  const year = py - p.ago;
                  const ear = g.ear + (tipKeys.includes(`p${k}`) ? 2.5 : 0);
                  const x0 = Math.min(X(year) - 1.3, X(py) - 2.6);
                  return (
                    <g key={`p${k}`} className="dt-part">
                      <rect x={x0} y={y - hb / 2 - ear} width={2.6} height={hb + 2 * ear} />
                      {p.ago > 0 ? <line x1={x0 + 1.3} x2={x0 + 1.3} y1={y - hb / 2} y2={y + hb / 2} /> : null}
                    </g>
                  );
                })}
                {/* pozdější díly: čárkovaně od přítomnosti, plný kroužek = hra */}
                {later.length ? <line className="dt-later" x1={X(py)} x2={X(later[later.length - 1].year) - g.ring} y1={y} y2={y} /> : null}
                {later.map((d, k) => (
                  <circle
                    key={`l${k}`}
                    className={`dt-later-end${d.isGame ? ' is-game' : ''}`}
                    cx={X(d.year)}
                    cy={y}
                    r={g.ring + (tipKeys.includes(`l${k}`) ? 1.2 : 0)}
                  />
                ))}
                {/* zlomy */}
                {placed
                  .filter((d) => d.e.kind === 'catastrophe' && d.mid < py)
                  .map((d, k) => (
                    <rect key={k} className="dt-seam" x={X(Math.max(d.mid, solidFrom)) - 1.25} y={y - hb / 2 - 2} width={2.5} height={hb + 4} />
                  ))}
                {/* přítomnost světa */}
                <rect className="dt-ours__now" x={X(py) - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${X(py)} ${y})`} />
                {isFocus && !compact && tip?.id !== w.id ? (
                  // U světů vpravo by popisek přetekl z grafu (do průřezu), proto jde nad vrt a končí u přítomnosti.
                  <text
                    className="dt-ours__tip"
                    x={X(py) > g.width - 190 ? X(py) - 4 : X(py) + 9}
                    y={X(py) > g.width - 190 ? y - 7 : y + 4}
                    textAnchor={X(py) > g.width - 190 ? 'end' : 'start'}
                  >
                    {formatYear(oldest, locale)} – {formatYear(py, locale)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* zlom stupnice: 100 000 let – milion let od dneška */}
          {(() => {
            const xa = X(now - 10 ** SCALE.detailLog) - 2.5;
            const xb = X(now - 10 ** SCALE.abyssLog) + 2.5;
            const y0 = g.top - 8;
            const y1 = g.top + rows.length * g.row + 8;
            const step = compact ? 7 : 10;
            const amp = compact ? 2 : 3;
            const zig = (x: number) => {
              const pts: string[] = [];
              for (let y = y0, i = 0; y <= y1 + step; y += step, i++) pts.push(`${x + (i % 2 ? amp : -amp)},${Math.min(y, y1)}`);
              return pts;
            };
            const a = zig(xa);
            const b = zig(xb);
            return (
              <g className="dt-break" aria-hidden="true">
                <polygon className="dt-break__gap" points={`${a.join(' ')} ${b.reverse().join(' ')}`} />
                <polyline className="dt-break__edge" points={zig(xa).join(' ')} />
                <polyline className="dt-break__edge" points={zig(xb).join(' ')} />
                {/* události, které padnou do zlomu: zlom jako tušová spára, jiné jako linka v barvě archetypu */}
                {rows.flatMap((w, i) => {
                  const py = w.deep.presentYear!;
                  const y = g.top + i * g.row + g.row / 2;
                  const hb = g.bar + 2;
                  return w.deep.events
                    .filter((e) => e.after === undefined && (typeof e.ago === 'number' || isRange(e.ago)))
                    .map((e) => ({ e, year: eventYear(e, py)! }))
                    .filter(({ year }) => now - year > 10 ** SCALE.detailLog && now - year < 10 ** SCALE.abyssLog)
                    .map(({ e, year }, k) =>
                      e.kind === 'catastrophe' ? (
                        <rect key={`${w.id}-${k}`} className="dt-seam" x={X(year) - 1.25} y={y - hb / 2 - 2} width={2.5} height={hb + 4} />
                      ) : (
                        <line key={`${w.id}-${k}`} className="dt-break__mark" style={hue(w.accent)} x1={X(year)} x2={X(year)} y1={y - hb / 2} y2={y + hb / 2} />
                      ),
                    );
                })}
              </g>
            );
          })()}

          {/* dnes */}
          <line className="dt-ours__today" x1={center} x2={center} y1={compact ? 16 : g.top - 26} y2={g.top + rows.length * g.row + 8} />
          <text className="dt-ours__today-label" x={center} y={compact ? 11 : g.top - 30} textAnchor="middle" fontSize={g.label}>
            {uiT('deepTime.today', locale)} · {now}
          </text>
        </svg>
        {tip ? <PartTip tip={tip} locale={locale} accent={rows.find((w) => w.id === tip.id)?.accent} /> : null}
        {compact ? (
          <ol className="dt-ours__yards">
            {marks.map((m) => (
              <li key={m.key}>
                {uiT(m.key, locale)} <span>{uiT(m.when, locale)}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </figure>
    </section>
  );
}
