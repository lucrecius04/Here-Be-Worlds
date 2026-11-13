import { useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { createWorldIndex } from '../../lib/search';
import { useLocale } from '../../lib/locale-store';
import { t, uiT, worldCountLabel } from '../../lib/i18n';
import axesMeta from '../../../data/meta/axes.json';

export type ChapterInfo = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: string;
  count: number;
};

type Props = {
  worlds: World[];
  chapters: ChapterInfo[];
  themeLabels: Record<string, LocalizedString>;
  baseUrl?: string;
  initialChapter?: string;
  initialTheme?: string;
};

const AXIS_IDS = [
  'hopeDespair',
  'knownUnknown',
  'intimateEpic',
  'moralClarityAmbiguity',
  'realismMetaphysical',
] as const;

export default function AtlasExplorer({
  worlds,
  chapters,
  themeLabels,
  baseUrl = '',
  initialChapter = '',
  initialTheme = '',
}: Props) {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [chapterId, setChapterId] = useState(initialChapter);
  const [theme, setTheme] = useState(initialTheme);
  const [axisMin, setAxisMin] = useState<Record<string, number>>({});

  const index = useMemo(() => createWorldIndex(worlds), [worlds]);

  const axisFilters = useMemo(
    () =>
      axesMeta.axes.map((axis) => ({
        id: axis.id,
        label: `${t(axis.left, locale)} ↔ ${t(axis.right, locale)}`,
      })),
    [locale],
  );

  const filtered = useMemo(() => {
    let ids: Set<string> | null = null;
    if (query.trim()) {
      const hits = index.search(query, { prefix: true, fuzzy: 0.15 });
      ids = new Set(hits.map((h) => h.id));
    }
    return worlds.filter((w) => {
      if (ids && !ids.has(w.id)) return false;
      if (chapterId && w.chapterId !== chapterId) return false;
      if (theme && !w.themes.includes(theme)) return false;
      for (const id of AXIS_IDS) {
        const min = axisMin[id];
        if (min != null && min > 1 && w.axes[id].value < min) return false;
      }
      return true;
    });
  }, [worlds, index, query, chapterId, theme, axisMin]);

  return (
    <div className="atlas-explorer">
      <aside className="atlas-explorer__filters">
        <label className="field-label">{uiT('search.label', locale)}</label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={uiT('search.placeholder', locale)}
          className="field-input"
        />
        <label className="field-label">{uiT('filter.chapter', locale)}</label>
        <select
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="field-input"
        >
          <option value="">{uiT('filter.allChapters', locale)}</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {t(c.title, locale)} ({c.count})
            </option>
          ))}
        </select>
        <label className="field-label">{uiT('filter.theme', locale)}</label>
        <select value={theme} onChange={(e) => setTheme(e.target.value)} className="field-input">
          <option value="">{uiT('filter.allThemes', locale)}</option>
          {Object.entries(themeLabels).map(([slug, label]) => (
            <option key={slug} value={slug}>
              {t(label, locale)}
            </option>
          ))}
        </select>
        <p className="field-label">{uiT('filter.axisMin', locale)}</p>
        {axisFilters.map((ax) => (
          <div key={ax.id} className="axis-filter">
            <label style={{ fontSize: '0.8rem' }}>{ax.label}</label>
            <input
              type="range"
              min={1}
              max={5}
              value={axisMin[ax.id] ?? 1}
              onChange={(e) =>
                setAxisMin((prev) => ({ ...prev, [ax.id]: Number(e.target.value) }))
              }
            />
          </div>
        ))}
      </aside>
      <div className="atlas-explorer__results">
        <p style={{ color: 'var(--color-ink-muted)', marginBottom: '1rem' }}>
          {worldCountLabel(filtered.length, locale)}
        </p>
        <div className="world-grid">
          {filtered.map((w) => (
            <a key={w.id} href={`${baseUrl}/worlds/${w.id}/`} className="world-teaser">
              <div className="meta-tile__label">
                #{w.number} · {t(chapters.find((c) => c.id === w.chapterId)?.title ?? { en: '', cs: '' }, locale)}
              </div>
              <h3 className="world-teaser__title">{t(w.gameTitle, locale)}</h3>
              <p className="world-teaser__sub">{t(w.chronicleTitle, locale)}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
