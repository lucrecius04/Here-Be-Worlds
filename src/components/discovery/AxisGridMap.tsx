import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, worldsCountLabel, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS, type AxisKey } from '../../lib/axes';
import { kinshipRanking } from '../../lib/compare';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';
import axesMeta from '../../../data/meta/axes.json';
import { axisPoleLabel } from './MiniAxes';

/**
 * Kartografie os — mřížka 5 × 5 pro dvě zvolené osy profilu.
 * Hodnoty os jsou celá čísla 1–5, proto mapa nepředstírá spojitou rovinu:
 * každé pole je parcela se seznamem svých světů. Příbuznost se tu nepočítá,
 * spis světa jen přebírá index ze Srovnání (kinshipRanking).
 */

type ChapterLite = { id: string; title: LocalizedString; accent: { light: string; dark: string } };
type ThemeLite = { slug: string; label: LocalizedString };

type Props = {
  worlds: World[];
  chapters: ChapterLite[];
  themes: ThemeLite[];
  base: string;
};

type Layout = {
  H: number;
  W: number;
  m: { l: number; r: number; t: number; b: number };
  cw: number;
  top: number[];
  rowH: number[];
  cells: World[][][];
  pos: Map<string, [number, number]>;
  compact: boolean;
};

const AXIS_NAME_KEY: Record<AxisKey, string> = {
  hopeDespair: 'map.nameHopeDespair',
  knownUnknown: 'map.nameKnownUnknown',
  intimateEpic: 'map.nameIntimateEpic',
  moralClarityAmbiguity: 'map.nameMoralClarityAmbiguity',
  realismMetaphysical: 'map.nameRealismMetaphysical',
};

const meta = (key: AxisKey) => axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
const axisName = (key: AxisKey, locale: Locale) => uiT(AXIS_NAME_KEY[key], locale);
const value = (w: World, key: AxisKey) => w.axes[key].value;

