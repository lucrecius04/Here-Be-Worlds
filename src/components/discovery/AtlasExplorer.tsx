import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { World } from '../../schemas/world';
import type { LocalizedString } from '../../schemas/world';
import { createWorldIndex, searchWorldIds } from '../../lib/search';
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
import narrationData from '../../../data/meta/narration-taxonomy.json';
import CatalogWorldCard from './CatalogWorldCard';
import { withBase } from '../../lib/base-url';

const narrationOptions: FieldOption[] = narrationData.narration.map((item) => ({ en: item.label.en, cs: item.label.cs }));
const narrationSlugByEn = Object.fromEntries(narrationData.narration.map((item) => [item.label.en, item.slug]));
import WorldCompass from './WorldCompass';
import { TRAILS, trailById, type TrailId } from '../../lib/trails';
import { latestAdded } from '../../lib/atlas-news';

/** Krátká jména archetypů jako v rejstříku na titulní straně. */
const SHORT_NAME: Record<string, string> = {
  fantasy: 'home2.skyFantasy',
  'science-fiction': 'home2.skyScienceFiction',
  'post-apocalypse': 'home2.skyPostApocalypse',
  horror: 'home2.skyHorror',
  historical: 'home2.skyHistorical',
  dystopia: 'home2.skyDystopia',
  metaphysical: 'home2.skyMetaphysical',
};

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
  const [narration, setNarration] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [compassOpen, setCompassOpen] = useState(false);
  const [trailsOpen, setTrailsOpen] = useState(false);
  const [activeTrail, setActiveTrail] = useState<TrailId | null>(null);

  // Odkazy z titulní strany a z karet světa: /atlas/?theme=… a /atlas/?trail=…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam && themeLabels[themeParam]) setTheme(themeParam);
    const trailParam = params.get('trail');
    if (trailParam && TRAILS.some((trail) => trail.id === trailParam)) setActiveTrail(trailParam as TrailId);
    if (params.get('stezky')) {
      setTrailsOpen(true);
      requestAnimationFrame(() =>
        document.getElementById('catalog-results')?.scrollIntoView({ block: 'start' }),
      );
    }
    if (themeParam || trailParam) {
      requestAnimationFrame(() =>
        document.getElementById('catalog-results')?.scrollIntoView({ block: 'start' }),
      );
    }
  }, [themeLabels]);

  const extraCount = [historicalDepth, spatialScope, societalOrder, sourceOfPower, perspective, narration].filter(Boolean).length;
  const extraActive = extraCount > 0;
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
    setNarration('');
    setMoreOpen(false);
    setActiveTrail(null);
  };

  // Souřadnice a stezky se rozbalují pod sebou; otevřené obě by kompas odsunuly z dohledu.
  const toggleCompass = () => {
    const next = !compassOpen;
    setCompassOpen(next);
    if (next) setTrailsOpen(false);
  };

  const toggleTrails = () => {
    const next = !trailsOpen;
    setTrailsOpen(next);
    if (next) setCompassOpen(false);
  };

  const openTrailsFromLead = () => {
    setCompassOpen(false);
    setTrailsOpen(true);
    requestAnimationFrame(() =>
      document.getElementById('catalog-trails')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  const selectTrail = (id: TrailId | null) => {
    setActiveTrail(id);
    if (id) {
      setTrailsOpen(false);
      requestAnimationFrame(() => {
        document.getElementById('catalog-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const index = useMemo(() => createWorldIndex(worlds), [worlds]);

  const unscoped = useMemo(() => {
    let ids: Set<string> | null = null;
    if (query.trim()) {
      ids = searchWorldIds(index, query);
    }
    const trail = trailById(activeTrail);
    return worlds.filter((w) => {
      if (ids && !ids.has(w.id)) return false;
      if (trail && !trail.match(w)) return false;
      if (theme && !w.themes.includes(theme)) return false;
      if (atmosphere && !fieldMatchesOption(w.metadata.atmosphere, atmosphere)) return false;
      if (historicalDepth && !fieldMatchesOption(w.metadata.historicalDepth, historicalDepth)) return false;
      if (spatialScope && !fieldMatchesOption(w.metadata.spatialScope, spatialScope)) return false;
      if (societalOrder && !fieldMatchesOption(w.metadata.societalOrder, societalOrder)) return false;
      if (sourceOfPower && !fieldMatchesOption(w.metadata.sourceOfPower, sourceOfPower)) return false;
      if (perspective && !fieldMatchesOption(w.metadata.protagonistPerspective, perspective)) return false;
      if (narration && !(w.narration ?? []).includes(narrationSlugByEn[narration])) return false;
      return true;
    });
  }, [
    worlds,
    index,
    query,
    theme,
    atmosphere,
    historicalDepth,
    spatialScope,
    societalOrder,
    sourceOfPower,
    perspective,
    narration,
    activeTrail,
  ]);

  const filtered = useMemo(
    () => (chapterId ? unscoped.filter((w) => w.chapterId === chapterId) : unscoped),
    [unscoped, chapterId],
  );

  const countByChapter = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of unscoped) counts.set(w.chapterId, (counts.get(w.chapterId) ?? 0) + 1);
    return counts;
  }, [unscoped]);

  const grouped = chapters
    .map((chapter) => ({
      chapter,
      worlds: filtered.filter((world) => world.chapterId === chapter.id),
    }))
    .filter((group) => group.worlds.length > 0);

  const activeTrailDef = trailById(activeTrail);

  return (
    <>
    <header className="atlas-page__head">
      <h1 className="atlas-page__title display">{uiT('atlasPage.title', locale)}</h1>
      <p className="atlas-page__lead">
        {uiT('atlasPage.lead', locale)}
        <button type="button" className="atlas-page__lead-link" aria-expanded={trailsOpen} onClick={openTrailsFromLead}>
          {uiT('atlasPage.leadTrails', locale).replace('{n}', String(TRAILS.length))}
        </button>
        {uiT('atlasPage.leadEnd', locale)}
      </p>
    </header>
    <section className="catalog" id="catalog-results" aria-label={uiT('home.catalog', locale)}>
      <div className="atlas-tabs" role="group" aria-label={uiT('filter.chapter', locale)}>
        <button
          type="button"
          className={`atlas-tab${chapterId ? '' : ' is-on'}`}
          aria-pressed={!chapterId}
          onClick={() => setChapterId('')}
        >
          {uiT('atlasPage.allTab', locale)}
          <span className="atlas-tab__count">{unscoped.length}</span>
        </button>
        {chapters.map((c) => {
          const count = countByChapter.get(c.id) ?? 0;
          const on = chapterId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`atlas-tab${on ? ' is-on' : ''}${count ? '' : ' is-empty'}`}
              aria-pressed={on}
              title={t(c.title, locale)}
              style={
                {
                  '--chapter-hue-light': c.accent.light,
                  '--chapter-hue-dark': c.accent.dark,
                } as CSSProperties
              }
              onClick={() => setChapterId(on ? '' : c.id)}
            >
              {uiT(SHORT_NAME[c.id] ?? '', locale) || t(c.title, locale)}
              <span className="atlas-tab__count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="catalog-toolbar">
        <div className="catalog-toolbar__row">
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
              aria-label={uiT('search.label', locale)}
              className="field-input"
            />
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
        </div>

        <div className="catalog-toolbar__links">
          <button
            type="button"
            className="catalog-toolbar__toggle"
            aria-expanded={extraVisible}
            onClick={() => setMoreOpen((open) => !open)}
          >
            {uiT('home.moreFilters', locale)}
            {extraCount ? ` (${extraCount})` : ''}
            <span aria-hidden="true">{extraVisible ? ' −' : ' +'}</span>
          </button>
          <button
            type="button"
            className="catalog-toolbar__toggle"
            aria-expanded={compassOpen}
            onClick={toggleCompass}
          >
            {uiT('home.compassToggle', locale)}
            <span aria-hidden="true">{compassOpen ? ' −' : ' +'}</span>
          </button>
          <button
            type="button"
            className="catalog-toolbar__toggle"
            aria-expanded={trailsOpen}
            onClick={toggleTrails}
          >
            {uiT('trails.toggle', locale)}
            {activeTrailDef ? `: ${uiT(activeTrailDef.nameKey, locale)}` : ''}
            <span aria-hidden="true">{trailsOpen ? ' −' : ' +'}</span>
          </button>
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
            <FieldFilter
              id="catalog-narration"
              label={uiT('card.narrationHeading', locale)}
              allLabel={uiT('filter.allNarrations', locale)}
              value={narration}
              onChange={setNarration}
              options={narrationOptions}
              locale={locale}
              sort
            />
          </div>
        ) : null}
      </div>

      {trailsOpen ? (
        <div className="catalog-trails" id="catalog-trails" role="group" aria-label={uiT('home.trailsTitle', locale)}>
          {TRAILS.map((trail) => {
            const on = activeTrail === trail.id;
            return (
              <button
                key={trail.id}
                type="button"
                className={`catalog-trail${on ? ' is-on' : ''}`}
                aria-pressed={on}
                onClick={() => selectTrail(on ? null : trail.id)}
              >
                <span className="catalog-trail__name">
                  {uiT(trail.nameKey, locale)}
                  <span className="catalog-trail__count">{trail.members.length}</span>
                </span>
                <span className="catalog-trail__desc">{uiT(trail.descKey, locale)}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      <WorldCompass worlds={worlds} locale={locale} base={baseUrl} open={compassOpen} />

      <div className="catalog-status" id="catalog-status" aria-live="polite">
        <p className="catalog-status__count">
          {anyFilter ? `${uiT('atlasPage.found', locale)}: ` : ''}
          <strong>{worldCountLabel(filtered.length, locale)}</strong>
          {anyFilter ? (
            <>
              {' · '}
              <button type="button" className="catalog-status__clear" onClick={clearFilters}>
                {uiT('home.clearFilters', locale)}
              </button>
            </>
          ) : null}
        </p>
        {activeTrailDef ? (
          <p className="catalog-status__trail">
            <span>{uiT(activeTrailDef.nameKey, locale)}</span> {uiT(activeTrailDef.descKey, locale)}
          </p>
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
            <h3 className="catalog-group__title">
              <a className="catalog-group__tab" href={withBase(baseUrl, `/chapters/${group.chapter.id}/`)} title={t(group.chapter.title, locale)}>
                {uiT(SHORT_NAME[group.chapter.id] ?? '', locale) || t(group.chapter.title, locale)} · {group.worlds.length}
              </a>
            </h3>
            <div className="catalog-grid">
              {group.worlds.map((world) => (
                <CatalogWorldCard
                  key={world.id}
                  world={world}
                  locale={locale}
                  base={baseUrl}
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
