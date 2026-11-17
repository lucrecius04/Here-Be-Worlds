import type { World } from '../schemas/world';
import { DEFAULT_IMPRINT, type AxisValues } from './imprint';
import { AXIS_KEYS } from './axes';

export const EXTREME_LABEL: Record<(typeof AXIS_KEYS)[number], string> = {
  hopeDespair: 'chapterPage.extremeHopeDespair',
  knownUnknown: 'chapterPage.extremeKnownUnknown',
  intimateEpic: 'chapterPage.extremeIntimateEpic',
  moralClarityAmbiguity: 'chapterPage.extremeMoral',
  realismMetaphysical: 'chapterPage.extremeMetaphysical',
};

export type AxisExtreme = {
  axisId: (typeof AXIS_KEYS)[number];
  labelKey: string;
  world: World;
};

function clampAxis(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function meanAxes(worlds: World[]): AxisValues {
  if (worlds.length === 0) return { ...DEFAULT_IMPRINT };
  const sums = Object.fromEntries(AXIS_KEYS.map((key) => [key, 0])) as AxisValues;
  for (const world of worlds) {
    for (const key of AXIS_KEYS) {
      sums[key] += world.axes[key].value;
    }
  }
  const out = { ...DEFAULT_IMPRINT };
  for (const key of AXIS_KEYS) {
    out[key] = clampAxis(sums[key] / worlds.length);
  }
  return out;
}

export function axisExtremes(worlds: World[], limit = 3): AxisExtreme[] {
  if (worlds.length < 2) return [];

  const ranked = AXIS_KEYS.map((axisId) => {
    const values = worlds.map((world) => world.axes[axisId].value);
    return {
      axisId,
      spread: Math.max(...values) - Math.min(...values),
    };
  })
    .filter((entry) => entry.spread >= 1)
    .sort((a, b) => b.spread - a.spread || a.axisId.localeCompare(b.axisId));

  const used = new Set<string>();
  const extremes: AxisExtreme[] = [];

  for (const { axisId } of ranked) {
    if (extremes.length >= limit) break;
    const candidate = worlds
      .filter((world) => !used.has(world.id))
      .sort((a, b) => b.axes[axisId].value - a.axes[axisId].value || a.id.localeCompare(b.id))[0];
    if (!candidate) continue;
    used.add(candidate.id);
    extremes.push({
      axisId,
      labelKey: EXTREME_LABEL[axisId],
      world: candidate,
    });
  }

  return extremes;
}
