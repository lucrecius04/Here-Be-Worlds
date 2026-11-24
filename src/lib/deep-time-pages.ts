/**
 * Podklady stránky Hlubina času, skládané při sestavení: světy s barvou archetypu,
 * hlubinou z data/meta/deep-time.json a kotvou časové osy ve Faktografii.
 */
import type { LocalizedString } from '../schemas/world';
import { worlds, chapters } from './worlds';
import { slugifyChronicleHeading } from './chronicle-toc';
import { DEEP_TIME, type DeepWorld } from './deep-time';
import { themeChapters, type ThemeChapter } from './theme-pages';

export type DeepTimeWorld = {
  id: string;
  title: LocalizedString;
  chapterId: string;
  accent: { light: string; dark: string };
  number: number;
  deep: DeepWorld;
  /** Kotva časové osy ve Faktografii (?view=appendices#…). */
  anchor: string | null;
};

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function timelineAnchor(chronicleSlug: string): string | null {
  const raw = CHRONICLES[`../../content/chronicles/${chronicleSlug}.md`] ?? '';
  const line = raw.split('\n').find((l) => /^###\s+.*([Čč]asov|[Cc]hronolog)/.test(l));
  return line ? slugifyChronicleHeading(line.replace(/^#+\s+/, '').trim()) : null;
}

export const deepTimeWorlds: DeepTimeWorld[] = worlds
  .filter((w) => !w.draft && DEEP_TIME[w.id])
  .map((w) => ({
    id: w.id,
    title: w.gameTitle,
    chapterId: w.chapterId,
    accent: chapters.find((c) => c.id === w.chapterId)?.accent ?? { light: '#57534d', dark: '#c9ceda' },
    number: w.number,
    deep: DEEP_TIME[w.id],
    anchor: timelineAnchor(w.chronicleSlug),
  }));

export const deepTimeChapters: ThemeChapter[] = themeChapters;
