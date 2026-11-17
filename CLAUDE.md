# Here Be Worlds — architektura a doména

Kurátorský bilingvní atlas herních vesmírů. Žádný herní magazín, recenze ani skóre.

Tento soubor je zdroj pravdy pro AI. Interní identifikátory v kódu se nepřekládají do UI slovníku a naopak.

---

## 1. Identita, stack, routing

- **HBW** — encyklopedie a srovnávací atlas fiktivních herních světů.
- **Jazyk:** `cs` výchozí, `en` sekundární. UI řetězce: `src/lib/i18n.ts` (`uiT`). Obsah světů: `{ en, cs? }` v JSON (`t()`). Kroniky: české markdown.
- **Estetika:** kartografický archiv (dark = stůl při svíčkách, light = pergamen). Nadpisy patkové (`--font-serif`), tenké linky `1px solid`, mosazný akcent přes tokeny. Žádný herní UI jazyk.
- **Stack:** Astro 7 + React islands (`client:load`), statický export. Node ≥ 20.
- **GitHub Pages:** `astro.config.mjs` `base` = `HBW_BASE` (default `/Here-Be-Worlds`). Interní odkazy **vždy** `withBase()` z `src/lib/base-url.ts`.
- **Vizuál:** používej CSS proměnné v `src/styles/tokens.css` (`--color-accent`, `--color-paper`, `--color-line`, …). Do obecného UI nehardcoduj cizí hex. Slotové barvy srovnávače žijí jen ve `src/lib/compare.ts` / `compare.css`.
- **Publikace:** v UI jen `!draft`. `MAX_COMPARE` = 3.

Příkazy: `npm run dev` · `npm run build` · `npm test` · `npm run import:chronicle` · `npm run import:atlas`.

---

## 2. Mapa dat, stránek, knihoven

### Data a obsah

| Cesta | Role |
|---|---|
| `data/worlds.json` | Runtime katalog. Schéma `src/schemas/world.ts`. |
| `data/worlds.draft.json` | Výstup importu atlasu. **Ne runtime.** |
| `data/meta/chapters.json` | Archetypy (interní `chapters`, UI = Archetyp). |
| `data/meta/axes.json` | 5 os, plné póly + help. |
| `data/meta/theme-taxonomy.json` | Slugy témat + labely. |
| `data/meta/field-options.ts` | Filtry katalogu (nálada, hloubka, dosah, …). |
| `data/meta/notes.ts` | Texty Vysvětlivek. |
| `content/chronicles/*.md` | Kroniky. Načítá `src/lib/chronicles.ts` (lazy raw import). |
| `content/essays/*.md` | Esej Anatomie herního lore (`/anatomie-herniho-lore/`). |

Kroniky a eseje **nejsou** v `data/`.

### Schéma světa (`src/schemas/world.ts`)

- `id` (kebab), `number`, `chapterId`, `addedAt?` (`YYYY-MM-DD`)
- `gameTitle`, `chronicleTitle`, `subtitlePoetic` — localized
- `studios[]`, `yearRange`, `canonScope`, `universe?[]`, `draft?`
- `header.relatedWorldSlugs?`, `relatedWorlds?[]`
- `core` — poetické jádro (na kartě **bez** nadpisu Esence/Jádro)
- `signatureBullets?[]`
- `metadata.*` každé pole: `en` + volitelné `cs`, `sub`, `detail`:
  `genreProfile`, `atmosphere`, `spatialScope`, `historicalDepth`, `societalOrder`, `sourceOfPower`, `protagonistPerspective`, `keyActors`
- `themes[]` — slugy
- `axes.{hopeDespair, knownUnknown, intimateEpic, moralClarityAmbiguity, realismMetaphysical}` — `value` 1–5 + `comment?`
- `triad.{originalSin, centralDilemma, ultimateMystery}`
- `chronicleSlug`, `chronicleTeaser?`, `searchText?`

### Stránky

| Routa | Soubor | Hlavní komponenty |
|---|---|---|
| `/` | `src/pages/index.astro` | `HomeIntro` (bento, `ReaderDesk`) + `AtlasExplorer` (katalog, filtry, stezky, kompas) |
| `/compare/` | `src/pages/compare/index.astro` | `ComparePage` + `AxisOverlay` |
| `/map/` | `src/pages/map/index.astro` | `AxisGridMap` — Kartografie os (mřížka 5 × 5, bez výpočtu příbuznosti) |
| `/chapters/[id]/` | `src/pages/chapters/[id].astro` | `ChapterPage` — URL zůstává `chapters`, UI = Archetyp |
| `/worlds/[slug]/` | `src/pages/worlds/[slug].astro` | `WorldPageShell` |
| `/about/` | `src/pages/about/index.astro` | `AboutPage` |
| `/notes/` | `src/pages/notes/index.astro` | `NotesPage` |
| `/anatomie-herniho-lore/` | `src/pages/anatomie-herniho-lore/index.astro` | `EssayPage` |
| `/contact/` | `src/pages/contact/index.astro` | `ContactPage` |

