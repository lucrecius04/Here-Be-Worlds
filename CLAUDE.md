# Here Be Worlds — architektura a doména

Kurátorský bilingvní atlas herních vesmírů. Žádný herní magazín, recenze ani skóre.

Tento soubor je zdroj pravdy pro AI. Interní identifikátory v kódu se nepřekládají do UI slovníku a naopak.

---

## 1. Identita, stack, routing

- **HBW** — encyklopedie a srovnávací atlas fiktivních herních světů.
- **Jazyk:** `cs` výchozí, `en` sekundární. UI řetězce: `src/lib/i18n.ts` (`uiT`). Obsah světů: `{ en, cs? }` v JSON (`t()`). Kroniky: české markdown.
- **Estetika (finální styl „noční atlas“, 2026-11):** light = teplý papír `#F4F2EE` a tuš, dark = noční modř `#0D1324`; hlavička, noční pás titulní strany a patička jsou vždy noční. Jeden ultramarínový akcent (`--color-accent`, dark `#9DB0FF`) pro odkazy a akce, leží mimo barvy archetypů. Barva archetypu (light/dark z `chapters.json`, v CSS `--hue`) jen pro záložky, silné linky, profil os a štítky. Škála (2026-11): Fantasy zlatá · Sci-fi azurová · Postapokalypsa olivová · Horor karmínová · Dystopie smaragdová · Historie rezavě cihlová · Metafyzika fialová; pořadí archetypů v `chapters.json` je záměrně takové, aby podobné barvy nestály vedle sebe (Horor ≠ vedle Historie). Nové barvy musí držet odstup od akcentu a mezi sebou (ΔE2000 ≥ ~15) a kontrast ≥ 4,5 na papíře i noci. Písma: **Fraunces** (nadpisy, názvy světů, jádra, citáty; `--font-display`), **Source Serif 4** (dlouhé texty; `--font-text`), **Public Sans** (rozhraní; `--font-sans`), **IBM Plex Mono** (štítky a čísla; `--font-mono`). Bez zaoblených „pilulek“ a stínových rámů; oddíly dělí linky a vzduch (architektura směru A · Rejstřík: např. Tři cesty ve sloupcích se svislými linkami a šipkou). Na titulní straně je **jediný tónovaný pás** přes celou šířku (`--color-band`, bez rámu a stínu) pro esej a stezky; další pásy nepřidávat. Motiv řídí systém čtenáře, dokud si nevybere sám (`hbw_theme`). Žádný herní UI jazyk.
- **Znak a nápis:** kotouč světa rozložený na čtyři vodorovné vrstvy rozjeté do schodů (vyprávění, historie, klasifikace, mapa); sklon / stejný jako kurzíva „Be“ (`src/components/i18n/BrandMark.tsx`, cesty `MARK_PATHS`, výřez `MARK_VIEWBOX` 4 : 3, `size` = výška). Vrstvy shora: bílá `--mark-light` `#F4F1EA`, zlatá rozsvícená `--mark-glow` `#E5BE7E`, bílá, šedý stín `--mark-shade` `#AEB3BE`. Zlatá vrstva je druhá shora (nikdy nahoře jako čepička), vysunutá doprava za kotouč a zakončená vykrojením jako štítek; přesah jen na jednu stranu (souměrný pruh přes kotouč = londýnské metro). Nápis `Wordmark`: Fraunces 700, „Be“ kurzívou 500. Na webu je rozsvícená vrstva **vždy zlatá**; barvu archetypu nese jen na kartách světů pro sdílení. Ikony: `public/favicon.svg` (znak v nočním čtverci, rx 14), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180 px).
- **Karty pro sdílení (Open Graph 1200 × 630):** `public/og/site.jpg` (noční, obloha, „Tajemství světů, které *nikdy* neexistovaly“) a `public/og/worlds/<id>.jpg` (papír, záložka žánru v barvě archetypu, vpravo nahoře jen název archetypu; slovo „Spis“ na kartách nepoužívat). Generuje `npm run og` (`scripts/og-images.mjs`, potřebuje Playwright s Chromiem) a **commitují se**; písma bere z Google Fonts — kde nejsou dostupná (cloud), podstrč `HBW_OG_FONT_CSS` s @font-face z `@fontsource-variable/fraunces` (soubory **full**, jinak kurzíva dostane „wonky“ tvary), `@fontsource-variable/source-serif-4` (opsz) a `@fontsource/ibm-plex-mono` a výsledek porovnej se starou kartou; při buildu se negenerují. Po přidání či úpravě světa spusť `npm run og` — test `src/lib/og-cards.test.ts` hlídá, že žádný publikovaný svět nemá kartu chybějící. `BaseLayout` bere `ogImage` (výchozí `/og/site.jpg`, drafty ji dostanou také) a skládá absolutní URL z `site` (`HBW_SITE`, default `https://lucrecius04.github.io`).
- **Stack:** Astro 7 + React islands (`client:load`), statický export. Node ≥ 20.
- **GitHub Pages:** `astro.config.mjs` `base` = `HBW_BASE` (default `/Here-Be-Worlds`). Interní odkazy **vždy** `withBase()` z `src/lib/base-url.ts`.
- **Vizuál:** používej CSS proměnné v `src/styles/tokens.css` (`--color-accent`, `--color-paper`, `--color-line`, …). Do obecného UI nehardcoduj cizí hex. Slotové barvy srovnávače žijí jen ve `src/lib/compare.ts` / `compare.css`.
- **Publikace:** v UI jen `!draft`. `MAX_COMPARE` = 3.
- **Bez písmen a čísel:** písmena archetypů (A–G, pozůstatek kapitol Word atlasu), římské číslice archetypů ani katalogová čísla světů (`№`) se nikde v UI ani na kartách pro sdílení nezobrazují. `number` slouží jen k řazení.
- **Osy mají dvě podoby:** hodnota **jednoho světa** = pětidílný pruh se zvýrazněným pólem, ke kterému se svět kloní (`FiveAxes` na spisu; jinde sdílená `AxisBars`: Svět dne, hádanka, karta katalogu `compact`, kompas jako tlačítka). Poloha **víc světů nebo průměr** = kosočtverce na stupnici 1–5 (srovnání `AxisOverlay`; stránka archetypu `AxisRange`: kosočtverec průměru + pás rozpětí od nejnižšího po nejvyšší svět). Nesvítí sousední dílky; záře jen tam, kde nese údaj (rozpětí). V hádance je pruh bez barvy archetypu (prozradil by odpověď).
- **Tón:** web čtenáři **tyká** („Poznáš svět…“, „Nastav si…“). Výjimkou jsou autorské texty `/about/` a eseje.

