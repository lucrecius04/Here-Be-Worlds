/**
 * Mapa známých světů: spočítá polohy ostrovů a zmrazí je do `data/meta/sea-chart.json`.
 *
 *   npm run sea-chart          doplní polohy jen novým světům (ostatní se nepohnou)
 *   npm run sea-chart -- --all přepočítá celou mapu (staré polohy zahodí)
 *
 * Postup (viz analýza „Atlas jako skutečná mapa“):
 * 1. vzdálenosti mezi světy = 100 − index příbuznosti z `compare.ts` (jediný index na webu),
 * 2. klasické MDS do roviny (sever = první světy sci-fi nahoře),
 * 3. kraje (archetypy) se od sebe odsunou, aby mezi nimi bylo moře,
 * 4. silové rozmístění: tah k vlastní poloze v kraji, k nejbližším příbuzným, odpuzování ostrovů,
 *    hranice mapy a volné místo pro kartuši a růžici,
 * 5. výsledek se zaokrouhlí a uloží; nový svět dostane místo u svých příbuzných.
 * Výsledek je deterministický (žádná náhoda bez semínka).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { worlds } from '../src/lib/worlds.ts';
import { affinityPercent, kinshipRanking } from '../src/lib/compare.ts';
import { chapters } from '../src/lib/worlds.ts';
import { CHART_W, CHART_H, islandRadius, isArchipelago, footprint, islandShape, regionLines, regionBox } from '../src/lib/sea-chart.ts';

const OUT = fileURLToPath(new URL('../data/meta/sea-chart.json', import.meta.url));
const all = process.argv.includes('--all');

type Saved = { worlds: Record<string, [number, number]>; regions: Record<string, [number, number]>; rose: [number, number]; empty: [number, number] };
const previous: Saved | null = !all && existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : null;

const W = worlds.filter((w) => !w.draft);
const n = W.length;
const radius = W.map((w) => islandRadius(w.metadata.spatialScope.en));
const arch = W.map((w) => isArchipelago(w.metadata.spatialScope.en));
const foot = W.map((_, i) => footprint(radius[i], arch[i]));

// Místa vyhrazená pro kartuši (vlevo dole) a okraj mapy.
const FRAME = 70;
const CARTOUCHE = { x0: 0, y0: CHART_H - 230, x1: 470, y1: CHART_H };
const LEGEND = { x0: CHART_W - 330, y0: CHART_H - 120, x1: CHART_W, y1: CHART_H };

/* ---------- 1–2: MDS ---------- */
const D = W.map((a) => W.map((b) => (a === b ? 0 : 100 - affinityPercent(a, b))));
function mds2(dist: number[][]): Array<[number, number]> {
  const m = dist.length;
  const sq = dist.map((r) => r.map((x) => x * x));
  const rm = sq.map((r) => r.reduce((s, x) => s + x, 0) / m);
  const gm = rm.reduce((s, x) => s + x, 0) / m;
  const B = sq.map((r, i) => r.map((x, j) => -0.5 * (x - rm[i] - rm[j] + gm)));
  const power = (defl: Array<[number, number[]]>): [number, number[]] => {
    let v = Array.from({ length: m }, (_, i) => Math.sin(i + 1));
    let lam = 0;
    for (let it = 0; it < 800; it += 1) {
      let u = B.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
      for (const [l, e] of defl) {
        const d = e.reduce((s, x, j) => s + x * v[j], 0);
        u = u.map((x, i) => x - l * d * e[i]);
      }
      lam = Math.hypot(...u);
      v = u.map((x) => x / lam);
    }
    return [lam, v];
  };
  const e1 = power([]);
  const e2 = power([e1]);
  return dist.map((_, i) => [e1[1][i] * Math.sqrt(e1[0]), e2[1][i] * Math.sqrt(e2[0])]);
}
let mds = mds2(D);
// Orientace: sci-fi na sever, fantasy na západ (znaménka vlastních vektorů jsou libovolná).
const mean = (ids: string, k: 0 | 1) => {
  const idx = W.map((w, i) => (w.chapterId === ids ? i : -1)).filter((i) => i >= 0);
  return idx.reduce((s, i) => s + mds[i][k], 0) / idx.length;
};
if (mean('fantasy', 0) > 0) mds = mds.map(([x, y]) => [-x, y]);
if (mean('science-fiction', 1) > 0) mds = mds.map(([x, y]) => [x, -y]);

