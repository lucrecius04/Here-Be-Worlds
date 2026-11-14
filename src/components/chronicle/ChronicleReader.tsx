import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '../../styles/chronicle.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import {
  extractChronicleToc,
  parseBookLabel,
  slugifyChronicleHeading,
} from '../../lib/chronicle-toc';
import {
  classifyChronicleHeading,
  formatChronicleMarkdown,
  renamedPartHeading,
  splitCoverTitle,
} from '../../lib/chronicle-format';

function rangeFromCover(title?: string, range?: string) {
  if (range) return range;
  if (!title) return '';
  if (/Mečového|Sword Coast/i.test(title)) return 'od pádu Netherilu po Starší mozek';
  if (/popela|Ash/i.test(title)) return 'svět, který se bál tmy';
  if (/Svatyně|Sanctuary/i.test(title)) return 'od stvoření vesmíru po konec věku nenávisti';
  return '';
}

type Variant = 'narrative' | 'appendices' | 'analysis';

type Props = {
  markdown: string;
  coverTitle?: string;
  coverTagline?: string;
  coverRange?: string;
  showToc?: boolean;
  showCover?: boolean;
  variant?: Variant;
  scrollToId?: string | null;
};

function scrollHeadingIntoView(root: HTMLElement | null, id: string) {
  if (!root || !id) return;
  const el = root.querySelector(`#${CSS.escape(id)}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function nodesToText(children: ReactNode): string {
  if (children == null || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(nodesToText).join('');
  if (typeof children === 'object' && 'props' in children) {
    return nodesToText((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

function isOnlyEmphasis(node: { children?: { tagName?: string; type?: string }[] } | undefined) {
  const kids = node?.children ?? [];
  if (kids.length !== 1) return false;
  const tag = kids[0]?.tagName ?? kids[0]?.type;
  return tag === 'em' || tag === 'emphasis';
}

function Ornament() {
  return (
    <div className="chronicle-ornament" aria-hidden="true">
      <span>✦</span>
      <span>✦</span>
      <span>✦</span>
    </div>
  );
}

export default function ChronicleReader({
  markdown,
  coverTitle,
  coverTagline,
  coverRange,
  showToc = true,
  showCover = true,
  variant = 'narrative',
  scrollToId = null,
}: Props) {
  const locale = useLocale();
  const [active, setActive] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const formatted = useMemo(() => formatChronicleMarkdown(markdown), [markdown]);
  const cover = coverTitle ? splitCoverTitle(coverTitle) : null;
  const range = rangeFromCover(coverTitle, coverRange);
  const tocSource = variant === 'narrative' ? markdown : formatted;
  const toc = useMemo(
    () => (showToc ? extractChronicleToc(tocSource) : []),
    [tocSource, showToc],
  );

  useEffect(() => {
    const root = scrollRef.current;
    const observe = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      { root, rootMargin: '-10% 0px -70% 0px', threshold: [0, 0.25, 0.5] },
    );
    toc.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observe.observe(el);
    });
    return () => observe.disconnect();
  }, [toc, formatted]);

  useEffect(() => {
    if (!scrollToId) return;
    const root = scrollRef.current;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => scrollHeadingIntoView(root, scrollToId));
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToId, formatted]);

  const headingEl = (tag: 'h2' | 'h3', children: ReactNode) => {
    const text = nodesToText(children);
    const book = parseBookLabel(text);
    if (book) {
      return (
        <p id={slugifyChronicleHeading(book)} className="chronicle-book-label">
          {book}
        </p>
      );
    }
    const kind = classifyChronicleHeading(text);
    const Tag = tag;
    const className =
      kind === 'interpret'
        ? 'chronicle-interpret'
        : kind === 'numbered'
          ? 'chronicle-subhead'
          : kind === 'part'
            ? 'chronicle-part'
            : kind === 'sources'
              ? 'chronicle-sources-title'
              : 'chronicle-chapter';
    const renamed = renamedPartHeading(text);
    const label =
      renamed === 'appendices'
        ? uiT('world.viewAppendices', locale)
        : renamed === 'analysis'
          ? uiT('world.viewAnalysis', locale)
          : children;
    return (
      <Tag id={slugifyChronicleHeading(text)} className={className}>
        {label}
      </Tag>
    );
  };

  return (
    <div
      className={`chronicle-layout chronicle-layout--${variant}${showToc ? '' : ' chronicle-layout--wide'}`}
    >
      {showToc ? (
        <nav className="chronicle-toc" aria-label={locale === 'cs' ? 'Obsah kroniky' : 'Chronicle contents'}>
          {toc.length > 0 ? (
            <ul>
              {toc.map((h) => (
                <li key={h.id} className="chronicle-toc__item">
                  <a
                    href={`#${h.id}`}
                    className={active === h.id ? 'chronicle-toc__link--active' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      setActive(h.id);
                      scrollHeadingIntoView(scrollRef.current, h.id);
                    }}
                  >
                    <span className="chronicle-toc__book">{h.label}</span>
                    {h.title ? <span className="chronicle-toc__chapter">{h.title}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>
      ) : null}
      <div className="chronicle-scroll" ref={scrollRef}>
        {showCover ? (
          cover || coverTagline ? (
            <header className="chronicle-cover">
              {cover?.kicker ? <p className="chronicle-cover__kicker">{cover.kicker}</p> : null}
              {cover?.name ? <h2 className="chronicle-cover__title display">{cover.name}</h2> : null}
              <Ornament />
              {coverTagline ? <p className="chronicle-cover__tagline">{coverTagline}</p> : null}
              {range ? <p className="chronicle-cover__range">{range}</p> : null}
              <p className="chronicle-cover__spoiler">{uiT('world.spoilerNotice', locale)}</p>
            </header>
          ) : (
            <p className="chronicle-cover__spoiler">{uiT('world.spoilerNotice', locale)}</p>
          )
        ) : null}
        <article
          lang={locale}
          className={`chronicle-prose chronicle-prose--body chronicle-prose--${variant}${showToc ? '' : ' chronicle-prose--wide'}`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children, node }) => {
                const text = nodesToText(children).trim();
                const book = parseBookLabel(text);
                if (book) {
                  return (
                    <p id={slugifyChronicleHeading(book)} className="chronicle-book-label">
                      {book}
                    </p>
                  );
                }
                if (isOnlyEmphasis(node)) {
                  const quoted = /[„“”"]/.test(text);
                  return (
                    <p className={quoted ? 'chronicle-epigraph' : 'chronicle-italic'}>{children}</p>
                  );
                }
                return <p>{children}</p>;
              },
              h2: ({ children }) => headingEl('h2', children),
              h3: ({ children }) => headingEl('h3', children),
              hr: () => <Ornament />,
              strong: ({ children }) => <strong>{children}</strong>,
            }}
          >
            {formatted}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
