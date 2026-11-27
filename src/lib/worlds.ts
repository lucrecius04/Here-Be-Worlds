import worldsData from '../../data/worlds.json';
import chaptersData from '../../data/meta/chapters.json';
import axesData from '../../data/meta/axes.json';
import themesData from '../../data/meta/theme-taxonomy.json';
import narrationData from '../../data/meta/narration-taxonomy.json';
import { worldsFileSchema, type LocalizedString, type RelatedWorld, type World } from '../schemas/world';
import { kinshipRanking, type KinshipLevel } from './compare';

const parsed = worldsFileSchema.parse(worldsData);

export type ChapterAccent = { light: string; dark: string };

export const worlds: World[] = parsed.worlds;
export const chapters = chaptersData.chapters;
export const axesMeta = axesData.axes;
export const themeTaxonomy = themesData.themes;
export const narrationTaxonomy = narrationData.narration;

export function getWorldById(id: string): World | undefined {
  return worlds.find((w) => w.id === id);
}

export function getChapterById(id: string) {
  return chapters.find((c) => c.id === id);
}

export function resolveRelatedWorlds(
  world: World,
  catalog: World[] = worlds,
  labels: Record<string, LocalizedString> = Object.fromEntries(
    themeTaxonomy.map((th) => [th.slug, th.label]),
  ),
  baseUrl = '',
): Array<RelatedWorld & { href?: string; level?: KinshipLevel; number?: number; chapterId?: string }> {
  const prefix = baseUrl.replace(/\/$/, '');
  const hrefFor = (id?: string) =>
    id && catalog.some((w) => w.id === id) ? `${prefix}/worlds/${id}/` : undefined;

  const extras = (id?: string) => {
    const match = id ? catalog.find((item) => item.id === id) : undefined;
    if (!match) return {};
    return {
      number: match.number,
      chapterId: match.chapterId,
      yearRange: match.yearRange || undefined,
      genreProfile: {
        en: match.metadata.genreProfile.en,
        cs: match.metadata.genreProfile.cs,
      },
    };
  };

  const published = catalog.filter((item) => !item.draft);

  /* Příbuzenstvo = tři nejbližší světy podle indexu (compare.ts). Ruční relatedWorlds se tu už
     neukazují (rozhodnutí majitele 2026-11-22); pod jménem jsou témata, která oba světy sdílejí,
     a když žádná nesdílejí, jádro příbuzného světa. */
  /* Zdroj i příbuzní se berou z katalogu: stránka sem posílá světy doplněné o `kin` (kin-worlds.ts). */
  const source = published.find((item) => item.id === world.id) ?? world;
  return kinshipRanking(source, published, 3).map(({ world: other, level }) => {
    const shared = other.themes.filter((slug) => world.themes.includes(slug));
    return {
      id: other.id,
      title: other.gameTitle,
      note: shared.length
        ? {
            en: shared.map((slug) => labels[slug]?.en ?? slug).join(' · '),
            cs: shared.map((slug) => labels[slug]?.cs ?? slug).join(' · '),
          }
        : other.core,
      ...extras(other.id),
      href: hrefFor(other.id),
      level,
    };
  });
}

export function buildSearchText(world: World): string {
  const parts = [
    world.gameTitle.en,
    world.gameTitle.cs,
    world.chronicleTitle.en,
    ...(world.universe ?? []).flatMap((name) => [name.en, name.cs]),
    world.core.en,
    world.core.cs,
    ...world.themes,
    ...world.signatureBullets?.map((b) => b.en) ?? [],
  ];
  return parts.filter(Boolean).join(' ');
}
