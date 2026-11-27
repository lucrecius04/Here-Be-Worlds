/**
 * Mapa známých světů (náhled): tvar a velikost ostrovů, hloubky moře, mlha, přístavy a plavby.
 *
 * Každý svět je ostrov. Poloha je zmražená v `data/meta/sea-chart.json` (skript `scripts/sea-chart.ts`),
 * tvar pobřeží se generuje z id světa (šum s pevným semínkem), takže je pořád stejný a nic nekóduje.
 * Velikost ostrova nese prostorový dosah světa; svět o více rovinách je souostroví.
 * Etapa 2: linky hloubky kolem pobřeží = paměť světa (jedna linka za každý řád let), tečkovaná linka
 * = mýtický čas, mlha na severní straně = hlavní tajemství (hustota podle toho, kdo mezeru drží),
 * kotva = putování, které světem prochází, zlatá trasa = plavba po putování.
 * Soubor nesahá na data atlasu, takže ho smí načíst i prohlížeč.
 */

export const CHART_W = 1600;
export const CHART_H = 1000;

/** Poloměr ostrova (jednotky mapy) podle prostorového dosahu (`metadata.spatialScope.en`). */
const SCOPE_RADIUS: Record<string, number> = {
  Location: 13,
  City: 17,
  Region: 22,
  Continent: 28,
  World: 31,
  'Star system': 34,
  Galaxy: 38,
  'Multiverse and planes': 35,
};

/** Normalizace anglického dosahu (data mají různé zápisy). */
export function scopeKey(scopeEn: string): string {
  const s = scopeEn.toLowerCase();
  if (s.includes('multiver') || s.includes('planes')) return 'Multiverse and planes';
  if (s.includes('galax')) return 'Galaxy';
  if (s.includes('star')) return 'Star system';
  if (s.includes('contin')) return 'Continent';
  if (s.includes('region')) return 'Region';
  if (s.includes('city') || s.includes('town')) return 'City';
  if (s.includes('locat') || s.includes('site') || s.includes('local')) return 'Location';
  if (s.includes('world') || s.includes('planet')) return 'World';
  return 'Region';
}

export function islandRadius(scopeEn: string): number {
  return SCOPE_RADIUS[scopeKey(scopeEn)] ?? 22;
}

export function isArchipelago(scopeEn: string): boolean {
  return scopeKey(scopeEn) === 'Multiverse and planes';
}

