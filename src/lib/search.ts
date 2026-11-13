import MiniSearch from 'minisearch';
import type { World } from '../schemas/world';
import { buildSearchText } from './worlds';

export type SearchDocument = {
  id: string;
  title: string;
  chapterId: string;
  themes: string;
  body: string;
};

export function createWorldIndex(worlds: World[]) {
  const docs: SearchDocument[] = worlds.map((w) => ({
    id: w.id,
    title: w.gameTitle.en,
    chapterId: w.chapterId,
    themes: w.themes.join(' '),
    body: buildSearchText(w),
  }));

  const mini = new MiniSearch<SearchDocument>({
    fields: ['title', 'body', 'themes'],
    storeFields: ['id', 'chapterId', 'themes'],
  });
  mini.addAll(docs);
  return mini;
}
