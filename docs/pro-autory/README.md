# Příručka pro autory esejí ke stezkám

Tahle příručka je pro každého, kdo píše odborný text pro atlas Here Be Worlds: pro člověka i pro jiný jazykový model (Gemini, ChatGPT…). Popisuje, co atlas je, jak se píše esej ke stezce, podle jakých pravidel a co odevzdat. Hotový text pak projde kontrolou faktů a teprve potom se publikuje.

Vzorem je esej **Na mrtvole boha** (`content/trails/na-mrtvole-boha.md`, na webu `/stezky/na-mrtvole-boha/`). Kdo píše novou esej, má ji přečíst celou dřív, než začne.

## 1. Co je Here Be Worlds

Kurátorský český atlas fiktivních herních světů. Není to herní magazín: žádné recenze, hodnocení ani novinky. Atlas čte herní světy tak, jak literární věda čte romány. Ptá se, co je drží pohromadě, proč některé žijí desítky let a jiné zůstanou kulisou.

Každý svět má v atlasu:

- **kroniku** (`content/chronicles/<id>.md`): souvislé převyprávění světa v kapitolách, Faktografii (časová osa, frakce, místa) a Anatomii vyprávění. Kronika je pro eseje **jediný zdroj faktů o světě**.
- **kartu světa** (`data/worlds.json`): jádro světa (jedna věta), archetyp a podžánr, témata, triádu (Prvotní hřích, Ústřední dilema, Hlavní tajemství) a **pět souřadnic** na stupnici 1–5:
  - Vyhlídka: Naděje (1) ↔ Zoufalství (5)
  - Poznatelnost: Poznání (1) ↔ Záhada (5)
  - Měřítko: Intimita (1) ↔ Epičnost (5)
  - Morálka: Morálně jednoznačné (1) ↔ Morálně komplexní (5)
  - Realita: Realismus (1) ↔ Metafyzično (5)

Metodu atlasu popisuje esej **Anatomie herního lore** (`content/essays/anatomie-herniho-lore.md`): čtyři roviny čtení, sedm pilířů, ústřední otázka, prvotní hřích, architektura pravdy, řízená mezera a další. Odborné zázemí shrnuje stránka **Teoretické zázemí** (`content/essays/teoreticke-zazemi.md`) a podrobné výtahy z knih jsou v `docs/prameny/`.

## 2. Co je stezka a esej ke stezce

Stezka je ručně sestavený výběr 4–7 světů, které spojuje jedno téma (seznam je v `src/lib/trails.ts`, názvy a popisy v `src/lib/i18n.ts`, klíč `trails`). Esej ke stezce je odborný, ale čtivý text o tom tématu, postavený na našich kronikách, na odborných pramenech a na datech atlasu.

Dobrá esej:

- **položí jednu otázku** a na konci na ni odpoví (Na mrtvole boha: „Co si svět počne se svým mrtvým bohem?“),
- ukáže, že téma je starší než hry (mýtus, literatura, filozofie), a pak, co s ním dělají hry jinak,
- projde všechny světy stezky, každý s tím, co je v něm jedinečné,
- z jednotlivostí složí **typologii nebo zákonitost** (tabulka, tři způsoby, dvě cesty),
- vysvětlí, proč téma sedí právě hrám (mechanika, opakování, hráč jako spoluviník…),
- **použije data atlasu**: souřadnice světů stezky jako argument, ne jako ozdobu,
- je fakticky přesná do posledního jména.

## 3. Postup

1. **Načíst balíček stezky** (viz oddíl 8). Obsahuje tuto příručku, vzorovou esej, Anatomii, Teoretické zázemí, výtahy z pramenů, karty a kroniky všech světů stezky.
2. **Najít otázku.** Projít popis stezky, triády a jádra světů a zformulovat jednu otázku, na kterou různé světy odpovídají různě. Otázka se dá napsat do jedné věty s otazníkem.
3. **Vypsat fakta.** Z kronik vypsat ke každému světu fakta, která se k otázce vztahují, s odkazem na místo v kronice (kapitola nebo oddíl Faktografie). Nic, co v kronice není, nepoužít. Pokud autor ví něco mimo kroniku a chce to použít, označí to `[OVĚŘIT: …]`.
4. **Vybrat prameny.** V `docs/prameny/README.md` najít řádek stezky v tabulce „Prameny podle stezek“ a přečíst příslušné výtahy. Prameny používat jen v rozsahu, v jakém jsou ve výtazích. Nevymýšlet citace, čísla stran ani tvrzení, která ve výtahu nejsou.
5. **Osnova.** Napsat osnovu podle oddílu 4 a teprve pak text.
6. **Psát** podle pravidel stylu (oddíl 5) a formátu (oddíl 6).
7. **Zkontrolovat sám sebe** podle kontrolního seznamu (oddíl 7).
8. **Odevzdat** podle oddílu 9.

## 4. Stavba eseje

