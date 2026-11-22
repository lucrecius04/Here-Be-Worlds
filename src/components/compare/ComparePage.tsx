import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  MAX_COMPARE,
  curatedPairs,
  discoveryPairs,
  kinshipCutoffs,
  kinshipLevel,
  kinshipPairs,
  kinshipPercent,
  kinshipRanking,
  levelFromPercent,
  pillarStrength,
  type AffinityBreakdown,
  type DiscoveryPair,
  type KinshipLevel,
  parseCompareIds,
  slotHue,
  themeCoverage,
  valueFrequencies,
  writeCompareQuery,
} from '../../lib/compare';
import AxisOverlay from './AxisOverlay';
import '../../styles/compare.css';

type ChapterInfo = {
  id: string;
  title: LocalizedString;
  short?: LocalizedString;
  accent: { light: string; dark: string };
};

type AxisMeta = {
  id: string;
  left: LocalizedString;
  right: LocalizedString;
  help: LocalizedString;
};

type TrailInfo = {
  id: string;
  slug: string;
  nameKey: string;
  descKey: string;
  members: string[];
  minutes: number | null;
};

type Props = {
  trails?: TrailInfo[];
  worlds: World[];
  chapters: ChapterInfo[];
  themeLabels: Record<string, LocalizedString>;
  axes: AxisMeta[];
  base: string;
};

type FactRow = {
  id: string;
  label: string;
  values: string[];
  subs: Array<string | null>;
};

type FilledSlot = {
  index: number;
  world: World;
};

type FactFilter = 'all' | 'diffs' | 'matches';

const PILLARS = [
  { key: 'archetype', label: 'compare.affinityArchetype', max: 20 },
  { key: 'axes', label: 'compare.affinityAxes', max: 35 },
  { key: 'character', label: 'compare.affinityCharacter', max: 30 },
  { key: 'themes', label: 'compare.affinityThemes', max: 15 },
] as const;

function genreSub(world: World, locale: Locale): string {
  const main = t(world.metadata.genreProfile, locale);
  const extra = world.metadata.genreProfile.sub ? t(world.metadata.genreProfile.sub, locale) : '';
  if (main && extra) return `${main} · ${extra}`;
  return extra || main;
}

function hueStyle(index: number): CSSProperties {
  return { '--slot-hue': slotHue(index) } as CSSProperties;
}

function Mark({ hue }: { hue: string }) {
  return <span className="cmp-mark" style={{ '--slot-hue': hue } as CSSProperties} aria-hidden="true" />;
}

function Ticks({ level }: { level: KinshipLevel }) {
  return (
    <span className="cmp-ticks" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= level ? 'is-on' : ''} />
      ))}
    </span>
  );
}

