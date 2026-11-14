import worldsData from '../../data/worlds.json';
import chaptersData from '../../data/meta/chapters.json';
import axesData from '../../data/meta/axes.json';
import themesData from '../../data/meta/theme-taxonomy.json';
import { worldsFileSchema, type LocalizedString, type RelatedWorld, type World } from '../schemas/world';
import { similarWorlds } from './similarity';

const parsed = worldsFileSchema.parse(worldsData);

export const worlds: World[] = parsed.worlds;
export const chapters = chaptersData.chapters;
export const axesMeta = axesData.axes;
export const themeTaxonomy = themesData.themes;

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
): Array<RelatedWorld & { href?: string }> {
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

  if (world.relatedWorlds?.length) {
    return world.relatedWorlds.map((item) => {
      const fromCatalog = extras(item.id);
      return {
        ...item,
        genreProfile: fromCatalog.genreProfile ?? item.genreProfile,
        yearRange: fromCatalog.yearRange ?? item.yearRange,
        href: hrefFor(item.id),
      };
    });
  }

  return similarWorlds(world, catalog, 3).map((other) => ({
    id: other.id,
    title: other.gameTitle,
    note: {
      en: other.themes.map((slug) => labels[slug]?.en ?? slug).join(' · '),
      cs: other.themes.map((slug) => labels[slug]?.cs ?? slug).join(' · '),
    },
    ...extras(other.id),
    href: hrefFor(other.id),
  }));
}

export function buildSearchText(world: World): string {
  const parts = [
    world.gameTitle.en,
    world.gameTitle.cs,
    world.chronicleTitle.en,
    world.core.en,
    world.core.cs,
    ...world.themes,
    ...world.signatureBullets?.map((b) => b.en) ?? [],
  ];
  return parts.filter(Boolean).join(' ');
}