Rozsah **3 000–4 000 slov, nikdy přes 4 500**. Hutně a kratší je lepší než dlouze a řídce: oddíl jednoho světa má zhruba 350–500 slov a nese jen to, co odpovídá na otázku eseje, ne převyprávění děje. Vzorem délky a hustoty je esej Kdo za to může? (4 200 slov po zkrácení). Kapitoly jsou nadpisy `##`, světy a pododdíly `###`.

1. **Úvodem.** Úvodní citát z naší kroniky (kurzívou, pod ním „(Kronika …)“). Pak obraz nebo myšlenka, která téma otevře, představení všech světů stezky v jednom odstavci (každý tučně, každý jednou větou), a otázka eseje tučně. Na konci rámeček „Upozornění“ o spoilerech.
2. **Kořeny tématu.** Odkud téma pochází: mýtus, náboženství, literatura, filozofie. Jeden až dva prameny, ne přehled všeho.
3. **Světy stezky.** Každý svět jako `###` s výstižným podtitulem („Xenoblade: krajina z mrtvoly“). U každého to, čím je v tématu jedinečný. Velké zvraty a konce schovat do spoilerového bloku.
4. **Typologie.** Co mají světy společného a čím se liší: dvě až čtyři cesty, tabulka (svět × způsob), propojení s pojmy Anatomie (prvotní hřích, řízená mezera, ústřední otázka) a s prameny.
5. **Proč to hry milují.** Co téma dělá právě v hrách: mechanika jako význam (Bogost, Juul), hráč jako spoluviník, opakování, prostor.
6. **Odpověď.** Návrat k otázce. Použít souřadnice světů: kde se světy shodují, kde se rozcházejí, a vysvětlit proč. Poslední odstavec má být silný a krátký.
7. **Zdroje.** Seskupené: kroniky atlasu, mýtus a dějiny náboženství, filozofie, teorie světů a her, eseje atlasu.

## 5. Styl

Esej je autorský text atlasu. Píše se v **první osobě množného čísla** („ukážeme“, „vidíme“) a čtenáři se **vyká** („najdete“, „všimněte si“). Web jinde čtenáři tyká, ale eseje a stránka O atlasu jsou výjimka.

- **Jasně a konkrétně.** Krátké odstavce, jedna myšlenka v odstavci. Místo abstraktního tvrzení konkrétní obraz ze světa. Místo „hra pracuje s motivem viny“ napsat, kdo co udělal.
- **Bez vaty a nadsázky.** Žádné „fascinující“, „epický“, „ikonický“, „v neposlední řadě“, „je třeba zmínit“. Žádné řečnické otázky za sebou. Přídavná jména šetřit.
- **Bez anglicismů.** České termíny, anglický originál nanejvýš v závorce při prvním výskytu: podivné (*weird*), řídnutí (*thinning*).
- **Odborník představený při prvním výskytu:** obor, jméno, kniha kurzívou a rok („Religionista Mircea Eliade v knize *Mýtus o věčném návratu* (1949) …“). Dál jen příjmení.
- **Citace z cizích textů krátce a zřídka**, nejvýš pár slov v uvozovkách, jinak vlastními slovy. Z našich kronik se citovat smí (úvodní citát).
- **Výhrady k autorům:** Girard je redukcionista (používat jako nástroj vedle jiných pramenů), Eliade zobecňuje a jeho závěr je teologický (uvádět jako jeho stanovisko), Mendlesohn sama varuje, že kategorie nejsou pravidla. Pokud esej o některého z nich stojí, výhradu jednou zmínit.
- **Názvy světů** jako v atlasu: Zaklínač (ne The Witcher), Elder Scrolls, Warhammer 40 000, Disco Elysium. V textu tučně jen při představení v úvodu.
- **Pojmy atlasu přesně:** souřadnice (nikdy „osy“), Vyhlídka, Poznatelnost, Měřítko, Morálka, Realita, archetyp (ne kapitola ani oblast), Prvotní hřích, Ústřední dilema, Hlavní tajemství, jádro světa, kronika. Procenta příbuznosti se nikdy neuvádějí.
- **Česká typografie:** uvozovky „takto“, pomlčka s mezerami – takto, čísla s mezerou 40 000, letopočty bez mezery, tři tečky jako jeden znak …, názvy děl kurzívou.
- **Spoilery:** menší zmínky v textu jsou v pořádku, velké zvraty a konce do spoilerového bloku.

## 6. Formát souboru

Soubor `content/trails/<slug>.md`. Slug je český název bez diakritiky s pomlčkami (`na-mrtvole-boha`).

```markdown
---
title: Název eseje
trail: <id stezky z trails.ts, např. scapegoat>
kicker: Stezka atlasu
tagline: Otázka eseje?
description: Dvě věty pro vyhledávače a sdílení, se jmény světů.
---

## Úvodem

*„Citát z kroniky.“*
*(Kronika Název)*

Text…

> **Upozornění**
>
> Esej pracuje se zvraty a konci…

## Kapitola

### Svět: podtitul

> **Spoiler · Krátký název zvratu**
>
> Text, který se rozklikne.

> **Na kartě světa**
>
> Rámeček s poznámkou (první tučný text je štítek).

| Svět | Sloupec | Sloupec |
|---|---|---|
| … | … | … |

Odkaz na svět: [Bloodborne](/worlds/bloodborne/)
Odkaz do Anatomie: [prvotní hřích](/anatomie-herniho-lore/#prvotni-hrich)

## Zdroje

**Kroniky atlasu**

- [Kronika Bloodborne](/worlds/bloodborne/?view=chronicle)

**Teorie světů a her**

- Autor: *Název* (originál, rok), nakladatel rok; česky … rok.
```

