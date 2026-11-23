/**
 * Náhled obrázků k putováním (skryté stránky /putovani/navrh-obrazku/…, noindex, z webu na ně nic nevede).
 * Zkušební obrázky leží v public/navrh-obrazku/. Až se styl vybere, stránky i obrázky se smažou
 * a obrázky dostanou stálé místo u stezek.
 */
export type PreviewImage = { file: string; label: string; night: boolean };

export const PREVIEW_IMAGES: PreviewImage[] = [
  { file: '01-gpt-mezzotinta-buh.jpg', label: 'Mezzotinta · GPT · bůh', night: true },
  { file: '02-gpt-rytina-buh.jpg', label: 'Rytina · GPT · bůh', night: false },
  { file: '03-gpt-shinhanga-buh.jpg', label: 'Šin-hanga · GPT · bůh', night: false },
  { file: '04-gpt-symbolismus-buh.jpg', label: 'Symbolismus · GPT · bůh', night: true },
  { file: '05-gpt-kyanotypie-buh.jpg', label: 'Kyanotypie · GPT · bůh', night: false },
  { file: '06-gemini-mezzotinta-buh.jpg', label: 'Mezzotinta · Gemini · bůh', night: true },
  { file: '07-gemini-rytina-buh.jpg', label: 'Rytina · Gemini · bůh', night: false },
  { file: '08-gemini-shinhanga-buh.jpg', label: 'Šin-hanga · Gemini · bůh', night: false },
  { file: '09-gemini-uhel-buh.jpg', label: 'Uhel · Gemini · bůh', night: false },
  { file: '10-gemini-kyanotypie-buh.jpg', label: 'Kyanotypie · Gemini · bůh', night: false },
  { file: '11-gpt-nocni-rytina-dum.jpg', label: 'Noční rytina · GPT · dům', night: true },
  { file: '12-gpt-mezzotinta-dum.jpg', label: 'Mezzotinta · GPT · dům', night: true },
  { file: '13-gpt-mezzotinta-hvezdy.jpg', label: 'Mezzotinta · GPT · hvězdy', night: true },
  { file: '14-gpt-rytina-dum.jpg', label: 'Rytina · GPT · dům', night: false },
  { file: '15-gemini-kyanotypie-dum.jpg', label: 'Kyanotypie · Gemini · dům', night: false },
  { file: '16-gemini-kyanotypie-hvezdy.jpg', label: 'Kyanotypie · Gemini · hvězdy', night: false },
];

/** Všechny obrázky: k tématu, kde sedí, zbytek dokola. Číslo = pořadí v PREVIEW_IMAGES od 1. */
const MIX: Record<string, number> = {
  'god-corpse': 1,
  'gods-burden': 6,
  house: 12,
  loops: 11,
  'indifferent-stars': 13,
  'dead-speak': 9,
  'chronicle-keepers': 2,
  copies: 15,
  'endless-work': 16,
  'who-woke-up': 4,
  'cursed-legacy': 7,
  'failed-paradise': 3,
  'living-city': 14,
  'true-names': 5,
  'monster-mirror': 10,
  'knows-you-play': 8,
  'free-will': 12,
  scapegoat: 4,
  corporate: 6,
  laughter: 13,
  'endless-war': 1,
  contagion: 11,
};

/** Jen noční grafika (mezzotinta a noční rytina), v pořadí rejstříku tak, aby sousedé neměli stejný obrázek. */
const NIGHT: Record<string, number> = {
  'gods-burden': 6,
  'cursed-legacy': 4,
  'free-will': 11,
  'god-corpse': 1,
  loops: 11,
  'knows-you-play': 13,
  'who-woke-up': 12,
  'monster-mirror': 4,
  scapegoat: 1,
  'failed-paradise': 13,
  corporate: 6,
  'dead-speak': 4,
  laughter: 12,
  'living-city': 11,
  'endless-war': 1,
  'indifferent-stars': 13,
  'chronicle-keepers': 4,
  copies: 6,
  house: 12,
  'endless-work': 13,
  'true-names': 11,
  contagion: 6,
};

export function previewSrc(base: string, n: number): string {
  return `${base.replace(/\/$/, '')}/navrh-obrazku/${PREVIEW_IMAGES[n - 1].file}`;
}

export function previewImages(base: string, set: 'mix' | 'night'): Record<string, string> {
  const map = set === 'night' ? NIGHT : MIX;
  return Object.fromEntries(Object.entries(map).map(([id, n]) => [id, previewSrc(base, n)]));
}

export function previewIndexFor(trailId: string): number {
  return MIX[trailId] ?? 1;
}
