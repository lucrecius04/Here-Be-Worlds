// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const repoBase = process.env.HBW_BASE ?? '/Here-Be-Worlds';

// https://astro.build/config
export default defineConfig({
  site: process.env.HBW_SITE ?? 'https://example.github.io',
  base: repoBase,
  integrations: [react()],
  vite: {
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
      needsInterop: ['react-dom', 'react-dom/client'],
    },
    resolve: {
      dedupe: ['react', 'react-dom'],
    },
  },
});
