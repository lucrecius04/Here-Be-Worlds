# Stav práce a otevřené věci

Předávka mezi konverzacemi s Claudem. Co je hotové a jak to funguje, popisuje `CLAUDE.md`. Tady je jen to, co z něj nevyčteš: rozpracované a odložené věci, nápady čekající na rozhodnutí a tipy k prostředí. Po větším kusu práce soubor aktualizovat, hotové položky mazat.

Naposledy aktualizováno: 2026-11-25.

## Co se dělalo naposledy (2026-11-21 až 25)

- **Jak světy vyprávějí** (2026-11-25, `/jak-svety-vypraveji/`): 160 nástrojů ze 43 kronik ve 23 způsobech a 7 rejstřících od slova ke hře; popis v CLAUDE.md. Zařazení nástrojů do způsobů je výklad atlasu (Claude), majitel ho může upravit v `data/meta/narrative-tools.json`. Filtr atlasu i karta světa berou od 2026-11-25 všech 23 způsobů z nástrojů kronik; ruční `narration` ve `worlds.json` zůstává jen v datech. Těžiště nahrazeno počtem „jen hra: x z y“ a skupinami (2026-11-25). Otevřené: anglické texty nástrojů (kroniky jsou jen česky).
- **Metodika vyprávění** (2026-11-25, konzultace): majitel vidí problém v závěrech z chybějících nástrojů (kroniky vybírají jen hlavní nástroje, absence nic neznamená) a chce pevnou metodiku z literatury. Návrh 0.1 je v `docs/metodika-vypraveni.md` (vrstvy, šest nosičů × tři režimy, Juulův test po nástrojích, Zákony světa mimo nástroje, Odkud to známe), výtahy z 12 nových textů v `docs/prameny/` a ze sborníku *Ludotopia* a z Jørgensenové *Gameworld Interfaces* (od majitele, 2026-11-25). **Stránka se zatím nemění**, Teoretické zázemí se doplní až s přestavbou. Majitel shání knihy (seznam v `docs/prameny/README.md`) a kategorie se mohou ještě změnit.
- **Tiskový styl kronik a esejí** (2026-11-25): `print.css` + přepnutí na světlý motiv při tisku v `BaseLayout`; popis v CLAUDE.md u Layoutu. Ověřeno tiskem do PDF (Dark Souls ve všech třech záložkách, Bohové jako břemeno, Anatomie herního lore, Teoretické zázemí) ze světlého i tmavého motivu. Tlačítko „Tisk / PDF“ na stránce zatím není (stačí Ctrl+P); kdyby ho majitel chtěl, patří do hlavičky eseje a k záložkám spisu.
- **Hádanka dne: zásobník 17 druhů** (2026-11-25, majitel chtěl „pool spousty hádanek, které se točí“): zhruba 960 hádanek skládaných při sestavení, každá jako statický JSON, prohlížeč stáhne jen dnešní. Popis v CLAUDE.md u titulní strany. Možná další kola: váhy druhů (teď stejné), anglická mota, hádanka „ze kterého putování je tento citát eseje“.
- **Úplnost her v Hlubině a Faktografii** (2026-11-25): doplněno 38 dílů ve 20 světech (14 událostí, které díly už byly jako katastrofa či předěl, dostalo název hry; 24 nových), do Faktografie řádky Halo Wars, Halo 3: ODST, Halo Wars 2, Siege of Dragonspear, Code: Veronica a Silent Hill f, Origins, Townfall, Homecoming, Downpour. Hranice = Rozsah kánonu kroniky; mimo něj zůstaly odbočky (seznam v CLAUDE.md u `deep-time.json`), majitel může rozsah rozšířit.
- **Hlubina času: období her se zářezy dílů** (2026-11-25, majitel vybral variantu F z náhledu A–G): oba grafy stejně, pozdější díly i nahoře, popisek dílu při najetí, v průřezu „Hry se odehrávají“; ke každé hře doplněn název (`game`), Mass Effect 3 opraven na hru, Edgerunners (anime) na událost. Návratový bod se souvislou hratelnou vrstvou: commit `d987791`.
- **O atlasu** má pás hlavičky a začíná stejně vysoko jako ostatní stránky (se souhlasem majitele 2026-11-22).
- **Mapa souřadnic přestavěná** podle návrhů C a A (majitel vybral C nahoru, A pod něj): Pět pásů s výběrem dvou světů a kartami vpravo, výraznější průměr, Zkřiž dvě souřadnice s Deseti mapami. Stará `AxisGridMap` (příbuznost, „Kde leží tvůj svět“, Atlas dvojic) je pryč. „Otevřít spis“ je všude „Prozkoumat svět“. Kolo drobností (2026-11-22): pevná místa Svět 1 / Svět 2, Zrušit vše, bez vět u souřadnic, bez jádra v kartách, bez textu u Deseti map, přihrádky místo vodítek, posouvání panelu, tmavé výběry, vybrané světy se archetypem neztlumí.
- **Stránka archetypu:** bohatší boxy světů (kronika, studio a vesmír, ústřední dilema, čtyři údaje, témata, odkazy na kroniku a putování).
- **Obsah kroniky:** přeskakování mělo dvě příčiny. (1) Obrázky bez rozměrů se po skoku dočítaly a odsouvaly text: teď mají `width`/`height` z doby sestavení. (2) Při rychlém klikání (do ~3 s) běželo dorovnávání předchozího skoku dál a táhlo stránku zpět: každý nový skok ho teď zruší (`cancelPendingJump` v `ChronicleReader`). Ověřeno klikáním po 200 ms na počítači i telefonu.
- **Putování dne:** linka mezi zastávkami je plná, 3 px, v barvách archetypů (i na telefonu).
- **Kde se putování kříží:** mřížka ukazuje všechny světy podle abecedy, i ty na jediném putování (dřív jen světy na 2+).
- **`docs/putovani-plan.md`** přepsaný na aktuální stav: 22 putování, tabulka pokrytí světů, další vlna zatím bez plánu.
- Všech 22 esejí putování je schválených a na webu.
- **Spis světa:** přestavěná karta (rejstřík Témata · Jak svět vypráví · Klíčoví aktéři), záložka Putování, Příbuzenstvo jen podle indexu. Posun celé stránky se staženým pruhem, na telefonu i počítači.
- **Kronika:** obálka „Příběh světa …“, sdílený obsah `ReadingToc` a okamžitý skok na kapitolu. Rozečtenost je skrytá.
- **Srovnání:** kompletně přestavěné v nočním atlasu.
- **Pás hlavičky stránky** (`.page-band`) na atlasu, putování, esejích, Vysvětlivkách, archetypu, srovnání a spisu. Tón pásu je o stupeň výraznější a stránky začínají stejně vysoko.
- **Titulní strana:**
  - Trasy oblohou se ukážou jen při najetí a trojice se mění při každém načtení.
  - Linky souhvězdí jsou nejkratší cestou.
  - Náhodný svět má zlatou hvězdu.