/* ---------- 3: kraje ---------- */
const chapterIds = [...new Set(W.map((w) => w.chapterId))];
const members = (c: string) => W.map((w, i) => (w.chapterId === c ? i : -1)).filter((i) => i >= 0);
const span = { x: [Infinity, -Infinity], y: [Infinity, -Infinity] };
for (const [x, y] of mds) {
  span.x = [Math.min(span.x[0], x), Math.max(span.x[1], x)];
  span.y = [Math.min(span.y[0], y), Math.max(span.y[1], y)];
}
const inner = { x0: FRAME + 70, x1: CHART_W - FRAME - 70, y0: FRAME + 60, y1: CHART_H - FRAME - 60 };
const sx = (inner.x1 - inner.x0) / (span.x[1] - span.x[0]);
const sy = (inner.y1 - inner.y0) / (span.y[1] - span.y[0]);
const toChart = ([x, y]: [number, number]): [number, number] => [
  inner.x0 + (x - span.x[0]) * sx,
  inner.y0 + (y - span.y[0]) * sy,
];
const base = mds.map(toChart);

type Region = { id: string; idx: number[]; c: [number, number]; size: number };
const regions: Region[] = chapterIds.map((id) => {
  const idx = members(id);
  const c: [number, number] = [idx.reduce((s, i) => s + base[i][0], 0) / idx.length, idx.reduce((s, i) => s + base[i][1], 0) / idx.length];
  const area = idx.reduce((s, i) => s + Math.PI * foot[i] ** 2, 0);
  return { id, idx, c, size: Math.sqrt(area / Math.PI) * 2.1 };
});
// Kraje se od sebe odsunou (moře mezi nimi), ale drží se svého místa.
const anchor = regions.map((r) => [...r.c] as [number, number]);
for (let it = 0; it < 400; it += 1) {
  regions.forEach((a, i) => {
    let fx = (anchor[i][0] - a.c[0]) * 0.02;
    let fy = (anchor[i][1] - a.c[1]) * 0.02;
    regions.forEach((b, j) => {
      if (i === j) return;
      const dx = a.c[0] - b.c[0];
      const dy = a.c[1] - b.c[1];
      const d = Math.hypot(dx, dy) || 1;
      const want = (a.size + b.size) * 0.62;
      if (d < want) {
        fx += (dx / d) * (want - d) * 0.08;
        fy += (dy / d) * (want - d) * 0.08;
      }
    });
    a.c = [a.c[0] + fx, a.c[1] + fy];
  });
}

/* ---------- 4: silové rozmístění ---------- */
const regionOf = W.map((w) => regions.find((r) => r.id === w.chapterId)!);
// Cíl každého světa: jeho poloha v kraji (stažená k novému středu kraje), smíšená se surovou polohou.
const target = W.map((_, i) => {
  const r = regionOf[i];
  const rc = anchor[regions.indexOf(r)];
  const local: [number, number] = [r.c[0] + (base[i][0] - rc[0]) * 0.62, r.c[1] + (base[i][1] - rc[1]) * 0.62];
  return [local[0] * 0.8 + base[i][0] * 0.2, local[1] * 0.8 + base[i][1] * 0.2] as [number, number];
});
const kin = W.map((w) => kinshipRanking(w, W, 3).map((k) => ({ j: W.indexOf(k.world), level: k.level })));

const fixed = W.map((w) => Boolean(previous?.worlds[w.id]));
const pos: Array<[number, number]> = W.map((w, i) => (previous?.worlds[w.id] ? [...previous.worlds[w.id]] as [number, number] : [...target[i]] as [number, number]));
// Nový svět začne u těžiště svých příbuzných, kteří už na mapě jsou.
W.forEach((w, i) => {
  if (fixed[i] || !previous) return;
  const placed = kin[i].filter((k) => fixed[k.j]);
  if (placed.length) {
    pos[i] = [placed.reduce((s, k) => s + pos[k.j][0], 0) / placed.length + 30, placed.reduce((s, k) => s + pos[k.j][1], 0) / placed.length + 30];
  }
});