Příkazy: `npm run dev` · `npm run build` · `npm test` · `npm run import:chronicle` · `npm run import:atlas` · `npm run og` (karty pro sdílení) · `npm run bundle:trail -- <id>|--all|--base` (studijní balíčky pro autory, výstup `bundles/`, necommituje se; `<id> --split` rozseká balíček stezky na soubory do 30 000 znaků pro Gemini).

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
| `data/meta/upcoming.json` | Svět, jehož kroniku právě píšeme (`next`; O atlasu → Co se chystá). |
| `content/chronicles/*.md` | Kroniky. Načítá `src/lib/chronicles.ts` (lazy raw import). |
| `content/essays/*.md` | Esej Anatomie herního lore (`/anatomie-herniho-lore/`) a stránka Teoretické zázemí (`/teoreticke-zazemi/`). |
| `content/trails/*.md` | Eseje ke stezkám (`/stezky/<soubor>/`); frontmatter `trail:` = id z `trails.ts`. Autorský text, fakta ověřená proti kronikám; po schválení majitelem se na esej odkáže ze stezky. |
| `docs/prameny/*.md` | Studijní výtahy z odborných knih (Doležel, Fisher, Clute, Otto…): pojmy, převyprávění, co plyne pro atlas, kde je pramen použitý. Rozcestník `docs/prameny/README.md`. **Před psaním eseje nebo stezky projít; knihy se znovu nečtou.** |
| `docs/pro-autory/` | Příručka pro autory esejí ke stezkám (i pro jiné modely, např. Gemini): stavba eseje, styl, formát, kontrolní seznam, co odevzdat (`README.md`), a zadání ke studiu dalších knih (`studium-knih.md`). Balíčky skládá `scripts/trail-bundle.mjs`. Odkaz z `AGENTS.md`. Esej od jiného autora vždy zkontrolovat proti kronikám, než se publikuje. |
| `public/og/` | Karty pro sdílení (výstup `scripts/og-images.mjs`, commitují se). |

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
| `/` | `src/pages/index.astro` | `HomeIntro` — noční pás s oblohou 43 hvězd (7 souhvězdí = archetypy; popsané světy se po stálých skupinkách (dvě až tři, v řadě nikdy dvě sousední hvězdy, `rotationSets`) střídají každých 5 s s pomalým prolnutím, souhvězdí po sobě jako vlna; první skupinka jsou nejznámější světy `ICONIC`; rotace běží pořád, stojí jen při kurzoru na názvu souhvězdí, na kartě v pozadí, při `prefers-reduced-motion` a na úzkém/dotykovém displeji; jména jsou vždy pod hvězdou; najetí na název souhvězdí rozsvítí jména všech jeho světů a ztlumí ostatní, klik skočí na `#rejstrik-<id>`; na úzkém/dotykovém displeji obloha bez jmen a pod ní řádek archetypů do rejstříku; dole jemné měřítko a „Nově zmapováno“). Hlavička na titulní straně splývá s nocí, po posunu ji oddělí linka (`is-scrolled` v `SiteHeader`). `ReaderDesk` (jen jeden řádek s rozečtenou kronikou), **Svět dne** (archetyp · profil archetypu, pruh os) + **Hádanka dne** (`DailyMystery`), Zmapované světy (dřív Rejstřík; záložka „Archetyp · počet“ je odkaz na archetyp, `id=rejstrik-<id>`), kompas „Který svět je tvůj?“ (`WorldCompass alwaysOpen`), Tři cesty, esej + **Stezky dne** (3 z 16, každý den jiná trojice, `dailyTrails`; odkaz „Všech 16 stezek →“ na `/atlas/?stezky=1`). Svět dne i hádanka se skládají samy z dat (`calendar.ts`): promíchané pořadí po cyklech (`featuredWorldIndex`), hádanka je o půl cyklu posunutá (`mysteryWorldIndex`), takže se se Světem dne nepotká; jedna špatná odpověď je ze stejného archetypu. Po odpovědi: správná zelený rámeček a ✓, zvolená špatná červený rámeček, přeškrtnutí a ✗ (`--color-right` / `--color-wrong`), všechny tři možnosti jsou odkazy. Staré odkazy `/?theme=` a `/?trail=` přesměruje do `/atlas/`. |
| `/atlas/` | `src/pages/atlas/index.astro` | `AtlasExplorer`: pod nadpisem rovnou katalog — záložky archetypů s počty (podle ostatních filtrů), pole jen s linkou dole (hledání, Téma, Nálada), řádek Další filtry · Hledat podle vlastních souřadnic (`WorldCompass open`) · Stezky + (rozbalí seznam všech stezek s popisem a počtem; `?stezky=1` ho otevře), řádek s počtem výsledků a Zrušit filtry; skupiny se záložkou „Fantasy · 12“ jako v rejstříku; `CatalogWorldCard` bez rámu (hranatý podbarvený štítek „podžánr · vesmír“ v barvě archetypu, název, jádro, `AxisBars compact`, témata jako text). Nadpis bez štítku s počtem (počet je v záložce Všechny a v řádku výsledků). Hledání (`search.ts`): všechna slova musí sedět, bez diakritiky, překlep jen u slov od 6 písmen. Čte `?theme=` a `?trail=` |
| `/compare/` | `src/pages/compare/index.astro` | `ComparePage` + `AxisOverlay` |
| `/map/` | `src/pages/map/index.astro` | `AxisGridMap` — Mapa souřadnic (mřížka 5 × 5, bez výpočtu příbuznosti) |
| `/chapters/[id]/` | `src/pages/chapters/[id].astro` | `ChapterPage` — URL zůstává `chapters`, UI = Archetyp |
| `/worlds/[slug]/` | `src/pages/worlds/[slug].astro` | `WorldPageShell` |
| `/about/` | `src/pages/about/index.astro` | `AboutPage` — nadpis „O atlasu“ (bez štítku), řada „Atlas v číslech“ (počítá se při sestavení z dat a kronik), autorský text vlevo, pod ním „Čím atlas nechce být“ a „Co se chystá“ („Právě píšeme kroniku …“ z `data/meta/upcoming.json` (`next`) + naposledy zmapovaný svět), vpravo poznámka o AI a „Dál v atlasu“ |
| `/notes/` | `src/pages/notes/index.astro` | `NotesPage` — obsah oddílů, rejstříkový seznam pojmů (štítek vlevo, výklad vpravo), legenda 1–5 jako pruh os; oddíly Charakter světa · Profil světa · Triáda · Příbuznost světů (4 pilíře, 5 stupňů slovy, bez procent) · Kompas a ladění · Kánon (texty v `data/meta/notes.ts`) |
| `/anatomie-herniho-lore/` | `src/pages/anatomie-herniho-lore/index.astro` | `EssayPage` (obsah `ReadingToc` vlevo, čtecí sloupec jako kronika, doba čtení pod podtitulem) |
| `/teoreticke-zazemi/` | `src/pages/teoreticke-zazemi/index.astro` | `EssayPage` z `content/essays/teoreticke-zazemi.md`: prameny atlasu po oblastech (fikční světy, fantastika, herní studia, hrůza a posvátno, mýtus, paměť, dílna tvůrců), tabulka pojmů, výhrady k autorům, co by sem ještě patřilo, seznam literatury. Odkaz z Anatomie (oddíl Na čem metoda stojí) a z patičky. **Po zapracování nové knihy doplnit i sem.** |
| `/stezky/[id]/` | `src/pages/stezky/[id].astro` | `EssayPage` s `trail`: pod hlavičkou `TrailCast` (sloupce světů s linkou v barvě archetypu, „Archetyp · podžánr“, název jako odkaz); před Zdroji vloží `TrailWorlds` (souřadnice všech světů stezky jako kosočtverce se jmény + seznam světů se štítkem archetypu). Eseje `na-mrtvole-boha` a `kdo-za-to-muze` zatím bez odkazu z webu (čekají na schválení majitelem). |
| `/contact/` | `src/pages/contact/index.astro` | `ContactPage` — téma zprávy, věta o e-mailu; odesílání zatím **nezapojené** (`CONTACT_EMAIL` prázdné), plán: bezplatná služba pro formuláře (Web3Forms/Formspree) s klíčem majitele |

