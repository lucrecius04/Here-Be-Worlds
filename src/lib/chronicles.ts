/** Lazy-load chronicle Markdown so world pages stay light until Kronika tab. */

export type ChronicleDoc = {
  markdown: string;
  coverTitle?: string;
  coverTagline?: string;
  coverRange?: string;
};

function parseChronicleRaw(raw: string): ChronicleDoc {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  if (!match) return { markdown: raw.trim() };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep < 0) continue;
    meta[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }

  return {
    markdown: raw.slice(match[0].length).trim(),
    coverTitle: meta.coverTitle,
    coverTagline: meta.coverTagline,
    coverRange: meta.coverRange,
  };
}

export async function loadChronicleMarkdown(slug: string): Promise<ChronicleDoc> {
  let raw: string;
  switch (slug) {
    case 'baldurs-gate':
      raw = (await import('../../content/chronicles/baldurs-gate.md?raw')).default;
      break;
    case 'dark-souls':
      raw = (await import('../../content/chronicles/dark-souls.md?raw')).default;
      break;
    case 'diablo':
      raw = (await import('../../content/chronicles/diablo.md?raw')).default;
      break;
    default:
      return { markdown: '' };
  }
  return parseChronicleRaw(raw);
}
