/** Post-process mammoth Markdown output for HBW chronicles. */

const COLUMN_HEADER_LABELS = new Set(
  ['Dílo', 'Rok', 'Studio', 'Obsah', 'Věk / událost', 'Popis'].map((s) => s.toLowerCase()),
);

export function postProcessChronicleMarkdown(md: string): string {
  let out = md;

  out = out.replace(/!\[[^\]]*\]\(data:image[^)]+\)/g, '');
  out = out.replace(/\u25C6\s*\u25C6\s*\u25C6/g, '---');
  out = out.replace(/\\([.()])/g, '$1');

  out = out.replace(/^__([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ])__([a-záčďéěíňóřšťúůýž])/gm, '$1$2');

  out = stripPrintedFrontMatter(out);
  out = rebuildColumnTables(out);
  out = promoteBoldHeadings(out);
  out = out.replace(/^# __(.+?)__\s*$/gm, '## $1');
  out = normalizeHeadings(out);
  out = collapseBlankLines(out);

  return `${out.trim()}\n`;
}

function stripPrintedFrontMatter(md: string): string {
  const lines = md.split('\n');
  const cutIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    const bare = sectionTitle(t);
    if (/^obsah$/i.test(bare)) cutIndices.push(i);
    if (/^#\s*Kronika\s*$/i.test(t)) cutIndices.push(i);
    if (/^MEČOVÉHO POBŘEŽÍ$/i.test(bare)) cutIndices.push(i);
    if (/^POPELA$/i.test(bare)) cutIndices.push(i);
    if (/^SVATYNĚ$/i.test(bare)) cutIndices.push(i);
    if (/^\*Příběh světa/i.test(t)) cutIndices.push(i);
    if (/^Podle her, knih a oficiálních materiálů/i.test(t)) cutIndices.push(i);
    if (/^Neoficiální fanouškovská kronika/i.test(t)) cutIndices.push(i);
    if (/^\*od\s+.+\*$/i.test(t.trim()) && t.includes('po ')) cutIndices.push(i);
    if (/^\t\d+$/.test(lines[i]) || /\t\d+\s*$/.test(lines[i])) cutIndices.push(i);
    if (/^Kniha (první|druhá|třetí|čtvrtá|pátá|šestá)\s+/i.test(t) && /\t\d/.test(lines[i]))
      cutIndices.push(i);
    if (/^Část .+Kapitola .+\t\d/i.test(lines[i])) cutIndices.push(i);
    if (/^## Úvodem\t\d/i.test(lines[i])) cutIndices.push(i);
    if (/^## Epilog\s+.+\t\d/i.test(lines[i])) cutIndices.push(i);
    if (/^## Přílohy\t\d/i.test(lines[i])) cutIndices.push(i);
    if (/^Rozbor vyprávění\t\d/i.test(lines[i])) cutIndices.push(i);
    if (/^Úvodem\t\d/i.test(t)) cutIndices.push(i);
    if (/^Epilog\s+.+\t\d/i.test(t)) cutIndices.push(i);
    if (/^Přílohy\t\d/i.test(t)) cutIndices.push(i);
  }

  const remove = new Set(cutIndices);
  let filtered = lines.filter((_, i) => !remove.has(i));

  const start = filtered.findIndex(
    (l) =>
      /^##\s+Úvodem\s*$/i.test(l.trim()) ||
      /^##\s+Úvodem\b/i.test(l.trim()) ||
      /^#\s+__?Úvodem__?\s*$/i.test(l.trim()) ||
      /^__?Úvodem__?\s*$/i.test(l.trim()),
  );
  if (start > 0) {
    filtered = filtered.slice(start);
  } else {
    const kniha = filtered.findIndex((l) => /^##\s+Kniha\s+/i.test(l.trim()));
    if (kniha > 0) filtered = filtered.slice(kniha);
    else {
      const alt = filtered.findIndex((l) => /^KNIHA\s+PRVNÍ/i.test(l.trim()));
      if (alt > 0) filtered = filtered.slice(alt);
    }
  }

  return filtered.join('\n');
}

function promoteBoldHeadings(md: string): string {
  return md.replace(/^__([^_\n]+?)__\s*$/gm, (full, title: string) => {
    const bare = title.trim();
    if (COLUMN_HEADER_LABELS.has(bare.toLowerCase())) return full;
    return `## ${bare}`;
  });
}

function normalizeHeadings(md: string): string {
  let out = md;
  out = out.replace(/^KNIHA (PRVNÍ|DRUHÁ|TŘETÍ|ČTVRTÁ|PÁTÁ|ŠESTÁ|SEDMÁ|OSMÁ)\b/gim, (_, n: string) => `## Kniha ${n.toLowerCase()}`);
  out = out.replace(/^Část (první|druhá|třetí|čtvrtá)\s*·\s*Kapitola\s+(první|druhá|třetí|čtvrtá|pátá|šestá|sedmá|osmá)/gim, (m) => `## ${m}`);
  out = out.replace(/^\*{0,2}Úvodem\*{0,2}\s*$/gim, '## Úvodem');
  out = out.replace(/^Epilog\b/gim, '## Epilog');
  out = out.replace(/^Rozbor vyprávění\b/gim, '## Rozbor vyprávění');
  out = out.replace(/^Přílohy\b/gim, '## Přílohy');
  return out;
}

const TABLE_HEADERS: { title: RegExp; columns: string[]; width: number }[] = [
  {
    title: /^Hry a adaptace$/i,
    columns: ['Dílo', 'Rok', 'Studio', 'Obsah'],
    width: 4,
  },
  {
    title: /^Přehled věků$/i,
    columns: ['Věk / událost', 'Popis'],
    width: 2,
  },
];

function sectionTitle(line: string): string {
  return line.trim().replace(/^#+\s*/, '').replace(/^__|__$/g, '');
}

function rebuildColumnTables(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const bare = sectionTitle(lines[i]);
    const spec = TABLE_HEADERS.find((t) => t.title.test(bare));
    if (!spec) {
      out.push(lines[i]);
      continue;
    }

    out.push(`## ${bare}`);
    i += 1;
    let headersFound = 0;
    while (headersFound < spec.width) {
      i = skipBlankLines(lines, i);
      if (i >= lines.length || !isHeaderCell(lines[i], spec.columns)) break;
      headersFound += 1;
      i += 1;
    }

    const rows: string[][] = [];
    while (i < lines.length) {
      const cells: string[] = [];
      for (let c = 0; c < spec.width; c++) {
        i = skipBlankLines(lines, i);
        if (i >= lines.length) break;
        const cellLine = lines[i].trim();
        if (/^#+\s+/.test(cellLine) || /^KNIHA\s+/i.test(cellLine)) break;
        const cellBare = sectionTitle(cellLine);
        if (TABLE_HEADERS.some((t) => t.title.test(cellBare))) break;
        if (c === 0 && /^Rejstřík\b/i.test(cellBare)) break;
        cells.push(cleanCell(cellLine));
        i += 1;
      }
      if (cells.length < spec.width) break;
      rows.push(cells);
    }

    out.push('');
    out.push(`| ${spec.columns.join(' | ')} |`);
    out.push(`| ${spec.columns.map(() => '---').join(' | ')} |`);
    for (const r of rows) out.push(`| ${r.join(' | ')} |`);
    out.push('');
    i -= 1;
  }

  return out.join('\n');
}

function isHeaderCell(line: string, headers: string[]): boolean {
  const t = sectionTitle(line);
  return headers.some((h) => h.toLowerCase() === t.toLowerCase());
}

function cleanCell(line: string): string {
  return sectionTitle(line).replace(/\|/g, '\\|');
}

function skipBlankLines(lines: string[], index: number): number {
  while (index < lines.length && !lines[index].trim()) index += 1;
  return index;
}

function collapseBlankLines(md: string): string {
  return md.replace(/\n{4,}/g, '\n\n\n');
}
