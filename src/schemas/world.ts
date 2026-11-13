import { z } from 'zod';

export const localizedStringSchema = z.object({
  en: z.string(),
  cs: z.string().optional(),
});

export const axisValueSchema = z.object({
  value: z.number().min(1).max(5),
  comment: localizedStringSchema,
});

export const worldSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  number: z.number().int().positive(),
  chapterId: z.string(),
  gameTitle: localizedStringSchema,
  chronicleTitle: localizedStringSchema,
  subtitlePoetic: localizedStringSchema,
  studios: z.array(z.string()),
  yearRange: z.string(),
  canonScope: localizedStringSchema,
  draft: z.boolean().optional(),
  header: z
    .object({
      relatedWorldSlugs: z.array(z.string()).optional(),
    })
    .optional(),
  core: localizedStringSchema,
  signatureBullets: z.array(localizedStringSchema).optional(),
  metadata: z.object({
    genreProfile: localizedStringSchema,
    spatialScope: localizedStringSchema,
    historicalDepth: localizedStringSchema,
    societalOrder: localizedStringSchema,
    sourceOfPower: localizedStringSchema,
    protagonistPerspective: localizedStringSchema,
    keyActors: localizedStringSchema,
  }),
  themes: z.array(z.string()),
  axes: z.object({
    hopeDespair: axisValueSchema,
    knownUnknown: axisValueSchema,
    intimateEpic: axisValueSchema,
    moralClarityAmbiguity: axisValueSchema,
    realismMetaphysical: axisValueSchema,
  }),
  triad: z.object({
    originalSin: localizedStringSchema,
    centralDilemma: localizedStringSchema,
    ultimateMystery: localizedStringSchema,
  }),
  chronicleSlug: z.string(),
  chronicleTeaser: localizedStringSchema.optional(),
  searchText: z.string().optional(),
});

export const worldsFileSchema = z.object({
  worlds: z.array(worldSchema),
});

export type LocalizedString = z.infer<typeof localizedStringSchema>;
export type AxisValue = z.infer<typeof axisValueSchema>;
export type World = z.infer<typeof worldSchema>;
