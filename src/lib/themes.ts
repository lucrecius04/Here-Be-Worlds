/**
 * Stránky témat (/temata/, /temata/<slug>/): české adresy, světy tématu a sousední témata.
 * Témata jsou slugy z data/meta/theme-taxonomy.json (`question` = otázka v hlavičce stránky).
 * Sousední témata = jak často se dvě témata potkávají ve stejném světě (počet sdílených světů);
 * to není příbuznost světů, tu počítá jen compare.ts.
 */
import type { World } from '../schemas/world';
import themesData from '../../data/meta/theme-taxonomy.json';

export type ThemeDef = (typeof themesData.themes)[number];

export const THEMES: ThemeDef[] = themesData.themes;

/** Česká adresa tématu: název bez diakritiky (Smrt a nesmrtelnost → smrt-a-nesmrtelnost). */
export function themePageSlug(slug: string): string {
  const theme = THEMES.find((th) => th.slug === slug);
  const label = theme?.label.cs ?? theme?.label.en ?? slug;
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export const THEMES_PATH = '/temata/';
export const themePath = (slug: string) => `${THEMES_PATH}${themePageSlug(slug)}/`;

export function themeBySlugPage(pageSlug: string): ThemeDef | undefined {
  return THEMES.find((th) => themePageSlug(th.slug) === pageSlug);
}

/** Témata, která se s daným tématem potkávají ve stejných světech, nejčastější první. */
export function neighbourThemes(slug: string, worlds: World[]): Array<{ slug: string; shared: number }> {
  const own = worlds.filter((w) => w.themes.includes(slug));
  const counts = new Map<string, number>();
  for (const w of own) for (const other of w.themes) if (other !== slug) counts.set(other, (counts.get(other) ?? 0) + 1);
  const size = (s: string) => worlds.filter((w) => w.themes.includes(s)).length;
  return [...counts.entries()]
    .map(([s, shared]) => ({ slug: s, shared, jaccard: shared / (own.length + size(s) - shared) }))
    .sort((a, b) => b.shared - a.shared || b.jaccard - a.jaccard || a.slug.localeCompare(b.slug))
    .map(({ slug: s, shared }) => ({ slug: s, shared }));
}

/** Matice potkávání témat: pro každou dvojici počet světů, ve kterých se potkávají obě. */
export function themeMatrix(slugs: string[], worlds: World[]): number[][] {
  return slugs.map((a) => slugs.map((b) => (a === b ? 0 : worlds.filter((w) => w.themes.includes(a) && w.themes.includes(b)).length)));
}
