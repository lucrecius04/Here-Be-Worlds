import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { withBase } from '../../lib/base-url';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import type { ChapterAccent } from '../../lib/worlds';
import { loadChronicleMarkdown, type ChronicleDoc } from '../../lib/chronicles';
import { findAnalysisHeadingId, splitChronicleMarkdown, type TriadAnchor } from '../../lib/chronicle-toc';
import WorldPageMasthead from './WorldPageMasthead';
import WorldCard from './WorldCard';
import SimilarWorlds, { type ChapterAccentMap, type RelatedItem } from './SimilarWorlds';
import WorldJourneys, { type WorldJourney } from './WorldJourneys';
import ChronicleReader from '../chronicle/ChronicleReader';
import { touchRecent } from '../../lib/reader-desk';
import { BAR_HIDES_QUERY, useMediaQuery, usePageFlow } from '../../lib/page-flow';

type ViewMode = 'card' | 'chronicle' | 'appendices' | 'analysis' | 'journeys';

type Props = {
  base: string;
  baseUrl: string;
  world: World;
  chapterTitle?: LocalizedString;
  overlapTitle?: LocalizedString;
  chapterAccent?: ChapterAccent;
  themeLabels: Record<string, LocalizedString>;
  related?: RelatedItem[];
  chapterAccents?: ChapterAccentMap;
  journeys?: WorldJourney[];
  /** Rozměry obrázků kroniky (`/chronicles/…png` → [šířka, výška]) z doby sestavení. */
  imageSizes?: Record<string, [number, number]>;
};

