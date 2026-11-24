/**
 * Rejstřík plných textů pro hledání v hlavičce (druhý krok): kroniky (Kronika, Faktografie,
 * Anatomie vyprávění), schválené eseje putování, Anatomie herního lore a Teoretické zázemí.
 *
 * Text se rozseká na oddíly podle nadpisů (## a ###). Při sestavení vznikne:
 *  - /search/texts/meta.json — dokumenty a oddíly (kde leží, kotva),
 *  - /search/texts/<xx>.json — slova začínající dvojicí písmen <xx> a v kterých oddílech jsou,
 *  - /search/texts/doc/<dokument>.json — texty oddílů jednoho dokumentu (pro úryvek).
 * Prohlížeč si tak stáhne jen to, co dotaz potřebuje. Slova jsou malými písmeny bez diakritiky.
 */
import { foldCz } from './cz-stem';
import { worlds, chapters } from './worlds';
import { TRAILS, trailSlug } from './trails';
import { trailEssays } from './trail-pages';
import { parseBookLabel, slugifyChronicleHeading, splitChronicleMarkdown } from './chronicle-toc';
import type { TextDoc, TextMeta, TextPart, TextSection } from './text-search';
import { uiT } from './i18n';

const chronicleFiles = import.meta.glob('../../content/chronicles/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const essayFiles = import.meta.glob('../../content/essays/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const SOURCES = /^(zdroje|zdroje a literatura|literatura a zdroje|prameny a literatura)$/i;

function stripFrontmatter(raw: string): { body: string; meta: Record<string, string> } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*/);
  if (!m) return { body: raw, meta: {} };
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line);
    if (kv) meta[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return { body: raw.slice(m[0].length), meta };
}

function cleanHeading(text: string): string {
  return text.replace(/^__+|__+$/g, '').replace(/\*\*/g, '').trim();
}

/** Markdown řádek → čistý text (bez obrázků, odkazů, zvýraznění, tabulek a citací). */
function plainLine(line: string): string {
  return line
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*>\s?/, '')
    .replace(/^\s*[-*+]\s+/, '')
    .replace(/^\s*\|?\s*:?-{3,}.*$/, '')
    .replace(/\|/g, ' · ')
    .replace(/(\*\*|__|\*|_)(?=\S)|(?<=\S)(\*\*|__|\*|_)/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(\s*·\s*){2,}/g, ' · ')
    .replace(/^\s*·\s*|\s*·\s*$/g, '')
    .trim();
}

type RawSection = { place: string; anchor: string; text: string };

/** Oddíly jednoho textu podle ## a ###. Kotva: ### když je v textu jedinečný, jinak ##. */
function sectionsOf(markdown: string, { skipSources = true } = {}): RawSection[] {
  const lines = markdown.split('\n');
  const slugCount = new Map<string, number>();
  for (const line of lines) {
    const h = /^#{2,3}\s+(.+)$/.exec(line.trim());
    if (h) {
      const slug = slugifyChronicleHeading(cleanHeading(h[1]));
      slugCount.set(slug, (slugCount.get(slug) ?? 0) + 1);
    }
  }
  const out: RawSection[] = [];
  let h2 = '';
  let h2Anchor = '';
  let current: RawSection | null = null;
  let skipping = false;
  const flush = () => {
    if (current && current.text.trim()) out.push({ ...current, text: current.text.trim() });
    current = null;
  };
  for (const raw of lines) {
    const h = /^(#{2,3})\s+(.+)$/.exec(raw.trim());
    if (h) {
      flush();
      const text = cleanHeading(h[2]);
      const slug = slugifyChronicleHeading(text);
      if (h[1] === '##') {
        skipping = skipSources && SOURCES.test(text);
        // „Přílohy“ a „Rozbor vyprávění“ jsou názvy celé záložky, ta je ve výsledku zvlášť.
        h2 = /^(přílohy|rozbor vyprávění)$/i.test(text) ? '' : text.replace(/^\d+\.\s+/, '');
        h2Anchor = slug;
        current = { place: h2, anchor: slug, text: '' };
        if (!h2) current.place = '';
      } else {
        const unique = (slugCount.get(slug) ?? 0) === 1;
        const sub = text.replace(/^\d+\.\s+/, '');
        current = { place: h2 ? `${h2} · ${sub}` : sub, anchor: unique ? slug : h2Anchor || slug, text: '' };
      }
      continue;
    }
    if (skipping) continue;
    if (parseBookLabel(raw)) continue;
    const text = plainLine(raw);
    if (!text) continue;
    if (!current) current = { place: '', anchor: '', text: '' };
    current.text += `${text}\n`;
  }
  flush();
  return out.filter((s) => s.text.length > 0);
}

/** Malá písmena bez diakritiky, jen a–z a číslice. */
export function foldWord(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** Slova textu bez diakritiky; slovo s ů navíc i s o (bůh → buh i boh), aby „boha“ našlo „bůh“. */
function tokens(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/[^\p{L}\p{N}]+/u)) {
    for (const w of foldWord(raw).split(/[^a-z0-9]+/)) if (w.length >= 2) out.push(w);
    if (/ů/i.test(raw)) {
      const alt = foldCz(raw).replace(/[^a-z0-9]/g, '');
      if (alt.length >= 2) out.push(alt);
    }
  }
  return out;
}

