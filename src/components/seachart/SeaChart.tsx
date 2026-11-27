/**
 * Mapa známých světů (náhled, etapa 1): každý svět je ostrov, kraje jsou archetypy.
 * Kresba je jedno SVG v jednotkách mapy (1600 × 1000); přibližuje se a posouvá změnou viewBox.
 * Jména ostrovů mají stálou velikost na obrazovce a ukazují se jen ta, která se nepřekrývají
 * (přednost má vybraný ostrov, jeho příbuzní, nejznámější světy a velké ostrovy).
 * Ovládání: tah myší nebo prstem, kolečko / dva prsty, tlačítka + − ⤢, šipky, + − 0, Esc.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { LocalizedString } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { CHART_W, CHART_H, islandShape, REGION_FONT, REGION_TRACK } from '../../lib/sea-chart';
import type { IslandShape } from '../../lib/sea-chart';
import '../../styles/sea-chart.css';
import { BOAT_TRANSFORM, FEATHER, HULL, OPEN_RING, WAVE, WAVE_TRANSFORM } from '../../lib/brand-mark';

type Island = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  genre: LocalizedString;
  core: LocalizedString;
  x: number;
  y: number;
  r: number;
  arch: boolean;
  iconic: boolean;
  kin: Array<{ id: string; level: number }>;
};

type Region = {
  id: string;
  title: LocalizedString;
  short?: LocalizedString;
  linesCs: string[];
  linesEn: string[];
  x: number;
  y: number;
  light: string;
  dark: string;
  count: number;
};

type Props = {
  base: string;
  islands: Island[];
  regions: Region[];
  rose: [number, number];
  empty: [number, number];
  stamp: string;
};

type View = { x: number; y: number; w: number };

const MIN_W = 240;
const NAME_PX = 12.5;
const EASE = (k: number) => 1 - (1 - k) ** 3;

const fold = (s: string) =>
  s
    .toLocaleLowerCase('cs')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function hueStyle(light: string, dark: string): CSSProperties {
  return { '--hue-l': light, '--hue-d': dark } as CSSProperties;
}

/* ---------- Ozdoby mapy (neměnné, kreslí se jednou) ---------- */

/** Rám mapy: dvojitá linka a mezi ní střídavé dílky jako na ryté námořní mapě. */
const Neatline = memo(function Neatline() {
  const o = 22;
  const i = 32;
  const step = 50;
  const bars: string[] = [];
  for (let x = i, k = 0; x < CHART_W - i; x += step, k += 1) {
    if (k % 2 === 0) {
      const x2 = Math.min(x + step, CHART_W - i);
      bars.push(`M${x} ${o}H${x2}V${i}H${x}Z`, `M${x} ${CHART_H - i}H${x2}V${CHART_H - o}H${x}Z`);
    }
  }
  for (let y = i, k = 0; y < CHART_H - i; y += step, k += 1) {
    if (k % 2 === 0) {
      const y2 = Math.min(y + step, CHART_H - i);
      bars.push(`M${o} ${y}V${y2}H${i}V${y}Z`, `M${CHART_W - i} ${y}V${y2}H${CHART_W - o}V${y}Z`);
    }
  }
  return (
    <g className="sc-neat" aria-hidden="true">
      <rect x={o} y={o} width={CHART_W - 2 * o} height={CHART_H - 2 * o} />
      <rect x={i} y={i} width={CHART_W - 2 * i} height={CHART_H - 2 * i} />
      <path className="sc-neat__bars" d={bars.join('')} />
      <rect className="sc-neat__inner" x={i + 6} y={i + 6} width={CHART_W - 2 * i - 12} height={CHART_H - 2 * i - 12} />
    </g>
  );
});

/** Loxodromy z růžice přes celé moře (typický znak portolánů). */
const Rhumbs = memo(function Rhumbs({ rose }: { rose: [number, number] }) {
  const len = 2400;
  const lines: string[] = [];
  for (let k = 0; k < 32; k += 1) {
    const a = (k / 32) * Math.PI * 2;
    lines.push(`M${rose[0]} ${rose[1]}L${(rose[0] + Math.cos(a) * len).toFixed(1)} ${(rose[1] + Math.sin(a) * len).toFixed(1)}`);
  }
  return (
    <g className="sc-rhumbs" clipPath="url(#sc-sea)" aria-hidden="true">
      <path d={lines.filter((_, k) => k % 2 === 0).join('')} />
      <path className="sc-rhumbs__minor" d={lines.filter((_, k) => k % 2 === 1).join('')} />
    </g>
  );
});

