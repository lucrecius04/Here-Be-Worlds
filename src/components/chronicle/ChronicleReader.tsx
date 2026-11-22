import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import '../../styles/chronicle.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocale } from '../../lib/locale-store';
import ReadingToc from '../reading/ReadingToc';
import { usePageFlow } from '../../lib/page-flow';
import { uiT } from '../../lib/i18n';
import { withBase } from '../../lib/base-url';
import type { LocalizedString } from '../../schemas/world';
import {
  isChronicleInProgress,
  SHOW_READING_PROGRESS,
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

/** Zvýraznění v obsahu je během skoku zamčené na cíli (jinak by při dorovnávání blikalo). */
let jumpLock: { id: string; until: number } | null = null;

function scrollHeadingIntoView(root: HTMLElement | null, id: string) {
  if (!root || !id) return;
  const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
  if (!el) return;
  // Skok rovnou na místo jako u esejí: plynulý posun přes celou kroniku míjel všechny kapitoly.
  el.scrollIntoView({ behavior: 'auto', block: 'start' });
  jumpLock = { id, until: Date.now() + 3200 };
  // Obrázky nad cílem se dočítají až po skoku a odsunou ho: chvíli dorovnávat,
  // dokud čtenář sám nezačne posouvat.
  let tries = 0;
  let stop = false;
  const cleanup = () => {
    window.removeEventListener('wheel', abort);
    window.removeEventListener('touchstart', abort);
    window.removeEventListener('keydown', abort);
  };
  const abort = () => {
    stop = true;
    jumpLock = null;
    cleanup();
    window.dispatchEvent(new Event('scroll'));
  };
  window.addEventListener('wheel', abort, { passive: true });
  window.addEventListener('touchstart', abort, { passive: true });
  window.addEventListener('keydown', abort);
  const settle = () => {
    if (stop) return;
    const target = document.getElementById(id);
    if (target) {
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const off = target.getBoundingClientRect().top - margin;
      if (Math.abs(off) > 8) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    tries += 1;
    if (tries < 6) window.setTimeout(settle, 500);
    else {
      jumpLock = null;
      cleanup();
    }
  };
  window.setTimeout(settle, 300);
}

function scrollToPercent(root: HTMLElement | null, percent: number, pageFlow = false) {
  if (!root) return;
  if (pageFlow) {
    const rect = root.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    if (span <= 0) return;
    window.scrollTo({ top: window.scrollY + rect.top + (percent / 100) * span, behavior: 'smooth' });
    return;
  }
  const max = root.scrollHeight - root.clientHeight;
  if (max <= 0) return;
  root.scrollTo({ top: (percent / 100) * max, behavior: 'smooth' });
}

/** Procento přečtené části: ve vnitřním okénku podle jeho posunu, na telefonu podle polohy textu v okně. */
function readPercent(root: HTMLElement, pageFlow: boolean): number {
  if (pageFlow) {
    const rect = root.getBoundingClientRect();
    const span = rect.height - window.innerHeight;
    return span <= 0 ? 0 : Math.min(100, Math.max(0, (-rect.top / span) * 100));
  }
  const max = root.scrollHeight - root.clientHeight;
  return max <= 0 ? 0 : (root.scrollTop / max) * 100;
}

function headingAtScroll(root: HTMLElement, pageFlow = false): { heading: string; headingId: string } {
  const nodes = [...root.querySelectorAll('h2[id], h3[id], p.chronicle-book-label[id]')];
  const top = (pageFlow ? 0 : root.getBoundingClientRect().top) + 96;
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
  const pageFlow = usePageFlow();
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
    SHOW_READING_PROGRESS &&
    trackProgress &&
    desk.chronicle != null &&
    desk.chronicle.id === worldId &&
    isChronicleInProgress(desk.chronicle.scrollPercent)
      ? desk.chronicle
      : null;

  useEffect(() => {
    // Stejně jako u esejí: aktivní je poslední nadpis nad čarou pod pruhem světa.
    const root = scrollRef.current;
    let frame = 0;
    const update = () => {
      if (jumpLock && Date.now() < jumpLock.until) {
        activeRef.current = jumpLock.id;
        setActive(jumpLock.id);
        return;
      }
      const els = toc.map((h) => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
      const top = pageFlow || !root ? 0 : root.getBoundingClientRect().top;
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--wp-bar-h')) || 0;
      const line = top + bar + window.innerHeight * 0.25;
      let current = els[0]?.id ?? '';
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
        else break;
      }
      activeRef.current = current;
      setActive(current);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const target: HTMLElement | Window = pageFlow || !root ? window : root;
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [toc, formatted, pageFlow]);

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
        else scrollToPercent(root, savedProgress.scrollPercent, pageFlow);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [resumeOnMount, trackProgress, worldId, formatted, pageFlow]);

  useEffect(() => {
    if (!trackProgress || !worldId || !worldTitle) return;
    const root = scrollRef.current;
    if (!root) return;
    let timer = 0;
    const persist = () => {
      const percent = readPercent(root, pageFlow);
      const fromDom = headingAtScroll(root, pageFlow);
      const currentId = activeRef.current || fromDom.headingId;
      const entry = toc.find((item) => item.id === currentId);
      const heading = entry?.title || entry?.label || fromDom.heading;
      writeChronicleProgress(worldId, worldTitle, percent, heading, currentId || fromDom.headingId);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(persist, 250);
    };
    const target: HTMLElement | Window = pageFlow ? window : root;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      target.removeEventListener('scroll', onScroll);
    };
  }, [trackProgress, worldId, worldTitle, toc, formatted, pageFlow]);

  const continueReading = () => {
    if (!saved) return;
    if (saved.headingId) scrollHeadingIntoView(scrollRef.current, saved.headingId);
    else scrollToPercent(scrollRef.current, saved.scrollPercent, pageFlow);
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

  /* Text kroniky se vykreslí jen při změně obsahu nebo jazyka. Dřív se při každé změně aktivní
     kapitoly v obsahu celý článek znovu připojil (nové komponenty), obrázky se načítaly znovu
     a odsouvaly text pod čtenářem. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prose = useMemo(
    () => (
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
    ),
    [formatted, locale],
  );

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
        <div className="chronicle-toc">
          {toc.length > 0 ? (
            <ReadingToc
              stacked
              items={toc.map((h) => ({ id: h.id, title: h.title || h.label, kicker: h.title ? h.label : undefined }))}
              active={active}
              label={uiT('essay.toc', locale)}
              ariaLabel={locale === 'cs' ? 'Obsah kroniky' : 'Chronicle contents'}
              onSelect={(id, e) => {
                e.preventDefault();
                activeRef.current = id;
                setActive(id);
                // na telefonu se obsah po kliknutí sbalí: posunout až po překreslení
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => scrollHeadingIntoView(scrollRef.current, id)),
                );
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div className="chronicle-scroll" ref={scrollRef}>
        {showCover ? (
          cover || coverTagline ? (
            <header className="chronicle-cover">
              {/* název kroniky je už v hlavičce spisu; kronika začíná rovnou příběhem světa */}
              {coverTagline ? (
                <h2 className="chronicle-cover__title display">{coverTagline}</h2>
              ) : cover?.name ? (
                <h2 className="chronicle-cover__title display">{cover.name}</h2>
              ) : null}
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
          {prose}
        </article>
      </div>
    </div>
  );
}
