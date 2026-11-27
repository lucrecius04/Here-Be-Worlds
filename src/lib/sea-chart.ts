/**
 * Mapa známých světů (náhled, etapa 1): tvar a velikost ostrovů.
 *
 * Každý svět je ostrov. Poloha je zmražená v `data/meta/sea-chart.json` (skript `scripts/sea-chart.ts`),
 * tvar pobřeží se generuje z id světa (šum s pevným semínkem), takže je pořád stejný a nic nekóduje.
 * Velikost ostrova nese prostorový dosah světa; svět o více rovinách je souostroví.
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
    for (const h of harm) f += h.a * Math.sin(h.k * t + h.p);
    const rr = r * Math.max(0.42, f) + grow * (0.85 + 0.15 * f);
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

export type IslandShape = {
  /** Pobřeží (jeden nebo víc kusů země). */
  coast: string;
  /** Linky vody kolem pobřeží, od nejbližší po nejvzdálenější. */
  waterLines: string[];
  /** Nejnižší bod ostrova pod středem (kam patří jméno). */
  foot: number;
};

/** Odsazení linek vody od pobřeží (jednotky mapy). */
const WATER_STEPS = [3.2, 6.8, 11];

export function islandShape(id: string, cx: number, cy: number, r: number, archipelago: boolean): IslandShape {
  const pieces: Array<{ x: number; y: number; r: number; seed: string }> = [];
  if (archipelago) {
    const rand = seededRandom(`${id}:souostrovi`);
    pieces.push({ x: cx, y: cy, r: r * 0.52, seed: `${id}:0` });
    const count = 4;
    const start = rand() * Math.PI * 2;
    for (let k = 0; k < count; k += 1) {
      const ang = start + (k / count) * Math.PI * 2 + (rand() - 0.5) * 0.7;
      const dist = r * (0.95 + rand() * 0.3);
      pieces.push({ x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist * 0.8, r: r * (0.2 + rand() * 0.16), seed: `${id}:${k + 1}` });
    }
  } else {
    pieces.push({ x: cx, y: cy, r, seed: id });
  }
  const profs = pieces.map((p) => profile(p.seed, p.r < 12 ? 0.6 : 1));
  const coast = pieces.map((p, i) => smoothPath(ring(p.x, p.y, p.r, profs[i], 0, 84))).join('');
  const waterLines = WATER_STEPS.map((g) =>
    pieces.map((p, i) => smoothPath(ring(p.x, p.y, p.r, profs[i], g * (p.r < 12 ? 0.75 : 1), 60))).join(''),
  );
  let foot = cy;
  pieces.forEach((p, i) => {
    for (const [x, y] of ring(p.x, p.y, p.r, profs[i], 0, 36)) if (Math.abs(x - cx) < r * 0.8 && y > foot) foot = y;
  });
  return { coast, waterLines, foot };
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