Jednoduché stránky (O projektu, Vysvětlivky, Kontakt) sdílejí v `layout.css` třídy `doc`, `doc-head`, `doc-kicker`, `doc-title`, `doc-lead`, `doc-h2`, `doc-prose`, `doc-side`: hlavička jako na atlasu, zarovnání vlevo, bez ozdob (žádné ✦), bez rámečků, text bez zarovnání do bloku.

Hlavička (`SiteHeader`): na desktopu znak, odkazy, CZ|EN a přepínač motivu; na telefonu (≤ 720 px) jen znak, **jediná** ikona motivu (ta neaktivní; klik přepne) a tlačítko menu (tři čárky → křížek), které rozbalí panel s odkazy a CZ|EN (`#site-menu`, zavře Escape / klik mimo).

Layout: `src/layouts/BaseLayout.astro` — header/footer (znak + nápis z `BrandMark.tsx`), meta Open Graph (`ogImage`), ikony, theme/lang FOUC, globální `CompareTray`.

### Karta světa vs záložky

- Hlavička spisu (`WorldPageMasthead`): drobečky Atlas / archetyp, záložka archetypu s profilem archetypu, velký název, název kroniky, údaje Studio · Roky · Vesmír · Rozsah kánonu. Při čtení se stáhne (`is-compact`).
- Záložky jsou v **`WorldPageShell`**, ne ve `WorldCard`. Ukazují obsah („Kronika · 9 kapitol · 20 min“, „Faktografie · 5 oddílů“, „Anatomie vyprávění · 6 částí“); počty spočítá `chronicleStats` (`chronicle-toc.ts`) při sestavení v `src/pages/worlds/[slug].astro`. Vpravo `+ Srovnat` (zásobník).
- Módy: `card` (default) · `chronicle` · `appendices` · `analysis` přes `?view=chronicle\|appendices\|analysis`. `?resume=1` pokračuje v kronice.
- `appendices` / `analysis` skáčou do částí markdown kroniky (`chronicle-toc.ts`). Nejsou to samostatné JSON stránky.
- Triáda (Prvotní hřích / Ústřední dilema / Hlavní tajemství) je **i na kartě** (`WorldCard`).
- `WorldCard` skládá jádro (Fraunces kurzíva, bez nadpisu), šest údajů vlevo (nálada, hloubka, dosah, společnost, moc, perspektiva), vpravo `FiveAxes` (Profil světa, pět řad po pěti dílcích), Témata (obrysové štítky → `/atlas/?theme=`), Jak svět vypráví (plné štítky), Klíčoví aktéři; pak Čím je svět charakteristický a triádu. Profil archetypu je v záložce hlavičky.
- `SimilarWorlds` = sekce **Příbuzenstvo**: kurátorské `relatedWorlds` z atlasu se slovním stupněm; když chybí, záloha přes `kinshipRanking` (index příbuznosti ze srovnání). Odkaz „Ukázat na mapě“ vede na `/map/?svet=`.

