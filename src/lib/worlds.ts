import worldsData from '../../data/worlds.json';
import chaptersData from '../../data/meta/chapters.json';
import axesData from '../../data/meta/axes.json';
import themesData from '../../data/meta/theme-taxonomy.json';
import { worldsFileSchema, type World } from '../schemas/world';

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
