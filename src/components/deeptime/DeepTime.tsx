import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { t, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  DECADES,
  SCALE,
  measuredHeight,
  mythTop,
  breakZone,
  agoMid,
  depthY,
  formatAgo,
  formatDuration,
  isRange,
  summarize,
  type DeepEvent,
  type DeepKind,
} from '../../lib/deep-time';
import type { DeepTimeWorld } from '../../lib/deep-time-pages';
import type { ThemeChapter } from '../../lib/theme-pages';
import OurTimeline from './OurTimeline';
import '../../styles/deep-time.css';

type Props = { base: string; worlds: DeepTimeWorld[]; chapters: ThemeChapter[]; now: number };
type Sort = 'depth' | 'archetype';

const hue = (accent: { light: string; dark: string }) =>
  ({ '--dt-hue-l': accent.light, '--dt-hue-d': accent.dark }) as CSSProperties;

/**
 * Rozměry grafu: na počítači se jmény světů, na telefonu úzké vrty bez jmen.
 * Na telefonu s jediným archetypem (`focusCount`) širší vrty a jména jako na počítači.
 */
function geometry(compact: boolean, focusCount = 0, longestName = 0) {
  if (compact && focusCount) {
    // Nejvýš o kousek širší než u Fantasy (12 světů), aby se málo světů nezvětšilo přes celý displej.
    const pitch = Math.min(30, (390 - 64 - 8) / focusCount);
    // Nad hladinou jen tolik místa, kolik potřebuje nejdelší jméno.
    const top = Math.round(18 + longestName * 6.2);
    return { gutter: 64, pitch, col: Math.round(pitch * 0.5), top, groupGap: 0, label: 10.5, decade: 58 };
  }
  return compact
    ? { gutter: 58, pitch: 7.6, col: 5, top: 14, groupGap: 5, label: 9.5, decade: 58 }
    : { gutter: 132, pitch: 19, col: 11, top: 150, groupGap: 14, label: 10.5, decade: SCALE.decade };
}

const DECADE_KEYS = [
  'deepTime.d0',
  'deepTime.d1',
  'deepTime.d2',
  'deepTime.d3',
  'deepTime.d4',
  'deepTime.d5',
  'deepTime.d6',
  'deepTime.d7',
  'deepTime.d8',
  'deepTime.d9',
  'deepTime.d10',
];

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return compact;
}

/** Nejhlubší umístěná událost slovy (u odhadu „řádově tisíce let“). */
function deepLabel(sum: ReturnType<typeof summarize>, locale: Locale) {
  return sum.deepestEvent ? formatAgo(sum.deepestEvent, locale) : formatDuration(sum.deepest, locale);
}

function KindMark({ kind }: { kind: DeepKind }) {
  return <span className={`dt-kind dt-kind--${kind}`} aria-hidden="true" />;
}