/** Růžice: šestnáct cípů kolem medailonu se znakem atlasu. */
const Rose = memo(function Rose({ at }: { at: [number, number] }) {
  const [cx, cy] = at;
  const point = (a: number, len: number, wide: number) => {
    const tip = [cx + Math.cos(a) * len, cy + Math.sin(a) * len];
    const l = [cx + Math.cos(a - Math.PI / 2) * wide, cy + Math.sin(a - Math.PI / 2) * wide];
    const r = [cx + Math.cos(a + Math.PI / 2) * wide, cy + Math.sin(a + Math.PI / 2) * wide];
    const f = (p: number[]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    return { dark: `M${cx} ${cy}L${f(l)}L${f(tip)}Z`, light: `M${cx} ${cy}L${f(r)}L${f(tip)}Z` };
  };
  const pts = [];
  for (let k = 0; k < 16; k += 1) {
    const a = (k / 16) * Math.PI * 2 - Math.PI / 2;
    const len = k % 4 === 0 ? 96 : k % 2 === 0 ? 70 : 50;
    const wide = k % 4 === 0 ? 11 : k % 2 === 0 ? 8 : 5.5;
    pts.push({ k, ...point(a, len, wide) });
  }
  // menší cípy pod většími
  pts.sort((a, b) => (b.k % 4 === 0 ? 0 : b.k % 2 === 0 ? 1 : 2) - (a.k % 4 === 0 ? 0 : a.k % 2 === 0 ? 1 : 2));
  const s = 44 / 18.6;
  return (
    <g className="sc-rose" aria-hidden="true">
      <circle cx={cx} cy={cy} r={82} className="sc-rose__ring" />
      <circle cx={cx} cy={cy} r={76} className="sc-rose__ring sc-rose__ring--thin" />
      {pts.map((p) => (
        <g key={p.k}>
          <path d={p.dark} className="sc-rose__dark" />
          <path d={p.light} className="sc-rose__light" />
        </g>
      ))}
      <circle cx={cx} cy={cy} r={27} className="sc-rose__medal" />
      <g transform={`translate(${cx - 22 + 0.8 * s} ${cy - 22 + 0.9 * s}) scale(${s})`}>
        <path d={OPEN_RING} fill="none" stroke="var(--mark-shade)" strokeWidth="0.75" strokeLinecap="round" />
        <g transform={BOAT_TRANSFORM}>
          <path d={FEATHER} fill="none" stroke="var(--color-night)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d={HULL} fill="none" stroke="var(--color-night)" strokeWidth="1.4" strokeLinejoin="round" />
          <path d={FEATHER} fill="var(--mark-light)" fillRule="evenodd" />
          <path d={HULL} fill="var(--mark-light)" fillRule="evenodd" />
          <g transform={WAVE_TRANSFORM}>
            <path d={WAVE} fill="var(--mark-glow)" fillRule="evenodd" stroke="var(--color-night)" strokeWidth={1.4 / 1.3} paintOrder="stroke" strokeLinejoin="round" />
          </g>
        </g>
      </g>
      <text x={cx} y={cy - 104} className="sc-rose__n">
        N
      </text>
    </g>
  );
});

/* ---------- Ostrovy ---------- */

type IslandsProps = {
  islands: Island[];
  shapes: Map<string, IslandShape>;
  styles: Map<string, CSSProperties>;
  focusIds: Set<string> | null;
  selected: string | null;
  hovered: string | null;
  labels: Record<string, string>;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
};

const Islands = memo(function Islands({ islands, shapes, styles, focusIds, selected, hovered, labels, onPick, onHover }: IslandsProps) {
  return (
    <g className="sc-islands">
      {islands.map((i) => {
        const sh = shapes.get(i.id)!;
        const dim = focusIds ? !focusIds.has(i.id) : false;
        const cls = ['sc-island', dim ? 'is-dim' : '', selected === i.id ? 'is-selected' : '', hovered === i.id ? 'is-hover' : ''].join(' ');
        return (
          <g
            key={i.id}
            className={cls}
            style={styles.get(i.id)}
            tabIndex={0}
            role="button"
            aria-label={labels[i.id]}
            aria-pressed={selected === i.id}
            data-island={i.id}
            onPointerEnter={() => onHover(i.id)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(i.id)}
            onBlur={() => onHover(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onPick(i.id);
              }
            }}
          >
            {sh.waterLines.map((d, k) => (
              <path key={k} d={d} className={`sc-water sc-water--${k}`} />
            ))}
            <path d={sh.coast} className="sc-land" />
            <circle cx={i.x} cy={i.y} r={i.r * (i.arch ? 1.35 : 1.05) + 8} className="sc-hit" />
          </g>
        );
      })}
    </g>
  );
});

/* ---------- Hlavní komponenta ---------- */

