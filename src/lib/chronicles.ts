/** Lazy-load chronicle Markdown so world pages stay light until Kronika tab. */

export type ChronicleDoc = {
  markdown: string;
  coverTitle?: string;
  coverTagline?: string;
  coverRange?: string;
};

function grabMeta(raw: string, key: string): string | undefined {
  const m = new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(raw);
  return m?.[1]?.replace(/^["']|["']$/g, '').trim();
}

function parseChronicleRaw(raw: string): ChronicleDoc {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  if (!match) {
    return {
      markdown: raw.trim(),
      coverTitle: grabMeta(raw, 'coverTitle'),
      coverTagline: grabMeta(raw, 'coverTagline'),
      coverRange: grabMeta(raw, 'coverRange'),
    };
  }

  const block = match[1];
  return {
    markdown: raw.slice(match[0].length).trim(),
    coverTitle: grabMeta(block, 'coverTitle'),
    coverTagline: grabMeta(block, 'coverTagline'),
    coverRange: grabMeta(block, 'coverRange'),
  };
}

const COVER_RANGE: Record<string, string> = {
  'baldurs-gate': 'od pádu Netherilu po Starší mozek',
  'dark-souls': 'svět, který se bál tmy',
  diablo: 'od stvoření vesmíru po konec věku nenávisti',
};

/** Všechny kroniky ve složce content/chronicles se načtou samy — nový svět nepotřebuje zásah do kódu. */
const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

export async function loadChronicleMarkdown(slug: string): Promise<ChronicleDoc> {
  const loader = CHRONICLES[`../../content/chronicles/${slug}.md`];
  if (!loader) return { markdown: '' };
  const raw = await loader();
  const parsed = parseChronicleRaw(raw);
  return {
    ...parsed,
    coverRange: parsed.coverRange || COVER_RANGE[slug],
  };
}
