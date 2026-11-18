/**
 * Znak Here Be Worlds: leporelo o čtyřech stránkách, jehož horní hrana kreslí W.
 * Stránky ve stínu jsou šedá a zlatá (rozsvícená stránka), stránky na světle bílé.
 * Barvy přes tokeny `--mark-*` (tokens.css); znak stojí vždy na noční modři.
 */
type Props = { size?: number; className?: string };

export const MARK_PATHS = {
  shade: 'M5 13L19 24V56L5 45Z',
  lightA: 'M19 24L32 13V45L19 56Z',
  glow: 'M32 13L45 24V56L32 45Z',
  lightB: 'M45 24L59 13V45L45 56Z',
} as const;

export default function BrandMark({ size = 32, className = 'brand-mark' }: Props) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d={MARK_PATHS.shade} fill="var(--mark-shade)" />
      <path d={MARK_PATHS.lightA} fill="var(--mark-light)" />
      <path d={MARK_PATHS.glow} fill="var(--mark-glow)" />
      <path d={MARK_PATHS.lightB} fill="var(--mark-light)" />
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
