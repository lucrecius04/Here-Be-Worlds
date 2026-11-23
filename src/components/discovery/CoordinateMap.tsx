import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS, type AxisKey } from '../../lib/axes';
import { SLOT_COLORS } from '../../lib/compare';
import axesMeta from '../../../data/meta/axes.json';

/**
 * Mapa souřadnic (přestavba 2026-11-22, podle návrhů C a A schválených majitelem).
 *
 * 1. Pět pásů: každá souřadnice je pás s pěti sloupci (hodnoty 1–5), světy jako čtverečky v barvě
 *    archetypu, každý sloupec je samostatná přihrádka. Kosočtverec = průměr atlasu (s vybraným archetypem
 *    i jeho průměr). Dvě pevná místa Svět 1 / Svět 2 (barvy srovnání): klik na čtvereček zaplní první
 *    volné, plná obě → vymění Svět 2; v polích nahoře jde každé místo změnit zvlášť. Čtverečky vybraných
 *    světů spojí linka: profil napříč pásy. Vybrané světy se archetypem nikdy neztlumí.
 * 2. Korelace souřadnic: mřížka 5 × 5 pro zvolenou dvojici, pod ní Deset map (všechny dvojice).
 * Vpravo panel vybraných světů přes obě části. Příbuznost se tu nepočítá (je ve Srovnání).
 */

type ChapterLite = {
  id: string;
  title: LocalizedString;
  short?: LocalizedString;
  accent: { light: string; dark: string };
};
type Props = {
  worlds: World[];
  chapters: ChapterLite[];
  themeLabels: Record<string, LocalizedString>;
  base: string;
};

const NAME_KEY: Record<AxisKey, string> = {
  hopeDespair: 'map.nameHopeDespair',
  knownUnknown: 'map.nameKnownUnknown',
  intimateEpic: 'map.nameIntimateEpic',
  moralClarityAmbiguity: 'map.nameMoralClarityAmbiguity',
  realismMetaphysical: 'map.nameRealismMetaphysical',
};
const meta = (key: AxisKey) => axesMeta.axes.find((a) => a.id === key) ?? axesMeta.axes[0];
const axisName = (key: AxisKey, locale: Locale) => uiT(NAME_KEY[key], locale);
const pole = (key: AxisKey, side: 'left' | 'right', locale: Locale) => t(meta(key)[side], locale);
const val = (w: World, key: AxisKey) => w.axes[key].value;
const fmt = (n: number, locale: Locale) => n.toFixed(1).replace('.', locale === 'cs' ? ',' : '.');

const average = (list: World[], key: AxisKey) => list.reduce((s, w) => s + val(w, key), 0) / Math.max(1, list.length);
/** Poloha hodnoty 1–5 v procentech šířky pěti stejných sloupců. */
const pct = (v: number) => ((v - 0.5) / 5) * 100;

type Pt = { x: number; y: number };