Kapitoly se číslují samy (kromě Úvodem a Zdroje). Obsah vlevo a doba čtení se dopočítají.

## 7. Kontrolní seznam před odevzdáním

- [ ] Esej má jednu otázku a konec na ni odpovídá.
- [ ] Každý svět stezky má vlastní oddíl.
- [ ] Každé tvrzení o světě je v kronice. Co v ní není, je označené `[OVĚŘIT: …]`.
- [ ] Jména postav, míst a frakcí jsou zapsaná stejně jako v kronice.
- [ ] Hodnoty souřadnic odpovídají kartě světa.
- [ ] Prameny jsou použité jen v rozsahu výtahů a jsou ve Zdrojích.
- [ ] Žádné „osy“, žádná procenta, žádné anglické názvy světů, kde má atlas český.
- [ ] Velké zvraty jsou ve spoilerových blocích.
- [ ] Česká typografie (uvozovky, pomlčky, mezery v číslech).
- [ ] Délka nejvýš 4 500 slov; typologie a závěr neopakují, co zaznělo u světů.

### Časté chyby (z kontroly první eseje od Gemini)

Esej Kdo za to může? měla po kontrole 12 věcných oprav a musela se zkrátit z 5 700 na 4 200 slov. Nejčastější důvody:

- **Jména z karty místo z kroniky.** Když se karta světa a kronika liší, platí kronika. Jména postav, míst, frakcí a řádů opisovat přesně, i s velkými písmeny.
- **Domyšlené souvislosti.** Kdo co způsobil, proč to udělal, v jakém pořadí se to stalo: jen tak, jak to říká kronika. Co tam není, nepatří do textu, nebo dostane `[OVĚŘIT: …]`.
- **Výklad vydávaný za fakt hry.** Vlastní čtení atlasu označit („čteme to jako…“, „pro atlas je to…“).
- **Převyprávění děje a opakování.** Oddíl světa nemá shrnovat kroniku; závěr nemá znovu projít všechny světy.
- **Souřadnice od oka.** Hodnoty brát přesně z karty světa (1–5).

## 8. Balíček stezky

Aby autor nemusel hledat po repozitáři, skript složí všechno potřebné do jednoho souboru:

```bash
npm run bundle:trail -- scapegoat     # balíček jedné stezky
npm run bundle:trail -- --all          # balíčky všech stezek
npm run bundle:trail -- --base         # základní balíček (bez kronik) pro studium knih
```

Výstup je v `bundles/` (necommituje se). Balíček stezky obsahuje: tuto příručku, popis stezky a její světy, karty světů včetně souřadnic, vzorovou esej, Anatomii herního lore, Teoretické zázemí, rozcestník a všechny výtahy z pramenů a celé kroniky světů stezky. Základní balíček je totéž bez kronik a s výčtem všech stezek a světů.

Model, který dlouhé soubory při nahrání usekne (Gemini v aplikaci), dostane **rozsekaný balíček**:

```bash
npm run bundle:trail -- who-woke-up --split            # soubory do 30 000 znaků v bundles/<id>/
npm run bundle:trail -- who-woke-up --split --limit=20000
```

Vznikne `00-START-vloz-do-chatu.md` (zadání a postup, vloží se do chatu jako první zpráva) a číslované soubory 01–NN. Každý začíná řádkem „SOUBOR NN/MM“ a končí „KONEC SOUBORU NN/MM“, takže model pozná, že se soubor usekl. Z pramenů jsou v rozsekaném balíčku jen ty, které rozcestník doporučuje k dané stezce. Model odevzdává po krocích: nejdřív otázku, osnovu a fakta, po schválení celou esej najednou, nakonec seznam faktů a míst k ověření.

## 9. Co odevzdat

1. **Esej** jako markdown ve formátu z oddílu 6.
2. **Seznam faktů:** ke každému světu fakta použitá v eseji a místo v kronice, odkud pocházejí.
3. **Seznam míst k ověření:** všechno označené `[OVĚŘIT]` a všechno, kde si autor není jistý.
4. **Návrh úprav pramenů:** pokud autor použil pramen jinak, než je ve výtahu, nebo našel nový.

Esej pak projde kontrolou proti kronikám a majitel ji schválí. Teprve potom se na ni odkáže ze stezky.

## Po schválení

Esej se na webu ukáže až po schválení majitelem: do frontmatteru přibude `approved: true`. Do té doby je jen náhled na `/stezky/navrh/<slug>/` a stránka stezky ukazuje světy a prameny s poznámkou, že esej připravujeme. Soubor eseje se jmenuje podle české adresy stezky (`TRAIL_SLUGS` v `src/lib/trails.ts`), test to hlídá.
