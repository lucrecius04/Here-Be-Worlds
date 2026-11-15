const ROMAN: Record<string, string> = {
  fantasy: 'I',
  'science-fiction': 'II',
  'post-apocalypse': 'III',
  horror: 'IV',
  historical: 'V',
  dystopia: 'VI',
  metaphysical: 'VII',
};

export function chapterRoman(chapterId: string): string {
  return ROMAN[chapterId] ?? '';
}

export default function ChapterEmblem({ chapterId }: { chapterId: string }) {
  return (
    <>
      <span className="home-realm__emblem" aria-hidden="true">
        {emblemFor(chapterId)}
      </span>
      <span className="home-realm__num" aria-hidden="true">
        {ROMAN[chapterId] ?? ''}
      </span>
    </>
  );
}

function emblemFor(id: string) {
  switch (id) {
    case 'fantasy':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="22" />
          <path d="M32 12v12M26 20h12" />
          <path d="M32 26l3 9h-6z" />
          <path d="M22 46h20M24 42h16" />
          <path d="M32 35v8" />
        </svg>
      );
    case 'science-fiction':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="7" />
          <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(-18 32 32)" />
          <ellipse cx="32" cy="32" rx="24" ry="10" transform="rotate(32 32 32)" />
          <circle cx="14" cy="22" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="50" cy="18" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="48" cy="46" r="1.4" fill="currentColor" stroke="none" />
          <path d="M44 14l3-4M47 14h5" />
        </svg>
      );
    case 'post-apocalypse':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="30" r="16" />
          <path d="M18 30c0-8 6-16 14-16" />
          <path d="M24 18l8 14 6-8 4 18" />
          <path d="M14 48h36M20 48l-4 8M32 48v8M44 48l4 8" />
        </svg>
      );
    case 'horror':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="22" />
          <circle cx="32" cy="32" r="10" />
          <circle cx="32" cy="32" r="3.5" fill="currentColor" stroke="none" />
          <path d="M10 32h8M46 32h8M22 16c6 6 14 6 20 0" />
        </svg>
      );
    case 'historical':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="22" />
          <path d="M32 12v8M32 44v8M12 32h8M44 32h8" />
          <path d="M32 18l4 14-4 14-4-14z" />
          <path d="M18 32l14 4 14-4-14-4z" />
          <rect x="28" y="46" width="8" height="10" rx="1" />
          <path d="M26 46h12" />
        </svg>
      );
    case 'dystopia':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <rect x="12" y="12" width="40" height="40" />
          <path d="M12 24h40M12 40h40M24 12v40M40 12v40" />
          <circle cx="32" cy="32" r="6" />
        </svg>
      );
    case 'metaphysical':
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <polygon points="32,8 56,32 32,56 8,32" />
          <polygon points="32,16 48,32 32,48 16,32" />
          <path d="M32 8v48M8 32h48" />
          <path d="M20 20l24 24M44 20L20 44" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="18" />
        </svg>
      );
  }
}