### Knihovny — jeden index příbuznosti

| Soubor | Účel |
|---|---|
| `src/lib/compare.ts` | **Jediný index příbuznosti na webu.** `affinityBreakdown` (4 pilíře, shody podle **`en`** řetězců) slouží jen k řazení. Na webu se ukazuje **slovní stupeň** `kinshipLevel` (5 Sourozenci · 4 Blízcí příbuzní · 3 Spříznění · 2 Vzdálení příbuzní · 1 Cizí) podle podílu všech dvojic (3 / 9 / 23 / 30 / zbytek %); kurátorské `relatedWorlds` mají vždy aspoň 4; ruční výjimky `data/meta/kinship-overrides.json`. `kinshipRanking` pro kartu a mapu. Max 3 světy. URL `?w=`. |
| `src/lib/axes.ts` | `AXIS_KEYS` — pořadí pěti os. |
| `src/lib/i18n.ts` | UI copy `cs`/`en`. `uiT('world.viewCard')` atd. |
| `src/lib/worlds.ts` | Parse katalogu, kapitoly, related, `buildSearchText`. |
| `src/lib/search.ts` | MiniSearch pro katalog. Filtry: `AtlasExplorer` + `field-options.ts`. |
| `src/lib/compare-tray.ts` | `hbw_compare` — zásobník na atlasu, mapě a spisu světa. **Ne** stav stránky `/compare/`. |
| `src/lib/reader-desk.ts` | `hbw_reader_desk` — poslední spisy + resume kroniky. |
| `src/lib/trails.ts` | Tematické stezky: 16 ručně sestavených výběrů po 4–7 světech (`members`), členy ověřené proti kronikám; `dailyTrails` pro titulní stranu. Texty v `i18n` `trails.*`. Test hlídá, že členové existují a počet sedí. |
| `src/lib/imprint.ts` | Otisk os pro `WorldCompass`. |
| `src/lib/chronicles.ts` | Lazy load markdown. |
| `src/lib/chronicle-toc.ts` | Části/kapitoly kroniky; regex `Kapitola I` v **těle kroniky** je správně. |
| `src/lib/theme-store.ts` / `locale-store.ts` | `hbw_theme` / `hbw_lang`. |

