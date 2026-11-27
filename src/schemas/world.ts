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

/**
 * Odvozené údaje pro příbuznost (triáda, vyprávění, paměť světa). V `worlds.json` nejsou:
 * doplňuje je `src/lib/kin-worlds.ts` z `triad-types.json`, `narrative-tools.json` a `deep-time.json`,
 * aby je `compare.ts` nemusel načítat do prohlížeče.
 */
export const kinFactsSchema = z.object({
  /** Typ prvotního hříchu, hraniční „také“, typ dilematu a druh tajemství (Galerie triád). */
  sin: z.string(),
  sinAlso: z.string().optional(),
  dilemma: z.string(),
  mystery: z.string(),
  /** Způsoby vyprávění z nástrojů kroniky (bez vlastností světa mimo kruhy) s kruhem a případným druhým kruhem. */
  tools: z.array(z.object({ t: z.string(), ring: z.string(), also: z.string().optional() })),
  /** Paměť světa: nejhlubší datovaná událost v letech (Hlubina času), null bez letopočtu. */
  memory: z.number().nullable(),
  /** Svět má mýtický čas. */
  myth: z.boolean(),
});
export type KinFacts = z.infer<typeof kinFactsSchema>;

export const worldSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  number: z.number().int().positive(),
  chapterId: z.string(),
  addedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
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
  kin: kinFactsSchema.optional(),
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
  /** Slugy z data/meta/narration-taxonomy.json — „Jak svět vypráví“, 1–3 nástroje. */
  narration: z.array(z.string()).optional(),
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
