/**
 * Podklady Galerie triád a Mapy neznáma (sestavení): publikované světy s triádou, barvou archetypu
 * a kotvou oddílu Nosná mezera v Anatomii vyprávění.
 */
import { worlds, chapters } from './worlds';
import { findAnalysisHeadingId, splitChronicleMarkdown } from './chronicle-toc';
import type { TriadChapter, TriadWorld } from '../components/triads/shared';

const CHRONICLES = import.meta.glob('../../content/chronicles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SHORT: Record<string, { cs: string; en: string }> = {
  fantasy: { cs: 'Fantasy', en: 'Fantasy' },
  'science-fiction': { cs: 'Sci-fi', en: 'Sci-fi' },
  'post-apocalypse': { cs: 'Postapokalypsa', en: 'Post-apocalypse' },
  horror: { cs: 'Horor', en: 'Horror' },
  dystopia: { cs: 'Dystopie', en: 'Dystopia' },
  historical: { cs: 'Historie', en: 'Historical' },
  metaphysical: { cs: 'Metafyzika', en: 'Metaphysical' },
};

export const triadChapters: TriadChapter[] = chapters.map((c) => ({
  id: c.id,
  title: c.title,
  short: SHORT[c.id],
  accent: c.accent,
}));

export const triadWorlds: TriadWorld[] = worlds
  .filter((w) => !w.draft)
  .map((w) => {
    const raw = CHRONICLES[`../../content/chronicles/${w.chronicleSlug}.md`] ?? '';
    const analysis = splitChronicleMarkdown(raw.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '')).analysis;
    const chapter = chapters.find((c) => c.id === w.chapterId);
    return {
      id: w.id,
      title: w.gameTitle,
      chapterId: w.chapterId,
      accent: chapter?.accent ?? { light: '#57534d', dark: '#c9ceda' },
      originalSin: w.triad.originalSin,
      centralDilemma: w.triad.centralDilemma,
      ultimateMystery: w.triad.ultimateMystery,
      mysteryAnchor: analysis ? findAnalysisHeadingId(analysis, 'ultimateMystery') : null,
    };
  });