export default function DeepTime({ base, worlds, chapters, now }: Props) {
  const locale = useLocale();
  const compact = useCompact();
  const [sort, setSort] = useState<Sort>('depth');
  // Na telefonu: jen jeden archetyp, aby byly vrty širší a se jmény.
  const [only, setOnly] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  // Na užším displeji je průřez pod grafem: po výběru světa na něj sjeď.
  useEffect(() => {
    if (!picked || !window.matchMedia('(max-width: 1100px)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panel = panelRef.current;
    if (!panel) return;
    // Zakotvit přesně pod lepivý pruh s řazením (a hlavičku webu, je-li vidět).
    const bar = document.querySelector('.dt-sticky');
    const barTop = bar ? parseFloat(getComputedStyle(bar).top) || 0 : 0;
    const cover = barTop + (bar ? bar.getBoundingClientRect().height : 0) + 12;
    window.scrollTo({ top: panel.getBoundingClientRect().top + window.scrollY - cover, behavior: reduce ? 'auto' : 'smooth' });
  }, [picked]);

  const items = useMemo(() => worlds.map((w) => ({ ...w, sum: summarize(w.deep) })), [worlds]);
  const focusOn = compact && sort === 'archetype' && only ? only : null;
  const shown = useMemo(() => (focusOn ? items.filter((w) => w.chapterId === focusOn) : items), [items, focusOn]);
  const longestName = focusOn ? Math.max(...shown.map((w) => t(w.title, locale).length)) : 0;
  const g = useMemo(() => geometry(compact, focusOn ? shown.length : 0, longestName), [compact, focusOn, shown.length, longestName]);
  const chapterOrder = useMemo(() => new Map(chapters.map((c, i) => [c.id, i])), [chapters]);

  // Pořadí a vodorovné polohy vrtů (při přeřazení se vrty přesunou plynule).
  const layout = useMemo(() => {
    const sorted = [...shown].sort((a, b) =>
      sort === 'depth'
        ? b.sum.deepestMid - a.sum.deepestMid || Number(b.sum.hasMyth) - Number(a.sum.hasMyth) || a.number - b.number
        : (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0) || b.sum.deepestMid - a.sum.deepestMid,
    );
    const xs = new Map<string, number>();
    const groups: Array<{ id: string; x1: number; x2: number }> = [];
    let x = g.gutter;
    let prev: string | null = null;
    for (const w of sorted) {
      if (sort === 'archetype' && prev !== null && prev !== w.chapterId) x += g.groupGap;
      if (sort === 'archetype' && prev !== w.chapterId) groups.push({ id: w.chapterId, x1: x, x2: x });
      xs.set(w.id, x);
      if (sort === 'archetype') groups[groups.length - 1].x2 = x + g.pitch;
      x += g.pitch;
      prev = w.chapterId;
    }
    // Na telefonu s jedním archetypem drží graf šířku displeje, takže se nezvětšuje.
    return { sorted, xs, groups, width: compact && focusOn ? Math.max(x + 8, 390) : x + 8 };
  }, [shown, sort, g, chapterOrder, compact, focusOn]);

  const MEASURED_HEIGHT = measuredHeight(g.decade);
  const MYTH_TOP = mythTop(g.decade);
  const height = g.top + MYTH_TOP + SCALE.myth + 6;
  const Y = (years: number) => g.top + depthY(years, g.decade);
  const mythY = (i: number) => g.top + MYTH_TOP + 16 + i * 17;
  const cycleY = g.top + MYTH_TOP + SCALE.myth - 10;

  const focus = picked ?? hover;
  const active = items.find((w) => w.id === focus) ?? null;

  const records = useMemo(() => {
    const deepest = Math.max(...items.map((w) => w.sum.deepest));
    const placedWorlds = items.filter((w) => w.sum.deepest > 0 && !w.sum.noDates);
    const shallow = Math.min(...placedWorlds.map((w) => w.sum.deepest));
    return {
      deepest,
      deepestWorlds: items.filter((w) => w.sum.deepest === deepest),
      shallow,
      shallowWorlds: placedWorlds.filter((w) => w.sum.deepest === shallow),
      noDates: items.filter((w) => w.sum.noDates),
    };
  }, [items]);

  const names = (list: typeof items) => list.map((w) => t(w.title, locale)).join(' · ');

  return (
    <div className="dt-page">
      <header className="atlas-page__head page-band dt-head">
        <h1 className="atlas-page__title display">{uiT('deepTime.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('deepTime.lead', locale)}</p>
      </header>

      <dl className="dt-records">
        <div>
          <dt>{uiT('deepTime.deepest', locale)}</dt>
          <dd className="dt-records__value">{formatDuration(records.deepest, locale)}</dd>
          <dd className="dt-records__who">{names(records.deepestWorlds)}</dd>
        </div>
        <div>
          <dt>{uiT('deepTime.shallowest', locale)}</dt>
          <dd className="dt-records__value">{formatDuration(records.shallow, locale)}</dd>
          <dd className="dt-records__who">{names(records.shallowWorlds)}</dd>
        </div>
        <div>
          <dt>{uiT('deepTime.noDates', locale)}</dt>
          <dd className="dt-records__value">
            {records.noDates.length} {locale === 'cs' ? (records.noDates.length >= 5 ? 'světů' : 'světy') : 'worlds'}
          </dd>
          <dd className="dt-records__who">{names(records.noDates)}</dd>
        </div>
      </dl>

      <div className="dt-sticky">
      <div className="dt-toolbar">
        <div className="dt-sort" role="group" aria-label={uiT('deepTime.sort', locale)}>
          <span className="dt-sort__label" aria-hidden="true">
            {uiT('deepTime.sort', locale)}
          </span>
          {(['depth', 'archetype'] as const).map((key) => (
            <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>
              {uiT(key === 'depth' ? 'deepTime.sortDepth' : 'deepTime.sortArchetype', locale)}
            </button>
          ))}
        </div>
        <div className="dt-pickrow">
        <label className="dt-pick">
          <span className="visually-hidden">{uiT('deepTime.pick', locale)}</span>
          <select value={picked ?? ''} onChange={(e) => setPicked(e.target.value || null)}>
            <option value="">{uiT('deepTime.pick', locale)}</option>
            {[...items]
              .sort((a, b) => t(a.title, locale).localeCompare(t(b.title, locale), locale))
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {t(w.title, locale)}
                </option>
              ))}
          </select>
        </label>
        {picked ? (
          <button type="button" className="dt-clear" onClick={() => setPicked(null)}>
            {uiT('deepTime.clearPick', locale)}
          </button>
        ) : null}
        </div>
      </div>
      {compact && sort === 'archetype' ? (
        <div className="dt-only" role="group" aria-label={uiT('deepTime.onlyLabel', locale)}>
          <button type="button" aria-pressed={!only} onClick={() => setOnly(null)}>
            {uiT('deepTime.onlyAll', locale)}
          </button>
          {chapters.map((c) => (
            <button key={c.id} type="button" aria-pressed={only === c.id} style={hue(c.accent)} onClick={() => setOnly(only === c.id ? null : c.id)}>
              <span className="dt-only__dot" aria-hidden="true" />
              {t(c.short, locale)}
            </button>
          ))}
        </div>
      ) : null}
      </div>
      <Legend locale={locale} />

      <div className={`dt-layout${active && picked ? ' has-panel' : ''}`}>
        <div className="dt-main">
        <figure className="dt-chart" onMouseLeave={() => setHover(null)}>
          <svg
            viewBox={`0 0 ${layout.width} ${height}`}
            className={focus ? 'has-focus' : undefined}
            role="group"
            aria-label={uiT('deepTime.chartLabel', locale)}
          >
            <defs>
              <linearGradient id="dt-abyss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className="dt-abyss-0" />
                <stop offset="1" className="dt-abyss-1" />
              </linearGradient>
              <pattern id="dt-fog" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="6" className="dt-fog-line" />
              </pattern>
              <pattern id="dt-unsure" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                <line x1="0" y1="0" x2="0" y2="4" className="dt-unsure-line" />
              </pattern>
              {items.map((w) => (
                <linearGradient key={w.id} id={`dt-fade-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" className="dt-fade-0" style={hue(w.accent)} />
                  <stop offset="1" className="dt-fade-1" style={hue(w.accent)} />
                </linearGradient>
              ))}
            </defs>

            {/* hlubina: tmavne dolů, pod ní mýtický čas v mlze */}
            <rect x={g.gutter - 6} y={g.top} width={layout.width - g.gutter + 6} height={MEASURED_HEIGHT} fill="url(#dt-abyss)" />
            <rect className="dt-myth-band" x={g.gutter - 6} y={g.top + MYTH_TOP} width={layout.width - g.gutter + 6} height={SCALE.myth} />
            <rect x={g.gutter - 6} y={g.top + MYTH_TOP} width={layout.width - g.gutter + 6} height={SCALE.myth} fill="url(#dt-fog)" />

            {/* stupnice */}
            <g className="dt-scale" aria-hidden="true">
              <rect className="dt-subyear" x={g.gutter - 6} y={g.top} width={layout.width - g.gutter + 6} height={SCALE.subYear} />
              {DECADES.map((d) => {
                // V propasti na telefonu jen milion a miliarda.
                if (compact && d > SCALE.detailLog && d !== 6 && d !== 9) return null;
                const y = Y(10 ** d);
                return (
                  <g key={d}>
                    <line className="dt-grid" x1={g.gutter - 6} x2={layout.width} y1={y} y2={y} />
                    <text
                      className="dt-scale__label"
                      x={g.gutter - 12}
                      // u zlomu odsunout popisky od přetržené linky: 100 000 nad ni, milion pod ni
                      y={y + (d === SCALE.detailLog ? -2 : d === SCALE.abyssLog ? 9 : 3.5)}
                      textAnchor="end"
                      fontSize={g.label}
                    >
                      {uiT(compact ? `${DECADE_KEYS[d]}s` : DECADE_KEYS[d], locale)}
                    </text>
                  </g>
                );
              })}
              <text className="dt-scale__label dt-scale__myth" x={g.gutter - 12} y={g.top + MYTH_TOP + 20} textAnchor="end" fontSize={g.label}>
                {uiT(compact ? 'deepTime.mythShort' : 'deepTime.myth', locale)}
              </text>
              {!compact ? (
                <text className="dt-scale__label dt-scale__myth" x={g.gutter - 12} y={cycleY + 3.5} textAnchor="end" fontSize={g.label}>
                  {uiT('deepTime.cycles', locale)}
                </text>
              ) : null}
            </g>

            {/* skupiny archetypů */}
            {sort === 'archetype' && !compact
              ? layout.groups.map((gr) => {
                  const c = chapters.find((x) => x.id === gr.id);
                  return c ? (
                    <g key={gr.id} className="dt-group" style={hue(c.accent)} aria-hidden="true">
                      <line x1={gr.x1} x2={gr.x2 - (g.pitch - g.col)} y1={6} y2={6} />
                      <text x={gr.x1} y={18} fontSize={9.5}>
                        {t(c.short, locale)}
                      </text>
                    </g>
                  ) : null;
                })
              : null}

            {/* vrty */}
            {layout.sorted.map((w) => {
              const x = layout.xs.get(w.id) ?? 0;
              const placed = w.deep.events.filter((e) => typeof e.ago === 'number' || isRange(e.ago));
              const deepestEvent = w.sum.deepestEvent;
              const deepRange = deepestEvent && isRange(deepestEvent.ago) ? deepestEvent.ago : null;
              const yEnd = w.sum.deepest > 0 ? Y(w.sum.deepest) : g.top;
              const solidEnd = deepRange ? Y(deepRange[0]) : yEnd;
              // hranice vrstev (středy událostí), od hladiny dolů
              const bounds = [...new Set(placed.map((e) => agoMid(e.ago) ?? 0).filter((v) => v > 0))]
                .sort((a, b) => a - b)
                .map((v) => Math.min(Y(v), solidEnd));
              const layers: Array<[number, number]> = [];
              let from = g.top;
              for (const b of bounds) {
                if (b > from + 0.4) layers.push([from, b]);
                from = b;
              }
              if (solidEnd > from + 0.4) layers.push([from, solidEnd]);
              const myths = w.deep.events.filter((e) => e.ago === 'myth');
              const label = `${t(w.title, locale)}: ${
                w.sum.noDates ? uiT('deepTime.noDatesShort', locale) : deepLabel(w.sum, locale)
              }`;
              const isFocus = focus === w.id;
              return (
                <g
                  key={w.id}
                  className={`dt-core${isFocus ? ' is-focus' : ''}${picked === w.id ? ' is-picked' : ''}`}
                  style={{ ...hue(w.accent), transform: `translate(${x}px, 0)` }}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={picked === w.id}
                  onMouseEnter={() => setHover(w.id)}
                  onFocus={() => setHover(w.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => setPicked(picked === w.id ? null : w.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPicked(picked === w.id ? null : w.id);
                    }
                  }}
                >
                  <rect className="dt-hit" x={-(g.pitch - g.col) / 2} y={0} width={g.pitch} height={height} />
                  {!compact || focusOn ? (
                    <text className="dt-name" transform={`translate(${g.col / 2 + 3.5}, ${g.top - 10}) rotate(-90)`} fontSize={g.label + 0.5}>
                      {t(w.title, locale)}
                    </text>
                  ) : null}
                  <g className="dt-drill" style={{ transformOrigin: `0px ${g.top}px`, animationDelay: `${layout.sorted.indexOf(w) * 22}ms` }}>
                  {/* vrstvy dějin */}
                  {layers.map(([a, b], i) => (
                    <rect key={i} className="dt-layer" x={0} y={a} width={g.col} height={b - a} />
                  ))}
                  {deepRange ? (
                    <rect x={0} y={solidEnd} width={g.col} height={Math.max(yEnd - solidEnd, 1)} fill={`url(#dt-fade-${w.id})`} />
                  ) : null}
                  {/* nejisté vrstvy (odhady nad nejhlubší událostí) */}
                  {placed
                    .filter((e) => isRange(e.ago) && e !== deepestEvent)
                    .map((e, i) => {
                      const [lo, hi] = e.ago as [number, number];
                      return <rect key={`u${i}`} x={0} y={Y(lo)} width={g.col} height={Math.max(Y(hi) - Y(lo), 1)} fill="url(#dt-unsure)" />;
                    })}
                  {/* hratelná vrstva */}
                  {w.sum.played > 0 ? <rect className="dt-played" x={0} y={g.top} width={g.col} height={Math.max(Y(w.sum.played) - g.top, 1.5)} /> : null}
                  {/* praskliny mezi vrstvami */}
                  {bounds.map((b, i) => (
                    <line key={`c${i}`} className="dt-crack" x1={0} x2={g.col} y1={b} y2={b} />
                  ))}
                  {/* zlomy */}
                  {placed
                    .filter((e) => e.kind === 'catastrophe' && (agoMid(e.ago) ?? 0) > 0)
                    .map((e, i) => {
                      const y = Math.min(Y(agoMid(e.ago)!), yEnd);
                      return <rect key={`k${i}`} className="dt-seam" x={-2} y={y - 1.25} width={g.col + 4} height={2.5} />;
                    })}
                  </g>
                  <g className="dt-late" style={{ animationDelay: `${900 + layout.sorted.indexOf(w) * 22}ms` }}>
                  {/* mýtický čas */}
                  {myths.length || w.sum.noDates ? (
                    <line
                      className="dt-thread"
                      x1={g.col / 2}
                      x2={g.col / 2}
                      y1={Math.max(yEnd, g.top) + 2}
                      y2={myths.length ? mythY(0) - 4 : g.top + MYTH_TOP - 4}
                    />
                  ) : null}
                  {myths.map((e, i) => (
                    <circle key={`m${i}`} className="dt-myth" cx={g.col / 2} cy={mythY(i)} r={compact ? 2.2 : 3.4}>
                      <title>{e.text}</title>
                    </circle>
                  ))}
                  {/* cyklus */}
                  {w.deep.cycle ? (
                    <path
                      className="dt-cycle"
                      transform={`translate(${g.col / 2}, ${cycleY})`}
                      d={compact ? 'M-2.5 0a2.5 2.5 0 1 0 2.5-2.5' : 'M-4 0a4 4 0 1 0 4-4m0 0l-1.8-1.6M0-4l-1.8 1.6'}
                    />
                  ) : null}
                  </g>
                  {/* hloubka u kurzoru */}
                  {isFocus && !compact ? (
                    <g className="dt-tip" aria-hidden="true">
                      <line x1={-6 - x + g.gutter} x2={0} y1={yEnd} y2={yEnd} />
                      <text x={g.col + 6} y={Math.max(yEnd, g.top + 12) + 4}>
                        {w.sum.noDates ? uiT('deepTime.noDatesShort', locale) : deepLabel(w.sum, locale)}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}

            {/* zlom stupnice: přetržená mapa mezi podrobnou částí a propastí */}
            {(() => {
              const [b0, b1] = breakZone(g.decade);
              const y0 = g.top + b0 + 3;
              const y1 = g.top + b1 - 3;
              const x0 = g.gutter - 6;
              const x1 = layout.width;
              const step = compact ? 8 : 12;
              const amp = compact ? 2.5 : 3.5;
              const zig = (y: number) => {
                const pts: string[] = [];
                for (let x = x0, i = 0; x <= x1 + step; x += step, i++) pts.push(`${x},${y + (i % 2 ? amp : -amp)}`);
                return pts.join(' ');
              };
              return (
                <g className="dt-break" aria-hidden="true">
                  <polygon className="dt-break__gap" points={`${zig(y0)} ${zig(y1).split(' ').reverse().join(' ')}`} />
                  <polyline className="dt-break__edge" points={zig(y0)} />
                  <polyline className="dt-break__edge" points={zig(y1)} />
                </g>
              );
            })()}

            {/* hladina: teď */}
            <line className="dt-surface" x1={g.gutter - 6} x2={layout.width} y1={g.top} y2={g.top} />
            <text className="dt-scale__now" x={g.gutter - 12} y={g.top + 4} textAnchor="end" fontSize={g.label}>
              {uiT('deepTime.now', locale)}
            </text>
          </svg>
        </figure>
        <OurTimeline worlds={items} chapterOrder={sort === 'archetype' ? chapterOrder : undefined} now={now} locale={locale} compact={compact} picked={picked} onPick={setPicked} />
        </div>

        <aside className="dt-panel" aria-live="polite" ref={panelRef}>
          {active && picked ? (
            <WorldPanel world={active} base={base} locale={locale} chapters={chapters} pinned onClose={() => setPicked(null)} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Legend({ locale }: { locale: Locale }) {
  const rows: Array<[string, string]> = [
    ['played', 'deepTime.legendPlayed'],
    ['layers', 'deepTime.legendLayers'],
    ['seam', 'deepTime.legendSeam'],
    ['unsure', 'deepTime.legendUnsure'],
    ['myth', 'deepTime.legendMyth'],
    ['cycle', 'deepTime.legendCycle'],
  ];
  return (
    <div className="dt-legend">
      <h2 className="visually-hidden">{uiT('deepTime.howTo', locale)}</h2>
      <ul>
        {rows.map(([key, label]) => (
          <li key={key}>
            <span className={`dt-glyph dt-glyph--${key}`} aria-hidden="true" />
            <span>{uiT(label, locale)}</span>
          </li>
        ))}
      </ul>
      <p className="dt-legend__hint">{uiT('deepTime.hint', locale)}</p>
    </div>
  );
}

function WorldPanel({
  world,
  base,
  locale,
  chapters,
  pinned,
  onClose,
}: {
  world: DeepTimeWorld & { sum: ReturnType<typeof summarize> };
  base: string;
  locale: Locale;
  chapters: ThemeChapter[];
  pinned: boolean;
  onClose: () => void;
}) {
  const chapter = chapters.find((c) => c.id === world.chapterId);
  const later = world.deep.events.filter((e) => e.after !== undefined);
  // Od hladiny dolů: přítomnost nahoře, nejstarší dole (jako vrt).
  const down = world.deep.events.filter((e) => e.after === undefined).slice().reverse();
  const row = (e: DeepEvent, i: number) => (
    <li key={i} className={`dt-ev dt-ev--${e.kind}${e.ago === 'myth' ? ' is-myth' : ''}${e.ago === null ? ' is-undated' : ''}`}>
      <span className="dt-ev__depth">{formatAgo(e, locale)}</span>
      <span className="dt-ev__body">
        <span className="dt-ev__when">
          <KindMark kind={e.kind} /> {e.when}
        </span>
        <span className="dt-ev__text">{e.text}</span>
      </span>
    </li>
  );
  return (
    <div className="dt-world" style={hue(world.accent)}>
      <div className="dt-world__top">
      <div className="dt-world__head">
        <p className="dt-panel__kicker">{chapter ? t(chapter.short, locale) : ''}</p>
        {pinned ? (
          <button type="button" className="dt-world__close" onClick={onClose} aria-label={uiT('deepTime.close', locale)}>
            ×
          </button>
        ) : null}
      </div>
      <h2 className="dt-world__name">
        <a href={withBase(base, `/worlds/${world.id}/`)}>{t(world.title, locale)}</a>
      </h2>
      <dl className="dt-world__facts">
        <div>
          <dt>{uiT('deepTime.present', locale)}</dt>
          <dd>{world.deep.present}</dd>
        </div>
        <div>
          <dt>{uiT('deepTime.reach', locale)}</dt>
          <dd>
            {world.sum.noDates ? uiT('deepTime.noDatesShort', locale) : deepLabel(world.sum, locale)}
            {world.sum.hasMyth ? ` + ${uiT('deepTime.mythShort', locale)}` : ''}
          </dd>
        </div>
        <div>
          <dt>{uiT('deepTime.played', locale)}</dt>
          <dd>{world.sum.played > 0 ? formatDuration(world.sum.played, locale) : uiT('deepTime.playedNow', locale)}</dd>
        </div>
      </dl>
      {world.deep.cycle ? (
        <p className="dt-world__cycle">
          <span className="dt-glyph dt-glyph--cycle" aria-hidden="true" /> {world.deep.cycle}
        </p>
      ) : null}
      {later.length ? (
        <>
          <h3 className="dt-world__sub">{uiT('deepTime.later', locale)}</h3>
          <ol className="dt-events">{later.map(row)}</ol>
        </>
      ) : null}
      </div>
      <h3 className="dt-world__sub">{uiT('deepTime.drill', locale)}</h3>
      <ol className="dt-events">{down.map(row)}</ol>
      <p className="dt-world__more">
        <a href={withBase(base, `/worlds/${world.id}/?view=appendices${world.anchor ? `#${world.anchor}` : ''}`)}>
          {uiT('deepTime.full', locale)} →
        </a>
      </p>
    </div>
  );
}
