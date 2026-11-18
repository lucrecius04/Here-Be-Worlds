import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT, type Locale } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import {
  MAX_COMPARE,
  SUGGESTED_PAIRS,
  curatedNote,
  kinshipCutoffs,
  kinshipLevel,
  kinshipPairs,
  kinshipPercent,
  levelFromPercent,
  pillarStrength,
  type KinshipLevel,
  parseCompareIds,
  slotHue,
  slotWash,
  themeCoverage,
  valueFrequencies,
  writeCompareQuery,
} from '../../lib/compare';
import AxisOverlay from './AxisOverlay';
import '../../styles/compare.css';

type ChapterInfo = {
  id: string;
  title: LocalizedString;
  accent: { light: string; dark: string };
};

type AxisMeta = {
  id: string;
  left: LocalizedString;
  right: LocalizedString;
  help: LocalizedString;
};

type Props = {
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

function genreSub(world: World, locale: Locale): string {
  const main = t(world.metadata.genreProfile, locale);
  const extra = world.metadata.genreProfile.sub ? t(world.metadata.genreProfile.sub, locale) : '';
  if (main && extra) return `${main} · ${extra}`;
  return extra || main;
}

function SlotMark({ hue }: { hue: string }) {
  return (
    <span
      className="compare-legend__mark"
      style={{ '--mark-hue': hue } as CSSProperties}
      aria-hidden="true"
    />
  );
}

function AffinityHint({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const lines = uiT('compare.methodLines', locale).split('|');

  return (
    <div
      className="compare-affinity"
      ref={rootRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <button
        type="button"
        className="compare-affinity__btn"
        aria-expanded={open}
        aria-label={uiT('compare.affinityHint', locale)}
        onClick={() => {
          setPinned((value) => !value);
          setOpen(true);
        }}
      >
        ?
      </button>
      {open ? (
        <div className="compare-affinity__pop" role="dialog" aria-label={uiT('compare.affinityMethod', locale)}>
          <p className="compare-affinity__title">{uiT('compare.affinityMethod', locale)}</p>
          {lines.map((line) => (
            <p key={line} className="compare-affinity__line">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function KinshipGrade({ level, locale }: { level: KinshipLevel; locale: Locale }) {
  return (
    <span className="compare-grade">
      <span className="compare-grade__name display">{uiT(`compare.kinLevel${level}`, locale)}</span>
      <span className="compare-grade__marks" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= level ? 'is-on' : ''} />
        ))}
      </span>
    </span>
  );
}

export default function ComparePage({ worlds, chapters, themeLabels, axes, base }: Props) {
  const locale = useLocale();
  const catalog = useMemo(() => worlds.filter((world) => !world.draft), [worlds]);
  const validIds = useMemo(() => new Set(catalog.map((world) => world.id)), [catalog]);
  const byId = useMemo(
    () => new Map(catalog.map((world) => [world.id, world])),
    [catalog],
  );
  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );

  const [slots, setSlots] = useState<Array<string | null>>([null, null]);
  const [stickyOn, setStickyOn] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [factFilter, setFactFilter] = useState<FactFilter>('all');
  const [activePairKey, setActivePairKey] = useState<string | null>(null);
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
    writeCompareQuery(next.filter((id): id is string => Boolean(id)));
  };

  const setSlot = (index: number, id: string | null) => {
    if (id) {
      commit(slots.map((slot, i) => (i === index ? id : slot)));
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

  const pickThird = (id: string) => {
    const kept = slots.filter((slot): slot is string => Boolean(slot)).slice(0, 2);
    if (kept.length < 2 || kept.includes(id)) return;
    commit([kept[0], kept[1], id]);
  };

  const applyPair = (pair: [string, string]) => {
    commit([pair[0], pair[1]]);
  };

  const filled: FilledSlot[] = slots.flatMap((id, index) => {
    const world = id ? byId.get(id) : undefined;
    return world ? [{ index, world }] : [];
  });
  const selected = filled.map((item) => item.world);
  const hues = filled.map((item) => slotHue(item.index));
  const washes = filled.map((item) => slotWash(item.index));
  const ready = selected.length >= 2;
  const colCount = Math.max(filled.length, 2);
  const coverage = ready ? themeCoverage(selected) : [];
  const sharedCoverage = coverage.filter((item) => item.owners.length >= 2);
  const pairScores = ready ? kinshipPairs(selected) : [];

  useEffect(() => {
    const node = slotsRef.current;
    if (!node || !ready) {
      setStickyOn(false);
      return;
    }
    const headerPx = Math.round(
      document.querySelector('.site-header')?.getBoundingClientRect().height || 56,
    );
    const observer = new IntersectionObserver(
      ([entry]) => setStickyOn(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: `-${headerPx}px 0px 0px 0px` },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, selected.length]);

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
        ...factField(selected, locale, 'atmosphere', uiT('card.atmosphere', locale)),
        ...factField(selected, locale, 'historicalDepth', uiT('card.historicalDepth', locale)),
        ...factField(selected, locale, 'spatialScope', uiT('card.spatialScope', locale)),
        ...factField(selected, locale, 'societalOrder', uiT('card.societalOrder', locale)),
        ...factField(selected, locale, 'sourceOfPower', uiT('card.sourceOfPower', locale)),
        ...factField(
          selected,
          locale,
          'protagonistPerspective',
          uiT('card.protagonistPerspective', locale),
        ),
        ...factField(selected, locale, 'keyActors', uiT('card.keyActors', locale)),
      ]
    : [];

  const triadRows: FactRow[] = ready
    ? [
        triadField(selected, locale, 'originalSin', uiT('card.originalSin', locale)),
        triadField(selected, locale, 'centralDilemma', uiT('card.centralDilemma', locale)),
        triadField(selected, locale, 'ultimateMystery', uiT('card.ultimateMystery', locale)),
      ]
    : [];

  const cutoffs = useMemo(() => kinshipCutoffs(worlds), [worlds]);
  const pairLevel = (a: World, b: World) => kinshipLevel(a, b, worlds);

  const suggested = SUGGESTED_PAIRS.filter(([a, b]) => validIds.has(a) && validIds.has(b));
  const showAddThird = ready && filled.length === 2;
  const pairKey = (pair: { left: number; right: number }) => `${pair.left}-${pair.right}`;
  const pairKeys = pairScores.map(pairKey);
  const resolvedPairKey =
    activePairKey && pairKeys.includes(activePairKey) ? activePairKey : (pairKeys[0] ?? null);
  const activePair = pairScores.find((pair) => pairKey(pair) === resolvedPairKey) ?? pairScores[0];
  const verdictLevel: KinshipLevel | null = ready
    ? selected.length === 2
      ? pairLevel(selected[0], selected[1])
      : levelFromPercent(kinshipPercent(selected), cutoffs)
    : null;
  const notePair =
    ready && selected.length === 2
      ? [selected[0], selected[1]]
      : activePair
        ? [selected[activePair.left], selected[activePair.right]]
        : null;
  const verdictNote = notePair ? curatedNote(notePair[0], notePair[1]) : undefined;
  const barScore = ready
    ? selected.length === 3
      ? (activePair?.breakdown ?? null)
      : pairScores[0]?.breakdown
    : null;
  const pageStyle = { '--compare-cols': String(colCount) } as CSSProperties;

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

  return (
    <div className="compare-page" style={pageStyle}>
      <p className="compare-page__back">
        <a href={withBase(base, '/')}>{uiT('compare.back', locale)}</a>
      </p>
      <div className="compare-page__heading">
        <h1 className="compare-page__title display">{uiT('compare.title', locale)}</h1>
        {ready ? (
          <button type="button" className="compare-share" onClick={shareComparison}>
            {shareDone ? uiT('compare.shareDone', locale) : uiT('compare.share', locale)}
          </button>
        ) : null}
      </div>
      <p className="compare-page__lead">
        {uiT('compare.lead', locale)}{' '}
        <a href={withBase(base, '/map/')}>{uiT('compare.leadMap', locale)}</a>
      </p>

      <div className="compare-slots" ref={slotsRef}>
        {slots.map((id, index) => {
          if (index === 2 && !id) return null;
          return (
            <WorldSlot
              key={`slot-${index}`}
              index={index}
              selectedId={id}
              hue={slotHue(index)}
              wash={slotWash(index)}
              catalog={catalog}
              taken={new Set(slots.filter((slot): slot is string => Boolean(slot)))}
              chapterById={chapterById}
              locale={locale}
              onPick={(worldId) => setSlot(index, worldId)}
              onClear={() => setSlot(index, null)}
            />
          );
        })}
      </div>

      {suggested.length > 0 || showAddThird ? (
        <div className="compare-pairs">
          {suggested.length > 0 ? (
            <>
              <span className="compare-pairs__label">{uiT('compare.suggested', locale)}</span>
              <div className="compare-pairs__list">
                {suggested.map((pair) => {
                  const left = byId.get(pair[0]);
                  const right = byId.get(pair[1]);
                  if (!left || !right) return null;
                  return (
                    <button
                      key={pair.join('-')}
                      type="button"
                      className="compare-pairs__btn"
                      onClick={() => applyPair(pair)}
                    >
                      {t(left.gameTitle, locale)}
                      <span aria-hidden="true"> {uiT('compare.versus', locale)} </span>
                      {t(right.gameTitle, locale)}
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
          {showAddThird ? (
            <AddThirdControl
              catalog={catalog}
              taken={new Set(slots.filter((slot): slot is string => Boolean(slot)))}
              chapterById={chapterById}
              locale={locale}
              onPick={pickThird}
            />
          ) : null}
        </div>
      ) : null}

      {ready ? (
        <>
          <div className={`compare-sticky${stickyOn ? ' is-on' : ''}`}>
            <span className="compare-sticky__kicker">{uiT('compare.stickyKicker', locale)}</span>
            {filled.map((item) => (
              <div
                key={item.world.id}
                className="compare-sticky__world"
                style={
                  {
                    '--slot-hue': slotHue(item.index),
                    '--slot-wash': slotWash(item.index),
                  } as CSSProperties
                }
              >
                <span className="compare-sticky__mark" aria-hidden="true" />
                <span className="compare-sticky__name">{t(item.world.gameTitle, locale)}</span>
                <button
                  type="button"
                  className="compare-sticky__remove"
                  onClick={() => setSlot(item.index, null)}
                  aria-label={`${uiT('compare.clear', locale)} ${t(item.world.gameTitle, locale)}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <section
            className={`compare-verdict${selected.length === 3 ? ' compare-verdict--triples' : ''}`}
            aria-label={uiT('compare.kinship', locale)}
          >
            <div className="compare-verdict__score-col">
              <div className="compare-verdict__head">
                <p className="compare-verdict__kicker">{uiT('compare.kinship', locale)}</p>
                {selected.length === 3 ? <AffinityHint locale={locale} /> : null}
              </div>
              {selected.length === 3 ? null : (
                <div className="compare-verdict__score-row">
                  {verdictLevel ? <KinshipGrade level={verdictLevel} locale={locale} /> : null}
                  <AffinityHint locale={locale} />
                </div>
              )}
            </div>
            {selected.length === 3 ? (
              <div className="compare-verdict__pairs" role="group" aria-label={uiT('compare.kinship', locale)}>
                {pairScores.map((pair) => {
                  const key = pairKey(pair);
                  const on = key === resolvedPairKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`compare-verdict__pair${on ? ' is-on' : ''}`}
                      aria-pressed={on}
                      onClick={() => setActivePairKey(key)}
                    >
                      <SlotMark hue={hues[pair.left]} />
                      {t(selected[pair.left].gameTitle, locale)}
                      <span> {uiT('compare.versus', locale)} </span>
                      <SlotMark hue={hues[pair.right]} />
                      {t(selected[pair.right].gameTitle, locale)}:{' '}
                      {uiT(`compare.kinLevel${pairLevel(selected[pair.left], selected[pair.right])}`, locale)}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {verdictNote ? (
              <p className="compare-verdict__note">
                <span>{uiT('compare.curatedLabel', locale)}</span> {t(verdictNote, locale)}
              </p>
            ) : null}
            {barScore ? (
              <div className="compare-verdict__bars">
                {(
                  [
                    {
                      key: 'archetype',
                      label: uiT('compare.affinityArchetype', locale),
                      value: barScore.archetype,
                      max: 20,
                    },
                    {
                      key: 'axes',
                      label: uiT('compare.affinityAxes', locale),
                      value: barScore.axes,
                      max: 35,
                    },
                    {
                      key: 'character',
                      label: uiT('compare.affinityCharacter', locale),
                      value: barScore.character,
                      max: 30,
                    },
                    {
                      key: 'themes',
                      label: uiT('compare.affinityThemes', locale),
                      value: barScore.themes,
                      max: 15,
                    },
                  ] as const
                ).map((pillar) => (
                  <div key={pillar.key} className="compare-bar">
                    <span className="compare-bar__label">{pillar.label}</span>
                    <span className="compare-bar__value">
                      {uiT(`compare.strength${pillarStrength(pillar.value, pillar.max)}`, locale)}
                    </span>
                    <span className="compare-bar__track" aria-hidden="true">
                      <span
                        className="compare-bar__fill"
                        style={{ width: `${Math.min(100, (pillar.value / pillar.max) * 100)}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <AxisOverlay worlds={selected} hues={hues} axes={axes} locale={locale} base={base} />

          <section className="compare-themes" aria-label={uiT('compare.themesTitle', locale)}>
            <h2 className="compare-section__title">{uiT('compare.themesTitle', locale)}</h2>
            <div className="compare-themes__grid">
              {sharedCoverage.length ? (
                <div className="compare-theme-group compare-theme-group--shared">
                  <span className="compare-theme-group__label">{uiT('compare.themesShared', locale)}</span>
                  <div className="theme-pills">
                    {sharedCoverage.map((item) => (
                      <span key={item.slug} className="theme-pill compare-pill compare-pill--shared">
                        {themeLabels[item.slug] ? t(themeLabels[item.slug], locale) : item.slug}
                        <span className="compare-pill__marks">
                          {item.owners.map((owner) => (
                            <SlotMark key={`${item.slug}-${owner}`} hue={hues[owner]} />
                          ))}
                        </span>
                        {item.owners.length === selected.length ? (
                          <span className="compare-pill__all">{uiT('compare.themesAll', locale)}</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {filled.map((item, selectedIndex) => {
                const only = coverage.filter(
                  (entry) => entry.owners.length === 1 && entry.owners[0] === selectedIndex,
                );
                if (only.length === 0) return null;
                return (
                  <div
                    key={item.world.id}
                    className="compare-theme-group compare-theme-group--own"
                    style={
                      {
                        '--slot-hue': slotHue(item.index),
                        '--slot-wash': slotWash(item.index),
                      } as CSSProperties
                    }
                  >
                    <span className="compare-theme-group__label">
                      {uiT('compare.themesOnly', locale)} {t(item.world.gameTitle, locale)}
                    </span>
                    <div className="theme-pills">
                      {only.map((entry) => (
                        <span
                          key={entry.slug}
                          className="theme-pill compare-pill compare-pill--own"
                          style={{ '--slot-hue': slotHue(item.index) } as CSSProperties}
                        >
                          {themeLabels[entry.slug] ? t(themeLabels[entry.slug], locale) : entry.slug}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="compare-cores" aria-label={uiT('compare.coresLabel', locale)}>
            <div className="compare-cores__grid">
              <div className="compare-facts__label">{uiT('compare.coresLabel', locale)}</div>
              {filled.map((item) => (
                <blockquote
                  key={item.world.id}
                  className="compare-core"
                  style={
                    {
                      '--slot-hue': slotHue(item.index),
                      '--slot-wash': slotWash(item.index),
                    } as CSSProperties
                  }
                >
                  {t(item.world.core, locale)}
                </blockquote>
              ))}
            </div>
          </section>

          <FactTable
            title={uiT('compare.factsTitle', locale)}
            rows={factRows}
            hues={hues}
            washes={washes}
            count={selected.length}
            filter={factFilter}
            onFilter={setFactFilter}
            locale={locale}
          />

          <FactTable
            title={uiT('compare.triadTitle', locale)}
            rows={triadRows}
            hues={hues}
            washes={washes}
            count={selected.length}
            prose
          />

          <div className="compare-links">
            <div className="compare-facts__label" />
            {filled.map((item) => (
              <div
                key={`links-${item.world.id}`}
                className="compare-links__world"
                style={
                  {
                    '--slot-hue': slotHue(item.index),
                    '--slot-wash': slotWash(item.index),
                  } as CSSProperties
                }
              >
                <span className="compare-links__name">{t(item.world.gameTitle, locale)}</span>
                <a className="compare-links__card" href={withBase(base, `/worlds/${item.world.id}/`)}>
                  {uiT('compare.openCard', locale)}
                </a>
                <a
                  className="compare-links__chronicle"
                  href={withBase(base, `/worlds/${item.world.id}/?view=chronicle`)}
                >
                  {uiT('compare.openChronicle', locale)}
                </a>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function factField(
  worlds: World[],
  locale: Locale,
  key: keyof World['metadata'],
  label: string,
): FactRow[] {
  return [
    {
      id: key,
      label,
      values: worlds.map((world) => t(world.metadata[key], locale)),
      subs: worlds.map((world) =>
        world.metadata[key].sub ? t(world.metadata[key].sub!, locale) : null,
      ),
    },
  ];
}

function triadField(
  worlds: World[],
  locale: Locale,
  key: keyof World['triad'],
  label: string,
): FactRow {
  return {
    id: key,
    label,
    values: worlds.map((world) => t(world.triad[key], locale)),
    subs: worlds.map(() => null),
  };
}

function rowVisible(values: string[], filter: FactFilter | undefined, count: number): boolean {
  if (!filter || filter === 'all') return true;
  const allSame = values.every((value) => value === values[0]);
  if (count < 3) return filter === 'matches' ? allSame : !allSame;
  const freqs = valueFrequencies(values);
  const hasPair = freqs.some((freq) => freq >= 2);
  return filter === 'matches' ? hasPair : !allSame;
}

function cellShown(values: string[], index: number, filter: FactFilter | undefined, count: number): boolean {
  if (!filter || filter === 'all' || count < 3) return true;
  const freq = valueFrequencies(values)[index] ?? 0;
  if (filter === 'matches') return freq >= 2;
  return freq === 1;
}

function FactTable({
  title,
  rows,
  hues,
  washes,
  count,
  prose = false,
  filter,
  onFilter,
  locale,
}: {
  title: string;
  rows: FactRow[];
  hues: string[];
  washes: string[];
  count: number;
  prose?: boolean;
  filter?: FactFilter;
  onFilter?: (next: FactFilter) => void;
  locale?: Locale;
}) {
  const highlightMatches = Boolean(filter) && filter !== 'diffs';
  const visible = rows.filter((row) => rowVisible(row.values, filter, count));

  return (
    <section className={`compare-facts${prose ? ' compare-facts--prose' : ''}`}>
      <div className="compare-section__head">
        <h2 className="compare-section__title">{title}</h2>
        {onFilter && locale ? (
          <div className="compare-filter" role="group" aria-label={title}>
            {(['all', 'diffs', 'matches'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`compare-filter__btn${filter === mode ? ' is-on' : ''}`}
                onClick={() => onFilter(mode)}
              >
                {mode === 'all'
                  ? uiT('compare.filterAll', locale)
                  : mode === 'diffs'
                    ? uiT('compare.filterDiffs', locale)
                    : uiT('compare.filterMatches', locale)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className="compare-facts__table"
        style={{ '--compare-cols': String(count) } as CSSProperties}
      >
        {visible.map((row) => {
          const freqs = valueFrequencies(row.values);
          return (
            <div key={row.id} className="compare-facts__row">
              <div className="compare-facts__label">{row.label}</div>
              {row.values.map((value, index) => {
                const shown = cellShown(row.values, index, filter, count);
                const matched = highlightMatches && shown && freqs[index] >= 2;
                return (
                  <div
                    key={`${row.id}-${index}`}
                    className={`compare-facts__cell${matched ? ' compare-facts__cell--match' : ''}`}
                    style={
                      {
                        '--slot-hue': hues[index],
                        '--slot-wash': washes[index],
                      } as CSSProperties
                    }
                  >
                    {shown ? (
                      <>
                        <div className="compare-facts__value">{value}</div>
                        {row.subs[index] ? (
                          <p className="compare-facts__sub">{row.subs[index]}</p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AddThirdControl({
  catalog,
  taken,
  chapterById,
  locale,
  onPick,
}: {
  catalog: World[];
  taken: Set<string>;
  chapterById: Map<string, ChapterInfo>;
  locale: Locale;
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const options = catalog.filter((world) => !taken.has(world.id));

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="compare-pairs__add" ref={rootRef}>
      <button type="button" className="compare-pairs__btn compare-pairs__btn--add" onClick={() => setOpen((v) => !v)}>
        {uiT('compare.addThird', locale)}
      </button>
      {open ? (
        <ul className="compare-slot__list compare-slot__list--pairs" role="listbox">
          {options.length === 0 ? (
            <li className="compare-slot__empty">{uiT('compare.noMatch', locale)}</li>
          ) : (
            options.map((world) => {
              const ch = chapterById.get(world.chapterId);
              return (
                <li key={world.id}>
                  <button
                    type="button"
                    className="compare-slot__option"
                    onClick={() => {
                      onPick(world.id);
                      setOpen(false);
                    }}
                  >
                    <span className="compare-slot__option-title">{t(world.gameTitle, locale)}</span>
                    <span className="compare-slot__option-meta">
                      {ch ? t(ch.title, locale) : world.chapterId}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}

function WorldSlot({
  index,
  selectedId,
  hue,
  wash,
  catalog,
  taken,
  chapterById,
  locale,
  onPick,
  onClear,
}: {
  index: number;
  selectedId: string | null;
  hue: string;
  wash: string;
  catalog: World[];
  taken: Set<string>;
  chapterById: Map<string, ChapterInfo>;
  locale: Locale;
  onPick: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = selectedId ? catalog.find((world) => world.id === selectedId) : undefined;
  const chapter = selected ? chapterById.get(selected.chapterId) : undefined;
  const slotStyle = { '--slot-hue': hue, '--slot-wash': wash } as CSSProperties;

  const options = catalog.filter((world) => {
    if (taken.has(world.id) && world.id !== selectedId) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = [
      t(world.gameTitle, locale),
      world.gameTitle.en,
      world.gameTitle.cs,
      t(world.core, locale),
      ...world.themes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const picker = open ? (
    <ul className="compare-slot__list" role="listbox">
      {options.length === 0 ? (
        <li className="compare-slot__empty">{uiT('compare.noMatch', locale)}</li>
      ) : (
        options.map((world) => {
          const ch = chapterById.get(world.chapterId);
          return (
            <li key={world.id}>
              <button
                type="button"
                className="compare-slot__option"
                onClick={() => {
                  onPick(world.id);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <span className="compare-slot__option-title">{t(world.gameTitle, locale)}</span>
                <span className="compare-slot__option-meta">
                  {ch ? t(ch.title, locale) : world.chapterId}
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  if (selected) {
    return (
      <div className="compare-slot compare-slot--filled" ref={rootRef} style={slotStyle}>
        <div className="compare-slot__head">
          <p className="compare-slot__kicker">{chapter ? t(chapter.title, locale) : selected.chapterId}</p>
          <div className="compare-slot__tools">
            <button type="button" className="compare-slot__clear" onClick={() => setOpen((value) => !value)}>
              {uiT('compare.swap', locale)}
            </button>
            <button type="button" className="compare-slot__clear" onClick={onClear}>
              {uiT('compare.clear', locale)}
            </button>
          </div>
        </div>
        <h2 className="compare-slot__title">{t(selected.gameTitle, locale)}</h2>
        <p className="compare-slot__meta">{selected.yearRange}</p>
        <p className="compare-slot__core">{t(selected.core, locale)}</p>
        {picker}
      </div>
    );
  }

  return (
    <div className="compare-slot compare-slot--empty" ref={rootRef} style={slotStyle}>
      <label className="compare-slot__label" htmlFor={`compare-slot-${index}`}>
        {uiT('compare.slotEmpty', locale)}
      </label>
      <input
        id={`compare-slot-${index}`}
        className="compare-slot__input"
        type="search"
        value={query}
        placeholder={uiT('compare.searchPlaceholder', locale)}
        autoComplete="off"
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {picker}
    </div>
  );
}
