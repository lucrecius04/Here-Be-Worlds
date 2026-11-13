import { useEffect, useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { loadChronicleMarkdown, type ChronicleDoc } from '../../lib/chronicles';
import { splitChronicleMarkdown } from '../../lib/chronicle-toc';
import WorldPageMasthead from './WorldPageMasthead';
import WorldCard from './WorldCard';
import SimilarWorlds from './SimilarWorlds';
import ChronicleReader from '../chronicle/ChronicleReader';

type ViewMode = 'card' | 'chronicle' | 'appendices' | 'analysis';

type Props = {
  base: string;
  baseUrl: string;
  world: World;
  chapterTitle?: LocalizedString;
  themeLabels: Record<string, LocalizedString>;
  similar: World[];
};

export default function WorldPageShell({
  base,
  baseUrl,
  world,
  chapterTitle,
  themeLabels,
  similar,
}: Props) {
  const locale = useLocale();
  const [mode, setMode] = useState<ViewMode>('card');
  const [chronicle, setChronicle] = useState<ChronicleDoc | null>(null);
  const [chronicleLoading, setChronicleLoading] = useState(false);

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
    <article className="world-card world-card--page">
      <div className="world-page__masthead">
        <WorldPageMasthead base={base} world={world} chapterTitle={chapterTitle} />
        <div className="view-mode-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mode === tab.id}
              className={`view-tab${mode === tab.id ? ' view-tab--active' : ''}`}
              onClick={() => {
                if (tab.id !== 'card' && chronicle === null) setChronicleLoading(true);
                setMode(tab.id);
              }}
            >
              {uiT(tab.labelKey, locale)}
            </button>
          ))}
        </div>
      </div>

      <div className="world-page__pane">
        {mode === 'card' ? (
          <div className="world-page__pane-scroll">
            <WorldCard hideHeader world={world} themeLabels={themeLabels} baseUrl={baseUrl} />
            <SimilarWorlds worlds={similar} baseUrl={baseUrl} />
          </div>
        ) : chronicleLoading ? (
          <p className="world-chronicle-loading">{uiT('world.chronicleLoading', locale)}</p>
        ) : !chronicle || chronicle.markdown.length === 0 ? (
          missing
        ) : mode === 'chronicle' ? (
          <ChronicleReader
            markdown={parts.narrative}
            coverTitle={chronicle.coverTitle}
            coverTagline={chronicle.coverTagline}
            coverRange={chronicle.coverRange}
          />
        ) : mode === 'appendices' ? (
          parts.appendices ? (
            <ChronicleReader markdown={parts.appendices} showToc={false} showCover={false} />
          ) : (
            missing
          )
        ) : parts.analysis ? (
          <ChronicleReader markdown={parts.analysis} showToc={false} showCover={false} />
        ) : (
          missing
        )}
      </div>
    </article>
  );
}