- **Hlavička:** bez odkazu Esej, motiv jedním tlačítkem. Lupa hledá v rejstříku i v plných textech kronik a esejí.

## Odložené (majitel řekl „později“ / „zatím ne“)

- **Přepočet indexu příbuznosti.** Pravidlo „ručně spojené dvojice aspoň Blízcí příbuzní“ je zrušené. Majitel chce index ještě někdy promyslet a překalibrovat.
- **Barva archetypu v hlavičce spisu.** Zkoušely se čtyři varianty: štítek názvu, tónované desky, plná barva, barevné pole. Majiteli nesedla žádná, „zatím to necháme“.
- **Karta pro sdílení konkrétního srovnání** je u ledu. Statický web ji neumí, stav srovnání je jen v `?w=`.
- **Rozečtenost kroniky** je skrytá (`SHOW_READING_PROGRESS = false`), uvidí se později.

## Čeká na rozhodnutí majitele

- **Metodika vyprávění:** otevřené otázky v `docs/metodika-vypraveni.md`, oddíl 10 (šest nosičů a jejich názvy, „z umění vyprávění / z hraní“, mřížka na stránce, Svět, který se mění, Zákony světa, Vypravěčský podpis světů). Čeká se i na knihy.
- **Nápady na rozšíření** (analýza 2026-11-24) jsou v `docs/napady-rozsireni.md` i s domluveným pořadím; první dva body (karty pro sdílení putování; Galerie triád a Mapa neznáma) hotové 2026-11-24.

