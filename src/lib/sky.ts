/**
 * Obloha atlasu: rozmístění hvězd světů v souhvězdích archetypů a nejkratší linky mezi nimi.
 * Používá ji titulní strana (HomeIntro) a stránky témat (ThemeSky); poloha hvězd je pevná,
 * takže je svět na obou místech na stejném místě oblohy.
 */
import type { World } from '../schemas/world';

/**
 * Trvale popsané hvězdy: světy, které čtenář pozná nejspíš (velká souhvězdí tři, malá dvě).
 * Ostatní jména se ukážou po najetí na hvězdu nebo na název souhvězdí.
 */
export const ICONIC: Record<string, string[]> = {
  fantasy: ['the-witcher', 'dark-souls', 'elder-scrolls'],
  'science-fiction': ['mass-effect', 'halo', 'starcraft'],
  'post-apocalypse': ['fallout', 'metro'],
  horror: ['silent-hill', 'resident-evil'],
  historical: ['disco-elysium', 'assassins-creed'],
  dystopia: ['cyberpunk-2077', 'bioshock'],
  metaphysical: ['outer-wilds', 'control'],
};

/**
 * Souhvězdí bez předepsaného tvaru: hvězdy leží v ploše souhvězdí na náhodných, ale pevných místech
 * (generátor se semínkem podle archetypu, takže se obloha mezi návštěvami nemění) a spojuje je jediná
 * klikatá linka od hvězdy k sousední hvězdě. Každá hvězda má nejvýš dva sousedy, žádná tedy nepůsobí
 * jako střed, ze kterého by ostatní vyrůstaly. k-tý svět archetypu (podle čísla) dostane k-té místo;
 * místa se vybírají postupně co nejdál od předchozích, takže i menší souhvězdí vyplní celou plochu
 * a při odkrytí dalšího světa se už rozmístěné hvězdy nepohnou (linka se jen přeskládá).
 */
function seededRandom(seedText: string) {
  let seed = 2166136261;
  for (const ch of seedText) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619);
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Místa hvězd v ploše w × h: dost daleko od sebe, aby se jména pod nimi co nejméně překrývala. */
function scatter(id: string, count: number, w: number, h: number): Array<[number, number]> {
  const rand = seededRandom(id);
  const pts: Array<[number, number]> = [];
  for (let k = 0; k < count; k += 1) {
    // Okraj 40 jednotek, aby se jména u krajních hvězd nevešla mimo oblohu.
    const pad = 40;
    const pick = (): [number, number] => [Math.round(pad + rand() * (w - 2 * pad)), Math.round(rand() * h)];
    let best: [number, number] = pick();
    let bestScore = -1;
    // Z několika kandidátů vezme ten nejvzdálenější od už rozmístěných (rovnoměrnější, ale nahodilé).
    for (let tries = 0; tries < 24; tries += 1) {
      const c = pick();
      const score = pts.length ? Math.min(...pts.map((p) => Math.hypot((p[0] - c[0]) / 1.6, p[1] - c[1]))) : 1;
      if (score > bestScore) {
        best = c;
        bestScore = score;
      }
    }
    pts.push(best);
  }
  return pts;
}

/**
 * Nejkratší možná linka přes všechny hvězdy (otevřená cesta, začít i skončit může kdekoli).
 * Přesně (Held–Karp) do 16 hvězd, nad tím nejbližší soused + 2-opt. Každá hvězda má nejvýš
 * dva sousedy a linka se nekříží.
 */
