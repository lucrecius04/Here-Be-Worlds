import { useEffect, useMemo, useRef, useState } from 'react';
import type { World } from '../../schemas/world';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS, ProtoHead, axisName, hue, pole, val, type AxisKey, type ProtoProps } from './shared';

/**
 * Návrh B · Pět poledníků: všech pět souřadnic vedle sebe (paralelní souřadnice). Každý svět je jedna
 * linka v barvě archetypu. Souběžné linky = souřadnice jdou spolu, kříže = jdou proti sobě.
 * Klik na hodnotu poledníku filtruje, najetí na linku nebo jméno vytáhne jeden svět.
 * Na úzkém displeji se celý obraz otočí: poledníky jsou řádky, hodnoty jdou zleva doprava.
 */

type Pt = [number, number];

export default function ProtoB({ worlds, chapters, base }: ProtoProps) {
  const locale = useLocale();
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(900);
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vertical = width < 640;
  const order = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, i])), [chapters]);
  const W = width;
  const H = vertical ? 5 * 150 : 520;
  // hlavní směr = pořadí poledníků, příčný = hodnota 1–5
  const mainA = vertical ? 56 : 90;
  const mainB = vertical ? H - 40 : W - 90;
  const crossA = vertical ? 18 : 54;
  const crossB = vertical ? W - 18 : H - 46;
  const step = (crossB - crossA) / 5;
  const mainAt = (k: number) => mainA + (k * (mainB - mainA)) / 4;
  // hodnota 5 nahoře (vodorovně) / vpravo (svisle)
  const crossAt = (v: number) => (vertical ? crossA + (v - 0.5) * step : crossA + (5.5 - v) * step);
  const P = (k: number, c: number): Pt => (vertical ? [c, mainAt(k)] : [mainAt(k), c]);

  /* Rozprostření světů se stejnou hodnotou, seřazené podle sousedních poledníků (méně křížení). */
  const nodes = useMemo(() => {
    const map = new Map<string, number[]>();
    AXIS_KEYS.forEach((key, k) => {
      for (let v = 1; v <= 5; v++) {
        const prev = AXIS_KEYS[k - 1];
        const next = AXIS_KEYS[k + 1];
        const bucket = worlds
          .filter((w) => val(w, key) === v)
          .sort(
            (a, b) =>
              (prev ? val(a, prev) - val(b, prev) : 0) ||
              (next ? val(a, next) - val(b, next) : 0) ||
              order[a.chapterId] - order[b.chapterId] ||
              a.id.localeCompare(b.id),
          );
        const span = Math.min(step * 0.55, bucket.length * 5);
        bucket.forEach((w, i) => {
          const off = bucket.length > 1 ? -span / 2 + (i * span) / (bucket.length - 1) : 0;
          const arr = map.get(w.id) ?? [];
          arr[k] = crossAt(v) + (vertical ? off : -off);
          map.set(w.id, arr);
        });
      }
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worlds, order, step, vertical, crossA]);

  const pathOf = (w: World) => {
    const cs = nodes.get(w.id) ?? [];
    let d = '';
    for (let k = 0; k < 5; k++) {
      const [x, y] = P(k, cs[k]);
      if (k === 0) d += `M${x},${y}`;
      else {
        const [px, py] = P(k - 1, cs[k - 1]);
        if (vertical) {
          const my = (py + y) / 2;
          d += ` C${px},${my} ${x},${my} ${x},${y}`;
        } else {
          const mx = (px + x) / 2;
          d += ` C${mx},${py} ${mx},${y} ${x},${y}`;
        }
      }
    }
    return d;
  };

  const passes = (w: World) => Object.entries(filters).every(([k, vs]) => !vs.length || vs.includes(val(w, k as AxisKey)));
  const filtering = Object.values(filters).some((vs) => vs.length);
  const matched = worlds.filter(passes);
  const active = hover ?? pin;
  const toggle = (key: AxisKey, v: number) =>
    setFilters((cur) => {
      const vs = cur[key] ?? [];
      return { ...cur, [key]: vs.includes(v) ? vs.filter((x) => x !== v) : [...vs, v] };
    });
  const pinned = worlds.find((w) => w.id === pin);

  // pořadí kreslení: ztlumené dole, vybrané nahoře
  const drawOrder = [...worlds].sort(
    (a, b) => Number(passes(a)) - Number(passes(b)) || Number(a.id === active) - Number(b.id === active),
  );

  return (
    <div className="mp mpb">
      <ProtoHead
        variant="b"
        base={base}
        lead="Každá linka je jeden svět, který prochází všemi pěti souřadnicemi. Kde linky běží souběžně, souřadnice jdou spolu."
      />

      <div className="mpb-bar">
        <p className="mpb-count">
          {filtering ? (
            <>
              <b>{matched.length}</b> z {worlds.length} světů ·{' '}
              {Object.entries(filters)
                .filter(([, vs]) => vs.length)
                .map(([k, vs]) => `${axisName(k as AxisKey, locale)} ${[...vs].sort().join(', ')}`)
                .join(' · ')}{' '}
              <button type="button" className="mp-link" onClick={() => setFilters({})}>
                Zrušit
              </button>
            </>
          ) : (
            <>Klikni na hodnotu na poledníku a necháš jen světy, které jí procházejí. Hodnoty jdou kombinovat.</>
          )}
        </p>
      </div>

      <div className="mpb-layout">
        <div className="mpb-plot" ref={boxRef}>
          <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label="Pět poledníků souřadnic">
            {AXIS_KEYS.map((key, k) => {
              const [x1, y1] = P(k, crossA);
              const [x2, y2] = P(k, crossB);
              return (
                <g key={key} className="mpb-axis">
                  <line x1={x1} y1={y1} x2={x2} y2={y2} />
                  {vertical ? (
                    <>
                      <text className="mpb-name" x={crossA} y={mainAt(k) - 24}>
                        {axisName(key, locale)}
                      </text>
                      <text className="mpb-pole" x={crossA} y={mainAt(k) - 10}>
                        ← {pole(key, 'left', locale)}
                      </text>
                      <text className="mpb-pole" x={crossB} y={mainAt(k) - 10} textAnchor="end">
                        {pole(key, 'right', locale)} →
                      </text>
                    </>
                  ) : (
                    <>
                      <text className="mpb-name" x={mainAt(k)} y={18} textAnchor="middle">
                        {axisName(key, locale)}
                      </text>
                      <text className="mpb-pole" x={mainAt(k)} y={36} textAnchor="middle">
                        {pole(key, 'right', locale)}
                      </text>
                      <text className="mpb-pole" x={mainAt(k)} y={H - 22} textAnchor="middle">
                        {pole(key, 'left', locale)}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
            {drawOrder.map((w) => {
              const on = passes(w);
              const cls = [
                'mpb-line',
                !on ? 'is-off' : '',
                active && w.id === active ? 'is-active' : '',
                active && w.id !== active ? 'is-quiet' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <path
                  key={w.id}
                  d={pathOf(w)}
                  className={cls}
                  style={hue(chapters, w.chapterId)}
                  onMouseEnter={() => on && setHover(w.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => on && setPin(w.id === pin ? null : w.id)}
                >
                  <title>{t(w.gameTitle, locale)}</title>
                </path>
              );
            })}
            {/* hodnoty poledníků nad linkami: popisky čitelné a klik filtruje */}
            {AXIS_KEYS.map((key, k) => (
              <g key={`s-${key}`} className="mpb-stops">
                  {[1, 2, 3, 4, 5].map((v) => {
                  const on = (filters[key] ?? []).includes(v);
                  const n = worlds.filter((w) => val(w, key) === v).length;
                  const [cx, cy] = P(k, crossAt(v));
                  const bw = vertical ? step - 6 : 34;
                  const bh = vertical ? 30 : step - 6;
                  return (
                    <g key={v} className={`mpb-stop${on ? ' is-on' : ''}`} onClick={() => toggle(key, v)}>
                      <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={2} />
                      <text
                        className="mpb-stop__v"
                        x={vertical ? cx : cx - 26}
                        y={vertical ? cy + 27 : cy + 4}
                        textAnchor={vertical ? 'middle' : 'end'}
                      >
                        {v}
                        {n ? <tspan className="mpb-stop__n"> · {n}</tspan> : null}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
            {active
              ? (() => {
                  const w = worlds.find((x) => x.id === active)!;
                  const cs = nodes.get(w.id) ?? [];
                  return (
                    <g className="mpb-active" style={hue(chapters, w.chapterId)}>
                      {cs.map((c, k) => {
                        const [x, y] = P(k, c);
                        return <circle key={k} cx={x} cy={y} r={4} />;
                      })}
                      {(() => {
                        const [x, y] = P(4, cs[4]);
                        return vertical ? null : (
                          <text x={x + 12} y={y + 4} className="mpb-label">
                            {t(w.gameTitle, locale)}
                          </text>
                        );
                      })()}
                    </g>
                  );
                })()
              : null}
          </svg>
        </div>

        <aside className="mpb-side">
          {pinned ? (
            <div className="mpb-card" style={hue(chapters, pinned.chapterId)}>
              <p className="mp-kicker mp-kicker--hue">{t(chapters.find((c) => c.id === pinned.chapterId)?.title ?? { en: '' }, locale)}</p>
              <h2>{t(pinned.gameTitle, locale)}</h2>
              <p className="mpb-card__core">{t(pinned.core, locale)}</p>
              <p className="mpb-card__go">
                <a href={withBase(base, `/worlds/${pinned.id}/`)}>Otevřít spis →</a>
                <button type="button" className="mp-link" onClick={() => setPin(null)}>
                  Pustit
                </button>
              </p>
            </div>
          ) : null}
          <div className="mpb-list">
            {chapters.map((c) => {
              const list = worlds.filter((w) => w.chapterId === c.id).sort((a, b) => t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale));
              return (
                <div key={c.id} className="mpb-group" style={hue(chapters, c.id)}>
                  <p className="mp-kicker mp-kicker--hue">{t(c.title, locale)}</p>
                  <ul>
                    {list.map((w) => (
                      <li key={w.id}>
                        <button
                          type="button"
                          className={[
                            !passes(w) ? 'is-off' : '',
                            w.id === active ? 'is-active' : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || undefined}
                          onMouseEnter={() => setHover(w.id)}
                          onMouseLeave={() => setHover(null)}
                          onClick={() => setPin(w.id === pin ? null : w.id)}
                        >
                          {t(w.gameTitle, locale)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