- **Nápady, které padly a nikdo je nerozhodl:**
  - stáhnout hlavičku spisu na telefonu otočeném na šířku;
  - kratší popisek záložky „Anatomie vyprávění“ na telefonu;
  - malá mapa souřadnic vedle Příbuzenstva.
- **Kontaktní formulář** zatím nic neodesílá (`CONTACT_EMAIL` prázdné). Plán je Web3Forms nebo Formspree s klíčem majitele.
- **Obrázky k putováním:** jediné místo na webu s obrázky, styl se teprve bude ladit.
- **Postupné odkrývání světů:** viz `docs/odkryvani.md`.
- **Další putování a knihy:** další vlna zatím nemá plán. Kandidáti, pokrytí světů a knihy jsou v `docs/putovani-plan.md`.

## Známá omezení

- **Ohýbání češtiny v hledání** (2026-11-24, `src/lib/cz-stem.ts`) je jednoduché odřezávání koncovek: běžné pády najde, střídání uvnitř kmene kromě ů → o (otec – otce, pes – psa) ne. Kdyby něco chybělo, doplnit koncovku nebo střídání a test `cz-stem.test.ts`.
- **Obsah kroniky:** přeskakování po kliknutí způsobovaly líně načtené obrázky bez rozměrů a souboj dorovnávání při rychlém klikání (obojí opraveno 2026-11-22). Při testu klikat rychle za sebou, ne s pauzou: s pauzou se chyba neukáže. Kdyby se to vrátilo, zeptat se na svět, kapitolu a zařízení a zkontrolovat, jestli kronika nemá obrázek mimo PNG nebo mimo svou složku (hlídá test `chronicle-images.test.ts`).

## Tipy k prostředí (cloud)

- **Náhled:** `npm run build`, pak `npx astro preview --port 4321` na pozadí, adresa `http://localhost:4321/Here-Be-Worlds/`.
- **Kontrola v prohlížeči:** Playwright, skripty si psát do `/tmp`. V repozitáři Playwright není: nainstalovat ho do `/tmp/pw` (`npm i playwright`) a spouštět předinstalovaný Chromium přes `chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })`, protože stahování prohlížečů proxy nepustí (číslo verze ve složce se může lišit, `ls /opt/pw-browsers`). Živý web jde z cloudu otevřít jen přes cloudový prohlížeč, ne z příkazové řádky.
- **Karty pro sdílení:** Google Fonts v cloudu nejsou, postup s `HBW_OG_FONT_CSS` je v `CLAUDE.md`. Balíčky fontsource se instalují `npm i --no-save` a v nové relaci je potřeba je nainstalovat znovu.
- **Commit a push:** commit s podpisem podle aktuální relace, pak `git pull --rebase` a `git push origin main`. Push spustí nasazení na GitHub Pages (`gh run list -R lucrecius04/Here-Be-Worlds`).

## Náhled obrázků k putováním (2026-11-23, dočasné)