export function windingPath(coords: Array<[number, number]>): number[] {
  const n = coords.length;
  if (n < 3) return coords.map((_, k) => k);
  const d = (a: number, b: number) => Math.hypot(coords[a][0] - coords[b][0], coords[a][1] - coords[b][1]);
  if (n <= 16) {
    const full = (1 << n) - 1;
    const dp = new Float64Array((full + 1) * n).fill(Infinity);
    const from = new Int8Array((full + 1) * n).fill(-1);
    for (let j = 0; j < n; j += 1) dp[(1 << j) * n + j] = 0;
    for (let mask = 1; mask <= full; mask += 1) {
      for (let j = 0; j < n; j += 1) {
        const cur = dp[mask * n + j];
        if (!(mask & (1 << j)) || cur === Infinity) continue;
        for (let k = 0; k < n; k += 1) {
          if (mask & (1 << k)) continue;
          const next = mask | (1 << k);
          const len = cur + d(j, k);
          if (len < dp[next * n + k] - 1e-9) {
            dp[next * n + k] = len;
            from[next * n + k] = j;
          }
        }
      }
    }
    let end = 0;
    for (let j = 1; j < n; j += 1) if (dp[full * n + j] < dp[full * n + end] - 1e-9) end = j;
    const order: number[] = [];
    for (let mask = full, j = end; j >= 0; ) {
      order.push(j);
      const prev = from[mask * n + j];
      mask &= ~(1 << j);
      j = prev;
    }
    return order.reverse();
  }
  let start = 0;
  coords.forEach((c, k) => {
    if (c[0] < coords[start][0]) start = k;
  });
  const order = [start];
  const left = new Set(coords.map((_, k) => k).filter((k) => k !== start));
  while (left.size) {
    const last = order[order.length - 1];
    let next = -1;
    left.forEach((k) => {
      if (next < 0 || d(last, k) < d(last, next)) next = k;
    });
    order.push(next);
    left.delete(next);
  }
  for (let pass = 0, improved = true; improved && pass < 30; pass += 1) {
    improved = false;
    for (let i = -1; i < n - 2; i += 1) {
      for (let j = i + 2; j < n; j += 1) {
        const a = i >= 0 ? order[i] : -1;
        const b = order[i + 1];
        const c = order[j];
        const e = j + 1 < n ? order[j + 1] : -1;
        const before = (a >= 0 ? d(a, b) : 0) + (e >= 0 ? d(c, e) : 0);
        const after = (a >= 0 ? d(a, c) : 0) + (e >= 0 ? d(b, e) : 0);
        if (after < before - 0.01) {
          order.splice(i + 1, j - i, ...order.slice(i + 1, j + 1).reverse());
          improved = true;
        }
      }
    }
  }
  return order;
}

/** Dvě hvězdy se „srazí“, když by se jejich jména pod nimi překrývala. */
function clash(a: [number, number], b: [number, number]): boolean {
  return Math.abs(a[0] - b[0]) < 78 && Math.abs(a[1] - b[1]) < 30;
}

/**
 * Rozdělí hvězdy souhvězdí do stálých skupinek, které se na obloze střídají. První skupinka
 * jsou známé světy (first); další berou zbylé hvězdy tak, aby se jména ve skupince nepřekrývala
 * ani s trvale popsanými (always, nově zmapované světy). Vrací index skupinky pro každou hvězdu
 * (-1 = trvale popsaná).
 */
function rotationSets(coords: Array<[number, number]>, first: number[], always: number[], size: number): number[] {
  const count = coords.length;
  const setOf = new Array<number>(count).fill(-2);
  always.forEach((k) => {
    setOf[k] = -1;
  });
  const free = (k: number, group: number[]) =>
    group.every((g) => !clash(coords[g], coords[k])) && always.every((a) => !clash(coords[a], coords[k]));
  const firstGroup: number[] = [];
  first.forEach((k) => {
    if (setOf[k] === -2 && free(k, firstGroup)) firstGroup.push(k);
  });
  firstGroup.forEach((k) => {
    setOf[k] = 0;
  });
  // Zbylé pozice v rozházeném pořadí, aby po sobě nesvítily vždy stejné části tvaru.
  let rest = Array.from({ length: count }, (_, k) => k)
    .filter((k) => setOf[k] === -2)
    .sort((a, b) => ((a * 5) % count) - ((b * 5) % count));
  let index = firstGroup.length ? 1 : 0;
  while (rest.length) {
    const group: number[] = [];
    for (const k of rest) {
      if (group.length >= Math.max(1, size)) break;
      if (free(k, group)) group.push(k);
    }
    if (!group.length) group.push(rest[0]);
    group.forEach((k) => {
      setOf[k] = index;
    });
    rest = rest.filter((k) => !group.includes(k));
    index += 1;
  }
  return setOf;
}

