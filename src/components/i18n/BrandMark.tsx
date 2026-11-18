/**
 * Znak Here Be Worlds: kotouč světa rozložený na čtyři vrstvy (vyprávění, historie,
 * klasifikace, mapa), které se rozjely do schodů. Sklon / odpovídá kurzívě „Be“ v nápisu.
 * Shora: bílá, zlatá (rozsvícená vrstva, kterou právě čteme), bílá, šedá (stín dole).
 * Barvy přes tokeny `--mark-*` (tokens.css); znak stojí vždy na noční modři.
 */
type Props = { size?: number; className?: string };

/** Výřez kresby (x 4–60, y 8–56): poměr 7 : 6. */
export const MARK_VIEWBOX = '4 8 56 48';

export const MARK_PATHS = {
  top: 'M38 10A22 22 0 0 1 56.37 19.9H19.63A22 22 0 0 1 38 10Z',
  glow: 'M14.35 22.1H53.65A22 22 0 0 1 55.97 30.9H12.03A22 22 0 0 1 14.35 22.1Z',
  middle: 'M8.03 33.1H51.97A22 22 0 0 1 49.65 41.9H10.35A22 22 0 0 1 8.03 33.1Z',
  shade: 'M7.63 44.1H44.37A22 22 0 0 1 26 54A22 22 0 0 1 7.63 44.1Z',
} as const;

/** `size` = výška znaku v px; šířka plyne z poměru 7 : 6. */
export default function BrandMark({ size = 30, className = 'brand-mark' }: Props) {
  return (
    <svg
      className={className}
      width={Math.round((size * 7) / 6)}
      height={size}
      viewBox={MARK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
    >
      <path d={MARK_PATHS.top} fill="var(--mark-light)" />
      <path d={MARK_PATHS.glow} fill="var(--mark-glow)" />
      <path d={MARK_PATHS.middle} fill="var(--mark-light)" />
      <path d={MARK_PATHS.shade} fill="var(--mark-shade)" />
    </svg>
  );
}

/** Nápis „Here Be Worlds“ s kurzívou na „Be“ (název se nepřekládá). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      Here <em>Be</em> Worlds
    </span>
  );
}
