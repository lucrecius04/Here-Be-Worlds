import worldsData from '../../data/worlds.json';
import chaptersData from '../../data/meta/chapters.json';
import axesData from '../../data/meta/axes.json';
import themesData from '../../data/meta/theme-taxonomy.json';
import narrationData from '../../data/meta/narration-taxonomy.json';
import { worldsFileSchema, type LocalizedString, type RelatedWorld, type World } from '../schemas/world';
import { kinshipLevel, kinshipRanking, type KinshipLevel } from './compare';

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
): Array<RelatedWorld & { href?: string; level?: KinshipLevel }> {
  const prefix = baseUrl.replace(/\/$/, '');
  const hrefFor = (id?: string) =>
    id && catalog.some((w) => w.id === id) ? `${prefix}/worlds/${id}/` : undefined;

  const extras = (id?: string) => {
    const match = id ? catalog.find((item) => item.id === id) : undefined;
    if (!match) return {};
    return {
      yearRange: match.yearRange || undefined,
      genreProfile: {
        en: match.metadata.genreProfile.en,
        cs: match.metadata.genreProfile.cs,
      },
    };
  };

  const published = catalog.filter((item) => !item.draft);
  const levelFor = (id?: string) => {
    const other = id ? published.find((item) => item.id === id) : undefined;
    return other ? kinshipLevel(world, other, published) : undefined;
  };

  if (world.relatedWorlds?.length) {
    return world.relatedWorlds.map((item) => {
      const fromCatalog = extras(item.id);
      return {
        ...item,
        genreProfile: fromCatalog.genreProfile ?? item.genreProfile,
        yearRange: fromCatalog.yearRange ?? item.yearRange,
        href: hrefFor(item.id),
        level: levelFor(item.id),
      };
    });
  }

  return kinshipRanking(world, published, 3).map(({ world: other, level }) => ({
    id: other.id,
    title: other.gameTitle,
    note: {
      en: other.themes.map((slug) => labels[slug]?.en ?? slug).join(' · '),
      cs: other.themes.map((slug) => labels[slug]?.cs ?? slug).join(' · '),
    },
    ...extras(other.id),
    href: hrefFor(other.id),
    level,
  }));
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
