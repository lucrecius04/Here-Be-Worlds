# Stav práce a otevřené věci

Předávka mezi konverzacemi s Claudem. Co je hotové a jak to funguje, popisuje `CLAUDE.md`. Tady je jen to, co z něj nevyčteš: rozpracované a odložené věci, nápady čekající na rozhodnutí a tipy k prostředí. Po větším kusu práce soubor aktualizovat, hotové položky mazat.

Naposledy aktualizováno: 2026-11-22.

## Co se dělalo naposledy (2026-11-21 až 22)

- **O atlasu** má pás hlavičky a začíná stejně vysoko jako ostatní stránky (se souhlasem majitele 2026-11-22).
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

- **Nápady, které padly a nikdo je nerozhodl:**
  - stáhnout hlavičku spisu na telefonu otočeném na šířku;
  - kratší popisek záložky „Anatomie vyprávění“ na telefonu;
  - malá mapa souřadnic vedle Příbuzenstva.
- **Kontaktní formulář** zatím nic neodesílá (`CONTACT_EMAIL` prázdné). Plán je Web3Forms nebo Formspree s klíčem majitele.
- **Obrázky k putováním:** jediné místo na webu s obrázky, styl se teprve bude ladit.
- **Postupné odkrývání světů:** viz `docs/odkryvani.md`.
- **Další putování a knihy:** další vlna zatím nemá plán. Kandidáti, pokrytí světů a knihy jsou v `docs/putovani-plan.md`.

## Známá omezení

- **Hledání v textech** neohýbá češtinu: „bůh“ nenajde „boha“. Funguje začátek slova („boh“). Kdyby to vadilo, další krok je jednoduché odřezávání koncovek.
- **Obsah kroniky:** přeskakování po kliknutí způsobovaly líně načtené obrázky bez rozměrů a souboj dorovnávání při rychlém klikání (obojí opraveno 2026-11-22). Při testu klikat rychle za sebou, ne s pauzou: s pauzou se chyba neukáže. Kdyby se to vrátilo, zeptat se na svět, kapitolu a zařízení a zkontrolovat, jestli kronika nemá obrázek mimo PNG nebo mimo svou složku (hlídá test `chronicle-images.test.ts`).

## Tipy k prostředí (cloud)

- **Náhled:** `npm run build`, pak `npx astro preview --port 4321` na pozadí, adresa `http://localhost:4321/Here-Be-Worlds/`.
- **Kontrola v prohlížeči:** Playwright, skripty si psát do `/tmp`. V repozitáři Playwright není: nainstalovat ho do `/tmp/pw` (`npm i playwright`) a spouštět předinstalovaný Chromium přes `chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' })`, protože stahování prohlížečů proxy nepustí (číslo verze ve složce se může lišit, `ls /opt/pw-browsers`). Živý web jde z cloudu otevřít jen přes cloudový prohlížeč, ne z příkazové řádky.
- **Karty pro sdílení:** Google Fonts v cloudu nejsou, postup s `HBW_OG_FONT_CSS` je v `CLAUDE.md`. Balíčky fontsource se instalují `npm i --no-save` a v nové relaci je potřeba je nainstalovat znovu.
- **Commit a push:** commit s podpisem podle aktuální relace, pak `git pull --rebase` a `git push origin main`. Push spustí nasazení na GitHub Pages (`gh run list -R lucrecius04/Here-Be-Worlds`).
