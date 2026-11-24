/* Bez importu stylů: ikonu používá i Vysvětlivky (/notes/). */
/** Ikony „kdo drží mezeru“: zamčený zámek · přesýpací hodiny · odemčený zámek. */
export function HolderIcon({ id, className = 'un-icon' }: { id: string; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (id === 'zamceno-tvurci')
    return (
      <svg {...common}>
        <rect x="4.5" y="10.5" width="15" height="10.5" rx="1.2" fill="currentColor" />
        <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
        <path d="M12 14.6v2.6" stroke="var(--color-paper)" strokeWidth="1.8" />
      </svg>
    );
  if (id === 'ceka-na-pokracovani')
    return (
      <svg {...common}>
        <path d="M6.5 3h11M6.5 21h11" />
        <path d="M7.5 3c0 4.5 4.5 6 4.5 9s-4.5 4.5-4.5 9M16.5 3c0 4.5-4.5 6-4.5 9s4.5 4.5 4.5 9" />
        <path d="M9.6 19.2c.8-1.4 4-1.4 4.8 0z" fill="currentColor" />
        <path d="M10 6.4h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="1.2" />
      <path d="M8 10.5V7.2a4 4 0 0 1 7.6-1.8" />
      <circle cx="12" cy="15.8" r="1.2" fill="currentColor" />
    </svg>
  );
}
