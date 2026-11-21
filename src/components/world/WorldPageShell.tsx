import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, RelatedWorld, World } from '../../schemas/world';
import { countWord, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import type { ChapterAccent } from '../../lib/worlds';
import { loadChronicleMarkdown, type ChronicleDoc } from '../../lib/chronicles';
import {
  findAnalysisHeadingId,
  splitChronicleMarkdown,
  type ChronicleStats,
  type TriadAnchor,
} from '../../lib/chronicle-toc';
import WorldPageMasthead from './WorldPageMasthead';
import WorldCard from './WorldCard';
import SimilarWorlds, { type ChapterAccentMap } from './SimilarWorlds';
import ChronicleReader from '../chronicle/ChronicleReader';
import { touchRecent } from '../../lib/reader-desk';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';
import { usePageFlow } from '../../lib/page-flow';

type ViewMode = 'card' | 'chronicle' | 'appendices' | 'analysis';

type Props = {
  base: string;
  baseUrl: string;
  world: World;
  chapterTitle?: LocalizedString;
  chapterAccent?: ChapterAccent;
  themeLabels: Record<string, LocalizedString>;
  related?: Array<RelatedWorld & { href?: string; level?: number; number?: number; chapterId?: string }>;
  chapterAccents?: ChapterAccentMap;
  tabStats?: ChronicleStats;
};

/** Co záložka obsahuje: „9 kapitol · 25 min“, „5 oddílů“, „6 částí“. */
function tabMeta(mode: ViewMode, stats: ChronicleStats | undefined, locale: Locale): string {
  if (!stats) return '';
  if (mode === 'chronicle' && stats.chapters > 0) {
    const chapters = countWord(stats.chapters, ['kapitola', 'kapitoly', 'kapitol'], ['chapter', 'chapters'], locale);
    return stats.minutes > 0 ? `${chapters} · ${stats.minutes} ${uiT('world.minutes', locale)}` : chapters;
  }
  if (mode === 'appendices' && stats.appendices > 0) {
    return countWord(stats.appendices, ['oddíl', 'oddíly', 'oddílů'], ['section', 'sections'], locale);
  }
  if (mode === 'analysis' && stats.analysisParts > 0) {
    return countWord(stats.analysisParts, ['část', 'části', 'částí'], ['part', 'parts'], locale);
  }
  return '';
}

export default function WorldPageShell({
  base,
  baseUrl,
  world,
  chapterTitle,
  chapterAccent,
  themeLabels,
  related = [],
  chapterAccents = {},
  tabStats,
}: Props) {
  const locale = useLocale();
  const inCompare = useCompareTray().includes(world.id);
  const [mode, setMode] = useState<ViewMode>('card');
  const [chronicle, setChronicle] = useState<ChronicleDoc | null>(null);
  const [chronicleLoading, setChronicleLoading] = useState(false);
  const [analysisAnchor, setAnalysisAnchor] = useState<TriadAnchor | null>(null);
  const [resume, setResume] = useState(false);
  const [compact, setCompact] = useState(false);
  const pageFlow = usePageFlow();
  const mastheadRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [spacer, setSpacer] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'chronicle' || view === 'appendices' || view === 'analysis') {
      setMode(view);
    }
    if (params.get('resume') === '1') setResume(true);
  }, []);

  useEffect(() => {
    touchRecent(world.id, world.gameTitle);
  }, [world.id, world.gameTitle]);

  const needsChronicle = mode !== 'card';

  /* Telefon: posouvá se celá stránka. Jakmile plná hlavička světa odjede, vrátí se jako
     stažený pruh (název a záložky), který při čtení dolů zajede a při posunu nahoru se ukáže.
     Nahoře tenká linka přečteného. */
  useEffect(() => {
    if (!pageFlow) {
      setFloating(false);
      setHidden(false);
      return;
    }
    let height = mastheadRef.current?.offsetHeight ?? 0;
    let isFloating = false;
    let isHidden = false;
    let last = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (!isFloating && mastheadRef.current) height = mastheadRef.current.offsetHeight;
      const shouldFloat = y > height;
      if (shouldFloat !== isFloating) {
        isFloating = shouldFloat;
        if (shouldFloat) setSpacer(height);
        isHidden = shouldFloat;
        setHidden(isHidden);
        setFloating(shouldFloat);
        last = y;
      } else if (isFloating && Math.abs(y - last) > 8) {
        const down = y > last;
        if (down !== isHidden) {
          isHidden = down;
          setHidden(down);
        }
        last = y;
      }
      const bar = progressRef.current;
      const pane = paneRef.current;
      if (bar && pane) {
        const rect = pane.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const done = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total));
        bar.style.transform = `scaleX(${done})`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // kronika se načítá později a mění délku stránky: linka přečteného se přepočítá
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onScroll);
    if (resize && paneRef.current) resize.observe(paneRef.current);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      resize?.disconnect();
    };
  }, [pageFlow]);

  useEffect(() => {
    if (!needsChronicle) return;
    let cancelled = false;
    setChronicleLoading(true);
    loadChronicleMarkdown(world.chronicleSlug)
      .then((doc) => {
        if (!cancelled) setChronicle(doc);
      })
      .catch(() => {
        if (!cancelled) setChronicle({ markdown: '' });
      })
      .finally(() => {
        if (!cancelled) setChronicleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [needsChronicle, world.chronicleSlug]);

  const parts = useMemo(
    () => splitChronicleMarkdown(chronicle?.markdown ?? ''),
    [chronicle?.markdown],
  );

  const chapterVars = chapterAccent
    ? ({
        '--chapter-hue-light': chapterAccent.light,
        '--chapter-hue-dark': chapterAccent.dark,
      } as CSSProperties)
    : undefined;

  const tabs: { id: ViewMode; labelKey: string }[] = [
    { id: 'card', labelKey: 'world.viewCard' },
    { id: 'chronicle', labelKey: 'world.viewChronicle' },
    { id: 'appendices', labelKey: 'world.viewAppendices' },
    { id: 'analysis', labelKey: 'world.viewAnalysis' },
  ];

  const missing = (
    <p>
      {uiT('world.chronicleMissing', locale)} <code>npm run import:chronicle</code>.
    </p>
  );

  return (
    <article
      className={`world-card world-card--page${compact || floating ? ' is-compact' : ''}${pageFlow ? ' is-page-flow' : ''}`}
      data-chapter={world.chapterId}
      style={chapterVars}
    >
      {pageFlow && mode !== 'card' ? <div ref={progressRef} className="wp-progress" aria-hidden="true" /> : null}
      <div
        ref={mastheadRef}
        className={`world-page__masthead${floating ? ' is-floating' : ''}${floating && hidden ? ' is-hidden' : ''}`}
      >
        <div className="world-page__wrap">
          <WorldPageMasthead base={base} world={world} chapterTitle={chapterTitle} />
          <nav className="wp-tabs" aria-label={uiT('world.tabsAria', locale)}>
            <div className="wp-tabs__list" role="tablist">
              {tabs.map((tab) => {
                const meta = tabMeta(tab.id, tabStats, locale);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.id}
                    className={`wp-tab${mode === tab.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnalysisAnchor(null);
                      setCompact(false);
                      if (tab.id !== 'card' && chronicle === null) setChronicleLoading(true);
                      setMode(tab.id);
                      if (pageFlow) window.scrollTo({ top: 0 });
                    }}
                  >
                    <span className="wp-tab__label">{uiT(tab.labelKey, locale)}</span>
                    {meta ? <span className="wp-tab__meta"> · {meta}</span> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={`wp-tabs__compare${inCompare ? ' is-in' : ''}`}
              aria-pressed={inCompare}
              onClick={() => toggleCompareTray(world.id)}
            >
              {inCompare ? uiT('home.compareIn', locale) : uiT('home.compareAdd', locale)}
            </button>
          </nav>
        </div>
      </div>
      {floating ? <div className="world-page__masthead-spacer" style={{ height: spacer }} aria-hidden="true" /> : null}

      <div
        ref={paneRef}
        className="world-page__pane"
        onScrollCapture={(e) => {
          if (pageFlow) return;
          // Hlavička se při čtení stáhne; hystereze brání poskakování.
          const top = (e.target as HTMLElement).scrollTop ?? 0;
          if (!compact && top > 80) setCompact(true);
          else if (compact && top < 8) setCompact(false);
        }}
      >
        {mode === 'card' ? (
          <div className="world-page__pane-scroll">
            <WorldCard
              hideHeader
              world={world}
              themeLabels={themeLabels}
              baseUrl={baseUrl}
              onOpenAnalysis={(anchor) => {
                if (chronicle === null) setChronicleLoading(true);
                setAnalysisAnchor(anchor);
                setMode('analysis');
              }}
            />
            <SimilarWorlds items={related} sourceId={world.id} base={base} chapterAccents={chapterAccents} />
          </div>
        ) : chronicleLoading ? (
          <p className="world-chronicle-loading">{uiT('world.chronicleLoading', locale)}</p>
        ) : !chronicle || chronicle.markdown.length === 0 ? (
          missing
        ) : mode === 'chronicle' ? (
          <ChronicleReader
            markdown={parts.narrative}
            variant="narrative"
            coverTitle={chronicle.coverTitle}
            coverTagline={chronicle.coverTagline}
            coverRange={chronicle.coverRange}
            worldId={world.id}
            worldTitle={world.gameTitle}
            resumeOnMount={resume}
          />
        ) : mode === 'appendices' ? (
          parts.appendices ? (
            <ChronicleReader
              markdown={parts.appendices}
              variant="appendices"
              showToc={false}
              showCover={false}
            />
          ) : (
            missing
          )
        ) : parts.analysis ? (
          <ChronicleReader
            markdown={parts.analysis}
            variant="analysis"
            showToc={false}
            showCover={false}
            scrollToId={
              analysisAnchor ? findAnalysisHeadingId(parts.analysis, analysisAnchor) : null
            }
          />
        ) : (
          missing
        )}
      </div>
    </article>
  );
}
