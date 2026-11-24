import { describe, expect, it } from 'vitest';
import { worlds } from './worlds';
import { THEMES, neighbourThemes, themeBySlugPage, themePageSlug } from './themes';

describe('stránky témat', () => {
  it('každé téma má jedinečnou českou adresu bez diakritiky', () => {
    const slugs = THEMES.map((th) => themePageSlug(th.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(themePageSlug('death-and-immortality')).toBe('smrt-a-nesmrtelnost');
    expect(themeBySlugPage('vira')?.slug).toBe('faith');
  });

  it('každé téma má otázku v obou jazycích', () => {
    for (const th of THEMES) {
      expect(th.question.cs?.endsWith('?')).toBe(true);
      expect(th.question.en.endsWith('?')).toBe(true);
    }
  });

  it('témata světů existují v taxonomii', () => {
    const known = new Set(THEMES.map((th) => th.slug));
    for (const w of worlds) for (const th of w.themes) expect(known.has(th), `${w.id}: ${th}`).toBe(true);
  });

  it('sousední témata počítají sdílené světy', () => {
    const published = worlds.filter((w) => !w.draft);
    const [first] = neighbourThemes('gods', published);
    const both = published.filter((w) => w.themes.includes('gods') && w.themes.includes(first.slug)).length;
    expect(first.shared).toBe(both);
  });
});