Layout: `src/layouts/BaseLayout.astro` — header/footer, theme/lang FOUC, globální `CompareTray`.

### Karta světa vs záložky

- Záložky jsou v **`WorldPageShell`**, ne ve `WorldCard`.
- Módy: `card` (default) · `chronicle` · `appendices` · `analysis` přes `?view=chronicle\|appendices\|analysis`. `?resume=1` pokračuje v kronice.
- `appendices` / `analysis` skáčou do částí markdown kroniky (`chronicle-toc.ts`). Nejsou to samostatné JSON stránky.
- Triáda (Prvotní hřích / Ústřední dilema / Hlavní tajemství) je **i na kartě** (`WorldCard`).
- `WorldCard` skládá jádro, meta-dlaždice, témata, `FiveAxes` (Profil světa), signaturu, triádu.
- `SimilarWorlds` na kartě = kurátorské `relatedWorlds` z atlasu; když chybí, záloha přes `kinshipRanking` (index příbuznosti ze srovnání).

### Knihovny — jeden index příbuznosti

| Soubor | Účel |
|---|---|
| `src/lib/compare.ts` | **Jediný index příbuznosti na webu.** `affinityBreakdown` (4 pilíře, shody podle **`en`** řetězců), `kinshipRanking` (nejpříbuznější světy pro kartu a mapu). Max 3 světy. URL `?w=`. |
| `src/lib/axes.ts` | `AXIS_KEYS` — pořadí pěti os. |
| `src/lib/i18n.ts` | UI copy `cs`/`en`. `uiT('world.viewCard')` atd. |
| `src/lib/worlds.ts` | Parse katalogu, kapitoly, related, `buildSearchText`. |
| `src/lib/search.ts` | MiniSearch pro katalog. Filtry: `AtlasExplorer` + `field-options.ts`. |
| `src/lib/compare-tray.ts` | `hbw_compare` — zásobník na atlasu/mapě. **Ne** stav stránky `/compare/`. |
| `src/lib/reader-desk.ts` | `hbw_reader_desk` — poslední spisy + resume kroniky. |
| `src/lib/trails.ts` | Tematické stezky homepage. |
| `src/lib/imprint.ts` | Otisk os pro `WorldCompass`. |
| `src/lib/chronicles.ts` | Lazy load markdown. |
| `src/lib/chronicle-toc.ts` | Části/kapitoly kroniky; regex `Kapitola I` v **těle kroniky** je správně. |
| `src/lib/theme-store.ts` / `locale-store.ts` | `hbw_theme` / `hbw_lang`. |

Styly: `src/styles/tokens.css`, `layout.css`, `typography.css`, `home.css`, `world-card.css`, `compare.css`, `chronicle.css`, `map.css`, `chapter.css`, `about.css`, `notes.css`, `contact.css`.

---

## 3. Stav: localStorage vs URL

| Klíč | Store | Čte / zapisuje |
|---|---|---|
| `hbw_theme` | `theme-store.ts` | `ThemeSwitcher`, FOUC v `BaseLayout` |
| `hbw_lang` | `locale-store.ts` | `LanguageSwitcher`, FOUC v `BaseLayout` |
| `hbw_compare` | `compare-tray.ts` | `CompareTray`, `CatalogWorldCard`, `WorldTeaser`, `AxisGridMap` |
| `hbw_reader_desk` | `reader-desk.ts` | `ReaderDesk`, `WorldPageShell` (`touchRecent`), `ChronicleReader` |

**`/compare/` `hbw_compare` nečte.** Stav slotů = URL `?w=id1,id2[,id3]` (alias čtení `?worlds=`, zápis vždy `w`). Tray na homepage a stránka srovnání jsou oddělené.

Eventy (stejné záložky): `hbw:theme`, `hbw:locale`, `hbw-compare`, `hbw-reader-desk`.

---

## 4. Slovník vs interní ID

**Kód, soubory a routy se nepřejmenovávají:** `chapterId`, `data/meta/chapters.json`, `/chapters/[id]/`, `chapterPage`, `filter.chapter`.

**UI atlasu:** `Archetyp` / `Archetypy světů`. Nikdy Krajina, Kapitola, Oblast v navigaci a nadpisech. `chapterPage.*` má dluh „oblasti“ — do nového UI ho nešířit.

**Kronika:** označení `Kapitola I` v markdown a `chronicle-toc.ts` **zůstává**.

### Oficiální pojmy (UI)