const clampOut = (i: number) => {
  const f = foot[i];
  pos[i][0] = Math.min(CHART_W - FRAME - f - 20, Math.max(FRAME + f + 20, pos[i][0]));
  pos[i][1] = Math.min(CHART_H - FRAME - f - 24, Math.max(FRAME + f + 20, pos[i][1]));
  for (const z of [CARTOUCHE, LEGEND]) {
    const nx = Math.max(z.x0, Math.min(z.x1, pos[i][0]));
    const ny = Math.max(z.y0, Math.min(z.y1, pos[i][1]));
    const d = Math.hypot(pos[i][0] - nx, pos[i][1] - ny);
    if (d < f + 16) {
      // vytlačit nahoru nebo do strany, podle toho, co je blíž
      const up = pos[i][1] - (z.y0 - f - 16);
      const side = z.x0 === 0 ? z.x1 + f + 16 - pos[i][0] : pos[i][0] - (z.x0 - f - 16);
      if (up < side) pos[i][1] = z.y0 - f - 16;
      else pos[i][0] = z.x0 === 0 ? z.x1 + f + 16 : z.x0 - f - 16;
    }
  }
};

const GAP = 22;
for (let it = 0; it < 1400; it += 1) {
  const cool = 1 - it / 1600;
  const force = pos.map(() => [0, 0]);
  for (let i = 0; i < n; i += 1) {
    if (fixed[i]) continue;
    force[i][0] += (target[i][0] - pos[i][0]) * 0.012;
    force[i][1] += (target[i][1] - pos[i][1]) * 0.012;
    for (const k of kin[i]) {
      const dx = pos[k.j][0] - pos[i][0];
      const dy = pos[k.j][1] - pos[i][1];
      const d = Math.hypot(dx, dy) || 1;
      const rest = foot[i] + foot[k.j] + GAP + 40;
      if (d > rest) {
        const w = 0.0016 * (k.level - 1);
        force[i][0] += dx * w;
        force[i][1] += dy * w;
      }
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dx = pos[i][0] - pos[j][0];
      const dy = (pos[i][1] - pos[j][1]) * 1.15; // jména jsou pod ostrovy, svisle víc místa
      const d = Math.hypot(dx, dy) || 0.01;
      const want = foot[i] + foot[j] + GAP + (W[i].chapterId === W[j].chapterId ? 0 : 26);
      if (d < want) {
        const push = (want - d) * 0.35;
        const ux = dx / d;
        const uy = dy / d;
        const share = fixed[i] ? 0 : fixed[j] ? 1 : 0.5;
        const share2 = fixed[j] ? 0 : fixed[i] ? 1 : 0.5;
        force[i][0] += ux * push * share * 2;
        force[i][1] += uy * push * share * 2;
        force[j][0] -= ux * push * share2 * 2;
        force[j][1] -= uy * push * share2 * 2;
      }
    }
  }
  for (let i = 0; i < n; i += 1) {
    if (fixed[i]) continue;
    pos[i][0] += Math.max(-12, Math.min(12, force[i][0])) * cool;
    pos[i][1] += Math.max(-12, Math.min(12, force[i][1])) * cool;
    clampOut(i);
  }
}