/** Oddíl srovnání: nadpis přes celou šířku s linkou nahoře, vpravo volitelné nástroje. */
function Section({
  title,
  tools,
  children,
  className = '',
}: {
  title: string;
  tools?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cmp-section ${className}`} aria-label={title}>
      <div className="cmp-section__head">
        <h2 className="cmp-section__title display">{title}</h2>
        {tools ? <div className="cmp-section__tools">{tools}</div> : null}
      </div>
      {children}
    </section>
  );
}

function MethodHint({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="cmp-method" ref={rootRef}>
      <button type="button" className="cmp-textbtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {uiT('compare.affinityHint', locale)}
      </button>
      {open ? (
        <div className="cmp-method__pop" role="dialog" aria-label={uiT('compare.affinityMethod', locale)}>
          {uiT('compare.methodLines', locale)
            .split('|')
            .map((line) => (
              <p key={line}>{line}</p>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function Pillars({ score, locale }: { score: AffinityBreakdown; locale: Locale }) {
  return (
    <div className="cmp-pillars">
      {PILLARS.map((pillar) => {
        const value = score[pillar.key];
        return (
          <div key={pillar.key} className="cmp-pillar">
            <span className="cmp-pillar__label">{uiT(pillar.label, locale)}</span>
            <span className="cmp-pillar__value">
              {uiT(`compare.strength${pillarStrength(value, pillar.max)}`, locale)}
            </span>
            <span className="cmp-pillar__track" aria-hidden="true">
              <span style={{ width: `${Math.min(100, (value / pillar.max) * 100)}%` }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ComparePage({ worlds, chapters, themeLabels, axes, base, trails = [] }: Props) {
  const locale = useLocale();
  const catalog = useMemo(() => worlds.filter((world) => !world.draft), [worlds]);
  const validIds = useMemo(() => new Set(catalog.map((world) => world.id)), [catalog]);
  const byId = useMemo(() => new Map(catalog.map((world) => [world.id, world])), [catalog]);
  const chapterById = useMemo(() => new Map(chapters.map((chapter) => [chapter.id, chapter])), [chapters]);
  const sortedCatalog = useMemo(
    () => [...catalog].sort((a, b) => t(a.gameTitle, locale).localeCompare(t(b.gameTitle, locale), locale)),
    [catalog, locale],
  );

  const [slots, setSlots] = useState<Array<string | null>>([null, null]);
  const [stickyOn, setStickyOn] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [factFilter, setFactFilter] = useState<FactFilter>('all');
  const [activePairKey, setActivePairKey] = useState<string | null>(null);
  const [addingThird, setAddingThird] = useState(false);
  /* náměty se při každé návštěvě (a po „Jiné náměty“) losují ze zásobníků; do načtení stránky pevné pořadí */
  const [seed, setSeed] = useState(0);
  useEffect(() => setSeed(Math.floor(Math.random() * 1e9)), []);
  const slotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseCompareIds(window.location.search, validIds);
    const next =
      parsed.length >= MAX_COMPARE
        ? [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null]
        : [parsed[0] ?? null, parsed[1] ?? null];
    setSlots(next);
    writeCompareQuery(next.filter((id): id is string => Boolean(id)));
  }, [validIds]);

  const commit = (next: Array<string | null>) => {
    setSlots(next);
    setAddingThird(false);
    writeCompareQuery(next.filter((id): id is string => Boolean(id)));
  };

  const setSlot = (index: number, id: string | null) => {
    if (id) {
      const next = [...slots];
      while (next.length <= index) next.push(null);
      next[index] = id;
      commit(next);
      return;
    }
    const remaining = slots.filter((slot, i) => i !== index && Boolean(slot));
    if (remaining.length >= 2) {
      commit(remaining);
      return;
    }
    const next = slots.map((slot, i) => (i === index ? null : slot));
    commit(next.length > 2 ? next.slice(0, 2) : next);
  };

  /** Druhý svět do prvního volného místa (náměty u jednoho vybraného světa). */
  const fillFree = (id: string) => {
    const free = slots.findIndex((slot) => !slot);
    setSlot(free === -1 ? slots.length : free, id);
  };

  const filled: FilledSlot[] = slots.flatMap((id, index) => {
    const world = id ? byId.get(id) : undefined;
    return world ? [{ index, world }] : [];
  });
  const selected = filled.map((item) => item.world);
  const hues = filled.map((item) => slotHue(item.index));
  const ready = selected.length >= 2;
  const taken = new Set(slots.filter((slot): slot is string => Boolean(slot)));
  const shownSlots = addingThird && slots.length === 2 ? [...slots, null] : slots;
  const colCount = shownSlots.filter((id, i) => !(i === 2 && !id && !addingThird)).length;

  useEffect(() => {
    const node = slotsRef.current;
    if (!node || !ready) {
      setStickyOn(false);
      return;
    }
    const header = document.querySelector('.site-header');
    const headerPx =
      header && getComputedStyle(header).position === 'sticky'
        ? Math.round(header.getBoundingClientRect().height)
        : 0;
    const observer = new IntersectionObserver(([entry]) => setStickyOn(!entry.isIntersecting), {
      root: null,
      threshold: 0,
      rootMargin: `-${headerPx}px 0px 0px 0px`,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, selected.length]);

  const cutoffs = useMemo(() => kinshipCutoffs(worlds), [worlds]);
  const discovery = useMemo(() => discoveryPairs(catalog), [catalog]);
  const curated = useMemo(() => curatedPairs(catalog), [catalog]);
  const draw = (pool: DiscoveryPair[], salt: number) => pickSome(pool, 3, seed ? seed + salt : 0);
  const pairLevel = (a: World, b: World) => kinshipLevel(a, b, worlds);

  const coverage = ready ? themeCoverage(selected) : [];
  const pairScores = ready ? kinshipPairs(selected) : [];
  const pairKey = (pair: { left: number; right: number }) => `${pair.left}-${pair.right}`;
  const resolvedPairKey =
    activePairKey && pairScores.some((pair) => pairKey(pair) === activePairKey)
      ? activePairKey
      : pairScores[0]
        ? pairKey(pairScores[0])
        : null;
  const activePair = pairScores.find((pair) => pairKey(pair) === resolvedPairKey) ?? pairScores[0];
  const verdictLevel: KinshipLevel | null = ready
    ? selected.length === 2
      ? pairLevel(selected[0], selected[1])
      : levelFromPercent(kinshipPercent(selected), cutoffs)
    : null;

  const factRows: FactRow[] = ready
    ? [
        {
          id: 'archetype',
          label: uiT('world.genreLine', locale),
          values: selected.map((world) => {
            const chapter = chapterById.get(world.chapterId);
            return chapter ? t(chapter.title, locale) : world.chapterId;
          }),
          subs: selected.map((world) => genreSub(world, locale) || null),
        },
        factField(selected, locale, 'atmosphere', uiT('card.atmosphere', locale)),
        factField(selected, locale, 'historicalDepth', uiT('card.historicalDepth', locale)),
        factField(selected, locale, 'spatialScope', uiT('card.spatialScope', locale)),
        factField(selected, locale, 'societalOrder', uiT('card.societalOrder', locale)),
        factField(selected, locale, 'sourceOfPower', uiT('card.sourceOfPower', locale)),
        factField(selected, locale, 'protagonistPerspective', uiT('card.protagonistPerspective', locale)),
        factField(selected, locale, 'keyActors', uiT('card.keyActors', locale)),
      ]
    : [];

  const triadRows: FactRow[] = ready
    ? [
        triadField(selected, locale, 'originalSin', uiT('card.originalSin', locale)),
        triadField(selected, locale, 'centralDilemma', uiT('card.centralDilemma', locale)),
        triadField(selected, locale, 'ultimateMystery', uiT('card.ultimateMystery', locale)),
      ]
    : [];

  const shareComparison = async () => {
    writeCompareQuery(filled.map((item) => item.world.id));
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareDone(true);
      window.setTimeout(() => setShareDone(false), 1800);
    } catch {
      setShareDone(false);
    }
  };

  const gridStyle = { '--cmp-cols': String(ready ? selected.length : colCount) } as CSSProperties;
  const slotGridStyle = { '--cmp-cols': String(colCount) } as CSSProperties;
  const worldName = (world: World) => t(world.gameTitle, locale);

  /* Témata jako mřížka: nejdřív sdílená všemi, pak částečně, nakonec vlastní (podle pořadí světů). */
  const themeRows = [...coverage].sort((a, b) => {
    if (b.owners.length !== a.owners.length) return b.owners.length - a.owners.length;
    return (a.owners[0] ?? 0) - (b.owners[0] ?? 0);
  });

  const single = filled.length === 1 ? filled[0].world : null;
  const closest = single ? kinshipRanking(single, catalog, 4) : [];
  /* Putování, kterými vybrané světy procházejí: nejdřív ta, kde jsou všechny, u tří světů i ta, kde jsou dva. */
  const sharedTrails = ready
    ? trails
        .map((trail) => ({ trail, inside: filled.filter((item) => trail.members.includes(item.world.id)) }))
        .filter((entry) => entry.inside.length >= 2)
        .sort((a, b) => b.inside.length - a.inside.length)
    : [];

  return (
    <div className="cmp">
      <div className="cmp-top page-band">
      <header className="atlas-page__head cmp-head">
        <p className="cmp-head__crumbs">
          <a href={withBase(base, '/atlas/')}>{uiT('nav.atlas', locale)}</a>
          <span aria-hidden="true">/</span>
          <span>{uiT('nav.compare', locale)}</span>
        </p>
        <h1 className="atlas-page__title display">{uiT('compare.title', locale)}</h1>
        <p className="atlas-page__lead">
          {uiT('compare.lead', locale)}{' '}
          <a className="atlas-page__lead-link" href={withBase(base, '/map/')}>
            {uiT('compare.leadMap', locale)}
          </a>
        </p>
      </header>

      <div className={`cmp-grid cmp-slots${ready ? '' : ' is-loose'}`} ref={slotsRef} style={slotGridStyle} data-cols={colCount}>
        <div className="cmp-grid__label cmp-slots__side">
          {ready ? (
            <div className="cmp-actions">
              {filled.length === 2 && !addingThird ? (
                <button type="button" className="cmp-textbtn cmp-textbtn--accent" onClick={() => setAddingThird(true)}>
                  {uiT('compare.addThird', locale)}
                </button>
              ) : null}
              <button type="button" className="cmp-textbtn" onClick={shareComparison}>
                {shareDone ? uiT('compare.shareDone', locale) : uiT('compare.share', locale)}
              </button>
            </div>
          ) : null}
        </div>
        {shownSlots.map((id, index) => {
          if (index === 2 && !id && !addingThird) return null;
          return (
            <WorldSlot
              key={`slot-${index}`}
              index={index}
              selectedId={id}
              catalog={sortedCatalog}
              taken={taken}
              chapterById={chapterById}
              locale={locale}
              base={base}
              autoOpen={index === 2 && addingThird}
              onPick={(worldId) => setSlot(index, worldId)}
              onClear={() => (index === 2 && !id ? setAddingThird(false) : setSlot(index, null))}
            />
          );
        })}
      </div>
      </div>

      {!ready ? (
        <Section
          title={uiT('compare.start', locale)}
          className="cmp-start"
          tools={
            <button type="button" className="cmp-textbtn" onClick={() => setSeed((value) => value + 7919)}>
              ↻ {uiT('compare.shuffle', locale)}
            </button>
          }
        >
          <div className="cmp-start__cols">
            {single ? (
              <PairList
                title={`${uiT('compare.closestTo', locale)} ${worldName(single)}`}
                items={closest.map((item) => ({
                  key: item.world.id,
                  label: worldName(item.world),
                  level: item.level,
                  onPick: () => fillFree(item.world.id),
                }))}
                locale={locale}
              />
            ) : (
              <PairList
                title={uiT('compare.suggested', locale)}
                items={draw(curated, 1).map(({ a, b, level }) => ({
                  key: `${a.id}-${b.id}`,
                  label: `${worldName(a)} × ${worldName(b)}`,
                  level,
                  onPick: () => commit([a.id, b.id]),
                }))}
                locale={locale}
              />
            )}
            <PairList
              title={uiT('compare.unexpected', locale)}
              items={draw(discovery.unexpected, 2).map(({ a, b, level }) => ({
                key: `${a.id}-${b.id}`,
                label: `${worldName(a)} × ${worldName(b)}`,
                level,
                onPick: () => commit([a.id, b.id]),
              }))}
              locale={locale}
            />
            <PairList
              title={uiT('compare.opposites', locale)}
              items={draw(discovery.opposites, 3).map(({ a, b, level }) => ({
                key: `${a.id}-${b.id}`,
                label: `${worldName(a)} × ${worldName(b)}`,
                level,
                onPick: () => commit([a.id, b.id]),
              }))}
              locale={locale}
            />
          </div>
        </Section>
      ) : null}

      {ready ? (
        <div style={gridStyle} data-cols={selected.length}>
          <div className="cmp-sticky-anchor">
          <div className={`cmp-sticky cmp-grid${stickyOn ? ' is-on' : ''}`} aria-hidden={!stickyOn}>
            <span className="cmp-grid__label cmp-sticky__kicker">{uiT('compare.stickyKicker', locale)}</span>
            {filled.map((item) => (
              <div key={item.world.id} className="cmp-sticky__world" style={hueStyle(item.index)}>
                <span className="cmp-sticky__name">{worldName(item.world)}</span>
                <button
                  type="button"
                  className="cmp-sticky__remove"
                  tabIndex={stickyOn ? 0 : -1}
                  onClick={() => setSlot(item.index, null)}
                  aria-label={`${uiT('compare.clear', locale)} ${worldName(item.world)}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          </div>

          <Section title={uiT('compare.kinship', locale)} tools={<MethodHint locale={locale} />} className="cmp-kin">
            {selected.length === 2 && verdictLevel ? (
              <div className="cmp-verdict">
                <p className="cmp-verdict__grade display">{uiT(`compare.kinLevel${verdictLevel}`, locale)}</p>
                <Ticks level={verdictLevel} />
              </div>
            ) : (
              <>
              <p className="cmp-kicker cmp-pairs__hint">{uiT('compare.pairsHint', locale)}</p>
              <ul className="cmp-pairs" aria-label={uiT('compare.pairsTitle', locale)}>
                {pairScores.map((pair) => {
                  const key = pairKey(pair);
                  const on = key === resolvedPairKey;
                  const level = pairLevel(selected[pair.left], selected[pair.right]);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        className={`cmp-pair${on ? ' is-on' : ''}`}
                        aria-pressed={on}
                        onClick={() => setActivePairKey(key)}
                      >
                        <span className="cmp-pair__names">
                          <Mark hue={hues[pair.left]} />
                          {worldName(selected[pair.left])}
                          <span className="cmp-pair__x" aria-hidden="true">
                            ×
                          </span>
                          <Mark hue={hues[pair.right]} />
                          {worldName(selected[pair.right])}
                        </span>
                        <span className="cmp-pair__level display">{uiT(`compare.kinLevel${level}`, locale)}</span>
                        <Ticks level={level} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              </>
            )}
            {activePair ? <Pillars score={activePair.breakdown} locale={locale} /> : null}
          </Section>

          <Section
            title={uiT('compare.axesTitle', locale)}
            tools={
              <a className="cmp-textlink" href={withBase(base, '/notes/#stupnice')}>
                {uiT('compare.axesWhat', locale)}
              </a>
            }
          >
            <AxisOverlay worlds={selected} hues={hues} axes={axes} locale={locale} />
          </Section>

          <Section title={uiT('compare.themesTitle', locale)}>
            <div className="cmp-rows cmp-themes">
              {themeRows.map((item) => {
                const label = themeLabels[item.slug] ? t(themeLabels[item.slug], locale) : item.slug;
                const all = item.owners.length === selected.length;
                return (
                  <div key={item.slug} className={`cmp-grid cmp-row${all ? ' is-shared' : ''}`}>
                    <a
                      className="cmp-grid__label cmp-themes__name"
                      href={withBase(base, `/atlas/?theme=${encodeURIComponent(item.slug)}`)}
                    >
                      {label}
                    </a>
                    {selected.map((world, index) => (
                      <span key={world.id} className="cmp-cell cmp-themes__cell" style={hueStyle(filled[index].index)}>
                        {item.owners.includes(index) ? (
                          <span className="cmp-themes__dot" title={worldName(world)} />
                        ) : (
                          <span className="cmp-themes__none" aria-hidden="true" />
                        )}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </Section>

          {sharedTrails.length ? (
            <Section title={uiT('compare.trailsTitle', locale)} className="cmp-trails">
              <ul className="cmp-trails__list">
                {sharedTrails.map(({ trail, inside }) => (
                  <li key={trail.id} className="cmp-trails__item">
                    <a className="cmp-trails__name display" href={withBase(base, `/putovani/${trail.slug}/`)}>
                      {uiT(trail.nameKey, locale)}
                    </a>
                    <p className="cmp-trails__desc">{uiT(trail.descKey, locale)}</p>
                    <p className="cmp-trails__meta">
                      <span className="cmp-trails__who">
                        {inside.map((item) => (
                          <span key={item.world.id} className="cmp-trails__world">
                            <Mark hue={slotHue(item.index)} />
                            {worldName(item.world)}
                          </span>
                        ))}
                      </span>
                      {trail.minutes ? (
                        <span className="cmp-trails__min">
                          {uiT('compare.essayMin', locale).replace('{m}', String(trail.minutes))}
                        </span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          <Section
            title={uiT('compare.factsTitle', locale)}
            tools={
              <div className="cmp-filter" role="group" aria-label={uiT('compare.factsTitle', locale)}>
                {(['all', 'diffs', 'matches'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`cmp-filter__btn${factFilter === mode ? ' is-on' : ''}`}
                    aria-pressed={factFilter === mode}
                    onClick={() => setFactFilter(mode)}
                  >
                    {mode === 'all'
                      ? uiT('compare.filterAll', locale)
                      : mode === 'diffs'
                        ? uiT('compare.filterDiffs', locale)
                        : uiT('compare.filterMatches', locale)}
                  </button>
                ))}
              </div>
            }
          >
            <FactRows rows={factRows} filled={filled} filter={factFilter} locale={locale} />
          </Section>

          <Section title={uiT('compare.triadTitle', locale)}>
            <FactRows rows={triadRows} filled={filled} prose locale={locale} />
          </Section>

          <div className="cmp-grid cmp-links">
            <div className="cmp-grid__label" aria-hidden="true" />
            {filled.map((item) => (
              <div key={`links-${item.world.id}`} className="cmp-cell cmp-links__world" style={hueStyle(item.index)}>
                <span className="cmp-links__name">{worldName(item.world)}</span>
                {[
                  { href: `/worlds/${item.world.id}/`, label: uiT('compare.openCard', locale) },
                  { href: `/worlds/${item.world.id}/?view=chronicle`, label: uiT('compare.openChronicle', locale) },
                ].map((link) => (
                  <a key={link.href} className="cmp-go" href={withBase(base, link.href)}>
                    <span className="cmp-go__dot" aria-hidden="true" />
                    <span className="cmp-go__label">{link.label}</span>
                    <span className="cmp-go__arrow" aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Tři náměty ze zásobníku; seed 0 = pevné pořadí (před načtením stránky), jinak zamíchané. */
function pickSome<T>(pool: T[], count: number, seed: number): T[] {
  if (!seed) return pool.slice(0, count);
  const order = pool.map((item, index) => ({ item, key: Math.sin(seed * 9301 + index * 49297) }));
  return order
    .sort((a, b) => a.key - b.key)
    .slice(0, count)
    .map((entry) => entry.item);
}

function PairList({
  title,
  items,
  locale,
}: {
  title: string;
  items: Array<{ key: string; label: string; level: KinshipLevel; onPick: () => void }>;
  locale: Locale;
}) {
  return (
    <div className="cmp-start__col">
      <p className="cmp-kicker">{title}</p>
      <ul className="cmp-start__list">
        {items.map((item) => (
          <li key={item.key}>
            <button type="button" className="cmp-start__item" onClick={item.onPick}>
              <span className="cmp-start__name display">{item.label}</span>
              <span className="cmp-start__level">{uiT(`compare.kinLevel${item.level}`, locale)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function factField(worlds: World[], locale: Locale, key: keyof World['metadata'], label: string): FactRow {
  return {
    id: key,
    label,
    values: worlds.map((world) => t(world.metadata[key], locale)),
    subs: worlds.map((world) => (world.metadata[key].sub ? t(world.metadata[key].sub!, locale) : null)),
  };
}

function triadField(worlds: World[], locale: Locale, key: keyof World['triad'], label: string): FactRow {
  return {
    id: key,
    label,
    values: worlds.map((world) => t(world.triad[key], locale)),
    subs: worlds.map(() => null),
  };
}

function rowVisible(values: string[], filter: FactFilter, count: number): boolean {
  if (filter === 'all') return true;
  const allSame = values.every((value) => value === values[0]);
  if (count < 3) return filter === 'matches' ? allSame : !allSame;
  const hasPair = valueFrequencies(values).some((freq) => freq >= 2);
  return filter === 'matches' ? hasPair : !allSame;
}

function FactRows({
  rows,
  filled,
  filter = 'all',
  prose = false,
  locale,
}: {
  rows: FactRow[];
  filled: FilledSlot[];
  filter?: FactFilter;
  prose?: boolean;
  locale: Locale;
}) {
  const count = filled.length;
  const visible = rows.filter((row) => rowVisible(row.values, filter, count));
  return (
    <div className={`cmp-rows cmp-facts${prose ? ' cmp-facts--prose' : ''}`}>
      {visible.map((row) => {
        const freqs = valueFrequencies(row.values);
        return (
          <div key={row.id} className={`cmp-grid cmp-row cmp-row--${row.id}`}>
            <div className="cmp-grid__label">{row.label}</div>
            {row.values.map((value, index) => {
              const matched = !prose && freqs[index] >= 2;
              const dimmed = !prose && filter === 'diffs' && matched && count > 2;
              return (
                <div
                  key={`${row.id}-${index}`}
                  className={`cmp-cell${matched ? ' is-match' : ''}${dimmed ? ' is-dim' : ''}`}
                  style={hueStyle(filled[index].index)}
                >
                  <span className="cmp-cell__who">{t(filled[index].world.gameTitle, locale)}</span>
                  <p className="cmp-cell__value">{value}</p>
                  {row.subs[index] ? <p className="cmp-cell__sub">{row.subs[index]}</p> : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function WorldSlot({
  index,
  selectedId,
  catalog,
  taken,
  chapterById,
  locale,
  base,
  autoOpen = false,
  onPick,
  onClear,
}: {
  index: number;
  selectedId: string | null;
  catalog: World[];
  taken: Set<string>;
  chapterById: Map<string, ChapterInfo>;
  locale: Locale;
  base: string;
  autoOpen?: boolean;
  onPick: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = selectedId ? catalog.find((world) => world.id === selectedId) : undefined;
  const chapter = selected ? chapterById.get(selected.chapterId) : undefined;

  useEffect(() => {
    if (autoOpen) {
      setOpen(true);
      inputRef.current?.focus();
    }
  }, [autoOpen]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const q = query
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  const options = catalog.filter((world) => {
    if (taken.has(world.id) && world.id !== selectedId) return false;
    if (!q) return true;
    const ch = chapterById.get(world.chapterId);
    const hay = [
      t(world.gameTitle, locale),
      world.gameTitle.en,
      world.gameTitle.cs,
      ch ? t(ch.title, locale) : '',
      ...(world.universe ?? []).map((u) => t(u, locale)),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    return hay.includes(q);
  });

  const pick = (id: string) => {
    onPick(id);
    setQuery('');
    setOpen(false);
  };

  const search = (
    <input
      ref={inputRef}
      id={`cmp-slot-${index}`}
      className="cmp-slot__input"
      type="search"
      value={query}
      placeholder={uiT('compare.searchPlaceholder', locale)}
      autoComplete="off"
      onChange={(event) => {
        setQuery(event.target.value);
        setOpen(true);
      }}
      onFocus={() => setOpen(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && options[0]) {
          event.preventDefault();
          pick(options[0].id);
        }
      }}
    />
  );

  const list = open ? (
    <ul className="cmp-slot__list" role="listbox">
      {options.length === 0 ? (
        <li className="cmp-slot__empty">{uiT('compare.noMatch', locale)}</li>
      ) : (
        options.map((world) => {
          const ch = chapterById.get(world.chapterId);
          return (
            <li key={world.id}>
              <button
                type="button"
                role="option"
                aria-selected={world.id === selectedId}
                className="cmp-slot__option"
                style={{ '--ch-l': ch?.accent.light, '--ch-d': ch?.accent.dark } as CSSProperties}
                onClick={() => pick(world.id)}
              >
                <span className="cmp-slot__option-title">{t(world.gameTitle, locale)}</span>
                <span className="cmp-slot__option-meta">{ch ? t(ch.short ?? ch.title, locale) : world.chapterId}</span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  if (selected) {
    return (
      <div className="cmp-slot is-filled" ref={rootRef} style={hueStyle(index)}>
        <p className="cmp-kicker">
          {chapter ? t(chapter.title, locale) : selected.chapterId}
          {selected.metadata.genreProfile.sub ? (
            <span className="cmp-kicker__sub"> · {t(selected.metadata.genreProfile.sub, locale)}</span>
          ) : null}
        </p>
        <h2 className="cmp-slot__title display">
          <a href={withBase(base, `/worlds/${selected.id}/`)}>{t(selected.gameTitle, locale)}</a>
        </h2>
        <p className="cmp-slot__years">{selected.yearRange}</p>
        <p className="cmp-slot__core display">{t(selected.core, locale)}</p>
        <div className="cmp-slot__tools">
            <button
              type="button"
              className="cmp-textbtn"
              aria-expanded={open}
              onClick={() => {
                setOpen((value) => !value);
                window.setTimeout(() => inputRef.current?.focus(), 0);
              }}
            >
              {uiT('compare.swap', locale).replace(' ▾', '')}
            </button>
            <button type="button" className="cmp-textbtn" onClick={onClear}>
              {uiT('compare.clear', locale)}
            </button>
        </div>
        {open ? (
          <div className="cmp-slot__picker">
            {search}
            {list}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="cmp-slot is-empty" ref={rootRef} style={hueStyle(index)}>
      <div className="cmp-slot__top">
        <label className="cmp-kicker" htmlFor={`cmp-slot-${index}`}>
          {uiT('compare.slotEmpty', locale)}
        </label>
        {index === 2 ? (
          <button type="button" className="cmp-textbtn" onClick={onClear}>
            {uiT('compare.removeSlot', locale)}
          </button>
        ) : null}
      </div>
      <div className="cmp-slot__field">
        {search}
        {list}
      </div>
    </div>
  );
}
