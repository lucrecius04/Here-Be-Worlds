import { z } from 'zod';

export const localizedStringSchema = z.object({
  en: z.string(),
  cs: z.string().optional(),
});

/** Short atlas label plus optional subcaption and editorial detail (expand via „i“). */
export const metadataFieldSchema = localizedStringSchema.extend({
  sub: localizedStringSchema.optional(),
  detail: localizedStringSchema.optional(),
});

export const relatedWorldSchema = z.object({
  id: z.string().optional(),
  title: localizedStringSchema,
  note: localizedStringSchema,
  genreProfile: localizedStringSchema.optional(),
  yearRange: z.string().optional(),
});

export const axisValueSchema = z.object({
  value: z.number().min(1).max(5),
  comment: localizedStringSchema.optional(),
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
  universe: z.array(localizedStringSchema).optional(),
  draft: z.boolean().optional(),
  header: z
    .object({
      relatedWorldSlugs: z.array(z.string()).optional(),
    })
    .optional(),
  relatedWorlds: z.array(relatedWorldSchema).optional(),
  core: localizedStringSchema,
  signatureBullets: z.array(localizedStringSchema).optional(),
  metadata: z.object({
    genreProfile: metadataFieldSchema,
    atmosphere: metadataFieldSchema,
    spatialScope: metadataFieldSchema,
    historicalDepth: metadataFieldSchema,
    societalOrder: metadataFieldSchema,
    sourceOfPower: metadataFieldSchema,
    protagonistPerspective: metadataFieldSchema,
    keyActors: metadataFieldSchema,
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
export type RelatedWorld = z.infer<typeof relatedWorldSchema>;
export type World = z.infer<typeof worldSchema>;
