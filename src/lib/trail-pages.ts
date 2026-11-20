/**
 * Podklady pro stránky stezek (sestavení): eseje z content/trails, světy stezky a prameny z rozcestníku.
 * Esej se na webu ukáže až s `approved: true` ve frontmatteru; do té doby je jen náhled /stezky/navrh/<slug>/.
 */
import { TRAILS, trailSlug, type TrailDef } from './trails';
import { worlds, chapters } from './worlds';
import { AXIS_KEYS } from './axes';
import { uiT } from './i18n';
import pramenyReadme from '../../docs/prameny/README.md?raw';

const essayFiles = import.meta.glob('../../content/trails/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const ARCHETYPE_SHORT: Record<string, string> = {
  fantasy: 'Fantasy',
  'science-fiction': 'Sci-fi',
  'post-apocalypse': 'Postapokalypsa',
  horror: 'Horor',
  historical: 'Historie',
  dystopia: 'Dystopie',
  metaphysical: 'Metafyzika',
};

export type TrailEssay = {
  slug: string;
  trailId: string;
  title: string;
  kicker?: string;
  tagline?: string;
  description?: string;
  markdown: string;
  approved: boolean;
  minutes: number;
};

function parse(raw: string) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  const meta = (key: string) =>
    fm ? new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(fm[1])?.[1]?.trim() : undefined;
  return { meta, markdown: fm ? raw.slice(fm[0].length).trim() : raw.trim() };
}

/** Odhad doby čtení: 200 slov za minutu, stejně jako u kronik a v EssayPage. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/[#>*_`|[\]()-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export const trailEssays: TrailEssay[] = Object.entries(essayFiles).map(([path, raw]) => {
  const { meta, markdown } = parse(raw);
  const slug = path.split('/').pop()!.replace(/\.md$/, '');
  return {
    slug,
    trailId: meta('trail') ?? '',
    title: meta('title') ?? slug,
    kicker: meta('kicker'),
    tagline: meta('tagline'),
    description: meta('description'),
    markdown,
    approved: meta('approved') === 'true',
    minutes: readingMinutes(markdown),
  };
});

export function essayFor(trailId: string): TrailEssay | undefined {
  return trailEssays.find((e) => e.trailId === trailId);
}

/** Schválená esej, nebo nic: jen ta se ukazuje na webu. */
export function publishedEssayFor(trailId: string): TrailEssay | undefined {
  const essay = essayFor(trailId);
  return essay?.approved ? essay : undefined;
}

const published = worlds.filter((w) => !w.draft);

export function trailWorldsInfo(trail: TrailDef | undefined) {
  return (trail?.members ?? [])
    .map((wid) => published.find((w) => w.id === wid))
    .filter((w): w is (typeof published)[number] => Boolean(w))
    .map((w) => {
      const chapter = chapters.find((c) => c.id === w.chapterId);
      return {
        id: w.id,
        title: w.gameTitle.cs ?? w.gameTitle.en,
        core: w.core.cs ?? w.core.en,
        archetype: ARCHETYPE_SHORT[w.chapterId] ?? chapter?.title.cs ?? '',
        genre: w.metadata.genreProfile.cs ?? w.metadata.genreProfile.en ?? '',
        accent: chapter?.accent ?? { light: 'currentColor', dark: 'currentColor' },
        axes: Object.fromEntries(AXIS_KEYS.map((key) => [key, w.axes[key].value])),
      };
    });
}

/** Odkazy na světy v tabulkách eseje (stejně jako u Anatomie herního lore). */
export const worldLinks = published
  .filter((w) => !w.id.startsWith('vzorek-'))
  .map((w) => ({ id: w.id, titles: [w.gameTitle.cs, w.gameTitle.en].filter(Boolean) as string[] }));

/**
 * Prameny stezky z tabulky „Prameny podle stezek“ v docs/prameny/README.md:
 * jen jména autorů (bez výkladu v závorkách), každé jednou.
 */
export function trailSources(trail: TrailDef): string[] {
  const name = uiT(trail.nameKey, 'cs');
  const row = pramenyReadme.split('\n').find((l) => l.startsWith(`| ${name} |`));
  if (!row) return [];
  let cell = (row.split('|')[3] ?? '').replace(/\bA\. Assmannová/g, 'Aleida Assmannová');
  for (let i = 0; i < 4; i++) cell = cell.replace(/\([^()]*\)/g, '');
  const names = cell
    .split(/,(?![^(]*\))/)
    .map((part) => part.split(':')[0].split(/\s\.|\.\s/)[0].replace(/\s+/g, ' ').trim())
    .map((part) => part.replace(/^vizní dokument Planescape$/, 'vizní dokument Planescape: Torment'))
    // Jen jména: začínají velkým písmenem (nebo „vizní dokument“) a mají nejvýš čtyři slova.
    .filter((part) => /^(\p{Lu}|vizní dokument)/u.test(part) && part.split(' ').length <= 4);
  return [...new Set(names)];
}

export const trailPages = TRAILS.map((trail) => ({ trail, slug: trailSlug(trail.id) }));
