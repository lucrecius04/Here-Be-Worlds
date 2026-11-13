import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import { postProcessChronicleMarkdown } from './lib/chronicle-md.js';

const ROOT = path.resolve(import.meta.dirname, '..');

function bodyText(md: string): string {
  const noFm = md.replace(/^---[\s\S]*?---\n+/m, '');
  return noFm
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/^---+$/gm, '')
    .replace(/\\([.()])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const chronicles: { slug: string; docxPaths: string[] }[] = [
  {
    slug: 'baldurs-gate',
    docxPaths: [
      String.raw`C:\Users\PC\Desktop\Herní brožurky\nove\Kronika_Mecoveho_pobrezi_BaldursGate.docx`,
      String.raw`C:\Users\PC\Downloads\Kronika_Mecoveho_pobrezi_BaldursGate.docx`,
    ],
  },
  {
    slug: 'dark-souls',
    docxPaths: [
      String.raw`C:\Users\PC\Desktop\Herní brožurky\nove\Kronika_popela_Dark_Souls.docx`,
      String.raw`C:\Users\PC\Downloads\Kronika_popela_Dark_Souls.docx`,
    ],
  },
  {
    slug: 'diablo',
    docxPaths: [
      String.raw`C:\Users\PC\Desktop\Herní brožurky\nove\Kronika_Svatyne_Diablo.docx`,
      String.raw`C:\Users\PC\Downloads\Kronika_Svatyne_Diablo.docx`,
    ],
  },
];

async function firstExisting(paths: string[]) {
  for (const p of paths) {
    try {
      await fs.access(p);
      return p;
    } catch {
      /* next */
    }
  }
  return null;
}

for (const { slug, docxPaths } of chronicles) {
  const docx = await firstExisting(docxPaths);
  if (!docx) {
    console.log(`[${slug}] DOCX not found`);
    continue;
  }
  const mdPath = path.join(ROOT, 'content', 'chronicles', `${slug}.md`);
  const onDisk = await fs.readFile(mdPath, 'utf8');
  const fromDocx = postProcessChronicleMarkdown(
    (await mammoth.convertToMarkdown({ path: docx })).value,
  );

  const diskBody = onDisk.replace(/^---[\s\S]*?---\n+/m, '').trim();
  const freshBody = fromDocx.trim();

  console.log(`\n[${slug}] ${docx.split('\\').pop()}`);
  if (freshBody === diskBody) {
    console.log('  OK: on-disk MD matches post-processed DOCX (formatting-only pipeline)');
    continue;
  }

  const a = bodyText(fromDocx);
  const b = bodyText(onDisk);

  const minLen = Math.min(a.length, b.length);
  let i = 0;
  for (; i < minLen; i++) {
    if (a[i] !== b[i]) break;
  }
  console.log(`  MISMATCH at char ${i} (docxLen=${a.length} mdLen=${b.length})`);
  console.log(`  docx: …${a.slice(Math.max(0, i - 30), i + 60)}…`);
  console.log(`  md:   …${b.slice(Math.max(0, i - 30), i + 60)}…`);
}
