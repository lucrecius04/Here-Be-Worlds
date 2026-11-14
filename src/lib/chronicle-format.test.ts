import { describe, expect, it } from 'vitest';
import {
  classifyChronicleHeading,
  formatChronicleMarkdown,
  renamedPartHeading,
  splitCoverTitle,
} from './chronicle-format';

describe('classifyChronicleHeading', () => {
  it('recognizes book labels, interpretations and numbered sections', () => {
    expect(classifyChronicleHeading('KNIHA PRVNÍ')).toBe('book');
    expect(classifyChronicleHeading('ČÁST PRVNÍ · KAPITOLA DRUHÁ')).toBe('book');
    expect(classifyChronicleHeading('KNIHA PRVNÍ')).toBe('book');
    expect(classifyChronicleHeading('JAK SE TO VYKLÁDÁ')).toBe('interpret');
    expect(classifyChronicleHeading('1. Ústřední otázka světa')).toBe('numbered');
    expect(classifyChronicleHeading('Úvodem')).toBe('part');
    expect(classifyChronicleHeading('Přílohy')).toBe('part');
    expect(classifyChronicleHeading('Rozbor vyprávění')).toBe('part');
    expect(classifyChronicleHeading('Faktografie')).toBe('part');
    expect(classifyChronicleHeading('Anatomie vyprávění')).toBe('part');
    expect(classifyChronicleHeading('Zdroje a literatura')).toBe('sources');
    expect(classifyChronicleHeading('Tři prastaré hříchy')).toBe('chapter');
  });

  it('renames appendix and analysis headings for display', () => {
    expect(renamedPartHeading('Přílohy')).toBe('appendices');
    expect(renamedPartHeading('Rozbor vyprávění')).toBe('analysis');
    expect(renamedPartHeading('Úvodem')).toBe(null);
  });
});

describe('formatChronicleMarkdown', () => {
  it('rebuilds a three-column appendix table from heading cells', () => {
    const md = `## Kompletní časová osa
## Rok (DR)
## Událost
## Dopad na historii světa
## Před věky
Pád říše Illithidů.

Zrození rasy Githyanki.

## −339 DR
Karsova pošetilost.

Zákaz magie.

*Graf 1: milníky*
`;
    const out = formatChronicleMarkdown(md);
    expect(out).toContain('| Rok (DR) | Událost | Dopad na historii světa |');
    expect(out).toContain('| Před věky | Pád říše Illithidů. | Zrození rasy Githyanki. |');
    expect(out).toContain('| −339 DR | Karsova pošetilost. | Zákaz magie. |');
    expect(out).not.toContain('*Graf 1: milníky*');
    expect(out).toContain('## Kompletní časová osa');
  });

  it('repairs broken bold leads from Word export', () => {
    const out = formatChronicleMarkdown(
      '__*Kdo je ve skutečnosti Withers (Kostlivec v táboře)?*__* V Baldur\'s Gate 3 najde družina Witherse.*',
    );
    expect(out).toContain('**Kdo je ve skutečnosti Withers (Kostlivec v táboře)?**');
    expect(out).toContain("V Baldur's Gate 3 najde družina Witherse.");
    expect(out).not.toContain('__*');
  });

  it('splits cover titles into Kronika + name', () => {
    expect(splitCoverTitle('Kronika Mečového pobřeží')).toEqual({
      kicker: 'Kronika',
      name: 'Mečového pobřeží',
    });
    expect(splitCoverTitle('Kronika Popela')).toEqual({ kicker: 'Kronika', name: 'Popela' });
  });

  it('does not swallow an existing markdown table as appendix cells', () => {
    const md = `## Frakce
## Podstata
## Kdo ji zastupuje
## Mrtvá trojice
Bohové tyranie.

Kulty.

## Hry a adaptace

| Dílo | Rok | Studio | Obsah |
| --- | --- | --- | --- |
| Baldur's Gate | 1998 | BioWare | Železná krize |
`;
    const out = formatChronicleMarkdown(md);
    expect(out).toContain('| Mrtvá trojice | Bohové tyranie. | Kulty. |');
    expect(out).toContain('## Hry a adaptace');
    expect(out).toContain('| Dílo | Rok | Studio | Obsah |');
    expect(out).toContain('| Baldur\'s Gate | 1998 | BioWare | Železná krize |');
  });

  it('rebuilds a two-column glossary', () => {
    const md = `## Slovníček pojmů světa
## Výraz
## Význam
## DR (Údolní letopočet)
Letopočet Faerûnu.

## Tiefling
Člověk s ďábelskou krví.
`;
    const out = formatChronicleMarkdown(md);
    expect(out).toContain('| Výraz | Význam |');
    expect(out).toContain('| DR (Údolní letopočet) | Letopočet Faerûnu. |');
    expect(out).toContain('| Tiefling | Člověk s ďábelskou krví. |');
  });
});
