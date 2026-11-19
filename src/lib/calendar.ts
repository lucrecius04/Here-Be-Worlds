export function dayOfYear(date = new Date()): number {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const now = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((now - start) / 86_400_000);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function mysteryMode(date = new Date()): 0 | 1 | 2 | 3 {
  return (dayOfYear(date) % 4) as 0 | 1 | 2 | 3;
}

const CS_MONTHS_GENITIVE = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatMysteryKicker(date: Date, locale: 'cs' | 'en'): string {
  const day = date.getDate();
  const month = date.getMonth();
  if (locale === 'en') return `${day} ${EN_MONTHS[month]}`;
  return `${day}. ${CS_MONTHS_GENITIVE[month]}`;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function dailyWorldIndex(count: number, offset = 0, date = new Date()): number {
  if (count <= 0) return 0;
  return (dayOfYear(date) + offset) % count;
}

/** Pořadové číslo dne od 1. 1. 1970 podle místního kalendáře (nepřetéká přes Nový rok). */
export function dayNumber(date = new Date()): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

/** Promíchané pořadí světů pro jeden cyklus (count dní); každý svět přijde v cyklu jednou. */
function cycleOrder(count: number, cycle: number): number[] {
  return shuffle(
    Array.from({ length: count }, (_, i) => i),
    mulberry32(cycle * 7919 + 101),
  );
}

/** Svět dne: promíchané pořadí, takže se nestřídají archetypy po blocích jako v katalogu. */
export function featuredWorldIndex(count: number, date = new Date()): number {
  if (count <= 0) return 0;
  const day = dayNumber(date);
  return cycleOrder(count, Math.floor(day / count))[day % count];
}

/**
 * Hádanka dne: stejné pořadí jako Svět dne, ale posunuté o půl cyklu. Odpověď tak nebyla
 * Světem dne v posledních týdnech a nebude jím ani v nejbližších.
 */
export function mysteryWorldIndex(count: number, date = new Date()): number {
  if (count <= 0) return 0;
  const day = dayNumber(date);
  const cycle = Math.floor(day / count);
  return cycleOrder(count, cycle)[(day % count + Math.floor(count / 2)) % count];
}

/**
 * Tři možnosti hádanky: správná odpověď, jeden svět ze stejného archetypu (aby nestačilo
 * poznat žánr) a jeden odjinud. Stabilní pro daný den.
 */
export function mysteryChoices<T extends { id: string; chapterId?: string }>(
  items: T[],
  correct: T,
  date = new Date(),
  count = 3,
): T[] {
  const rand = mulberry32(dayNumber(date) * 9973 + 17);
  const others = shuffle(
    items.filter((item) => item.id !== correct.id),
    rand,
  );
  const sibling = correct.chapterId ? others.find((item) => item.chapterId === correct.chapterId) : undefined;
  const rest = others.filter((item) => item !== sibling && (!correct.chapterId || item.chapterId !== correct.chapterId));
  const pool = sibling ? [sibling, ...rest, ...others] : [...rest, ...others];
  const distractors: T[] = [];
  for (const item of pool) {
    if (distractors.length >= Math.max(0, count - 1)) break;
    if (!distractors.includes(item)) distractors.push(item);
  }
  return shuffle([correct, ...distractors], rand);
}
