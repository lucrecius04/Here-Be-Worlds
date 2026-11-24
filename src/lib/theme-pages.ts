/**
 * Podklady stránek témat, skládané při sestavení (/temata/ a /temata/<slug>/).
 * Obloha se počítá tady (buildSky), aby stránka nevozila celý katalog.
 */
import type { LocalizedString, World } from '../schemas/world';
import { worlds, chapters } from './worlds';
import { AXIS_KEYS } from './axes';
import { axisSpread, type AxisSpread } from './chapter-portrait';
import { buildSky, windingPath } from './sky';
import { TRAILS, trailSlug } from './trails';
import { publishedEssayFor } from './trail-pages';
import { trailImages, type TrailImage } from './trail-images';
import { THEMES, neighbourThemes, themeMatrix, themePageSlug, type ThemeDef } from './themes';

type Accent = { light: string; dark: string };

const SHORT: Record<string, LocalizedString> = {
  fantasy: { cs: 'Fantasy', en: 'Fantasy' },
  'science-fiction': { cs: 'Sci-fi', en: 'Sci-fi' },
  'post-apocalypse': { cs: 'Postapokalypsa', en: 'Post-apocalypse' },
  horror: { cs: 'Horor', en: 'Horror' },
  dystopia: { cs: 'Dystopie', en: 'Dystopia' },
  historical: { cs: 'Historie', en: 'Historical' },
  metaphysical: { cs: 'Metafyzika', en: 'Metaphysical' },
};

export type ThemeChapter = { id: string; short: LocalizedString; accent: Accent; total: number };
export type ThemeWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: Accent;
  genre: LocalizedString;
  core: LocalizedString;
};
export type ThemeLink = { slug: string; page: string; label: LocalizedString };
export type ThemeJourney = {
  id: string;
  slug: string;
  nameKey: string;
  descKey: string;
  tagline?: string;
  minutes: number | null;
  members: Array<{ id: string; title: LocalizedString; accent: Accent }>;
  image?: TrailImage;
};
export type ThemeSkyData = {
  height: number;
  stars: Array<{ id: string; x: number; y: number; size: number; accent: Accent; title: LocalizedString; lit: boolean }>;
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  route: Array<[number, number]>;
  groups: Array<{ id: string; x: number; y: number; label: LocalizedString }>;
};

const published = worlds.filter((w) => !w.draft);
const chapterOf = (id: string) => chapters.find((c) => c.id === id);
const accentOf = (w: World): Accent => chapterOf(w.chapterId)?.accent ?? { light: '#57534d', dark: '#c9ceda' };
const order = new Map(chapters.map((c, i) => [c.id, i]));
const byArchetype = (a: World, b: World) =>
  (order.get(a.chapterId) ?? 0) - (order.get(b.chapterId) ?? 0) ||
  (a.gameTitle.cs ?? a.gameTitle.en).localeCompare(b.gameTitle.cs ?? b.gameTitle.en, 'cs');

export const themeChapters: ThemeChapter[] = chapters.map((c) => ({
  id: c.id,
  short: SHORT[c.id] ?? c.title,
  accent: c.accent,
  total: published.filter((w) => w.chapterId === c.id).length,
}));

const link = (th: ThemeDef): ThemeLink => ({ slug: th.slug, page: themePageSlug(th.slug), label: th.label });

const toThemeWorld = (w: World): ThemeWorld => ({
  id: w.id,
  title: w.gameTitle,
  chapterId: w.chapterId,
  accent: accentOf(w),
  genre: w.metadata.genreProfile,
  core: w.core,
});

/** Celá obloha z titulní strany, světy tématu rozsvícené a spojené nejkratší trasou. */
const fullSky = buildSky(published, chapters);
function themeSky(ids: Set<string>): ThemeSkyData {
  const stars = fullSky.stars.map((s) => {
    const w = published.find((x) => x.id === s.id)!;
    return { id: s.id, x: s.x, y: s.y, size: s.size, accent: accentOf(w), title: w.gameTitle, lit: ids.has(s.id) };
  });
  const lit = stars.filter((s) => s.lit).map((s) => [s.x, s.y] as [number, number]);
  return {
    height: fullSky.height,
    stars,
    lines: fullSky.lines.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 })),
    route: windingPath(lit).map((k) => lit[k]),
    groups: fullSky.groups.map((g) => ({ id: g.chapterId, x: g.x, y: g.y, label: SHORT[g.chapterId] ?? { cs: g.chapterId, en: g.chapterId } })),
  };
}

function journeysFor(slug: string, base: string): ThemeJourney[] {
  return TRAILS.filter((tr) => tr.themes.includes(slug))
    .sort((a, b) => a.themes.indexOf(slug) - b.themes.indexOf(slug))
    .map((tr) => {
      const essay = publishedEssayFor(tr.id);
      return {
        id: tr.id,
        slug: trailSlug(tr.id),
        nameKey: tr.nameKey,
        descKey: tr.descKey,
        tagline: essay?.tagline,
        minutes: essay?.minutes ?? null,
        members: tr.members
          .map((id) => published.find((w) => w.id === id))
          .filter((w): w is World => Boolean(w))
          .map((w) => ({ id: w.id, title: w.gameTitle, accent: accentOf(w) })),
        image: trailImages(base, tr.id)[0],
      };
    });
}

export const atlasSpread: AxisSpread = axisSpread(published)!;
export const atlasMean = Object.fromEntries(AXIS_KEYS.map((k) => [k, atlasSpread[k].mean])) as Record<
  (typeof AXIS_KEYS)[number],
  number
>;

export function themePageData(slug: string, base: string) {
  const theme = THEMES.find((th) => th.slug === slug)!;
  const own = published.filter((w) => w.themes.includes(slug)).sort(byArchetype);
  return {
    theme: { ...link(theme), question: theme.question },
    worlds: own.map(toThemeWorld),
    sky: themeSky(new Set(own.map((w) => w.id))),
    spread: axisSpread(own),
    journeys: journeysFor(slug, base),
    neighbours: neighbourThemes(slug, published)
      .slice(0, 6)
      .map((n) => ({ ...link(THEMES.find((th) => th.slug === n.slug)!), shared: n.shared })),
  };
}

/** Rejstřík témat: každé téma s otiskem světů po archetypech a matice potkávání. */
export function themesIndexData() {
  const used = THEMES.filter((th) => published.some((w) => w.themes.includes(th.slug)));
  return {
    themes: used.map((th) => ({
      ...link(th),
      question: th.question,
      worlds: published
        .filter((w) => w.themes.includes(th.slug))
        .sort(byArchetype)
        .map((w) => ({ id: w.id, title: w.gameTitle, accent: accentOf(w), chapterId: w.chapterId })),
      journeys: TRAILS.filter((tr) => tr.themes.includes(th.slug)).length,
    })),
    matrix: themeMatrix(
      used.map((th) => th.slug),
      published,
    ),
  };
}
