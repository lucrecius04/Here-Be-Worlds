/** Pořadí pěti os profilu světa (shodné s data/meta/axes.json). */
export const AXIS_KEYS = [
  'hopeDespair',
  'knownUnknown',
  'intimateEpic',
  'moralClarityAmbiguity',
  'realismMetaphysical',
] as const;

export type AxisKey = (typeof AXIS_KEYS)[number];
