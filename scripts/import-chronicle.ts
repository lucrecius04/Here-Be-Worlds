import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { postProcessChronicleMarkdown } from './lib/chronicle-md.js';

const ROOT = path.resolve(import.meta.dirname, '..');

const DEFAULT_CHRONICLES: { file: string; slug: string; title: string; worldId: string }[] = [
  {
    file: String.raw`C:\Users\PC\Downloads\Kronika_Mecoveho_pobrezi_BaldursGate.docx`,
    slug: 'baldurs-gate',
    title: 'Chronicle of the Sword Coast',
    worldId: 'baldurs-gate',
  },
  {
    file: String.raw`C:\Users\PC\Downloads\Kronika_Svatyne_Diablo.docx`,
    slug: 'diablo',
    title: 'Chronicle of the Sanctuary',
    worldId: 'diablo',
  },
];

async function firstExisting(paths: string[]): Promise<string | null> {
  for (const p of paths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function importOne(entry: (typeof DEFAULT_CHRONICLES)[0]) {
  let md: string;
  try {
    const result = await mammoth.convertToMarkdown({ path: entry.file });
    md = postProcessChronicleMarkdown(result.value);
    if (result.messages.length) {
      console.warn(`[${entry.slug}] mammoth messages:`, result.messages.length);
    }
  } catch (err) {
    console.warn(`[${entry.slug}] skipping DOCX (${entry.file}):`, err);
    md = `# ${entry.title}\n\n*Chronicle source file not found. Import with \`npm run import:chronicle\` when DOCX is available.*\n`;
  }

  const frontmatter = `---
title: ${entry.title}
worldId: ${entry.worldId}
language: cs
---

`;
  const outDir = path.join(ROOT, 'content', 'chronicles');
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${entry.slug}.md`);
  await fs.writeFile(outPath, frontmatter + md, 'utf8');
  console.log(`Wrote ${outPath}`);
}

async function main() {
  const darkSoulsPaths = [
    path.join(ROOT, 'source', 'Kronika_popela_Dark_Souls.docx'),
    String.raw`C:\Users\PC\Desktop\Herní brožurky\nove\Kronika_popela_Dark_Souls.docx`,
    String.raw`C:\Users\PC\Downloads\Kronika_popela_Dark_Souls.docx`,
  ];
  const darkSoulsFile = await firstExisting(darkSoulsPaths);
  if (darkSoulsFile) {
    await importOne({
      file: darkSoulsFile,
      slug: 'dark-souls',
      title: 'Chronicle of Ash',
      worldId: 'dark-souls',
    });
  } else {
    console.warn('Dark Souls chronicle DOCX not found; keeping existing dark-souls.md');
  }

  for (const entry of DEFAULT_CHRONICLES) {
    await importOne(entry);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