/*
 * Obloha v souřadnicích 1000 × H. Souhvězdí mají pevné počátky (horní a dolní pás).
 * Jména popsaných hvězd stojí pod hvězdou, stejně jako při rozsvíceném souhvězdí.
 */
const AREAS: Array<[number, number, number, number]> = [
  [0, 50, 320, 150],
  [330, 50, 310, 150],
  [660, 50, 320, 150],
  [0, 290, 200, 125],
  [215, 290, 230, 125],
  [480, 290, 230, 125],
  [740, 290, 250, 125],
];

export type Star = { id: string; title: string; set: number; x: number; y: number; size: number; chapterId: string; isNew: boolean };
export type Line = { x1: number; y1: number; x2: number; y2: number; chapterId: string };
export type Group = { chapterId: string; x: number; y: number; count: number; sets: number; order: number };

export function buildSky(worlds: World[], chapters: Array<{ id: string }>, newIds: Set<string> = new Set()) {
  const stars: Star[] = [];
  const lines: Line[] = [];
  const groups: Group[] = [];
  let maxY = 0;
  const line = (a: [number, number], b: [number, number], chapterId: string) => {
    lines.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1], chapterId });
  };
  chapters.forEach((chapter, gi) => {
    const [ox, oy, aw, ah] = AREAS[gi] ?? [20 + (gi % 3) * 330, 50 + Math.floor(gi / 3) * 240, 260, 130];
    const items = worlds.filter((w) => w.chapterId === chapter.id).sort((a, b) => a.number - b.number);
    if (!items.length) return;
    const n = items.length;
    // Místa se generují pro celé souhvězdí naráz (i do zásoby), aby se při odkrytí dalšího světa
    // už rozmístěné hvězdy nepohnuly.
    const coords: Array<[number, number]> = scatter(chapter.id, Math.max(n, 16), aw, ah)
      .slice(0, n)
      .map(([x, y]) => [ox + x, oy + y]);
    // Body pro trvale popsané (známé) světy: první místa, která se jmény nepřekrývají.
    const named: number[] = [];
    for (let k = 0; k < n; k += 1) if (named.every((j) => !clash(coords[j], coords[k]))) named.push(k);
    // Známé světy na body určené pro jména, ostatní podle čísla do zbylých bodů.
    const wanted = (ICONIC[chapter.id] ?? [])
      .map((id) => items.find((w) => w.id === id))
      .filter((w): w is World => Boolean(w));
    const slots = named.slice(0, wanted.length);
    const iconic = wanted.slice(0, slots.length);
    const rest = items.filter((w) => !iconic.includes(w));
    const placed: World[] = [];
    for (let k = 0, r = 0; k < n; k += 1) {
      const slotIndex = slots.indexOf(k);
      placed.push(slotIndex >= 0 ? iconic[slotIndex] : rest[r++]);
    }
    const always = placed.map((w, k) => (newIds.has(w.id) ? k : -1)).filter((k) => k >= 0);
    const setOf = rotationSets(coords, slots, always, wanted.length || 2);
    groups.push({ chapterId: chapter.id, x: ox + 20, y: oy - 44, count: n, sets: Math.max(1, ...setOf.map((v) => v + 1)), order: gi });
    placed.forEach((w, k) => {
      const seed = gi * 13 + k * 7;
      const [x, y] = coords[k];
      stars.push({ id: w.id, title: w.gameTitle.cs ?? w.gameTitle.en, set: setOf[k], x, y, size: [5, 6, 7, 8][(seed * 17) % 4], chapterId: chapter.id, isNew: newIds.has(w.id) });
      maxY = Math.max(maxY, y);
    });
    const order = windingPath(coords);
    for (let k = 1; k < order.length; k += 1) line(coords[order[k - 1]], coords[order[k]], chapter.id);
  });
  return { stars, lines, groups, height: Math.max(430, Math.ceil(maxY + 40)) };
}

