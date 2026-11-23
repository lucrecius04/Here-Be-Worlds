import { Fragment, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { slugifyChronicleHeading } from '../../lib/chronicle-toc';
import ReadingToc, { type ReadingTocItem } from '../reading/ReadingToc';
import TrailWorlds, { TRAIL_WORLDS_ID, TrailCast, TrailThemes } from './TrailWorlds';
import '../../styles/essay.css';

export type EssayWorldLink = { id: string; titles: string[] };

/** Svět stezky pro blok „Světy stezky“ pod esejem. */
export type TrailWorldInfo = {
  id: string;
  title: string;
  core: string;
  archetype: string;
  /** Podžánr (profil archetypu), např. „Kosmický horor“. */
  genre: string;
  accent: { light: string; dark: string };
  axes: Record<string, number>;
};

type Props = {
  base: string;
  markdown: string;
  title: string;
  kicker?: string;
  tagline?: string;
  worlds: EssayWorldLink[];
  /** Esej ke stezce: pod textem (před Zdroji) se vloží Světy stezky. */
  trail?: { worlds: TrailWorldInfo[]; themes?: { slug: string; label: string }[] };
  /** Stránka stezky bez schválené eseje: bez doby čtení. */
  pending?: boolean;
  /** Obrázek stezky (zatím jen náhled): široký pás pod hlavičkou, nebo na začátku textu. */
  hero?: { src: string; alt: string; ink?: string; mask?: string };
  /** Druhý obrázek stezky (náhled): uprostřed textu, před nadpisem nejblíž polovině. */
  hero2?: { src: string; alt: string; ink?: string; mask?: string };
  /** Další obrázky stezky (po prvním): rozložené rovnoměrně textem, každý před nadpisem ##. Má přednost před hero2. */
  heroMore?: { src: string; alt: string; ink?: string; mask?: string }[];
  /** Skutečná stránka (ne náhled): obrázky jen pod citátem a uprostřed, s maskami. */
  heroLive?: boolean;
};

/** Stabilní kotvy, na které odkazuje triáda na kartě světa. */
const ANCHOR_OVERRIDES: Record<string, string> = {
  'ustredni-otazka': 'ustredni-otazka',
  'prvotni-hrich': 'prvotni-hrich',
  'rizena-mezera': 'rizena-mezera',
};

/** Kapitoly bez čísla: úvod a seznam zdrojů. */
const UNNUMBERED = /^(úvodem|zdroje|světy stezky|na čem stezka stojí|světy putování|na čem putování stojí)$/i;

function textOf(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  if (typeof children === 'object' && 'props' in children) {
    return textOf((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

function anchorFor(text: string): string {
  const slug = slugifyChronicleHeading(text);
  return ANCHOR_OVERRIDES[slug] ?? slug;
}

function extractToc(markdown: string): ReadingTocItem[] {
  let n = 0;
  return [...markdown.matchAll(/^## (.+)$/gm)].map((m) => {
    const title = m[1].trim();
    const kicker = UNNUMBERED.test(title) ? undefined : String(++n).padStart(2, '0');
    return { id: anchorFor(title), title, kicker };
  });
}

/** Odhad doby čtení: 200 slov za minutu, stejně jako u kronik. */
function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/[#>*_`|[\]()-]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

type MdNode = { children?: MdNode[]; tagName?: string; type?: string; value?: string };

/** První tučný text v blockquote určuje typ bloku: „Spoiler · …“ = rozklikávací, jinak rámeček. */
function blockLabel(node: MdNode | undefined): string {
  const firstP = node?.children?.find((c) => c.tagName === 'p');
  const strong = firstP?.children?.[0];
  if (strong?.tagName !== 'strong') return '';
  return (strong.children ?? []).map((c) => c.value ?? '').join('');
}

/** U stezky se Zdroje oddělí, aby mezi text a prameny mohly přijít Světy stezky. */
function splitSources(markdown: string): [string, string] {
  const at = markdown.search(/^## (Zdroje|Na čem stezka stojí|Na čem putování stojí)\s*$/m);
  return at < 0 ? [markdown, ''] : [markdown.slice(0, at), markdown.slice(at)];
}

/** Masky obrázku stezky jako proměnné CSS (fresková maska, v tmavém motivu maska podle tuše). */
function heroImgProps(h: { ink?: string; mask?: string }) {
  const style: Record<string, string> = {};
  if (h.mask) style['--pv-mask'] = `url("${h.mask}")`;
  if (h.ink) style['--pv-mask-ink'] = `url("${h.ink}")`;
  return { style: style as CSSProperties, className: h.ink ? 'has-ink' : undefined };
}

export default function EssayPage({ base, markdown, title, kicker, tagline, worlds, trail, pending, hero, hero2, heroMore, heroLive }: Props) {
  const locale = useLocale();
  const [mainMd, sourcesMd] = useMemo(
    () => (trail ? splitSources(markdown) : [markdown, '']),
    [markdown, trail],
  );
  const toc = useMemo(() => {
    const items = extractToc(mainMd);
    if (trail) {
      items.push({ id: TRAIL_WORLDS_ID, title: uiT('trails.worldsHeading', locale) });
      items.push(...extractToc(sourcesMd));
    }
    return items;
  }, [mainMd, sourcesMd, trail, locale]);
  const minutes = useMemo(() => readingMinutes(markdown), [markdown]);

  const [active, setActive] = useState(toc[0]?.id ?? '');

  const worldHref = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of worlds) for (const t of w.titles) map.set(t.toLowerCase(), withBase(base, `/worlds/${w.id}/`));
    return map;
  }, [worlds, base]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      // Elementy hledáme pokaždé znovu: po hydrataci mohou být uzly nahrazené.
      const els = toc.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
      const line = window.innerHeight * 0.3;
      let current = els[0]?.id ?? '';
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', onScroll);
    };
  }, [toc]);

  // Náhled obrázku „pod citát“: text rozdělený za úvodním citátem (první odstavec kurzívou po prvním ##).
  // Náhled obrázků: text rozdělený za úvodním citátem (první odstavec kurzívou po prvním ##)
  // a s druhým obrázkem před nadpisem ## nejblíž polovině textu.
  const extras = useMemo(() => heroMore ?? (hero2 ? [hero2] : []), [heroMore, hero2]);
  // Text rozdělený za úvodním citátem (první odstavec kurzívou po prvním ##) a dál před nadpisy ##
  // nejblíž rovnoměrnému rozložení dalších obrázků (jeden = polovina, dva = třetiny…).
  const quoteSplit = useMemo<string[] | null>(() => {
    if (!hero) return null;
    const m = /^##[^\n]*\n+(\*[^\n]*(?:\n\*[^\n]*)*)\n/m.exec(mainMd);
    if (!m) return null;
    const end = m.index + m[0].length;
    const head = mainMd.slice(0, end);
    const rest = mainMd.slice(end);
    const heads = [...rest.matchAll(/^## /gm)].map((h) => h.index ?? 0).filter((i) => i > 0);
    const cuts: number[] = [];
    extras.forEach((_, k) => {
      const target = (mainMd.length * (k + 1)) / (extras.length + 1) - end;
      const free = heads.filter((i) => i > (cuts[cuts.length - 1] ?? 0));
      if (!free.length) return;
      cuts.push(free.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a)));
    });
    const parts = [head];
    let from = 0;
    for (const c of cuts) {
      parts.push(rest.slice(from, c));
      from = c;
    }
    parts.push(rest.slice(from));
    return parts;
  }, [hero, extras, mainMd]);

  const mdComponents: Components = {
              h2: ({ children }) => {
                const text = textOf(children);
                const id = anchorFor(text);
                const kickerNo = toc.find((h) => h.id === id)?.kicker;
                return (
                  <h2 id={id} className="essay-chapter">
                    {kickerNo ? <span className="essay-chapter__no">{kickerNo}</span> : null}
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => (
                <h3 id={anchorFor(textOf(children))} className="essay-subhead">
                  {children}
                </h3>
              ),
              a: ({ href = '', children }) => {
                const internal = href.startsWith('/');
                return (
                  <a
                    href={internal ? withBase(base, href) : href}
                    {...(internal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                  >
                    {children}
                  </a>
                );
              },
              table: ({ children }) => (
                <div className="essay-table">
                  <table>{children}</table>
                </div>
              ),
              td: ({ children }) => {
                const href = worldHref.get(textOf(children).trim().toLowerCase());
                return <td>{href ? <a href={href}>{children}</a> : children}</td>;
              },
              blockquote: ({ children, node }) => {
                const label = blockLabel(node as MdNode);
                if (/^spoiler/i.test(label)) {
                  return (
                    <details className="essay-spoiler">
                      <summary>
                        <span className="essay-spoiler__label">{label.replace(/^spoiler\s*·\s*/i, '')}</span>
                        <span className="essay-spoiler__hint" data-show={uiT('essay.spoilerShow', locale)} data-hide={uiT('essay.spoilerHide', locale)} />
                      </summary>
                      <div className="essay-spoiler__body">{stripLabel(children)}</div>
                    </details>
                  );
                }
                const kind = /^na kartě/i.test(label) ? 'card' : /^upozornění/i.test(label) ? 'note' : 'atlas';
                return (
                  <aside className={`essay-callout essay-callout--${kind}`}>
                    {label ? <p className="essay-callout__label">{label}</p> : null}
                    {stripLabel(children)}
                  </aside>
                );
              },
            };

  return (
    <article className="essay">
      <div className="essay__top page-band">
      <header className="essay__head">
        {kicker ? <p className="essay__kicker">{kicker}</p> : null}
        <h1 className="essay__title">{title}</h1>
        {tagline ? <p className="essay__tagline">{tagline}</p> : null}
        {pending ? null : (
          <p className="essay__meta">{uiT('essay.readTime', locale).replace('{n}', String(minutes))}</p>
        )}
      </header>

      {trail ? <TrailCast worlds={trail.worlds} base={base} locale={locale} /> : null}
      {trail?.themes?.length ? <TrailThemes themes={trail.themes} base={base} locale={locale} /> : null}
      </div>

      {hero && !heroLive ? (
        <figure className="essay-hero essay-hero--band">
          <img data-preview-img src={hero.src} alt={hero.alt} decoding="async" />
        </figure>
      ) : null}

      <div className="essay-layout">
        <aside className="essay-toc">
          <ReadingToc items={toc} active={active} label={uiT('essay.toc', locale)} />
        </aside>

        <div className="essay-prose" lang="cs">
          {hero && !heroLive ? (
            <figure className="essay-hero essay-hero--inline">
              <img data-preview-img src={hero.src} alt={hero.alt} decoding="async" />
            </figure>
          ) : null}
          {hero && quoteSplit ? (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {quoteSplit[0]}
              </ReactMarkdown>
              <figure className={`essay-hero essay-hero--quote${heroLive ? ' essay-hero--live' : ''}`}>
                <img data-preview-img src={hero.src} alt={hero.alt} decoding="async" {...heroImgProps(hero)} />
              </figure>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {quoteSplit[1]}
              </ReactMarkdown>
              {quoteSplit.slice(2).map((part, k) => (
                <Fragment key={k}>
                  <figure className={`essay-hero essay-hero--quote essay-hero--mid${heroLive ? ' essay-hero--live' : ''}`}>
                    <img
                      data-preview-img2
                      src={extras[k].src}
                      alt={extras[k].alt}
                      decoding="async"
                      loading="lazy"
                      {...heroImgProps(extras[k])}
                    />
                  </figure>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {part}
                  </ReactMarkdown>
                </Fragment>
              ))}
            </>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {mainMd}
            </ReactMarkdown>
          )}
          {trail ? (
            <>
              <TrailWorlds worlds={trail.worlds} base={base} locale={locale} />
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {sourcesMd}
              </ReactMarkdown>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** První odstavec s tučným štítkem v rámečku nevykreslujeme dvakrát. */
function stripLabel(children: ReactNode): ReactNode {
  const arr = Array.isArray(children) ? children : [children];
  let removed = false;
  return arr.filter((child) => {
    if (removed || !child || typeof child !== 'object' || !('props' in child)) return true;
    const kids = (child as { props: { children?: ReactNode } }).props.children;
    const first = Array.isArray(kids) ? kids[0] : kids;
    const isLabelOnly =
      first && typeof first === 'object' && 'type' in first && (first as { type: unknown }).type === 'strong' && textOf(kids).trim() === textOf(first).trim();
    if (isLabelOnly) {
      removed = true;
      return false;
    }
    return true;
  });
}
