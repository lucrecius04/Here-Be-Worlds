import { useEffect, useMemo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { slugifyChronicleHeading } from '../../lib/chronicle-toc';
import ReadingToc, { type ReadingTocItem } from '../reading/ReadingToc';
import '../../styles/essay.css';

export type EssayWorldLink = { id: string; titles: string[] };

type Props = {
  base: string;
  markdown: string;
  title: string;
  kicker?: string;
  tagline?: string;
  worlds: EssayWorldLink[];
};

/** Stabilní kotvy, na které odkazuje triáda na kartě světa. */
const ANCHOR_OVERRIDES: Record<string, string> = {
  'ustredni-otazka': 'ustredni-otazka',
  'prvotni-hrich': 'prvotni-hrich',
  'rizena-mezera': 'rizena-mezera',
};

/** Kapitoly bez čísla: úvod a seznam zdrojů. */
const UNNUMBERED = /^(úvodem|zdroje)$/i;

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

export default function EssayPage({ base, markdown, title, kicker, tagline, worlds }: Props) {
  const locale = useLocale();
  const toc = useMemo(() => extractToc(markdown), [markdown]);
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

  return (
    <article className="essay">
      <header className="essay__head">
        {kicker ? <p className="essay__kicker">{kicker}</p> : null}
        <h1 className="essay__title">{title}</h1>
        {tagline ? <p className="essay__tagline">{tagline}</p> : null}
        <p className="essay__meta">{uiT('essay.readTime', locale).replace('{n}', String(minutes))}</p>
      </header>

      <div className="essay-layout">
        <aside className="essay-toc">
          <ReadingToc items={toc} active={active} label={uiT('essay.toc', locale)} />
        </aside>

        <div className="essay-prose" lang="cs">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
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
            }}
          >
            {markdown}
          </ReactMarkdown>
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