Styly: `src/styles/tokens.css`, `layout.css`, `typography.css`, `home-page.css` (titulní strana + hlavička `/atlas/`), `home.css` (katalog, stezky, kompas, zásobník), `world-card.css` (spis světa), `compare.css`, `chronicle.css`, `map.css`, `chapter.css`, `about.css`, `notes.css`, `contact.css`, `essay.css`.

---

## 3. Stav: localStorage vs URL

| Klíč | Store | Čte / zapisuje |
|---|---|---|
| `hbw_theme` | `theme-store.ts` | `ThemeSwitcher`, FOUC v `BaseLayout` |
| `hbw_lang` | `locale-store.ts` | `LanguageSwitcher`, FOUC v `BaseLayout` |
| `hbw_compare` | `compare-tray.ts` | `CompareTray`, `CatalogWorldCard`, `WorldTeaser`, `AxisGridMap`, `WorldPageShell` |
| `hbw_reader_desk` | `reader-desk.ts` | `ReaderDesk`, `WorldPageShell` (`touchRecent`), `ChronicleReader` |
| `hbw_mystery` | `DailyMystery.tsx` | odpovědi hádanky za posledních 7 dní (den → id), hádat jde jednou |

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
| 5 souřadnic (nadpis) | Profil světa | World profile | `card.profileWorld` |
| Veličiny profilu | Souřadnice | Coordinates | `home.axesTitle`, `map.name*` |
| Stránka `/map/` | Mapa souřadnic | Coordinate map | `nav.map`, `map.title` |
| Triáda | Prvotní hřích | Original sin | `card.originalSin` |
| Triáda | Ústřední dilema | Central dilemma | `card.centralDilemma` |
| Triáda | Hlavní tajemství | Ultimate mystery | `card.ultimateMystery` |
| Srovnávač tabulka | Charakter | Character | `compare.factsTitle` |
| Srovnávač pilíř | Charakter světa | World character | `compare.affinityCharacter` |

Tři různé „Charakter“ neslučovat: záložka `Charakter světa` ≠ tabulka `Charakter` ≠ pilíř příbuznosti `Charakter světa`.

### Pět souřadnic (`data/meta/axes.json`)