/* ---------- 4b: mapa vyplní plochu (jen při přepočtu celé mapy) ---------- */
if (!previous) {
  const fx = { x0: FRAME + 60, x1: CHART_W - FRAME - 60, y0: FRAME + 46, y1: CHART_H - FRAME - 64 };
  const bx = [Math.min(...pos.map((p, i) => p[0] - foot[i])), Math.max(...pos.map((p, i) => p[0] + foot[i]))];
  const by = [Math.min(...pos.map((p, i) => p[1] - foot[i])), Math.max(...pos.map((p, i) => p[1] + foot[i]))];
  pos.forEach((p, i) => {
    const ux = (p[0] - foot[i] - bx[0]) / (bx[1] - bx[0] - 2 * foot[i] || 1);
    const uy = (p[1] - foot[i] - by[0]) / (by[1] - by[0] - 2 * foot[i] || 1);
    p[0] = fx.x0 + foot[i] + Math.max(0, Math.min(1, ux)) * (fx.x1 - fx.x0 - 2 * foot[i]);
    p[1] = fx.y0 + foot[i] + Math.max(0, Math.min(1, uy)) * (fx.y1 - fx.y0 - 2 * foot[i]);
  });
  // Krátké dorovnání: nic se nepřekrývá, nic neleží v kartuši.
  for (let it = 0; it < 400; it += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = pos[i][0] - pos[j][0];
        const dy = (pos[i][1] - pos[j][1]) * 1.15;
        const d = Math.hypot(dx, dy) || 0.01;
        const want = foot[i] + foot[j] + GAP + (W[i].chapterId === W[j].chapterId ? 0 : 26);
        if (d < want) {
          const push = (want - d) * 0.25;
          pos[i][0] += (dx / d) * push;
          pos[i][1] += (dy / d) * push;
          pos[j][0] -= (dx / d) * push;
          pos[j][1] -= (dy / d) * push;
        }
      }
    }
    for (let i = 0; i < n; i += 1) clampOut(i);
  }
}

/* ---------- 5: popisky krajů, růžice, prázdné moře ---------- */
const clearance = (x: number, y: number) => {
  let m = Infinity;
  W.forEach((_, i) => {
    m = Math.min(m, Math.hypot(x - pos[i][0], (y - pos[i][1]) * 1.4) - foot[i]);
  });
  return m;
};
const inZone = (x: number, y: number, pad: number) =>
  [CARTOUCHE, LEGEND].some((z) => x > z.x0 - pad && x < z.x1 + pad && y > z.y0 - pad && y < z.y1 + pad);

// Překážky: ostrovy (kruh) a jejich jména (obdélník pod ostrovem).
const obstacles = W.map((w, i) => {
  const sh = islandShape(w.id, pos[i][0], pos[i][1], radius[i], arch[i]);
  const name = String((w.gameTitle as { cs?: string; en: string }).cs ?? (w.gameTitle as { en: string }).en);
  const nw = name.length * 7.2;
  return { x: pos[i][0], y: pos[i][1], r: radius[i] * (arch[i] ? 1.35 : 1.1) + 10, nx0: pos[i][0] - nw / 2 - 6, nx1: pos[i][0] + nw / 2 + 6, ny0: sh.foot + 4, ny1: sh.foot + 28 };
});
const rectFree = (x0: number, y0: number, x1: number, y1: number) =>
  obstacles.every((o) => {
    const cx = Math.max(x0, Math.min(x1, o.x));
    const cy = Math.max(y0, Math.min(y1, o.y));
    if (Math.hypot(o.x - cx, o.y - cy) < o.r) return false;
    return o.nx1 < x0 || o.nx0 > x1 || o.ny1 < y0 || o.ny0 > y1;
  }) &&
  ![CARTOUCHE, LEGEND].some((z) => x0 < z.x1 + 20 && x1 > z.x0 - 20 && y0 < z.y1 + 20 && y1 > z.y0 - 20) &&
  x0 > FRAME + 20 && x1 < CHART_W - FRAME - 20 && y0 > FRAME + 16 && y1 < CHART_H - FRAME - 16;

