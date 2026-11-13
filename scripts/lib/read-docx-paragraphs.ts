import fs from 'node:fs/promises';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

export async function readDocxParagraphs(filePath: string): Promise<string[]> {
  const buf = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file('word/document.xml')?.async('string');
  if (!xml) return [];

  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (name) => name === 'p' || name === 'r' || name === 't',
  });
  const doc = parser.parse(xml);
  const body = doc?.document?.body;
  if (!body) return [];

  const paragraphs = body.p ?? [];
  const lines: string[] = [];

  for (const p of paragraphs) {
    const runs = p.r ?? [];
    const text = runs
      .flatMap((r: { t?: unknown }) => {
        const t = r.t;
        if (typeof t === 'string') return [t];
        if (Array.isArray(t)) return t.map(String);
        if (t && typeof t === 'object' && '#text' in t)
          return [String((t as { '#text': string })['#text'])];
        return [];
      })
      .join('');
    if (text.trim()) lines.push(text);
  }

  return lines;
}