/** Generátor se semínkem (stejný jako obloha v `sky.ts`). */
export function seededRandom(seedText: string) {
  let seed = 2166136261;
  for (const ch of seedText) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Harmonic = { k: number; a: number; p: number };
type Pt = [number, number];

/** Radiální profil jednoho kusu země: součet harmonických s náhodnou fází, protažení a natočení. */
function profile(seed: string, rough = 1) {
  const rand = seededRandom(seed);
  const harm: Harmonic[] = [];
  // Hrubý tvar: nesouměrný, s jedním nebo dvěma zálivy a mysy.
  for (let k = 2; k <= 5; k += 1) harm.push({ k, a: (0.24 / k ** 0.7) * (0.45 + rand() * 1.0), p: rand() * Math.PI * 2 });
  // Členitost pobřeží: menší vlny a jemná drsnost jako u ryté mapy.
  for (let k = 7; k <= 11; k += 2) harm.push({ k, a: 0.035 * rough * (0.4 + rand()), p: rand() * Math.PI * 2 });
  for (let k = 15; k <= 27; k += 4) harm.push({ k, a: 0.012 * rough * (0.5 + rand()), p: rand() * Math.PI * 2 });
  const stretch = 0.8 + rand() * 0.45;
  const turn = rand() * Math.PI;
  return { harm, stretch, turn };
}

/** Body pobřeží kolem středu (cx, cy), `grow` = odsazení do moře (water-lining). */
function ring(cx: number, cy: number, r: number, prof: ReturnType<typeof profile>, grow: number, n = 96) {
  const pts: Array<[number, number]> = [];
  const { harm, stretch, turn } = prof;
  for (let i = 0; i < n; i += 1) {
    const t = (i / n) * Math.PI * 2;
    let f = 1;
    let soft = 1;
    for (const h of harm) {
      const wave = h.a * Math.sin(h.k * t + h.p);
      f += wave;
      // čím dál od břehu, tím méně linka kopíruje drobné zálivy (jako izobáty na ryté mapě)
      soft += wave * Math.exp((-grow / r) * h.k * 0.5);
    }
    const rr = grow > 0 ? r * Math.max(0.42, soft) + grow * (0.9 + 0.1 * soft) : r * Math.max(0.42, f);
    const x = Math.cos(t) * rr * stretch;
    const y = Math.sin(t) * rr / stretch;
    pts.push([cx + x * Math.cos(turn) - y * Math.sin(turn), cy + x * Math.sin(turn) + y * Math.cos(turn)]);
  }
  return pts;
}

/** Uzavřená hladká křivka (Catmull-Rom → kubické Bézierovy) přes body. */
function smoothPath(pts: Array<[number, number]>): string {
  const n = pts.length;
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d}Z`;
}

/** Kolik linek hloubky má ostrov: počet číslic paměti světa v letech (78 let = 2, 10 000 let = 5, miliarda = 10). */
export function depthLines(years: number | null | undefined): number {
  if (!years || years <= 0) return 0;
  if (years < 1) return 1;
  return Math.min(10, Math.floor(Math.log10(years)) + 1);
}

/** Odsazení k-té linky hloubky od pobřeží (jednotky mapy). */
export const depthOffset = (k: number) => 3 + 2.5 * k;
/** Jak daleko od pobřeží sahá kresba moře kolem ostrova (linky hloubky a mýtická linka). */
export const depthReach = (lines: number, myth: boolean) => (lines ? depthOffset(lines - 1) : 0) + (myth ? 4 : 0);

export type FogLevel = 'dense' | 'thinning' | 'wisps';

export type IslandShape = {
  /** Pobřeží (jeden nebo víc kusů země). */
  coast: string;
  /** Linky hloubky kolem pobřeží, od nejbližší po nejvzdálenější (paměť světa). */
  depths: string[];
  /** Tečkovaná linka za poslední linkou hloubky (mýtický čas), nebo null. */
  myth: string | null;
  /** Mlha (hlavní tajemství), nebo null. */
  fog: FogBank | null;
  /** Nejnižší bod ostrova pod středem (kam patří jméno). */
  foot: number;
};

type Piece = { x: number; y: number; r: number; seed: string };

function pieces(id: string, cx: number, cy: number, r: number, archipelago: boolean): Piece[] {
  if (!archipelago) return [{ x: cx, y: cy, r, seed: id }];
  const out: Piece[] = [];
  const rand = seededRandom(`${id}:souostrovi`);
  out.push({ x: cx, y: cy, r: r * 0.52, seed: `${id}:0` });
  const count = 4;
  const start = rand() * Math.PI * 2;
  for (let k = 0; k < count; k += 1) {
    const ang = start + (k / count) * Math.PI * 2 + (rand() - 0.5) * 0.7;
    const dist = r * (0.95 + rand() * 0.3);
    out.push({ x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist * 0.8, r: r * (0.2 + rand() * 0.16), seed: `${id}:${k + 1}` });
  }
  return out;
}

const rough = (p: Piece) => (p.r < 12 ? 0.6 : 1);

/** Bod u pobřeží jednoho kusu země ve směru `angle`, `grow` = jak daleko od břehu do moře. */
function shorePoint(piece: Piece, angle: number, grow = 0): [number, number] {
  const pts = ring(piece.x, piece.y, piece.r, profile(piece.seed, rough(piece)), grow, 180);
  let best = pts[0];
  let bestDiff = Infinity;
  for (const p of pts) {
    let d = Math.atan2(p[1] - piece.y, p[0] - piece.x) - angle;
    d = Math.abs(Math.atan2(Math.sin(d), Math.cos(d)));
    if (d < bestDiff) {
      bestDiff = d;
      best = p;
    }
  }
  return best;
}

/**
 * Bod u pobřeží ostrova ve směru `angle` (radiány, 0 = východ, kladně po směru hodin na obrazovce).
 * U souostroví se bere ostrůvek, který v tom směru leží nejdál, takže bod je vždy na vnějším břehu skupiny.
 */
export function coastPoint(id: string, cx: number, cy: number, r: number, archipelago: boolean, angle: number, grow = 0): [number, number] {
  const land = pieces(id, cx, cy, r, archipelago);
  let piece = land[0];
  if (archipelago) {
    const reach = (p: Piece) => (p.x - cx) * Math.cos(angle) + (p.y - cy) * Math.sin(angle) + p.r;
    for (const p of land) if (reach(p) > reach(piece)) piece = p;
  }
  return shorePoint(piece, angle, grow);
}

export type FogBank = {
  /** Střed a poloosy závoje (bílé místo, pod kterým pobřeží i země mizí). */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Nezmapovaný úsek pobřeží pod závojem (kreslí se tečkovaně, jako na starých mapách). */
  shore: string;
};

/** Jak velký kus pobřeží mlha zakryje (polovina úhlu v radiánech). */
const FOG_HALF: Record<FogLevel, number> = { dense: 0.95, thinning: 0.6, wisps: 0.32 };

/**
 * Mlha = nezmapované místo na severu ostrova (jméno je na jihu). Závoj v barvě papíru nechá kus země
 * zmizet a pobřeží pod ním pokračuje jen tečkovaně, jako neprozkoumaný břeh na starých mapách. `dense` zakryje skoro třetinu
 * pobřeží, `thinning` pětinu, `wisps` jen krátký úsek.
 */
function fogBank(id: string, cx: number, cy: number, r: number, archipelago: boolean, level: FogLevel): FogBank {
  const rand = seededRandom(`${id}:mlha`);
  const main = pieces(id, cx, cy, r, archipelago)[0];
  const prof = profile(main.seed, rough(main));
  const angle = -Math.PI / 2 + (rand() - 0.5) * 1.3; // sever, nejvýš 37° do stran
  const half = FOG_HALF[level];
  const all = ring(main.x, main.y, main.r, prof, 0, 180);
  const off = (p: [number, number]) => {
    const d = Math.atan2(p[1] - main.y, p[0] - main.x) - angle;
    return Math.atan2(Math.sin(d), Math.cos(d));
  };
  const arc = all.filter((p) => Math.abs(off(p)) <= half).sort((p, q) => off(p) - off(q));
  const [sx, sy] = shorePoint(main, angle, 0);
  // závoj musí pokrýt celý nezmapovaný úsek
  const span = Math.max(...arc.map((p) => Math.hypot(p[0] - sx, p[1] - sy)), 5);
  const rx = span * 1.22 + 2.5;
  const ry = rx * 0.78;
  const f = (v: number) => Math.round(v * 10) / 10;
  return { cx: f(sx), cy: f(sy), rx: f(rx), ry: f(ry), shore: openPath(arc.filter((_, k) => k % 2 === 0)) };
}

export type IslandOptions = { depth?: number; myth?: boolean; fog?: FogLevel | null };

export function islandShape(id: string, cx: number, cy: number, r: number, archipelago: boolean, opts: IslandOptions = {}): IslandShape {
  const land = pieces(id, cx, cy, r, archipelago);
  const profs = land.map((p) => profile(p.seed, rough(p)));
  const scale = (p: Piece) => (p.r < 12 ? 0.75 : 1);
  const line = (grow: number, n = 64) => land.map((p, i) => smoothPath(ring(p.x, p.y, p.r, profs[i], grow * scale(p), n))).join('');
  const coast = land.map((p, i) => smoothPath(ring(p.x, p.y, p.r, profs[i], 0, p.r < 12 ? 56 : 84))).join('');
  const lines = opts.depth ?? 0;
  // vzdálenější linky jsou hladší, stačí jim méně bodů (menší stránka)
  const depths = Array.from({ length: lines }, (_, k) => line(depthOffset(k), k < 2 ? 52 : k < 5 ? 40 : 30));
  const myth = opts.myth ? line((lines ? depthOffset(lines - 1) : 0) + 4, 44) : null;
  let foot = cy;
  land.forEach((p, i) => {
    for (const [x, y] of ring(p.x, p.y, p.r, profs[i], 0, 36)) if (Math.abs(x - cx) < r * 0.8 && y > foot) foot = y;
  });
  return { coast, depths, myth, fog: opts.fog ? fogBank(id, cx, cy, r, archipelago, opts.fog) : null, foot };
}

/** Obal ostrova pro výpočet rozmístění: poloměr i s linkami vody a jménem pod ostrovem. */
export function footprint(r: number, archipelago: boolean): number {
  return (archipelago ? r * 1.35 : r * 1.12) + 12;
}

/** Název kraje na mapě (krátký název archetypu), u dlouhých na dva řádky. */
export function regionLines(name: string): string[] {
  const up = name.toLocaleUpperCase('cs');
  if (up.length <= 13 || !up.includes(' ')) return [up];
  const mid = up.length / 2;
  let cut = -1;
  for (let i = 0; i < up.length; i += 1) if (up[i] === ' ' && (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid))) cut = i;
  return [up.slice(0, cut), up.slice(cut + 1)];
}

/** Písmo názvu kraje (jednotky mapy) a odhad rozměrů štítku pro rozmístění. */
export const REGION_FONT = 21;
export const REGION_TRACK = 0.38;
export function regionBox(lines: string[]): { w: number; h: number } {
  const longest = Math.max(...lines.map((l) => l.length));
  return { w: longest * REGION_FONT * (0.72 + REGION_TRACK), h: lines.length * REGION_FONT * 1.25 };
}

/* ---------- přístavy a plavby ---------- */

export type ChartIsland = { id: string; x: number; y: number; r: number; arch: boolean };
/** Putování na mapě: `stops` jsou světy v pořadí plavby. */
export type ChartTrail = { id: string; stops: string[] };
/** Přístav: kotva u břehu (`x`, `y`) a rejda o kus dál v moři (`ox`, `oy`), kudy vede trasa plavby. */
export type Harbour = { trail: string; angle: number; x: number; y: number; ox: number; oy: number };

const TAU = Math.PI * 2;
const norm = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Jižní výseč je vyhrazená jménu ostrova, přístavy se jí vyhnou. */
const SOUTH = Math.PI / 2;
const SOUTH_HALF = 0.92;
const HARBOUR_GROW = 6.5;
const ROAD_GROW = 14;
/** Souostroví jako překážka plavby: kruh kolem celé skupiny (násobek poloměru). */
const ARCH_REACH = 1.36;
/** Odstup trasy od pobřeží cizích ostrovů (jednotky mapy). */
const SEA_ROOM = 7;

function outOfSouth(angle: number): number {
  const d = norm(angle - SOUTH);
  if (Math.abs(d) >= SOUTH_HALF) return norm(angle);
  return norm(SOUTH + (d >= 0 ? SOUTH_HALF : -SOUTH_HALF));
}

/**
 * Přístavy všech ostrovů: jeden za každé putování, které světem prochází. Přístav leží na té straně
 * ostrova, odkud plavba připlouvá a kam odplouvá; přístavy téhož ostrova si drží odstup.
 */
export function harbourPlan(islands: ChartIsland[], trails: ChartTrail[]): Record<string, Harbour[]> {
  const byId = new Map(islands.map((i) => [i.id, i]));
  const wanted = new Map<string, Array<{ trail: string; angle: number }>>();
  for (const trail of trails) {
    const stops = trail.stops.map((id) => byId.get(id)).filter((i): i is ChartIsland => Boolean(i));
    stops.forEach((isl, k) => {
      let vx = 0;
      let vy = 0;
      for (const other of [stops[k - 1], stops[k + 1]]) {
        if (!other) continue;
        const d = Math.hypot(other.x - isl.x, other.y - isl.y) || 1;
        vx += (other.x - isl.x) / d;
        vy += (other.y - isl.y) / d;
      }
      let angle: number;
      if (Math.hypot(vx, vy) < 0.3) {
        // připlouvá a odplouvá opačnými směry: přístav stranou, na severnější z obou boků
        const a = stops[k - 1] ?? isl;
        const b = stops[k + 1] ?? isl;
        const side = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2;
        angle = Math.sin(side) <= 0 ? side : side + Math.PI;
      } else angle = Math.atan2(vy, vx);
      if (!wanted.has(isl.id)) wanted.set(isl.id, []);
      wanted.get(isl.id)!.push({ trail: trail.id, angle: outOfSouth(angle) });
    });
  }
  const plan: Record<string, Harbour[]> = {};
  for (const [id, list] of wanted) {
    const isl = byId.get(id)!;
    const mainR = isl.arch ? isl.r * 0.52 : isl.r;
    const sep = Math.min(1.15, Math.max(0.42, 12 / mainR));
    // Přístavy se rozmístí po dovoleném oblouku (celý obvod bez jižní výseče) s odstupem `sep`.
    const span = TAU - 2 * SOUTH_HALF;
    const toArc = (angle: number) => {
      const d = norm(angle - SOUTH);
      return d >= 0 ? d - SOUTH_HALF : d + TAU - SOUTH_HALF;
    };
    const fromArc = (u: number) => norm(SOUTH + u + SOUTH_HALF);
    const items = list
      .map((h) => ({ trail: h.trail, u: Math.min(span, Math.max(0, toArc(h.angle))) }))
      .sort((p, q) => p.u - q.u || p.trail.localeCompare(q.trail));
    const gap = items.length > 1 ? Math.min(sep, span / (items.length - 1)) : sep;
    for (let k = 1; k < items.length; k += 1) items[k].u = Math.max(items[k].u, items[k - 1].u + gap);
    if (items.length && items[items.length - 1].u > span) {
      items[items.length - 1].u = span;
      for (let k = items.length - 2; k >= 0; k -= 1) items[k].u = Math.min(items[k].u, items[k + 1].u - gap);
    }
    plan[id] = items.map((item) => {
      const h = { trail: item.trail, angle: fromArc(item.u) };
      const [x, y] = coastPoint(id, isl.x, isl.y, isl.r, isl.arch, h.angle, HARBOUR_GROW);
      // rejda: kus od břehu; u souostroví vně celé skupiny, aby trasa nevedla mezi ostrůvky
      const [ox, oy] = isl.arch
        ? [isl.x + Math.cos(h.angle) * (isl.r * ARCH_REACH + SEA_ROOM + 4), isl.y + Math.sin(h.angle) * (isl.r * ARCH_REACH + SEA_ROOM + 4)]
        : coastPoint(id, isl.x, isl.y, isl.r, false, h.angle, ROAD_GROW);
      return { trail: h.trail, angle: h.angle, x, y, ox, oy };
    });
  }
  return plan;
}

/** Obrys ostrova pro plánování trasy: poloměr pobřeží po směrech (souostroví jako kruh kolem celé skupiny). */
type Outline = { at: (angle: number) => number; max: number };
const outlines = new Map<string, Outline>();

function outline(isl: ChartIsland): Outline {
  const key = `${isl.id}:${isl.x}:${isl.y}:${isl.r}:${isl.arch}`;
  let cached = outlines.get(key);
  if (!cached) {
    cached = traceOutline(isl);
    outlines.set(key, cached);
  }
  return cached;
}

function traceOutline(isl: ChartIsland): Outline {
  if (isl.arch) {
    const R = isl.r * ARCH_REACH;
    return { at: () => R, max: R };
  }
  const bins = 90;
  const table = new Array<number>(bins).fill(0);
  const main = pieces(isl.id, isl.x, isl.y, isl.r, false)[0];
  for (const [x, y] of ring(main.x, main.y, main.r, profile(main.seed, rough(main)), 0, 360)) {
    const a = Math.atan2(y - isl.y, x - isl.x);
    const k = Math.floor((((a + TAU) % TAU) / TAU) * bins) % bins;
    table[k] = Math.max(table[k], Math.hypot(x - isl.x, y - isl.y));
  }
  for (let k = 0; k < bins; k += 1) if (!table[k]) table[k] = Math.max(table[(k + 1) % bins], table[(k + bins - 1) % bins]);
  return { at: (angle) => table[Math.floor((((angle + TAU) % TAU) / TAU) * bins) % bins], max: Math.max(...table) };
}

/** Kubické úseky hladké křivky přes body (Catmull-Rom); `from` a `to` vymezí část. */
function splineSegments(pts: Pt[], from = 0, to = pts.length - 1): string {
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = '';
  for (let i = from; i < to; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

/** Otevřená hladká křivka přes body. */
function openPath(pts: Pt[], from = 0, to = pts.length - 1): string {
  if (pts.length < 2 || to <= from) return '';
  const f = (v: number) => Math.round(v * 10) / 10;
  return `M${f(pts[from][0])} ${f(pts[from][1])}${splineSegments(pts, from, to)}`;
}

export type VoyageLeg = { from: string; to: string; d: string; pts: Pt[] };

/**
 * Trasa plavby po putování: úseky mezi rejdami po sobě jdoucích světů. Úsek jde rovně, a kde by vedl
 * přes ostrov, obepluje ho.
 */
export function voyageLegs(trail: ChartTrail, islands: ChartIsland[], plan: Record<string, Harbour[]>): VoyageLeg[] {
  const byId = new Map(islands.map((i) => [i.id, i]));
  const shapes = new Map(islands.map((i) => [i.id, outline(i)]));
  const blocked = (p: Pt, room = SEA_ROOM): ChartIsland | null => {
    for (const isl of islands) {
      const dx = p[0] - isl.x;
      const dy = p[1] - isl.y;
      const d = Math.hypot(dx, dy);
      const sh = shapes.get(isl.id)!;
      if (d > sh.max + room) continue;
      if (d < sh.at(Math.atan2(dy, dx)) + room) return isl;
    }
    return null;
  };
  const plot = (a: Pt, b: Pt, depth: number): Pt[] => {
    if (depth > 5) return [];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(2, Math.ceil(len / 4));
    for (let s = 1; s < steps; s += 1) {
      const p: Pt = [a[0] + ((b[0] - a[0]) * s) / steps, a[1] + ((b[1] - a[1]) * s) / steps];
      const isl = blocked(p);
      if (!isl) continue;
      // obeplout: bod stranou od středu ostrova, na té straně, kudy přímka ostrov míjí
      const nx = -(b[1] - a[1]) / len;
      const ny = (b[0] - a[0]) / len;
      const side = (isl.x - a[0]) * nx + (isl.y - a[1]) * ny > 0 ? -1 : 1;
      const reach = shapes.get(isl.id)!.max + SEA_ROOM + 5;
      let w: Pt = [isl.x + nx * side * reach, isl.y + ny * side * reach];
      for (let k = 0; k < 4; k += 1) {
        const other = blocked(w, SEA_ROOM + 2);
        if (!other) break;
        const d = Math.hypot(w[0] - other.x, w[1] - other.y) || 1;
        const out = shapes.get(other.id)!.max + SEA_ROOM + 6;
        w = [other.x + ((w[0] - other.x) / d) * out, other.y + ((w[1] - other.y) / d) * out];
      }
      return [...plot(a, w, depth + 1), w, ...plot(w, b, depth + 1)];
    }
    return [];
  };
  // celá trasa jako jedna hladká křivka (v přístavech se neláme), úseky jsou její části
  const stops = trail.stops.filter((id) => byId.has(id) && plan[id]?.some((h) => h.trail === trail.id));
  const road = (id: string): Pt => {
    const h = plan[id]!.find((item) => item.trail === trail.id)!;
    return [h.ox, h.oy];
  };
  const all: Pt[] = stops.length ? [road(stops[0])] : [];
  const marks: number[] = [0];
  for (let k = 0; k < stops.length - 1; k += 1) {
    const a = road(stops[k]);
    const b = road(stops[k + 1]);
    all.push(...plot(a, b, 0));
    const next = stops[k + 2] ? road(stops[k + 2]) : null;
    if (next) {
      // mezipřistání: trasa přístav obepluje obloukem (dva body podél břehu), ne ostrou špičkou
      const isl = byId.get(stops[k + 1])!;
      const rx = b[0] - isl.x;
      const ry = b[1] - isl.y;
      const rl = Math.hypot(rx, ry) || 1;
      let tx = -ry / rl;
      let ty = rx / rl;
      if ((a[0] - b[0]) * tx + (a[1] - b[1]) * ty < (next[0] - b[0]) * tx + (next[1] - b[1]) * ty) {
        tx = -tx;
        ty = -ty;
      }
      const bend = 6;
      all.push([b[0] + tx * bend, b[1] + ty * bend], [b[0] - tx * bend, b[1] - ty * bend]);
    } else all.push(b);
    marks.push(all.length - 1);
  }
  const legs: VoyageLeg[] = [];
  for (let k = 0; k < stops.length - 1; k += 1)
    legs.push({ from: stops[k], to: stops[k + 1], d: openPath(all, marks[k], marks[k + 1]), pts: all.slice(marks[k], marks[k + 1] + 1) });
  return legs;
}

/** Leží bod na pevnině některého ostrova? (kontrola tras v testu) */
export function onLand(p: Pt, islands: ChartIsland[], room = 0): string | null {
  for (const isl of islands) {
    const sh = outline(isl);
    const d = Math.hypot(p[0] - isl.x, p[1] - isl.y);
    if (d < sh.at(Math.atan2(p[1] - isl.y, p[0] - isl.x)) + room) return isl.id;
  }
  return null;
}
