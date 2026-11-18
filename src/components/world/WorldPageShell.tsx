import { useEffect, useMemo, useState, type CSSProperties } from 'react';
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

type ViewMode = 'card' | 'chronicle' | 'appendices' | 'analysis';

type Props = {
  base: string;
  baseUrl: string;
  world: World;
  chapterTitle?: LocalizedString;
  chapterAccent?: ChapterAccent;
  themeLabels: Record<string, LocalizedString>;
  related?: Array<RelatedWorld & { href?: string; level?: number; number?: number; chapterId?: string }>;
  chapterLetter?: string;
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
  chapterLetter = '',
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
      className={`world-card world-card--page${compact ? ' is-compact' : ''}`}
      data-chapter={world.chapterId}
      style={chapterVars}
    >
      <div className="world-page__masthead">
        <div className="world-page__wrap">
          <WorldPageMasthead base={base} world={world} chapterTitle={chapterTitle} chapterLetter={chapterLetter} />
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

      <div
        className="world-page__pane"
        onScrollCapture={(e) => {
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