| Kontext | CS | EN | i18n |
|---|---|---|---|
| Skupina / kicker | Archetyp, Archetypy světů | Archetype, Archetypes | `world.genreLine`, `filter.chapter`, `map.archetypes` |
| Masthead | Vesmír | Universe | `world.universe` |
| Masthead | Rozsah kánonu | Canon scope | `world.canonScope` |
| Záložka | Charakter světa | World character | `world.viewCard` |
| Záložka | Kronika | Chronicle | `world.viewChronicle` |
| Záložka | Faktografie | Factography | `world.viewAppendices` |
| Záložka | Anatomie vyprávění | Narrative anatomy | `world.viewAnalysis` |
| Karta (klíč, na jádru se nerenderuje) | Jádro světa | The core of the world | `card.coreLabel` |
| Srovnávač (štítek sloupce jader) | Esence | Essence | `compare.coresLabel` |
| Srovnávač (nadpis bloku jader) | Jádro světa | The core of the world | `compare.coresTitle` |
| Dlaždice | Profil archetypu | Archetype profile | `card.genreProfile` |
| Dlaždice | Nálada a estetika | Mood and aesthetics | `card.atmosphere` |
| Dlaždice | Historická hloubka | Historical depth | `card.historicalDepth` |
| Dlaždice | Prostorový dosah | Spatial scope | `card.spatialScope` |
| Dlaždice | Struktura společnosti | Societal order | `card.societalOrder` |
| Dlaždice | Původ moci | Source of power | `card.sourceOfPower` |
| Dlaždice | Perspektiva hráče | Player perspective | `card.protagonistPerspective` |
| Dlaždice | Klíčoví aktéři | Key actors | `card.keyActors` |
| Sekce | Témata | Themes | `card.themesHeading` |
| 5 os (nadpis) | Profil světa | World profile | `card.profileWorld` |
| Triáda | Prvotní hřích | Original sin | `card.originalSin` |
| Triáda | Ústřední dilema | Central dilemma | `card.centralDilemma` |
| Triáda | Hlavní tajemství | Ultimate mystery | `card.ultimateMystery` |
| Srovnávač tabulka | Charakter | Character | `compare.factsTitle` |
| Srovnávač pilíř | Charakter světa | World character | `compare.affinityCharacter` |

Tři různé „Charakter“ neslučovat: záložka `Charakter světa` ≠ tabulka `Charakter` ≠ pilíř příbuznosti `Charakter světa`.

### Pět os (`data/meta/axes.json`)

| id | CS plné | EN plné |
|---|---|---|
| `hopeDespair` | Naděje ↔ Zoufalství | Hope ↔ Despair |
| `knownUnknown` | Poznání ↔ Záhada | Known ↔ Unknown |
| `intimateEpic` | Intimita ↔ Epičnost | Intimate ↔ Epic |
| `moralClarityAmbiguity` | Morálně jednoznačné ↔ Morálně komplexní | Morally clear ↔ Morally ambiguous |
| `realismMetaphysical` | Realismus ↔ Metafyzično | Realism ↔ Metaphysical |

Jednoslovné názvy os (filtr a atlas dvojic na mapě, `map.name*` v i18n): CS Naděje · Poznání · Měřítko · Morálka · Realismus, EN Hope · Knowledge · Scale · Morality · Realism.

Compact póly **jen** 4. osy v `MiniAxes` / `WorldCompass` (`SHORT_POLES`): CS `Jednoznačné` ↔ `Komplexní`, EN `Absolute` ↔ `Complex`. Plné názvy na kartě (`FiveAxes`) a v `axes.json` neměnit.

EN UI nepřekládat ad hoc — brát z `i18n.ts`.

---

## 5. Guardrails

Bez **výslovného** pokynu neměnit:

- `src/components/world/WorldCard.tsx`
- `src/components/world/FiveAxes.tsx`
- `src/styles/world-card.css`
- `data/meta/axes.json`
- `/about/`, `/notes/` a jejich komponenty/copy
- autorské české texty v `data/worlds.json` a `content/chronicles/*.md` (nezkracovat, nepřepisovat strojově)

Další:

- Úprava jedné stránky (např. `/compare/`) **nesmí** měnit strukturu/styl karty světa ani jiné hotové stránky.
- `/compare/` = `src/pages/compare/index.astro` + `ComparePage.tsx` + `compare.ts` + `compare.css`.
- Příbuznost světů počítá **jen** `compare.ts`. Žádný další výpočet podobnosti nezakládat; karta (`SimilarWorlds` záloha) i mapa (spis světa) berou `kinshipRanking`. Kartografie os ukazuje jen polohu na dvou osách, procenta nepočítá. Výjimka: „Nejblíž tvému ladění“ na mapě řadí podle vzdálenosti os, protože čtenář zadává jen osy; neukazuje procenta ani slovo příbuznost.
- Nepřidávej vysvětlující věty a doslovné štítky tam, kde stačí barva, osa nebo pozice.
- Filtry a vyhledávání katalogu nesahají na srovnávač a naopak.
- Po každé úpravě: `npm run build`. UI změna: ověř v prohlížeči (ne jen screenshot).
