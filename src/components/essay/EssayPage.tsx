import { useEffect, useMemo, useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { slugifyChronicleHeading } from '../../lib/chronicle-toc';
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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

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

function extractToc(markdown: string) {
  return [...markdown.matchAll(/^## (.+)$/gm)].map((m) => {
    const title = m[1].trim();
    return { id: anchorFor(title), title };
  });
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
    <article className="essay-frame">
      <p className="essay__back">
        <a href={withBase(base, '/')}>{uiT('essay.back', locale)}</a>
      </p>
      <header className="essay__masthead">
        {kicker ? <p className="essay__kicker">{kicker}</p> : null}
        <h1 className="essay__title display">{title}</h1>
        <div className="essay__ornament" aria-hidden="true">
          <span>✦</span>
          <span>✦</span>
          <span>✦</span>
        </div>
        {tagline ? <p className="essay__tagline">{tagline}</p> : null}
      </header>

      <div className="essay-layout">
        <nav className="essay-toc" aria-label={uiT('essay.toc', locale)}>
          <details className="essay-toc__mobile">
            <summary>{uiT('essay.toc', locale)}</summary>
            <TocList toc={toc} active={active} />
          </details>
          <div className="essay-toc__desktop">
            <p className="essay-toc__label">{uiT('essay.toc', locale)}</p>
            <TocList toc={toc} active={active} />
          </div>
        </nav>

        <div className="essay-prose" lang="cs">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ children }) => {
                const text = textOf(children);
                const id = anchorFor(text);
                const index = toc.findIndex((h) => h.id === id);
                const isLast = /^Zdroje$/i.test(text);
                return (
                  <h2 id={id} className="essay-chapter">
                    {isLast || index < 0 ? null : <span className="essay-chapter__no">{ROMAN[index]}</span>}
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

function TocList({ toc, active }: { toc: { id: string; title: string }[]; active: string }) {
  return (
    <ol className="essay-toc__list">
      {toc.map((h, i) => (
        <li key={h.id}>
          <a href={`#${h.id}`} className={active === h.id ? 'is-active' : undefined}>
            {/^Zdroje$/i.test(h.title) ? null : <span className="essay-toc__no">{ROMAN[i]}</span>}
            <span>{h.title}</span>
          </a>
        </li>
      ))}
    </ol>
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
