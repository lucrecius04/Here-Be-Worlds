export function postProcessChronicleMarkdown(md: string): string {
  let out = md;
  out = out.replace(/\u25C6\s*\u25C6\s*\u25C6/g, '---');
  out = out.replace(/^KRONIKA\s*$/gm, '# Kronika');
  out = out.replace(
    /^KNIHA (PRVNÍ|DRUHÁ|TŘETÍ|ČTVRTÁ|PÁTÁ|ŠESTÁ|SEDMÁ|OSMÁ)\b/gim,
    (_, n: string) => `## Kniha ${n.toLowerCase()}`,
  );
  out = out.replace(/^Epilog\b/gim, '## Epilog');
  out = out.replace(/^Úvodem\b/gim, '## Úvodem');
  out = out.replace(/^Rozbor vyprávění\b/gim, '## Rozbor vyprávění');
  out = out.replace(/^Přílohy\b/gim, '## Přílohy');
  out = out.replace(/^Obsah\s*$/gm, '');
  return `${out.trim()}\n`;
}
