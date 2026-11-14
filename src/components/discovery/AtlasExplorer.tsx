import { useMemo, useState } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { createWorldIndex } from '../../lib/search';
import { useLocale } from '../../lib/locale-store';
import { t, uiT, worldCountLabel } from '../../lib/i18n';

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

  const index = useMemo(() => createWorldIndex(worlds), [worlds]);

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
      return true;
    });
  }, [worlds, index, query, chapterId, theme]);

  const grouped = chapters
    .map((chapter) => ({
      chapter,
      worlds: filtered.filter((world) => world.chapterId === chapter.id),
    }))
    .filter((group) => group.worlds.length > 0);

  return (
    <section className="catalog" aria-label={uiT('home.catalog', locale)}>
      <h2 className="home-section-title">{uiT('home.catalog', locale)}</h2>
      <div className="catalog-toolbar">
        <div>
          <label className="field-label" htmlFor="catalog-search">
            {uiT('search.label', locale)}
          </label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={uiT('search.placeholder', locale)}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="catalog-chapter">
            {uiT('filter.chapter', locale)}
          </label>
          <select
            id="catalog-chapter"
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className="field-input"
          >
            <option value="">{uiT('filter.allChapters', locale)}</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {t(c.title, locale)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="catalog-theme">
            {uiT('filter.theme', locale)}
          </label>
          <select
            id="catalog-theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="field-input"
          >
            <option value="">{uiT('filter.allThemes', locale)}</option>
            {Object.entries(themeLabels).map(([slug, label]) => (
              <option key={slug} value={slug}>
                {t(label, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <p className="catalog-empty">{uiT('home.noResults', locale)}</p>
      ) : (
        grouped.map((group) => (
          <section className="catalog-group" key={group.chapter.id}>
            <h3 className="home-section-title catalog-group__title">
              {t(group.chapter.title, locale)}
              <span className="catalog-group__count">
                {worldCountLabel(group.worlds.length, locale)}
              </span>
            </h3>
            <div className="world-grid">
              {group.worlds.map((world) => {
                const genre = t(world.metadata.genreProfile, locale);
                const atmosphere = t(world.metadata.atmosphere, locale);
                return (
                  <a
                    key={world.id}
                    href={`${baseUrl}/worlds/${world.id}/`}
                    className="world-teaser"
                  >
                    <h3 className="world-teaser__title">
                      {t(world.gameTitle, locale)}
                      {genre ? <span className="world-teaser__genre"> ({genre})</span> : null}
                    </h3>
                    <p className="world-teaser__meta">
                      {[world.yearRange, atmosphere].filter(Boolean).join(' · ')}
                    </p>
                    <p className="world-teaser__core">{t(world.core, locale)}</p>
                  </a>
                );
              })}
            </div>
          </section>
        ))
      )}
    </section>
  );
}