const regionLabels: Record<string, [number, number]> = {};
const placedBoxes: Array<[number, number, number, number]> = [];
for (const r of [...regions].sort((a, b) => b.idx.length - a.idx.length)) {
  const ch = chapters.find((c) => c.id === r.id) as { short?: { cs?: string }; title: { cs?: string; en: string } };
  const lines = regionLines(ch.short?.cs ?? ch.title.cs ?? ch.title.en);
  const box = regionBox(lines);
  const idx = r.idx;
  const c: [number, number] = [idx.reduce((s, i) => s + pos[i][0], 0) / idx.length, idx.reduce((s, i) => s + pos[i][1], 0) / idx.length];
  let best: [number, number] = c;
  let score = -Infinity;
  for (let x = FRAME + 40; x <= CHART_W - FRAME - 40; x += 6) {
    for (let y = FRAME + 30; y <= CHART_H - FRAME - 30; y += 6) {
      const x0 = x - box.w / 2;
      const x1 = x + box.w / 2;
      const y0 = y - box.h / 2;
      const y1 = y + box.h / 2;
      if (!rectFree(x0, y0, x1, y1)) continue;
      if (placedBoxes.some(([a0, b0, a1, b1]) => x0 < a1 + 30 && x1 > a0 - 30 && y0 < b1 + 20 && y1 > b0 - 20)) continue;
      // Blízko vlastních ostrovů (k nejbližšímu i k těžišti), daleko od cizích.
      const own = Math.min(...idx.map((i) => Math.hypot(x - pos[i][0], y - pos[i][1])));
      const other = Math.min(...W.map((w, i) => (w.chapterId === r.id ? Infinity : Math.hypot(x - pos[i][0], y - pos[i][1]))));
      const dc = Math.hypot(x - c[0], y - c[1]);
      const sc = -dc * 0.6 - own * 0.8 + Math.min(other, 260) * 0.7;
      if (sc > score) {
        score = sc;
        best = [x, y];
      }
    }
  }
  regionLabels[r.id] = best;
  placedBoxes.push([best[0] - box.w / 2, best[1] - box.h / 2, best[0] + box.w / 2, best[1] + box.h / 2]);
}

const pickEmpty = (avoid: Array<[number, number]>, minFromAvoid: number): [number, number] => {
  let best: [number, number] = [CHART_W / 2, CHART_H / 2];
  let score = -Infinity;
  for (let x = FRAME + 110; x <= CHART_W - FRAME - 110; x += 10) {
    for (let y = FRAME + 110; y <= CHART_H - FRAME - 110; y += 10) {
      if (inZone(x, y, 110)) continue;
      if (avoid.some(([ax, ay]) => Math.hypot(ax - x, ay - y) < minFromAvoid)) continue;
      if (placedBoxes.some(([a0, b0, a1, b1]) => x > a0 - 100 && x < a1 + 100 && y > b0 - 100 && y < b1 + 100)) continue;
      const s = clearance(x, y);
      if (s > score) {
        score = s;
        best = [x, y];
      }
    }
  }
  return best;
};
const rose = previous?.rose ?? pickEmpty([], 0);
const empty = previous?.empty ?? pickEmpty([rose], 260);

const round = (v: number) => Math.round(v);
const out: Saved = {
  worlds: Object.fromEntries(W.map((w, i) => [w.id, [round(pos[i][0]), round(pos[i][1])]])),
  regions: Object.fromEntries(Object.entries(regionLabels).map(([k, v]) => [k, [round(v[0]), round(v[1])]])),
  rose: [round(rose[0]), round(rose[1])],
  empty: [round(empty[0]), round(empty[1])],
};
if (previous) {
  // Ruční posuny a světy, které zrovna nejsou publikované, zůstanou.
  for (const [id, p] of Object.entries(previous.worlds)) if (!out.worlds[id]) out.worlds[id] = p;
  for (const [id, p] of Object.entries(previous.regions ?? {})) out.regions[id] = p;
}
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      _note: 'Mapa známých světů: zmražené polohy ostrovů (scripts/sea-chart.ts). Jednotky mapy 1600 × 1000. Ruční posun = přepsat čísla; nový svět doplní `npm run sea-chart`.',
      ...out,
    },
    null,
    1,
  ).replace(/\[\n\s+(-?\d+),\n\s+(-?\d+)\n\s+\]/g, '[$1, $2]')}\n`,
);
const newcomers = W.filter((_, i) => !fixed[i]).length;
console.log(`sea-chart: ${n} ostrovů, ${previous ? `nově umístěno ${newcomers}` : 'přepočítáno vše'} → data/meta/sea-chart.json`);
