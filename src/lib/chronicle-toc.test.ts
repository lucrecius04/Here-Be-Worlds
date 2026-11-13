import { describe, expect, it } from 'vitest';
import { extractChronicleToc, splitChronicleMarkdown } from './chronicle-toc';

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
    expect(extractChronicleToc(md).map((e) => [e.label, e.title ?? ''])).toEqual([
      ['Úvodem', ''],
      ['Kniha první', 'Tři prastaré hříchy'],
      ['Kniha druhá', 'Čas nesnází'],
      ['Epilog', ''],
    ]);
  });

  it('uses Dark Souls part/chapter labels with their titles', () => {
    const md = `
## ČÁST PRVNÍ · KAPITOLA PRVNÍ
## Věk prastarých a První plamen
## JAK SE TO VYKLÁDÁ
## ČÁST PRVNÍ · KAPITOLA DRUHÁ
## První hřích a Kletba
## Epilog
## Přílohy
## Rozbor vyprávění
`;
    expect(extractChronicleToc(md).map((e) => `${e.label} · ${e.title ?? ''}`)).toEqual([
      'Část první · Kapitola první · Věk prastarých a První plamen',
      'Část první · Kapitola druhá · První hřích a Kletba',
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
