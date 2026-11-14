import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { useTheme } from '../../lib/theme-store';
import { withBase } from '../../lib/base-url';
import {
  MAX_COMPARE,
  SUGGESTED_PAIRS,
  closestAxisIds,
  exclusiveThemes,
  parseCompareIds,
  sharedThemes,
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

export default function ComparePage({ worlds, chapters, themeLabels, axes, base }: Props) {
  const locale = useLocale();
  const theme = useTheme();
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

  useEffect(() => {
    const parsed = parseCompareIds(window.location.search, validIds);
    setSlots(
      parsed.length >= MAX_COMPARE
        ? [parsed[0] ?? null, parsed[1] ?? null, parsed[2] ?? null]
        : [parsed[0] ?? null, parsed[1] ?? null],
    );
  }, [validIds]);

  const commit = (next: Array<string | null>) => {
    setSlots(next);
    writeCompareQuery(next.filter((id): id is string => Boolean(id)));
  };

  const setSlot = (index: number, id: string | null) => {
    const next = slots.map((slot, i) => (i === index ? id : slot));
    commit(next);
  };

  const addThird = () => {
    if (slots.length >= MAX_COMPARE) return;
    commit([...slots, null]);
  };

  const removeThird = () => {
    commit(slots.slice(0, 2));
  };

  const applyPair = (pair: [string, string]) => {
    commit([pair[0], pair[1]]);
  };

  const selected = slots
    .map((id) => (id ? byId.get(id) : undefined))
    .filter((world): world is World => Boolean(world));

  const hues = selected.map((world) => {
    const chapter = chapterById.get(world.chapterId);
    if (!chapter) return 'var(--color-accent)';
    return theme === 'dark' ? chapter.accent.dark : chapter.accent.light;
  });

  const hueForId = (id: string | null) => {
    if (!id) return undefined;
    const world = byId.get(id);
    if (!world) return undefined;
    const chapter = chapterById.get(world.chapterId);
    if (!chapter) return undefined;
    return theme === 'dark' ? chapter.accent.dark : chapter.accent.light;
  };

  const ready = selected.length >= 2;
  const shared = ready ? sharedThemes(selected) : [];
  const closeAxes = ready ? closestAxisIds(selected) : [];
  const axisNames = closeAxes
    .map((id) => axes.find((axis) => axis.id === id))
    .filter(Boolean)
    .map((axis) => `${t(axis!.left, locale)} / ${t(axis!.right, locale)}`);

  const insightParts: string[] = [];
  if (ready) {
    if (shared.length) {
      insightParts.push(
        `${uiT('compare.insightThemes', locale)}: ${shared
          .map((slug) => (themeLabels[slug] ? t(themeLabels[slug], locale) : slug))
          .join(', ')}`,
      );
    } else {
      insightParts.push(uiT('compare.insightNone', locale));
    }
    if (axisNames.length) {
      insightParts.push(`${uiT('compare.insightAxes', locale)}: ${axisNames.join(', ')}`);
    }
  }

  const factRows: FactRow[] = ready
    ? [
        {
          id: 'archetype',
          label: uiT('world.genreLine', locale),
          values: selected.map((world) => {
            const chapter = chapterById.get(world.chapterId);
            return chapter ? t(chapter.title, locale) : world.chapterId;
          }),
          subs: selected.map(() => null),
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

  const pairs = SUGGESTED_PAIRS.filter(([a, b]) => validIds.has(a) && validIds.has(b));
  const colCount = Math.max(slots.length, 2);

  return (
    <div className="compare-page" style={{ '--compare-cols': String(colCount) } as CSSProperties}>
      <p className="compare-page__back">
        <a href={withBase(base, '/')}>{uiT('compare.back', locale)}</a>
      </p>
      <h1 className="compare-page__title display">{uiT('compare.title', locale)}</h1>
      <p className="compare-page__lead">{uiT('compare.lead', locale)}</p>

      <div className="compare-slots">
        {slots.map((id, index) => (
          <WorldSlot
            key={`slot-${index}`}
            index={index}
            selectedId={id}
            hue={hueForId(id)}
            catalog={catalog}
            taken={new Set(slots.filter((slot): slot is string => Boolean(slot)))}
            chapterById={chapterById}
            locale={locale}
            onPick={(worldId) => setSlot(index, worldId)}
            onClear={() => setSlot(index, null)}
            onRemoveThird={index === 2 ? removeThird : undefined}
          />
        ))}
      </div>

      {slots.length < MAX_COMPARE ? (
        <button type="button" className="compare-add" onClick={addThird}>
          {uiT('compare.addThird', locale)}
        </button>
      ) : null}

      {pairs.length > 0 ? (
        <div className="compare-pairs">
          <span className="compare-pairs__label">{uiT('compare.suggested', locale)}</span>
          <div className="compare-pairs__list">
            {pairs.map((pair) => {
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
        </div>
      ) : null}

      {ready ? (
        <>
          {insightParts.length ? <p className="compare-insight">{insightParts.join(' · ')}</p> : null}

          <AxisOverlay worlds={selected} hues={hues} axes={axes} locale={locale} />

          <section className="compare-themes" aria-label={uiT('compare.themesTitle', locale)}>
            <h2 className="compare-section__title">{uiT('compare.themesTitle', locale)}</h2>
            <ThemeGroup
              label={uiT('compare.themesShared', locale)}
              slugs={shared}
              themeLabels={themeLabels}
              locale={locale}
              variant="shared"
            />
            {selected.map((world, index) => {
              const only = exclusiveThemes(
                world,
                selected.filter((other) => other.id !== world.id),
              );
              return (
                <ThemeGroup
                  key={world.id}
                  label={`${uiT('compare.themesOnly', locale)} ${t(world.gameTitle, locale)}`}
                  slugs={only}
                  themeLabels={themeLabels}
                  locale={locale}
                  variant="own"
                  hue={hues[index]}
                />
              );
            })}
          </section>

          <section className="compare-cores" aria-label={uiT('compare.coresTitle', locale)}>
            <h2 className="compare-section__title">{uiT('compare.coresTitle', locale)}</h2>
            <div className="compare-cores__grid">
              {selected.map((world, index) => (
                <blockquote
                  key={world.id}
                  className="compare-core"
                  style={{ '--slot-hue': hues[index] } as CSSProperties}
                >
                  {t(world.core, locale)}
                </blockquote>
              ))}
            </div>
          </section>

          <FactTable
            title={uiT('compare.factsTitle', locale)}
            rows={factRows}
            hues={hues}
            count={selected.length}
          />

          <FactTable
            title={uiT('compare.triadTitle', locale)}
            rows={triadRows}
            hues={hues}
            count={selected.length}
            prose
          />

          <div className="compare-links">
            {selected.map((world, index) => (
              <div
                key={world.id}
                className="compare-links__world"
                style={{ '--slot-hue': hues[index] } as CSSProperties}
              >
                <span className="compare-links__name">{t(world.gameTitle, locale)}</span>
                <a href={withBase(base, `/worlds/${world.id}/`)}>
                  {uiT('compare.openCard', locale)}
                </a>
                <a href={withBase(base, `/worlds/${world.id}/?view=chronicle`)}>
                  {uiT('compare.openChronicle', locale)}
                </a>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="compare-hint">{uiT('compare.pickTwo', locale)}</p>
      )}
    </div>
  );
}

function factField(
  worlds: World[],
  locale: ReturnType<typeof useLocale>,
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
  locale: ReturnType<typeof useLocale>,
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

function ThemeGroup({
  label,
  slugs,
  themeLabels,
  locale,
  variant,
  hue,
}: {
  label: string;
  slugs: string[];
  themeLabels: Record<string, LocalizedString>;
  locale: ReturnType<typeof useLocale>;
  variant: 'shared' | 'own';
  hue?: string;
}) {
  if (slugs.length === 0) return null;
  return (
    <div className={`compare-theme-group compare-theme-group--${variant}`}>
      <span className="compare-theme-group__label">{label}</span>
      <div className="theme-pills">
        {slugs.map((slug) => (
          <span
            key={slug}
            className={`theme-pill compare-pill compare-pill--${variant}`}
            style={hue ? ({ '--slot-hue': hue } as CSSProperties) : undefined}
          >
            {themeLabels[slug] ? t(themeLabels[slug], locale) : slug}
          </span>
        ))}
      </div>
    </div>
  );
}

function FactTable({
  title,
  rows,
  hues,
  count,
  prose = false,
}: {
  title: string;
  rows: FactRow[];
  hues: string[];
  count: number;
  prose?: boolean;
}) {
  return (
    <section className={`compare-facts${prose ? ' compare-facts--prose' : ''}`}>
      <h2 className="compare-section__title">{title}</h2>
      <div
        className="compare-facts__table"
        style={{ '--compare-cols': String(count) } as CSSProperties}
      >
        {rows.map((row) => {
          const match = row.values.every((value) => value === row.values[0]);
          return (
            <div
              key={row.id}
              className={`compare-facts__row${match ? ' compare-facts__row--match' : ''}`}
            >
              <div className="compare-facts__label">{row.label}</div>
              {row.values.map((value, index) => (
                <div
                  key={`${row.id}-${index}`}
                  className="compare-facts__cell"
                  style={{ '--slot-hue': hues[index] } as CSSProperties}
                >
                  <div className="compare-facts__value">{value}</div>
                  {row.subs[index] ? (
                    <p className="compare-facts__sub">{row.subs[index]}</p>
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WorldSlot({
  index,
  selectedId,
  hue,
  catalog,
  taken,
  chapterById,
  locale,
  onPick,
  onClear,
  onRemoveThird,
}: {
  index: number;
  selectedId: string | null;
  hue?: string;
  catalog: World[];
  taken: Set<string>;
  chapterById: Map<string, ChapterInfo>;
  locale: ReturnType<typeof useLocale>;
  onPick: (id: string) => void;
  onClear: () => void;
  onRemoveThird?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = selectedId ? catalog.find((world) => world.id === selectedId) : undefined;
  const chapter = selected ? chapterById.get(selected.chapterId) : undefined;

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

  if (selected) {
    return (
      <div
        className="compare-slot compare-slot--filled"
        style={hue ? ({ '--slot-hue': hue } as CSSProperties) : undefined}
      >
        <div className="compare-slot__tools">
          <button type="button" className="compare-slot__clear" onClick={onClear}>
            {uiT('compare.clear', locale)}
          </button>
          {onRemoveThird ? (
            <button type="button" className="compare-slot__clear" onClick={onRemoveThird}>
              {uiT('compare.removeSlot', locale)}
            </button>
          ) : null}
        </div>
        <p className="compare-slot__kicker">{chapter ? t(chapter.title, locale) : selected.chapterId}</p>
        <h2 className="compare-slot__title">{t(selected.gameTitle, locale)}</h2>
        <p className="compare-slot__meta">{selected.yearRange}</p>
        <p className="compare-slot__core">{t(selected.core, locale)}</p>
      </div>
    );
  }

  return (
    <div className="compare-slot compare-slot--empty" ref={rootRef}>
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
      {onRemoveThird ? (
        <button type="button" className="compare-slot__clear compare-slot__clear--empty" onClick={onRemoveThird}>
          {uiT('compare.removeSlot', locale)}
        </button>
      ) : null}
      {open ? (
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
      ) : null}
    </div>
  );
}
