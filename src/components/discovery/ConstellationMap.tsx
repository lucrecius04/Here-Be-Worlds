import { useMemo, useState, type CSSProperties } from 'react';
import type { LocalizedString, World } from '../../schemas/world';
import { t, uiT } from '../../lib/i18n';
import { useLocale } from '../../lib/locale-store';
import { withBase } from '../../lib/base-url';
import { AXIS_KEYS } from '../../lib/similarity';
import { ATLAS_UNIVERSE_TOTAL, isMappedWorld } from '../../lib/atlas-news';
import { toggleCompareTray, useCompareTray } from '../../lib/compare-tray';
import axesMeta from '../../../data/meta/axes.json';
import unmappedData from '../../../data/meta/unmapped-stars.json';
import MiniAxes, { axisPoleLabel } from './MiniAxes';

type AxisId = (typeof AXIS_KEYS)[number];

type ChapterLite = {
  id: string;
  title: LocalizedString;
  accent: { light: string; dark: string };
};

type UnmappedStar = {
  id: string;
  title: LocalizedString;
  axes: Record<AxisId, number>;
};

type Props = {
  worlds: World[];
  chapters: ChapterLite[];
  base: string;
};

const VIEW_W = 1000;
const VIEW_H = 625;
const PAD = 78;
const STARS = unmappedData.stars as UnmappedStar[];

function hashJitter(id: string): { x: number; y: number } {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const nx = ((hash >>> 0) % 2401) / 2400;
  const ny = (((hash >>> 11) % 2401) / 2400);
  return { x: (nx - 0.5) * 0.24, y: (ny - 0.5) * 0.24 };
}

function plotX(value: number): number {
  const clamped = Math.min(5.2, Math.max(0.8, value));
  return PAD + ((clamped - 1) / 4) * (VIEW_W - 2 * PAD);
}

function plotY(value: number): number {
  const clamped = Math.min(5.2, Math.max(0.8, value));
  return PAD + (1 - (clamped - 1) / 4) * (VIEW_H - 2 * PAD);
}

function axisMeta(id: AxisId) {
  return axesMeta.axes.find((axis) => axis.id === id) ?? axesMeta.axes[0];
}

