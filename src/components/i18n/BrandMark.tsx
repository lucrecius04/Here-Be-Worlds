/**
 * Znak Here Be Worlds (od 2026-11-27 podoba O2, kterou majitel vybral): loď, jejíž plachta je brk, v šedém kruhu
 * světa otevřeném dole; zlatá vlna leží v mezeře a přesahuje do stran, špička plachty z kruhu vyjíždí.
 * Cesty a geometrie jsou v src/lib/brand-mark.ts (sdílí je i favicony a karty pro sdílení).
 * Mezery kolem lodi jsou tah v barvě noci (`--color-night`); znak stojí vždy na noční modři.
 * Dřívější znak (čtyři vrstvy kotouče) zůstává v MARK_PATHS jen pro historii (docs/znacka.md).
 */
import { BOAT_TRANSFORM, FEATHER, HULL, OPEN_RING, SAIL_VIEWBOX, WAVE, WAVE_TRANSFORM } from '../../lib/brand-mark';

export { SAIL_VIEWBOX };

type Props = { size?: number; className?: string };

/** Výřez dřívějšího znaku (x 4–68, y 8–56): poměr 4 : 3. */
export const MARK_VIEWBOX = '4 8 64 48';

export const MARK_PATHS = {
  top: 'M38 10A22 22 0 0 1 56.37 19.9H19.63A22 22 0 0 1 38 10Z',
  glow: 'M14.35 22.1H65L61.4 26.5L65 30.9H12.03A22 22 0 0 1 14.35 22.1Z',
  middle: 'M8.03 33.1H51.97A22 22 0 0 1 49.65 41.9H10.35A22 22 0 0 1 8.03 33.1Z',
  shade: 'M7.63 44.1H44.37A22 22 0 0 1 26 54A22 22 0 0 1 7.63 44.1Z',
} as const;

/** `size` × 1,65 = strana znaku v px (hlavička 28 → 46 px, patička 24 → 40 px). */
export default function BrandMark({ size = 30, className = 'brand-mark' }: Props) {
  const s = Math.round(size * 1.65);
  const gap = { fill: 'none', stroke: 'var(--color-night)', strokeWidth: 1.4, strokeLinejoin: 'round' } as const;
  return (
    <svg className={className} width={s} height={s} viewBox={SAIL_VIEWBOX} aria-hidden="true" focusable="false">
      <path d={OPEN_RING} fill="none" stroke="var(--mark-shade)" strokeWidth="0.75" strokeLinecap="round" />
      <g transform={BOAT_TRANSFORM}>
        {/* tah mezery pod výplněmi: stěžeň zůstane s trupem spojený, mezera odděluje jen kruh a vlnu */}
        <path d={FEATHER} {...gap} />
        <path d={HULL} {...gap} />
        <path d={FEATHER} fill="var(--mark-light)" fillRule="evenodd" />
        <path d={HULL} fill="var(--mark-light)" fillRule="evenodd" />
        <g transform={WAVE_TRANSFORM}>
          <path
            d={WAVE}
            fill="var(--mark-glow)"
            fillRule="evenodd"
            stroke="var(--color-night)"
            strokeWidth={1.4 / 1.3}
            paintOrder="stroke"
            strokeLinejoin="round"
          />
        </g>
      </g>
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