export default function CoordinateMap({ worlds, chapters, themeLabels, base }: Props) {
  const locale = useLocale();
  const [slots, setSlots] = useState<(string | null)[]>([null, null]);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [xi, setXi] = useState(0);
  const [yi, setYi] = useState(3);
  const [openCell, setOpenCell] = useState<[number, number] | null>(null);
  const [lines, setLines] = useState<Record<string, Pt[]>>({});
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(null);
  const stripsRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);

  const byId = useMemo(() => Object.fromEntries(worlds.map((w) => [w.id, w])), [worlds]);
  const chapterById = useMemo(() => Object.fromEntries(chapters.map((c) => [c.id, c])), [chapters]);
  const order = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, i])), [chapters]);
  const ax = AXIS_KEYS[xi];
  const ay = AXIS_KEYS[yi];
  const focusChapter = focus ? chapterById[focus] : undefined;
  const focusWorlds = focus ? worlds.filter((w) => w.chapterId === focus) : [];

  /* Stav v adrese: ?svet=a,b&x=…&y=… (spis světa odkazuje na /map/?svet=<id>). */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const ids = (p.get('svet') ?? '').split(',').slice(0, 2).map((id) => (byId[id] ? id : null));
    if (ids.some(Boolean)) setSlots([ids[0] ?? null, ids[1] ?? null]);
    const ix = AXIS_KEYS.indexOf(p.get('x') as AxisKey);
    const iy = AXIS_KEYS.indexOf(p.get('y') as AxisKey);
    if (ix >= 0) setXi(ix);
    if (iy >= 0 && iy !== ix) setYi(iy);
    ready.current = true;
  }, [byId]);
  useEffect(() => {
    if (!ready.current) return;
    const p = new URLSearchParams(window.location.search);
    if (slots.some(Boolean)) p.set('svet', slots.map((x) => x ?? '').join(','));
    else p.delete('svet');
    p.set('x', ax);
    p.set('y', ay);
    window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`);
  }, [slots, ax, ay]);

  useEffect(() => setOpenCell(null), [xi, yi]);

  /* Klik na svět: vybraný zruší, jinak zaplní první volné místo; plná obě → vymění Svět 2. */
  const togglePick = (id: string) =>
    setSlots((cur) => {
      if (cur.includes(id)) return cur.map((x) => (x === id ? null : x));
      if (!cur[0]) return [id, cur[1]];
      if (!cur[1]) return [cur[0], id];
      return [cur[0], id];
    });
  const setSlot = (slot: number, id: string | null) =>
    setSlots((cur) => cur.map((x, i) => (i === slot ? id : x === id ? null : x)));
  const clearAll = () => {
    setSlots([null, null]);
    setFocus('');
    setHover(null);
    setTip(null);
  };
  const picks = useMemo(() => slots.filter((x): x is string => Boolean(x)), [slots]);
  const slotOf = (id: string) => slots.indexOf(id);
  const hueVars = (chapterId: string) => {
    const c = chapterById[chapterId];
    return { '--c-l': c?.accent.light ?? '#888', '--c-d': c?.accent.dark ?? '#aaa' } as CSSProperties;
  };
  const worldVars = (w: World) => {
    const slot = slotOf(w.id);
    return { ...hueVars(w.chapterId), ...(slot >= 0 ? { '--slot': SLOT_COLORS[slot] } : {}) } as CSSProperties;
  };
  const who = focusChapter ? t(focusChapter.short ?? focusChapter.title, locale) : uiT('map.atlasWho', locale);

  const sorted = useMemo(
    () =>
      [...worlds].sort(
        (a, b) => order[a.chapterId] - order[b.chapterId] || t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale),
      ),
    [worlds, order, locale],
  );

  /* Linky profilů: středy čtverečků vybraných světů (a světa pod kurzorem), změřené po vykreslení. */
  const lineIds = useMemo(() => [...picks, ...(hover && !picks.includes(hover) ? [hover] : [])], [picks, hover]);
  useLayoutEffect(() => {
    const wrap = stripsRef.current;
    if (!wrap) return;
    const measure = () => {
      const box = wrap.getBoundingClientRect();
      const next: Record<string, Pt[]> = {};
      for (const id of lineIds) {
        next[id] = AXIS_KEYS.map((key) => {
          const el = wrap.querySelector<HTMLElement>(`[data-dot="${key}:${id}"]`);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
        }).filter(Boolean) as Pt[];
      }
      setLines(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [lineIds, focus, locale]);

  const onDotEnter = (id: string, el: HTMLElement) => {
    setHover(id);
    const wrap = stripsRef.current;
    if (!wrap) return;
    const box = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setTip({ id, x: r.left + r.width / 2 - box.left, y: r.top - box.top });
  };
  const onDotLeave = () => {
    setHover(null);
    setTip(null);
  };

  /* ---------- křížová mapa ---------- */
  const cells = useMemo(() => {
    const out: World[][][] = [0, 1, 2, 3, 4].map(() => [0, 1, 2, 3, 4].map(() => []));
    for (const w of sorted) out[val(w, ax) - 1][val(w, ay) - 1].push(w);
    return out;
  }, [sorted, ax, ay]);

  const pairs = useMemo(() => {
    const out: Array<{ i: number; j: number; counts: number[][] }> = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) {
        const counts = [0, 1, 2, 3, 4].map(() => [0, 0, 0, 0, 0]);
        for (const w of worlds) counts[val(w, AXIS_KEYS[i]) - 1][val(w, AXIS_KEYS[j]) - 1]++;
        out.push({ i, j, counts });
      }
    return out;
  }, [worlds]);

  const setAxis = (which: 'x' | 'y', i: number) => {
    if (which === 'x') {
      if (i === yi) setYi(xi);
      setXi(i);
    } else {
      if (i === xi) setXi(yi);
      setYi(i);
    }
  };

  const legend = (
    <div className="cm-legend" role="group" aria-label={uiT('map.archetypes', locale)}>
      {chapters.map((c) => (
        <button
          key={c.id}
          type="button"
          style={hueVars(c.id)}
          aria-pressed={focus === c.id}
          className={focus && focus !== c.id ? 'is-dim' : undefined}
          onClick={() => setFocus(focus === c.id ? '' : c.id)}
        >
          <i aria-hidden="true" />
          {t(c.title, locale)}
          <small>{worlds.filter((w) => w.chapterId === c.id).length}</small>
        </button>
      ))}
    </div>
  );

  const gridWorld = (w: World) => {
    const slot = slotOf(w.id);
    return (
      <button
        key={w.id}
        type="button"
        className={['cm-gw', slot >= 0 ? 'is-pick' : '', slot < 0 && focus && w.chapterId !== focus ? 'is-dim' : ''].filter(Boolean).join(' ')}
        style={worldVars(w)}
        aria-pressed={slot >= 0}
        title={t(w.gameTitle, locale)}
        onClick={() => togglePick(w.id)}
      >
        <i aria-hidden="true" />
        <span>{t(w.gameTitle, locale)}</span>
      </button>
    );
  };

  const pickedSlots = slots
    .map((id, slot) => (id && byId[id] ? { w: byId[id], slot } : null))
    .filter((x): x is { w: World; slot: number } => Boolean(x));
  const worldOptions = [...worlds].sort((a, b) => t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale));
  const active = picks.length > 0 || Boolean(hover);

  return (
    <article className="cm">
      <header className="atlas-page__head page-band cm-head">
        <h1 className="atlas-page__title display">{uiT('map.title', locale)}</h1>
        <p className="atlas-page__lead">{uiT('map.leadStrips', locale)}</p>
      </header>

      <div className="cm-layout">
        {/* ---------- 1. Pět pásů ---------- */}
        <section className="cm-bands" aria-label={uiT('map.title', locale)}>
          <div className="cm-tools">
            {legend}
            <div className="cm-picks">
              {[0, 1].map((slot) => (
                <label key={slot} className="cm-field cm-find" style={{ '--slot': SLOT_COLORS[slot] } as CSSProperties}>
                  <span>
                    <i aria-hidden="true" />
                    {uiT(slot === 0 ? 'map.world1' : 'map.world2', locale)}
                  </span>
                  <select value={slots[slot] ?? ''} onChange={(e) => setSlot(slot, e.target.value || null)}>
                    <option value="">{uiT('map.pickPlaceholder', locale)}</option>
                    {worldOptions.map((w) => (
                      <option key={w.id} value={w.id} disabled={slots[1 - slot] === w.id}>
                        {t(w.gameTitle, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
              {picks.length || focus ? (
                <button type="button" className="cm-link cm-clear" onClick={clearAll}>
                  {uiT('map.clearAll', locale)}
                </button>
              ) : null}
            </div>
          </div>

          <div className={`cm-strips${active ? ' has-active' : ''}${focus ? ' has-focus' : ''}`} ref={stripsRef}>
            {AXIS_KEYS.map((key) => {
              const atlasAvg = average(worlds, key);
              const focusAvg = focus ? average(focusWorlds, key) : null;
              return (
                <section className="cm-strip" key={key}>
                  <header className="cm-strip__head">
                    <h2>{axisName(key, locale)}</h2>
                  </header>
                  <div className="cm-strip__plot">
                    <div className="cm-cols">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <div className="cm-col" key={v}>
                          {sorted
                            .filter((w) => val(w, key) === v)
                            .map((w) => {
                              const slot = slotOf(w.id);
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  data-dot={`${key}:${w.id}`}
                                  className={[
                                    'cm-dot',
                                    slot >= 0 ? 'is-pick' : '',
                                    w.id === hover ? 'is-hover' : '',
                                    slot < 0 && focus && w.chapterId !== focus ? 'is-dim' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  style={worldVars(w)}
                                  aria-pressed={slot >= 0}
                                  aria-label={`${t(w.gameTitle, locale)}: ${axisName(key, locale)} ${v}`}
                                  onMouseEnter={(e) => onDotEnter(w.id, e.currentTarget)}
                                  onMouseLeave={onDotLeave}
                                  onFocus={(e) => onDotEnter(w.id, e.currentTarget)}
                                  onBlur={onDotLeave}
                                  onClick={() => togglePick(w.id)}
                                />
                              );
                            })}
                        </div>
                      ))}
                      <span
                        className={`cm-avg${focusAvg != null ? ' is-ghost' : ''}`}
                        style={{ left: `${pct(atlasAvg)}%` }}
                        data-side={focusAvg != null ? (focusAvg >= atlasAvg ? 'left' : 'right') : undefined}
                        aria-hidden="true"
                      >
                        <b>{uiT('map.avg', locale).replace('{v}', fmt(atlasAvg, locale))}</b>
                      </span>
                      {focusAvg != null && focusChapter ? (
                        <span
                          className="cm-avg is-archetype"
                          style={{ left: `${pct(focusAvg)}%`, ...hueVars(focus) }}
                          data-side={focusAvg >= atlasAvg ? 'right' : 'left'}
                          aria-hidden="true"
                        >
                          <b>{uiT('map.avgArchetype', locale).replace('{who}', who).replace('{v}', fmt(focusAvg, locale))}</b>
                        </span>
                      ) : null}
                    </div>
                    <div className="cm-scale" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <span key={v}>
                          {v}
                          {pickedSlots
                            .filter(({ w }) => val(w, key) === v)
                            .map(({ w, slot }) => (
                              <i key={w.id} style={{ background: SLOT_COLORS[slot] }} />
                            ))}
                        </span>
                      ))}
                    </div>
                    <div className="cm-poles" aria-hidden="true">
                      <span>← {pole(key, 'left', locale)}</span>
                      <span>{pole(key, 'right', locale)} →</span>
                    </div>
                  </div>
                </section>
              );
            })}

            <svg className="cm-lines" aria-hidden="true">
              {lineIds.map((id) => {
                const pts = lines[id];
                const w = byId[id];
                if (!pts || pts.length < 2 || !w) return null;
                const slot = slotOf(id);
                return (
                  <polyline
                    key={id}
                    className={slot >= 0 ? 'is-pick' : 'is-hover'}
                    style={slot >= 0 ? ({ stroke: SLOT_COLORS[slot] } as CSSProperties) : undefined}
                    points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                  />
                );
              })}
            </svg>
            {tip && byId[tip.id] ? (
              <span className="cm-tip" style={{ left: tip.x, top: tip.y }} aria-hidden="true">
                {t(byId[tip.id].gameTitle, locale)}
              </span>
            ) : null}
          </div>
        </section>

        {/* ---------- panel vybraných světů ---------- */}
        <aside className="cm-side" aria-live="polite">
          {pickedSlots.length ? (
            <>
              {pickedSlots.map(({ w, slot }) => {
                const facts: Array<[string, string]> = [
                  ['card.atmosphere', t(w.metadata.atmosphere, locale)],
                  ['card.spatialScope', t(w.metadata.spatialScope, locale)],
                  ['card.societalOrder', t(w.metadata.societalOrder, locale)],
                  ['card.themesHeading', w.themes.map((s) => (themeLabels[s] ? t(themeLabels[s], locale) : s)).join(', ')],
                ];
                return (
                  <div
                    className="cm-card"
                    key={w.id}
                    style={{ ...hueVars(w.chapterId), '--slot': SLOT_COLORS[slot] } as CSSProperties}
                  >
                    <p className="cm-kicker cm-kicker--hue">
                      {[t(chapterById[w.chapterId]?.title ?? { en: '' }, locale), t(w.metadata.genreProfile, locale)]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <h2 className="cm-card__title">{t(w.gameTitle, locale)}</h2>
                    <dl className="cm-card__facts">
                      {facts
                        .filter(([, v]) => v)
                        .map(([label, value]) => (
                          <div key={label}>
                            <dt>{uiT(label, locale)}</dt>
                            <dd>{value}</dd>
                          </div>
                        ))}
                    </dl>
                    <p className="cm-card__go">
                      <a href={withBase(base, `/worlds/${w.id}/`)}>{uiT('home.openDossier', locale)}</a>
                      <button type="button" className="cm-link" onClick={() => togglePick(w.id)}>
                        {uiT('map.unpick', locale)}
                      </button>
                    </p>
                  </div>
                );
              })}
              {pickedSlots.length === 2 ? (
                <p className="cm-side__compare">
                  <a href={withBase(base, `/compare/?w=${picks.join(',')}`)}>{uiT('map.compareTwo', locale)}</a>
                </p>
              ) : (
                <p className="cm-side__hint">{uiT('map.pickMore', locale)}</p>
              )}
            </>
          ) : (
            <div className="cm-how">
              <p className="cm-kicker">{uiT('map.pickTitle', locale)}</p>
              <p className="cm-how__hint">{uiT('map.pickHint', locale)}</p>
              <p className="cm-kicker">{uiT('map.readTitle', locale)}</p>
              <ul className="cm-read">
                <li>
                  <a href={withBase(base, '/notes/#stupnice')}>{uiT('map.readNotes', locale)}</a>
                </li>
                <li>
                  <a href={withBase(base, '/anatomie-herniho-lore/')}>{uiT('map.readEssay', locale)}</a>
                </li>
                <li>
                  <a href={withBase(base, '/teoreticke-zazemi/')}>{uiT('map.readTheory', locale)}</a>
                </li>
              </ul>
            </div>
          )}
        </aside>

        {/* ---------- 2. Korelace souřadnic ---------- */}
        <section className="cm-cross" aria-labelledby="cm-cross-title">
          <header className="cm-cross__head">
            <p className="cm-kicker">{uiT('map.crossKicker', locale)}</p>
            <h2 id="cm-cross-title">{uiT('map.crossTitle', locale)}</h2>
          </header>

          <div className="cm-cross__controls">
            {(['x', 'y'] as const).map((which) => (
              <label key={which} className="cm-field">
                <span>{uiT(which === 'x' ? 'map.axisX' : 'map.axisY', locale)}</span>
                <select value={which === 'x' ? xi : yi} onChange={(e) => setAxis(which, Number(e.target.value))}>
                  {AXIS_KEYS.map((k, i) => (
                    <option key={k} value={i}>
                      {axisName(k, locale)} · {pole(k, 'left', locale)} ↔ {pole(k, 'right', locale)}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="button" className="cm-link cm-swap" onClick={() => setAxis('x', yi)}>
              {uiT('map.swap', locale)}
            </button>
            {picks.length || focus ? (
              <button type="button" className="cm-link cm-swap" onClick={clearAll}>
                {uiT('map.clearAll', locale)}
              </button>
            ) : null}
          </div>
          {legend}

          <div className="cm-map">
            <div className="cm-yaxis" aria-hidden="true">
              <span>{pole(ay, 'left', locale)} ←</span>
              <b>{axisName(ay, locale)}</b>
              <span>→ {pole(ay, 'right', locale)}</span>
            </div>
            <div className="cm-grid" role="grid" aria-label={`${axisName(ax, locale)} × ${axisName(ay, locale)}`}>
              {[4, 3, 2, 1, 0].map((y) => (
                <div className="cm-row" role="row" key={y}>
                  <span className="cm-tick">{y + 1}</span>
                  {[0, 1, 2, 3, 4].map((x) => {
                    const list = cells[x][y];
                    const open = openCell?.[0] === x && openCell?.[1] === y;
                    return (
                      <div
                        role="gridcell"
                        key={x}
                        className={`cm-cell${list.length ? '' : ' is-empty'}${open ? ' is-open' : ''}`}
                        onClick={() => list.length && setOpenCell(open ? null : [x, y])}
                      >
                        {list.length ? (
                          <>
                            <span className="cm-cell__n">{list.length}</span>
                            <div className="cm-cell__list">{list.map(gridWorld)}</div>
                          </>
                        ) : (
                          <em>{uiT('map.incognita', locale)}</em>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="cm-row cm-row--ticks" aria-hidden="true">
                <span className="cm-tick" />
                {[1, 2, 3, 4, 5].map((v) => (
                  <span key={v} className="cm-tick">
                    {v}
                  </span>
                ))}
              </div>
              <div className="cm-xaxis" aria-hidden="true">
                <span>← {pole(ax, 'left', locale)}</span>
                <b>{axisName(ax, locale)}</b>
                <span>{pole(ax, 'right', locale)} →</span>
              </div>
            </div>
            {openCell ? (
              <div className="cm-cellopen">
                <p className="cm-kicker">
                  {axisName(ax, locale)} {openCell[0] + 1} · {axisName(ay, locale)} {openCell[1] + 1}
                </p>
                <div>{cells[openCell[0]][openCell[1]].map(gridWorld)}</div>
              </div>
            ) : null}
          </div>

          <div className="cm-pairs">
            <div className="cm-pairs__head">
              <h3>{uiT('map.pairsTitle', locale)}</h3>
            </div>
            <div className="cm-pairs__grid">
              {pairs.map(({ i, j, counts }) => {
                const on = (xi === i && yi === j) || (xi === j && yi === i);
                const max = Math.max(...counts.flat());
                return (
                  <button
                    key={`${i}${j}`}
                    type="button"
                    className="cm-pair"
                    aria-pressed={on}
                    onClick={() => {
                      setXi(i);
                      setYi(j);
                    }}
                  >
                    <svg viewBox="0 0 50 50" aria-hidden="true">
                      {[0, 1, 2, 3, 4, 5].map((k) => (
                        <g key={k}>
                          <line x1={k * 10} y1={0} x2={k * 10} y2={50} />
                          <line x1={0} y1={k * 10} x2={50} y2={k * 10} />
                        </g>
                      ))}
                      {counts.flatMap((col, x) =>
                        col.map((n, y) =>
                          n ? <circle key={`${x}${y}`} cx={x * 10 + 5} cy={(4 - y) * 10 + 5} r={1.2 + 3.4 * Math.sqrt(n / max)} /> : null,
                        ),
                      )}
                    </svg>
                    <span className="cm-pair__name">
                      {axisName(AXIS_KEYS[i], locale)} × {axisName(AXIS_KEYS[j], locale)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