export default function ConstellationMap({ worlds, chapters, base }: Props) {
  const locale = useLocale();
  const compare = useCompareTray();
  const [axisX, setAxisX] = useState<AxisId>('hopeDespair');
  const [axisY, setAxisY] = useState<AxisId>('intimateEpic');
  const [enabled, setEnabled] = useState<Set<string>>(() => new Set(chapters.map((chapter) => chapter.id)));
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mapped = useMemo(() => worlds.filter(isMappedWorld), [worlds]);
  const visible = useMemo(
    () => mapped.filter((world) => enabled.has(world.chapterId)),
    [mapped, enabled],
  );
  const chapterById = useMemo(
    () => Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );
  const worldById = useMemo(
    () => Object.fromEntries(mapped.map((world) => [world.id, world])),
    [mapped],
  );

  const selectedVisible = Boolean(selectedId && visible.some((world) => world.id === selectedId));
  const hoverVisible = Boolean(hoverId && visible.some((world) => world.id === hoverId));
  const activeId = selectedVisible ? selectedId : hoverVisible ? hoverId : null;
  const activeWorld = activeId ? worldById[activeId] : undefined;
  const activeChapter = activeWorld ? chapterById[activeWorld.chapterId] : undefined;

  const xMeta = axisMeta(axisX);
  const yMeta = axisMeta(axisY);
  const cx = plotX(3);
  const cy = plotY(3);
  const unit = plotX(4) - plotX(3);

  const toggleChapter = (id: string) => {
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <article className="map-page">
      <header className="map-page__head">
        <div>
          <h1 className="map-page__title display">{uiT('map.title', locale)}</h1>
          <p className="map-page__lead">{uiT('map.lead', locale)}</p>
        </div>
        <a className="map-page__back" href={withBase(base, '/')}>
          {uiT('map.back', locale)}
        </a>
      </header>

      <div className="map-toolbar">
        <label className="map-toolbar__field">
          <span>{uiT('map.axisX', locale)}</span>
          <select value={axisX} onChange={(event) => setAxisX(event.target.value as AxisId)}>
            {AXIS_KEYS.map((key) => {
              const axis = axisMeta(key);
              return (
                <option key={key} value={key}>
                  {t(axis.left, locale)} — {t(axis.right, locale)}
                </option>
              );
            })}
          </select>
        </label>
        <label className="map-toolbar__field">
          <span>{uiT('map.axisY', locale)}</span>
          <select value={axisY} onChange={(event) => setAxisY(event.target.value as AxisId)}>
            {AXIS_KEYS.map((key) => {
              const axis = axisMeta(key);
              return (
                <option key={key} value={key}>
                  {t(axis.left, locale)} — {t(axis.right, locale)}
                </option>
              );
            })}
          </select>
        </label>
        <div className="map-legend" aria-label={uiT('map.archetypes', locale)}>
          {chapters.map((chapter) => {
            const on = enabled.has(chapter.id);
            return (
              <button
                key={chapter.id}
                type="button"
                className={`map-legend__chip${on ? ' is-on' : ''}`}
                style={
                  {
                    '--star': chapter.accent.light,
                    '--star-dark': chapter.accent.dark,
                  } as CSSProperties
                }
                aria-pressed={on}
                onClick={() => toggleChapter(chapter.id)}
              >
                {t(chapter.title, locale)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="map-stage">
        <svg
          className="map-canvas"
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={uiT('map.title', locale)}
          onClick={() => setSelectedId(null)}
        >
          {[1, 1.5, 2].map((radius) => (
            <circle
              key={radius}
              className="map-canvas__halo"
              cx={cx}
              cy={cy}
              r={unit * radius}
            />
          ))}
          {[1, 2, 3, 4, 5].map((tick) => (
            <g key={tick}>
              <line
                className={`map-canvas__grid${tick === 3 ? ' map-canvas__grid--cross' : ''}`}
                x1={plotX(tick)}
                y1={plotY(1)}
                x2={plotX(tick)}
                y2={plotY(5)}
              />
              <line
                className={`map-canvas__grid${tick === 3 ? ' map-canvas__grid--cross' : ''}`}
                x1={plotX(1)}
                y1={plotY(tick)}
                x2={plotX(5)}
                y2={plotY(tick)}
              />
            </g>
          ))}
          <text className="map-canvas__pole map-canvas__pole--left" x={PAD - 18} y={cy} textAnchor="end">
            {axisPoleLabel(xMeta, 'left', locale)}
          </text>
          <text className="map-canvas__pole map-canvas__pole--right" x={VIEW_W - PAD + 18} y={cy} textAnchor="start">
            {axisPoleLabel(xMeta, 'right', locale)}
          </text>
          <text className="map-canvas__pole map-canvas__pole--top" x={cx} y={PAD - 22} textAnchor="middle">
            {axisPoleLabel(yMeta, 'right', locale)}
          </text>
          <text className="map-canvas__pole map-canvas__pole--bottom" x={cx} y={VIEW_H - PAD + 28} textAnchor="middle">
            {axisPoleLabel(yMeta, 'left', locale)}
          </text>

          {STARS.map((star) => {
            const jitter = hashJitter(star.id);
            const x = plotX(star.axes[axisX] + jitter.x);
            const y = plotY(star.axes[axisY] + jitter.y);
            return (
              <circle
                key={star.id}
                className="map-star--ghost"
                cx={x}
                cy={y}
                r={5}
                opacity={0.25}
              >
                <title>{uiT('map.unmapped', locale)}</title>
              </circle>
            );
          })}

          {visible.map((world) => {
            const jitter = hashJitter(world.id);
            const x = plotX(world.axes[axisX].value + jitter.x);
            const y = plotY(world.axes[axisY].value + jitter.y);
            const chapter = chapterById[world.chapterId];
            const r = activeId === world.id ? 9 : 7;
            return (
              <g
                key={world.id}
                className={`map-star${activeId === world.id ? ' is-active' : ''}`}
                style={
                  {
                    '--star': chapter?.accent.light ?? '#c5a059',
                    '--star-dark': chapter?.accent.dark ?? '#c5a059',
                  } as CSSProperties
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId((current) => (current === world.id ? null : world.id));
                }}
                onMouseEnter={() => setHoverId(world.id)}
                onMouseLeave={() => setHoverId((current) => (current === world.id ? null : current))}
              >
                <polygon
                  className="map-star__mark"
                  points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
                />
                <text className="map-star__label" x={x + 12} y={y + 4}>
                  {t(world.gameTitle, locale)}
                </text>
              </g>
            );
          })}
        </svg>

        {activeWorld ? (
          <aside className="map-card" style={activeChapter ? ({
            '--chapter-hue-light': activeChapter.accent.light,
            '--chapter-hue-dark': activeChapter.accent.dark,
          } as CSSProperties) : undefined}>
            {activeChapter ? (
              <p className="map-card__archetype">{t(activeChapter.title, locale)}</p>
            ) : null}
            <h2 className="map-card__title">{t(activeWorld.gameTitle, locale)}</h2>
            <p className="map-card__core">{t(activeWorld.core, locale)}</p>
            <MiniAxes world={activeWorld} locale={locale} variant="strips" />
            <p className="map-card__actions">
              <a href={withBase(base, `/worlds/${activeWorld.id}/`)}>
                {uiT('home.openDossier', locale)}
              </a>
              <button
                type="button"
                className={compare.includes(activeWorld.id) ? 'is-on' : ''}
                onClick={() => toggleCompareTray(activeWorld.id)}
              >
                {compare.includes(activeWorld.id)
                  ? uiT('home.compareIn', locale)
                  : uiT('home.compareAdd', locale)}
              </button>
            </p>
          </aside>
        ) : null}
      </div>

      <p className="map-page__fill">
        {uiT('map.fill', locale)
          .replace('{n}', String(mapped.length))
          .replace('{total}', String(ATLAS_UNIVERSE_TOTAL))}
      </p>
    </article>
  );
}
