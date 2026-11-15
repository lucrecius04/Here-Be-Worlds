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

export function mysteryChoices<T extends { id: string }>(
  items: T[],
  correct: T,
  date = new Date(),
  count = 3,
): T[] {
  const others = items.filter((item) => item.id !== correct.id);
  const rand = mulberry32(dayOfYear(date) * 9973 + 17);
  const distractors = shuffle(others, rand).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...distractors], rand);
}
