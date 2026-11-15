import { useMemo, useState, type CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { createWorldIndex } from '../../lib/search';
import { useLocale } from '../../lib/locale-store';
import { t, uiT, worldCountLabel, type Locale } from '../../lib/i18n';
import {
  atmosphereOptions,
  fieldMatchesOption,
  historicalDepthOptions,
  protagonistPerspectiveOptions,
  societalOrderOptions,
  sourceOfPowerOptions,
  spatialScopeOptions,
  type FieldOption,
} from '../../../data/meta/field-options';
import CatalogWorldCard from './CatalogWorldCard';
import ThematicTrails from './ThematicTrails';
import WorldCompass from './WorldCompass';
import { trailById, type TrailId } from '../../lib/trails';
import { latestAdded } from '../../lib/atlas-news';

export type ChapterInfo = {
  id: string;
  title: LocalizedString;
  thesis: LocalizedString;
  accent: { light: string; dark: string };
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
  const newIds = useMemo(() => new Set(latestAdded(worlds, 3).map((world) => world.id)), [worlds]);
  const [query, setQuery] = useState('');
  const [chapterId, setChapterId] = useState(initialChapter);
  const [theme, setTheme] = useState(initialTheme);
  const [atmosphere, setAtmosphere] = useState('');
  const [historicalDepth, setHistoricalDepth] = useState('');
  const [spatialScope, setSpatialScope] = useState('');
  const [societalOrder, setSocietalOrder] = useState('');
  const [sourceOfPower, setSourceOfPower] = useState('');
  const [perspective, setPerspective] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeTrail, setActiveTrail] = useState<TrailId | null>(null);

  const extraActive = Boolean(historicalDepth || spatialScope || societalOrder || sourceOfPower || perspective);
  const anyFilter =
    Boolean(query.trim()) ||
    Boolean(chapterId || theme || atmosphere) ||
    extraActive ||
    Boolean(activeTrail);
  const extraVisible = moreOpen || extraActive;

  const clearFilters = () => {
    setQuery('');
    setChapterId('');
    setTheme('');
    setAtmosphere('');
    setHistoricalDepth('');
    setSpatialScope('');
    setSocietalOrder('');
    setSourceOfPower('');
    setPerspective('');
    setMoreOpen(false);
    setActiveTrail(null);
  };

  const selectTrail = (id: TrailId | null) => {
    setActiveTrail(id);
    if (id) {
      requestAnimationFrame(() => {
        document.getElementById('catalog-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const index = useMemo(() => createWorldIndex(worlds), [worlds]);

  const filtered = useMemo(() => {
    let ids: Set<string> | null = null;
    if (query.trim()) {
      const hits = index.search(query, { prefix: true, fuzzy: 0.15 });
      ids = new Set(hits.map((h) => h.id));
    }
    const trail = trailById(activeTrail);
    return worlds.filter((w) => {
      if (ids && !ids.has(w.id)) return false;
      if (trail && !trail.match(w)) return false;
      if (chapterId && w.chapterId !== chapterId) return false;
      if (theme && !w.themes.includes(theme)) return false;
      if (atmosphere && !fieldMatchesOption(w.metadata.atmosphere, atmosphere)) return false;
      if (historicalDepth && !fieldMatchesOption(w.metadata.historicalDepth, historicalDepth)) return false;
      if (spatialScope && !fieldMatchesOption(w.metadata.spatialScope, spatialScope)) return false;
      if (societalOrder && !fieldMatchesOption(w.metadata.societalOrder, societalOrder)) return false;
      if (sourceOfPower && !fieldMatchesOption(w.metadata.sourceOfPower, sourceOfPower)) return false;
      if (perspective && !fieldMatchesOption(w.metadata.protagonistPerspective, perspective)) return false;
      return true;
    });
  }, [
    worlds,
    index,
    query,
    chapterId,
    theme,
    atmosphere,
    historicalDepth,
    spatialScope,
    societalOrder,
    sourceOfPower,
    perspective,
    activeTrail,
  ]);

  const grouped = chapters
    .map((chapter) => ({
      chapter,
      worlds: filtered.filter((world) => world.chapterId === chapter.id),
    }))
    .filter((group) => group.worlds.length > 0);

  const activeTrailDef = trailById(activeTrail);

  return (
    <>
    <ThematicTrails locale={locale} active={activeTrail} onSelect={selectTrail} />
    <WorldCompass worlds={worlds} locale={locale} base={baseUrl} />
    <section className="catalog" id="catalog-results" aria-label={uiT('home.catalog', locale)}>
      <h2 className="home-section-title">{uiT('home.catalog', locale)}</h2>
      {activeTrailDef ? (
        <p className="trails__chip">
          {uiT('home.trailActive', locale)}: {uiT(activeTrailDef.nameKey, locale)}
          <button type="button" className="trails__chip-clear" onClick={() => setActiveTrail(null)}>
            ×
          </button>
        </p>
      ) : null}
      <div className="catalog-toolbar">
        <div className="catalog-toolbar__search">
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
        <div className="catalog-toolbar__row">
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
              {Object.entries(themeLabels)
                .sort((a, b) => t(a[1], locale).localeCompare(t(b[1], locale), locale))
                .map(([slug, label]) => (
                  <option key={slug} value={slug}>
                    {t(label, locale)}
                  </option>
                ))}
            </select>
          </div>
          <FieldFilter
            id="catalog-atmosphere"
            label={uiT('card.atmosphere', locale)}
            allLabel={uiT('filter.allAtmospheres', locale)}
            value={atmosphere}
            onChange={setAtmosphere}
            options={atmosphereOptions}
            locale={locale}
            sort
          />
          <div className="catalog-toolbar__actions">
            <button
              type="button"
              className="catalog-toolbar__more"
              aria-expanded={extraVisible}
              onClick={() => setMoreOpen((open) => !open)}
            >
              {uiT(extraVisible ? 'home.moreFiltersOpen' : 'home.moreFilters', locale)}
            </button>
            {anyFilter ? (
              <button type="button" className="catalog-toolbar__clear" onClick={clearFilters}>
                {uiT('home.clearFilters', locale)}
              </button>
            ) : null}
          </div>
        </div>
        {extraVisible ? (
          <div className="catalog-toolbar__extra">
            <FieldFilter
              id="catalog-depth"
              label={uiT('card.historicalDepth', locale)}
              allLabel={uiT('filter.allHistoricalDepths', locale)}
              value={historicalDepth}
              onChange={setHistoricalDepth}
              options={historicalDepthOptions}
              locale={locale}
            />
            <FieldFilter
              id="catalog-scope"
              label={uiT('card.spatialScope', locale)}
              allLabel={uiT('filter.allSpatialScopes', locale)}
              value={spatialScope}
              onChange={setSpatialScope}
              options={spatialScopeOptions}
              locale={locale}
            />
            <FieldFilter
              id="catalog-society"
              label={uiT('card.societalOrder', locale)}
              allLabel={uiT('filter.allSocietalOrders', locale)}
              value={societalOrder}
              onChange={setSocietalOrder}
              options={societalOrderOptions}
              locale={locale}
              sort
            />
            <FieldFilter
              id="catalog-power"
              label={uiT('card.sourceOfPower', locale)}
              allLabel={uiT('filter.allSourcesOfPower', locale)}
              value={sourceOfPower}
              onChange={setSourceOfPower}
              options={sourceOfPowerOptions}
              locale={locale}
              sort
            />
            <FieldFilter
              id="catalog-perspective"
              label={uiT('card.protagonistPerspective', locale)}
              allLabel={uiT('filter.allPerspectives', locale)}
              value={perspective}
              onChange={setPerspective}
              options={protagonistPerspectiveOptions}
              locale={locale}
              sort
            />
          </div>
        ) : null}
      </div>

      {grouped.length === 0 ? (
        <p className="catalog-empty">{uiT('home.noResults', locale)}</p>
      ) : (
        grouped.map((group) => (
          <section
            className="catalog-group"
            key={group.chapter.id}
            style={
              {
                '--chapter-hue-light': group.chapter.accent.light,
                '--chapter-hue-dark': group.chapter.accent.dark,
              } as CSSProperties
            }
          >
            <h3 className="home-section-title catalog-group__title">
              {t(group.chapter.title, locale)}
              <span className="catalog-group__count">
                {worldCountLabel(group.worlds.length, locale)}
              </span>
            </h3>
            <div className="world-grid">
              {group.worlds.map((world) => (
                <CatalogWorldCard
                  key={world.id}
                  world={world}
                  locale={locale}
                  base={baseUrl}
                  chapterTitle={group.chapter.title}
                  themeLabels={themeLabels}
                  accent={group.chapter.accent}
                  isNew={newIds.has(world.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </section>
    </>
  );
}

function FieldFilter({
  id,
  label,
  allLabel,
  value,
  onChange,
  options,
  locale,
  sort = false,
}: {
  id: string;
  label: string;
  allLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
  locale: Locale;
  sort?: boolean;
}) {
  const items = sort
    ? [...options].sort((a, b) => t(a, locale).localeCompare(t(b, locale), locale))
    : options;

  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      >
        <option value="">{allLabel}</option>
        {items.map((option) => (
          <option key={option.en} value={option.en}>
            {t(option, locale)}
          </option>
        ))}
      </select>
    </div>
  );
}
