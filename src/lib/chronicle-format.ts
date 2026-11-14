import { parseBookLabel } from './chronicle-toc';

export type ChronicleHeadingKind = 'book' | 'interpret' | 'numbered' | 'part' | 'chapter' | 'sources';

const HEADER_SETS: string[][] = [
  ['Rok (DR)', 'Událost', 'Dopad na historii světa'],
  ['Období / rok', 'Událost', 'Klíčové postavy'],
  ['Název postavy', 'Duše a podstata', 'Osud v příběhu'],
  ['Jméno', 'Postavení', 'Role v ságách'],
  ['Titul', 'Vydání', 'Rok děje', 'Jádro příběhu'],
  ['Frakce', 'Podstata', 'Kdo ji zastupuje'],
  ['Jméno', 'Kdo nebo co to je'],
  ['Jméno', 'Kdo to je'],
  ['Název', 'Co to je'],
  ['Výraz', 'Význam'],
  ['Období', 'Událost'],
].sort((a, b) => b.length - a.length);

const PART_HEADING =
  /^(úvodem|epilog|přílohy|faktografie|rozbor vyprávění|anatomie vyprávění)(?:\s|$)/i;

export function renamedPartHeading(text: string): 'appendices' | 'analysis' | null {
  const bare = text.replace(/^__+|__+$/g, '').replace(/\*\*/g, '').trim();
  if (/^(přílohy|faktografie)(?:\s|$)/i.test(bare)) return 'appendices';
  if (/^(rozbor vyprávění|anatomie vyprávění)(?:\s|$)/i.test(bare)) return 'analysis';
  return null;
}

export function classifyChronicleHeading(text: string): ChronicleHeadingKind {
  const bare = cleanHeading(text);
  if (parseBookLabel(bare) || parseBookLabel(text)) return 'book';
  if (/^jak se to vykládá$/i.test(bare)) return 'interpret';
  if (/^zdroje a literatura$/i.test(bare)) return 'sources';
  if (PART_HEADING.test(bare)) return 'part';
  if (/^\d+\.\s/.test(bare)) return 'numbered';
  return 'chapter';
}

export function splitCoverTitle(title: string): { kicker: string; name: string } {
  const m = /^(Kronika)\s+(.+)$/i.exec(title.trim());
  if (m) return { kicker: m[1], name: m[2] };
  return { kicker: '', name: title.trim() };
}

export function formatChronicleMarkdown(markdown: string): string {
  return rebuildHeadingTables(stripFigureCaptions(repairChronicleEmphasis(markdown)));
}

function repairChronicleEmphasis(md: string): string {
  let out = md;
  out = out.replace(/^(#{1,6})\s+__([^_\n]+?)__\s*$/gm, '$1 $2');
  out = out.replace(/^(__|\*\*)\*(.+?)\*(__|\*\*)\*(\s*)/gm, '**$2**$4');
  out = out.replace(/^(\*\*[^*]+\*\*[^*]*)\*$/gm, '$1');
  return out;
}

function stripFigureCaptions(md: string): string {
  return md
    .split('\n')
    .filter((line) => !/^\*(Schéma|Graf)\s+\d+:/i.test(line.trim()))
    .join('\n');
}

function rebuildHeadingTables(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = matchHeaderSet(lines, i);
    if (match) {
      const collected = collectRows(lines, match.end, match.headers.length);
      if (collected.rows.length > 0) {
        out.push('');
        out.push(`| ${match.headers.join(' | ')} |`);
        out.push(`| ${match.headers.map(() => '---').join(' | ')} |`);
        for (const row of collected.rows) {
          out.push(`| ${row.map(escapeCell).join(' | ')} |`);
        }
        out.push('');
        i = collected.end - 1;
        continue;
      }
    }
    out.push(lines[i]);
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function matchHeaderSet(
  lines: string[],
  start: number,
): { headers: string[]; end: number } | null {
  for (const headers of HEADER_SETS) {
    let i = start;
    let ok = true;
    for (const expected of headers) {
      i = skipBlank(lines, i);
      const heading = headingLine(lines[i] ?? '');
      if (!heading || norm(heading) !== norm(expected)) {
        ok = false;
        break;
      }
      i += 1;
    }
    if (ok) return { headers, end: i };
  }
  return null;
}

function collectRows(
  lines: string[],
  start: number,
  width: number,
): { rows: string[][]; end: number } {
  const rows: string[][] = [];
  let i = start;

  while (i < lines.length) {
    i = skipBlank(lines, i);
    if (i >= lines.length) break;
    if (isBreakLine(lines[i]) || matchHeaderSet(lines, i)) break;

    const key = headingLine(lines[i]);
    if (!key) break;

    const cells = [cleanCellText(key)];
    let j = i + 1;
    while (cells.length < width) {
      j = skipBlank(lines, j);
      if (j >= lines.length) break;
      if (headingLine(lines[j]) || isBreakLine(lines[j]) || matchHeaderSet(lines, j)) break;
      cells.push(cleanCellText(lines[j]));
      j += 1;
    }
    if (cells.length < width) break;
    rows.push(cells);
    i = j;
  }

  return { rows, end: i };
}

function headingLine(line: string): string | null {
  const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
  if (!m) return null;
  return cleanHeading(m[2]);
}

function cleanHeading(text: string): string {
  return text
    .replace(/^__+|__+$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\\([.+])/g, '$1')
    .trim();
}

function cleanCellText(text: string): string {
  return text
    .replace(/^#{1,6}\s+/, '')
    .replace(/^__+|__+$/g, '')
    .replace(/\\([.+])/g, '$1')
    .trim();
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function skipBlank(lines: string[], index: number): number {
  let i = index;
  while (i < lines.length && !lines[i].trim()) i += 1;
  return i;
}

function isBreakLine(line: string): boolean {
  const t = line.trim();
  if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) return true;
  if (/^\*(Schéma|Graf)\b/i.test(t)) return true;
  if (t.startsWith('|')) return true;
  return false;
}

function norm(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}
