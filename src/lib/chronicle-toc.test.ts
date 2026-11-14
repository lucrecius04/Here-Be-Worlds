import { describe, expect, it } from 'vitest';
import {
  extractChronicleToc,
  findAnalysisHeadingId,
  splitChronicleMarkdown,
} from './chronicle-toc';

describe('extractChronicleToc', () => {
  it('keeps books with titles, then epilog, appendices and analysis', () => {
    const md = `
## Úvodem
KNIHA PRVNÍ
## Tři prastaré hříchy
## 1. Vzpoura v Astrální sféře
KNIHA DRUHÁ
## Čas nesnází
## Epilog
## Odkaz
## Přílohy
## Rok (DR)
## Rozbor vyprávění
## __1. Ústřední otázka světa__
`;
    const toc = extractChronicleToc(md);
    expect(toc.map((e) => [e.label, e.title ?? ''])).toEqual([
      ['Úvodem', ''],
      ['Kniha první', 'Tři prastaré hříchy'],
      ['Kniha druhá', 'Čas nesnází'],
      ['Epilog', ''],
    ]);
    expect(toc.map((e) => e.id)).toEqual(['uvodem', 'kniha-prvni', 'kniha-druha', 'epilog']);
  });

  it('uses Dark Souls book labels without Část', () => {
    const md = `
## KNIHA PRVNÍ
## Věk prastarých a První plamen
## JAK SE TO VYKLÁDÁ
## KNIHA DRUHÁ
## První hřích a Kletba
## Epilog
## Přílohy
## Rozbor vyprávění
`;
    expect(extractChronicleToc(md).map((e) => `${e.label} · ${e.title ?? ''}`)).toEqual([
      'Kniha první · Věk prastarých a První plamen',
      'Kniha druhá · První hřích a Kletba',
      'Epilog · ',
    ]);
  });

  it('splits narrative from appendices and analysis', () => {
    const parts = splitChronicleMarkdown(`## Úvodem
text
## Epilog
## Přílohy
tabulka
## Rozbor vyprávění
otázka
`);
    expect(parts.narrative).toContain('Úvodem');
    expect(parts.narrative).not.toContain('Přílohy');
    expect(parts.appendices.startsWith('## Přílohy')).toBe(true);
    expect(parts.analysis.startsWith('## Rozbor vyprávění')).toBe(true);
  });
});

describe('findAnalysisHeadingId', () => {
  it('maps the triad tiles to analysis headings', () => {
    const md = `## Rozbor vyprávění
## __1. Ústřední otázka světa__
text
## __2. Prvotní hřích, z něhož svět vychází__
text
## __4. Nosná mezera (co zůstává otevřené a výklady)__
text
`;
    expect(findAnalysisHeadingId(md, 'centralDilemma')).toBe('1-ustredni-otazka-sveta');
    expect(findAnalysisHeadingId(md, 'originalSin')).toBe(
      '2-prvotni-hrich-z-nehoz-svet-vychazi',
    );
    expect(findAnalysisHeadingId(md, 'ultimateMystery')).toBe(
      '4-nosna-mezera-co-zustava-otevrene-a-vyklady',
    );
  });
});