V UI se pět veličin profilu světa jmenuje **souřadnice** (EN *coordinates*), nikdy „osy“ (*axes*); slovo „osa“ v UI nepoužívat (výjimka: „časová osa“ = timeline). Interní identifikátory (`axes`, `AXIS_KEYS`, `AxisBars`, `AxisRange`, `FiveAxes`, `AxisGridMap`, `axes.json`, routa `/map/`) se nepřejmenovávají. Souřadnice nejsou příbuznost: ve srovnání jsou jen jedním ze čtyř pilířů (pilíř „Profil světa (5 souřadnic)“).

| id | Souřadnice | CS póly | EN póly |
|---|---|---|---|
| `hopeDespair` | Vyhlídka | Naděje ↔ Zoufalství | Hope ↔ Despair |
| `knownUnknown` | Poznatelnost | Poznání ↔ Záhada | Known ↔ Unknown |
| `intimateEpic` | Měřítko | Intimita ↔ Epičnost | Intimate ↔ Epic |
| `moralClarityAmbiguity` | Morálka | Morálně jednoznačné ↔ Morálně komplexní | Morally clear ↔ Morally ambiguous |
| `realismMetaphysical` | Realita | Realismus ↔ Metafyzično | Realism ↔ Metaphysical |

Názvy souřadnic (`map.name*` v i18n; mapa, filtr, Vysvětlivky): CS **Vyhlídka · Poznatelnost · Měřítko · Morálka · Realita**, EN **Outlook · Knowability · Scale · Morality · Reality**. Jsou neutrální (nepojmenované podle jednoho pólu); póly zůstávají beze změny.

Compact póly **jen** 4. osy přes `axisPoleLabel` v `MiniAxes.tsx` (`SHORT_POLES`; používají `AxisBars`, `AxisRange`, `WorldCompass`, mapa): CS `Jednoznačné` ↔ `Komplexní`, EN `Absolute` ↔ `Complex`. Plné názvy na kartě (`FiveAxes`) a v `axes.json` neměnit.

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
- Procenta příbuznosti se v UI **nezobrazují** (ani v metodice), jen stupně slovy a síla pilířů slovy.
- Příbuznost světů počítá **jen** `compare.ts`. Žádný další výpočet podobnosti nezakládat; karta (`SimilarWorlds` záloha) i mapa (spis světa) berou `kinshipRanking`. Mapa souřadnic ukazuje jen polohu na dvou osách, procenta nepočítá. Výjimka: „Nejblíž tvému ladění“ na mapě a kompas „Který svět je tvůj?“ / „Tvůj otisk světa“ (`imprint.ts`) řadí podle vzdálenosti pěti os, protože čtenář zadává jen osy; neukazují procenta ani slovo příbuznost (kompas: Nejblíž tvému ladění · Hned za ním · Tvůj protinožec).
- Nepřidávej vysvětlující věty a doslovné štítky tam, kde stačí barva, osa nebo pozice.
- Filtry a vyhledávání katalogu nesahají na srovnávač a naopak.
- Po každé úpravě: `npm run build`. UI změna: ověř v prohlížeči (ne jen screenshot).

---

## 6. Jak pracujeme

- Vše se řeší v konverzaci s Claudem v aplikaci Claude: návrh, diskuse, implementace. Claude pracuje v cloudu nad tímto repozitářem, ověří změnu (`npm test`, `npm run build`, kontrola v prohlížeči) a **sám commitne a pushne do `main`**. Push spustí nasazení na GitHub Pages.
- Majitel si změny stahuje do Cursoru přes Pull, jen když potřebuje. Patche a prompty pro Cursor se už neposílají.
- Před každou prací stáhnout nejnovější `main`. Kdyby majitel mezitím pushnul z Cursoru, navázat na jeho commit, nikdy ho nepřepsat.
- Repozitář je na GitHubu `lucrecius04/Here-Be-Worlds` (staré jméno malými písmeny přesměrovává).
- Design (znak, ikony, karty) se zkouší na plátně Design v Claude; rozhodnutí o znaku a slepé uličky jsou v `docs/znacka.md`.
- Odborné prameny k esejím a stezkám: výtahy v `docs/prameny/` (rozcestník `README.md`). Novou knihu od majitele přečíst, sepsat výtah podle vzoru, zapsat do rozcestníku a teprve pak použít v textu.
- Plán postupného odkrývání světů (počet na startu, rytmus, technika) je v `docs/odkryvani.md`; otevřené otázky se rozhodnou ke konci.