function pearson(worlds: World[], a: AxisKey, b: AxisKey): number {
  const n = worlds.length;
  if (n < 2) return 0;
  const xs = worlds.map((w) => value(w, a));
  const ys = worlds.map((w) => value(w, b));
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
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

function layoutGrid(worlds: World[], order: Record<string, number>, ax: AxisKey, ay: AxisKey, W: number): Layout {
  const compact = W < 620;
  const m = compact ? { l: 24, r: 6, t: 22, b: 52 } : { l: 34, r: 36, t: 32, b: 56 };
  const cw = (W - m.l - m.r) / 5;
  const cells: World[][][] = [0, 1, 2, 3, 4].map(() => [0, 1, 2, 3, 4].map(() => []));
  for (const w of worlds) cells[value(w, ax) - 1][value(w, ay) - 1].push(w);
  for (const col of cells)
    for (const list of col)
      list.sort((a, b) => (order[a.chapterId] ?? 0) - (order[b.chapterId] ?? 0) || a.id.localeCompare(b.id));
  const perRow = compact ? Math.max(1, Math.floor((cw - 10) / 15)) : 1;
  const lh = compact ? 15 : 19;
  // Řádky rostou podle nejplnějšího pole – mapa zůstane kompaktní a pořadí hodnot platí dál.
  const rowH = [0, 1, 2, 3, 4].map((v) => {
    const n = Math.max(...cells.map((col) => col[v].length));
    return Math.max(compact ? 44 : 62, Math.ceil(n / perRow) * lh + (compact ? 16 : 22));
  });
  const top: number[] = [];
  let acc = m.t;
  for (let v = 4; v >= 0; v--) {
    top[v] = acc;
    acc += rowH[v];
  }
  const pos = new Map<string, [number, number]>();
  cells.forEach((col, cx) =>
    col.forEach((list, cy) =>
      list.forEach((w, k) => {
        const x = compact ? m.l + cx * cw + 10 + (k % perRow) * 15 : m.l + cx * cw + 10;
        const y = compact ? top[cy] + 12 + Math.floor(k / perRow) * lh : top[cy] + 15 + k * lh;
        pos.set(w.id, [x, y]);
      }),
    ),
  );
  return { H: acc + m.b, W, m, cw, top, rowH, cells, pos, compact };
}

function readUrl(): { x?: number; y?: number; w?: string } {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const ix = AXIS_KEYS.indexOf(p.get('x') as AxisKey);
  const iy = AXIS_KEYS.indexOf(p.get('y') as AxisKey);
  return { x: ix >= 0 ? ix : undefined, y: iy >= 0 && iy !== ix ? iy : undefined, w: p.get('svet') ?? undefined };
}

export default function AxisGridMap({ worlds, chapters, themes, base }: Props) {
  const locale = useLocale();
  const tray = useCompareTray();
  const [xi, setXi] = useState(0);
  const [yi, setYi] = useState(2);
  const [sel, setSel] = useState<string | null>(null);
  const [focusChapters, setFocusChapters] = useState<Set<string>>(() => new Set());
  const [theme, setTheme] = useState('');
  const [query, setQuery] = useState('');
  const [meOpen, setMeOpen] = useState(false);
  const [me, setMe] = useState<number[]>([3, 3, 3, 3, 3]);
  const [width, setWidth] = useState(880);
  const boardRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  const ax = AXIS_KEYS[xi];
  const ay = AXIS_KEYS[yi];
  const byId = useMemo(() => Object.fromEntries(worlds.map((w) => [w.id, w])), [worlds]);
  const chapterById = useMemo(() => Object.fromEntries(chapters.map((c) => [c.id, c])), [chapters]);
  const chapterOrder = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, i])), [chapters]);

  // Stav z adresy (?x=…&y=…&svet=…) a zpět do ní – odkaz na konkrétní pohled jde poslat.
  useEffect(() => {
    const u = readUrl();
    if (u.x !== undefined) setXi(u.x);
    if (u.y !== undefined) setYi(u.y);
    if (u.w && byId[u.w]) setSel(u.w);
    ready.current = true;
  }, [byId]);
  useEffect(() => {
    if (!ready.current) return;
    const p = new URLSearchParams(window.location.search);
    p.set('x', ax);
    p.set('y', ay);
    if (sel) p.set('svet', sel);
    else p.delete('svet');
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
  }, [ax, ay, sel]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const L = useMemo(() => layoutGrid(worlds, chapterOrder, ax, ay, width), [worlds, chapterOrder, ax, ay, width]);
  const selWorld = sel ? byId[sel] : undefined;
  const kin = useMemo(() => (selWorld ? kinshipRanking(selWorld, worlds, 3) : []), [selWorld, worlds]);
  const kinIds = kin.map((k) => k.world.id);

  const q = query.trim().toLowerCase();
  const highlightOn = focusChapters.size > 0 || Boolean(theme) || Boolean(q);
  const isOn = (w: World) =>
    (!focusChapters.size || focusChapters.has(w.chapterId)) &&
    (!theme || w.themes.includes(theme)) &&
    (!q || t(w.gameTitle, locale).toLowerCase().includes(q) || w.gameTitle.en.toLowerCase().includes(q));

  const setAxis = (which: 'x' | 'y', i: number) => {
    if (which === 'x') {
      if (i === yi) setYi(xi);
      setXi(i);
    } else {
      if (i === xi) setXi(yi);
      setYi(i);
    }
  };

  const select = (id: string | null) => {
    setSel(id);
    if (id && typeof window !== 'undefined' && window.innerWidth <= 900) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const chapterStyle = (chapterId: string) => {
    const c = chapterById[chapterId];
    return { '--c-l': c?.accent.light ?? '#9a7b4f', '--c-d': c?.accent.dark ?? '#c4a574' } as CSSProperties;
  };

  const pole = (key: AxisKey, side: 'left' | 'right') => axisPoleLabel(meta(key), side, locale);
  const fullPole = (key: AxisKey, side: 'left' | 'right') => t(meta(key)[side], locale);

  /* ----- co ukazuje dvojice ----- */
  const insights = useMemo(() => {
    const r = pearson(worlds, ax, ay);
    const posWord = (v: number, key: AxisKey) =>
      v === 3
        ? uiT('map.posMid', locale)
        : uiT(v === 1 || v === 5 ? 'map.posStrong' : 'map.posLean', locale).replace('{p}', pole(key, v < 3 ? 'left' : 'right'));
    let best = { cx: 2, cy: 2, n: 0 };
    let empty = 0;
    L.cells.forEach((col, cx) =>
      col.forEach((list, cy) => {
        if (!list.length) empty++;
        if (list.length > best.n) best = { cx, cy, n: list.length };
      }),
    );
    const corners = (
      [
        [0, 0],
        [4, 0],
        [0, 4],
        [4, 4],
      ] as const
    )
      .filter(([cx, cy]) => !L.cells[cx][cy].length)
      .map(([cx, cy]) => `${pole(ax, cx ? 'right' : 'left')} + ${pole(ay, cy ? 'right' : 'left')}`);
    let lone: { w: World; d: number } | null = null;
    for (const w of worlds) {
      let d = Infinity;
      for (const o of worlds) {
        if (o === w) continue;
        d = Math.min(d, Math.hypot(value(o, ax) - value(w, ax), value(o, ay) - value(w, ay)));
      }
      if (!lone || d > lone.d) lone = { w, d };
    }
    const rel =
      Math.abs(r) < 0.2
        ? uiT('map.insRelNone', locale)
        : uiT('map.insRelText', locale)
            .replace('{a}', pole(ax, 'right'))
            .replace('{b}', pole(ay, r > 0 ? 'right' : 'left'))
            .replace('{s}', uiT(Math.abs(r) < 0.4 ? 'map.insWeak' : 'map.insClear', locale));
    return {
      rel,
      dense: uiT('map.insDenseText', locale)
        .replace('{x}', posWord(best.cx + 1, ax))
        .replace('{y}', posWord(best.cy + 1, ay))
        .replace('{n}', worldsCountLabel(best.n, locale)),
      empty: uiT('map.insEmptyText', locale).replace('{n}', String(empty)),
      corners: corners.length ? uiT('map.insCorners', locale).replace('{list}', corners.join(', ')) : '',
      lone: lone?.w,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worlds, ax, ay, L, locale]);

  /* ----- tvůj otisk ----- */
  const meKin = useMemo(() => {
    if (!meOpen) return [];
    return worlds
      .map((w) => ({ w, d: Math.hypot(...AXIS_KEYS.map((k, i) => value(w, k) - me[i])) }))
      .sort((a, b) => a.d - b.d || a.w.id.localeCompare(b.w.id))
      .slice(0, 3)
      .map((x) => x.w);
  }, [meOpen, me, worlds]);
  const mePos = meOpen ? [L.m.l + (me[xi] - 1) * L.cw + L.cw - 14, L.top[me[yi] - 1] + 12] : null;

  /* ----- atlas dvojic ----- */
  const pairs = useMemo(() => {
    const out: Array<{ i: number; j: number; counts: number[]; max: number }> = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) {
        const counts = Array(25).fill(0) as number[];
        for (const w of worlds) counts[(5 - value(w, AXIS_KEYS[j])) * 5 + (value(w, AXIS_KEYS[i]) - 1)]++;
        out.push({ i, j, counts, max: Math.max(...counts) });
      }
    return out;
  }, [worlds]);

  const { m, cw, top, rowH, H, W, compact } = L;
  const colN = [0, 1, 2, 3, 4].map((c) => L.cells[c].reduce((s, l) => s + l.length, 0));
  const rowN = [0, 1, 2, 3, 4].map((r) => L.cells.reduce((s, col) => s + col[r].length, 0));
  const maxC = Math.max(1, ...colN);
  const maxR = Math.max(1, ...rowN);
  const maxCell = Math.max(...L.cells.flat().map((l) => l.length));

  return (
    <article className="map-page agm">
      <header className="map-page__head">
        <div>
          <h1 className="map-page__title display">{uiT('map.title', locale)}</h1>
          <p className="map-page__lead">{uiT('map.lead', locale)}</p>
          <a className="agm-lead-link" href={withBase(base, '/compare/')}>
            {uiT('map.leadCompare', locale)}
          </a>
        </div>
        <a className="map-page__back" href={withBase(base, '/')}>
          {uiT('map.back', locale)}
        </a>
      </header>

      <section className="agm-controls">
        {(['x', 'y'] as const).map((which) => (
          <div className="agm-controls__row" key={which}>
            <span className="agm-label">{uiT(which === 'x' ? 'map.axisX' : 'map.axisY', locale)}</span>
            <div className="agm-pills">
              {AXIS_KEYS.map((key, i) => {
                const active = (which === 'x' ? xi : yi) === i;
                const other = (which === 'x' ? yi : xi) === i;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`agm-pill${other ? ' is-other' : ''}`}
                    aria-pressed={active}
                    title={`${fullPole(key, 'left')} ↔ ${fullPole(key, 'right')}`}
                    onClick={() => setAxis(which, i)}
                  >
                    {axisName(key, locale)}
                  </button>
                );
              })}
              {which === 'y' ? (
                <button type="button" className="agm-swap" onClick={() => setAxis('x', yi)}>
                  {uiT('map.swap', locale)}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </section>

      <div className="agm-filters">
        <div className={`agm-chips${focusChapters.size ? ' has-focus' : ''}`} aria-label={uiT('map.archetypes', locale)}>
          {chapters.map((c) => {
            const on = focusChapters.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className="agm-chip"
                style={chapterStyle(c.id)}
                aria-pressed={on}
                onClick={() =>
                  setFocusChapters((cur) => {
                    const next = new Set(cur);
                    if (next.has(c.id)) next.delete(c.id);
                    else next.add(c.id);
                    return next;
                  })
                }
              >
                <i aria-hidden="true" />
                {t(c.title, locale)}
                <small>{worlds.filter((w) => w.chapterId === c.id).length}</small>
              </button>
            );
          })}
        </div>
        <select id="agm-theme" value={theme} onChange={(e) => setTheme(e.target.value)} aria-label={uiT('map.themePick', locale)}>
          <option value="">{uiT('map.themePick', locale)}</option>
          {themes.map((th) => (
            <option key={th.slug} value={th.slug}>
              {t(th.label, locale)} ({worlds.filter((w) => w.themes.includes(th.slug)).length})
            </option>
          ))}
        </select>
        <input
          id="agm-search"
          type="search"
          value={query}
          placeholder={uiT('map.search', locale)}
          aria-label={uiT('map.search', locale)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            const hit = worlds.find((w) => isOn(w));
            if (hit) select(hit.id);
          }}
        />
        {highlightOn ? (
          <button
            type="button"
            className="agm-clear"
            onClick={() => {
              setFocusChapters(new Set());
              setTheme('');
              setQuery('');
            }}
          >
            {uiT('map.clear', locale)}
          </button>
        ) : null}
      </div>

      <div className="agm-stage">
        <div className="agm-board" ref={boardRef}>
          <div className={`agm-plot${compact ? ' is-compact' : ''}`} style={{ height: H }}>
            {L.cells.flatMap((col, cx) =>
              col.map((list, cy) => (
                <div
                  key={`${cx}-${cy}`}
                  className={`agm-cell${list.length ? '' : ' is-empty'}${list.length && list.length === maxCell ? ' is-dense' : ''}`}
                  style={{ left: m.l + cx * cw + 2, top: top[cy] + 2, width: cw - 4, height: rowH[cy] - 4 }}
                >
                  {!list.length && !compact ? <span>{uiT('map.incognita', locale)}</span> : null}
                </div>
              )),
            )}

            {colN.map((n, c) => {
              const x = m.l + c * cw + cw / 2;
              const bh = Math.round((n / maxC) * (m.t - 12));
              return (
                <span key={`c${c}`}>
                  <span className="agm-tick" style={{ left: x, top: H - m.b + 4 }}>
                    {c + 1}
                  </span>
                  <i className="agm-bar" style={{ left: x - cw * 0.18, width: cw * 0.36, top: m.t - 4 - bh, height: bh }} />
                  {!compact ? (
                    <span className="agm-barn" style={{ left: x + cw * 0.2, top: m.t - 17 }}>
                      {n}
                    </span>
                  ) : null}
                </span>
              );
            })}
            {!compact
              ? rowN.map((n, r) => {
                  const y = top[r] + rowH[r] / 2;
                  const bw = Math.round((n / maxR) * (m.r - 12));
                  return (
                    <span key={`r${r}`}>
                      <i className="agm-bar" style={{ left: W - m.r + 6, width: bw, top: y - rowH[r] * 0.15, height: rowH[r] * 0.3 }} />
                      <span className="agm-barn" style={{ left: W - m.r + 8, top: y + rowH[r] * 0.16 }}>
                        {n}
                      </span>
                    </span>
                  );
                })
              : null}

            <div className="agm-axis agm-axis--x" style={{ left: m.l, right: m.r, top: H - m.b + 22 }}>
              <span>← {fullPole(ax, 'left')}</span>
              <b>{axisName(ax, locale)}</b>
              <span>{fullPole(ax, 'right')} →</span>
            </div>
            <div className="agm-axis agm-axis--y" style={{ top: m.t, height: H - m.t - m.b, left: 0 }}>
              <span>← {fullPole(ay, 'left')}</span>
              <b>{axisName(ay, locale)}</b>
              <span>{fullPole(ay, 'right')} →</span>
            </div>

            <svg className="agm-lines" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
              {selWorld
                ? kin.map(({ world }) => {
                    const a = L.pos.get(selWorld.id);
                    const b = L.pos.get(world.id);
                    if (!a || !b) return null;
                    return <line key={world.id} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
                  })
                : null}
            </svg>

            {worlds.map((w) => {
              const p = L.pos.get(w.id);
              if (!p) return null;
              const cls = [
                'agm-w',
                w.id === sel ? 'is-sel' : '',
                kinIds.includes(w.id) ? 'is-kin' : '',
                highlightOn && !isOn(w) ? 'is-off' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={w.id}
                  type="button"
                  className={cls}
                  style={
                    {
                      ...chapterStyle(w.chapterId),
                      transform: `translate(${p[0] - 4.5}px, ${p[1] - 9}px)`,
                      '--lw': `${Math.max(40, cw - 25)}px`,
                    } as CSSProperties
                  }
                  aria-label={`${t(w.gameTitle, locale)}: ${axisName(ax, locale)} ${value(w, ax)}, ${axisName(ay, locale)} ${value(w, ay)}`}
                  aria-pressed={w.id === sel}
                  title={t(w.gameTitle, locale)}
                  onClick={() => select(w.id === sel ? null : w.id)}
                >
                  <i className="agm-w__d" aria-hidden="true" />
                  <span className={`agm-w__n${t(w.gameTitle, locale).length >= 16 ? ' is-long' : ''}`}>{t(w.gameTitle, locale)}</span>
                </button>
              );
            })}

            {mePos ? (
              <div className="agm-me" style={{ transform: `translate(${mePos[0]}px, ${mePos[1]}px)` }} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 1.5l2.6 7.9H23l-6.8 4.9 2.6 7.9L12 17.3l-6.8 4.9 2.6-7.9L1 9.4h8.4z" />
                </svg>
                <b>{uiT('map.meMark', locale)}</b>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="agm-side">
          <div className="agm-panel" ref={panelRef} aria-live="polite">
            {selWorld ? (
              <div style={chapterStyle(selWorld.chapterId)}>
                <button type="button" className="agm-back" onClick={() => setSel(null)}>
                  {uiT('map.backOverview', locale)}
                </button>
                <p className="agm-kick">{t(chapterById[selWorld.chapterId]?.title ?? { en: '' }, locale)}</p>
                <h2 className="agm-panel__title">{t(selWorld.gameTitle, locale)}</h2>
                <p className="agm-meta">{selWorld.yearRange}</p>
                <p className="agm-core">{t(selWorld.core, locale)}</p>
                <h3 className="agm-h3">{uiT('map.imprint', locale)}</h3>
                <div className="agm-prof">
                  {AXIS_KEYS.map((key) => (
                    <div key={key} className={`agm-prof__r${key === ax || key === ay ? ' is-cur' : ''}`}>
                      <span>{pole(key, 'left')}</span>
                      <span className="agm-trk">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <i key={v} className={v === value(selWorld, key) ? 'is-on' : ''} />
                        ))}
                      </span>
                      <span>{pole(key, 'right')}</span>
                    </div>
                  ))}
                </div>
                <h3 className="agm-h3">{uiT('map.kin', locale)}</h3>
                <p className="agm-meta agm-meta--note">{uiT('map.kinNote', locale)}</p>
                <ul className="agm-kin">
                  {kin.map(({ world, percent }) => (
                    <li key={world.id} style={chapterStyle(world.chapterId)}>
                      <button type="button" onClick={() => select(world.id)}>
                        <i aria-hidden="true" />
                        {t(world.gameTitle, locale)}
                        <em>{percent} %</em>
                      </button>
                      <a href={withBase(base, `/compare/?w=${selWorld.id},${world.id}`)}>{uiT('map.kinCompare', locale)}</a>
                    </li>
                  ))}
                </ul>
                <div className="agm-acts">
                  <a className="agm-btn" href={withBase(base, `/worlds/${selWorld.id}/`)}>
                    {uiT('home.openDossier', locale)}
                  </a>
                  <button
                    type="button"
                    className={`agm-btn agm-btn--ghost${tray.includes(selWorld.id) ? ' is-on' : ''}`}
                    onClick={() => toggleCompareTray(selWorld.id)}
                  >
                    {tray.includes(selWorld.id) ? uiT('home.compareIn', locale) : uiT('home.compareAdd', locale)}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="agm-h3">{uiT('map.insTitle', locale)}</h3>
                <ul className="agm-ins">
                  <li>
                    <b>{uiT('map.insRel', locale)}</b>
                    {insights.rel}
                  </li>
                  <li>
                    <b>{uiT('map.insDense', locale)}</b>
                    {insights.dense}
                  </li>
                  <li>
                    <b>{uiT('map.insEmpty', locale)}</b>
                    {insights.empty} {insights.corners}
                  </li>
                  {insights.lone ? (
                    <li>
                      <b>{uiT('map.insLoner', locale)}</b>
                      <button type="button" onClick={() => select(insights.lone!.id)}>
                        {t(insights.lone.gameTitle, locale)}
                      </button>{' '}
                      {uiT('map.insLonerText', locale)}
                    </li>
                  ) : null}
                </ul>
                <p className="agm-meta agm-hint">{uiT('map.insHint', locale)}</p>
              </>
            )}
          </div>

          <details className="agm-me-panel" open={meOpen} onToggle={(e) => setMeOpen((e.target as HTMLDetailsElement).open)}>
            <summary>{uiT('map.meTitle', locale)}</summary>
            <p className="agm-meta">{uiT('map.meLead', locale)}</p>
            {AXIS_KEYS.map((key, i) => (
              <label key={key} className="agm-sl">
                <span className="agm-sl__ends">
                  <span>{pole(key, 'left')}</span>
                  <span>{pole(key, 'right')}</span>
                </span>
                <input
                  id={`agm-me-${key}`}
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={me[i]}
                  aria-label={axisName(key, locale)}
                  onChange={(e) => setMe((cur) => cur.map((v, k) => (k === i ? Number(e.target.value) : v)))}
                />
              </label>
            ))}
            {meKin.length ? (
              <>
                <h3 className="agm-h3">{uiT('map.meKin', locale)}</h3>
                <ul className="agm-kin">
                  {meKin.map((w) => (
                    <li key={w.id} style={chapterStyle(w.chapterId)}>
                      <button type="button" onClick={() => select(w.id)}>
                        <i aria-hidden="true" />
                        {t(w.gameTitle, locale)}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </details>
        </aside>
      </div>

      <section className="agm-pairs">
        <h2 className="agm-pairs__title">{uiT('map.pairsTitle', locale)}</h2>
        <p className="agm-meta">{uiT('map.pairsLead', locale)}</p>
        <div className="agm-pairs__grid">
          {pairs.map(({ i, j, counts, max }) => {
            const on = (xi === i && yi === j) || (xi === j && yi === i);
            return (
              <button
                key={`${i}-${j}`}
                type="button"
                className="agm-pair"
                aria-pressed={on}
                onClick={() => {
                  setXi(i);
                  setYi(j);
                  boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span className="agm-pair__mini" aria-hidden="true">
                  {counts.map((n, k) => (
                    <i key={k} className={n ? '' : 'is-zero'} style={{ '--o': n / max } as CSSProperties} />
                  ))}
                </span>
                <span className="agm-pair__name">
                  {axisName(AXIS_KEYS[i], locale)} × {axisName(AXIS_KEYS[j], locale)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
}