export default function SeaChart({ base, islands, regions, rose, empty, stamp }: Props) {
  const locale = useLocale();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 1200, h: 750 });
  const [view, setView] = useState<View>({ x: 0, y: 0, w: CHART_W });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [coarse, setCoarse] = useState(false);
  useEffect(() => setCoarse(window.matchMedia('(pointer: coarse)').matches), []);
  const anim = useRef<number | null>(null);
  const ready = useRef(false);

  const byId = useMemo(() => new Map(islands.map((i) => [i.id, i])), [islands]);
  const regionById = useMemo(() => new Map(regions.map((r) => [r.id, r])), [regions]);
  const shapes = useMemo(() => new Map(islands.map((i) => [i.id, islandShape(i.id, i.x, i.y, i.r, i.arch)])), [islands]);
  const styles = useMemo(
    () =>
      new Map(
        islands.map((i) => {
          const r = regionById.get(i.chapterId);
          return [i.id, hueStyle(r?.light ?? 'currentColor', r?.dark ?? 'currentColor')];
        }),
      ),
    [islands, regionById],
  );
  const ariaLabels = useMemo(
    () => Object.fromEntries(islands.map((i) => [i.id, `${t(i.title, locale)}, ${t(regionById.get(i.chapterId)!.title, locale)}`])),
    [islands, regionById, locale],
  );

  const aspect = size.h / size.w;
  const fitAll = useCallback(
    (asp = aspect): View => {
      const w = Math.max(CHART_W, CHART_H / asp);
      return { x: (CHART_W - w) / 2, y: (CHART_H - w * asp) / 2, w };
    },
    [aspect],
  );

  /** Úvodní pohled: na širokém displeji celá mapa, na úzkém výška mapy (do stran se posouvá). */
  const startView = useCallback(
    (asp: number, isNarrow: boolean): View => {
      if (!isNarrow) return fitAll(asp);
      const w = Math.min(fitAll(asp).w, Math.max(CHART_W * 0.5, CHART_H / asp));
      return { x: (CHART_W - w) / 2 + CHART_W * 0.02, y: (CHART_H - w * asp) / 2, w };
    },
    [fitAll],
  );

  const clamp = useCallback(
    (v: View, asp = aspect): View => {
      const maxW = fitAll(asp).w * 1.05;
      const w = Math.min(maxW, Math.max(MIN_W, v.w));
      const h = w * asp;
      // Střed pohledu zůstane nad mapou (ostrovy u okraje jdou dostat do středu i vedle karty).
      const cx = Math.min(CHART_W, Math.max(0, v.x + v.w / 2));
      const cy = Math.min(CHART_H, Math.max(0, v.y + (v.w * asp) / 2));
      const x = w >= CHART_W ? (CHART_W - w) / 2 : cx - w / 2;
      const y = h >= CHART_H ? (CHART_H - h) / 2 : cy - h / 2;
      return { x, y, w };
    },
    [aspect, fitAll],
  );

  const fitAllRef = useRef(fitAll);
  fitAllRef.current = fitAll;

  const stopAnim = () => {
    if (anim.current !== null) cancelAnimationFrame(anim.current);
    anim.current = null;
  };

  const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const flyTo = useCallback(
    (target: View) => {
      stopAnim();
      const to = clamp(target);
      const from = viewRef.current;
      if (reduced()) {
        setView(to);
        return;
      }
      const t0 = performance.now();
      const dur = 650;
      const tick = (now: number) => {
        const k = EASE(Math.min(1, (now - t0) / dur));
        setView({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, w: from.w + (to.w - from.w) * k });
        anim.current = k < 1 ? requestAnimationFrame(tick) : null;
      };
      anim.current = requestAnimationFrame(tick);
    },
    [clamp],
  );

  /* velikost plochy */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width < 10) return;
      setSize({ w: r.width, h: r.height });
      setNarrow(r.width < 720);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* první pohled + stav z adresy */
  useEffect(() => {
    if (ready.current || size.w === 1200) return;
    ready.current = true;
    const asp = size.h / size.w;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('ostrov');
    const kraj = params.get('kraj');
    setView(startView(asp, size.w < 720));
    if (id && byId.has(id)) setTimeout(() => pick(id), 60);
    else if (kraj && regionById.has(kraj)) setTimeout(() => focusRegion(kraj), 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  /* při změně velikosti zachovat střed */
  useEffect(() => {
    if (!ready.current) return;
    setView((v) => clamp(v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  const writeUrl = (params: Record<string, string | null>) => {
    const u = new URL(window.location.href);
    for (const [k, v] of Object.entries(params)) {
      if (v) u.searchParams.set(k, v);
      else u.searchParams.delete(k);
    }
    history.replaceState(null, '', u);
  };

  const pick = useCallback(
    (id: string) => {
      const isl = byId.get(id);
      if (!isl) return;
      setSelected(id);
      setRegion(null);
      setTouched(true);
      writeUrl({ ostrov: id, kraj: null });
      const group = [isl, ...isl.kin.map((k) => byId.get(k.id)!).filter(Boolean)];
      const x0 = Math.min(...group.map((g) => g.x - g.r * 1.4));
      const x1 = Math.max(...group.map((g) => g.x + g.r * 1.4));
      const y0 = Math.min(...group.map((g) => g.y - g.r * 1.4));
      const y1 = Math.max(...group.map((g) => g.y + g.r * 1.4 + 24));
      // pohled se počítá s kartou ostrova (viewFor ji zohlední až po vykreslení), proto výpočet zde
      const panelPx = !narrow ? 380 : 0;
      const sheetPx = narrow ? size.h * 0.46 : 0;
      const pad = 60;
      const availW = Math.max(200, size.w - panelPx);
      const availH = Math.max(160, size.h - sheetPx);
      const minW = narrow ? 420 : 620;
      const upp = Math.max((x1 - x0 + 2 * pad) / availW, (y1 - y0 + 2 * pad) / availH, minW / size.w);
      const w = upp * size.w;
      const cx = (x0 + x1) / 2 + (panelPx * upp) / 2;
      const cy = (y0 + y1) / 2 + (sheetPx * upp) / 2;
      flyTo({ x: cx - w / 2, y: cy - (w * aspect) / 2, w });
    },
    [byId, narrow, size, aspect, flyTo],
  );

  const deselect = useCallback(() => {
    setSelected(null);
    writeUrl({ ostrov: null });
  }, []);

  const focusRegion = useCallback(
    (id: string | null) => {
      setSelected(null);
      setRegion(id);
      setTouched(true);
      writeUrl({ kraj: id, ostrov: null });
      if (!id) {
        flyTo(fitAll());
        return;
      }
      const group = islands.filter((i) => i.chapterId === id);
      const reg = regionById.get(id)!;
      const xs = [...group.map((g) => g.x - g.r * 1.4), ...group.map((g) => g.x + g.r * 1.4), reg.x - 120, reg.x + 120];
      const ys = [...group.map((g) => g.y - g.r * 1.4), ...group.map((g) => g.y + g.r * 1.4 + 24), reg.y - 20, reg.y + 20];
      const panelPx = 0;
      const pad = 50;
      const upp = Math.max((Math.max(...xs) - Math.min(...xs) + 2 * pad) / (size.w - panelPx), (Math.max(...ys) - Math.min(...ys) + 2 * pad) / size.h);
      const w = Math.max(MIN_W, upp * size.w);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      flyTo({ x: cx - w / 2, y: cy - (w * aspect) / 2, w });
    },
    [islands, regionById, size, aspect, flyTo, fitAll],
  );

  /* ---------- přiblížení a posun ---------- */
  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      stopAnim();
      setTouched(true);
      setView((v) => {
        const ux = v.x + (px / size.w) * v.w;
        const uy = v.y + (py / size.h) * v.w * aspect;
        const w = Math.min(fitAll().w * 1.05, Math.max(MIN_W, v.w / factor));
        return clamp({ x: ux - (px / size.w) * w, y: uy - (py / size.h) * w * aspect, w });
      });
    },
    [size, aspect, clamp, fitAll],
  );

  const panBy = useCallback(
    (dxPx: number, dyPx: number) => {
      stopAnim();
      setView((v) => {
        const upp = v.w / size.w;
        return clamp({ x: v.x - dxPx * upp, y: v.y - dyPx * upp, w: v.w });
      });
    },
    [size, clamp],
  );

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const r = el.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const lineScale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dy = e.deltaY * lineScale;
      const dx = e.deltaX * lineScale;
      // Kolečko myši a sevření prstů na touchpadu přibližují, dva prsty na touchpadu posouvají.
      const mouseLike = e.ctrlKey || (dx === 0 && Math.abs(dy) >= 50 && Number.isInteger(e.deltaY));
      // Na celé mapě se kolečkem dolů (a posunem touchpadu) posouvá stránka, ne mapa: mapa není past.
      const atOverview = viewRef.current.w >= fitAllRef.current().w * 0.98;
      if (atOverview && !e.ctrlKey && (mouseLike ? dy > 0 : Math.abs(dy) > Math.abs(dx))) return;
      e.preventDefault();
      if (mouseLike) zoomAt(Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)), px, py);
      else panBy(-dx, -dy);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt, panBy]);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: number; pinch: number | null; downOn: string | null }>({ moved: 0, pinch: null, downOn: null });
  const lastTap = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    stopAnim();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const islandEl = (e.target as Element).closest('[data-island]');
    gesture.current = {
      moved: pointers.current.size > 1 ? 99 : 0,
      pinch: null,
      downOn: pointers.current.size === 1 ? islandEl?.getAttribute('data-island') ?? null : null,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    if (pointers.current.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      gesture.current.moved += Math.abs(dx) + Math.abs(dy);
      if (gesture.current.moved > 5) {
        setTouched(true);
        panBy(dx, dy);
      }
      pointers.current.set(e.pointerId, cur);
    } else if (pointers.current.size === 2) {
      pointers.current.set(e.pointerId, cur);
      const [a, b] = [...pointers.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const r = svgRef.current!.getBoundingClientRect();
      const mx = (a.x + b.x) / 2 - r.left;
      const my = (a.y + b.y) / 2 - r.top;
      if (gesture.current.pinch) {
        zoomAt(d / gesture.current.pinch, mx, my);
        // posun středem sevření
        const pm = (prev.x - cur.x) / 2;
        const pn = (prev.y - cur.y) / 2;
        panBy(-pm, -pn);
      }
      gesture.current.pinch = d;
    }
  };

  const onPointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const was = pointers.current.size;
    pointers.current.delete(e.pointerId);
    if (was === 1 && gesture.current.moved <= 5) {
      const id = gesture.current.downOn;
      const now = performance.now();
      if (id) pick(id);
      else if (now - lastTap.current < 320) {
        const r = svgRef.current!.getBoundingClientRect();
        zoomAt(1.8, e.clientX - r.left, e.clientY - r.top);
      } else if (selected) deselect();
      lastTap.current = now;
    }
    if (pointers.current.size < 2) gesture.current.pinch = null;
  };

  const onKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = 80;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT') return;
    if (e.key === 'ArrowLeft') panBy(step, 0);
    else if (e.key === 'ArrowRight') panBy(-step, 0);
    else if (e.key === 'ArrowUp') panBy(0, step);
    else if (e.key === 'ArrowDown') panBy(0, -step);
    else if (e.key === '+' || e.key === '=') zoomAt(1.4, size.w / 2, size.h / 2);
    else if (e.key === '-' || e.key === '_') zoomAt(1 / 1.4, size.w / 2, size.h / 2);
    else if (e.key === '0') focusRegion(null);
    else if (e.key === 'Escape') {
      if (selected) deselect();
      else if (region) focusRegion(null);
      else return;
    } else return;
    e.preventDefault();
  };

  /* ---------- odvozené vrstvy ---------- */
  const sel = selected ? byId.get(selected) ?? null : null;
  const focusIds = useMemo(() => {
    if (sel) return new Set([sel.id, ...sel.kin.map((k) => k.id)]);
    if (region) return new Set(islands.filter((i) => i.chapterId === region).map((i) => i.id));
    return null;
  }, [sel, region, islands]);

  const upp = view.w / size.w; // jednotek mapy na pixel
  const nameSize = NAME_PX * upp;

  // Jména bez překryvů: hladový výběr podle priority.
  const names = useMemo(() => {
    const order = [...islands].sort((a, b) => {
      const pr = (i: Island) =>
        (i.id === selected ? 1000 : 0) +
        (i.id === hovered ? 900 : 0) +
        (sel?.kin.some((k) => k.id === i.id) ? 500 : 0) +
        (focusIds?.has(i.id) ? 200 : 0) +
        (i.iconic ? 100 : 0) +
        i.r;
      return pr(b) - pr(a);
    });
    const boxes: Array<[number, number, number, number]> = [];
    const regionBoxes = regions.map((r) => {
      const lines = locale === 'cs' ? r.linesCs : r.linesEn;
      const w = Math.max(...lines.map((l) => l.length)) * REGION_FONT * (0.72 + REGION_TRACK);
      const h = lines.length * REGION_FONT * 1.25;
      return [r.x - w / 2, r.y - h / 2, r.x + w / 2, r.y + h / 2] as [number, number, number, number];
    });
    const out: Array<{ i: Island; x: number; y: number; strong: boolean }> = [];
    const visible = (x: number, y: number) => x > view.x - 40 && x < view.x + view.w + 40 && y > view.y - 40 && y < view.y + view.w * aspect + 40;
    for (const i of order) {
      if (!visible(i.x, i.y)) continue;
      const title = t(i.title, locale);
      const w = title.length * nameSize * 0.5;
      const sh = shapes.get(i.id)!;
      const y = sh.foot + nameSize * 1.25;
      const box: [number, number, number, number] = [i.x - w / 2 - 2 * upp, y - nameSize, i.x + w / 2 + 2 * upp, y + nameSize * 0.3];
      const must = i.id === selected || i.id === hovered;
      const kinOfSel = Boolean(sel?.kin.some((k) => k.id === i.id));
      const hit = (b: [number, number, number, number]) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1];
      if (!must && (boxes.some(hit) || (!kinOfSel && upp > 0.75 && regionBoxes.some(hit)))) continue;
      // na velmi vzdáleném pohledu (telefon) jen jména, která se dají přečíst kolem velkých ostrovů
      if (!must && i.r / upp < 7) continue;
      boxes.push(box);
      out.push({ i, x: i.x, y, strong: must || Boolean(sel?.kin.some((k) => k.id === i.id)) });
    }
    return out;
  }, [islands, selected, hovered, sel, focusIds, regions, locale, view, aspect, nameSize, upp, shapes]);

  // Loxodromy k nejbližším příbuzným vybraného ostrova.
  const kinLines = useMemo(() => {
    if (!sel) return [];
    return sel.kin
      .map((k) => {
        const o = byId.get(k.id);
        if (!o) return null;
        const dx = o.x - sel.x;
        const dy = o.y - sel.y;
        const d = Math.hypot(dx, dy) || 1;
        const a = sel.r * (sel.arch ? 1.4 : 1.15) + 10;
        const b = o.r * (o.arch ? 1.4 : 1.15) + 10;
        return {
          id: o.id,
          level: k.level,
          x1: sel.x + (dx / d) * a,
          y1: sel.y + (dy / d) * a,
          x2: o.x - (dx / d) * b,
          y2: o.y - (dy / d) * b,
        };
      })
      .filter((l): l is NonNullable<typeof l> => Boolean(l));
  }, [sel, byId]);

  // Stupeň příbuznosti u linky jen tam, kde se vejde (jinak ho nese karta ostrova).
  const kinLabels = useMemo(() => {
    const placed: Array<[number, number, number, number]> = [];
    const nameBoxes = names.map((n) => {
      const w = t(n.i.title, locale).length * nameSize * 0.5;
      return [n.x - w / 2, n.y - nameSize, n.x + w / 2, n.y + nameSize * 0.3] as [number, number, number, number];
    });
    return kinLines.filter((l) => {
      const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) / upp;
      const label = uiT(`compare.kinLevel${l.level}`, locale);
      const w = (label.length * 6.6 + 12) * upp;
      if (len < label.length * 6.6 + 40) return false;
      const mx = (l.x1 + l.x2) / 2;
      const my = (l.y1 + l.y2) / 2;
      const box: [number, number, number, number] = [mx - w / 2, my - 7 * upp, mx + w / 2, my + 7 * upp];
      const hit = (b: [number, number, number, number]) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1];
      if (placed.some(hit) || nameBoxes.some(hit)) return false;
      placed.push(box);
      return true;
    });
  }, [kinLines, names, nameSize, upp, locale]);

  const matches = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return [];
    return islands
      .filter((i) => fold(t(i.title, locale)).includes(q) || fold(i.title.en).includes(q))
      .sort((a, b) => fold(t(a.title, locale)).indexOf(q) - fold(t(b.title, locale)).indexOf(q))
      .slice(0, 7);
  }, [query, islands, locale]);

  const choose = (id: string) => {
    setQuery('');
    setSearchOpen(false);
    pick(id);
    svgRef.current?.focus({ preventScroll: true });
  };

  const regionLabelOpacity = upp < 0.45 ? 0.35 : 1;
  const viewBox = `${view.x.toFixed(2)} ${view.y.toFixed(2)} ${view.w.toFixed(2)} ${(view.w * aspect).toFixed(2)}`;
  const selRegion = sel ? regionById.get(sel.chapterId) : null;
  const total = islands.length;

  return (
    <div className="sc-page">
      <header className="atlas-page__head page-band sc-head">
        <p className="atlas-page__kicker">{locale === 'cs' ? 'Náhled · etapa 1' : 'Preview · stage 1'}</p>
        <h1 className="atlas-page__title display">{locale === 'cs' ? 'Mapa známých světů' : 'Chart of known worlds'}</h1>
        <p className="atlas-page__lead">
          {locale === 'cs'
            ? 'Každý svět je ostrov. Blízcí příbuzní leží u sebe, kraje jsou archetypy, velikost ostrova je prostorový dosah světa.'
            : 'Every world is an island. Close kin lie together, regions are archetypes, the size of an island is the reach of its world.'}
        </p>
      </header>

      <div className="sc-bar">
        <div className="sc-tabs" role="toolbar" aria-label={uiT('filter.chapter', locale)}>
          <button type="button" className={`sc-tab${!region ? ' is-active' : ''}`} onClick={() => focusRegion(null)} aria-pressed={!region}>
            {locale === 'cs' ? 'Celá mapa' : 'Whole chart'}
          </button>
          {regions.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`sc-tab${region === r.id ? ' is-active' : ''}`}
              style={hueStyle(r.light, r.dark)}
              onClick={() => focusRegion(region === r.id ? null : r.id)}
              aria-pressed={region === r.id}
            >
              <span className="sc-tab__dot" aria-hidden="true" />
              {t(r.short ?? r.title, locale)}
            </button>
          ))}
        </div>
        <div className="sc-search">
          <input
            type="search"
            value={query}
            placeholder={locale === 'cs' ? 'Najít svět' : 'Find a world'}
            aria-label={locale === 'cs' ? 'Najít svět na mapě' : 'Find a world on the chart'}
            role="combobox"
            aria-expanded={searchOpen && matches.length > 0}
            aria-controls="sc-search-list"
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matches[0]) {
                e.preventDefault();
                choose(matches[0].id);
              } else if (e.key === 'Escape') {
                setQuery('');
                setSearchOpen(false);
              }
            }}
          />
          {searchOpen && matches.length > 0 ? (
            <ul className="sc-search__list" id="sc-search-list" role="listbox">
              {matches.map((m) => {
                const r = regionById.get(m.chapterId)!;
                return (
                  <li key={m.id} role="option" aria-selected="false">
                    <button type="button" style={hueStyle(r.light, r.dark)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(m.id)}>
                      <span className="sc-tab__dot" aria-hidden="true" />
                      <span>{t(m.title, locale)}</span>
                      <span className="sc-search__arch">{t(r.title, locale)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </div>

      <div className={`sc-frame${narrow ? ' is-narrow' : ''}${sel ? ' has-card' : ''}`} ref={wrapRef} onKeyDown={onKey}>
        <svg
          ref={svgRef}
          className="sc-svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="application"
          aria-label={locale === 'cs' ? `Mapa známých světů: ${total} ostrovů. Šipky posouvají, plus a minus přibližují.` : `Chart of known worlds: ${total} islands.`}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => {
            const r = svgRef.current!.getBoundingClientRect();
            if (!(e.target as Element).closest('[data-island]')) zoomAt(1.8, e.clientX - r.left, e.clientY - r.top);
          }}
        >
          <defs>
            <clipPath id="sc-sea">
              <rect x={38} y={38} width={CHART_W - 76} height={CHART_H - 76} />
            </clipPath>
          </defs>
          <rect className="sc-sea" x={-4000} y={-4000} width={CHART_W + 8000} height={CHART_H + 8000} />
          <rect className="sc-chart" x={0} y={0} width={CHART_W} height={CHART_H} />
          <Rhumbs rose={rose} />
          <Neatline />

          <g className={`sc-regions${focusIds ? ' is-muted' : ''}`} style={{ opacity: regionLabelOpacity }} aria-hidden="true">
            {regions.map((r) => {
              const lines = locale === 'cs' ? r.linesCs : r.linesEn;
              const active = region === r.id || selRegion?.id === r.id;
              return (
                <text
                  key={r.id}
                  className={`sc-region${active ? ' is-active' : ''}`}
                  style={{ ...hueStyle(r.light, r.dark), fontSize: REGION_FONT, letterSpacing: `${REGION_TRACK}em` }}
                  x={r.x}
                  y={r.y - ((lines.length - 1) * REGION_FONT * 1.25) / 2 + REGION_FONT * 0.36}
                >
                  {lines.map((l, k) => (
                    <tspan key={k} x={r.x} dy={k === 0 ? 0 : REGION_FONT * 1.25}>
                      {l}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </g>

          <Rose at={rose} />

          <text className="sc-empty" x={empty[0]} y={empty[1]} aria-hidden="true">
            {locale === 'cs' ? 'zde budou světy' : 'here be worlds'}
          </text>

          {sel ? (
            <g className="sc-kin" style={styles.get(sel.id)} aria-hidden="true">
              {kinLines.map((l) => (
                <line key={l.id} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          ) : null}

          <Islands
            islands={islands}
            shapes={shapes}
            styles={styles}
            focusIds={focusIds}
            selected={selected}
            hovered={hovered}
            labels={ariaLabels}
            onPick={pick}
            onHover={setHovered}
          />

          <g className="sc-names" aria-hidden="true" style={{ fontSize: nameSize }}>
            {names.map((n) => (
              <text
                key={n.i.id}
                x={n.x}
                y={n.y}
                className={`sc-name${n.strong ? ' is-strong' : ''}${focusIds && !focusIds.has(n.i.id) ? ' is-dim' : ''}`}
                style={{ strokeWidth: 3.2 * upp }}
              >
                {t(n.i.title, locale)}
              </text>
            ))}
          </g>

          {sel ? (
            <g className="sc-kin-labels" aria-hidden="true" style={{ fontSize: 10 * upp }}>
              {kinLabels.map((l) => (
                <text key={l.id} x={(l.x1 + l.x2) / 2} y={(l.y1 + l.y2) / 2 + 3.5 * upp} style={{ strokeWidth: 7 * upp }}>
                  {uiT(`compare.kinLevel${l.level}`, locale)}
                </text>
              ))}
            </g>
          ) : null}

          <g className="sc-cartouche" aria-hidden="true">
            <rect x={64} y={812} width={360} height={130} className="sc-cartouche__box" />
            <rect x={70} y={818} width={348} height={118} className="sc-cartouche__box sc-cartouche__box--in" />
            <text x={244} y={862} className="sc-cartouche__title">
              Here <tspan fontStyle="italic" fontWeight="500">Be</tspan> Worlds
            </text>
            <text x={244} y={890} className="sc-cartouche__sub">
              {locale === 'cs' ? 'Mapa známých světů' : 'Chart of known worlds'}
            </text>
            <text x={244} y={917} className="sc-cartouche__meta">
              {locale === 'cs' ? `${total} SVĚTŮ · STAV K ${stamp}` : `${total} WORLDS · AS OF ${stamp}`}
            </text>
          </g>

          <g className="sc-scale" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((k) => (
              <rect key={k} x={1290 + k * 44} y={904} width={44} height={6} className={k % 2 ? 'sc-scale__light' : 'sc-scale__dark'} />
            ))}
            <text x={1290} y={928} className="sc-scale__lab">
              {locale === 'cs' ? 'BLÍZKO' : 'NEAR'}
            </text>
            <text x={1510} y={928} className="sc-scale__lab" textAnchor="end">
              {locale === 'cs' ? 'DALEKO' : 'FAR'}
            </text>
            <text x={1290} y={892} className="sc-scale__note">
              {locale === 'cs' ? 'Poloha je přibližná, příbuznost ukazují linky.' : 'Positions are approximate; lines show kinship.'}
            </text>
          </g>
        </svg>

        <div className="sc-zoom" role="group" aria-label={locale === 'cs' ? 'Přiblížení' : 'Zoom'}>
          <button type="button" onClick={() => zoomAt(1.5, size.w / 2, size.h / 2)} aria-label={locale === 'cs' ? 'Přiblížit' : 'Zoom in'}>
            +
          </button>
          <button type="button" onClick={() => zoomAt(1 / 1.5, size.w / 2, size.h / 2)} aria-label={locale === 'cs' ? 'Oddálit' : 'Zoom out'}>
            −
          </button>
          <button type="button" onClick={() => focusRegion(null)} aria-label={locale === 'cs' ? 'Celá mapa' : 'Whole chart'} title={locale === 'cs' ? 'Celá mapa' : 'Whole chart'}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        {!touched ? (
          <p className="sc-hint" aria-hidden="true">
            {coarse
              ? locale === 'cs'
                ? 'Táhni prstem · roztáhni dvěma prsty · klepni na ostrov'
                : 'Drag · pinch to zoom · tap an island'
              : locale === 'cs'
                ? 'Táhni pro posun · kolečkem přibližuj · klikni na ostrov'
                : 'Drag to pan · wheel to zoom · click an island'}
          </p>
        ) : null}

        {sel && selRegion ? (
          <aside className="sc-card" style={hueStyle(selRegion.light, selRegion.dark)} aria-live="polite">
            <button type="button" className="sc-card__close" onClick={deselect} aria-label={locale === 'cs' ? 'Zavřít' : 'Close'}>
              ×
            </button>
            <p className="sc-card__kicker">
              {t(selRegion.title, locale)} · {t(sel.genre, locale)}
            </p>
            <h2 className="sc-card__title">{t(sel.title, locale)}</h2>
            <p className="sc-card__core">{t(sel.core, locale)}</p>
            <h3 className="sc-card__h">{locale === 'cs' ? 'Nejbližší příbuzní' : 'Closest kin'}</h3>
            <ul className="sc-card__kin">
              {sel.kin.map((k) => {
                const o = byId.get(k.id);
                if (!o) return null;
                const r = regionById.get(o.chapterId)!;
                return (
                  <li key={k.id} style={hueStyle(r.light, r.dark)}>
                    <button type="button" onClick={() => pick(k.id)}>
                      <span className="sc-tab__dot" aria-hidden="true" />
                      <span className="sc-card__kin-name">{t(o.title, locale)}</span>
                      <span className="sc-card__kin-level">{uiT(`compare.kinLevel${k.level}`, locale)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <a className="sc-card__go" href={withBase(base, `/worlds/${sel.id}/`)}>
              {locale === 'cs' ? 'Prozkoumat svět' : 'Explore the world'} <span aria-hidden="true">→</span>
            </a>
          </aside>
        ) : null}
      </div>

      <section className="sc-list" aria-labelledby="sc-list-title">
        <h2 id="sc-list-title" className="sc-list__title">
          {locale === 'cs' ? 'Ostrovy podle krajů' : 'Islands by region'}
        </h2>
        <div className="sc-list__grid">
          {regions.map((r) => (
            <div key={r.id} className="sc-list__group" style={hueStyle(r.light, r.dark)}>
              <h3>
                {t(r.title, locale)} <span>{r.count}</span>
              </h3>
              <ul>
                {islands
                  .filter((i) => i.chapterId === r.id)
                  .sort((a, b) => t(a.title, locale).localeCompare(t(b.title, locale), 'cs'))
                  .map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => { pick(i.id); wrapRef.current?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); }}>
                        {t(i.title, locale)}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
