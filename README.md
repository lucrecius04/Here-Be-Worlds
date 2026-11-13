# Here Be Worlds — An Atlas of Game Universes

Static encyclopedia and comparative atlas of fictional game worlds. **MVP:** three complete world cards (Baldur's Gate, Dark Souls, Diablo), client-side search and filters, chronicle reader, similar-worlds recommendations, and import tooling for the full 43-world catalog.

## Stack

- [Astro 7](https://astro.build) + React islands
- Data: `data/worlds.json`, `data/meta/*`, Zod schema in `src/schemas/world.ts`
- Chronicles: `content/chronicles/*.md` (Content Collections)
- GitHub Pages via `.github/workflows/deploy.yml` (`HBW_BASE` defaults to `/Here-Be-Worlds/`)

## Commands

```bash
npm install
npm run dev          # local dev server
npm run build        # static export to dist/
npm run preview      # preview production build
npm test             # similarity unit tests
npm run import:chronicle   # DOCX → Markdown (paths in scripts/import-chronicle.ts)
npm run import:atlas       # Atlas DOCX → data/worlds.draft.json
```

## Adding a world

1. Complete a record in `data/worlds.json` (validate against `worldSchema`).
2. Add `content/chronicles/<slug>.md` with frontmatter (`title`, `worldId`, `language`).
3. Rebuild.

## GitHub Pages

Set repository name to match `HBW_BASE` in `astro.config.mjs`, or override:

```bash
HBW_BASE=/Your-Repo-Name/ npm run build
```

Enable **GitHub Pages** from Actions in repo settings after pushing to `main`.

## Disclaimer

Unofficial fan project. Game names and trademarks belong to their respective owners.