export default function WorldPageShell({
  base,
  baseUrl,
  world,
  chapterTitle,
  overlapTitle,
  chapterAccent,
  themeLabels,
  related = [],
  chapterAccents = {},
  journeys = [],
  imageSizes,
}: Props) {
  const locale = useLocale();
  const [mode, setMode] = useState<ViewMode>('card');
  const [chronicle, setChronicle] = useState<ChronicleDoc | null>(null);
  const [chronicleLoading, setChronicleLoading] = useState(false);
  const [analysisAnchor, setAnalysisAnchor] = useState<TriadAnchor | null>(null);
  const [resume, setResume] = useState(false);
  // Kotva z adresy (#kapitola) — odkaz z hledání vede přímo na oddíl kroniky.
  const [hashTarget, setHashTarget] = useState<string | null>(null);
  const pageFlow = usePageFlow();
  const barHides = useMediaQuery(BAR_HIDES_QUERY);
  const mastheadRef = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [animated, setAnimated] = useState(false);
  const [spacer, setSpacer] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'chronicle' || view === 'appendices' || view === 'analysis' || view === 'journeys') {
      setMode(view);
    }
    if (params.get('resume') === '1') setResume(true);
    const readHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      setHashTarget(id || null);
    };
    readHash();
    window.addEventListener('hashchange', readHash);
    return () => window.removeEventListener('hashchange', readHash);
  }, []);

  useEffect(() => {
    touchRecent(world.id, world.gameTitle);
  }, [world.id, world.gameTitle]);

  /* na úzkém displeji se záložky posouvají do strany: aktivní ať je vždy vidět */
  useEffect(() => {
    const list = document.querySelector<HTMLElement>('.wp-tabs');
    const active = list?.querySelector<HTMLElement>('.wp-tab.is-active');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const left = active.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
    if (left < list.scrollLeft || left + active.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollLeft = Math.max(0, left - 16);
    }
  }, [mode]);

  const needsChronicle = mode === 'chronicle' || mode === 'appendices' || mode === 'analysis';

  /* Posouvá se celá stránka. Jakmile plná hlavička světa odjede, vrátí se jako stažený pruh
     (název a záložky). Na telefonu při čtení dolů zajede a při posunu nahoru se ukáže; nastupuje
     schovaný a bez animace, aby při prvním posunu neproblikl. Na počítači plynule sjede shora a
     zůstane. Zpátky do plné hlavičky se přepne, až by pod pruhem byla vidět víc než jeho výška.
     Výšku pruhu dává do --wp-bar-h, aby se pod něj mohl přilepit obsah kroniky. */
  useEffect(() => {
    if (!pageFlow) {
      setFloating(false);
      setHidden(false);
      setAnimated(false);
      return;
    }
    // spodní hrana plné hlavičky v dokumentu (pod ní je ještě hlavička webu)
    const measureBottom = () => {
      const head = mastheadRef.current;
      return head ? head.getBoundingClientRect().bottom + window.scrollY : 0;
    };
    let fullBottom = measureBottom();
    let fullHeight = mastheadRef.current?.offsetHeight ?? 0;
    let barHeight = 0;
    let isFloating = false;
    let isHidden = false;
    let last = window.scrollY;
    let frame = 0;
    let arm = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const head = mastheadRef.current;
      if (head) {
        if (isFloating) {
          if (head.offsetHeight !== barHeight) {
            barHeight = head.offsetHeight;
            document.documentElement.style.setProperty('--wp-bar-h', `${barHeight}px`);
          }
        } else {
          fullHeight = head.offsetHeight;
          fullBottom = measureBottom();
        }
      }
      if (!isFloating && y > fullBottom) {
        isFloating = true;
        isHidden = true;
        setSpacer(fullHeight);
        setAnimated(false);
        setHidden(true);
        setFloating(true);
        cancelAnimationFrame(arm);
        arm = requestAnimationFrame(() => {
          arm = requestAnimationFrame(() => {
            setAnimated(true);
            if (!barHides) {
              isHidden = false;
              setHidden(false);
            }
          });
        });
        last = y;
        return;
      }
      if (isFloating && y < fullBottom - Math.max(barHeight, 1)) {
        isFloating = false;
        isHidden = false;
        cancelAnimationFrame(arm);
        setAnimated(false);
        setHidden(false);
        setFloating(false);
        last = y;
        return;
      }
      if (isFloating && barHides && Math.abs(y - last) > 10) {
        const down = y > last;
        if (down !== isHidden) {
          isHidden = down;
          setHidden(down);
        }
        last = y;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      cancelAnimationFrame(arm);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pageFlow, barHides]);

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
    ...(journeys.length ? [{ id: 'journeys' as ViewMode, labelKey: 'world.viewJourneys' }] : []),
  ];

  const missing = (
    <p>
      {uiT('world.chronicleMissing', locale)} <code>npm run import:chronicle</code>.
    </p>
  );

  return (
    <article
      className={`world-card world-card--page${floating ? ' is-compact' : ''}${pageFlow ? ' is-page-flow' : ''}`}
      data-chapter={world.chapterId}
      style={chapterVars}
    >
      <div
        ref={mastheadRef}
        className={`world-page__masthead${floating ? ' is-floating' : ''}${floating && hidden ? ' is-hidden' : ''}${floating && animated ? ' is-animated' : ''}`}
      >
        <div className="world-page__wrap">
          <WorldPageMasthead base={base} world={world} chapterTitle={chapterTitle} overlapTitle={overlapTitle} />
          <nav className="wp-tabs" aria-label={uiT('world.tabsAria', locale)}>
            <div className="wp-tabs__list" role="tablist">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={mode === tab.id}
                    className={`wp-tab${mode === tab.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnalysisAnchor(null);
                      // kotva z odkazu platí jen pro první otevření, ne pro přepnutí záložky
                      if (hashTarget) {
                        setHashTarget(null);
                        history.replaceState(null, '', window.location.pathname + window.location.search);
                      }
                      if (tab.id !== 'card' && tab.id !== 'journeys' && chronicle === null) setChronicleLoading(true);
                      setMode(tab.id);
                      if (pageFlow) window.scrollTo({ top: 0 });
                    }}
                  >
                    <span className="wp-tab__label">{uiT(tab.labelKey, locale)}</span>
                  </button>
                );
              })}
            </div>
            {/* Srovnat = rovnou stránka srovnání s tímto světem v prvním okénku (2026-11-28, majitel;
                dřívější zásobník srovnání byl neintuitivní) */}
            <a className="wp-tabs__compare" href={withBase(base, `/compare/?w=${world.id}`)}>
              {uiT('home.compareAdd', locale)}
            </a>
          </nav>
        </div>
      </div>
      {floating ? <div className="world-page__masthead-spacer" style={{ height: spacer }} aria-hidden="true" /> : null}

      <div className="world-page__pane">
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
        ) : mode === 'journeys' ? (
          <div className="world-page__pane-scroll">
            <WorldJourneys worldId={world.id} journeys={journeys} base={base} />
          </div>
        ) : chronicleLoading ? (
          <p className="world-chronicle-loading">{uiT('world.chronicleLoading', locale)}</p>
        ) : !chronicle || chronicle.markdown.length === 0 ? (
          missing
        ) : mode === 'chronicle' ? (
          <ChronicleReader
            imageSizes={imageSizes}
            markdown={parts.narrative}
            variant="narrative"
            coverTitle={chronicle.coverTitle}
            coverTagline={chronicle.coverTagline}
            coverRange={chronicle.coverRange}
            worldId={world.id}
            worldTitle={world.gameTitle}
            resumeOnMount={resume && !hashTarget}
            scrollToId={hashTarget}
          />
        ) : mode === 'appendices' ? (
          parts.appendices ? (
            <ChronicleReader
              imageSizes={imageSizes}
              markdown={parts.appendices}
              variant="appendices"
              showToc={false}
              showCover={false}
              scrollToId={hashTarget}
            />
          ) : (
            missing
          )
        ) : parts.analysis ? (
          <ChronicleReader
            imageSizes={imageSizes}
            markdown={parts.analysis}
            variant="analysis"
            showToc={false}
            showCover={false}
            scrollToId={
              analysisAnchor ? findAnalysisHeadingId(parts.analysis, analysisAnchor) : hashTarget
            }
          />
        ) : (
          missing
        )}
      </div>
    </article>
  );
}
