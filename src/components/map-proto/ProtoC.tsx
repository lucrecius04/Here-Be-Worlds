import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { World } from '../../schemas/world';
import { t } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  AXIS_KEYS,
  ArchetypeLegend,
  ProtoHead,
  axisName,
  hue,
  pole,
  val,
  type ProtoProps,
} from './shared';

/**
 * Návrh C · Pět pásů: každá souřadnice je pás s pěti sloupci (hodnoty 1–5), světy v něm jako čtverečky
 * v barvě archetypu. Na první pohled je vidět, kam se atlas kloní (kde je pás plný). Najetí na svět
 * rozsvítí jeho čtverečky ve všech pěti pásech a spojí je linkou: profil světa napříč atlasem.
 * Kosočtverec pod pásem je průměr (stejný jazyk jako průměr archetypu jinde na webu).
 */

type Line = { x: number; y: number }[];

export default function ProtoC({ worlds, chapters, base }: ProtoProps) {
  const locale = useLocale();
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);
  const [focus, setFocus] = useState('');
  const [line, setLine] = useState<Line>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const order = useMemo(() => Object.fromEntries(chapters.map((c, i) => [c.id, i])), [chapters]);
  const active = hover ?? pin;
  const activeWorld = worlds.find((w) => w.id === active);
  const pinned = worlds.find((w) => w.id === pin);
  const scope = focus ? worlds.filter((w) => w.chapterId === focus) : worlds;

  const sorted = useMemo(
    () =>
      [...worlds].sort(
        (a, b) => order[a.chapterId] - order[b.chapterId] || t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale),
      ),
    [worlds, order, locale],
  );

  // Linka profilu: středy rozsvícených čtverečků, změřené po vykreslení.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !active) {
      setLine([]);
      return;
    }
    const box = wrap.getBoundingClientRect();
    const pts = AXIS_KEYS.map((key) => {
      const el = wrap.querySelector<HTMLElement>(`[data-dot="${key}:${active}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    }).filter(Boolean) as Line;
    setLine(pts);
  }, [active, focus, worlds]);

  return (
    <div className="mp mpc">
      <ProtoHead
        variant="c"
        base={base}
        lead="Pět souřadnic jako pět pásů. Hned vidíš, kam se atlas kloní, a když najedeš na svět, ukáže se jeho profil napříč všemi."
      />

      <div className="mpc-top">
        <ArchetypeLegend chapters={chapters} worlds={worlds} focus={focus} onFocus={setFocus} locale={locale} />
        <label className="mp-field mpc-find">
          <span>Najdi svět</span>
          <select value={pin ?? ''} onChange={(e) => setPin(e.target.value || null)}>
            <option value="">—</option>
            {[...worlds]
              .sort((a, b) => t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale))
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {t(w.gameTitle, locale)}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="mpc-layout">
        <div className={`mpc-strips${active ? ' has-active' : ''}`} ref={wrapRef}>
          {AXIS_KEYS.map((key) => {
            const avg = scope.reduce((s, w) => s + val(w, key), 0) / Math.max(1, scope.length);
            const counts = [1, 2, 3, 4, 5].map((v) => scope.filter((w) => val(w, key) === v).length);
            const peak = counts.indexOf(Math.max(...counts)) + 1;
            return (
              <section className="mpc-strip" key={key}>
                <header className="mpc-strip__head">
                  <h2>{axisName(key, locale)}</h2>
                  <p>
                    nejvíc světů na {peak} · {Math.max(...counts)}
                  </p>
                </header>
                <div className="mpc-strip__body">
                  <div className="mpc-strip__poles" aria-hidden="true">
                    <span>← {pole(key, 'left', locale)}</span>
                    <span>{pole(key, 'right', locale)} →</span>
                  </div>
                  <div className="mpc-cols">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <div className="mpc-col" key={v}>
                        <div className="mpc-dots">
                          {sorted
                            .filter((w) => val(w, key) === v)
                            .map((w) => (
                              <button
                                key={w.id}
                                type="button"
                                data-dot={`${key}:${w.id}`}
                                className={[
                                  'mpc-dot',
                                  w.id === active ? 'is-active' : '',
                                  focus && w.chapterId !== focus ? 'is-dim' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={hue(chapters, w.chapterId)}
                                aria-label={`${t(w.gameTitle, locale)}: ${axisName(key, locale)} ${v}`}
                                title={t(w.gameTitle, locale)}
                                onMouseEnter={() => setHover(w.id)}
                                onMouseLeave={() => setHover(null)}
                                onFocus={() => setHover(w.id)}
                                onBlur={() => setHover(null)}
                                onClick={() => setPin(w.id === pin ? null : w.id)}
                              />
                            ))}
                        </div>
                        <span className="mpc-col__v">{v}</span>
                      </div>
                    ))}
                    <span
                      className="mpc-avg"
                      style={{ left: `${((avg - 0.5) / 5) * 100}%` }}
                      title={`Průměr ${focus ? 'archetypu' : 'atlasu'}: ${avg.toFixed(1).replace('.', ',')}`}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </section>
            );
          })}
          {line.length > 1 && activeWorld ? (
            <svg className="mpc-line" style={hue(chapters, activeWorld.chapterId)} aria-hidden="true">
              <polyline points={line.map((p) => `${p.x},${p.y}`).join(' ')} />
            </svg>
          ) : null}
        </div>

        <aside className="mpc-side" aria-live="polite">
          {activeWorld ? (
            <div className="mpc-card" style={hue(chapters, activeWorld.chapterId)}>
              <p className="mp-kicker mp-kicker--hue">{t(chapters.find((c) => c.id === activeWorld.chapterId)?.title ?? { en: '' }, locale)}</p>
              <h2>{t(activeWorld.gameTitle, locale)}</h2>
              <p className="mpc-card__core">{t(activeWorld.core, locale)}</p>
              <dl className="mpc-card__vals">
                {AXIS_KEYS.map((key) => {
                  const v = val(activeWorld, key);
                  return (
                    <div key={key}>
                      <dt>{axisName(key, locale)}</dt>
                      <dd>{v < 3 ? pole(key, 'left', locale) : v > 3 ? pole(key, 'right', locale) : 'uprostřed'}</dd>
                    </div>
                  );
                })}
              </dl>
              {pinned?.id === activeWorld.id ? (
                <p className="mpc-card__go">
                  <a href={withBase(base, `/worlds/${activeWorld.id}/`)}>Otevřít spis →</a>
                  <button type="button" className="mp-link" onClick={() => setPin(null)}>
                    Pustit
                  </button>
                </p>
              ) : (
                <p className="mpc-card__hint">Klikni a svět zůstane vybraný.</p>
              )}
            </div>
          ) : (
            <div className="mpc-card mpc-card--empty">
              <p className="mp-kicker">Jak číst pásy</p>
              <p>Každý čtvereček je jeden svět v barvě svého archetypu. Čím plnější sloupec, tím víc světů tam leží.</p>
              <p>
                Kosočtverec pod pásem je průměr {focus ? 'vybraného archetypu' : 'celého atlasu'}. Vyber archetyp nahoře a uvidíš, kam
                se kloní on.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
