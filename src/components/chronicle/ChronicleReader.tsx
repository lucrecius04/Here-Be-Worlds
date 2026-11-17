import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '../../styles/chronicle.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../lib/locale-store';
import { uiT } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString } from '../../schemas/world';
import {
  isChronicleInProgress,
  readReaderDesk,
  useReaderDesk,
  writeChronicleProgress,
} from '../../lib/reader-desk';
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
  worldId?: string;
  worldTitle?: LocalizedString;
  resumeOnMount?: boolean;
};

function scrollHeadingIntoView(root: HTMLElement | null, id: string) {
  if (!root || !id) return;
  const el = root.querySelector(`#${CSS.escape(id)}`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function scrollToPercent(root: HTMLElement | null, percent: number) {
  if (!root) return;
  const max = root.scrollHeight - root.clientHeight;
  if (max <= 0) return;
  root.scrollTo({ top: (percent / 100) * max, behavior: 'smooth' });
}

function headingAtScroll(root: HTMLElement): { heading: string; headingId: string } {
  const nodes = [...root.querySelectorAll('h2[id], h3[id], p.chronicle-book-label[id]')];
  const top = root.getBoundingClientRect().top + 96;
  let current: Element | null = null;
  for (const node of nodes) {
    if (node.getBoundingClientRect().top <= top) current = node;
    else break;
  }
  if (!current) return { heading: '', headingId: '' };
  return {
    heading: (current.textContent ?? '').replace(/\s+/g, ' ').trim(),
    headingId: current.id,
  };
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
  worldId,
  worldTitle,
  resumeOnMount = false,
}: Props) {
  const locale = useLocale();
  const desk = useReaderDesk();
  const [active, setActive] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef('');
  const formatted = useMemo(() => formatChronicleMarkdown(markdown), [markdown]);
  const cover = coverTitle ? splitCoverTitle(coverTitle) : null;
  const range = rangeFromCover(coverTitle, coverRange);
  const tocSource = variant === 'narrative' ? markdown : formatted;
  const toc = useMemo(
    () => (showToc ? extractChronicleToc(tocSource) : []),
    [tocSource, showToc],
  );
  const trackProgress = variant === 'narrative' && Boolean(worldId && worldTitle);
  const saved =
    trackProgress && desk.chronicle?.id === worldId && isChronicleInProgress(desk.chronicle.scrollPercent)
      ? desk.chronicle
      : null;

  useEffect(() => {
    const root = scrollRef.current;
    const observe = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          activeRef.current = visible[0].target.id;
          setActive(visible[0].target.id);
        }
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

  useEffect(() => {
    if (!resumeOnMount || !trackProgress || !worldId) return;
    const savedProgress = readReaderDesk().chronicle;
    if (!savedProgress || savedProgress.id !== worldId) return;
    const root = scrollRef.current;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        if (savedProgress.headingId) scrollHeadingIntoView(root, savedProgress.headingId);
        else scrollToPercent(root, savedProgress.scrollPercent);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [resumeOnMount, trackProgress, worldId, formatted]);

  useEffect(() => {
    if (!trackProgress || !worldId || !worldTitle) return;
    const root = scrollRef.current;
    if (!root) return;
    let timer = 0;
    const persist = () => {
      const max = root.scrollHeight - root.clientHeight;
      const percent = max <= 0 ? 0 : (root.scrollTop / max) * 100;
      const fromDom = headingAtScroll(root);
      const currentId = activeRef.current || fromDom.headingId;
      const entry = toc.find((item) => item.id === currentId);
      const heading = entry?.title || entry?.label || fromDom.heading;
      writeChronicleProgress(worldId, worldTitle, percent, heading, currentId || fromDom.headingId);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(persist, 250);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      root.removeEventListener('scroll', onScroll);
    };
  }, [trackProgress, worldId, worldTitle, toc, formatted]);

  const continueReading = () => {
    if (!saved) return;
    if (saved.headingId) scrollHeadingIntoView(scrollRef.current, saved.headingId);
    else scrollToPercent(scrollRef.current, saved.scrollPercent);
  };

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
      className={`chronicle-layout chronicle-layout--${variant}${showToc ? '' : ' chronicle-layout--wide'}${saved ? ' chronicle-layout--resume' : ''}`}
    >
      {saved ? (
        <p className="chronicle-resume">
          {locale === 'cs'
            ? `Rozečtená kronika (kapitola: ${saved.heading || '—'} · ${saved.scrollPercent} %) — `
            : `Chronicle in progress (${saved.heading || '—'} · ${saved.scrollPercent}%) — `}
          <button type="button" className="chronicle-resume__go" onClick={continueReading}>
            {uiT('home.deskContinue', locale)}
          </button>
        </p>
      ) : null}
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
                      activeRef.current = h.id;
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
              img: ({ src = '', alt = '' }) => (
                <img
                  className="chronicle-figure"
                  src={typeof src === 'string' && src.startsWith('/') ? withBase(import.meta.env.BASE_URL, src) : src}
                  alt={alt}
                  loading="lazy"
                />
              ),
            }}
          >
            {formatted}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
