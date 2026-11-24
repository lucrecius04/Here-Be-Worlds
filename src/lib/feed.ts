/**
 * Kanál novinek (RSS 2.0, /rss.xml): nově zmapované světy, putování s esejí a eseje.
 * Skládá se při sestavení z dat, nic se nepíše ručně:
 * - svět: publikovaný (`!draft`), datum = `publishAt` (až přibude postupné odkrývání) nebo `addedAt`;
 * - putování: schválená esej (`approved: true`) s datem `published` ve frontmatteru;
 * - esej z content/essays/: s datem `published` (adresa /<soubor>/).
 * Položka s datem v budoucnosti se vynechá: objeví se až v sestavení po tom dni
 * (s plánovaným pravidelným sestavením tak kanál sám ohlásí odkrytý svět).
 * Nový druh obsahu = nový zdroj v `feedItems` se stejným tvarem `FeedItem`.
 */
import { worlds, chapters } from './worlds';
import { t } from './i18n';
import { TRAILS, trailSlug } from './trails';
import { publishedEssayFor } from './trail-pages';
import themesData from '../../data/meta/theme-taxonomy.json';

export type FeedKind = 'world' | 'journey' | 'essay';

export type FeedItem = {
  /** Trvalý identifikátor položky (nemění se, ani když se změní název). */
  guid: string;
  kind: FeedKind;
  title: string;
  /** Prostý text, bez HTML. */
  description: string;
  /** Cesta na webu bez base, např. /worlds/halo/. */
  path: string;
  /** YYYY-MM-DD */
  date: string;
  categories: string[];
};

const KIND_LABEL: Record<FeedKind, string> = {
  world: 'Nově zmapováno',
  journey: 'Nové putování',
  essay: 'Esej',
};

const essayFiles = import.meta.glob('../../content/essays/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const isDate = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

function frontmatter(raw: string, key: string): string | undefined {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return fm ? new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm').exec(fm[1])?.[1]?.trim() : undefined;
}

const themeLabel = (slug: string) => themesData.themes.find((th) => th.slug === slug)?.label.cs ?? slug;

function worldItems(): FeedItem[] {
  return worlds
    .filter((w) => !w.draft)
    .map((w) => {
      const date = (w as { publishAt?: string }).publishAt ?? w.addedAt;
      if (!isDate(date)) return null;
      const chapter = chapters.find((c) => c.id === w.chapterId);
      const genre = w.metadata.genreProfile ? t(w.metadata.genreProfile, 'cs') : '';
      const lead = [chapter ? t(chapter.title, 'cs') : '', genre].filter(Boolean).join(' · ');
      return {
        guid: `world:${w.id}`,
        kind: 'world' as const,
        title: t(w.gameTitle, 'cs'),
        description: [lead, t(w.core, 'cs')].filter(Boolean).join(' – '),
        path: `/worlds/${w.id}/`,
        date,
        categories: [chapter ? t(chapter.title, 'cs') : '', ...w.themes.map(themeLabel)].filter(Boolean),
      };
    })
    .filter((x): x is FeedItem => x !== null);
}

function journeyItems(): FeedItem[] {
  return TRAILS.map((trail) => {
    const essay = publishedEssayFor(trail.id);
    if (!essay || !isDate(essay.published)) return null;
    return {
      guid: `journey:${trail.id}`,
      kind: 'journey' as const,
      title: essay.title,
      description: [essay.tagline, essay.description].filter(Boolean).join(' '),
      path: `/putovani/${trailSlug(trail.id)}/`,
      date: essay.published,
      categories: ['Putování', ...trail.themes.map(themeLabel)],
    };
  }).filter((x): x is FeedItem => x !== null);
}

function essayItems(): FeedItem[] {
  return Object.entries(essayFiles)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '');
      const date = frontmatter(raw, 'published');
      if (!isDate(date)) return null;
      const title = frontmatter(raw, 'title') ?? slug;
      return {
        guid: `essay:${slug}`,
        kind: 'essay' as const,
        title,
        description: [frontmatter(raw, 'tagline'), frontmatter(raw, 'description')].filter(Boolean).join(' '),
        path: `/${slug}/`,
        date,
        categories: ['Esej'],
      };
    })
    .filter((x): x is FeedItem => x !== null);
}

/** Položky kanálu od nejnovější; `today` = den sestavení (YYYY-MM-DD), budoucí se vynechají. */
export function feedItems(today: string = new Date().toISOString().slice(0, 10)): FeedItem[] {
  const order: Record<FeedKind, number> = { world: 0, journey: 1, essay: 2 };
  return [...worldItems(), ...journeyItems(), ...essayItems()]
    .filter((item) => item.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || order[a.kind] - order[b.kind] || a.title.localeCompare(b.title, 'cs'));
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Datum jako RFC 822 (ráno v 7:00 UTC, aby den seděl ve všech časových pásmech Evropy). */
const rfc822 = (date: string) => new Date(`${date}T07:00:00Z`).toUTCString();

export const FEED_PATH = '/rss.xml';
export const FEED_LIMIT = 100;

/** Celý kanál jako XML. `site` = absolutní adresa webu včetně base (bez koncového lomítka). */
export function renderFeed(site: string, items: FeedItem[] = feedItems()): string {
  const url = (path: string) => `${site}${path}`;
  const shown = items.slice(0, FEED_LIMIT);
  const lastDate = shown[0]?.date;
  const body = shown
    .map(
      (item) => `    <item>
      <title>${escapeXml(`${KIND_LABEL[item.kind]}: ${item.title}`)}</title>
      <link>${escapeXml(url(item.path))}</link>
      <guid isPermaLink="false">${escapeXml(`here-be-worlds:${item.guid}`)}</guid>
      <pubDate>${rfc822(item.date)}</pubDate>
      <description>${escapeXml(item.description)}</description>
${item.categories.map((c) => `      <category>${escapeXml(c)}</category>`).join('\n')}
    </item>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Here Be Worlds</title>
    <link>${escapeXml(url('/'))}</link>
    <atom:link href="${escapeXml(url(FEED_PATH))}" rel="self" type="application/rss+xml" />
    <description>Kurátorský atlas herních vesmírů: nově zmapované světy, putování a eseje.</description>
    <language>cs</language>
${lastDate ? `    <lastBuildDate>${rfc822(lastDate)}</lastBuildDate>\n` : ''}    <image>
      <url>${escapeXml(url('/apple-touch-icon.png'))}</url>
      <title>Here Be Worlds</title>
      <link>${escapeXml(url('/'))}</link>
    </image>
${body}
  </channel>
</rss>
`;
}
