# Nápady na rozšíření atlasu

Analýza z 2026-11-24 (Claude na žádost majitele): co by na webu mohlo přibýt, aby měl čtenář víc možností světy zkoumat a důvod se vracet. Body se budou zkoušet postupně; u hotových připsat datum a odkaz, zamítnuté přesunout dolů s důvodem.

**Hlavní zjištění:** kroniky mají jednotnou stavbu (časová osa, frakce, artefakty, rejstřík postav, slovníček pojmů; v Rozboru vyprávění nosná mezera, výklady a nástroje vyprávění), světy mají triádu, pole `narration` a pět souřadnic. Dnes se to čte jen svět po světu. Největší rezerva: ukázat stejný druh věci **napříč světy**.

## Pořadí, na kterém jsme se domluvili (2026-11-24)

1. **Karty pro sdílení s obrázky putování.** Hotovo 2026-11-24: `public/og/putovani/<slug>.jpg` a `public/og/putovani.jpg`.
2. **Mapa neznáma a Galerie triád.**
3. **Stránky témat.**
4. **Hlubina času.**
5. **Tvoje obloha + RSS.**

## 1. Nové způsoby zkoumání (data existují)

- **Hlubina času.** Všechny světy na jedné logaritmické časové ose: linka od nejstarší události časové osy po přítomnost hry, značky katastrof a zlomů věků (cyklický rytmus zániku). Podklady: Časové osy v Přílohách kronik, `metadata.historicalDepth`. Střední práce (časové osy převést na jednotný formát).
- **Mapa neznáma.** Velká nezodpovězená tajemství všech světů (Rozbor vyprávění, oddíl 4 Nosná mezera, a `triad.ultimateMystery`): věta, odkaz do kroniky na „Jak se to vykládá“, štítek typu tajemství (původ světa, povaha boha, co po konci…). Navazuje na terra incognita z mapy souřadnic. Malá práce.
- **Galerie triád.** Všechny prvotní hříchy vedle sebe, pak dilemata a tajemství, ručně seskupené do typů (pýcha tvůrců, útěk před smrtí, zrada, nevědomost, obchod s mocí…). Malá až střední práce.
- **Stránky témat.** 20 témat jako stránky po vzoru archetypu: světy, putování, průměr a rozpětí souřadnic, sousední témata. Malá práce, pomůže i vyhledávačům.
- **Cesta mezi dvěma světy.** Nejkratší řetěz přes nejbližší příbuzné (index jen z `compare.ts`, bez procent), u každého kroku co mají světy společného. Hravé, sdílitelné. Malá práce.
- **Jak světy vyprávějí.** Mřížka světy × způsoby vyprávění (prostředí, deníky a nahrávky, nespolehlivý vypravěč, smyčka, fragmenty) z `narration` a z Hlavních nástrojů vyprávění. Vrstva specifická pro hry. Střední práce (sjednotit pojmenování).

## 2. Důvody se vracet

- **Tvoje obloha.** Hvězdy světů s přečtenou kronikou na titulní obloze svítí, ostatní tlumeně; prošlá putování jako trasa. Žádné body ani odznaky. Data jen v prohlížeči (jako `hbw_reader_desk`). Střední práce.
- **RSS** nových světů a putování (statický soubor při sestavení), k plánovanému postupnému odkrývání (`docs/odkryvani.md`). Později zpravodaj přes stejnou službu jako kontaktní formulář. Malá práce.
- **Dvojportrét.** Kratší pravidelný formát: dva světy, jedna otázka, ~1 500 slov, jednou za dva týdny (např. Gwyn a Andrew Ryan: kdo ze dvou zakladatelů nese větší vinu). Průběžné psaní.
- **Varianty hádanky.** Podle citátu z kroniky, prvotního hříchu nebo profilu souřadnic; bez sérií a skóre (herní jazyk). Malá práce.

## 3. Teoretická vrstva

- **Pojmy v praxi.** Stránka ke každému pojmu z esejí (řídnutí, polder, řízená mezera, hrůza z dějin, tísnivé a podivné): výklad, příklady ze světů, eseje, kniha. Spojí Teoretické zázemí s putováními. Střední práce.
- **Typologie.** Mřížky nad rámec archetypů (typy bohů, konců světa, nesmrtelnosti), do mřížek jen věci ověřené proti kronikám. Velká práce.

## 4. Design a dosah

- **Karty pro sdílení s obrázky putování.** Kresba, název, otázka eseje. Malá práce, generátor existuje.
- **Atlas jako skutečná mapa.** Světy jako ostrovy, archetypy kraje, putování námořní trasy, bílá místa „here be dragons“; poloha z pěti souřadnic promítnutých do roviny (poctivá poznámka o zkreslení). Velká práce, signaturní kus.
- **Drobnosti:** ohýbání češtiny v hledání (známé omezení v `docs/stav.md`), tiskový styl kronik a esejí, anglické verze esejí (největší dosah, nejvíc práce).

## Výhrada k datové analýze

Trendy (např. jestli herní světy po desetiletích tmavnou) jsou na 43 světech spíš anekdota než zjištění. Počkat na větší atlas, nebo uvádět s jasnou výhradou.
