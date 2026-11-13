export type ChronicleTocEntry = {
  id: string;
  label: string;
  title?: string;
  kind?: 'book' | 'section';
};

const ORD = 'první|druhá|třetí|čtvrtá|pátá|šestá|sedmá|osmá|devátá|desátá';
const ORD_U = 'PRVNÍ|DRUHÁ|TŘETÍ|ČTVRTÁ|PÁTÁ|ŠESTÁ|SEDMÁ|OSMÁ|DEVÁTÁ|DESÁTÁ';

export function slugifyChronicleHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function cleanHeading(text: string): string {
  return text.replace(/^__+|__+$/g, '').replace(/\*\*/g, '').trim();
}

function headingText(line: string): string | null {
  const m = /^(#{1,6})\s+(.+)$/.exec(line.trim());
  if (!m) return null;
  return cleanHeading(m[2]);
}

export function parseBookLabel(line: string): string | null {
  const t = line.trim().replace(/^#{1,6}\s+/, '');
  const kniha = new RegExp(`^KNIHA\\s+(${ORD_U})(?:\\s|$)`, 'i').exec(t);
  if (kniha) return `Kniha ${kniha[1].toLowerCase()}`;
  const knihaCs = new RegExp(`^Kniha\\s+(${ORD})(?:\\s|$)`, 'i').exec(t);
  if (knihaCs) return `Kniha ${knihaCs[1].toLowerCase()}`;
  const cast = new RegExp(
    `^ČÁST\\s+(${ORD_U})\\s*·\\s*KAPITOLA\\s+(${ORD_U})`,
    'i',
  ).exec(t);
  if (cast) return `Část ${cast[1].toLowerCase()} · Kapitola ${cast[2].toLowerCase()}`;
  const castCs = new RegExp(`^Část\\s+(${ORD})\\s*·\\s*Kapitola\\s+(${ORD})`, 'i').exec(t);
  if (castCs) return `Část ${castCs[1].toLowerCase()} · Kapitola ${castCs[2].toLowerCase()}`;
  return null;
}

function isChapterTitle(text: string): boolean {
  if (/^\d+\.\s/.test(text)) return false;
  if (/^jak se to vykládá$/i.test(text)) return false;
  if (/^úvodem$/i.test(text)) return false;
  if (/^(epilog|přílohy|rozbor vyprávění)(?:\s|$)/i.test(text)) return false;
  return true;
}

export function extractChronicleToc(markdown: string): ChronicleTocEntry[] {
  const entries: ChronicleTocEntry[] = [];
  let pendingBook: string | null = null;
  let hasIntro = false;

  const flushBook = () => {
    if (!pendingBook) return;
    entries.push({
      id: slugifyChronicleHeading(pendingBook),
      label: pendingBook,
      kind: 'book',
    });
    pendingBook = null;
  };

  for (const raw of markdown.split('\n')) {
    const book = parseBookLabel(raw);
    if (book) {
      flushBook();
      pendingBook = book;
      continue;
    }

    const heading = headingText(raw);
    if (!heading) continue;

    if (/^Úvodem(?:\s|$)/i.test(heading)) {
      hasIntro = true;
      continue;
    }
    if (/^Epilog(?:\s|$)/i.test(heading)) {
      flushBook();
      entries.push({ id: slugifyChronicleHeading('Epilog'), label: 'Epilog', kind: 'section' });
      continue;
    }
    if (/^Přílohy(?:\s|$)/i.test(heading)) break;
    if (/^Rozbor vyprávění(?:\s|$)/i.test(heading)) break;

    if (pendingBook && isChapterTitle(heading)) {
      entries.push({
        id: slugifyChronicleHeading(heading),
        label: pendingBook,
        title: heading,
        kind: 'book',
      });
      pendingBook = null;
    }
  }

  flushBook();
  if (hasIntro) {
    entries.unshift({
      id: slugifyChronicleHeading('Úvodem'),
      label: 'Úvodem',
      kind: 'section',
    });
  }
  return entries;
}

export function splitChronicleMarkdown(markdown: string): {
  narrative: string;
  appendices: string;
  analysis: string;
} {
  const lines = markdown.split('\n');
  let appendicesAt = -1;
  let analysisAt = -1;

  for (let i = 0; i < lines.length; i++) {
    const heading = headingText(lines[i]);
    if (!heading) continue;
    if (appendicesAt < 0 && /^Přílohy(?:\s|$)/i.test(heading)) appendicesAt = i;
    if (analysisAt < 0 && /^Rozbor vyprávění(?:\s|$)/i.test(heading)) analysisAt = i;
  }

  const endNarrative =
    appendicesAt >= 0 ? appendicesAt : analysisAt >= 0 ? analysisAt : lines.length;
  const narrative = lines.slice(0, endNarrative).join('\n').trim();

  if (appendicesAt >= 0) {
    const endAppendices = analysisAt >= 0 ? analysisAt : lines.length;
    return {
      narrative,
      appendices: lines.slice(appendicesAt, endAppendices).join('\n').trim(),
      analysis: analysisAt >= 0 ? lines.slice(analysisAt).join('\n').trim() : '',
    };
  }

  return {
    narrative,
    appendices: '',
    analysis: analysisAt >= 0 ? lines.slice(analysisAt).join('\n').trim() : '',
  };
}
