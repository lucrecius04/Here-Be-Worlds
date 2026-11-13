import fs from 'node:fs/promises';
import path from 'node:path';
import { readDocxParagraphs } from './lib/read-docx-paragraphs.js';
import { worldsFileSchema, type World } from '../src/schemas/world.js';

const ROOT = path.resolve(import.meta.dirname, '..');

const CHAPTER_MAP: Record<string, string> = {
  'KAPITOLA PRVNÍ': 'fantasy',
  'KAPITOLA DRUHÁ': 'science-fiction',
  'KAPITOLA TŘETÍ': 'post-apocalypse',
  'KAPITOLA ČTVRTÁ': 'horror',
  'KAPITOLA PÁTÁ': 'historical',
  'KAPITOLA ŠESTÁ': 'dystopia',
  'KAPITOLA SEDMÁ': 'metaphysical',
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isWorldTitle(line: string): boolean {
  if (line.startsWith('KAPITOLA ') || line.startsWith('PŘÍLOHY')) return false;
  if (line.length < 3 || line.length > 50) return false;
  const letters = line.replace(/[^a-zA-ZÀ-ž]/g, '');
  if (!letters) return false;
  return line === line.toUpperCase() && /[A-Z]/.test(line);
}

function stubWorld(partial: {
  id: string;
  number: number;
  chapterId: string;
  gameTitle: string;
  chronicleLine?: string;
  canonScope?: string;
  bullets: string[];
}): World {
  const chronicleTitle = partial.chronicleLine?.split('·')[0]?.trim() ?? partial.gameTitle;
  return {
    id: partial.id,
    number: partial.number,
    chapterId: partial.chapterId,
    gameTitle: { en: partial.gameTitle, cs: partial.gameTitle },
    chronicleTitle: { en: chronicleTitle, cs: chronicleTitle },
    subtitlePoetic: { en: chronicleTitle, cs: chronicleTitle },
    studios: [],
    yearRange: '',
    canonScope: {
      en: partial.canonScope ?? 'TBD',
      cs: partial.canonScope ?? 'TBD',
    },
    draft: true,
    core: {
      en: partial.bullets[0] ?? 'Draft profile—complete metadata manually.',
      cs: partial.bullets[0] ?? 'Koncept karty — doplnit metadata.',
    },
    signatureBullets: partial.bullets.map((b) => ({ en: b, cs: b })),
    metadata: {
      genreProfile: { en: 'TBD', cs: 'TBD' },
      atmosphere: { en: 'TBD', cs: 'TBD' },
      spatialScope: { en: 'TBD', cs: 'TBD' },
      historicalDepth: { en: 'TBD', cs: 'TBD' },
      societalOrder: { en: 'TBD', cs: 'TBD' },
      sourceOfPower: { en: 'TBD', cs: 'TBD' },
      protagonistPerspective: { en: 'TBD', cs: 'TBD' },
      keyActors: { en: 'TBD', cs: 'TBD' },
    },
    themes: [],
    axes: {
      hopeDespair: { value: 3, comment: { en: 'TBD', cs: 'TBD' } },
      knownUnknown: { value: 3, comment: { en: 'TBD', cs: 'TBD' } },
      intimateEpic: { value: 3, comment: { en: 'TBD', cs: 'TBD' } },
      moralClarityAmbiguity: { value: 3, comment: { en: 'TBD', cs: 'TBD' } },
      realismMetaphysical: { value: 3, comment: { en: 'TBD', cs: 'TBD' } },
    },
    triad: {
      originalSin: { en: 'TBD', cs: 'TBD' },
      centralDilemma: { en: 'TBD', cs: 'TBD' },
      ultimateMystery: { en: 'TBD', cs: 'TBD' },
    },
    chronicleSlug: partial.id,
  };
}

async function parseAtlas(filePath: string): Promise<World[]> {
  const lines = await readDocxParagraphs(filePath);
  let chapterId = 'fantasy';
  const worlds: World[] = [];
  let i = 0;
  let number = 0;

  while (i < lines.length) {
    const line = lines[i];
    for (const [key, id] of Object.entries(CHAPTER_MAP)) {
      if (line.startsWith(key)) chapterId = id;
    }
    if (line.startsWith('PŘÍLOHY')) break;

    if (isWorldTitle(line)) {
      number += 1;
      const gameTitle = line.trim();
      const id = slugify(gameTitle);
      const metaLine = lines[i + 1] ?? '';
      let canonScope: string | undefined;
      const bullets: string[] = [];
      let j = i + 1;
      for (; j < lines.length && j < i + 40; j++) {
        const l = lines[j];
        if (isWorldTitle(l) && j > i + 1) break;
        if (l.startsWith('KAPITOLA ')) break;
        if (/^(RO|Záběr|Rozsah) kánonu/i.test(l)) {
          canonScope = l.replace(/^[^:]+:\s*/i, '').trim() || l.split(/\s{2,}/).pop()?.trim();
        }
        if (l.startsWith('▪')) bullets.push(l.replace(/^▪\s*/, '').trim());
      }

      worlds.push(
        stubWorld({
          id,
          number,
          chapterId,
          gameTitle,
          chronicleLine: metaLine,
          canonScope,
          bullets,
        }),
      );
      i = j;
      continue;
    }
    i += 1;
  }

  return worlds;
}

async function main() {
  const atlasPath =
    process.argv[2] ??
    String.raw`C:\Users\PC\Downloads\Atlas_hernich_svetu_v2_3 - toto poslat claude.docx`;
  const worlds = await parseAtlas(atlasPath);
  const draftPath = path.join(ROOT, 'data', 'worlds.draft.json');
  const payload = { worlds };
  worldsFileSchema.parse(payload);
  await fs.writeFile(draftPath, JSON.stringify(payload, null, 2), 'utf8');
  const reportPath = path.join(ROOT, 'data', 'import-atlas-report.txt');
  const report = `Parsed ${worlds.length} world stubs from atlas.\nDraft fields marked TBD require editorial completion.\n`;
  await fs.writeFile(reportPath, report, 'utf8');
  console.log(report.trim());
  console.log(`Wrote ${draftPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