export type TextIndexBuild = {
  meta: TextMeta;
  shards: Map<string, Record<string, number[]>>;
  texts: Map<string, string[]>;
};

let cached: TextIndexBuild | null = null;

export function buildTextIndex(): TextIndexBuild {
  if (cached) return cached;
  const docs: TextDoc[] = [];
  const sections: TextSection[] = [];
  const texts = new Map<string, string[]>();
  const chapterById = new Map(chapters.map((c) => [c.id, c]));

  const addDoc = (doc: TextDoc, parts: Array<{ part: TextPart; sections: RawSection[] }>) => {
    const docIdx = docs.length;
    docs.push(doc);
    const list: string[] = [];
    for (const { part, sections: secs } of parts) {
      for (const s of secs) {
        sections.push([docIdx, list.length, part, s.place, s.anchor]);
        list.push(s.text);
      }
    }
    texts.set(doc.key, list);
  };

  for (const w of worlds.filter((x) => !x.draft)) {
    const file = Object.entries(chronicleFiles).find(([path]) => path.endsWith(`/${w.chronicleSlug}.md`));
    if (!file) continue;
    const { body } = stripFrontmatter(file[1]);
    const parts = splitChronicleMarkdown(body.trim());
    addDoc(
      {
        key: `c-${w.id}`,
        kind: 'chronicle',
        title: { cs: w.gameTitle.cs ?? w.gameTitle.en, en: w.gameTitle.en },
        href: `/worlds/${w.id}/`,
        hue: chapterById.get(w.chapterId)?.accent,
      },
      [
        { part: 'chronicle', sections: sectionsOf(parts.narrative) },
        { part: 'appendices', sections: sectionsOf(parts.appendices) },
        { part: 'analysis', sections: sectionsOf(parts.analysis) },
      ],
    );
  }

  for (const essay of trailEssays.filter((e) => e.approved)) {
    const trail = TRAILS.find((tr) => tr.id === essay.trailId);
    if (!trail) continue;
    addDoc(
      {
        key: `e-${essay.slug}`,
        kind: 'essay',
        title: { cs: uiT(trail.nameKey, 'cs'), en: uiT(trail.nameKey, 'en') },
        href: `/putovani/${trailSlug(trail.id)}/`,
      },
      [{ part: 'essay', sections: sectionsOf(essay.markdown) }],
    );
  }

  const pages: Record<string, { href: string; title: { cs: string; en: string } }> = {
    'anatomie-herniho-lore': {
      href: '/anatomie-herniho-lore/',
      title: { cs: 'Anatomie herního lore', en: 'Anatomy of game lore' },
    },
    'teoreticke-zazemi': {
      href: '/teoreticke-zazemi/',
      title: { cs: uiT('footer.theory', 'cs'), en: uiT('footer.theory', 'en') },
    },
  };
  for (const [path, raw] of Object.entries(essayFiles)) {
    const slug = path.split('/').pop()!.replace(/\.md$/, '');
    const page = pages[slug];
    if (!page) continue;
    const { body } = stripFrontmatter(raw);
    // Teoretické zázemí je samo o pramenech: seznam literatury tu hledat jde.
    addDoc(
      { key: `p-${slug}`, kind: 'page', title: page.title, href: page.href },
      [{ part: 'essay', sections: sectionsOf(body, { skipSources: slug !== 'teoreticke-zazemi' }) }],
    );
  }

  // Slova → oddíly (s počtem výskytů), po dvojicích prvních písmen.
  const shards = new Map<string, Record<string, number[]>>();
  sections.forEach(([docIdx, local, , place], sectionId) => {
    const counts = new Map<string, number>();
    const doc = docs[docIdx];
    const text = `${place}\n${texts.get(doc.key)![local]}`;
    for (const w of tokens(text)) counts.set(w, (counts.get(w) ?? 0) + 1);
    // Název světa či eseje patří ke každému oddílu („vendrick dark souls“), jen bez váhy pro pořadí.
    for (const w of tokens(`${doc.title.cs} ${doc.title.en}`)) if (!counts.has(w)) counts.set(w, 0);
    for (const [w, n] of counts) {
      const key = w.slice(0, 2);
      const shard = shards.get(key) ?? {};
      (shard[w] ??= []).push(sectionId, n);
      shards.set(key, shard);
    }
  });

  cached = { meta: { docs, sections }, shards, texts };
  return cached;
}
