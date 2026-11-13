import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chronicles = defineCollection({
  loader: glob({ base: './content/chronicles', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    worldId: z.string(),
    language: z.enum(['en', 'cs']).default('cs'),
  }),
});

export const collections = { chronicles };