- Skryté stránky (noindex, z webu na ně nic nevede): `/putovani/navrh-obrazku/` (rejstřík se všemi zkušebními obrázky), `/putovani/navrh-obrazku/nocni/` (jen noční grafika) a `/putovani/navrh-obrazku/<slug>/` (stránka putování s obrázkem; panel vlevo dole přepíná obrázek, umístění pás / celá šířka / v textu a výšku pásu, šipky ← → listují).
- Obrázky: `public/navrh-obrazku/` (16 zkušebních, styly mezzotinta, rytina, šin-hanga, symbolismus/uhel, kyanotypie, noční rytina), seznam a přiřazení ke stezkám `src/lib/image-preview.ts`, ovládání `src/components/preview/ImagePreviewPanel.astro`.
- `TrailsIndex` má nepovinné `images` a `trailHref`, `EssayPage` nepovinné `hero`; živé stránky je nepoužívají.
- Okraj „freska“ (výchozí v náhledu, přepínač Okraj v panelu; 2026-11-23 v2: souměrná, jemný okraj, jen náznak odprýsknutí, protože kresby mají rozpitý okraj samy a původní maska posouvala obraz doprava): maska `public/navrh-obrazku/freska-maska.png` z `scripts/fresco-mask.py` (šum: zálivy, eroze, odprýsknutá omítka, vybledlá místa; průhlednost = maska), CSS `html.pv-fresco` v `essay.css`, ve světlém motivu `mix-blend-mode: multiply`. Jedna maska pro všechny obrázky, takže u některých může setřít důležitou část (u mrtvého boha tvář vlevo); ladí se v parametrech skriptu.
- Třetí kolo (2026-11-23): volná kresba podle majitelových skic z In Dubia (`src/skici` v repu IN-DUBIO), ale v naší paletě: A = indigová tuš na krémovém papíře, B = bílá křída na tmavomodrém papíře, jedno zlaté světlo, motivy jako detail nebo polocelek s „druhým čtením“ (katedrála ze žeber, klouby v poli, kamenné víčko); obrázky 17–22. Majitel: „jdeme správným směrem“, styl ještě vymazlit do nezaměnitelné podoby, pak vymýšlet motivy. Obrácení barev varianty A pro tmavý motiv nefunguje (otočí světlo a zlatá zmodrá). Výchozí výška pásu v náhledu 16 : 9 (21 : 9 ořízne kresbu i zlaté světlo), ve světlém motivu `multiply` vždy.
- Dva obrázky na esej (majitel 2026-11-23, eseje jsou dlouhé): první pod úvodní citát, druhý uprostřed před nadpisem ## nejblíž polovině textu (`hero2` v `EssayPage`, `SECOND` v `image-preview.ts`; zatím jen Bohové jako břemeno: katedrála nahoře a v rejstříku, víčko uprostřed). Výchozí umístění v náhledu je teď Pod citát.
- Umístění: majitel zatím preferuje **pod úvodní citát** (`html.pv-quote`, `essay-hero--quote`; na telefonu přes celou šířku, na počítači přesah do volného místa vpravo, max 52rem). V tmavém motivu má kresba na papíře masku podle tuše (`scripts/ink-masks.py` → `public/navrh-obrazku/maska/`, nepravidelná skvrna místo oválu), ve světlém `multiply` a jemná obecná maska.
- **Styl nalezený (2026-11-23, páté kolo):** pravidla a prompt v `docs/obrazky-putovani.md`, vzor `public/navrh-obrazku/25-styl-vicko.jpg`. Další krok: vymyslet motivy pro 22 putování (z otázky a jádra každé eseje).
- Čtvrté kolo (2026-11-23): **monotypie s kresbou** (tmavá monotypie tuší na krémovém papíře jako Degasovy monotypie, měkká mlha otisknutá a setřená, pár jistých tahů uhlem a tuší, indigo a noční modř, jedno zlaté světlo, okraj se rozpíjí do papíru, bez rámečku). Obrázky 23 (dům) a 24 (katedrála ze žeber, zatím nejlepší). Styl drží i u jiného motivu. K doladění: linka lámanější a různě silná (ne tabletové pero), mlha otisknutá se šmouhami místo spreje. Zvažovaná pomůcka pro jednotnou řadu: přikládat vybraný obrázek jako stylovou referenci.
- Favorit po dvou kolech (před kresbou): noční grafika (mezzotinta + noční rytina, jedno zlaté světlo, malý poutník). Až majitel vybere, náhledové stránky a zkušební obrázky smazat a obrázky dát natrvalo ke stezkám.
