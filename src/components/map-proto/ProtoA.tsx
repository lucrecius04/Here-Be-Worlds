import { useEffect, useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import { t, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import AxisBars from '../discovery/AxisBars';
import {
  AXIS_KEYS,
  ArchetypeLegend,
  ProtoHead,
  axisName,
  hue,
  pearson,
  pole,
  val,
  type AxisKey,
  type ProtoProps,
} from './shared';

/**
 * Návrh A · Kartografický list: dvě souřadnice zkřížené do mřížky 5 × 5 (hodnoty jsou celá čísla,
 * takže poctivé „parcely“, ne spojitý graf). Vedle mapy Zápisky kartografa, které z dat vyčtou,
 * co je na téhle dvojici zajímavé. Pod mapou Deset map: všechny dvojice jako navigace.
 */

type Cells = World[][][]; // [x-1][y-1]

function buildCells(worlds: World[], ax: AxisKey, ay: AxisKey, order: Record<string, number>): Cells {
  const cells: Cells = [0, 1, 2, 3, 4].map(() => [0, 1, 2, 3, 4].map(() => []));
  for (const w of worlds) cells[val(w, ax) - 1][val(w, ay) - 1].push(w);
  for (const col of cells) for (const list of col) list.sort((a, b) => order[a.chapterId] - order[b.chapterId]);
  return cells;
}

function strength(r: number): { word: string; level: number } {
  const a = Math.abs(r);
  if (a >= 0.5) return { word: 'silná souvislost', level: 3 };
  if (a >= 0.3) return { word: 'znatelná souvislost', level: 2 };
  if (a >= 0.15) return { word: 'slabá souvislost', level: 1 };
  return { word: 'bez souvislosti', level: 0 };
}

type Note = { kicker: string; text: string; worlds?: World[] };

function fieldNotes(worlds: World[], cells: Cells, ax: AxisKey, ay: AxisKey, locale: Locale): Note[] {
  const notes: Note[] = [];
  const r = pearson(
    worlds.map((w) => val(w, ax)),
    worlds.map((w) => val(w, ay)),
  );
  const s = strength(r);
  const xn = axisName(ax, locale);
  const yn = axisName(ay, locale);
  if (s.level >= 2) {
    const ySide = r > 0 ? 'right' : 'left';
    notes.push({
      kicker: s.level === 3 ? 'Silná souvislost' : 'Znatelná souvislost',
      text: `${xn} a ${yn.toLowerCase()} jdou spolu: čím blíž pólu ${pole(ax, 'right', locale)}, tím spíš i ${pole(ay, ySide, locale)}.`,
    });
  } else {
    notes.push({
      kicker: s.level === 1 ? 'Slabá souvislost' : 'Bez souvislosti',
      text: `${xn} o souřadnici ${yn} skoro nic neprozradí. Světy se tu rozběhly po celé mapě.`,
    });
  }
  // nejhustší parcela
  let best = { n: 0, x: 0, y: 0 };
  cells.forEach((col, x) => col.forEach((list, y) => list.length > best.n && (best = { n: list.length, x, y })));
  if (best.n > 1) {
    notes.push({
      kicker: 'Nejhustší parcela',
      text: `${best.n} světů na místě ${xn} ${best.x + 1} · ${yn} ${best.y + 1}.`,
      worlds: cells[best.x][best.y],
    });
  }
  // bílá místa v rozích
  const empty = cells.flat().filter((l) => l.length === 0).length;
  const corners = (
    [
      [0, 0],
      [0, 4],
      [4, 0],
      [4, 4],
    ] as const
  ).filter(([x, y]) => cells[x][y].length === 0);
  if (empty) {
    const names = corners
      .map(([x, y]) => `${pole(ax, x === 0 ? 'left' : 'right', locale)} × ${pole(ay, y === 0 ? 'left' : 'right', locale)}`)
      .join(', ');
    notes.push({
      kicker: 'Bílá místa',
      text: `${empty} z 25 parcel je prázdných.${corners.length ? ` Nikdo nežije v rohu ${names}.` : ''}`,
    });
  }
  // osamělí na okraji
  const lonely: World[] = [];
  cells.forEach((col, x) =>
    col.forEach((list, y) => {
      if (list.length === 1 && (x === 0 || x === 4 || y === 0 || y === 4)) lonely.push(list[0]);
    }),
  );
  if (lonely.length) {
    notes.push({ kicker: 'Sami na okraji mapy', text: 'Parcely na kraji, kde žije jediný svět.', worlds: lonely.slice(0, 4) });
  }
  return notes;
}

export default function ProtoA({ worlds, chapters, base }: ProtoProps) {
  const locale = useLocale();
  const [xi, setXi] = useState(0);
  const [yi, setYi] = useState(2);
  const [sel, setSel] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [openCell, setOpenCell] = useState<[number, number] | null>(null);
  const ax = AXIS_KEYS[xi];
  const ay = AXIS_KEYS[yi];
  const order = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, i])), [chapters]);
  const cells = useMemo(() => buildCells(worlds, ax, ay, order), [worlds, ax, ay, order]);
  const notes = useMemo(() => fieldNotes(worlds, cells, ax, ay, locale), [worlds, cells, ax, ay, locale]);
  const selWorld = worlds.find((w) => w.id === sel);
  const chapterOf = (w: World) => chapters.find((c) => c.id === w.chapterId);

  useEffect(() => setOpenCell(null), [xi, yi]);

  const setAxis = (which: 'x' | 'y', i: number) => {
    if (which === 'x') {
      if (i === yi) setYi(xi);
      setXi(i);
    } else {
      if (i === xi) setXi(yi);
      setYi(i);
    }
  };

  const pairs = useMemo(() => {
    const out: Array<{ i: number; j: number; counts: number[][]; r: number }> = [];
    for (let i = 0; i < 5; i++)
      for (let j = i + 1; j < 5; j++) {
        const counts = [0, 1, 2, 3, 4].map(() => [0, 0, 0, 0, 0]);
        for (const w of worlds) counts[val(w, AXIS_KEYS[i]) - 1][val(w, AXIS_KEYS[j]) - 1]++;
        out.push({
          i,
          j,
          counts,
          r: pearson(
            worlds.map((w) => val(w, AXIS_KEYS[i])),
            worlds.map((w) => val(w, AXIS_KEYS[j])),
          ),
        });
      }
    return out;
  }, [worlds]);

  const worldBtn = (w: World) => (
    <button
      key={w.id}
      type="button"
      className={[
        'mpa-w',
        w.id === sel ? 'is-sel' : '',
        focus && w.chapterId !== focus ? 'is-dim' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={hue(chapters, w.chapterId)}
      onClick={() => setSel(w.id === sel ? null : w.id)}
      title={t(w.gameTitle, locale)}
    >
      <i aria-hidden="true" />
      <span>{t(w.gameTitle, locale)}</span>
    </button>
  );

  return (
    <div className="mp mpa">
      <ProtoHead
        variant="a"
        base={base}
        lead="Zkřiž dvě souřadnice a uvidíš, kde světy leží, kde se tlačí a kde zůstala bílá místa."
      />

      <div className="mpa-controls">
        {(['x', 'y'] as const).map((which) => (
          <label key={which} className="mp-field">
            <span>{which === 'x' ? 'Vodorovně' : 'Svisle'}</span>
            <select value={which === 'x' ? xi : yi} onChange={(e) => setAxis(which, Number(e.target.value))}>
              {AXIS_KEYS.map((k, i) => (
                <option key={k} value={i}>
                  {axisName(k, locale)} · {pole(k, 'left', locale)} ↔ {pole(k, 'right', locale)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="button" className="mp-link" onClick={() => setAxis('x', yi)}>
          ⇅ Prohodit
        </button>
      </div>

      <div className="mpa-layout">
        <div className="mpa-map">
          <div className="mpa-yaxis" aria-hidden="true">
            <span>{pole(ay, 'left', locale)} ←</span>
            <b>{axisName(ay, locale)}</b>
            <span>→ {pole(ay, 'right', locale)}</span>
          </div>
          <div className="mpa-grid" role="grid" aria-label={`${axisName(ax, locale)} × ${axisName(ay, locale)}`}>
            {[4, 3, 2, 1, 0].map((y) => (
              <div className="mpa-row" role="row" key={y}>
                <span className="mpa-tick">{y + 1}</span>
                {[0, 1, 2, 3, 4].map((x) => {
                  const list = cells[x][y];
                  const open = openCell?.[0] === x && openCell?.[1] === y;
                  return (
                    <div
                      role="gridcell"
                      key={x}
                      className={`mpa-cell${list.length ? '' : ' is-empty'}${open ? ' is-open' : ''}`}
                      onClick={() => list.length && setOpenCell(open ? null : [x, y])}
                    >
                      {list.length ? (
                        <>
                          <span className="mpa-cell__n">{list.length}</span>
                          <div className="mpa-cell__list">{list.map(worldBtn)}</div>
                        </>
                      ) : (
                        <em>terra incognita</em>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="mpa-row mpa-row--ticks" aria-hidden="true">
              <span className="mpa-tick" />
              {[1, 2, 3, 4, 5].map((v) => (
                <span key={v} className="mpa-tick">
                  {v}
                </span>
              ))}
            </div>
            <div className="mpa-xaxis" aria-hidden="true">
              <span>← {pole(ax, 'left', locale)}</span>
              <b>{axisName(ax, locale)}</b>
              <span>{pole(ax, 'right', locale)} →</span>
            </div>
          </div>
          {openCell ? (
            <div className="mpa-cellopen">
              <p className="mp-kicker">
                {axisName(ax, locale)} {openCell[0] + 1} · {axisName(ay, locale)} {openCell[1] + 1}
              </p>
              <div>{cells[openCell[0]][openCell[1]].map(worldBtn)}</div>
            </div>
          ) : null}
          <ArchetypeLegend chapters={chapters} worlds={worlds} focus={focus} onFocus={setFocus} locale={locale} />
        </div>

        <aside className="mpa-side" aria-live="polite">
          {selWorld ? (
            <div className="mpa-dossier" style={hue(chapters, selWorld.chapterId)}>
              <button type="button" className="mp-link" onClick={() => setSel(null)}>
                ← Zápisky kartografa
              </button>
              <p className="mp-kicker mp-kicker--hue">{t(chapterOf(selWorld)?.title ?? { en: '' }, locale)}</p>
              <h2 className="mpa-dossier__title">{t(selWorld.gameTitle, locale)}</h2>
              <p className="mpa-dossier__core">{t(selWorld.core, locale)}</p>
              <AxisBars world={selWorld} locale={locale} />
              <p className="mpa-dossier__go">
                <a href={withBase(base, `/worlds/${selWorld.id}/`)}>Otevřít spis →</a>
                <a href={withBase(base, `/compare/?w=${selWorld.id}`)}>Srovnat →</a>
              </p>
            </div>
          ) : (
            <div className="mpa-notes">
              <p className="mp-kicker">Zápisky kartografa</p>
              {notes.map((n) => (
                <div className="mpa-note" key={n.kicker}>
                  <h3>{n.kicker}</h3>
                  <p>{n.text}</p>
                  {n.worlds ? <div className="mpa-note__worlds">{n.worlds.map(worldBtn)}</div> : null}
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <section className="mpa-pairs">
        <div className="mpa-pairs__head">
          <h2>Deset map</h2>
          <p>Každá dvojice souřadnic je jiná mapa. Plné kruhy jsou hustá místa.</p>
        </div>
        <div className="mpa-pairs__grid">
          {pairs.map(({ i, j, counts, r }) => {
            const on = (xi === i && yi === j) || (xi === j && yi === i);
            const max = Math.max(...counts.flat());
            return (
              <button
                key={`${i}${j}`}
                type="button"
                className="mpa-pair"
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
                <span className="mpa-pair__name">
                  {axisName(AXIS_KEYS[i], locale)} × {axisName(AXIS_KEYS[j], locale)}
                </span>
                <span className="mpa-pair__r">{strength(r).word}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
