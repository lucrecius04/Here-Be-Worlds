/**
 * Jednoduché ohýbání češtiny pro hledání: „bůh“ najde „boha“, „drak“ najde „draci“,
 * „smrt“ najde „smrti“. Není to slovník, jen odřezání běžných koncovek a sjednocení
 * střídání na konci kmene (c → k, z → h) a ů → o (bůh, boha). Kmen se porovnává celý,
 * ne začátkem, aby „halo“ (kmen „hal“) nenašlo „half“.
 */

/** Koncovky (bez diakritiky), od nejdelších. */
const ENDINGS = [
  'ovi', 'ove', 'ovy', 'ech', 'ich', 'ych', 'ami', 'emi', 'ymi', 'imi', 'eho', 'emu',
  'em', 'um', 'am', 'ou', 'ho', 'mu', 'ym', 'im',
  'a', 'e', 'i', 'o', 'u', 'y',
];

const MIN_STEM = 3;

/** Malá písmena bez diakritiky; ů se mění na o (kmen se v ohýbání střídá: bůh – boha, dům – domu). */
export function foldCz(word: string): string {
  return word.toLowerCase().replace(/ů/g, 'o').normalize('NFD').replace(/\p{M}/gu, '');
}

/** Kmen slova, nebo prázdný řetězec, když je slovo na kmen moc krátké. */
export function czStem(word: string): string {
  let w = foldCz(word).replace(/[^a-z0-9]/g, '');
  if (w.length < MIN_STEM) return '';
  if (w.length > MIN_STEM) {
    for (const e of ENDINGS) {
      if (w.endsWith(e) && w.length - e.length >= MIN_STEM) {
        w = w.slice(0, -e.length);
        break;
      }
    }
  }
  // střídání na konci kmene: drak – draci, ruka – ruce, bůh – bozi, noha – noze
  if (w.endsWith('c')) w = `${w.slice(0, -1)}k`;
  else if (w.endsWith('z')) w = `${w.slice(0, -1)}h`;
  return w;
}

/** Značka, pod kterou se kmen ukládá do rejstříku MiniSearch vedle celého slova. */
export const STEM_MARK = '~';
